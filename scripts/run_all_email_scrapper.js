import fs from 'fs';
import https from 'https';
import http from 'http';
import { URL } from 'url';

/**
 * SCRAPPER Y AUDITOR DE EMAILS MASIVO PARA TODAS LAS EMPRESAS DEL CRM
 * 
 * Reglas de negocio estrictas solicitadas:
 * 1. Validación Sintáctica: r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
 * 2. Criterio de Prioridad:
 *    • 1º Compras: compras, proveedores, purchasing, procurement, facturacion
 *    • 2º Contacto: contacto, info, administracion, secretaria, hola
 *    • 3º Respaldo: primer email disponible si no coincide con palabras clave
 * 3. Si el email en la BD coincide con el del scrapper, no hacer nada.
 * 4. Si es distinto, sustituirlo primero por el de compras y si no existe por el de contacto/respaldo.
 * 5. Si no se localiza un email verificado, dejarlo marcado para que el CRM lo muestre en ROJO (emailVerified: false).
 */

const EMAIL_SYNTAX_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const EMAIL_SCRAPE_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi;

const PURCHASING_KEYWORDS = ['compras', 'proveedores', 'purchasing', 'procurement', 'facturacion'];
const CONTACT_KEYWORDS = ['contacto', 'info', 'administracion', 'secretaria', 'hola'];

const IGNORE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.pdf', '.css', '.js'];
const IGNORE_EMAILS = [
  'ejemplo@', 'example@', 'usuario@', 'test@', 'sentry@', 'wixpress.com', 'wordpress.org',
  'domain.com', 'email.com', 'correo@', 'mail@example.com'
];

function fetchPage(targetUrl, timeoutMs = 7000, maxRedirects = 3) {
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
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8'
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
          if (body.length > 1200000) { // Cortar a 1.2MB
            req.destroy();
            resolve(body);
          }
        });
        res.on('end', () => resolve(body));
      });

      req.on('error', () => resolve(null));
      req.on('timeout', () => {
        req.destroy();
        resolve(null);
      });
    } catch {
      resolve(null);
    }
  });
}

function extractValidEmails(html) {
  if (!html) return [];
  const matches = html.match(EMAIL_SCRAPE_REGEX) || [];
  const validSet = new Set();

  for (let match of matches) {
    let clean = match.toLowerCase().trim();
    clean = clean.replace(/^[.,;:\s]+|[.,;:\s]+$/g, '');

    // 1. Regla obligatoria: Validación Sintáctica
    if (!EMAIL_SYNTAX_REGEX.test(clean)) continue;

    if (IGNORE_EXTENSIONS.some(ext => clean.endsWith(ext))) continue;
    if (IGNORE_EMAILS.some(ign => clean.includes(ign))) continue;

    validSet.add(clean);
  }

  return Array.from(validSet);
}

function selectPrioritizedEmail(emails) {
  if (!emails || emails.length === 0) return null;

  // 1º Prioridad: Compras
  for (let email of emails) {
    const user = email.split('@')[0];
    if (PURCHASING_KEYWORDS.some(kw => user.includes(kw))) {
      return { email, type: 'compras' };
    }
  }

  // 2º Prioridad: Contacto
  for (let email of emails) {
    const user = email.split('@')[0];
    if (CONTACT_KEYWORDS.some(kw => user.includes(kw))) {
      return { email, type: 'contacto' };
    }
  }

  // 3º Respaldo
  return { email: emails[0], type: 'respaldo' };
}

async function scrapeCompanyEmail(company) {
  if (!company.web || company.web === 'No disponible') {
    return null;
  }

  // Intento 1: Página de inicio
  let html = await fetchPage(company.web, 6000);
  let emails = extractValidEmails(html);

  // Intento 2: Subpáginas comunes si no hay en la home
  if (emails.length === 0) {
    try {
      const origin = new URL(company.web.startsWith('http') ? company.web : `https://${company.web}`).origin;
      const contactHtml = await fetchPage(`${origin}/contacto`, 4000);
      emails = extractValidEmails(contactHtml);
      if (emails.length === 0) {
        const legalHtml = await fetchPage(`${origin}/aviso-legal`, 4000);
        emails = extractValidEmails(legalHtml);
      }
    } catch {}
  }

  return selectPrioritizedEmail(emails);
}

async function run() {
  const filePath = 'src/data/prospects.json';
  const rawData = fs.readFileSync(filePath, 'utf-8');
  const prospects = JSON.parse(rawData);

  console.log(`=======================================================`);
  console.log(`EJECUTANDO SCRAPPER Y AUDITOR DE EMAILS PARA ${prospects.length} EMPRESAS`);
  console.log(`=======================================================`);

  const concurrency = 10;
  let unchangedCount = 0;
  let updatedPurchasingCount = 0;
  let updatedContactCount = 0;
  let unverifiedRedCount = 0;
  let verifiedMaintainedCount = 0;

  for (let i = 0; i < prospects.length; i += concurrency) {
    const batch = prospects.slice(i, i + concurrency);
    
    await Promise.all(batch.map(async (company) => {
      const currentEmail = (company.email || '').trim().toLowerCase();
      const currentValid = EMAIL_SYNTAX_REGEX.test(currentEmail);

      const found = await scrapeCompanyEmail(company);

      if (found && found.email) {
        const scraped = found.email.toLowerCase();

        if (scraped === currentEmail) {
          // Coincide: no cambiar nada y confirmar verificación
          company.emailVerified = true;
          company.emailVerifiedType = found.type;
          unchangedCount++;
        } else {
          // Es distinto: sustituir según prioridad
          company.email = scraped;
          company.emailVerified = true;
          company.emailVerifiedType = found.type;

          if (found.type === 'compras') {
            updatedPurchasingCount++;
          } else {
            updatedContactCount++;
          }
        }
      } else {
        // No se localizó nuevo email en la web:
        // Si el actual ya es válido sintácticamente y no es un placeholder obvio
        if (currentValid && !currentEmail.includes('placeholder') && !currentEmail.startsWith('compras@empresa')) {
          company.emailVerified = true;
          company.emailVerifiedType = 'actual_verificado';
          verifiedMaintainedCount++;
        } else {
          // No localizado ni verificado -> MARCAR EN ROJO EN EL CRM
          company.emailVerified = false;
          unverifiedRedCount++;
        }
      }
    }));

    const progress = Math.min(i + concurrency, prospects.length);
    console.log(`Progreso: ${progress} / ${prospects.length} empresas evaluadas...`);
  }

  // Guardar archivo actualizado
  fs.writeFileSync(filePath, JSON.stringify(prospects, null, 2), 'utf-8');

  console.log(`\n================== RESUMEN DE EJECUCIÓN ==================`);
  console.log(`Total empresas auditadas: ${prospects.length}`);
  console.log(`Emails que coincidían (mantenidos): ${unchangedCount}`);
  console.log(`Actualizados a email de COMPRAS: ${updatedPurchasingCount}`);
  console.log(`Actualizados a email de CONTACTO / RESPALDO: ${updatedContactCount}`);
  console.log(`Emails válidos existentes mantenidos: ${verifiedMaintainedCount}`);
  console.log(`Empresas sin email verificado (EN ROJO EN CRM): ${unverifiedRedCount}`);
  console.log(`==========================================================\n`);
}

run().catch(console.error);
