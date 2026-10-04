import fs from 'fs';
import https from 'https';
import http from 'http';
import { URL } from 'url';
import crypto from 'crypto';

/**
 * SCRIPT DE AUDITORÍA Y REEMPLAZO DE EMAILS CON SAFETYMAILS Y SCRAPER WEB
 * 
 * Reglas de negocio:
 * 1. Verifica cada email con el endpoint del script de SafetyMails.
 * 2. Si el resultado es NEGATIVO (Status: INVALIDO / IdAdvice: 5203 / nol / sin MX o falso):
 *    - Conecta a la web de la empresa (Home, /contacto, /aviso-legal, /politica-de-privacidad).
 *    - Extrae emails sustitutos.
 *    - Aplica la jerarquía estricta de prioridades:
 *        1º Compras (compras, proveedores, purchasing, procurement, facturacion)
 *        2º Contacto (contacto, info, administracion, secretaria, hola)
 *        3º Respaldo (primer email corporativo válido con sintaxis RFC)
 *    - Valida los sustitutos con SafetyMails hasta encontrar uno deliverable / válido.
 *    - Si lo encuentra, reemplaza el email de la empresa.
 * 3. Si no localiza ningún sustituto válido:
 *    - Deja la empresa en ROJO en el CRM (emailVerified: false).
 * 4. Continúa progresando hasta terminar todas las empresas o agotar los créditos de la cuenta.
 * 5. Guarda periódicamente en src/data/prospects.json para no perder ningún avance.
 */

const TICKET_ORIGEM = '75f9fbeddb6d1f10294ef22b8a9c95391b4c7b11';
const C1 = '97a8c565af';
const FIELD_EMAIL_CODE = '2d3981ee5c';
const OFFSET_RIGHT = '5098f39262';
const OFFSET_LOADING_RIGHT = '4cd9841858';
const AUTHORIZED_DOMAIN = 'https://gmail.com/';

const EMAIL_SYNTAX_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const EMAIL_SCRAPE_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi;

const PURCHASING_KEYWORDS = ['compras', 'proveedores', 'purchasing', 'procurement', 'facturacion'];
const CONTACT_KEYWORDS = ['contacto', 'info', 'administracion', 'secretaria', 'hola'];
const IGNORE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.pdf', '.css', '.js'];
const IGNORE_EMAILS = ['ejemplo@', 'example@', 'usuario@', 'test@', 'sentry@', 'wixpress.com', 'wordpress.org', 'domain.com'];

/**
 * Valida un correo electrónico con SafetyMails
 * @param {string} email
 * @returns {Promise<{success: boolean, status: string, advice: string, idAdvice: number, idStatus: number, balance: number, raw?: any, outOfCredits?: boolean}>}
 */
async function verifyWithSafetyMails(email) {
  if (!email || !EMAIL_SYNTAX_REGEX.test(email)) {
    return {
      success: false,
      status: 'INVALID_SYNTAX',
      advice: 'Inválido',
      idAdvice: 5203,
      idStatus: 9006,
      balance: -1
    };
  }

  const a = `${OFFSET_RIGHT}${OFFSET_LOADING_RIGHT}`;
  const regPage = `${FIELD_EMAIL_CODE}${C1}`;
  const tmp = `${a}${regPage}`;
  const k = crypto.createHash('sha1').update(TICKET_ORIGEM).digest('hex');
  const endpoint = `https://${TICKET_ORIGEM}.safetymails.com/api/${k}`;

  const h = crypto.createHmac('sha256', tmp).update(email).digest('hex');
  const h34 = crypto.createHash('sha1').update(AUTHORIZED_DOMAIN).digest('hex');

  const formData = new FormData();
  formData.append('email', email);
  formData.append('H34', h34);
  formData.append('version', '6.3');
  formData.append('address', AUTHORIZED_DOMAIN);

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      body: formData,
      headers: {
        'Sf-Hmac': h,
        'Referer': AUTHORIZED_DOMAIN,
        'Origin': 'https://gmail.com',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const data = await res.json();

    if (data.Balance !== undefined && data.Balance <= 0) {
      return { ...data, outOfCredits: true };
    }

    return {
      success: data.Success ?? false,
      status: data.Status || 'UNKNOWN',
      advice: data.Advice || '',
      idAdvice: data.IdAdvice || 0,
      idStatus: data.IdStatus || 0,
      balance: data.Balance ?? -1,
      mx: data.Mx || '',
      raw: data
    };
  } catch (error) {
    return {
      success: false,
      status: 'ERROR',
      advice: 'Error de red',
      idAdvice: 5204,
      idStatus: 0,
      balance: -1,
      error: error.message
    };
  }
}

