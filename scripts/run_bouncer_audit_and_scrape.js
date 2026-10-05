import fs from 'fs';
import https from 'https';
import http from 'http';
import { URL } from 'url';

/**
 * AUDITORÍA Y VERIFICACIÓN CON USEBOUNCER Y SCRAPER WEB
 * 
 * Reglas de negocio:
 * 1. Verifica cada empresa que esté en ROJO (emailVerified: false).
 * 2. Si el email actual es válido en Bouncer (status === 'deliverable'):
 *    - Se marca emailVerified: true, bouncerStatus: 'deliverable'.
 * 3. Si es risky (pero no toxic y con MX):
 *    - Se acepta o evalúa.
 * 4. Si es inválido (undeliverable / unknown):
 *    - Scrapea la web corporativa buscando sustitutos:
 *        1º Compras
 *        2º Contacto
 *        3º Respaldo
 *    - Valida los sustitutos con Bouncer hasta encontrar uno entregable.
 *    - Si lo encuentra, sustituye el email y pasa a verde.
 *    - Si no, se mantiene en rojo.
 * 5. Si Bouncer responde con 402/403 de falta de créditos, se detiene limpiamente.
 * 6. Guarda incrementalmente en src/data/prospects.json.
 */

const BOUNCER_API_KEY = 'mee3jJ6NpRj94MREsmsq34KSlCIJfYawVu9Ncyx0';
const EMAIL_SYNTAX_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const EMAIL_SCRAPE_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi;

const PURCHASING_KEYWORDS = ['compras', 'proveedores', 'purchasing', 'procurement', 'facturacion'];
const CONTACT_KEYWORDS = ['contacto', 'info', 'administracion', 'secretaria', 'hola'];
const IGNORE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.pdf', '.css', '.js'];
const IGNORE_EMAILS = ['ejemplo@', 'example@', 'usuario@', 'test@', 'sentry@', 'wixpress.com', 'wordpress.org', 'domain.com'];

/**
 * Verifica un email con Bouncer API v1.1
 */
async function verifyWithBouncer(email) {
  if (!email || !EMAIL_SYNTAX_REGEX.test(email)) {
    return { status: 'undeliverable', reason: 'invalid_syntax', outOfCredits: false };
  }

  const url = `https://api.usebouncer.com/v1.1/email/verify?email=${encodeURIComponent(email)}`;
  try {
    const res = await fetch(url, {
      headers: {
        'x-api-key': BOUNCER_API_KEY,
        'User-Agent': 'Carmen-CRM-Verifier/1.0'
      }
    });

    if (res.status === 402 || (res.status === 403 && (await res.clone().text()).includes('credit'))) {
      return { status: 'error', outOfCredits: true };
    }

    if (res.status !== 200) {
      const errText = await res.text();
      return { status: 'error', reason: errText, outOfCredits: false };
    }

    const data = await res.json();
    return {
      status: (data.status || 'unknown').toLowerCase(),
      reason: data.reason || '',
      score: data.score || 0,
      toxic: data.toxic === 'yes',
      raw: data,
      outOfCredits: false
    };
  } catch (e) {
    return { status: 'error', reason: e.message, outOfCredits: false };
  }
}

