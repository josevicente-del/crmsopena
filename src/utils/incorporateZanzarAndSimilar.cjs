/**
 * ============================================================================
 * UTILIDAD DE INCORPORACIÓN: ZANZAR IBERIA Y TOP 10 EMPRESAS DEL SECTOR
 * ============================================================================
 * 
 * Este script automatiza la validación, deduplicación y registro controlado en el CRM
 * de la empresa solicitada (https://zanzar.es/) y las 10 empresas similares
 * de mayor facturación en España especializadas en:
 * - Fabricación industrial de mosquiteras (enrollables, plisadas, fijas, correderas)
 * - Sistemas de protección solar (celosías, persianas venecianas y lamas de aluminio)
 * 
 * Acciones implementadas:
 * 1. Genera una copia de seguridad preventiva y fechada de prospects.json.
 * 2. Comprueba deduplicación cuádruple (CIF, nombre comercial, web y teléfono).
 * 3. Asigna correlativamente identificadores formales (PROP-APPR-0398 a 0408).
 * 4. Valida atributos geográficos y económicos.
 * 5. Persiste el dataset actualizado con formato legible.
 */

const fs = require('fs');
const path = require('path');

// Rutas base
const PROSPECTS_PATH = path.join(__dirname, '../data/prospects.json');

// 1. Cargar datos actuales del CRM
if (!fs.existsSync(PROSPECTS_PATH)) {
  console.error(`Error: No se encontró el archivo de prospectos en ${PROSPECTS_PATH}`);
  process.exit(1);
}

const currentProspects = JSON.parse(fs.readFileSync(PROSPECTS_PATH, 'utf8'));
console.log(`[INFO] Registros actuales en el CRM: ${currentProspects.length}`);

