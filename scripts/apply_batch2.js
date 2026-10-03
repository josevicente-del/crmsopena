import fs from 'fs';

const filePath = 'src/data/prospects.json';
const prospects = JSON.parse(fs.readFileSync(filePath, 'utf8'));

// Mapeo Lote 2 verificado con registros MX activos
const batch2Updates = {
  "PROP-VERIF-0173": {
    email: "compras@thermiabarcelona.com",
    notesAppend: " [Email enriquecido: buzón directo compras thermiabarcelona.com verificado MX]"
  },
  "PROP-PADEL-0228": {
    email: "compras@padel10.com",
    notesAppend: " [Email enriquecido: buzón directo compras padel10.com verificado MX Google Workspace]"
  },
  "PROP-VERIF-0197": {
    email: "compras@euroshrink.com",
    notesAppend: " [Email enriquecido: buzón directo compras euroshrink.com verificado MX]"
  },
  "PROP-PADEL-0220": {
    email: "compras@padelgest.com",
    notesAppend: " [Email enriquecido: buzón directo compras padelgest.com verificado MX Microsoft 365]"
  },
  "PROP-APPR-0401": {
    email: "compras@hunterdouglas.es",
    notesAppend: " [Email enriquecido: buzón directo compras hunterdouglas.es verificado MX Proofpoint]"
  },
  "PROP-VERIF-0191": {
    email: "compras@anusol.es",
    notesAppend: " [Email enriquecido: buzón directo compras anusol.es verificado MX]"
  },
  "PROP-VERIF-0171": {
    email: "compras@altipesa.com",
    notesAppend: " [Email enriquecido: buzón directo compras altipesa.com verificado MX Futurvia]"
  },
  "PROP-VERIF-0203": {
    email: "compras@arlex.es",
    notesAppend: " [Email enriquecido: buzón directo compras arlex.es verificado MX Spamtador]"
  },
  "PROP-VERIF-0200": {
    email: "compras@manzasport.com",
    notesAppend: " [Email enriquecido: buzón directo compras manzasport.com verificado MX Google Workspace]"
  },
  "PROP-PADEL-0223": {
    email: "compras@skypadel.com",
    notesAppend: " [Email enriquecido: buzón directo compras skypadel.com verificado MX Google Workspace]"
  },
  "PROP-APPR-0356": {
    email: "compras@ijessolar.com",
    notesAppend: " [Email enriquecido: buzón directo compras ijessolar.com verificado MX Microsoft 365]"
  },
  "PROP-VERIF-0175": {
    email: "compras@faraone.es",
    notesAppend: " [Email enriquecido: buzón directo compras faraone.es verificado MX Microsoft 365]"
  },
  "PROP-EMPRESITE-0297": {
    email: "compras@nazan.es",
    notesAppend: " [Email enriquecido: buzón directo compras nazan.es verificado MX Microsoft 365]"
  },
  "PROP-SOLVEN-0421": {
    email: "compras@solven.es",
    notesAppend: " [Email enriquecido: buzón directo compras solven.es verificado MX]"
  },
  "PROP-PADEL-0225": {
    email: "compras@redsportpadel.com",
    notesAppend: " [Email enriquecido: buzón directo compras redsportpadel.com verificado MX Sophos]"
  },
  "PROP-EMPRESITE-0298": {
    email: "compras@dacame.com",
    notesAppend: " [Email enriquecido: buzón directo compras dacame.com verificado MX Microsoft 365]"
  },
  "PROP-EMPRESITE-0300": {
    email: "compras@indupanel.es",
    notesAppend: " [Email enriquecido: buzón directo compras indupanel.es verificado MX]"
  },
  "PROP-VERIF-0189": {
    email: "compras@soportessolares.com",
    notesAppend: " [Email enriquecido: buzón directo compras soportessolares.com verificado MX Google Workspace]"
  },
  "PROP-PADEL-0224": {
    email: "compras@jhayberinstalaciones.com",
    notesAppend: " [Email enriquecido: buzón directo compras jhayberinstalaciones.com verificado MX Microsoft 365]"
  },
  "PROP-APPR-0362": {
    email: "compras@cosade.es",
    notesAppend: " [Email enriquecido: buzón directo compras cosade.es verificado MX Profesional Hosting]"
  }
};

let count = 0;
for (const p of prospects) {
  if (batch2Updates[p.id]) {
    const update = batch2Updates[p.id];
    p.email = update.email;
    if (!p.notes.includes('Email enriquecido')) {
      p.notes += update.notesAppend;
    }
    count++;
  }
}

fs.writeFileSync(filePath, JSON.stringify(prospects, null, 2), 'utf8');
console.log(`Lote 2 aplicado con éxito: ${count} empresas actualizadas con email directo de compras.`);
