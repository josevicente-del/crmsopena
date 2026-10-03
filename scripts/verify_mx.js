// Script de verificación MX y enriquecimiento de emails de compras
import dns from 'dns/promises';

const domains = [
  'gsolarsteel.com',
  'axialstructural.com',
  'tvitecglass.com',
  'gaviota.com',
  'alucoil.com',
  'benito.com',
  'garciafaura.com',
  'kimak.com',
  'isopractic.com',
  'isopan.es',
  'alumedsistemas.com',
  'laviuda.es',
  'llaza.com',
  'multipanel.es',
  'indusmetaltorres.com',
  'broncesval.com',
  'grupochamartin.com',
  'prausa.com',
  'motedis.es'
];

async function verifyMx() {
  console.log('--- INICIO VERIFICACIÓN DNS MX ---');
  for (const d of domains) {
    try {
      const records = await dns.resolveMx(d);
      const primary = records.sort((a, b) => a.priority - b.priority)[0];
      console.log(`[VALID] ${d} -> ${primary.exchange}`);
    } catch (err) {
      console.log(`[ERROR] ${d} -> ${err.code}`);
    }
  }
}

verifyMx();
