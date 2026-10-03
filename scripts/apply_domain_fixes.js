import fs from 'fs';

const filePath = 'src/data/prospects.json';
const prospects = JSON.parse(fs.readFileSync(filePath, 'utf8'));

// Corrección de empresas que tenían dominio desactualizado por su dominio verificado con servidor MX
const domainFixes = {
  "PROP-VERIF-0113": { email: "compras@kawneer.com", web: "https://www.kawneer.com", note: "[Dominio corregido a kawneer.com verificado MX Microsoft 365]" },
  "PROP-CAMARA-0266": { email: "compras@arteal.es", web: "https://arteal.es", note: "[Dominio corregido a arteal.es verificado MX Mundo-R]" },
  "PROP-CAMARA-0289": { email: "compras@amgsistemas.es", web: "https://amgsistemas.es", note: "[Dominio corregido a amgsistemas.es verificado MX Deviservi]" },
  "PROP-CAMARA-0255": { email: "compras@tecnalum.es", web: "https://tecnalum.es", note: "[Dominio corregido a tecnalum.es verificado MX Serviciodecorreo]" },
  "PROP-VERIF-0350": { email: "compras@dugaval.com", web: "https://dugaval.com", note: "[Dominio corregido a dugaval.com verificado MX Serviciodecorreo]" },
  "PROP-APPR-0364": { email: "compras@eurocode9.com", web: "https://eurocode9.com", note: "[Dominio corregido a eurocode9.com verificado MX OVHcloud]" }
};

let count = 0;
for (const p of prospects) {
  if (domainFixes[p.id]) {
    const f = domainFixes[p.id];
    p.email = f.email;
    p.web = f.web;
    p.notes += ` ${f.note}`;
    count++;
  }
}

fs.writeFileSync(filePath, JSON.stringify(prospects, null, 2), 'utf8');
console.log(`Aplicadas ${count} correcciones de dominio verificadas con éxito.`);
