/**
 * Motor de Inteligencia Comercial B2B para Extrusión de Aluminio (España & Portugal)
 * ----------------------------------------------------------------------------------
 * Proporciona funciones limpias, reutilizables y documentadas para:
 * 1. Cálculo de Tonelaje Potencial Anual (Tn/año) y Clasificación ABC (Tier A / B / C).
 * 2. Inferencia de Especificaciones Técnicas de Extrusión (Matriz Propia, Aleación, Acabado).
 * 3. Generador de Kit de Prospección B2B Multicanal Bilingüe (Español y Portugués).
 * 4. Recomendador de Clústeres Geográficos (< 35 km) para maximizar el ROI en el Planificador de Rutas.
 */

// Precio medio orientativo por tonelada de aluminio extruido y acabado (€/Tn) para estimar valor de cuenta
const AVG_EUR_PER_TON_EXTRUDED = 4150;

/**
 * Calcula la distancia Haversine en kilómetros entre dos coordenadas [lat, lng].
 * @param {number} lat1 - Latitud punto 1
 * @param {number} lon1 - Longitud punto 1
 * @param {number} lat2 - Latitud punto 2
 * @param {number} lon2 - Longitud punto 2
 * @returns {number} Distancia en kilómetros
 */
export const calculateHaversineKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

/**
 * Obtiene o calcula el perfil técnico y de potencial B2B de una empresa consumidora de aluminio.
 * @param {Object} prospect - Objeto prospecto del CRM
 * @returns {Object} Datos enriquecidos de tonelaje, Tier ABC, aleación, acabado y valor potencial
 */
export const getB2BExtrusionProfile = (prospect) => {
  if (!prospect) {
    return {
      estimatedTonsPerYear: 25,
      b2bTier: 'Tier B',
      profileType: 'Matriz Propia (Bajo Plano)',
      alloy: '6063-T5 / 6060',
      finish: 'Lacado Qualicoat / RPT',
      incumbentSupplier: 'Sin homologar (Oportunidad Dual Sourcing)',
      estimatedAnnualEurValue: 25 * AVG_EUR_PER_TON_EXTRUDED
    };
  }

  const sec = (prospect.sector || '').toLowerCase();
  const prods = Array.isArray(prospect.products) ? prospect.products.join(' ').toLowerCase() : '';
  const rev = Number(prospect.revenue) || 5000000;

  // 1. Determinación de Tipo de Perfil
  let profileType = prospect.profileType;
  if (!profileType) {
    if (
      sec.includes('solar') ||
      sec.includes('iluminac') ||
      sec.includes('disipador') ||
      sec.includes('electr') ||
      sec.includes('mampara') ||
      sec.includes('division') ||
      sec.includes('puerta') ||
      sec.includes('porton') ||
      sec.includes('proteccion solar') ||
      prods.includes('matriz') ||
      prods.includes('disipador')
    ) {
      profileType = 'Matriz Propia (Bajo Plano)';
    } else if (
      sec.includes('carrocer') ||
      sec.includes('estructur') ||
      sec.includes('naval') ||
      sec.includes('marítim') ||
      sec.includes('modular')
    ) {
      profileType = 'Perfil Estándar / Estructural';
    } else {
      profileType = 'Carpintería / Arquitectura';
    }
  }

  // 2. Determinación de Aleación Principal
  let alloy = prospect.alloy;
  if (!alloy) {
    if (
      sec.includes('solar') ||
      sec.includes('carrocer') ||
      sec.includes('estructur') ||
      sec.includes('naval') ||
      sec.includes('marítim') ||
      sec.includes('escalera')
    ) {
      alloy = '6005A-T6 / 6082-T6';
    } else {
      alloy = '6063-T5 / 6060';
    }
  }

  // 3. Determinación de Acabado Principal
  let finish = prospect.finish;
  if (!finish) {
    if (sec.includes('iluminac') || sec.includes('electr') || sec.includes('mampara') || prods.includes('anodiz')) {
      finish = 'Anodizado Técnico / Mecanizado CNC';
    } else if (sec.includes('solar') || sec.includes('carrocer') || sec.includes('naval') || sec.includes('invernadero')) {
      finish = 'Bruto (Mill Finish) / Corte Precisión';
    } else {
      finish = 'Lacado Qualicoat / RPT';
    }
  }

  // 4. Tonelaje anual estimado (Tn/año)
  let estimatedTonsPerYear = Number(prospect.estimatedTonsPerYear);
  if (!estimatedTonsPerYear || isNaN(estimatedTonsPerYear)) {
    const revM = rev / 1000000;
    if (sec.includes('solar') || sec.includes('cerramiento') || sec.includes('fachada') || sec.includes('ventana')) {
      estimatedTonsPerYear = Math.round(Math.min(650, Math.max(12, revM * 6.5)));
    } else if (sec.includes('puerta') || sec.includes('iluminac') || sec.includes('invernadero') || sec.includes('mobiliario')) {
      estimatedTonsPerYear = Math.round(Math.min(480, Math.max(15, revM * 4.8)));
    } else {
      estimatedTonsPerYear = Math.round(Math.min(420, Math.max(10, revM * 3.2)));
    }
  }

  // 5. Clasificación Tier ABC
  let b2bTier = prospect.b2bTier;
  if (!b2bTier) {
    if (estimatedTonsPerYear >= 100 || rev >= 25000000) {
      b2bTier = 'Tier A';
    } else if (estimatedTonsPerYear >= 35 || rev >= 5000000) {
      b2bTier = 'Tier B';
    } else {
      b2bTier = 'Tier C';
    }
  }

  const incumbentSupplier = prospect.incumbentSupplier || 'Sin homologar (Oportunidad Dual Sourcing)';
  const estimatedAnnualEurValue = estimatedTonsPerYear * AVG_EUR_PER_TON_EXTRUDED;

  return {
    estimatedTonsPerYear,
    b2bTier,
    profileType,
    alloy,
    finish,
    incumbentSupplier,
    estimatedAnnualEurValue
  };
};

