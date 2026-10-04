import fs from 'fs';
import https from 'https';
import http from 'http';
import { URL } from 'url';

/**
 * SCRAPPER Y AUDITOR DE EMAILS CON VERIFICACIÓN EMAILABLE Y SUSTITUCIÓN WEB
 * 
 * Flujo de ejecución:
 * 1. Comprueba el email actual con Emailable API.
 * 2. Si la respuesta es negativa (undeliverable / inválido / nol):
 *    - Se conecta a la web de la empresa (home, /contacto, /aviso-legal, /politica-de-privacidad).
 *    - Busca correos sustitutos aplicando la jerarquía de prioridad:
 *        1º Compras: compras, proveedores, purchasing, procurement, facturacion
 *        2º Contacto: contacto, info, administracion, secretaria, hola
 *        3º Respaldo: primer email corporativo válido con sintaxis RFC
 *    - Si encuentra candidatos, verifica los sustitutos con Emailable hasta hallar uno válido.
 *    - Si lo encuentra, sustituye el email de la empresa.
 * 3. Si no localiza ningún sustituto válido:
 *    - Marca la empresa como no verificada (emailVerified: false).
 *    - Se mostrará automáticamente en ROJO en el CRM.
 */

const API_KEY = process.env.EMAILABLE_API_KEY || 'live_108b9c493b9a8eb668bf';
const EMAIL_SYNTAX_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const EMAIL_SCRAPE_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi;

const PURCHASING_KEYWORDS = ['compras', 'proveedores', 'purchasing', 'procurement', 'facturacion'];
const CONTACT_KEYWORDS = ['contacto', 'info', 'administracion', 'secretaria', 'hola'];
const IGNORE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.pdf', '.css', '.js'];
const IGNORE_EMAILS = ['ejemplo@', 'example@', 'usuario@', 'test@', 'sentry@', 'wixpress.com', 'wordpress.org', 'domain.com'];

/**
 * Comprueba un email mediante la API de Emailable
 * @param {string} email
 * @returns {Promise<{state: string, reason: string, score: number}>}
 */
function verifyWithEmailable(email) {
  return new Promise((resolve) => {
    if (!email || !EMAIL_SYNTAX_REGEX.test(email)) {
      return resolve({ state: 'undeliverable', reason: 'invalid_syntax', score: 0 });
    }

    const url = `https://api.emailable.com/v1/verify?email=${encodeURIComponent(email)}&api_key=${API_KEY}`;
    https.get(url, { timeout: 8000 }, (res) => {
      let body = '';
      res.on('data', chunk => { body += chunk; });
      res.on('end', () => {
        try {
          const data = JSON.parse(body);
          resolve({
            state: data.state || 'undeliverable',
            reason: data.reason || '',
            score: data.score || 0
          });
        } catch {
          resolve({ state: 'unknown', reason: 'parse_error', score: 0 });
        }
      });
    }).on('error', () => {
      resolve({ state: 'unknown', reason: 'network_error', score: 0 });
    }).on('timeout', () => {
      resolve({ state: 'unknown', reason: 'timeout', score: 0 });
    });
  });
}

/**
 * Descarga el HTML de una URL con manejo de redirecciones
 */
function fetchPage(targetUrl, timeoutMs = 6000, maxRedirects = 2) {
  return new Promise((resolve) => {
    if (!targetUrl || targetUrl === 'No disponible') return resolve(null);
    let fullUrl = targetUrl.trim();
    if (!fullUrl.startsWith('http://') && !fullUrl.startsWith('https://')) {
      fullUrl = 'https://' + fullUrl;
    }

    try {
      const parsed = new URL(fullUrl);
      const client = parsed.protocol === 'https:' ? https : http;

      const req = client.get(fullUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        },
        timeout: timeoutMs
      }, (res) => {
        if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location && maxRedirects > 0) {
          let redirectUrl = res.headers.location;
          if (redirectUrl.startsWith('/')) {
            redirectUrl = parsed.origin + redirectUrl;
          }
          return resolve(fetchPage(redirectUrl, timeoutMs, maxRedirects - 1));
        }

        if (res.statusCode !== 200) {
          res.resume();
          return resolve(null);
        }

        let body = '';
        res.setEncoding('utf-8');
        res.on('data', chunk => {
          body += chunk;
          if (body.length > 1000000) {
            req.destroy();
            resolve(body);
          }
        });
        res.on('end', () => resolve(body));
      });

      req.on('error', () => resolve(null));
      req.on('timeout', () => { req.destroy(); resolve(null); });
    } catch {
      resolve(null);
    }
  });
}

/**
 * Extrae y valida sintácticamente emails encontrados en el HTML
 */
function extractCandidateEmails(html) {
  if (!html) return [];
  const matches = html.match(EMAIL_SCRAPE_REGEX) || [];
  const validSet = new Set();

  for (let match of matches) {
    let clean = match.toLowerCase().trim();
    clean = clean.replace(/^[.,;:\s]+|[.,;:\s]+$/g, '');

    if (!EMAIL_SYNTAX_REGEX.test(clean)) continue;
    if (IGNORE_EXTENSIONS.some(ext => clean.endsWith(ext))) continue;
    if (IGNORE_EMAILS.some(ign => clean.includes(ign))) continue;

    validSet.add(clean);
  }

  return Array.from(validSet);
}

/**
 * Clasifica y ordena los candidatos según jerarquía de prioridad
 */
