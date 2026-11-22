/**
 * scripts/add_batch_inarquia_8.cjs
 * ---------------------------------------------------------------------
 * Script para incorporar el lote de 8 empresas de Construcción Modular y
 * Ventanas de Aluminio procedentes de Inarquia (https://inarquia.es/empresas/):
 *  1. Grupo Eurocasa Modular, S.L. (Burgos)
 *  2. Modulartis Home (Modulartis Homes, S.L.) (Madrid)
 *  3. iMOD Haus (Imod Haus Construcciones y Estructuras, S.L.) (Barcelona)
 *  4. ARQUIMA (Arquimabalear, S.L.) (Barcelona)
 *  5. Casas Natura (Comercial Casas Natura Rosso, S.L.) (Valencia)
 *  6. Diseño Modular (Diseño Modular Avanzado, S.L.) (Sevilla)
 *  7. Modularium Casas Eficientes, S.L.U. (Madrid)
 *  8. Iventanas (Ventanas Albericia, S.L.) (Cantabria)
 *
 * Sector asignado de forma estricta: 'Construcción Modular'
 * PipelineStage: 'Lead'
 * Reutiliza scripts/lib/prospectSync.cjs para garantizar integridad dual
 * (local src/data/prospects.json y Supabase public.prospects con auditoría).
 * ---------------------------------------------------------------------
 */

const { syncProspectBatch } = require('./lib/prospectSync.cjs');

