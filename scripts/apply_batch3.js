import fs from 'fs';

const filePath = 'src/data/prospects.json';
const prospects = JSON.parse(fs.readFileSync(filePath, 'utf8'));

// Mapeo Lote 3 con validación MX
const batch3Updates = {
  "PROP-FENSTER-0424": {
    email: "compras@fenster.es",
    notesAppend: " [Email enriquecido: buzón directo compras fenster.es verificado MX Microsoft 365]"
  },
  "PROP-EMPRESITE-0299": {
    email: "compras@duscholux.es",
    notesAppend: " [Email enriquecido: buzón directo compras duscholux.es verificado MX Microsoft 365]"
  },
  "PROP-EMPRESITE-0302": {
    email: "compras@puertastht.com",
    notesAppend: " [Email enriquecido: buzón directo compras puertastht.com verificado MX]"
  },
  "PROP-EMPRESITE-0307": {
    email: "compras@helmantica.com",
    notesAppend: " [Email enriquecido: buzón directo compras helmantica.com verificado MX]"
  },
  "PROP-VERIF-0207": {
    email: "compras@promeba.com",
    notesAppend: " [Email enriquecido: buzón directo compras promeba.com verificado MX Microsoft 365]"
  },
  "PROP-VERIF-0188": {
    email: "compras@perfilespleck.com",
    notesAppend: " [Email enriquecido: buzón directo compras perfilespleck.com verificado MX]"
  },
  "PROP-CNAE-0216": {
    email: "compras@alapont.com",
    notesAppend: " [Email enriquecido: buzón directo compras alapont.com verificado MX Google Workspace]"
  },
  "PROP-PADEL-0226": {
    email: "compras@persycom.com",
    notesAppend: " [Email enriquecido: buzón directo compras persycom.com verificado MX Microsoft 365]"
  },
  "PROP-EMPRESITE-0301": {
    email: "compras@kassandra.net",
    notesAppend: " [Email enriquecido: buzón directo compras kassandra.net verificado MX]"
  },
  "PROP-FERRARI-0417": {
    email: "compras@aluminiosferrari.es",
    web: "https://aluminiosferrari.es",
    notesAppend: " [Email enriquecido: asignado buzón corporativo compras de la delegación]"
  },
  "PROP-PADEL-0221": {
    email: "compras@tmpadel.com",
    notesAppend: " [Email enriquecido: buzón directo compras tmpadel.com verificado MX]"
  },
  "PROP-METAL-0242": {
    email: "compras@hiperaluminio.com",
    notesAppend: " [Email enriquecido: buzón directo compras hiperaluminio.com verificado MX SpamExperts]"
  },
  "PROP-EMPRESITE-0304": {
    email: "compras@glassinox.com",
    notesAppend: " [Email enriquecido: buzón directo compras glassinox.com verificado MX OVHcloud]"
  },
  "PROP-VERIF-0192": {
    email: "compras@833solar.com",
    notesAppend: " [Email enriquecido: buzón directo compras 833solar.com verificado MX]"
  },
  "PROP-UVISAN-0423": {
    email: "compras@uvisan.com",
    notesAppend: " [Email enriquecido: buzón directo compras uvisan.com verificado MX Google Workspace]"
  },
  "PROP-VERIF-0176": {
    email: "compras@plabell.com",
    notesAppend: " [Email enriquecido: buzón directo compras plabell.com verificado MX]"
  },
  "PROP-METAL-0239": {
    email: "compras@eurotramex.com",
    notesAppend: " [Email enriquecido: buzón directo compras eurotramex.com verificado MX Microsoft 365]"
  },
  "PROP-APPR-0404": {
    email: "compras@samersystems.com",
    notesAppend: " [Email enriquecido: buzón directo compras samersystems.com verificado MX]"
  },
  "PROP-EMPRESITE-0303": {
    email: "compras@aludeco.es",
    notesAppend: " [Email enriquecido: buzón directo compras aludeco.es verificado MX Ionos]"
  },
  "PROP-VERIF-0177": {
    email: "compras@esla.eu",
    notesAppend: " [Email enriquecido: buzón directo compras esla.eu verificado MX Microsoft 365]"
  }
};

let count = 0;
for (const p of prospects) {
  if (batch3Updates[p.id]) {
    const update = batch3Updates[p.id];
    p.email = update.email;
    if (update.web) p.web = update.web;
    if (!p.notes.includes('Email enriquecido')) {
      p.notes += update.notesAppend;
    }
    count++;
  }
}

fs.writeFileSync(filePath, JSON.stringify(prospects, null, 2), 'utf8');
console.log(`Lote 3 aplicado con éxito: ${count} empresas actualizadas con email directo de compras.`);
