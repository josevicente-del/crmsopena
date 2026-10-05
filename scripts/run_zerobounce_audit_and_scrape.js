import fs from 'fs';
import https from 'https';
import http from 'http';
import { URL } from 'url';

/**
 * AUDITORÍA Y VERIFICACIÓN CON ZEROBOUNCE Y SCRAPER WEB
 * 
 * Reglas de negocio:
 * 1. Verifica cada empresa que esté en ROJO (emailVerified: false).
 * 2. Si el email actual es válido en ZeroBounce (status === 'valid'):
 *    - Se marca emailVerified: true, zeroBounceStatus: 'valid'.
 * 3. Si el email actual es inválido o dudoso:
 *    - Scrapea la web corporativa en busca de emails sustitutos.
 *    - Prioriza: Compras > Contacto > Respaldo.
 *    - Valida los sustitutos con ZeroBounce hasta dar con uno válido.
 *    - Si se halla sustituto, reemplaza el email en el CRM.
 *    - Si no, se mantiene en rojo.
 * 4. Si se acaban los créditos (Credits <= 0), se detiene de forma limpia.
 */

const ZEROBOUNCE_API_KEY = 'c8276f35701f4be08c694a3ee857af45';
const EMAIL_SYNTAX_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const EMAIL_SCRAPE_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi;

const PURCHASING_KEYWORDS = ['compras', 'proveedores', 'purchasing', 'procurement', 'facturacion'];
const CONTACT_KEYWORDS = ['contacto', 'info', 'administracion', 'secretaria', 'hola'];
const IGNORE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.pdf', '.css', '.js'];
const IGNORE_EMAILS = ['ejemplo@', 'example@', 'usuario@', 'test@', 'sentry@', 'wixpress.com', 'wordpress.org', 'domain.com'];

/**
 * Consulta créditos disponibles en ZeroBounce
 */
async function getZeroBounceCredits() {
  try {
    const res = await fetch(`https://api.zerobounce.net/v2/getcredits?api_key=${ZEROBOUNCE_API_KEY}`);
    const data = await res.json();
    return parseInt(data.Credits, 10) || 0;
  } catch (e) {
    return 0;
  }
}

/**
 * Valida un email individual en ZeroBounce
 */
async function verifyWithZeroBounce(email) {
  if (!email || !EMAIL_SYNTAX_REGEX.test(email)) {
    return { status: 'invalid', sub_status: 'invalid_syntax', outOfCredits: false };
  }

  const url = `https://api.zerobounce.net/v2/validate?api_key=${ZEROBOUNCE_API_KEY}&email=${encodeURIComponent(email)}`;
  try {
    const res = await fetch(url);
    const data = await res.json();

    if (data.error || (data.status && data.status.toLowerCase().includes('credit'))) {
      return { status: 'error', outOfCredits: true, raw: data };
    }

    return {
      status: (data.status || 'unknown').toLowerCase(),
      sub_status: data.sub_status || '',
      free_email: data.free_email,
      domain: data.domain,
      raw: data,
      outOfCredits: false
    };
  } catch (e) {
    return { status: 'error', error: e.message, outOfCredits: false };
  }
}

/**
 * Descarga el HTML de una URL con timeout
 */
function fetchPage(urlStr, timeoutMs = 5000) {
  return new Promise((resolve) => {
    try {
      const parsed = new URL(urlStr);
      const client = parsed.protocol === 'https:' ? https : http;
      const req = client.get(
        urlStr,
        {
          timeout: timeoutMs,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8'
          }
        },
        (res) => {
          if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            try {
              const redirectUrl = new URL(res.headers.location, urlStr).href;
              return resolve(fetchPage(redirectUrl, timeoutMs));
            } catch {
              return resolve('');
            }
          }
          if (res.statusCode !== 200) return resolve('');
          let data = '';
          res.setEncoding('utf8');
          res.on('data', chunk => {
            data += chunk;
            if (data.length > 500000) {
              res.destroy();
              resolve(data);
            }
          });
          res.on('end', () => resolve(data));
          res.on('error', () => resolve(''));
        }
      );
      req.on('timeout', () => { req.destroy(); resolve(''); });
      req.on('error', () => resolve(''));
    } catch {
      resolve('');
    }
  });
}

function extractCandidateEmails(html) {
  if (!html) return [];
  const matches = html.match(EMAIL_SCRAPE_REGEX) || [];
  const valid = [];
  for (const raw of matches) {
    const email = raw.toLowerCase().trim();
    if (IGNORE_EXTENSIONS.some(ext => email.endsWith(ext))) continue;
    if (IGNORE_EMAILS.some(ign => email.includes(ign))) continue;
    if (valid.includes(email)) continue;
    valid.push(email);
  }
  return valid;
}

function prioritizeEmails(emails) {
  const compras = [];
  const contacto = [];
  const respaldo = [];

  for (const e of emails) {
    const user = e.split('@')[0];
    if (PURCHASING_KEYWORDS.some(kw => user.includes(kw))) {
      compras.push({ email: e, type: 'compras' });
    } else if (CONTACT_KEYWORDS.some(kw => user.includes(kw))) {
      contacto.push({ email: e, type: 'contacto' });
    } else {
      respaldo.push({ email: e, type: 'respaldo' });
    }
  }

  return [...compras, ...contacto, ...respaldo];
}

