import dns from 'dns/promises';

const domains = [
  'fenster.es',
  'duscholux.es',
  'puertastht.com',
  'helmantica.com',
  'promeba.com',
  'perfilespleck.com',
  'alapont.com',
  'persycom.com',
  'kassandra.net',
  'aluminiosferrari.com',
  'tmpadel.com',
  'hiperaluminio.com',
  'glassinox.com',
  '833solar.com',
  'uvisan.com',
  'plabell.com',
  'eurotramex.com',
  'samersystems.com',
  'aludeco.es',
  'esla.eu'
];

async function verify() {
  console.log('--- VERIFICACIÓN LOTE 3 ---');
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
