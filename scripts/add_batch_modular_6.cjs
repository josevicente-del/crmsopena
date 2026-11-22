/**
 * scripts/add_batch_modular_6.cjs
 * ---------------------------------------------------------------------
 * Script para incorporar el lote de 6 empresas de Construcción Modular
 * solicitadas por el usuario:
 *  1. Gardiun Techno (Kovyx Outdoor, S.L.) - Madrid
 *  2. Alucasa (Residenciales Móviles, S.A.) - Alicante
 *  3. Atlántida Homes (Entasis Desarrollos, S.L.) - Madrid
 *  4. Anémona Home (Anemona Home Import Europe, S.L.) - Valencia
 *  5. Panelais Producciones, S.A. - Salamanca
 *  6. Sismoha (Sistemas Modulares Habitables, S.L.) - Zaragoza
 *
 * Sector asignado de forma estricta: 'Construcción Modular'
 * PipelineStage: 'Lead'
 * Reutiliza scripts/lib/prospectSync.cjs para garantizar integridad dual
 * (local src/data/prospects.json y Supabase public.prospects con auditoría).
 * ---------------------------------------------------------------------
 */

const { syncProspectBatch } = require('./lib/prospectSync.cjs');

const MODULAR_COMPANIES = [
  {
    id: 'PROP-LEAD26-MODULAR-01',
    name: 'Gardiun Techno (Kovyx Outdoor, S.L.)',
    cif: 'B83904086',
    zone: 'Madrid',
    department: 'Valdemoro (Madrid)',
    city: 'Valdemoro',
    address: 'Avenida de Andalucía, 208, 28341 Valdemoro (Madrid)',
    location: [40.1908, -3.6789],
    phone: '+34 911 345 046',
    email: 'lopd@kovyx.com',
    secondaryEmail: 'info@kovyx.com',
    web: 'https://gardiuntechno.com',
    website: 'https://gardiuntechno.com/contacto',
    revenue: null,
    tier: 'Tier 2',
    sector: 'Construcción Modular',
    products: [
      'Construcciones modulares exteriores y habitables',
      'Garajes, casetas industrializadas y cobertizos metálicos',
      'Soluciones de jardín y almacenaje modular',
      'Estructuras y perfilería técnica de aluminio y metal'
    ],
    profileType: 'Construcción Modular / Módulos Exteriores y Casetas Industrializadas',
    alloy: '6060-T66 / 6063-T5',
    finish: 'Lacado Qualicoat / Galvanizado',
    notes: 'Gama avanzada de construcciones industrializadas y módulos de jardín/exteriores de Kovyx Outdoor S.L. Sede en Valdemoro (Madrid). Tel: +34 911 345 046 / +34 911 345 047. Verificado Nov 2026.',
    certamen: 'Construcción Modular 2026',
    pipelineStage: 'Lead'
  },
  {
    id: 'PROP-LEAD26-MODULAR-02',
    name: 'Alucasa (Residenciales Móviles, S.A.)',
    cif: 'A03191319',
    zone: 'Alicante',
    department: 'Almoradí (Alicante)',
    city: 'Almoradí',
    address: 'Paraje de las Bóvedas, 96 - Polígono El Raiguero, 03160 Almoradí (Alicante)',
    location: [38.1097, -0.7931],
    phone: '+34 965 702 697',
    email: 'info@alucasa.com',
    secondaryEmail: null,
    web: 'https://www.alucasa.com',
    website: 'https://www.alucasa.com/viviendas-moviles/vivienda-prefabricada-2-habitaciones-36-m2-mediterraneo/',
    revenue: null,
    tier: 'Tier 1',
    sector: 'Construcción Modular',
    products: [
      'Viviendas prefabricadas modulares residenciales y vacacionales',
      'Mobile homes y casas móviles de alta gama (Gama Mediterráneo, ZEN Premium)',
      'Bungalows modulares para campings y complejos turísticos',
      'Carpintería exterior de aluminio con doble acristalamiento'
    ],
    profileType: 'Fabricante de Casas Móviles, Bungalows y Viviendas Prefabricadas Modulares',
    alloy: '6060-T66 / 6063-T5',
    finish: 'Lacado Qualicoat Blanco / Gris Antracita',
    notes: 'Fabricante líder fundado en 1977 con sede y fábrica en Almoradí (Alicante). Especialista en viviendas móviles y modulares con perfilería y carpintería exterior de aluminio. Verificado Nov 2026.',
    certamen: 'Construcción Modular 2026',
    pipelineStage: 'Lead'
  },
  {
    id: 'PROP-LEAD26-MODULAR-03',
    name: 'Atlántida Homes (Entasis Desarrollos, S.L.)',
    cif: 'B87569513',
    zone: 'Madrid',
    department: 'Madrid (Madrid)',
    city: 'Madrid',
    address: 'Calle Pez Austral, 2, 28007 Madrid',
    location: [40.4087, -3.6705],
    phone: '+34 914 097 180',
    email: 'hola@atlantidahomes.com',
    secondaryEmail: 'comunicacion@atlantidahomes.com',
    web: 'https://atlantidahomes.com',
    website: 'https://atlantidahomes.com',
    revenue: null,
    tier: 'Tier 1',
    sector: 'Construcción Modular',
    products: [
      'Casas modulares industrializadas de diseño de alta gama',
      'Estructuras de acero y forjados de hormigón armado industrializados',
      'Ventanales y cerramientos de aluminio de altas prestaciones con RPT',
      'Viviendas pasivas y de máxima eficiencia energética (A+)'
    ],
    profileType: 'Construcción Industrializada / Casas Prefabricadas Modulares de Alta Gama',
    alloy: '6060-T66 / 6063-T5',
    finish: 'Lacado Qualicoat / Anodizado arquitectónico',
    notes: 'Empresa de arquitectura y construcción industrializada de viviendas unifamiliares de alta eficiencia energética (Grupo Riofrío). Carpintería exterior de aluminio con rotura de puente térmico y vidrios bajo emisivos. Verificado Nov 2026.',
    certamen: 'Construcción Modular 2026',
    pipelineStage: 'Lead'
  },
  {
    id: 'PROP-LEAD26-MODULAR-04',
    name: 'Anémona Home (Anemona Home Import Europe, S.L.)',
    cif: 'B98954779',
    zone: 'Valencia',
    department: 'Carcaixent (Valencia)',
    city: 'Carcaixent',
    address: 'Carrer de la Ribera, 32, 46740 Carcaixent (Valencia)',
    location: [39.1226, -0.4502],
    phone: '+34 665 034 261',
    email: 'info@anemonahome.com',
    secondaryEmail: 'comunicacion@anemonahome.com',
    web: 'https://anemonahome.com',
    website: 'https://anemonahome.com',
    revenue: null,
    tier: 'Tier 2',
    sector: 'Construcción Modular',
    products: [
      'Casas modulares prefabricadas y viviendas unifamiliares industrializadas',
      'Modelos residenciales de diseño nórdico y mediterráneo',
      'Carpintería exterior con perfilería de aluminio y rotura de puente térmico',
      'Módulos habitables y anexos sostenibles'
    ],
    profileType: 'Diseño y Fabricación de Casas Modulares Industrializadas',
    alloy: '6060-T66 / 6063-T5',
    finish: 'Lacado Qualicoat / Anodizado',
    notes: 'Diseño y construcción de viviendas prefabricadas y modulares en Valencia. Tel. alternativo: +34 692 94 60 39. Integración de cerramientos de aluminio eficientes. Verificado Nov 2026.',
    certamen: 'Construcción Modular 2026',
    pipelineStage: 'Lead'
  },
  {
    id: 'PROP-LEAD26-MODULAR-05',
    name: 'Panelais Producciones, S.A.',
    cif: 'A37422722',
    zone: 'Salamanca',
    department: 'Huerta (Salamanca)',
    city: 'Huerta',
    address: 'Ctra. de Huerta a Cordovilla, km 1, Polígono 505, 37336 Huerta (Salamanca)',
    location: [40.9678, -5.4667],
    phone: '+34 923 19 11 75',
    email: 'panelais@panelais.com',
    secondaryEmail: 'compras@panelais.com',
    web: 'https://panelais.com',
    website: 'https://panelais.com',
    revenue: null,
    tier: 'Tier 1',
    sector: 'Construcción Modular',
    products: [
      'Construcción modular y módulos prefabricados para oficinas y habitabilidad',
      'Paneles sándwich de fachada y cubierta',
      'Naves y edificios industriales prefabricados',
      'Ventanas y puertas de carpintería de aluminio integradas en módulos'
    ],
    profileType: 'Fabricante Industrial de Paneles Sándwich, Construcción Modular y Casetas',
    alloy: '6060-T66 / 6063-T5',
    finish: 'Lacado Coil Coating / Qualicoat',
    notes: 'Gran fabricante industrial con planta de más de 100.000 m2 en Huerta (Salamanca). Exportador internacional de construcciones modulares y panel sándwich con ventanas y puertas de aluminio incorporadas. Verificado Nov 2026.',
    certamen: 'Construcción Modular 2026',
    pipelineStage: 'Lead'
  },
  {
    id: 'PROP-LEAD26-MODULAR-06',
    name: 'Sismoha (Sistemas Modulares Habitables, S.L.)',
    cif: 'B99323388',
    zone: 'Zaragoza',
    department: 'Calatayud (Zaragoza)',
    city: 'Calatayud',
    address: 'Polígono Industrial La Charluca, parcelas G-2-3 / G-3-4 (Fase 3), 50300 Calatayud (Zaragoza)',
    location: [41.3411, -1.6289],
    phone: '+34 976 89 76 47',
    email: 'sismoha@sismoha.com',
    secondaryEmail: null,
    web: 'https://sismoha.com',
    website: 'https://sismoha.com',
    revenue: null,
    tier: 'Tier 2',
    sector: 'Construcción Modular',
    products: [
      'Sistema de construcción modular industrializada patentado (Sismoha)',
      'Viviendas modulares de consumo casi nulo (NZEB)',
      'Edificios modulares de emergencia, sanitarios y colectivos',
      'Carpintería exterior de aluminio de alta eficiencia térmica y acústica'
    ],
    profileType: 'Construcción Modular Industrializada / Estructura Metálica y Cerramientos de Aluminio',
    alloy: '6060-T66 / 6063-T5',
    finish: 'Lacado Qualicoat / Anodizado',
    notes: 'Pioneros en sistemas modulares habitables industrializados de alta rapidez de montaje y sismo-resistencia en Calatayud (Zaragoza). Tel. móvil: +34 690 21 15 62. Verificado Nov 2026.',
    certamen: 'Construcción Modular 2026',
    pipelineStage: 'Lead'
  }
];

async function main() {
  console.log('--- Iniciando sincronización del lote Construcción Modular (6 empresas) ---');
  try {
    const result = await syncProspectBatch(MODULAR_COMPANIES, {
      appUser: 'antigravity-agent',
      appSource: 'modular_construction_batch_add'
    });

    console.log('Resultado de la sincronización:', JSON.stringify(result, null, 2));
    if (result.errors && result.errors.length > 0) {
      console.error('Se detectaron errores en Supabase:', result.errors);
      process.exit(1);
    }
  } catch (err) {
    console.error('Error fatal durante la sincronización:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