async function scrapeSubstitutesFromWeb(webUrl) {
  if (!webUrl) return [];
  let base = webUrl.trim();
  if (!base.startsWith('http://') && !base.startsWith('https://')) {
    base = 'https://' + base;
  }

  const found = new Set();
  const htmlHome = await fetchPage(base, 5000);
  extractCandidateEmails(htmlHome).forEach(e => found.add(e));

  try {
    const origin = new URL(base).origin;
    const paths = ['/contacto', '/contact', '/contacto/', '/es/contacto', '/aviso-legal', '/politica-de-privacidad'];
    for (const p of paths) {
      if (found.size >= 5) break;
      const subHtml = await fetchPage(`${origin}${p}`, 4000);
      extractCandidateEmails(subHtml).forEach(e => found.add(e));
    }
  } catch {}

  return prioritizeEmails(Array.from(found));
}

async function runZeroBounceAuditor() {
  const filePath = 'src/data/prospects.json';
  const rawData = fs.readFileSync(filePath, 'utf-8');
  const prospects = JSON.parse(rawData);

  let initialCredits = await getZeroBounceCredits();
  console.log(`================================================================`);
  console.log(`INICIANDO VERIFICACIÓN CON ZEROBOUNCE (Créditos disponibles: ${initialCredits})`);
  console.log(`================================================================\n`);

  if (initialCredits <= 0) {
    console.log(`No hay créditos disponibles en ZeroBounce (${initialCredits}). Proceso cancelado.`);
    return;
  }

  // Filtrar prospectos en rojo (emailVerified === false)
  const redProspects = prospects.filter(p => p.emailVerified === false);
  console.log(`Prospectos marcados en ROJO pendientes de revalidación: ${redProspects.length}\n`);

  let processedCount = 0;
  let creditsLeft = initialCredits;

  for (let i = 0; i < redProspects.length; i++) {
    if (creditsLeft <= 0) {
      console.log(`\n*** ALERTA: Créditos agotados (0 disponibles). Deteniendo ejecución limpia. ***`);
      break;
    }

    const p = redProspects[i];
    const currentEmail = (p.email || '').trim().toLowerCase();

    console.log(`[${i + 1}/${redProspects.length}] ${p.name} | Email actual: ${currentEmail || '(sin email)'}`);

    let check = await verifyWithZeroBounce(currentEmail);
    creditsLeft--;
    processedCount++;

    if (check.outOfCredits) {
      console.log(`    *** Créditos agotados según respuesta de API ***`);
      break;
    }

    console.log(`    ↳ ZeroBounce: ${check.status} (${check.sub_status || 'normal'}) | Créditos est.: ${creditsLeft}`);

    if (check.status === 'valid') {
      p.emailVerified = true;
      p.emailVerifiedType = p.emailVerifiedType || 'contacto';
      p.zeroBounceStatus = 'valid';
      p.notes = (p.notes ? p.notes + ' ' : '') + `[Validado ZeroBounce: Válido]`;
      console.log(`    ✓ Marcado como VÁLIDO / ENTREGABLE`);
    } else {
      console.log(`    ✗ NEGATIVO / INVÁLIDO (${check.status}). Conectando a web (${p.web}) para buscar sustituto...`);
      const candidates = await scrapeSubstitutesFromWeb(p.web);
      console.log(`    🔎 Candidatos encontrados en web: ${candidates.length} [${candidates.map(c => `${c.email} (${c.type})`).join(', ')}]`);

      let substituted = false;
      for (const cand of candidates) {
        if (creditsLeft <= 0) {
          console.log(`       *** Sin créditos para probar más candidatos ***`);
          break;
        }
        if (cand.email.toLowerCase() === currentEmail) continue;

        console.log(`       → Probando sustituto con ZeroBounce: ${cand.email} (${cand.type})...`);
        const candCheck = await verifyWithZeroBounce(cand.email);
        creditsLeft--;
        processedCount++;

        if (candCheck.outOfCredits) break;

        if (candCheck.status === 'valid') {
          console.log(`       ★ ¡SUSTITUTO VÁLIDO ENCONTRADO! Reemplazando ${currentEmail} por ${cand.email}`);
          p.email = cand.email;
          p.emailVerified = true;
          p.emailVerifiedType = cand.type;
          p.zeroBounceStatus = 'valid';
          p.notes = (p.notes ? p.notes + ' ' : '') + `[Email reemplazado vía web scraper + ZeroBounce: ${cand.email} (${cand.type})]`;
          substituted = true;
          break;
        } else {
          console.log(`       ✕ Descartado sustituto ${cand.email} (${candCheck.status})`);
        }
      }

      if (!substituted) {
        p.emailVerified = false;
        p.zeroBounceStatus = check.status;
        console.log(`    ⛔ No se localizó sustituto válido. Se mantiene en ROJO.`);
      }
    }

    fs.writeFileSync(filePath, JSON.stringify(prospects, null, 2), 'utf-8');
    await new Promise(r => setTimeout(r, 400));
  }

  const finalCredits = await getZeroBounceCredits();
  console.log(`\n================================================================`);
  console.log(`PROCESO FINALIZADO`);
  console.log(`Validaciones realizadas: ${processedCount}`);
  console.log(`Créditos restantes en ZeroBounce: ${finalCredits}`);
  console.log(`Base de datos actualizada en ${filePath}`);
  console.log(`================================================================`);
}

runZeroBounceAuditor().catch(console.error);