const INARQUIA_APPROVED_BATCH_8 = [
  {
    id: 'PROP-LEAD26-MODULAR-13',
    name: 'Grupo Eurocasa Modular, S.L.',
    cif: 'B09527151',
    zone: 'Castilla y León',
    department: 'Burgos (Burgos)',
    city: 'Burgos',
    address: 'Calle Merindad de Sotoscueva, 8 (Polígono Industrial Villalonquéjar), 09001 Burgos',
    location: [42.3683, -3.7436],
    phone: '+34 947 473 074',
    email: 'contacto@eurocasas.com',
    secondaryEmail: null,
    web: 'https://eurocasas.com',
    website: 'https://eurocasas.com',
    revenue: null,
    tier: 'Tier 1',
    sector: 'Construcción Modular',
    products: [
      'Casas modulares en acero y hormigón (Gama MOD, Campero)',
      'Módulos prefabricados de diseño para residencial y hostelería',
      'Carpintería exterior en aluminio lacado con RPT y doble vidrio',
      'Viviendas industrializadas llave en mano de bajo consumo'
    ],
    profileType: 'Fabricante Industrial de Casas Modulares y Prefabricadas',
    alloy: '6060-T66 / 6063-T5',
    finish: 'Lacado Qualicoat / Gris Antracita',
    notes: 'Planta industrial de más de 20.000 m2 en Burgos con 30 años de experiencia. Fabricación y montaje de viviendas modulares con carpintería exterior de aluminio RPT. Localizado en Inarquia.es. Verificado Nov 2026.',
    certamen: 'Inarquia / Construcción Modular 2026',
    pipelineStage: 'Lead'
  },
  {
    id: 'PROP-LEAD26-MODULAR-14',
    name: 'Modulartis Home (Modulartis Homes, S.L.)',
    cif: 'B87531901',
    zone: 'Comunidad de Madrid',
    department: 'Madrid (Madrid)',
    city: 'Madrid',
    address: 'Calle Orense, 20, Planta 1, Oficina 10, 28020 Madrid',
    location: [40.4502, -3.6946],
    phone: '+34 675 601 967',
    email: 'info@modulartis.com',
    secondaryEmail: null,
    web: 'https://modulartis.com',
    website: 'https://modulartis.com',
    revenue: null,
    tier: 'Tier 1',
    sector: 'Construcción Modular',
    products: [
      'Chalets y viviendas unifamiliares modulares de hormigón prefabricado',
      'Ventanales y cerramientos de aluminio de suelo a techo con RPT',
      'Construcción modular industrializada llave en mano 360º',
      'Sistemas de envolvente térmica de alta eficiencia energética'
    ],
    profileType: 'Estudio y Constructora de Casas Modulares de Hormigón',
    alloy: '6060-T66 / 6063-T5',
    finish: 'Lacado Qualicoat / Anodizado arquitectónico',
    notes: 'Constructora e ingeniería de casas modulares de hormigón en Madrid con cobertura nacional. Teléfono secundario: +34 815 034 893. Grandes vanos acristalados de aluminio. Localizado en Inarquia.es. Verificado Nov 2026.',
    certamen: 'Inarquia / Construcción Modular 2026',
    pipelineStage: 'Lead'
  },
  {
    id: 'PROP-LEAD26-MODULAR-15',
    name: 'iMOD Haus (Imod Haus Construcciones y Estructuras, S.L.)',
    cif: 'B01832005',
    zone: 'Cataluña',
    department: 'Vilanova i la Geltrú (Barcelona)',
    city: 'Vilanova i la Geltrú',
    address: 'C/ Sant Felip Neri, 44, local bajo, 08800 Vilanova i la Geltrú (Barcelona)',
    location: [41.2238, 1.7258],
    phone: '+34 690 08 24 02',
    email: 'proyectos@imodhaus.com',
    secondaryEmail: null,
    web: 'https://imodhaus.com',
    website: 'https://imodhaus.com',
    revenue: null,
    tier: 'Tier 2',
    sector: 'Construcción Modular',
    products: [
      'Viviendas modulares sostenibles de fabricación en seco (dry construction)',
      'Cerramientos y carpinterías exteriores de aluminio para consumo casi nulo (nZEB)',
      'Módulos arquitectónicos industrializados personalizados',
      'Ventanales de altas prestaciones térmicas y acústicas'
    ],
    profileType: 'Edificación Modular y Estructuras Industrializadas',
    alloy: '6060-T66 / 6063-T5',
    finish: 'Lacado Qualicoat / Texturado',
    notes: 'Diseño y fabricación de arquitectura modular industrializada en seco de bajo consumo energético en Cataluña. Ventanas y cerramientos de aluminio de altas prestaciones. Localizado en Inarquia.es. Verificado Nov 2026.',
    certamen: 'Inarquia / Construcción Modular 2026',
    pipelineStage: 'Lead'
  },
  {
    id: 'PROP-LEAD26-MODULAR-16',
    name: 'ARQUIMA (Arquimabalear, S.L.)',
    cif: 'B70625769',
    zone: 'Cataluña',
    department: 'Abrera (Barcelona)',
    city: 'Abrera',
    address: 'Ctra. de Olesa a Martorell, km. 4,5, 08630 Abrera (Barcelona)',
    location: [41.5167, 1.9023],
    phone: '+34 936 821 006',
    email: 'info@arquima.net',
    secondaryEmail: null,
    web: 'https://arquima.net',
    website: 'https://arquima.net',
    revenue: null,
    tier: 'Tier 1',
    sector: 'Construcción Modular',
    products: [
      'Arquitectura industrializada pasiva de alta gama (estándar Passivhaus)',
      'Grandes ventanales correderos y oscilobatientes de aluminio con RPT',
      'Fachadas técnicas y envolventes de máxima eficiencia energética',
      'Edificios y viviendas modulares llave en mano'
    ],
    profileType: 'Construcción Industrializada Pasiva / Passivhaus',
    alloy: '6060-T66 / 6063-T5',
    finish: 'Lacado Qualicoat / Anodizado arquitectónico',
    notes: 'Pionero y referente nacional en edificación industrializada pasiva con fábrica propia en Abrera (Barcelona). Prescripción de carpinterías exteriores de aluminio con rotura de puente térmico y control solar. Localizado en Inarquia.es. Verificado Nov 2026.',
    certamen: 'Inarquia / Construcción Modular 2026',
    pipelineStage: 'Lead'
  },
  {
    id: 'PROP-LEAD26-MODULAR-17',
    name: 'Casas Natura (Comercial Casas Natura Rosso, S.L.)',
    cif: 'B98532120',
    zone: 'Comunidad Valenciana',
    department: 'Benaguacil (Valencia)',
    city: 'Benaguacil',
    address: 'Carrer Serra Calderona, 5, 46180 Benaguacil (Valencia)',
    location: [39.5936, -0.5847],
    phone: '+34 961 059 272',
    email: 'info@casasnatura.com',
    secondaryEmail: null,
    web: 'https://casasnatura.com',
    website: 'https://casasnatura.com',
    revenue: null,
    tier: 'Tier 1',
    sector: 'Construcción Modular',
    products: [
      'Casas modulares y prefabricadas bioclimáticas y sostenibles',
      'Carpintería exterior de aluminio con rotura de puente térmico',
      'Viviendas pasivas industrializadas a medida',
      'Módulos habitables de alta eficiencia energética'
    ],
    profileType: 'Fabricante de Casas Modulares Bioclimáticas',
    alloy: '6060-T66 / 6063-T5',
    finish: 'Lacado Qualicoat / Blanco / Antracita',
    notes: 'Empresa familiar referente en la Comunidad Valenciana con fábrica en Benaguacil. Construcción modular con integración de ventanas de aluminio RPT y doble vidrio Climalit bajo emisivo. Localizado en Inarquia.es. Verificado Nov 2026.',
    certamen: 'Inarquia / Construcción Modular 2026',
    pipelineStage: 'Lead'
  },
  {
    id: 'PROP-LEAD26-MODULAR-18',
    name: 'Diseño Modular (Diseño Modular Avanzado, S.L.)',
    cif: 'B90356866',
    zone: 'Andalucía',
    department: 'Alcalá del Río (Sevilla)',
    city: 'Alcalá del Río',
    address: 'Avenida de Andalucía, 77, 41200 Alcalá del Río (Sevilla)',
    location: [37.5186, -5.9816],
    phone: '+34 955 650 476',
    email: 'info@dmodular.es',
    secondaryEmail: null,
    web: 'https://disenomodular.com',
    website: 'https://disenomodular.com',
    revenue: null,
    tier: 'Tier 2',
    sector: 'Construcción Modular',
    products: [
      'Casas modulares industrializadas prefabricadas en fábrica',
      'Carpintería exterior de aluminio lacado Qualicoat con RPT',
      'Modelos residenciales y módulos habitables a medida',
      'Sistemas modulares con estructura metálica y alta inercia térmica'
    ],
    profileType: 'Fabricante de Casas Modulares Industrializadas',
    alloy: '6060-T66 / 6063-T5',
    finish: 'Lacado Qualicoat / Gris / Blanco',
    notes: 'Fábrica de casas modulares en Sevilla con casas piloto y proyectos en Madrid, Galicia y Andalucía. Cerramientos y carpintería de aluminio exterior con rotura de puente térmico. Localizado en Inarquia.es. Verificado Nov 2026.',
    certamen: 'Inarquia / Construcción Modular 2026',
    pipelineStage: 'Lead'
  },
  {
    id: 'PROP-LEAD26-MODULAR-19',
    name: 'Modularium Casas Eficientes, S.L.U.',
    cif: 'B02680114',
    zone: 'Comunidad de Madrid',
    department: 'Las Rozas de Madrid (Madrid)',
    city: 'Las Rozas de Madrid',
    address: 'Calle Gabriel García Márquez, 4, 1º, 28232 Las Rozas de Madrid (Madrid)',
    location: [40.5098, -3.8872],
    phone: '+34 910 059 790',
    email: 'info@modularium.es',
    secondaryEmail: null,
    web: 'https://modulariumcasaseficientes.com',
    website: 'https://modulariumcasaseficientes.com',
    revenue: null,
    tier: 'Tier 2',
    sector: 'Construcción Modular',
    products: [
      'Casas modulares inteligentes y de alta eficiencia energética',
      'Carpintería exterior técnica de aluminio de altas prestaciones con RPT',
      'Módulos habitables industrializados sostenibles',
      'Sistemas pasivos de iluminación y control solar'
    ],
    profileType: 'Constructora de Casas Modulares Inteligentes y Eficientes',
    alloy: '6060-T66 / 6063-T5',
    finish: 'Lacado Qualicoat / Anodizado',
    notes: 'Constructora de viviendas modulares de alta calificación energética con sede en Las Rozas (Madrid). Integración de cerramientos y carpintería de aluminio de suelo a techo. Localizado en Inarquia.es. Verificado Nov 2026.',
    certamen: 'Inarquia / Construcción Modular 2026',
    pipelineStage: 'Lead'
  },
  {
    id: 'PROP-LEAD26-MODULAR-20',
    name: 'Iventanas (Ventanas Albericia, S.L.)',
    cif: 'B39780663',
    zone: 'Cantabria',
    department: 'Revilla de Camargo (Cantabria)',
    city: 'Revilla de Camargo',
    address: 'Barrio El Crucero, nº 5, 39600 Revilla de Camargo (Cantabria)',
    location: [43.4147, -3.8791],
    phone: '+34 942 565 100',
    email: 'info@iventanas.com',
    secondaryEmail: null,
    web: 'https://iventanas.com',
    website: 'https://iventanas.com',
    revenue: null,
    tier: 'Tier 2',
    sector: 'Construcción Modular',
    products: [
      'Fabricación e instalación de ventanas y puertas de aluminio con RPT',
      'Cerramientos exteriores para construcción modular y edificación eficiente',
      'Sistemas correderos, oscilobatientes y muros cortina',
      'Aislamiento térmico y acústico certificado para el norte peninsular'
    ],
    profileType: 'Taller Industrial de Fabricación e Instalación de Ventanas de Aluminio',
    alloy: '6060-T66 / 6063-T5',
    finish: 'Lacado Qualicoat / Anodizado',
    notes: 'Taller industrial e instalador referente destacado en el directorio de Inarquia en el norte de España. Tel. comercial: +34 626 965 422. Especialista en cerramientos de aluminio para viviendas sostenibles y modulares. Localizado en Inarquia.es. Verificado Nov 2026.',
    certamen: 'Inarquia / Construcción Modular 2026',
    pipelineStage: 'Lead'
  }
];

async function main() {
  console.log('--- Iniciando sincronización del lote Inarquia Empresas (8 empresas) ---');
  try {
    const result = await syncProspectBatch(INARQUIA_APPROVED_BATCH_8, {
      appUser: 'antigravity-agent',
      appSource: 'inarquia_empresas_batch_add'
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