function prioritizeEmails(emails) {
  const compras = [];
  const contacto = [];
  const respaldo = [];

  for (const email of emails) {
    const user = email.split('@')[0].toLowerCase();
    if (PURCHASING_KEYWORDS.some(k => user.includes(k))) {
      compras.push({ email, type: 'compras' });
    } else if (CONTACT_KEYWORDS.some(k => user.includes(k))) {
      contacto.push({ email, type: 'contacto' });
    } else {
      respaldo.push({ email, type: 'respaldo' });
    }
  }

  return [...compras, ...contacto, ...respaldo];
}

/**
 * Rastrea la web corporativa en busca de correos sustitutos
 */
async function scrapeSubstitutesFromWeb(companyWeb) {
  if (!companyWeb || companyWeb === 'No disponible') return [];

  const found = new Set();

  // 1. Home
  const homeHtml = await fetchPage(companyWeb, 5000);
  extractCandidateEmails(homeHtml).forEach(e => found.add(e));

  // 2. Subpáginas de contacto / aviso legal / privacidad
  try {
    const origin = new URL(companyWeb.startsWith('http') ? companyWeb : `https://${companyWeb}`).origin;
    const paths = ['/contacto', '/aviso-legal', '/politica-de-privacidad', '/es/contacto'];
    for (const p of paths) {
      if (found.size >= 5) break;
      const subHtml = await fetchPage(`${origin}${p}`, 4000);
      extractCandidateEmails(subHtml).forEach(e => found.add(e));
    }
  } catch {}

  return prioritizeEmails(Array.from(found));
}

/**
 * Procesa un lote de empresas auditando con Emailable y scrapeando sustitutos
 * @param {number} maxToAudit - Límite de empresas a auditar con Emailable (respetando los créditos disponibles)
 */
export async function runEmailableAuditor(maxToAudit = 50) {
  const filePath = 'src/data/prospects.json';
  const rawData = fs.readFileSync(filePath, 'utf-8');
  const prospects = JSON.parse(rawData);

  console.log(`================================================================`);
  console.log(`AUDITORIA Y REEMPLAZO CON EMAILABLE Y SCRAPER WEB`);
  console.log(`Empresas a auditar: ${maxToAudit} de ${prospects.length}`);
  console.log(`================================================================`);

  let countDeliverable = 0;
  let countRisky = 0;
  let countNegative = 0;
  let countSubstituted = 0;
  let countMarkedRed = 0;

  for (let i = 0; i < Math.min(maxToAudit, prospects.length); i++) {
    const p = prospects[i];
    const currentEmail = (p.email || '').trim().toLowerCase();

    console.log(`[${i + 1}/${maxToAudit}] Auditando: ${p.name} | ${currentEmail}`);
    
    // Paso 1: Comprobar con Emailable
    const check = await verifyWithEmailable(currentEmail);
    console.log(`    ↳ Emailable Estado: ${check.state} (Motivo: ${check.reason || 'ok'}, Score: ${check.score})`);

    const isNegative = check.state === 'undeliverable' || check.reason === 'rejected_email' || check.reason === 'invalid_email';

    if (!isNegative) {
      // Es deliverable o risky aceptable
      if (check.state === 'deliverable') {
        countDeliverable++;
        p.emailVerified = true;
        p.emailableStatus = 'deliverable';
      } else {
        countRisky++;
        p.emailVerified = true;
        p.emailableStatus = check.state;
      }
    } else {
      // RESPUESTA NEGATIVA -> Conectar a la web a buscar sustituto
      countNegative++;
      console.log(`    ⚠️ Respuesta NEGATIVA. Conectando a web: ${p.web} para buscar sustituto...`);

      const candidates = await scrapeSubstitutesFromWeb(p.web);
      console.log(`    ↳ Encontrados ${candidates.length} candidatos en la web.`);

      let foundValidSubstitute = false;

      for (const cand of candidates) {
        // Descartar el mismo que ya falló
        if (cand.email.toLowerCase() === currentEmail) continue;

        console.log(`    ↳ Probando sustituto candidato: ${cand.email} (${cand.type})...`);
        const candCheck = await verifyWithEmailable(cand.email);
        
        if (candCheck.state === 'deliverable' || (candCheck.state === 'risky' && candCheck.score >= 50)) {
          console.log(`    ✅ ¡Sustituto VÁLIDO encontrado!: ${cand.email} (${candCheck.state})`);
          p.email = cand.email;
          p.emailVerified = true;
          p.emailVerifiedType = cand.type;
          p.emailableStatus = candCheck.state;
          countSubstituted++;
          foundValidSubstitute = true;
          break;
        }
      }

      if (!foundValidSubstitute) {
        console.log(`    ❌ No se encontró sustituto válido en la web -> MARCADO EN ROJO EN CRM`);
        p.emailVerified = false;
        p.emailableStatus = 'undeliverable';
        countMarkedRed++;
      }
    }
  }

  // Guardar datos actualizados en prospects.json
  fs.writeFileSync(filePath, JSON.stringify(prospects, null, 2), 'utf-8');

  console.log(`\n================== RESUMEN DE EJECUCIÓN ==================`);
  console.log(`Total empresas auditadas: ${Math.min(maxToAudit, prospects.length)}`);
  console.log(`Emails verificados positivos (deliverable): ${countDeliverable}`);
  console.log(`Emails corporativos válidos/risky: ${countRisky}`);
  console.log(`Emails con respuesta negativa inicial: ${countNegative}`);
  console.log(`Sustitutos encontrados y actualizados vía web: ${countSubstituted}`);
  console.log(`Empresas sin sustituto (marcadas en ROJO): ${countMarkedRed}`);
  console.log(`==========================================================\n`);
}

// Ejecutar si se llama directamente
if (process.argv[1].endsWith('run_emailable_audit_and_scrape.js')) {
  const limit = parseInt(process.argv[2], 10) || 30;
  runEmailableAuditor(limit).catch(console.error);
}
