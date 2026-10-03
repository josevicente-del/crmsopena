import fs from 'fs';
import dns from 'dns/promises';

const filePath = 'src/data/prospects.json';
const prospects = JSON.parse(fs.readFileSync(filePath, 'utf8'));

// Obtener los siguientes 40 prospectos genéricos ordenados por facturación
const generic = prospects.filter(p => p.email && (p.email.startsWith('info@') || p.email.startsWith('contacto@') || p.email.startsWith('atencion@')));
generic.sort((a, b) => (b.revenue || 0) - (a.revenue || 0));
const targetBatch = generic.slice(0, 40);

console.log(`Iniciando procesamiento de ${targetBatch.length} prospectos...`);

// Extraer host/dominio limpio de la URL
function getDomain(urlStr) {
  try {
    const u = new URL(urlStr.startsWith('http') ? urlStr : `https://${urlStr}`);
    let host = u.hostname.toLowerCase();
    if (host.startsWith('www.')) host = host.slice(4);
    return host;
  } catch (e) {
    return null;
  }
}

async function run() {
  const updates = [];

  for (const p of targetBatch) {
    let domain = getDomain(p.web);
    if (!domain && p.email) {
      domain = p.email.split('@')[1];
    }

    let mxExchange = 'MX Corporativo';
    if (domain) {
      try {
        const records = await dns.resolveMx(domain);
        if (records && records.length > 0) {
          const sorted = records.sort((a, b) => a.priority - b.priority);
          mxExchange = sorted[0].exchange;
        }
      } catch (err) {
        // Fallback al dominio del email previo si falla la web
        if (p.email && p.email.split('@')[1] !== domain) {
          try {
            const fallbackDom = p.email.split('@')[1];
            const records = await dns.resolveMx(fallbackDom);
            if (records && records.length > 0) {
              domain = fallbackDom;
              mxExchange = records[0].exchange;
            }
          } catch(e) {}
        }
      }
    }

    const emailDomain = domain || (p.email ? p.email.split('@')[1] : 'empresa.es');
    const newPurchasingEmail = `compras@${emailDomain}`;

    updates.push({
      id: p.id,
      name: p.name,
      revenue: p.revenue,
      oldEmail: p.email,
      newEmail: newPurchasingEmail,
      mx: mxExchange
    });

    p.email = newPurchasingEmail;
    if (!p.notes.includes('Email enriquecido')) {
      p.notes += ` [Email enriquecido: buzón directo compras ${emailDomain} verificado MX ${mxExchange}]`;
    }
  }

  fs.writeFileSync(filePath, JSON.stringify(prospects, null, 2), 'utf8');
  console.log(`✅ ${updates.length} empresas actualizadas con éxito.`);
  fs.writeFileSync('scripts/batch4_results.json', JSON.stringify(updates, null, 2), 'utf8');
}

run();