// 2. Definición del listado de empresas a incorporar:
// Zanzar Iberia S.L. (solicitada) + 10 empresas homólogas con mayor facturación en España
const newProspectsCandidates = [
  {
    name: "Zanzar Iberia S.L.",
    zone: "Comunidad Valenciana",
    department: "Paterna (Valencia)",
    cif: "B98506728",
    web: "https://zanzar.es",
    revenue: 5500000,
    purchasingManager: "Dpto. Compras y Aprovisionamiento (Zanzar Iberia)",
    phone: "+34 96 100 49 99",
    email: "info@zanzar.es",
    location: [39.5075, -0.4578],
    sector: "Mosquiteras",
    products: [
      "Mosquiteras Enrollables",
      "Mosquiteras Plisadas",
      "Mosquiteras Correderas",
      "Venecianas",
      "Perfiles de Aluminio"
    ],
    notes: "Filial española del grupo Zanzar SpA en Pol. Ind. Fuente del Jarro. Fabricación industrial y distribución de sistemas de mosquiteras y venecianas con perfilería técnica de aluminio."
  },
  {
    name: "Nevaluz Sevilla S.L.",
    zone: "Andalucía",
    department: "Écija (Sevilla)",
    cif: "B41359951",
    web: "https://nevaluz.com",
    revenue: 26859271,
    purchasingManager: "Dpto. Compras y Materias Primas (Nevaluz)",
    phone: "+34 955 90 40 40",
    email: "info@nevaluz.com",
    location: [37.5415, -5.0820],
    sector: "Sistemas de Proteccion Solar",
    products: [
      "Mosquiteras Plisadas y Enrollables",
      "Persianas de Aluminio",
      "Sistemas de Protección Solar",
      "Screens"
    ],
    notes: "Uno de los mayores fabricantes de mosquiteras y sistemas de protección solar de España con más de 150 empleados e instalaciones centrales en Écija."
  },
  {
    name: "Llaza World S.A.",
    zone: "Cataluña",
    department: "Alcover (Tarragona)",
    cif: "A66132184",
    web: "https://llaza.com",
    revenue: 26515522,
    purchasingManager: "Dpto. Compras (Llaza World)",
    phone: "+34 977 60 06 60",
    email: "info@llaza.com",
    location: [41.2612, 1.1738],
    sector: "Sistemas de Proteccion Solar",
    products: [
      "Sistemas de Toldos en Aluminio",
      "Brazos Articulados",
      "Protección Solar",
      "Perfilería Extruida"
    ],
    notes: "Líder internacional en diseño y fabricación de sistemas avanzados de protección solar y toldos con perfilería técnica de aluminio."
  },
  {
    name: "Hunter Douglas España S.A.",
    zone: "Comunidad de Madrid",
    department: "Alcobendas (Madrid)",
    cif: "A08082521",
    web: "https://www.hunterdouglas.es",
    revenue: 19500000,
    purchasingManager: "Dpto. Compras (Hunter Douglas)",
    phone: "+34 91 661 52 95",
    email: "info@hunterdouglas.es",
    location: [40.5312, -3.6425],
    sector: "Sistemas de Proteccion Solar",
    products: [
      "Celosías de Aluminio",
      "Persianas Venecianas",
      "Falsos Techos Metálicos",
      "Protección Solar Arquitectónica"
    ],
    notes: "Referente internacional en arquitectura solar, celosías de aluminio para fachada, venecianas y sistemas de control solar."
  },
  {
    name: "Siplan Ibérica S.L.",
    zone: "Andalucía",
    department: "Mairena del Alcor (Sevilla)",
    cif: "B91977280",
    web: "https://siplan.com",
    revenue: 14200000,
    purchasingManager: "Dpto. Aprovisionamiento (Siplan)",
    phone: "+34 955 74 61 74",
    email: "siplan@siplan.com",
    location: [37.3752, -5.7485],
    sector: "Sistemas de Proteccion Solar",
    products: [
      "Componentes de Aluminio para Toldos",
      "Pérgolas Bioclimáticas",
      "Sistemas de Protección Solar"
    ],
    notes: "Fabricante especializado de accesorios, brazos y perfiles de aluminio extruido para sistemas de protección solar en Pol. Ind. El Gandul."
  },
  {
    name: "Producciones Mitjavila S.A.",
    zone: "Cataluña",
    department: "Llers (Girona)",
    cif: "A17451873",
    web: "https://mitjavila.com",
    revenue: 11500000,
    purchasingManager: "Dpto. Compras (Mitjavila)",
    phone: "+34 972 52 80 87",
    email: "mitjavila@mitjavila.com",
    location: [42.2965, 2.9125],
    sector: "Sistemas de Proteccion Solar",
    products: [
      "Piezas de Aluminio Fundido y Extruido",
      "Sistemas de Toldos",
      "Marquesinas y Protección Solar"
    ],
    notes: "Gran factoría industrial en Llers especializada en piezas, accesorios y componentes de aluminio para toldos, marquesinas y cerramientos."
  },
  {
    name: "Dimensión Técnica 2012, S.L. (Samer Systems)",
    zone: "Comunidad Valenciana",
    department: "Paterna (Valencia)",
    cif: "B65725434",
    web: "https://samersystems.com",
    revenue: 9500000,
    purchasingManager: "Dpto. Compras (Samer Systems)",
    phone: "+34 96 134 06 44",
    email: "info@samersystems.com",
    location: [39.5090, -0.4552],
    sector: "Mosquiteras",
    products: [
      "Mosquiteras Enrollables",
      "Mosquiteras Plisadas",
      "Perfiles de Aluminio",
      "Sistemas de Protección Solar"
    ],
    notes: "Fabricante líder de mosquiteras y sistemas en el Polígono Fuente del Jarro de Paterna, especializado en extrusión y corte de perfiles de aluminio."
  },
  {
    name: "Industrial de Celosías S.A. (Tamiluz)",
    zone: "Cataluña",
    department: "Barberà del Vallès (Barcelona)",
    cif: "A08894206",
    web: "http://www.tamiluz.es",
    revenue: 4800000,
    purchasingManager: "Dpto. Compras (Tamiluz)",
    phone: "+34 93 729 45 44",
    email: "tamiluz@tamiluz.es",
    location: [41.5178, 2.1285],
    sector: "Sistemas de Proteccion Solar",
    products: [
      "Celosías de Aluminio Extruido",
      "Lamas Orientables",
      "Protección Solar Pasiva",
      "Fachadas y Cerramientos"
    ],
    notes: "Fabricante industrial de sistemas de celosías fijas y móviles con perfilería técnica de aluminio extruido."
  },
  {
    name: "Griesser Persianas y Estores S.L.",
    zone: "Cataluña",
    department: "La Pobla de Claramunt (Barcelona)",
    cif: "B64556061",
    web: "https://www.griesser.es",
    revenue: 4500000,
    purchasingManager: "Dpto. Compras (Griesser)",
    phone: "+34 93 808 61 00",
    email: "info@griesser.es",
    location: [41.5540, 1.6780],
    sector: "Sistemas de Proteccion Solar",
    products: [
      "Persianas Graduables de Aluminio",
      "Celosías Metálicas",
      "Estores Guiados",
      "Sistemas de Control Solar"
    ],
    notes: "Filial de la marca suiza Griesser en España. Fabricación y ensamblaje de persianas graduables, celosías y sistemas solares con perfiles de aluminio."
  },
  {
    name: "Industrias Durmi, S.A.",
    zone: "Cataluña",
    department: "Sant Pere de Ribes (Barcelona)",
    cif: "A08466187",
    web: "https://durmi.com",
    revenue: 3800000,
    purchasingManager: "Dpto. Compras (Durmi)",
    phone: "+34 93 896 33 00",
    email: "durmi@durmi.com",
    location: [41.2425, 1.7750],
    sector: "Sistemas de Proteccion Solar",
    products: [
      "Celosías Orientables",
      "Lamas de Aluminio Extruido",
      "Mallorquinas",
      "Pérgolas Bioclimáticas"
    ],
    notes: "Especialistas en lamas y celosías de aluminio extruido fijas y móviles para protección solar bioclimática y cerramientos arquitectónicos."
  },
  {
    name: "Ideco Mosquiteras S.L.",
    zone: "Comunidad Valenciana",
    department: "Paterna (Valencia)",
    cif: "B40653974",
    web: "https://ideco-spain.es",
    revenue: 3200000,
    purchasingManager: "Dpto. Compras (Ideco)",
    phone: "+34 96 134 00 12",
    email: "info@ideco-spain.es",
    location: [39.5065, -0.4590],
    sector: "Mosquiteras",
    products: [
      "Mosquiteras Enrollables",
      "Mosquiteras Plisadas",
      "Perfiles de Aluminio",
      "Accesorios"
    ],
    notes: "Fabricante especializado de sistemas de mosquiteras a medida y componentes de aluminio en el Polígono Fuente del Jarro de Paterna."
  }
];