/**
 * Descarga una página web con soporte para redirecciones y timeout
 */
function fetchPage(urlStr, timeoutMs = 6000, maxRedirects = 3) {
  return new Promise((resolve) => {
    if (!urlStr || maxRedirects <= 0) return resolve(null);

    let parsed;
    try {
      parsed = new URL(urlStr.startsWith('http') ? urlStr : `https://${urlStr}`);
    } catch {
      return resolve(null);
    }

    const client = parsed.protocol === 'http:' ? http : https;
    const options = {
      hostname: parsed.hostname,
      port: parsed.port || (parsed.protocol === 'http:' ? 80 : 443),
      path: parsed.pathname + parsed.search,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8'
      },
      timeout: timeoutMs,
      rejectUnauthorized: false
    };

    try {
      const req = client.request(options, (res) => {
        if ([301, 302, 307, 308].includes(res.statusCode) && res.headers.location) {
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
      req.end();
    } catch {
      resolve(null);
    }
  });
}

/**
 * Extrae y valida correos de un HTML
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
 * Ordena candidatos según jerarquía de prioridad
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
 * Conecta a la web de la empresa y extrae sustitutos
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
    const paths = ['/contacto', '/aviso-legal', '/politica-de-privacidad', '/es/contacto', '/contact'];
    for (const p of paths) {
      if (found.size >= 6) break;
      const subHtml = await fetchPage(`${origin}${p}`, 4000);
      extractCandidateEmails(subHtml).forEach(e => found.add(e));
    }
  } catch {}

  return prioritizeEmails(Array.from(found));
}

/**
 * Función principal del auditor SafetyMails
 */
async function runSafetyMailsAuditor() {
  const filePath = 'src/data/prospects.json';
  const rawData = fs.readFileSync(filePath, 'utf-8');
  const prospects = JSON.parse(rawData);

  // Filtrar pendientes: sin emailableStatus ni safetyMailsStatus
  const pending = prospects.filter(p => !p.emailableStatus && !p.safetyMailsStatus);

  console.log(`================================================================`);
  console.log(`INICIANDO AUDITORÍA CON SAFETYMAILS Y SCRAPING DE SUSTITUTOS`);
  console.log(`Total empresas en CRM: ${prospects.length}`);
  console.log(`Empresas pendientes de verificar: ${pending.length}`);
  console.log(`================================================================\n`);

  let countDeliverable = 0;
  let countRisky = 0;
  let countInvalid = 0;
  let countSubstituted = 0;
  let countMarkedRed = 0;
  let lastBalance = null;

  for (let i = 0; i < pending.length; i++) {
    const p = pending[i];
    const currentEmail = (p.email || '').trim().toLowerCase();

    console.log(`[${i + 1}/${pending.length}] Empresa: ${p.name} | Email actual: ${currentEmail || '(vacío)'}`);

    let check = await verifyWithSafetyMails(currentEmail);
    if (check.balance >= 0) lastBalance = check.balance;

    if (check.outOfCredits) {
      console.log(`\n*** ALERTA: Créditos de SafetyMails agotados (Balance: ${check.balance}). Deteniendo proceso cleanly. ***`);
      break;
    }

    console.log(`    ↳ SafetyMails: ${check.status} | Advice: ${check.advice} (${check.idAdvice}) | Saldo: ${check.balance}`);

    // ¿Es válido o aceptable?
    // IdAdvice 5200: Válido, 5201/5202: Risky/Limited, 5204: PENDIENTE con MX
    // Negativo = IdAdvice 5203 (Inválido) o sintaxis inválida o sin MX
    const isDeliverable = check.idAdvice === 5200 || (check.idAdvice === 5204 && check.mx);
    const isRisky = check.idAdvice === 5201 || check.idAdvice === 5202;
    const isNegative = check.idAdvice === 5203 || !currentEmail || check.status === 'INVALID_SYNTAX';

    if (isDeliverable) {
      p.emailVerified = true;
      p.emailVerifiedType = p.emailVerifiedType || 'contacto';
      p.safetyMailsStatus = 'deliverable';
      p.safetyMailsAdvice = check.advice;
      countDeliverable++;
      console.log(`    ✓ Marcado como VÁLIDO / ENTREGABLE`);
    } else if (isRisky) {
      p.emailVerified = true;
      p.emailVerifiedType = p.emailVerifiedType || 'contacto';
      p.safetyMailsStatus = 'risky';
      p.safetyMailsAdvice = check.advice;
      countRisky++;
      console.log(`    ⚡ Marcado como RIESGO / ACEPTADO`);
    } else {
      // Negativo o sin email: rastrear la web corporativa en busca de sustituto
      countInvalid++;
      console.log(`    ✗ NEGATIVO / INVÁLIDO. Conectando a la web corporativa (${p.web}) para buscar sustituto...`);

      const candidates = await scrapeSubstitutesFromWeb(p.web);
      console.log(`    🔎 Candidatos encontrados en web: ${candidates.length} [${candidates.map(c => `${c.email} (${c.type})`).join(', ')}]`);

      let substituted = false;
      for (const cand of candidates) {
        if (cand.email.toLowerCase() === currentEmail) continue;

        console.log(`       → Probando sustituto con SafetyMails: ${cand.email} (${cand.type})...`);
        const candCheck = await verifyWithSafetyMails(cand.email);
        if (candCheck.balance >= 0) lastBalance = candCheck.balance;

        if (candCheck.outOfCredits) {
          console.log(`       *** Créditos agotados durante prueba de sustitutos ***`);
          break;
        }

        const candOk = candCheck.idAdvice === 5200 || candCheck.idAdvice === 5201 || candCheck.idAdvice === 5202 || (candCheck.idAdvice === 5204 && candCheck.mx);

        if (candOk) {
          console.log(`       ★ ¡SUSTITUTO VÁLIDO HALLADO! Reemplazando ${currentEmail} por ${cand.email}`);
          p.email = cand.email;
          p.emailVerified = true;
          p.emailVerifiedType = cand.type;
          p.safetyMailsStatus = candCheck.idAdvice === 5200 ? 'deliverable' : 'risky';
          p.safetyMailsAdvice = candCheck.advice;
          p.notes = (p.notes ? p.notes + ' ' : '') + `[Email reemplazado vía web scraper + SafetyMails: ${cand.email} (${cand.type})]`;
          substituted = true;
          countSubstituted++;
          break;
        } else {
          console.log(`       ✕ Descartado sustituto ${cand.email} (${candCheck.advice})`);
        }
      }

      if (!substituted) {
        p.emailVerified = false;
        p.safetyMailsStatus = 'undeliverable';
        p.safetyMailsAdvice = check.advice || 'Inválido';
        countMarkedRed++;
        console.log(`    ⛔ No se localizó sustituto válido. Marcado en ROJO (emailVerified: false)`);
      }
    }

    // Guardado incremental cada 10 prospectos para seguridad
    if ((i + 1) % 10 === 0 || i === pending.length - 1) {
      fs.writeFileSync(filePath, JSON.stringify(prospects, null, 2), 'utf-8');
      console.log(`    💾 [Guardado incremental] Progreso salvado en ${filePath}`);
    }

    // Pequeño retardo de cortesía para no saturar
    await new Promise(r => setTimeout(r, 200));
  }

  // Guardado final
  fs.writeFileSync(filePath, JSON.stringify(prospects, null, 2), 'utf-8');

  console.log(`\n================================================================`);
  console.log(`AUDITORÍA FINALIZADA`);
  console.log(`Empresas válidas / deliverable: ${countDeliverable}`);
  console.log(`Empresas con riesgo aceptado: ${countRisky}`);
  console.log(`Empresas con email negativo: ${countInvalid}`);
  console.log(`Sustitutos encontrados y reemplazados: ${countSubstituted}`);
  console.log(`Empresas dejadas en ROJO (no verificadas): ${countMarkedRed}`);
  console.log(`Saldo final en SafetyMails: ${lastBalance}`);
  console.log(`================================================================`);
}

runSafetyMailsAuditor().catch(console.error);
