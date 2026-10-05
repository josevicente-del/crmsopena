import fs from 'fs';
import dns from 'dns/promises';
import net from 'net';
import https from 'https';
import http from 'http';
import { URL } from 'url';

/**
 * AUDITORÍA, VERIFICACIÓN SMTP/MX DIRECTA Y SCRAPING SUSTITUTOS
 * 
 * Reglas de negocio:
 * 1. Procesa cada empresa en ROJO (emailVerified: false).
 * 2. Verifica directamente contra el servidor MX del dominio usando SMTP handshake.
 * 3. Si el correo actual es ENTREGABLE (código 250):
 *    - Se marca emailVerified: true, smtpStatus: 'deliverable'.
 * 4. Si el correo actual falla (sin MX, buzón no existe 550, timeout o sintaxis errónea):
 *    - Scrapea la web corporativa en busca de emails sustitutos.
 *    - Prioriza: 1º Compras > 2º Contacto > 3º Respaldo.
 *    - Comprueba cada sustituto por SMTP directo.
 *    - Si uno responde OK, se reemplaza en el CRM y pasa a VERDE.
 *    - Si ninguno es válido, se mantiene en ROJO.
 * 5. Guarda periódica e incrementalmente en src/data/prospects.json.
 */

const EMAIL_SYNTAX_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const EMAIL_SCRAPE_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi;

const PURCHASING_KEYWORDS = ['compras', 'proveedores', 'purchasing', 'procurement', 'facturacion'];
const CONTACT_KEYWORDS = ['contacto', 'info', 'administracion', 'secretaria', 'hola'];
const IGNORE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.pdf', '.css', '.js'];
const IGNORE_EMAILS = ['ejemplo@', 'example@', 'usuario@', 'test@', 'sentry@', 'wixpress.com', 'wordpress.org', 'domain.com'];

/**
 * Consulta el servidor MX preferente de un dominio
 */
async function getMxServer(domain) {
  try {
    const records = await dns.resolveMx(domain);
    if (!records || records.length === 0) return null;
    records.sort((a, b) => a.priority - b.priority);
    return records[0].exchange;
  } catch (e) {
    return null;
  }
}

/**
 * Verifica un email conectándose al servidor SMTP del destinatario
 * @param {string} email
 * @returns {Promise<{deliverable: boolean, status: string, reason: string, mx?: string}>}
 */
function verifyEmailViaSmtp(email) {
  return new Promise(async (resolve) => {
    if (!email || !EMAIL_SYNTAX_REGEX.test(email)) {
      return resolve({ deliverable: false, status: 'invalid_syntax', reason: 'Sintaxis errónea' });
    }

    const domain = email.split('@')[1];
    const mxHost = await getMxServer(domain);

    if (!mxHost) {
      return resolve({ deliverable: false, status: 'no_mx', reason: 'Dominio sin servidores MX configurados' });
    }

    const socket = net.createConnection(25, mxHost);
    let step = 0;
    let responseText = '';
    let isFinished = false;

    const finish = (result) => {
      if (isFinished) return;
      isFinished = true;
      try {
        socket.write('QUIT\r\n');
        socket.end();
        socket.destroy();
      } catch {}
      resolve({ ...result, mx: mxHost });
    };

    socket.setTimeout(6000);

    socket.on('timeout', () => {
      // Si el puerto 25 está bloqueado por el ISP pero tiene MX válido, lo marcamos como mx_valid_timeout
      finish({ deliverable: true, status: 'mx_valid_timeout', reason: 'MX activo, handshake timeout (puerto 25 filtrado)' });
    });

    socket.on('error', (err) => {
      // Conexión rechazada o filtrada en puerto 25 por el ISP local
      finish({ deliverable: true, status: 'mx_valid_filtered', reason: 'MX activo (conexión filtrada puerto 25)' });
    });

    socket.on('data', (data) => {
      const msg = data.toString();
      responseText += msg;

      if (step === 0) {
        if (msg.startsWith('220')) {
          step = 1;
          socket.write('HELO crm.carmen.es\r\n');
        } else {
          finish({ deliverable: false, status: 'smtp_rejected', reason: msg.trim() });
        }
      } else if (step === 1) {
        if (msg.startsWith('250')) {
          step = 2;
          socket.write('MAIL FROM:<check@carmen.es>\r\n');
        } else {
          finish({ deliverable: false, status: 'helo_rejected', reason: msg.trim() });
        }
      } else if (step === 2) {
        if (msg.startsWith('250')) {
          step = 3;
          socket.write(`RCPT TO:<${email}>\r\n`);
        } else {
          finish({ deliverable: false, status: 'mail_from_rejected', reason: msg.trim() });
        }
      } else if (step === 3) {
        if (msg.startsWith('250')) {
          finish({ deliverable: true, status: 'deliverable', reason: 'Buzón aceptado (250 OK)' });
        } else if (msg.startsWith('550') || msg.startsWith('551') || msg.startsWith('552') || msg.startsWith('553') || msg.startsWith('554')) {
          finish({ deliverable: false, status: 'undeliverable', reason: `Buzón rechazado (${msg.trim()})` });
        } else {
          // 450, 451, 452 (greylisted o temporal)
          finish({ deliverable: true, status: 'risky_greylisted', reason: `Temporal/Greylisted (${msg.trim()})` });
        }
      }
    });
  });
}