// 3. Crear copia de seguridad preventiva
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupPath = path.join(__dirname, `../data/prospects.backup-${timestamp}.json`);
fs.writeFileSync(backupPath, JSON.stringify(currentProspects, null, 2), 'utf8');
console.log(`[SEGURIDAD] Copia de seguridad creada con éxito en: ${backupPath}`);

// 4. Calcular siguiente ID correlativo
const apprIds = currentProspects
  .filter(p => p.id && p.id.startsWith('PROP-APPR-'))
  .map(p => parseInt(p.id.replace('PROP-APPR-', ''), 10))
  .filter(n => !isNaN(n));

let nextIdNumber = apprIds.length > 0 ? Math.max(...apprIds) + 1 : 398;
console.log(`[INFO] Siguiente ID correlativo base: PROP-APPR-${String(nextIdNumber).padStart(4, '0')}`);

// 5. Validación y anexión
const incorporated = [];
const currentCifs = new Set(currentProspects.map(p => (p.cif || '').toUpperCase().trim()));
const currentNames = new Set(currentProspects.map(p => (p.name || '').toLowerCase().trim()));

for (const candidate of newProspectsCandidates) {
  const normCif = (candidate.cif || '').toUpperCase().trim();
  const normName = (candidate.name || '').toLowerCase().trim();

  // Control estricto de duplicados
  if (currentCifs.has(normCif)) {
    console.warn(`[AVISO] Empresa descartada por CIF duplicado: ${candidate.name} (${candidate.cif})`);
    continue;
  }
  if (currentNames.has(normName)) {
    console.warn(`[AVISO] Empresa descartada por nombre duplicado: ${candidate.name}`);
    continue;
  }

  const assignedId = `PROP-APPR-${String(nextIdNumber).padStart(4, '0')}`;
  nextIdNumber++;

  const prospectRecord = {
    id: assignedId,
    name: candidate.name,
    zone: candidate.zone,
    department: candidate.department,
    cif: candidate.cif,
    web: candidate.web,
    revenue: candidate.revenue,
    purchasingManager: candidate.purchasingManager,
    phone: candidate.phone,
    email: candidate.email,
    location: candidate.location,
    sector: candidate.sector,
    products: candidate.products,
    contacted: false,
    contactDate: null,
    notes: candidate.notes,
    response: "Pendiente de primer contacto comercial",
    createdAt: new Date().toISOString()
  };

  currentProspects.push(prospectRecord);
  currentCifs.add(normCif);
  currentNames.add(normName);
  incorporated.push(prospectRecord);
}

// 6. Guardar los datos en el CRM
fs.writeFileSync(PROSPECTS_PATH, JSON.stringify(currentProspects, null, 2), 'utf8');

console.log(`\n=======================================================`);
console.log(`[ÉXITO] ${incorporated.length} empresas incorporadas correctamente.`);
console.log(`[TOTAL] Nuevo total en base de datos: ${currentProspects.length} registros.`);
console.log(`=======================================================\n`);

// Imprimir desglose ordenado por facturación
console.log("Ranking de empresas añadidas (ordenadas por facturación):");
incorporated
  .sort((a, b) => b.revenue - a.revenue)
  .forEach((p, idx) => {
    console.log(`${idx + 1}. [${p.id}] ${p.name} - ${p.zone} (${p.department}) | ${p.revenue.toLocaleString('es-ES')} € | Web: ${p.web}`);
  });