/**
 * Genera el Kit de Prospección B2B Multicanal adaptado al idioma de la zona (Español o Portugués)
 * y a los datos técnicos de la empresa.
 * @param {Object} prospect - Prospecto seleccionado
 * @returns {Object} Asunto y cuerpo de email, mensaje LinkedIn, URL de búsqueda en LinkedIn y guion telefónico
 */
export const generateB2BOutreachKit = (prospect) => {
  const b2b = getB2BExtrusionProfile(prospect);
  const isPortugal = (prospect?.zone || '').toLowerCase() === 'portugal' || (prospect?.web || '').endsWith('.pt');
  const rawContact = prospect?.purchasingManager || (isPortugal ? 'Responsável de Compras' : 'Responsable de Compras');
  // Limpiar paréntesis de cargos para saludo natural
  const cleanContactName = rawContact.split('(')[0].replace('Dpto. Compras', '').trim() || (isPortugal ? 'Equipa de Compras' : 'Equipo de Compras');
  const firstProduct = (Array.isArray(prospect?.products) && prospect.products[0]) || (isPortugal ? 'perfis de alumínio' : 'perfiles de aluminio');
  const cleanCompanyName = (prospect?.name || 'su empresa').split('(')[0].trim();

  // Enlace directo de búsqueda en LinkedIn para localizar al decisor en 1 clic
  const linkedinQuery = encodeURIComponent(`${cleanContactName} ${cleanCompanyName}`);
  const linkedinSearchUrl = prospect?.purchasingLinkedin && prospect.purchasingLinkedin.startsWith('http')
    ? prospect.purchasingLinkedin
    : `https://www.linkedin.com/search/results/people/?keywords=${linkedinQuery}`;

  if (isPortugal) {
    const emailSubject = `Homologação de fornecedor de extrusão de alumínio (${b2b.alloy}) para ${cleanCompanyName}`;
    const emailBody = `Exmo(a). Sr(a). ${cleanContactName},

Acompanho de perto a atividade industrial da ${cleanCompanyName} no segmento de ${prospect.sector || 'transformação metálica'} e o vosso consumo de ${firstProduct}.

Contactamo-lo porque apoiamos fabricantes líderes em Portugal e Espanha como segundo fornecedor homologado (Dual Sourcing) em extrusão de perfis de alumínio (${b2b.profileType}), garantindo:
• Extrusão em ligas técnicas (${b2b.alloy}) com tolerâncias rigorosas segundo EN 755-9.
• Desenvolvimento ágil de matrizes próprias sob desenho DXF/DWG e proteção de exclusividade.
• Acabamento integrado (${b2b.finish}) e prazos de entrega fiáveis na Península Ibérica.

Terá disponibilidade de 10 minutos esta quinta-feira para avaliarmos como podemos cotar uma série de referência sob plano sem compromisso?

Com os melhores cumprimentos,
Departamento Comercial B2B — Extrusão de Alumínio`;

    const linkedinMessage = `Olá ${cleanContactName}, acompanho o trabalho da ${cleanCompanyName} em ${prospect.sector}. Apoiamos fabricantes industriais em Portugal no fornecimento de perfis de alumínio extrudido (${b2b.alloy} / matriz própria) como parceiro Dual Sourcing. Gostaria de conectar consigo por aqui!`;

    const coldCallScript = `🎙️ ABERTURA (25 seg): "Bom dia ${cleanContactName}, falo-lhe da divisão industrial de extrusão de alumínio. Sei que na ${cleanCompanyName} trabalham com ${firstProduct} em liga ${b2b.alloy}. Não lhe ligo para substituir o vosso extrusor principal hoje, mas para nos homologarmos como segundo fornecedor de segurança para matrizes próprias e picos de produção."

🛡️ RESPOSTA A OBJEÇÕES:
1. "Já temos fornecedor (Navarra / Extrusal / Cortizo)": "Excelente, quase todos os nossos clientes industriais mantêm um fornecedor principal; connosco garantem uma alternativa competitiva em prazos de entrega e lote mínimo para novas matrizes."
2. "As nossas matrizes estão noutro extrusor": "Assumimos o estudo técnico a partir dos vossos planos DXF e bonificamos o custo da matriz a partir de tonelagem acordada."`;

    return {
      lang: 'PT 🇵🇹',
      emailSubject,
      emailBody,
      linkedinMessage,
      linkedinSearchUrl,
      coldCallScript
    };
  }

  // Versión en Español (Mercado Nacional)
  const emailSubject = `Homologación proveedor de extrusión de aluminio (${b2b.alloy}) — ${cleanCompanyName}`;
  const emailBody = `Estimado/a ${cleanContactName},

Sigo de cerca la trayectoria industrial de ${cleanCompanyName} en el sector de ${prospect.sector || 'ingeniería y cerramientos'} y vuestra línea de fabricación con ${firstProduct}.

Me pongo en contacto contigo porque colaboramos con fabricantes líderes industriales como proveedor homologado (Dual Sourcing) de perfiles de aluminio extruido (${b2b.profileType}), aportando:
• Extrusión de precisión en aleaciones ${b2b.alloy} bajo normativa UNE-EN 755-9.
• Desarrollo rápido de matrices propias a medida (bajo plano DXF/DWG) con confidencialidad total.
• Servicio integral de acabado (${b2b.finish}) y entregas directas con plazos muy cortos.

¿Tendrías 10 minutos esta semana para comentar vuestras necesidades actuales de perfilería y cotizar un plano de muestra para que podáis comparar servicio y coste de conversión?

Un cordial saludo,
Dirección Comercial B2B — Extrusión de Aluminio`;

  const linkedinMessage = `Hola ${cleanContactName}, sigo la actividad industrial de ${cleanCompanyName} en ${prospect.sector}. Ayudamos a fabricantes con alto consumo de ${firstProduct} como proveedor de extrusión de aluminio (${b2b.alloy} y matriz propia). Encantado de conectar por aquí.`;

  const coldCallScript = `🎙️ APERTURA (25 seg): "Buenos días ${cleanContactName}, te llamo del área industrial de extrusión de aluminio. Conocemos vuestra fabricación en ${cleanCompanyName} con ${firstProduct}. El motivo de la llamada es muy directo: no buscamos sustituir hoy a vuestro extrusor principal, sino homologarnos como vuestro segundo proveedor de respaldo en perfiles de ${b2b.alloy} y nuevas matrices para mejorar plazos y precios de conversión."

🛡️ REBATE DE OBJECIONES B2B:
1. "Ya trabajamos con Cortizo / Exlabesa / Extrugasa": "Lo entendemos perfectamente; precisamente nuestros mejores clientes industriales mantienen dos extrusores homologados para no depender de un único plazo de entrega en campaña alta."
2. "Cambiar las matrices tiene coste": "Para cuentas ${b2b.b2bTier} como la vuestra (~${b2b.estimatedTonsPerYear} Tn/año estimadas), estudiamos la amortización de nuevas matrices en el propio pedido en serie."`;

  return {
    lang: 'ES 🇪🇸',
    emailSubject,
    emailBody,
    linkedinMessage,
    linkedinSearchUrl,
    coldCallScript
  };
};

