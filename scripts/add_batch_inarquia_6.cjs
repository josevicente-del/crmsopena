/**
 * scripts/add_batch_inarquia_6.cjs
 * ---------------------------------------------------------------------
 * Script para incorporar el lote de las 6 empresas de Construcción Modular
 * aprobadas por el usuario procedentes de Inarquia (https://inarquia.es):
 *  1. Casas inHAUS, S.L. (Valencia)
 *  2. Modular Home (Modular System Global, S.L.) (Cáceres / Madrid)
 *  3. Casas Cube (Casas Cube, S.L.) (A Coruña / Madrid)
 *  4. The Concrete Home, S.L. (Madrid)
 *  5. Hormipresa Living (Hormipresa Nec, S.L.) (Tarragona / Barcelona)
 *  6. Ubiko (Ubiko Viviendas S.L.P.) (Valencia / Palma)
 *
 * Sector asignado de forma estricta: 'Construcción Modular'
 * PipelineStage: 'Lead'
 * Reutiliza scripts/lib/prospectSync.cjs para garantizar integridad dual
 * (local src/data/prospects.json y Supabase public.prospects con auditoría).
 * ---------------------------------------------------------------------
 */

const { syncProspectBatch } = require('./lib/prospectSync.cjs');

const INARQUIA_APPROVED_BATCH = [
  {
    id: 'PROP-LEAD26-MODULAR-07',
    name: 'Casas inHAUS, S.L.',
    cif: 'B98533953',
    zone: 'Valencia',
    department: 'Almussafes (Valencia)',
    city: 'Almussafes',
    address: 'Avenida de Picassent, 12 (Pol. Ind. Juan Carlos I), 46440 Almussafes (Valencia)',
    location: [39.2941, -0.4284],
    phone: '+34 963 51 92 19',
    email: 'info@casasinhaus.com',
    secondaryEmail: null,
    web: 'https://casasinhaus.com',
    website: 'https://casasinhaus.com',
    revenue: null,
    tier: 'Tier 1',
    sector: 'Construcción Modular',
    products: [
      'Casas modulares de hormigón de alta gama a precio cerrado',
      'Ventanales y cerramientos de aluminio extrusionado con RPT de gran formato',
      'Sistemas de hoja oculta y control solar en fachada',
      'Viviendas industrializadas llave en mano de diseño'
    ],
    profileType: 'Diseño y Fabricación de Casas Modulares de Hormigón de Alta Gama',
    alloy: '6060-T66 / 6063-T5',
    finish: 'Lacado Qualicoat / Anodizado',
    notes: 'Referente nacional en vivienda modular industrializada de hormigón prémium. Integración masiva de ventanales de aluminio con rotura de puente térmico y vidrios bajo emisivos. Localizado en Inarquia.es. Verificado Nov 2026.',
    certamen: 'Inarquia / Construcción Modular 2026',
    pipelineStage: 'Lead'
  },
  {
    id: 'PROP-LEAD26-MODULAR-08',
    name: 'Modular Home (Modular System Global, S.L.)',
    cif: 'B10434256',
    zone: 'Cáceres',
    department: 'Casas de Don Gómez (Cáceres)',
    city: 'Casas de Don Gómez',
    address: 'Carretera EX-108, Km 96, 10818 Casas de Don Gómez (Cáceres)',
    location: [40.0108, -6.6284],
    phone: '+34 900 102 368',
    email: 'info@modularhome.es',
    secondaryEmail: 'administracion@modularhome.es',
    web: 'https://www.modularhome.es',
    website: 'https://www.modularhome.es',
    revenue: null,
    tier: 'Tier 1',
    sector: 'Construcción Modular',
    products: [
      'Casas prefabricadas modulares de hormigón arquitectónico',
      'Ventanales correderos, oscilobatientes y fijos de aluminio con RPT',
      'Módulos habitables y naves prefabricadas',
      'Estructuras industrializadas de alta eficiencia energética'
    ],
    profileType: 'Fabricante Industrial de Casas Prefabricadas de Hormigón',
    alloy: '6060-T66 / 6063-T5',
    finish: 'Lacado Qualicoat / Gris Antracita / Blanco',
    notes: 'Uno de los mayores fabricantes e instaladores de casas modulares de hormigón en España, con delegaciones en Madrid, Barcelona y fábrica en Extremadura. Carpintería de aluminio RPT en toda la gama. Localizado en Inarquia.es. Verificado Nov 2026.',
    certamen: 'Inarquia / Construcción Modular 2026',
    pipelineStage: 'Lead'
  },
  {
    id: 'PROP-LEAD26-MODULAR-09',
    name: 'Casas Cube (Casas Cube, S.L.)',
    cif: 'B70409875',
    zone: 'A Coruña',
    department: 'Carballo (A Coruña)',
    city: 'Carballo',
    address: 'Rúa da Madeira, Parcela E-4, Pol. Ind. de Bértoa, 15105 Carballo (A Coruña)',
    location: [43.2185, -8.6756],
    phone: '+34 981 632 547',
    email: 'info@casascube.com',
    secondaryEmail: null,
    web: 'https://casasprefabricadascube.com',
    website: 'https://casasprefabricadascube.com',
    revenue: null,
    tier: 'Tier 1',
    sector: 'Construcción Modular',
    products: [
      'Casas prefabricadas modulares en acero y hormigón',
      'Módulos Cube y viviendas unifamiliares industrializadas',
      'Carpintería exterior de aluminio con RPT y rotura de puente térmico',
      'Edificaciones modulares y porches bioclimáticos'
    ],
    profileType: 'Construcción Modular Industrializada en Acero y Hormigón',
    alloy: '6060-T66 / 6063-T5',
    finish: 'Lacado Qualicoat Gris Antracita',
    notes: 'Líder nacional en edificación modular estandarizada y personalizada con delegaciones en Madrid, Barcelona y fábrica en Galicia. Toda la carpintería exterior se realiza en aluminio de altas prestaciones térmicas. Localizado en Inarquia.es. Verificado Nov 2026.',
    certamen: 'Inarquia / Construcción Modular 2026',
    pipelineStage: 'Lead'
  },
  {
    id: 'PROP-LEAD26-MODULAR-10',
    name: 'The Concrete Home, S.L.',
    cif: 'B87234092',
    zone: 'Madrid',
    department: 'Torrelodones (Madrid)',
    city: 'Torrelodones',
    address: 'Calle Amparo Cantero, 2, 28250 Torrelodones (Madrid)',
    location: [40.5769, -3.9312],
    phone: '+34 910 059 790',
    email: 'info@theconcretehome.com',
    secondaryEmail: null,
    web: 'https://theconcretehome.com',
    website: 'https://theconcretehome.com',
    revenue: null,
    tier: 'Tier 1',
    sector: 'Construcción Modular',
    products: [
      'Casas prefabricadas de hormigón de diseño exclusivo',
      'Ventanales panorámicos y muros cortina de aluminio con RPT',
      'Viviendas industrializadas bioclimáticas de alta inercia térmica',
      'Sistemas de cerramiento de aluminio minimalista'
    ],
    profileType: 'Construcción de Viviendas Modulares de Hormigón de Diseño',
    alloy: '6060-T66 / 6063-T5',
    finish: 'Lacado Qualicoat / Anodizado arquitectónico',
    notes: 'Especialistas en chalets y casas modulares de hormigón de estilo contemporáneo en la Comunidad de Madrid y zona centro. Envolventes térmicas con grandes vanos acristalados de aluminio. Localizado en Inarquia.es. Verificado Nov 2026.',
    certamen: 'Inarquia / Construcción Modular 2026',
    pipelineStage: 'Lead'
  },
  {
    id: 'PROP-LEAD26-MODULAR-11',
    name: 'Hormipresa Living (Hormipresa Nec, S.L.)',
    cif: 'B17488859',
    zone: 'Tarragona',
    department: 'El Pla de Santa Maria (Tarragona)',
    city: 'El Pla de Santa Maria',
    address: 'Calle Picot, 1 (Pol. Ind.), 43810 El Pla de Santa Maria (Tarragona)',
    location: [41.3653, 1.2985],
    phone: '+34 934 470 322',
    email: 'living@hormipresa.com',
    secondaryEmail: 'info@hormipresa.com',
    web: 'https://hormipresa.com',
    website: 'https://hormipresa.com',
    revenue: null,
    tier: 'Tier 1',
    sector: 'Construcción Modular',
    products: [
      'Casas de hormigón prefabricado Living (modelos Arctic Wall)',
      'Construcción industrializada residencial y comercial',
      'Carpintería exterior de aluminio de alta gama para Passivhaus',
      'Grandes ventanales correderos y practicables con RPT'
    ],
    profileType: 'Fabricante Industrial de Edificación y Casas Prefabricadas de Hormigón',
    alloy: '6060-T66 / 6063-T5',
    finish: 'Lacado Qualicoat / Anodizado',
    notes: 'Grupo industrial referente fundado hace más de 40 años con plantas en Tarragona y Ciudad Real y oficinas en Barcelona y Madrid. Edificación modular con sistemas de fachada de hormigón y ventanas de aluminio de máxima eficiencia. Localizado en Inarquia.es. Verificado Nov 2026.',
    certamen: 'Inarquia / Construcción Modular 2026',
    pipelineStage: 'Lead'
  },
  {
    id: 'PROP-LEAD26-MODULAR-12',
    name: 'Ubiko (Ubiko Viviendas S.L.P.)',
    cif: 'B40632804',
    zone: 'Valencia',
    department: 'Valencia (Valencia)',
    city: 'Valencia',
    address: 'Calle Pérez Pujol, 3, Planta 1, Puerta 1, 46002 Valencia',
    location: [39.4716, -0.3752],
    phone: '+34 963 513 128',
    email: 'contacto@ubiko.es',
    secondaryEmail: null,
    web: 'https://ubiko.es',
    website: 'https://ubiko.es',
    revenue: null,
    tier: 'Tier 2',
    sector: 'Construcción Modular',
    products: [
      'Arquitectura industrializada de diseño personalizado (estudio Viraje)',
      'Viviendas unifamiliares modulares de hormigón 2D',
      'Cerramientos exteriores y ventanales de aluminio minimalista con RPT',
      'Viviendas de alta calificación energética Passivhaus'
    ],
    profileType: 'Estudio y Constructora de Casas Modulares Industrializadas',
    alloy: '6060-T66 / 6063-T5',
    finish: 'Lacado Qualicoat Texturado / Negro / Gris',
    notes: 'Marca de arquitectura y construcción industrializada de viviendas unifamiliares de diseño en Valencia y Baleares (creada por Viraje Arquitectura). Perfilería exterior de aluminio esbelta de alta eficiencia. Localizado en Inarquia.es. Verificado Nov 2026.',
    certamen: 'Inarquia / Construcción Modular 2026',
    pipelineStage: 'Lead'
  }
];

async function main() {
  console.log('--- Iniciando sincronización de 6 empresas de Inarquia (Construcción Modular) ---');
  try {
    const result = await syncProspectBatch(INARQUIA_APPROVED_BATCH, {
      appUser: 'antigravity-agent',
      appSource: 'inarquia_batch_add'
    });

    console.log('Resultado de la sincronización:', JSON.stringify(result, null, 2));
  } catch (err) {
    console.error('Error fatal durante la sincronización:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
