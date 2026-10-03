import dns from 'dns/promises';

const domains = [
  'thermiabarcelona.com',
  'padel10.com',
  'euroshrink.com',
  'padelgest.com',
  'hunterdouglas.es',
  'anusol.es',
  'altipesa.com',
  'arlex.es',
  'manzasport.com',
  'skypadel.com',
  'ijessolar.com',
  'faraone.es',
  'nazan.es',
  'solven.es',
  'redsportpadel.com',
  'dacame.com',
  'indupanel.es',
  'soportessolares.com',
  'jhayberinstalaciones.com',
  'cosade.es'
];

async function verify() {
  console.log('--- VERIFICACIÓN LOTE 2 ---');
  for (const d of domains) {
    try {
      const records = await dns.resolveMx(d);
      const primary = records.sort((a, b) => a.priority - b.priority)[0];
      console.log(`[OK] ${d} -> ${primary.exchange}`);
    } catch (e) {
      console.log(`[ERR] ${d} -> ${e.code}`);
    }
  }
}

verify();
