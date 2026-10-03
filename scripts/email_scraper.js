import fs from 'fs';
import https from 'https';
import http from 'http';
import { URL } from 'url';

/**
 * Script de Scraping de Emails para empresas del CRM con URLs web
 * 
 * Reglas:
 * 1. Validación Sintáctica: r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
 * 2. Criterio de Prioridad:
 *    - 1º Compras: compras, proveedores, purchasing, procurement, facturacion
 *    - 2º Contacto: contacto, info, administracion, secretaria, hola
 *    - 3º Respaldo: primer email válido si ninguno coincide con palabras clave
 * 3. Si coincide con el de la BD, no tocar.
 * 4. Si es distinto, sustituir primero por compras, y si no por contacto/respaldo.
 * 5. Si no se localiza email verificado, marcar como sin verificar ('emailVerified: false' / rojo).
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

/**
 * Realiza una petición GET HTTP/HTTPS con timeout y siguiendo redirecciones
 */
function fetchUrl(targetUrl, timeoutMs = 8000, maxRedirects = 3) {
  return new Promise((resolve) => {
    if (!targetUrl || targetUrl === 'No disponible') return resolve(null);
    let fullUrl = targetUrl;
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
          return resolve(fetchUrl(redirectUrl, timeoutMs, maxRedirects - 1));
        }

        if (res.statusCode !== 200) {
          res.resume();
          return resolve(null);
        }

        let data = '';
        res.setEncoding('utf-8');
        res.on('data', chunk => {
          data += chunk;
          if (data.length > 1000000) { // Límite de 1MB para rendimiento
            req.destroy();
            resolve(data);
          }
        });
        res.on('end', () => resolve(data));
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

/**
 * Extrae y valida correos de un texto HTML
 */
function extractValidEmails(html) {
  if (!html) return [];
  const matches = html.match(EMAIL_SCRAPE_REGEX) || [];
  const validSet = new Set();

  for (let match of matches) {
    let clean = match.toLowerCase().trim();
    // Limpieza de caracteres de puntuación al final
    clean = clean.replace(/^[.,;:\s]+|[.,;:\s]+$/g, '');
    
    // 1. Validación Sintáctica Estricta
    if (!EMAIL_SYNTAX_REGEX.test(clean)) continue;

    // Filtros de extensiones de archivos y basura común
    if (IGNORE_EXTENSIONS.some(ext => clean.endsWith(ext))) continue;
    if (IGNORE_EMAILS.some(ign => clean.includes(ign))) continue;

    validSet.add(clean);
  }

  return Array.from(validSet);
}

/**
 * Aplica el criterio de prioridad para seleccionar el mejor email
 */
function selectBestEmail(emails) {
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

  // 3º Respaldo: El primer email válido disponible
  return { email: emails[0], type: 'respaldo' };
}

/**
 * Ejecutor principal por lotes para no saturar la red ni bloquear
 */
export async function scrapeBatch(companies, concurrency = 5) {
  const results = [];
  
  for (let i = 0; i < companies.length; i += concurrency) {
    const slice = companies.slice(i, i + concurrency);
    const promises = slice.map(async (p) => {
      if (!p.web || p.web === 'No disponible') {
        return {
          id: p.id,
          name: p.name,
          currentEmail: p.email,
          scrapedEmail: null,
          action: 'no_web'
        };
      }

      // 1. Scraping de la página de inicio
      let html = await fetchUrl(p.web, 6000);
      let emails = extractValidEmails(html);

      // Si no encuentra en la home, probar páginas típicas: /contacto, /aviso-legal
      if (emails.length === 0) {
        try {
          const origin = new URL(p.web.startsWith('http') ? p.web : `https://${p.web}`).origin;
          const contactHtml = await fetchUrl(`${origin}/contacto`, 4000);
          emails = extractValidEmails(contactHtml);
          if (emails.length === 0) {
            const legalHtml = await fetchUrl(`${origin}/aviso-legal`, 4000);
            emails = extractValidEmails(legalHtml);
          }
        } catch {}
      }

      const best = selectBestEmail(emails);

      return {
        id: p.id,
        name: p.name,
        currentEmail: p.email,
        scrapedEmail: best ? best.email : null,
        scrapedType: best ? best.type : null,
        allFound: emails
      };
    });

    const batchRes = await Promise.all(promises);
    results.push(...batchRes);
    console.log(`Procesadas ${results.length} / ${companies.length} empresas...`);
  }

  return results;
}

// Si se ejecuta directamente desde node
if (process.argv[1]?.endsWith('email_scraper.js')) {
  (async () => {
    const raw = fs.readFileSync('src/data/prospects.json', 'utf-8');
    const prospects = JSON.parse(raw);
    console.log(`Iniciando Scraper para ${prospects.length} empresas...`);
    
    // Ejecutar sobre los primeros para demostración rápida y reporte
    const results = await scrapeBatch(prospects.slice(0, 30), 6);
    fs.writeFileSync('scripts/scrape_sample_results.json', JSON.stringify(results, null, 2));
    console.log('Resultados de muestra guardados en scripts/scrape_sample_results.json');
  })();
}