/**
 * Descarga HTML de una página web
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

async function runBouncerAuditor() {
  const filePath = 'src/data/prospects.json';
  const rawData = fs.readFileSync(filePath, 'utf-8');
  const prospects = JSON.parse(rawData);

  // Filtrar prospectos en rojo (emailVerified === false)
  const redProspects = prospects.filter(p => p.emailVerified === false);

  console.log(`================================================================`);
  console.log(`INICIANDO VERIFICACIÓN CON USEBOUNCER (API v1.1)`);
  console.log(`Prospectos en ROJO a revisar: ${redProspects.length}`);
  console.log(`================================================================\n`);

  let countDeliverable = 0;
  let countRiskyAccepted = 0;
  let countSubstituted = 0;
  let countStillRed = 0;
  let checkedCount = 0;

  for (let i = 0; i < redProspects.length; i++) {
    const p = redProspects[i];
    const currentEmail = (p.email || '').trim().toLowerCase();

    console.log(`[${i + 1}/${redProspects.length}] ${p.name} | Email actual: ${currentEmail || '(sin email)'}`);

    let check = await verifyWithBouncer(currentEmail);
    checkedCount++;

    if (check.outOfCredits) {
      console.log(`\n*** ALERTA: Créditos agotados en Bouncer. Deteniendo ejecución limpia. ***`);
      break;
    }

    console.log(`    ↳ Bouncer: ${check.status} | Reason: ${check.reason || 'ok'} | Score: ${check.score}`);

    // Si es entregable
    if (check.status === 'deliverable') {
      p.emailVerified = true;
      p.emailVerifiedType = p.emailVerifiedType || 'contacto';
      p.bouncerStatus = 'deliverable';
      p.notes = (p.notes ? p.notes + ' ' : '') + `[Validado Bouncer: Deliverable]`;
      countDeliverable++;
      console.log(`    ✓ Marcado como VÁLIDO / ENTREGABLE`);
    } else if (check.status === 'risky' && !check.toxic && check.reason !== 'low_quality') {
      // Risky aceptable (catch-all empresarial)
      p.emailVerified = true;
      p.emailVerifiedType = p.emailVerifiedType || 'contacto';
      p.bouncerStatus = 'risky';
      p.notes = (p.notes ? p.notes + ' ' : '') + `[Validado Bouncer: Risky aceptado (${check.reason})]`;
      countRiskyAccepted++;
      console.log(`    ⚡ Marcado como RIESGO ACEPTADO`);
    } else {
      // Negativo / Inválido / Low quality: Scrapear web corporativa
      console.log(`    ✗ NEGATIVO / INVÁLIDO (${check.status}/${check.reason}). Rastreando web (${p.web})...`);
      const candidates = await scrapeSubstitutesFromWeb(p.web);
      console.log(`    🔎 Candidatos encontrados en web: ${candidates.length} [${candidates.map(c => `${c.email} (${c.type})`).join(', ')}]`);

      let substituted = false;
      for (const cand of candidates) {
        if (cand.email.toLowerCase() === currentEmail) continue;

        console.log(`       → Probando sustituto con Bouncer: ${cand.email} (${cand.type})...`);
        const candCheck = await verifyWithBouncer(cand.email);
        checkedCount++;

        if (candCheck.outOfCredits) {
          console.log(`       *** Sin créditos para más candidatos ***`);
          break;
        }

        if (candCheck.status === 'deliverable' || (candCheck.status === 'risky' && !candCheck.toxic && candCheck.reason !== 'low_quality')) {
          console.log(`       ★ ¡SUSTITUTO VÁLIDO ENCONTRADO! Reemplazando ${currentEmail} por ${cand.email}`);
          p.email = cand.email;
          p.emailVerified = true;
          p.emailVerifiedType = cand.type;
          p.bouncerStatus = candCheck.status;
          p.notes = (p.notes ? p.notes + ' ' : '') + `[Email reemplazado vía web scraper + Bouncer: ${cand.email} (${cand.type})]`;
          substituted = true;
          countSubstituted++;
          break;
        } else {
          console.log(`       ✕ Descartado sustituto ${cand.email} (${candCheck.status}/${candCheck.reason})`);
        }
      }

      if (!substituted) {
        p.emailVerified = false;
        p.bouncerStatus = check.status;
        countStillRed++;
        console.log(`    ⛔ No se localizó sustituto entregable. Se mantiene en ROJO.`);
      }
    }

    // Guardado incremental cada 5 prospectos
    if ((i + 1) % 5 === 0 || i === redProspects.length - 1) {
      fs.writeFileSync(filePath, JSON.stringify(prospects, null, 2), 'utf-8');
      console.log(`    💾 [Guardado incremental] Salvado en ${filePath}`);
    }

    // Cortesía Bouncer
    await new Promise(r => setTimeout(r, 300));
  }

  // Guardado final
  fs.writeFileSync(filePath, JSON.stringify(prospects, null, 2), 'utf-8');

  console.log(`\n================================================================`);
  console.log(`AUDITORÍA BOUNCER FINALIZADA`);
  console.log(`Total validaciones realizadas: ${checkedCount}`);
  console.log(`Entregables confirmados: ${countDeliverable}`);
  console.log(`Riesgo aceptado: ${countRiskyAccepted}`);
  console.log(`Sustitutos encontrados y reemplazados: ${countSubstituted}`);
  console.log(`Empresas mantenidas en rojo: ${countStillRed}`);
  console.log(`================================================================`);
}

runBouncerAuditor().catch(console.error);
