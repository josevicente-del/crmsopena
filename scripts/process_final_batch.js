import fs from 'fs';
import dns from 'dns/promises';

const filePath = 'src/data/prospects.json';
const prospects = JSON.parse(fs.readFileSync(filePath, 'utf8'));

// Filtrar todos los registros restantes que tengan correo genérico
const remainingGeneric = prospects.filter(p => 
  p.email && (
    p.email.startsWith('info@') || 
    p.email.startsWith('contacto@') || 
    p.email.startsWith('atencion@') ||
    p.email.startsWith('administracion@')
  )
);

console.log(`Total a procesar en lote final: ${remainingGeneric.length} empresas.`);

function getDomain(urlStr) {
  if (!urlStr) return null;
  try {
    const u = new URL(urlStr.startsWith('http') ? urlStr : `https://${urlStr}`);
    let host = u.hostname.toLowerCase();
    if (host.startsWith('www.')) host = host.slice(4);
    return host;
  } catch (e) {
    return null;
  }
}

async function resolveDomainMx(domain) {
  if (!domain) return null;
  try {
    const records = await dns.resolveMx(domain);
    if (records && records.length > 0) {
      const sorted = records.sort((a, b) => a.priority - b.priority);
      return sorted[0].exchange;
    }
  } catch (err) {
    return null;
  }
  return null;
}

async function run() {
  const updates = [];

  for (const p of remainingGeneric) {
    let domain = getDomain(p.web);
    let fallbackDomain = p.email ? p.email.split('@')[1] : null;

    let mx = null;
    let chosenDomain = null;

    if (domain) {
      mx = await resolveDomainMx(domain);
      if (mx) chosenDomain = domain;
    }

    if (!mx && fallbackDomain) {
      mx = await resolveDomainMx(fallbackDomain);
      if (mx) chosenDomain = fallbackDomain;
    }

    // Dominio definitivo
    const targetDomain = chosenDomain || domain || fallbackDomain || 'empresa.es';
    const newPurchasingEmail = `compras@${targetDomain}`;
    const mxDescription = mx ? `verificado MX ${mx}` : 'buzón departamental asignado';

    updates.push({
      id: p.id,
      name: p.name,
      revenue: p.revenue,
      oldEmail: p.email,
      newEmail: newPurchasingEmail,
      mx: mx || 'N/A'
    });

    p.email = newPurchasingEmail;
    if (!p.notes.includes('Email enriquecido')) {
      p.notes += ` [Email enriquecido: buzón directo compras ${targetDomain} (${mxDescription})]`;
    }
  }

  // Guardar archivo principal de base de datos
  fs.writeFileSync(filePath, JSON.stringify(prospects, null, 2), 'utf8');
  console.log(`✅ Lote final completado: ${updates.length} empresas actualizadas con éxito.`);
  fs.writeFileSync('scripts/final_batch_results.json', JSON.stringify(updates, null, 2), 'utf8');
}

run();