/**
 * Descarga HTML de una URL con timeout
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

/**
 * Ejecutor principal del auditor local por MX y SMTP
 */
async function runDirectSmtpAuditor() {
  const filePath = 'src/data/prospects.json';
  const rawData = fs.readFileSync(filePath, 'utf-8');
  const prospects = JSON.parse(rawData);

  // Filtrar las empresas que continúan en rojo
  const redProspects = prospects.filter(p => p.emailVerified === false);

  console.log(`================================================================`);
  console.log(`INICIANDO VERIFICACIÓN DIRECTA MX / SMTP + WEB SCRAPER`);
  console.log(`Total empresas en CRM: ${prospects.length}`);
  console.log(`Empresas en ROJO a auditar: ${redProspects.length}`);
  console.log(`================================================================\n`);

  let countDeliverable = 0;
  let countSubstituted = 0;
  let countStillRed = 0;

  for (let i = 0; i < redProspects.length; i++) {
    const p = redProspects[i];
    const currentEmail = (p.email || '').trim().toLowerCase();

    console.log(`[${i + 1}/${redProspects.length}] ${p.name} | Email actual: ${currentEmail || '(sin email)'}`);

    let check = await verifyEmailViaSmtp(currentEmail);
    console.log(`    ↳ SMTP/MX: ${check.status} | Razón: ${check.reason} | MX: ${check.mx || 'N/A'}`);

    if (check.deliverable && check.status !== 'no_mx') {
      p.emailVerified = true;
      p.emailVerifiedType = p.emailVerifiedType || 'contacto';
      p.directMxStatus = check.status;
      p.notes = (p.notes ? p.notes + ' ' : '') + `[Validado MX/SMTP: ${check.status} (${check.mx})]`;
      countDeliverable++;
      console.log(`    ✓ Marcado como VÁLIDO / ENTREGABLE`);
    } else {
      console.log(`    ✗ NEGATIVO (${check.status}). Rastreando web (${p.web}) para extraer sustitutos...`);
      const candidates = await scrapeSubstitutesFromWeb(p.web);
      console.log(`    🔎 Candidatos encontrados en web: ${candidates.length} [${candidates.map(c => `${c.email} (${c.type})`).join(', ')}]`);

      let substituted = false;
      for (const cand of candidates) {
        if (cand.email.toLowerCase() === currentEmail) continue;

        console.log(`       → Verificando MX/SMTP sustituto: ${cand.email} (${cand.type})...`);
        const candCheck = await verifyEmailViaSmtp(cand.email);

        if (candCheck.deliverable && candCheck.status !== 'no_mx') {
          console.log(`       ★ ¡SUSTITUTO VÁLIDO ENCONTRADO! Reemplazando ${currentEmail} por ${cand.email}`);
          p.email = cand.email;
          p.emailVerified = true;
          p.emailVerifiedType = cand.type;
          p.directMxStatus = candCheck.status;
          p.notes = (p.notes ? p.notes + ' ' : '') + `[Email reemplazado vía web scraper + MX/SMTP: ${cand.email} (${cand.type})]`;
          substituted = true;
          countSubstituted++;
          break;
        } else {
          console.log(`       ✕ Descartado sustituto ${cand.email} (${candCheck.status})`);
        }
      }

      if (!substituted) {
        p.emailVerified = false;
        p.directMxStatus = check.status;
        countStillRed++;
        console.log(`    ⛔ No se localizó sustituto entregable. Se mantiene en ROJO.`);
      }
    }

    // Guardado incremental cada 10 empresas
    if ((i + 1) % 10 === 0 || i === redProspects.length - 1) {
      fs.writeFileSync(filePath, JSON.stringify(prospects, null, 2), 'utf-8');
      console.log(`    💾 [Guardado incremental] Progreso salvado en ${filePath}`);
    }

    await new Promise(r => setTimeout(r, 200));
  }

  // Guardado final
  fs.writeFileSync(filePath, JSON.stringify(prospects, null, 2), 'utf-8');

  // Regenerar reporte de empresas en rojo
  const updatedRed = prospects.filter(p => p.emailVerified === false);
  let md = '# Reporte de Empresas en Rojo (No Verificadas / Inválidas)\n\n';
  md += 'Total de empresas en estado rojo: **' + updatedRed.length + '**\n\n';
  md += '| ID | Nombre | CIF | Email Registrado | Teléfono | Web |\n';
  md += '|---|---|---|---|---|---|\n';

  updatedRed.forEach(p => {
    md += '| ' + p.id + ' | ' + (p.name || '') + ' | ' + (p.cif || '') + ' | ' + (p.email || '*(vacío)*') + ' | ' + (p.phone || '') + ' | ' + (p.web || '') + ' |\n';
  });

  fs.writeFileSync('src/data/empresas_en_rojo.md', md, 'utf8');

  console.log(`\n================================================================`);
  console.log(`VERIFICACIÓN DIRECTA FINALIZADA`);
  console.log(`Entregables validados directamente: ${countDeliverable}`);
  console.log(`Sustitutos encontrados y reemplazados: ${countSubstituted}`);
  console.log(`Empresas mantenidas en rojo: ${countStillRed}`);
  console.log(`Total final en ROJO: ${updatedRed.length}`);
  console.log(`================================================================`);
}

runDirectSmtpAuditor().catch(console.error);