/**
 * Encuentra las empresas de mayor potencial (Tier A / Tier B) en un radio cercano (< maxKm)
 * respecto a una empresa ancla o a la última parada de una ruta comercial.
 * @param {Object} anchorProspect - Empresa de referencia geográfica
 * @param {Array} allProspects - Lista completa de prospectos disponibles
 * @param {Array} excludedIds - IDs ya incluidos en la ruta actual
 * @param {number} maxKm - Radio máximo en kilómetros (por defecto 40 km)
 * @param {number} maxResults - Número máximo de paradas a sugerir (por defecto 6)
 * @returns {Array} Lista de prospectos cercanos ordenados por potencial de tonelaje y cercanía
 */
export const findNearbyClusterProspects = (
  anchorProspect,
  allProspects,
  excludedIds = [],
  maxKm = 40,
  maxResults = 6
) => {
  if (!anchorProspect || !Array.isArray(anchorProspect.location) || anchorProspect.location.length !== 2) {
    return [];
  }
  const [lat0, lng0] = anchorProspect.location;
  const excludedSet = new Set([...excludedIds, anchorProspect.id]);

  const candidates = [];
  for (const p of allProspects) {
    if (!p || excludedSet.has(p.id)) continue;
    if (!Array.isArray(p.location) || p.location.length !== 2) continue;
    const dist = calculateHaversineKm(lat0, lng0, p.location[0], p.location[1]);
    if (dist <= maxKm) {
      const b2b = getB2BExtrusionProfile(p);
      candidates.push({
        prospect: p,
        distanceKm: dist,
        tons: b2b.estimatedTonsPerYear,
        tier: b2b.b2bTier
      });
    }
  }

  // Priorizar por Tier A > Tier B y mayor tonelaje anual
  candidates.sort((a, b) => {
    if (a.tier !== b.tier) return a.tier.localeCompare(b.tier);
    return b.tons - a.tons;
  });

  return candidates.slice(0, maxResults);
};

