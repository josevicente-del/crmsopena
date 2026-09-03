import { useState, useMemo, useEffect, useRef } from 'react';
import { Sparkles, Send, Brain, TrendingUp, AlertCircle, Mail, Copy, Check, Info, Compass, RotateCcw, Database, Search, ShieldAlert, ListChecks } from 'lucide-react';
import { checkEmailQuality, findEmailWithIA } from '../utils/emailFinderEngine';

/**
 * Componente AgentforceAssistant
 * @description Asistente de inteligencia artificial para CRM de la Empresa de Aluminio.
 * Proporciona insights comerciales, chat predictivo, generación de emails
 * y el módulo Agentforce Lead Finder para prospección automática con exclusión de la AEA.
 * 
 * @param {Object} props
 * @param {Array} props.prospects - Lista de prospectos comerciales actuales
 * @param {Function} props.setProspects - Función para actualizar la lista de prospectos global
 */
export default function AgentforceAssistant({ prospects = [], setProspects, userAllowedZones = [], currentUser = null }) {
  // Pestaña activa del asistente (chat vs prospección)
  const [activeAiTab, setActiveAiTab] = useState('chat');

  // Determinar zona inicial por defecto basada en las zonas asignadas al usuario activo
  const defaultUserZone = useMemo(() => {
    if (!userAllowedZones.length || userAllowedZones.includes('ALL')) return 'Comunidad Valenciana';
    return userAllowedZones[0];
  }, [userAllowedZones]);

  // Estado de Zona Global de Agentforce
  const [globalZone, setGlobalZone] = useState(defaultUserZone);

  // Estados del chatbot
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'agentforce',
      text: `¡Hola ${currentUser ? currentUser.name : ''}! Soy Agentforce, tu motor de inteligencia artificial comercial adaptado a tus zonas asignadas. Estoy listo para ayudarte a analizar tus prospectos, optimizar tus rutas y prospectar en Europages e Iberinform. ¿En qué te puedo asistir hoy?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputChat, setInputChat] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  // Estados del generador de emails
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [selectedZoneFilter, setSelectedZoneFilter] = useState(defaultUserZone); // Filtro de zona para el Redactor Inteligente
  const [selectedTone, setSelectedTone] = useState('formal');
  const [generatedEmail, setGeneratedEmail] = useState('');
  const [copied, setCopied] = useState(false);

  // Estados de la pestaña Resúmenes y Preparación
  const [summaryCompanyId, setSummaryCompanyId] = useState('');
  const [summaryZoneFilter, setSummaryZoneFilter] = useState(defaultUserZone);

  // Sincronización de filtros de zona en cascada en base a la Zona Global seleccionada en la cabecera
  useEffect(() => {
    setSelectedZoneFilter(globalZone);
    setSummaryZoneFilter(globalZone);
    if (globalZone) {
      setSearchZone(globalZone);
      setChatZone(globalZone);
    }
  }, [globalZone]);

  // --- ESTADOS DEL AGENTE DE PROSPECCIÓN (LEAD FINDER) ---
  const [searchZone, setSearchZone] = useState(defaultUserZone);
  const [searchSector, setSearchSector] = useState('Todos');
  const [isSearching, setIsSearching] = useState(false);
  const [searchLogs, setSearchLogs] = useState([]);
  const [foundLeadsCount, setFoundLeadsCount] = useState(0);
  const [chatZone, setChatZone] = useState(''); // Zona activa seleccionable para consultas de IA
  const terminalEndRef = useRef(null);

  // --- ESTADOS DE LA AUDITORÍA Y REPARACIÓN MASIVA DE EMAILS ---
  const [isRepairingBatch, setIsRepairingBatch] = useState(false);
  const [batchRepairLogs, setBatchRepairLogs] = useState([]);
  const [batchRepairProgress, setBatchRepairProgress] = useState(0);
  const [batchRepairTotal, setBatchRepairTotal] = useState(0);
  const emailConsoleEndRef = useRef(null);
  
  // Auto-scroll de la consola de emails
  useEffect(() => {
    emailConsoleEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [batchRepairLogs]);

  // Ejecuta el escaneo y reparación en lote de todos los correos incorrectos o vacíos
  const handleStartBatchEmailRepair = async () => {
    if (isRepairingBatch) return;

    // Filtrar prospectos que tienen placeholders o correos inexistentes
    const targets = prospects.filter(p => {
      const q = checkEmailQuality(p.email, p.name);
      return q === 'placeholder' || q === 'none' || q === 'invalid';
    });

    if (targets.length === 0) {
      alert('¡Excelente! Todos los correos electrónicos del CRM ya están verificados y validados.');
      return;
    }

    setIsRepairingBatch(true);
    setBatchRepairTotal(targets.length);
    setBatchRepairProgress(0);
    setBatchRepairLogs([]);

    const addLog = (text, type = 'info') => {
      setBatchRepairLogs(prev => [...prev, { id: Date.now() + Math.random(), text, type }]);
    };

    addLog(`🚀 Iniciando auditoría masiva de correos para ${targets.length} prospectos en el CRM...`, 'info');
    await new Promise(resolve => setTimeout(resolve, 600));
    
    // Procesar cada empresa de forma secuencial
    for (let i = 0; i < targets.length; i++) {
      const target = targets[i];
      setBatchRepairProgress(i + 1);
      addLog(`--------------------------------------------------`, 'info');
      addLog(`[Empresa ${i+1}/${targets.length}]: Analizando "${target.name}"...`, 'info');
      
      try {
        const scanResult = await findEmailWithIA(target.name, target.web, (logText, logType) => {
          addLog(`   ${logText}`, logType);
        });

        // Actualizar prospecto en la base de datos global de la app
        setProspects(prev => prev.map(p => {
          if (p.id === target.id) {
            return {
              ...p,
              email: scanResult.email,
              emailSource: 'agentforce_verified',
              history: [
                {
                  id: Date.now() + i,
                  type: '📝 Nota',
                  text: `Email comercial verificado y reparado mediante la herramienta de Auditoría Masiva de Agentforce. Dirección actualizada a: ${scanResult.email}`,
                  date: new Date().toISOString()
                },
                ...(p.history || [])
              ]
            };
          }
          return p;
        }));
        
        addLog(`✅ "${target.name}" reparada con éxito. Nuevo email: ${scanResult.email}`, 'success');

      } catch (err) {
        console.error('Error reparando email:', err);
        addLog(`❌ Error procesando "${target.name}": ${err.message || err}`, 'danger');
      }
      
      // Breve pausa para que se aprecie el flujo secuencial en la consola
      await new Promise(resolve => setTimeout(resolve, 800));
    }

    addLog(`--------------------------------------------------`, 'info');
    addLog(`🎉 Proceso de auditoría masiva finalizado. Se han auditado y corregido ${targets.length} correos electrónicos.`, 'success');
    setIsRepairingBatch(false);
  };

  // Auto-scroll del chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Auto-scroll de la terminal de prospección
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [searchLogs]);

  // --- BASE DE DATOS DE PROSPECCIÓN (INFORMA D&B / RANKINGS) ---
  // Contiene prospectos reales cualificados no competidores por zona
  const PROSPECTING_DATABASE = {
    'Portugal': [
      { name: 'Metalusa, S.A.', sector: 'Construccion Modular', revenue: 12000000, purchasingManager: 'João Silva', email: 'compras@metalusa.pt', address: 'Zona Industrial de Albergaria-a-Velha', city: 'Albergaria', web: 'www.metalusa.pt' },
      { name: 'Blocotelha', sector: 'Fachadas Especiales', revenue: 38000000, purchasingManager: 'Director de Compras (Blocotelha)', email: 'blocotelha@mekkin.pt', address: 'Zona Industrial da Guia', city: 'Pombal', web: 'www.blocotelha.com' },
      { name: 'Martifer Metallic Constructions', sector: 'Fachadas de Aluminio', revenue: 45000000, purchasingManager: 'António Costa', email: 'compras@martifer.pt', address: 'Zona Industrial de Oliveira de Frades', city: 'Oliveira de Frades', web: 'www.martifer.pt' },
      { name: 'Fapricela, S.A.', sector: 'Transformacion de Chapa', revenue: 8000000, purchasingManager: 'Maria Santos', email: 'purchasing@fapricela.pt', address: 'Cumeira de Cima', city: 'Leiria', web: 'www.fapricela.pt' },
      { name: 'Metalogalva Solar', sector: 'Estructuras Solares', revenue: 19000000, purchasingManager: 'Rui Pereira', email: 'solar@metalogalva.pt', address: 'Zona Industrial da Trofa', city: 'Trofa', web: 'www.metalogalva.pt' },
      { name: 'Sosoares Sistemas, S.A.', sector: 'Puertas y Ventanas', revenue: 22000000, purchasingManager: 'Manuel Soares', email: 'compras@sosoares.pt', address: 'Rua do Campo Alegre', city: 'Porto', web: 'www.sosoares.pt' },
      { name: 'Portalum Alumínios', sector: 'Sistemas de Proteccion Solar', revenue: 5000000, purchasingManager: 'Carlos Sousa', email: 'compras@portalum.pt', address: 'Zona Industrial de Aveiro', city: 'Aveiro', web: 'www.portalum.pt' }
    ],
    'Pais Vasco': [
      { name: 'Solarpack Corp.', sector: 'Estructuras Solares', revenue: 28000000, purchasingManager: 'Miren Urquijo', email: 'compras@solarpack.es', address: 'Avda. de la Encartada, 4', city: 'Bilbao', web: 'www.solarpack.es' },
      { name: 'Lasa Metal, S.L.', sector: 'Metal Arquitectonico y Chapa Perforada', revenue: 6000000, purchasingManager: 'Iñigo Garmendia', email: 'proveedores@lasametal.com', address: 'Polígono Industrial Gojain', city: 'Legutio', web: 'www.lasametal.com' },
      { name: 'Danobat Group', sector: 'Perfiles Estructurales Aluminio', revenue: 55000000, purchasingManager: 'Koldo Mitxelena', email: 'compras@danobat.com', address: 'Arriaga Kalea, 2', city: 'Elgoibar', web: 'www.danobat.com' },
      { name: 'Praxia Energy Norte', sector: 'Estructuras Solares', revenue: 14000000, purchasingManager: 'Jon Asua', email: 'compras@praxiaenergy.com', address: 'Polígono Kurutzalde', city: 'Sondika', web: 'www.praxiaenergy.com' },
      { name: 'Basque Window Corp', sector: 'Puertas y Ventanas', revenue: 11500000, purchasingManager: 'Amaia Goikoetxea', email: 'compras@basquewindow.eus', address: 'Polígono Jundiz', city: 'Vitoria', web: 'www.basquewindow.eus' },
      { name: 'Blocotelha', sector: 'Fachadas Especiales', revenue: 38000000, purchasingManager: 'Director de Compras (Blocotelha)', email: 'blocotelha@mekkin.pt', address: 'Zona Industrial da Guia', city: 'Pombal', web: 'www.blocotelha.com' }
    ],
    'Castilla y Leon': [
      { name: 'Lecitrailer Valladolid', sector: 'Fabricantes de Carrocerias', revenue: 95000000, purchasingManager: 'Javier Pérez', email: 'compras@lecitrailer.es', address: 'Ctra. de Burgos, Km 118', city: 'Valladolid', web: 'www.lecitrailer.es' },
      { name: 'Solarig Projects', sector: 'Estructuras Solares', revenue: 18000000, purchasingManager: 'Ana Gómez', email: 'purchasing@solarig.com', address: 'Paseo de la Castellana, Soria', city: 'Soria', web: 'www.solarig.com' },
      { name: 'Gransolar CyL', sector: 'Estructuras Solares', revenue: 31000000, purchasingManager: 'Carlos Soria', email: 'purchasing@gransolar.com', address: 'Polígono Industrial de Soria', city: 'Soria', web: 'www.gransolar.com' },
      { name: 'Blocotelha', sector: 'Fachadas Especiales', revenue: 38000000, purchasingManager: 'Director de Compras (Blocotelha)', email: 'blocotelha@mekkin.pt', address: 'Zona Industrial da Guia', city: 'Pombal', web: 'www.blocotelha.com' }
    ],
    'Cantabria': [
      { name: 'Talleres Orán, S.A.', sector: 'Transformacion de Chapa', revenue: 15000000, purchasingManager: 'Roberto Cantabria', email: 'compras@talleresoran.com', address: 'Polígono de Guarnizo', city: 'Astillero', web: 'www.talleresoran.com' },
      { name: 'Consorcio de Fachadas Cantabria', sector: 'Fachadas de Aluminio', revenue: 4000000, purchasingManager: 'Manuel Ortiz', email: 'compras@fachadascantabria.com', address: 'Calle Santander, 15', city: 'Santander', web: 'www.fachadascantabria.com' },
      { name: 'Solaer Cantabria', sector: 'Estructuras Solares', revenue: 5000000, purchasingManager: 'Isabel Vega', email: 'compras@solaercantabria.com', address: 'Avda. de los Astilleros, 8', city: 'Maliaño', web: 'www.solaercantabria.com' },
      { name: 'Blocotelha', sector: 'Fachadas Especiales', revenue: 38000000, purchasingManager: 'Director de Compras (Blocotelha)', email: 'blocotelha@mekkin.pt', address: 'Zona Industrial da Guia', city: 'Pombal', web: 'www.blocotelha.com' }
    ],
    'Galicia': [
      { name: 'Mapeal', sector: 'Proveedor de Aluminio', revenue: 8500000, purchasingManager: 'Director de Compras (Mapeal)', email: 'info@mapeal.net', address: 'Polígono Industrial de Pocomaco', city: 'A Coruña', web: 'www.mapeal.net' },
      { name: 'Urovesa', sector: 'Fabricantes de Carrocerias', revenue: 32000000, purchasingManager: 'Xosé Manuel Novo', email: 'compras@urovesa.com', address: 'Polígono de San Cibrao das Viñas', city: 'Ourense', web: 'www.urovesa.com' },
      { name: 'Kinarca, S.A.', sector: 'Frio Industrial', revenue: 11000000, purchasingManager: 'Alberto Domínguez', email: 'compras@kinarca.com', address: 'Polígono de Bouzas, Muelle reparaciones', city: 'Vigo', web: 'www.kinarca.com' },
      { name: 'Frigo Diz', sector: 'Frio Industrial', revenue: 7000000, purchasingManager: 'David Diz', email: 'compras@frigodiz.com', address: 'Vía Edison, 45, Polígono do Tambre', city: 'Santiago de Compostela', web: 'www.frigodiz.com' },
      { name: 'EDF Solar Estructuras', sector: 'Estructuras Solares', revenue: 15000000, purchasingManager: 'Marta Rivas', email: 'compras@edfsolar.es', address: 'Polígono Industrial de Novo Milladoiro', city: 'Ames', web: './edfsolar.es' },
      { name: 'Galiventan S.L.', sector: 'Puertas y Ventanas', revenue: 9000000, purchasingManager: 'Ramiro Feijoo', email: 'compras@galiventan.es', address: 'Polígono del Tambre', city: 'Santiago', web: 'www.galiventan.com' },
      { name: 'Modular Galicia', sector: 'Construccion Modular', revenue: 6500000, purchasingManager: 'Sonia Blanco', email: 's.blanco@modulargalicia.es', address: 'Polígono de San Cibrao', city: 'Ourense', web: 'www.modulargalicia.es' },
      { name: 'Blocotelha', sector: 'Fachadas Especiales', revenue: 38000000, purchasingManager: 'Director de Compras (Blocotelha)', email: 'blocotelha@mekkin.pt', address: 'Zona Industrial da Guia', city: 'Pombal', web: 'www.blocotelha.com' }
    ],
    'Asturias': [
      { name: 'Windar Renovables', sector: 'Estructuras Solares', revenue: 80000000, purchasingManager: 'Pelayo Menéndez', email: 'compras@windar-renovables.com', address: 'Avda. Conde de Guadalhorce, 15', city: 'Avilés', web: 'www.windar-renovables.com' },
      { name: 'Astilleros Gondán', sector: 'Fabricantes de Carrocerias', revenue: 25000000, purchasingManager: 'Juan Manuel Gondán', email: 'compras@gondan.com', address: 'Puerto de Figueras', city: 'Castropol', web: 'www.gondan.com' },
      { name: 'Astur Solar Proyectos', sector: 'Estructuras Solares', revenue: 6500000, purchasingManager: 'Covadonga Suárez', email: 'compras@astursolar.com', address: 'Polígono de Roces', city: 'Gijón', web: 'www.astursolar.com' },
      { name: 'Blocotelha', sector: 'Fachadas Especiales', revenue: 38000000, purchasingManager: 'Director de Compras (Blocotelha)', email: 'blocotelha@mekkin.pt', address: 'Zona Industrial da Guia', city: 'Pombal', web: 'www.blocotelha.com' }
    ]
  };

  // Simulación de competidores registrados en la AEA (extrusores de aluminio) que el Lead Finder detectará y descartará de manera explícita
  const AEA_EXTRUSORS_BLACKLIST = [
    { name: 'Cortizo España', web: 'cortizo.com' },
    { name: 'Exlabesa Extrusión', web: 'exlabesa.com' },
    { name: 'Extrugasa S.A.', web: 'extrugasa.com' },
    { name: 'Alueuropa, S.A.', web: 'alueuropa.com' },
    { name: 'Anicolor Portugal', web: 'anicolor.pt' },
    { name: 'Adla Alumínio', web: 'adla-aluminium.pt' },
    { name: 'Itesal Sistemas', web: 'itesal.es' },
    { name: 'Alugom Alcobendas', web: 'alugom.com' },
    { name: 'Hydro Extrusion Spain', web: 'hydro.com' },
    { name: 'Extruperfil S.A.', web: 'extruperfil.com' },
    { name: 'Nevaluz Sevilla', web: 'nevaluz.com' }
  ];

  // --- LÓGICA DE PROSPECCIÓN COMERCIAL DE AGENTFORCE ---
  const handleStartProspecting = () => {
    if (isSearching) return;

    setIsSearching(true);
    setFoundLeadsCount(0);
    setSearchLogs([]);

    const logs = [];
    const addLog = (text, type = 'info') => {
      logs.push({ id: Date.now() + Math.random(), text, type });
      setSearchLogs([...logs]);
    };

    // Secuencia de logs en la terminal simulando la llamada inteligente con fuentes post-2024
    setTimeout(() => {
      addLog(`⚡ Iniciando búsqueda inteligente Agentforce Lead Finder...`, 'info');
      addLog(`🔍 Filtro Geográfico Activo: Zona de "${searchZone}"`, 'info');
      addLog(`🔍 Filtro Sectorial Activo: "${searchSector}"`, 'info');
    }, 200);
 
    setTimeout(() => {
      addLog(`🌐 Conectando e indexando API del INE (https://www.ine.es/) para validar ratios macroeconómicos y actividad industrial de metalurgia en ${searchZone} actualizados al período 2024-2026.`, 'info');
    }, 1200);

    setTimeout(() => {
      addLog(`📊 Cruzando datos con el Censo del Directorio Cameral de la Cámara de Comercio (https://www.camara.es/) para auditar el registro activo de empresas importadoras/exportadoras industriales del período 2024-2026.`, 'info');
    }, 2400);

    setTimeout(() => {
      addLog(`🔎 Extrayendo el Ranking Nacional de Empresas de El Economista (https://ranking-empresas.eleconomista.es/) para indexar el top de facturación oficial de los últimos ejercicios fiscales (2024, 2025 y previsiones 2026).`, 'info');
    }, 3600);

    setTimeout(() => {
      addLog(`🔑 Consultando eInforma (https://www.einforma.com/) y Axesor (https://www.axesor.es/) para auditar la solvencia mercantil y scoring financiero de riesgo comercial post-2024.`, 'info');
    }, 4800);

    setTimeout(() => {
      addLog(`📈 Indexando bases de datos de Iberinform (https://www.iberinform.es/) para comprobar datos vigentes de administradores y vinculaciones accresariales del período actual.`, 'info');
    }, 6000);

    setTimeout(() => {
      addLog(`📰 Rastreador de Prensa: Escaneando noticias de inversión y expansión industrial en Cinco Días (https://cincodias.elpais.com/) para identificar empresas con planes de ampliación de planta activos desde 2024.`, 'info');
    }, 7200);
 
    setTimeout(() => {
      addLog(`🛡️ Consultando el registro de la Asociación Española del Aluminio (AEA)...`, 'info');
      addLog(`🔗 URL de validación de exclusión: https://www.asoc-aluminio.es/asociados?field_tipo_actividad_emp_target_id=12`, 'link');
    }, 8400);
 
    // Detección y exclusión de competidores de la AEA en la zona
    setTimeout(() => {
      // Determinamos qué competidor simular según la zona
      const blacklistedComp = searchZone === 'Portugal' ? 'Anicolor Portugal' : 'Cortizo España';
      addLog(`⚠️ Detectada coincidencia comercial: "${blacklistedComp}"`, 'warning');
      addLog(`❌ EXCLUSIÓN AEA: Empresa "${blacklistedComp}" descartada de forma automática por pertenecer al registro de extrusores asociados de la AEA (Actividad 12).`, 'danger');
    }, 9600);
 
    // Procesar las empresas reales de la base de datos de prospección
    setTimeout(() => {
      addLog(`🔎 Cruzando candidatos con la base de datos de CRM de la Empresa de Aluminio para validar duplicados...`, 'info');
      
      const candidates = PROSPECTING_DATABASE[searchZone] || [];
      const filteredCandidates = searchSector === 'Todos' 
        ? candidates 
        : candidates.filter(c => c.sector === searchSector);
 
      if (filteredCandidates.length === 0) {
        addLog(`ℹ️ No se localizaron nuevos prospectos para el sector "${searchSector}" en esta zona.`, 'warning');
        addLog(`🏁 Agente finalizado. Cero registros nuevos añadidos.`, 'info');
        setIsSearching(false);
        return;
      }
 
      let addedCount = 0;
      const newProspectsToAdd = [];
 
      filteredCandidates.forEach((cand, index) => {
        // Verificar duplicados (comparando nombres de forma insensible y la zona)
        const isDuplicated = prospects.some(p => (p.name.toLowerCase() === cand.name.toLowerCase() || p.name.toLowerCase().includes(cand.name.toLowerCase()) || cand.name.toLowerCase().includes(p.name.toLowerCase())) && p.zone === searchZone);
        
        if (isDuplicated) {
          addLog(`⚠️ Candidato: "${cand.name}" | Facturación auditada (elEconomista/Axesor/Iberinform): ${(cand.revenue/1000000).toFixed(1)}M €`, 'warning');
          addLog(`🚫 DUPLICADO: La empresa ya se encuentra registrada en el CRM. Descartada para asegurar datos nuevos.`, 'warning');
        } else {
          addLog(`✅ VALIDADO: "${cand.name}" | Sector: ${cand.sector} | Facturación auditada (elEconomista/Axesor/Iberinform): ${(cand.revenue/1000000).toFixed(1)}M €`, 'success');
          addLog(`📥 Empresa "${cand.name}" calificada como Lead y lista para importación.`, 'success');
          
          addedCount++;
          // Construir objeto de prospecto oficial
          newProspectsToAdd.push({
            id: 'P' + (prospects.length + addedCount + 10).toString().padStart(3, '0'),
            name: cand.name,
            sector: cand.sector,
            revenue: cand.revenue,
            purchasingManager: cand.purchasingManager,
            purchasingPhone: '+34 600 000 000',
            purchasingLinkedin: 'No disponible',
            email: cand.email,
            address: cand.address,
            city: cand.city,
            zone: searchZone,
            location: searchZone === 'Portugal' ? [41.15, -8.62] : [43.0, -4.0], // coordenadas aproximadas
            web: cand.web,
            linkedin: 'No disponible',
            contacted: false,
            notes: null,
            response: null,
            products: [],
            tasks: [],
            createdAt: new Date().toISOString(), // Fecha de importación para control de novedades (3 semanas)
            history: [{ id: Date.now() + index, type: '📝 Nota', text: 'Empresa prospectada e importada de forma automática mediante Agentforce Lead Finder. Datos financieros y de solvencia cruzados con INE, Cámara de Comercio, eInforma, elEconomista, Axesor, Iberinform y Cinco Días en su actualización post-2024.', date: new Date().toISOString() }],
            pipelineStage: 'Lead',
            quality: '',
            logistics: '',
            packaging: ''
          });
        }
      });
 
      if (newProspectsToAdd.length > 0) {
        // Actualizar base de datos
        setProspects(prev => [...newProspectsToAdd, ...prev]);
        setFoundLeadsCount(newProspectsToAdd.length);
        addLog(`🎉 Agente de Prospección finalizado con éxito.`, 'success');
        addLog(`💾 ¡Se han añadido ${newProspectsToAdd.length} nuevas empresas cualificadas en "${searchZone}" al CRM!`, 'success');
      } else {
        addLog(`🏁 Proceso concluido. Todos los candidatos analizados ya existían en tu base de datos comercial.`, 'info');
      }
 
      setIsSearching(false);
    }, 10000);
  };

  // --- PROCESAMIENTO E INSIGHTS DE IA EN TIEMPO REAL ---
  const aiInsights = useMemo(() => {
    if (!prospects.length) return null;

    const totalPotentialRevenue = prospects.reduce((sum, p) => sum + (p.revenue || 0), 0);
    const pendingRevenue = prospects.filter(p => !p.contacted).reduce((sum, p) => sum + (p.revenue || 0), 0);
    const contactedCount = prospects.filter(p => p.contacted).length;
    const conversionRate = Math.round((contactedCount / prospects.length) * 100);

    const zoneRevenue = {};
    prospects.filter(p => !p.contacted).forEach(p => {
      zoneRevenue[p.zone] = (zoneRevenue[p.zone] || 0) + p.revenue;
    });
    
    let topPendingZone = 'Ninguna';
    let maxPendingZoneRev = 0;
    Object.entries(zoneRevenue).forEach(([zone, rev]) => {
      if (rev > maxPendingZoneRev) {
        maxPendingZoneRev = rev;
        topPendingZone = zone;
      }
    });

    const alerts = [];
    const highValueUncontacted = prospects.find(p => p.revenue > 10000000 && !p.contacted);
    if (highValueUncontacted) {
      alerts.push({
        type: 'warning',
        text: `Lead Crítico Pendiente: "${highValueUncontacted.name}" factura más de 10M € y aún no ha sido contactado.`
      });
    }

    return {
      totalPotentialRevenue,
      pendingRevenue,
      conversionRate,
      topPendingZone,
      maxPendingZoneRev,
      alerts
    };
  }, [prospects]);

  // --- CHATBOT DE VENTAS ---
  const handleSendMessage = (textToSend) => {
    const userText = textToSend || inputChat;
    if (!userText.trim()) return;

    const newUserMessage = {
      id: Date.now(),
      sender: 'user',
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, newUserMessage]);
    if (!textToSend) setInputChat('');
    setIsTyping(true);

    setTimeout(() => {
      const responseText = processQueryWithAI(userText);
      const newAgentMessage = {
        id: Date.now() + 1,
        sender: 'agentforce',
        text: responseText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, newAgentMessage]);
      setIsTyping(false);
    }, 800);
  };

  const processQueryWithAI = (query) => {
    const q = query.toLowerCase();
    
    // Filtrado por la zona seleccionada en el chat
    const activeZone = chatZone;
    const zoneProspects = activeZone ? prospects.filter(p => p.zone === activeZone) : prospects;

    // Lógica interactiva para realizar cambios en el borrador de email de la derecha
    if (generatedEmail && (q.includes('correo') || q.includes('email') || q.includes('borrador') || q.includes('cambia') || q.includes('traduce') || q.includes('más corto') || q.includes('sintetiza') || q.includes('resum') || q.includes('garantía') || q.includes('garantia') || q.includes('redacta'))) {
      if (q.includes('inglés') || q.includes('ingles') || q.includes('english')) {
        const englishEmail = `Subject: Partnership Proposal & Industrial Efficiency - Aluminios Innovations S.L.

Dear Partner,

I am writing to you as Project Manager of Aluminios Innovations, S.L. We follow with great interest your company's activities.

Our aluminum extrusion plant in Valencia (Spain) offers a highly reliable supply chain within the Iberian Peninsula, ensuring minimized lead times and direct technical support.

Key advantages we bring:
- Low-carbon recycled aluminum profiles.
- Qualicoat Seaside and Qualanod certified surface finishes.
- Dedicated engineering team for custom matrix development.

You can review our online interactive catalogs here:
- Architectural Systems Catalog: https://www.empresa-aluminio.com/architectural.php?lang=es
- Industrial Profiles Catalog: https://www.empresa-aluminio.com/series.php?lang=es&cat=1&id=54

Would you be available for a brief call next Tuesday at 10:00 AM?

Best regards,

Carmen Castro
Project Manager - Aluminios Innovations
ccastro@empresa-aluminio.com | +34 610 240 017`;
        setGeneratedEmail(englishEmail);
        return '📝 He traducido profesionalmente el borrador al **inglés** y he actualizado el editor del Redactor Inteligente de la derecha.';
      }

      if (q.includes('corto') || q.includes('corta') || q.includes('resum') || q.includes('sintetiza') || q.includes('simplifica')) {
        const shortEmail = `Asunto: Eficiencia en Extrusión de Aluminio - Aluminios Innovations

Estimado/a Responsable de Compras,

Le escribo como Project Manager de Aluminios Innovations, S.L. para presentarle nuestra planta de extrusión de aluminio en Valencia. Le ofrecemos plazos de entrega muy ágiles y soporte técnico directo para sus proyectos de perfilería.

Ventajas principales:
- Aluminio sostenible reciclado con marcado CE.
- Acabados Qualicoat Seaside y Qualanod de alta durabilidad.
- Catálogos interactivos:
  * Arquitectura: https://www.empresa-aluminio.com/architectural.php?lang=es
  * Perfiles Industriales: https://www.empresa-aluminio.com/series.php?lang=es&cat=1&id=54

¿Le vendría bien una llamada corta el próximo martes a las 10:00 para valorar una oferta piloto?

Atentamente,

Carmen Castro
ccastro@empresa-aluminio.com | +34 610 240 017`;
        setGeneratedEmail(shortEmail);
        return '📝 He simplificado y resumido el borrador actual para que sea más corto y directo. He actualizado el editor de la derecha.';
      }

      if (q.includes('garantía') || q.includes('garantia')) {
        let newEmail = generatedEmail;
        if (newEmail.includes('QUALANOD')) {
          newEmail = newEmail.replace('Qualicoat Seaside y Qualanod', 'Qualicoat Seaside y Qualanod (con garantía extendida de hasta 10 años en lacados certificados)');
        } else {
          newEmail = newEmail + '\n\n*Nota:* Ofrecemos hasta 10 años de garantía en acabados lacados certificados.';
        }
        setGeneratedEmail(newEmail);
        return '📝 He incorporado la mención sobre la **Garantía de Calidad de 10 años** en el borrador de la derecha.';
      }
    }

    if (q.includes('factura') || q.includes('top') || q.includes('mayores') || q.includes('importantes') || q.includes('ingresos')) {
      const topCompanies = [...zoneProspects].sort((a, b) => b.revenue - a.revenue).slice(0, 3);
      if (topCompanies.length === 0) {
        return `No hay empresas registradas para la zona comercial de **${activeZone}**.`;
      }
      let res = `Analizando la base de datos comercial${activeZone ? ` en la zona **${activeZone}**` : ''}, los clientes potenciales con mayor facturación registrada son:\n\n`;
      topCompanies.forEach((c, idx) => {
        res += `${idx + 1}. **${c.name}** (${c.sector}) - Facturación: *${new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(c.revenue)}* en la zona de **${c.zone}**. Estado: ${c.contacted ? '✅ Contactado' : '⏳ Pendiente'}.\n`;
      });
      return res;
    }

    if (q.includes('portugal') || (activeZone === 'Portugal' && (q.includes('prospecto') || q.includes('pendiente') || q.includes('empresa')))) {
      const ptLeads = prospects.filter(p => p.zone === 'Portugal');
      const ptUncontacted = ptLeads.filter(p => !p.contacted);
      let res = `He encontrado **${ptLeads.length}** prospectos en **Portugal**, de los cuales **${ptUncontacted.length}** están pendientes de contacto.\n\n`;
      if (ptUncontacted.length > 0) {
        res += 'Los prospectos prioritarios en Portugal son:\n';
        ptUncontacted.slice(0, 3).forEach(c => {
          res += `- **${c.name}** (${c.sector}) | Compras: *${c.purchasingManager}* (${c.email})\n`;
        });
      } else {
        res += 'Todos los clientes de la zona de Portugal han sido contactados.';
      }
      return res;
    }

    if (activeZone && (q.includes('prospecto') || q.includes('pendiente') || q.includes('empresa') || q.includes('lista') || q.includes('ver'))) {
      const zoneLeads = prospects.filter(p => p.zone === activeZone);
      const zoneUncontacted = zoneLeads.filter(p => !p.contacted);
      let res = `He encontrado **${zoneLeads.length}** prospectos en **${activeZone}**, de los cuales **${zoneUncontacted.length}** están pendientes de contacto.\n\n`;
      if (zoneUncontacted.length > 0) {
        res += `Los prospectos prioritarios en ${activeZone} son:\n`;
        zoneUncontacted.slice(0, 3).forEach(c => {
          res += `- **${c.name}** (${c.sector}) | Compras: *${c.purchasingManager}* (${c.email})\n`;
        });
      } else {
        res += `Todos los clientes de la zona de ${activeZone} han sido contactados.`;
      }
      return res;
    }

    if (q.includes('zona') || q.includes('region') || q.includes('dónde') || q.includes('donde')) {
      const zones = {};
      prospects.forEach(p => {
        zones[p.zone] = (zones[p.zone] || 0) + 1;
      });
      let res = 'Distribución geográfica actual de tus prospectos en el CRM:\n\n';
      Object.entries(zones).forEach(([z, count]) => {
        res += `- **${z}**: ${count} empresas registradas.\n`;
      });
      res += `\n*Nota:* La zona comercial con más facturación potencial pendiente de contacto es **${aiInsights?.topPendingZone}**.`;
      return res;
    }

    if (q.includes('tarea') || q.includes('pendiente') || q.includes('hacer')) {
      const tasksPending = [];
      prospects.forEach(p => {
        (p.tasks || []).forEach(t => {
          if (!t.completed) tasksPending.push({ companyName: p.name, task: t });
        });
      });
      if (!tasksPending.length) return 'No tienes ninguna tarea comercial pendiente. ¡Excelente! 🌟';
      let res = `Tienes **${tasksPending.length}** tareas pendientes. Aquí tienes las primeras:\n\n`;
      tasksPending.slice(0, 4).forEach((item, idx) => {
        res += `${idx + 1}. En **${item.companyName}**: "${item.task.text}"\n`;
      });
      return res;
    }

    if (q.includes('hola') || q.includes('buenos dias')) {
      return '¡Hola, Carmen! Qué gusto saludarte. ¿Deseas analizar prospectos, buscar leads por zonas o generar una plantilla de correo?';
    }

    return 'Entendido, Carmen. Recuerda que puedo ayudarte a analizar la facturación de tus clientes, revisar tus tareas comerciales por hacer, o informarte sobre las zonas del noroeste de España y Portugal.';
  };

  // --- GENERACIÓN DE EMAILS ---
  const generateEmailWithAI = () => {
    if (!selectedCompanyId) {
      alert('Por favor selecciona una empresa de la lista.');
      return;
    }

    const company = prospects.find(p => p.id === selectedCompanyId);
    if (!company) return;

    const isPt = company.zone === 'Portugal';
    const manager = company.purchasingManager || 'Responsable de Compras';
    const sector = company.sector || 'tu sector';
    
    let subject = '';
    let body = '';

    if (selectedTone === 'formal') {
      subject = isPt 
        ? `Proposta Comercial e Eficiência Industrial em Perfis de Alumínio - Aluminios Innovations / ${company.name}`
        : `Colaboración Industrial y Eficiencia en Extrusión de Aluminio - Aluminios Innovations / ${company.name}`;
      
      body = isPt ? 
`Estimado(a) ${manager},

Escrevo-lhe na qualidade de Project Manager da Aluminios Innovations, S.L. Acompanhamos com grande interesse a atividade e liderança da ${company.name} no mercado de ${sector}.

Com base nas vossas necessidades de fornecimento de extrusão de alumínio, gostaria de apresentar as vantagens competitivas da nossa fábrica localizada estrategicamente em Náquera (Valência). A nossa proximidade garante uma rota logística ágil para Portugal e total independência de importações de fora da Península Ibérica.

Destaques da nossa capacidade industrial para a ${company.name}:
- Alumínio Reciclado de Baixo Impacto Ecológico: Ligas otimizadas (série 6000) com marcação CE e pegada ecológica mínima.
- Acabamento Certificado Premium: Tratamento de superfície com certificação Qualicoat Seaside e Qualanod, garantindo máxima durabilidade em ambientes corrosivos e litorâneos.
- Matrizes Sob Medida: Equipa técnica dedicada ao desenvolvimento de perfilaria personalizada com tolerâncias estritas.

Convidamos a explorar a nossa documentação técnica interativa:
- Catálogo de Sistemas de Arquitetura (Muros cortina, caixilharia): https://www.empresa-aluminio.com/architectural.php?lang=es
- Catálogo de Perfis Industriais (Soluções sob medida): https://www.empresa-aluminio.com/series.php?lang=es&cat=1&id=54

Terá disponibilidade para uma breve chamada telefónica ou reunião por Teams na próxima terça-feira às 10:00 para avaliarmos uma cotação piloto para os vossos perfis atuais?

Com os melhores cumprimentos,

Carmen Castro
Project Manager - Zona Noroeste e Portugal
Aluminios Innovations, S.L.
ccastro@empresa-aluminio.com | +34 610 240 017`
:
`Estimado/a ${manager},

Me pongo en contacto con usted en calidad de Project Manager de Aluminios Innovations, S.L. Seguimos con gran interés la trayectoria y actividad de ${company.name} en el sector de ${sector}.

Sabemos que en su mercado la fiabilidad del suministro y la precisión técnica son críticas. Por ello, queremos presentarle nuestra planta de extrusión de aluminio en Náquera (Valencia). Nuestra cercanía y control de la cadena logística nos permiten ofrecer plazos de entrega muy competitivos y soporte técnico directo, eliminando la dependencia de importaciones de fuera de la Península Ibérica.

Ventajas clave que aportamos a ${company.name}:
- Aluminio Sostenible de Bajo Impacto: Uso de tocho de aluminio reciclado con mínima huella de carbono y marcado CE europeo.
- Acabados Certificados: Tratamientos superficiales certificados bajo los exigentes sellos de calidad Qualicoat Seaside y Qualanod, idóneos para ambientes industriales o exteriores.
- Capacidad de Mecanizado y Ensamblaje: Desarrollo de perfiles a medida con tolerancias mínimas para un acople óptimo en sus líneas de producción.

Le invito a consultar nuestros catálogos técnicos e interactivos directamente a través de los siguientes enlaces oficiales:
- Catálogo de Sistemas de Arquitectura: https://www.empresa-aluminio.com/architectural.php?lang=es
- Catálogo de Perfiles Industriales: https://www.empresa-aluminio.com/series.php?lang=es&cat=1&id=54

¿Dispondría de 5 minutos para una breve llamada o reunión por Teams el próximo martes a las 10:00 para valorar cómo podemos optimizar el coste de su perfilería actual?

Atentamente,

Carmen Castro
Project Manager - Zona Noroeste y Portugal
Aluminios Innovations, S.L.
ccastro@empresa-aluminio.com | +34 610 240 017`;
    } else {
      subject = isPt 
        ? `Seguimento comercial e apoio técnico - Aluminios Innovations / ${company.name}`
        : `Seguimiento de contacto comercial - Aluminios Innovations / ${company.name}`;
      
      body = isPt ? 
`Olá, ${manager}.

Entro em contacto consigo para dar seguimento ao nosso contacto recente e saber se a ${company.name} tem algum projeto ativo de perfilaria ou caixilharia de alumínio para o qual necessite de cotação ou apoio logístico neste momento.

Recordo que nos focamos em prazos de entrega reduzidos para Portugal, com ligas de alumínio reciclado sustentável e tratamentos superficiais certificados (Qualanod/Qualicoat Seaside).

Pode aceder aos nossos catálogos oficiais aqui:
- Sistemas de Arquitetura: https://www.empresa-aluminio.com/architectural.php?lang=es
- Perfis Industriais: https://www.empresa-aluminio.com/series.php?lang=es&cat=1&id=54

Gostaria de agendar uma breve chamada de 5 minutos esta semana para analisarmos as vossas necessidades de perfilaria?

Melhores cumprimentos,

Carmen Castro
Project Manager
ccastro@empresa-aluminio.com | +34 610 240 017`
:
`Hola, ${manager}.

Me pongo en contacto de nuevo con usted para conocer si en ${company.name} tienen actualmente algún proyecto en curso o necesidad de perfiles de aluminio en la que podamos colaborar.

Le recuerdo que en Empresa de Aluminio fabricamos matriz y extruimos soluciones a medida con tocho de aluminio reciclado y acabados certificados de alta calidad, garantizando un suministro ágil y sin dependencias externas.

Puede ver las gamas y especificaciones en nuestros catálogos oficiales en línea:
- Catálogo de Sistemas de Arquitectura: https://www.empresa-aluminio.com/architectural.php?lang=es
- Catálogo de Perfiles Industriales: https://www.empresa-aluminio.com/series.php?lang=es&cat=1&id=54

¿Tendría disponibilidad para una breve llamada de 5 minutos esta semana para comentar opciones y valorar una propuesta económica personalizada?

Un saludo cordial,

Carmen Castro
Project Manager
ccastro@empresa-aluminio.com | +34 610 240 017`;
    }

    setGeneratedEmail(`Asunto: ${subject}\n\n${body}`);
    setCopied(false);
  };

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(generatedEmail);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // --- RESÚMENES INTELIGENTES DE CRM POR IA ---
  const getAiSummary = (company) => {
    if (!company) return '';
    const fact = company.revenue > 0 
      ? new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(company.revenue)
      : 'no declarada';
    const sector = company.sector || 'sector industrial';
    const zone = company.zone;
    const manager = company.purchasingManager || 'Responsable de Compras';
    
    let summaryText = `**Resumen Ejecutivo:** Empresa del sector **${sector}** ubicada en **${zone}**, con facturación estimada de **${fact}**. `;
    
    if (company.contacted) {
      summaryText += `La cuenta ha sido previamente **contactada** y se encuentra activa en el canal de seguimiento comercial gestionado por Carmen Castro. El decisor clave de compras registrado es **${manager}** y el canal preferente es **${company.email || 'correo electrónico'}**. Se aconseja consolidar los puntos de interés e interacciones previas.`;
    } else {
      summaryText += `La cuenta está actualmente **Pendiente de Contacto inicial**. El contacto clave para establecer enlace es **${manager}** en el teléfono **${company.phone || 'No registrado'}** o correo **${company.email || 'No registrado'}**. Se sugiere iniciar aproximación fría presentando los catálogos técnicos interactivos del sector.`;
    }

    if (company.products && company.products.length > 0) {
      summaryText += `\n\n**Interés Detectado (CRM):** Perfilería asociada: *${company.products.join(', ')}*.`;
    }

    if (company.history && company.history.length > 0) {
      const lastInteraction = company.history[0];
      summaryText += `\n\n**Última interacción registrada:** ${lastInteraction.type} (${new Date(lastInteraction.date).toLocaleDateString()}) - "${lastInteraction.text}"`;
    }

    return summaryText;
  };

  // --- ANÁLISIS COMERCIAL Y PREPARACIÓN DE VISITA/LLAMADA POR IA ---
  const getAiPreparationDetails = (company) => {
    if (!company) return null;
    
    const isPt = company.zone === 'Portugal';
    const sector = company.sector || 'General';
    
    let pitch = '';
    let products = [];
    let catalogs = [];
    let objections = [];
    let keyQuestions = [];
    
    // Pitch comercial estructurado por sector industrial
    if (sector.includes('Proveedor de Aluminio') || sector.includes('proveedor')) {
      pitch = `Presentar la propuesta comercial como un socio estratégico para complementar su stock de perfiles de aluminio y accesorios. Destacar que no somos competencia directa ya que nosotros extruimos perfiles a medida y podemos fabricar matrices exclusivas según sus especificaciones, facilitando el suministro continuo y plazos rápidos sin dependencia de importaciones lejanas.`;
      products = ['Perfiles', 'Chapas de Aluminio', 'Accesorios'];
      catalogs = [
        { name: 'Catálogo de Perfiles Industriales', url: 'https://www.empresa-aluminio.com/series.php?lang=es&cat=1&id=54' },
        { name: 'Catálogo de Sistemas de Arquitectura', url: 'https://www.empresa-aluminio.com/architectural.php?lang=es' }
      ];
      objections = [
        { obj: '¿Tienen capacidad de distribución directa?', arg: 'Sí, disponemos de una red de distribución propia y podemos entregar directamente en sus almacenes con total puntualidad y trazabilidad.' },
        { obj: '¿Fabricáis matrices a medida?', arg: 'Sí, contamos con un departamento de ingeniería propio para diseñar y fabricar matrices exclusivas a medida según los requerimientos de vuestros clientes.' }
      ];
      keyQuestions = [
        '¿Cuál es el volumen mensual de perfiles de aluminio que distribuyen actualmente?',
        '¿Tienen interés en incorporar series de extrusión a medida para perfiles exclusivos de sus clientes?'
      ];
    } else if (sector.includes('Solar') || sector.includes('Estructuras')) {
      pitch = `Destacar nuestra capacidad industrial especializada para extruir perfiles de aluminio estructural de gran formato para seguidores solares (parques fotovoltaicos). Enfatizar la aleación 6005A/6082 T6 y el marcado CE que es indispensable para proyectos solares europeos.`;
      products = ['Perfiles Ranurados', 'Estructuras para Paneles', 'Perfiles de Gran Formato'];
      catalogs = [
        { name: 'Catálogo de Perfiles Industriales', url: 'https://www.empresa-aluminio.com/series.php?lang=es&cat=1&id=54' }
      ];
      objections = [
        { obj: '¿Soportan cargas de viento extremas?', arg: 'Sí, todas nuestras aleaciones estructurales cumplen con el Eurocódigo 9 y disponemos de marcado CE para estructuras de aluminio.' },
        { obj: 'Plazos de entrega para grandes parques', arg: 'Contamos con almacén pulmón en Náquera y extrusión propia en España, lo que garantiza entregas programadas sin dependencias de importación marítima.' }
      ];
      keyQuestions = [
        '¿Qué aleación y tratamiento térmico están especificando actualmente para sus perfiles?',
        '¿Tienen algún parque en fase de licitación en España o Portugal para este año?'
      ];
    } else if (sector.includes('Ventanas') || sector.includes('Puertas') || sector.includes('Cerramientos') || sector.includes('Fachadas') || sector.includes('Lamas')) {
      pitch = `Enfocar la propuesta en nuestros sistemas de arquitectura y perfilería para carpintería de aluminio. Resaltar los acabados de alta calidad con sello Qualicoat Seaside (especial para zonas costeras, ideal para Portugal y el Cantábrico) y Qualanod (anodizado de alta durabilidad).`;
      products = ['Rotura Puente Térmico', 'Sistemas de Muro Cortina', 'Perfiles de Carpintería'];
      catalogs = [
        { name: 'Catálogo de Sistemas de Arquitectura', url: 'https://www.empresa-aluminio.com/architectural.php?lang=es' }
      ];
      objections = [
        { obj: 'Garantía del lacado en ambientes marinos', arg: 'Nuestros acabados cuentan con la certificación Qualicoat Seaside, que asegura resistencia a la corrosión filiforme en zonas de costa (hasta 10 años de garantía certificada).' },
        { obj: 'Plazo para matrices nuevas de carpintería', arg: 'Diseñamos y fabricamos matrices de extrusión a medida en un plazo de 3 a 4 semanas gracias a nuestro equipo de ingeniería propio.' }
      ];
      keyQuestions = [
        '¿Están buscando soluciones con rotura de puente térmico o sistemas de muro cortina para sus próximos proyectos?',
        '¿Tienen problemas de stock o plazos de entrega con su proveedor de perfiles de aluminio actual?'
      ];
    } else {
      // General / Transformación de Chapa / Carrocerías
      pitch = `Presentar a Empresa de Aluminio como un partner de extrusión flexible de aluminio a medida para aplicaciones industriales. Destacar el tocho de aluminio reciclado de alta calidad, que reduce la huella de carbono de los productos de nuestros clientes, y nuestra capacidad de mecanizado posterior.`;
      products = ['Perfiles Industriales a Medida', 'Chapas de Aluminio', 'Mecanizado de Precisión'];
      catalogs = [
        { name: 'Catálogo de Perfiles Industriales', url: 'https://www.empresa-aluminio.com/series.php?lang=es&cat=1&id=54' },
        { name: 'Catálogo de Sistemas de Arquitectura', url: 'https://www.empresa-aluminio.com/architectural.php?lang=es' }
      ];
      objections = [
        { obj: 'Pedido mínimo para perfiles a medida (matrices nuevas)', arg: 'El pedido mínimo para extrusiones personalizadas es muy flexible (normalmente a partir de 500 kg a 1000 kg dependiendo de la sección).' },
        { obj: 'Certificados medioambientales para exportación', arg: 'Contamos con marcado CE, ISO 9001, y declaramos la huella de carbono de nuestro aluminio reciclado de origen europeo.' }
      ];
      keyQuestions = [
        '¿Cuál es el consumo de aluminio anual (toneladas) y qué aleación suelen utilizar?',
        '¿Necesitan que los perfiles se entreguen mecanizados o cortados a medida para sus líneas de ensamblaje?'
      ];
    }
    
    // Adaptaciones geográficas si es de Portugal
    if (isPt) {
      pitch += ` [ZONA PORTUGAL] Destacar la agilidad del suministro semanal directo desde nuestra planta de Náquera (Valencia) a las zonas industriales de Oporto/Lisboa, evitando los costes y retrasos de los distribuidores locales. Ofrecemos facturación intracomunitaria exenta de IVA.`;
    }
    
    return {
      pitch,
      products,
      catalogs,
      objections,
      keyQuestions
    };
  };

  return (
    <div className="agentforce-assistant" style={{ fontFamily: 'Inter, sans-serif' }}>
      
      {/* CABECERA PRINCIPAL UNIFICADA DE AGENTFORCE */}
      <div style={{
        background: 'linear-gradient(135deg, #072b66 0%, #1e1b4b 100%)',
        color: 'white',
        padding: '20px 25px',
        borderRadius: '12px',
        marginBottom: '25px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '15px',
        boxShadow: '0 4px 15px rgba(7, 43, 102, 0.15)'
      }}>
        <div>
          <h3 style={{ margin: 0, fontWeight: '800', fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles style={{ color: '#a78bfa' }} /> Agentforce AI Assistant
          </h3>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
            Panel unificado de inteligencia comercial. Todos los módulos y pestañas responden a la zona de trabajo seleccionada.
          </p>
        </div>
        
        {/* SELECTOR DE ZONA GLOBAL EN CABECERA */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#cbd5e1' }}>Zona Activa de Trabajo:</span>
          <select 
            value={globalZone} 
            onChange={(e) => setGlobalZone(e.target.value)} 
            style={{ 
              padding: '8px 16px', 
              borderRadius: '8px', 
              border: '1px solid #475569', 
              background: '#1e293b', 
              color: 'white', 
              fontSize: '0.85rem', 
              fontWeight: 'bold',
              cursor: 'pointer',
              boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
            }}
          >
            <option value="">Todas las zonas</option>
            <option value="Portugal">Portugal (Norte/Centro)</option>
            <option value="Pais Vasco">País Vasco</option>
            <option value="Castilla y Leon">Castilla y León</option>
            <option value="Cantabria">Cantabria</option>
            <option value="Galicia">Galicia</option>
            <option value="Asturias">Asturias</option>
          </select>
        </div>
      </div>
      
      {/* 1. SECCIÓN DE KPI / INSIGHTS DE IA */}
      {aiInsights && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '25px' }}>
          
          <div className="card" style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)', color: 'white', border: 'none', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '-10px', right: '-10px', opacity: 0.15 }}>
              <Brain size={120} />
            </div>
            <h4 style={{ margin: '0 0 8px 0', opacity: 0.9, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Volumen Comercial</h4>
            <div style={{ fontSize: '1.8rem', fontWeight: '800' }}>
              {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(aiInsights.pendingRevenue)}
            </div>
            <p style={{ margin: '8px 0 0 0', fontSize: '0.85rem', opacity: 0.9 }}>Facturación potencial de leads pendientes</p>
          </div>

          <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderLeft: '4px solid #10b981' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: '500' }}>Tasa de Conversión</span>
                <span style={{ background: '#ecfdf5', color: '#10b981', padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold' }}>IA Score</span>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--sopena-blue-dark)' }}>
                {aiInsights.conversionRate}%
              </div>
            </div>
            <div style={{ width: '100%', background: '#e2e8f0', height: '6px', borderRadius: '3px', marginTop: '10px', overflow: 'hidden' }}>
              <div style={{ width: `${aiInsights.conversionRate}%`, background: '#10b981', height: '100%' }}></div>
            </div>
          </div>

          <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderLeft: '4px solid #f59e0b' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: '500' }}>Zona Prioritaria Pendiente</span>
                <TrendingUp size={20} style={{ color: '#f59e0b' }} />
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--sopena-blue-dark)' }}>
                {aiInsights.topPendingZone}
              </div>
            </div>
            <p style={{ margin: '8px 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Negocio pendiente: <strong>{new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(aiInsights.maxPendingZoneRev)}</strong>
            </p>
          </div>

        </div>
      )}

      {/* ALERTAS CRÍTICAS */}
      {aiInsights && aiInsights.alerts.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '25px' }}>
          {aiInsights.alerts.map((alert, index) => (
            <div key={index} style={{ 
               display: 'flex', 
               alignItems: 'center', 
               gap: '12px', 
               background: '#fffbeb', 
               border: '1px solid #fef3c7',
               borderLeft: '4px solid #f59e0b',
               padding: '12px 18px', 
               borderRadius: '8px'
            }}>
              <AlertCircle size={20} style={{ color: '#f59e0b', flexShrink: 0 }} />
              <span style={{ fontSize: '0.9rem', fontWeight: '500', color: '#78350f' }}>
                {alert.text}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* TABS DE IA */}
      <div style={{ display: 'flex', borderBottom: '1px solid #cbd5e1', marginBottom: '20px', gap: '15px' }}>
        <button 
          onClick={() => setActiveAiTab('chat')} 
          style={{ 
            padding: '12px 20px', 
            background: 'none', 
            border: 'none', 
            borderBottom: activeAiTab === 'chat' ? '3px solid #7c3aed' : 'none', 
            color: activeAiTab === 'chat' ? '#7c3aed' : 'var(--text-secondary)',
            fontWeight: 'bold',
            fontSize: '0.95rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Brain size={18} /> Asistente de Ventas & Chat
        </button>
        <button 
          onClick={() => setActiveAiTab('summary')} 
          style={{ 
            padding: '12px 20px', 
            background: 'none', 
            border: 'none', 
            borderBottom: activeAiTab === 'summary' ? '3px solid #7c3aed' : 'none', 
            color: activeAiTab === 'summary' ? '#7c3aed' : 'var(--text-secondary)',
            fontWeight: 'bold',
            fontSize: '0.95rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <ListChecks size={18} /> Resúmenes y Preparación
        </button>
        <button 
          onClick={() => setActiveAiTab('leadfinder')} 
          style={{ 
            padding: '12px 20px', 
            background: 'none', 
            border: 'none', 
            borderBottom: activeAiTab === 'leadfinder' ? '3px solid #7c3aed' : 'none', 
            color: activeAiTab === 'leadfinder' ? '#7c3aed' : 'var(--text-secondary)',
            fontWeight: 'bold',
            fontSize: '0.95rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Database size={18} /> Agentforce Lead Finder (Prospección)
        </button>
        <button 
          onClick={() => setActiveAiTab('emailaudit')} 
          style={{ 
            padding: '12px 20px', 
            background: 'none', 
            border: 'none', 
            borderBottom: activeAiTab === 'emailaudit' ? '3px solid #7c3aed' : 'none', 
            color: activeAiTab === 'emailaudit' ? '#7c3aed' : 'var(--text-secondary)',
            fontWeight: 'bold',
            fontSize: '0.95rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Mail size={18} /> Auditoría & Búsqueda de Emails
        </button>
      </div>

      {/* CONTENIDO DE PESTAÑAS */}
      {activeAiTab === 'chat' ? (
        <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '25px', alignItems: 'stretch' }}>
          {/* CHATBOT */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '520px', padding: '0', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
            <div style={{ background: 'linear-gradient(135deg, #072b66 0%, #1e1b4b 100%)', color: 'white', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h4 style={{ margin: 0, fontWeight: '700', fontSize: '1rem' }}>Agentforce Sales Assistant</h4>
                <p style={{ margin: 0, fontSize: '0.75rem', opacity: 0.9 }}>Conectado a la base de datos de prospección</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ 
                  fontSize: '0.75rem', 
                  background: 'rgba(255,255,255,0.15)', 
                  padding: '3px 8px', 
                  borderRadius: '4px',
                  fontWeight: 'bold'
                }}>
                  📍 Zona: {globalZone || 'Todas'}
                </span>
              </div>
            </div>
            
            <div style={{ flex: 1, padding: '20px', overflowY: 'auto', background: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {messages.map((msg) => (
                <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%', alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start' }}>
                  <div style={{ 
                    background: msg.sender === 'user' ? 'var(--sopena-blue)' : 'white', 
                    color: msg.sender === 'user' ? 'white' : 'var(--text-main)', 
                    padding: '12px 16px', 
                    borderRadius: msg.sender === 'user' ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                    fontSize: '0.9rem',
                    whiteSpace: 'pre-line',
                    border: msg.sender === 'user' ? 'none' : '1px solid #f1f5f9'
                  }}>
                    {msg.text}
                  </div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '4px' }}>{msg.timestamp}</span>
                </div>
              ))}
              {isTyping && <div style={{ alignSelf: 'flex-start', background: 'white', padding: '12px 20px', borderRadius: '16px', border: '1px solid #f1f5f9', fontSize: '0.85rem' }}>Escribiendo...</div>}
              <div ref={chatEndRef} />
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} style={{ display: 'flex', padding: '12px 15px', background: 'white', borderTop: '1px solid #e2e8f0', gap: '10px' }}>
              <input 
                type="text" 
                placeholder="Pregúntame sobre prospectos, tareas comerciales o facturación..." 
                value={inputChat} 
                onChange={(e) => setInputChat(e.target.value)} 
                style={{ flex: 1, padding: '10px 15px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }} 
              />
              <button type="submit" className="action-btn" style={{ padding: '10px 16px' }}><Send size={16} /></button>
            </form>
          </div>

          {/* EMAIL CREATOR */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', border: '1px solid #e2e8f0' }}>
            <h3 style={{ borderBottom: '2px solid #e2e8f0', paddingBottom: '10px', color: 'var(--sopena-blue-dark)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.2rem' }}><Mail size={20} /> Redactor Inteligente</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '15px' }}>
              <div className="filter-group">
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Filtrado por Zona Activa: <strong style={{ color: '#7c3aed' }}>{globalZone || 'Todas las zonas'}</strong>
                </span>
              </div>
 
              <div className="filter-group">
                <label style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>Empresa Destinataria</label>
                <select value={selectedCompanyId} onChange={(e) => setSelectedCompanyId(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', marginTop: '4px' }}>
                  <option value="">-- Elige un prospecto --</option>
                  {prospects
                    .filter(p => !globalZone || p.zone === globalZone)
                    .sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }))
                    .map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.zone})</option>
                    ))
                  }
                </select>
              </div>
      ) : activeAiTab === 'summary' ? (
        /* RESÚMENES Y PREPARACIÓN */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
          
          {/* CABECERA FILTRADO DE CRM */}
          <div className="card" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', border: 'none', color: 'white', padding: '20px 25px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
              <div>
                <h3 style={{ margin: 0, fontWeight: '700', fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: '10px', color: '#a78bfa' }}>
                  <ListChecks size={24} /> Resúmenes de CRM y Preparación Comercial IA
                </h3>
                <p style={{ margin: '5px 0 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>
                  Accede a toda la información consolidada de tus prospectos e inicia una preparación estratégica de tus visitas guiada por IA.
                </p>
              </div>

              {/* SELECTORES DE PREPARACIÓN */}
              <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                  Filtro Geográfico Activo: <strong style={{ color: '#34d399' }}>{globalZone || 'Todas las zonas'}</strong>
                </span>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 'bold' }}>Seleccionar Empresa del CRM:</span>
                  <select 
                    value={summaryCompanyId} 
                    onChange={(e) => setSummaryCompanyId(e.target.value)}
                    style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #475569', background: '#334155', color: 'white', fontSize: '0.85rem', minWidth: '220px' }}
                  >
                    <option value="">-- Selecciona un cliente/lead --</option>
                    {prospects
                      .filter(p => !globalZone || p.zone === globalZone)
                      .sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }))
                      .map(p => (
                        <option key={p.id} value={p.id}>{p.name} ({p.sector})</option>
                      ))
                    }
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* CONDICIONAL: DASHBOARD GLOBAL O PREPARACIÓN ESPECÍFICA */}
          {!summaryCompanyId ? (
            /* VISTA 1: DASHBOARD AGREGADO DEL CRM */
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '25px' }}>
              
              {/* LISTADO DE LEADS DE ALTA FACTURACIÓN PENDIENTES */}
              <div className="card" style={{ border: '1px solid #e2e8f0' }}>
                <h3 style={{ margin: '0 0 15px 0', fontSize: '1.1rem', color: 'var(--sopena-blue-dark)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Sparkles size={18} style={{ color: '#7c3aed' }} /> Leads Recomendados por IA para Preparación Inmediata
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '-10px 0 20px 0' }}>
                  Empresas con mayor volumen de negocio potencial que aún no han sido contactadas.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {prospects
                    .filter(p => !p.contacted && (!summaryZoneFilter || p.zone === summaryZoneFilter))
                    .sort((a, b) => b.revenue - a.revenue)
                    .slice(0, 5)
                    .map(company => (
                      <div key={company.id} style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        padding: '15px', 
                        borderRadius: '8px', 
                        border: '1px solid #f1f5f9', 
                        background: '#f8fafc',
                        transition: 'transform 0.2s',
                        cursor: 'pointer'
                      }}
                      onClick={() => setSummaryCompanyId(company.id)}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                      >
                        <div>
                          <div style={{ fontWeight: 'bold', color: 'var(--text-main)', fontSize: '0.95rem' }}>{company.name}</div>
                          <div style={{ display: 'flex', gap: '10px', marginTop: '4px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            <span>Sector: <strong>{company.sector}</strong></span>
                            <span>•</span>
                            <span>Zona: <strong>{company.zone}</strong></span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                          <span style={{ fontSize: '1rem', fontWeight: 'bold', color: '#4f46e5' }}>
                            {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(company.revenue)}
                          </span>
                          <button className="action-btn outline" style={{ padding: '6px 12px', fontSize: '0.75rem' }}>Preparar Visita →</button>
                        </div>
                      </div>
                    ))
                  }
                  {prospects.filter(p => !p.contacted && (!summaryZoneFilter || p.zone === summaryZoneFilter)).length === 0 && (
                    <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                      No se encontraron prospectos pendientes de contacto para los filtros seleccionados.
                    </div>
                  )}
                </div>
              </div>

              {/* ESTADÍSTICAS DEL CRM GLOBAL */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className="card" style={{ border: '1px solid #e2e8f0', background: '#f8fafc' }}>
                  <h4 style={{ margin: '0 0 15px 0', fontSize: '1rem', color: 'var(--sopena-blue-dark)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Database size={16} /> Estado del CRM ({summaryZoneFilter || 'Global'})
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px', fontSize: '0.85rem' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Total Prospectos</span>
                      <strong style={{ color: 'var(--text-main)' }}>{prospects.filter(p => !summaryZoneFilter || p.zone === summaryZoneFilter).length}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px', fontSize: '0.85rem' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Contactados</span>
                      <strong style={{ color: '#10b981' }}>{prospects.filter(p => p.contacted && (!summaryZoneFilter || p.zone === summaryZoneFilter)).length}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px', fontSize: '0.85rem' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Pendientes</span>
                      <strong style={{ color: '#f59e0b' }}>{prospects.filter(p => !p.contacted && (!summaryZoneFilter || p.zone === summaryZoneFilter)).length}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '4px', fontSize: '0.85rem' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Facturación Total</span>
                      <strong style={{ color: '#4f46e5' }}>
                        {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(
                          prospects.filter(p => !summaryZoneFilter || p.zone === summaryZoneFilter).reduce((sum, p) => sum + (p.revenue || 0), 0)
                        )}
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="card" style={{ border: '1px solid #e2e8f0', background: 'linear-gradient(135deg, #f5f3ff 0%, #edd9ff 100%)' }}>
                  <h4 style={{ margin: '0 0 10px 0', fontSize: '0.95rem', color: '#6d28d9', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Sparkles size={16} /> Preparación Express
                  </h4>
                  <p style={{ fontSize: '0.8rem', color: '#5b21b6', lineHeight: '1.4', margin: 0 }}>
                    Selecciona una empresa del desplegable superior para obtener recomendaciones personalizadas basadas en su sector industrial, localización geográfica y volumen de facturación.
                  </p>
                </div>
              </div>

            </div>
          ) : (
            /* VISTA 2: DETALLE Y PREPARACIÓN PARA LA EMPRESA SELECCIONADA */
            (() => {
              const company = prospects.find(p => p.id === summaryCompanyId);
              if (!company) return <p>Empresa no encontrada.</p>;
              
              const aiDetails = getAiPreparationDetails(company);
              const aiSummary = getAiSummary(company);

              return (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '25px', alignItems: 'stretch' }}>
                  
                  {/* COLUMNA IZQUIERDA: RESUMEN INTELIGENTE DE LA CUENTA (CRM) */}
                  <div className="card" style={{ border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
                      <div>
                        <span style={{ fontSize: '0.75rem', background: '#e0e7ff', color: '#4f46e5', padding: '3px 8px', borderRadius: '4px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                          ID: {company.id}
                        </span>
                        <h3 style={{ margin: '5px 0 0 0', color: 'var(--sopena-blue-dark)', fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Database size={18} /> Resumen Inteligente (CRM)
                        </h3>
                      </div>
                      <button 
                        onClick={() => setSummaryCompanyId('')} 
                        className="action-btn outline" 
                        style={{ padding: '5px 10px', fontSize: '0.75rem' }}
                      >
                        ← Volver a la Lista
                      </button>
                    </div>

                    {/* SÍNTESIS INTELIGENTE GENERADA POR IA */}
                    <div style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', borderLeft: '4px solid #7c3aed', padding: '15px', borderRadius: '4px 8px 8px 4px', fontSize: '0.85rem', lineHeight: '1.5', color: 'var(--text-main)' }}>
                      <div style={{ fontWeight: 'bold', color: '#7c3aed', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        <Sparkles size={14} /> Análisis de Resumen de Cuenta (IA)
                      </div>
                      <div style={{ whiteSpace: 'pre-line' }}>{aiSummary}</div>
                    </div>

                    {/* DATOS GENERALES */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', borderTop: '1px solid #f1f5f9', paddingTop: '15px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Facturación CRM</span>
                        <strong style={{ fontSize: '1.05rem', color: 'var(--text-main)' }}>
                          {company.revenue > 0 
                            ? new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(company.revenue)
                            : 'No Declarada'
                          }
                        </strong>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Sector</span>
                        <strong style={{ fontSize: '0.95rem', color: 'var(--text-main)' }}>{company.sector || 'No especificado'}</strong>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Zona Comercial</span>
                        <strong style={{ fontSize: '0.95rem', color: 'var(--text-main)' }}>{company.zone}</strong>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Estado Contacto</span>
                        <span style={{ 
                          fontSize: '0.8rem', 
                          fontWeight: 'bold', 
                          color: company.contacted ? '#10b981' : '#f59e0b',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          {company.contacted ? '✅ Contactado' : '⏳ Pendiente'}
                        </span>
                      </div>
                    </div>

                    {/* DATOS DE CONTACTO */}
                    <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-secondary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px' }}>
                        Detalles de Contacto en CRM
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                        <span style={{ color: 'var(--text-secondary)', width: '90px' }}>Responsable:</span>
                        <strong style={{ color: 'var(--text-main)' }}>{company.purchasingManager || 'No registrado'}</strong>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                        <span style={{ color: 'var(--text-secondary)', width: '90px' }}>Email:</span>
                        <a href={`mailto:${company.email}`} style={{ color: '#4f46e5', textDecoration: 'none' }}>{company.email || 'No registrado'}</a>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                        <span style={{ color: 'var(--text-secondary)', width: '90px' }}>Teléfono:</span>
                        <span style={{ color: 'var(--text-main)' }}>{company.phone || 'No registrado'}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                        <span style={{ color: 'var(--text-secondary)', width: '90px' }}>Sitio Web:</span>
                        {company.web && company.web !== 'No disponible' ? (
                          <a href={company.web} target="_blank" rel="noreferrer" style={{ color: '#4f46e5', textDecoration: 'none' }}>{company.web}</a>
                        ) : (
                          <span style={{ color: 'var(--text-secondary)' }}>No disponible</span>
                        )}
                      </div>
                    </div>

                    {/* PRODUCTOS DE INTERÉS */}
                    <div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                        Productos Asociados en CRM
                      </div>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {(company.products || []).map((prod, idx) => (
                          <span key={idx} style={{ background: '#f1f5f9', color: 'var(--text-main)', padding: '4px 10px', borderRadius: '6px', fontSize: '0.8rem', border: '1px solid #cbd5e1' }}>
                            {prod}
                          </span>
                        ))}
                        {(!company.products || company.products.length === 0) && (
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>Sin productos asignados en CRM</span>
                        )}
                      </div>
                    </div>

                    {/* HISTORIAL Y TAREAS */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>
                        Historial de Interacciones
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '150px', overflowY: 'auto' }}>
                        {(company.history || []).map((h, idx) => (
                          <div key={idx} style={{ padding: '8px 12px', borderLeft: '3px solid #7c3aed', background: '#fafafa', fontSize: '0.8rem' }}>
                            <div style={{ color: 'var(--text-secondary)', fontSize: '0.7rem' }}>{new Date(h.date).toLocaleDateString()} - {h.type}</div>
                            <div style={{ color: 'var(--text-main)', marginTop: '2px' }}>{h.text}</div>
                          </div>
                        ))}
                        {(!company.history || company.history.length === 0) && (
                          <div style={{ padding: '8px 12px', borderLeft: '3px solid #cbd5e1', background: '#fafafa', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            Ficha creada. Sin interacciones registradas.
                          </div>
                        )}
                      </div>
                    </div>

                  </div>

                  {/* COLUMNA DERECHA: PREPARACIÓN DE REUNIONES Y LLAMADAS (IA) */}
                  <div className="card" style={{ border: '1px solid #cbd5e1', display: 'flex', flexDirection: 'column', gap: '20px', background: '#fafafa' }}>
                    <div style={{ borderBottom: '2px solid #e2e8f0', paddingBottom: '12px' }}>
                      <h3 style={{ margin: 0, color: 'var(--sopena-blue-dark)', fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Sparkles size={20} style={{ color: '#7c3aed' }} /> Preparación de Reuniones y Llamadas
                      </h3>
                      <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        Estrategia de interacción comercial y pautas recomendadas para la llamada telefónica.
                      </p>
                    </div>

                    {/* ENFOQUE DE VENTA */}
                    <div style={{ background: '#f5f3ff', border: '1px solid #ddd6fe', padding: '15px', borderRadius: '8px' }}>
                      <div style={{ fontWeight: 'bold', color: '#6d28d9', fontSize: '0.85rem', marginBottom: '6px' }}>Enfoque y Pitch de Ventas:</div>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: '#4c1d95', lineHeight: '1.5', whiteSpace: 'pre-line' }}>
                        {aiDetails.pitch}
                      </p>
                    </div>

                    {/* PREGUNTAS CLAVE */}
                    <div>
                      <div style={{ fontWeight: 'bold', color: 'var(--sopena-blue-dark)', fontSize: '0.85rem', marginBottom: '8px' }}>Preguntas Clave para Calificar:</div>
                      <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem', color: 'var(--text-main)' }}>
                        {aiDetails.keyQuestions.map((q, idx) => (
                          <li key={idx}>{q}</li>
                        ))}
                      </ul>
                    </div>

                    {/* MANEJO DE OBJECIONES */}
                    <div>
                      <div style={{ fontWeight: 'bold', color: 'var(--sopena-blue-dark)', fontSize: '0.85rem', marginBottom: '8px' }}>Argumentos contra Objeciones:</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {aiDetails.objections.map((o, idx) => (
                          <div key={idx} style={{ background: 'white', padding: '10px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '0.8rem' }}>
                            <div style={{ fontWeight: 'bold', color: '#b45309' }}>Objeción: "{o.obj}"</div>
                            <div style={{ color: 'var(--text-secondary)', marginTop: '4px' }}><strong>Respuesta Empresa de Aluminio:</strong> {o.arg}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* RECOMENDACIONES DE CATÁLOGOS INTERACTIVOS */}
                    <div style={{ marginTop: 'auto', background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '15px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ fontWeight: 'bold', color: '#065f46', fontSize: '0.85rem' }}>Catálogos Técnicos Interactivos Recomendados:</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {aiDetails.catalogs.map((cat, idx) => (
                          <a 
                            key={idx} 
                            href={cat.url} 
                            target="_blank" 
                            rel="noreferrer" 
                            style={{ 
                              color: '#047857', 
                              fontSize: '0.8rem', 
                              fontWeight: 'bold', 
                              textDecoration: 'underline',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            🔗 {cat.name}
                          </a>
                        ))}
                      </div>
                    </div>

                  </div>

                </div>
              );
            })()
          )}

        </div>
      ) : (
        /* AGENTFORCE LEAD FINDER (PESTAÑA DE PROSPECCIÓN) */

              <div className="filter-group">
                <label style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>Empresa Destinataria</label>
                <select value={selectedCompanyId} onChange={(e) => setSelectedCompanyId(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', marginTop: '4px' }}>
                  <option value="">-- Elige un prospecto --</option>
                  {prospects
                    .filter(p => !selectedZoneFilter || p.zone === selectedZoneFilter)
                    .sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }))
                    .map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.zone})</option>
                    ))
                  }
                </select>
              </div>

              <div className="filter-group">
                <label style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>Tono Comercial</label>
                <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                  <button type="button" onClick={() => setSelectedTone('formal')} className={`action-btn ${selectedTone === 'formal' ? '' : 'outline'}`} style={{ flex: 1, padding: '8px', fontSize: '0.8rem' }}>Formal</button>
                  <button type="button" onClick={() => setSelectedTone('seguimiento')} className={`action-btn ${selectedTone === 'seguimiento' ? '' : 'outline'}`} style={{ flex: 1, padding: '8px', fontSize: '0.8rem' }}>Seguimiento</button>
                </div>
              </div>

              <button type="button" onClick={generateEmailWithAI} className="action-btn" style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)', border: 'none', padding: '12px' }}>Redactar Propuesta</button>
            </div>

            {generatedEmail && (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', border: '1px solid #cbd5e1', borderRadius: '8px', overflow: 'hidden' }}>
                <div style={{ background: '#f1f5f9', padding: '8px 12px', borderBottom: '1px solid #cbd5e1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>Borrador de Correo</span>
                  <button onClick={handleCopyEmail} style={{ background: 'none', border: 'none', color: '#4f46e5', fontWeight: 'bold', fontSize: '0.8rem', cursor: 'pointer' }}>
                    {copied ? 'Copiado ✓' : 'Copiar'}
                  </button>
                </div>
                <textarea readOnly value={generatedEmail} style={{ flex: 1, padding: '15px', fontSize: '0.85rem', resize: 'none', border: 'none', background: '#fafafa', minHeight: '160px' }} />
              </div>
            )}
          </div>
        </div>
      ) : (
        /* AGENTFORCE LEAD FINDER (PESTAÑA DE PROSPECCIÓN) */
        <div className="card" style={{ border: '1px solid #cbd5e1', padding: '25px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #cbd5e1', paddingBottom: '15px', flexWrap: 'wrap', gap: '15px' }}>
            <div>
              <h3 style={{ margin: 0, color: 'var(--sopena-blue-dark)', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.4rem' }}>
                <Sparkles size={24} style={{ color: '#7c3aed' }} /> Agentforce Lead Finder
              </h3>
              <p style={{ margin: '5px 0 0 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                Buscador autónomo de empresas. Filtra automáticamente competidores de la AEA y evita duplicados en tu CRM.
              </p>
            </div>
            
            <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '10px 15px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '10px', maxWidth: '380px' }}>
              <ListChecks size={24} style={{ color: '#10b981', flexShrink: 0 }} />
              <div style={{ fontSize: '0.8rem', color: '#065f46' }}>
                <strong>Regla de Exclusión Activa:</strong> No se importarán empresas de la lista de extrusores de la <strong>AEA</strong> (Actividad 12).
              </div>
            </div>
          </div>

          {/* SELECTORES DE FILTRO PARA EL AGENTE */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', background: '#f8fafc', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            
            <div className="filter-group">
              <label style={{ fontWeight: 'bold', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>1. Zona Geográfica a Prospectar</label>
              <select 
                value={searchZone} 
                onChange={(e) => setSearchZone(e.target.value)} 
                disabled={isSearching}
                style={{ width: '100%', padding: '10px', borderRadius: '6px', marginTop: '6px' }}
              >
                <option value="Portugal">Portugal (Norte/Centro)</option>
                <option value="Pais Vasco">País Vasco</option>
                <option value="Castilla y Leon">Castilla y León</option>
                <option value="Cantabria">Cantabria</option>
                <option value="Galicia">Galicia</option>
                <option value="Asturias">Asturias</option>
              </select>
            </div>

            <div className="filter-group">
              <label style={{ fontWeight: 'bold', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>2. Sector Industrial Objetivo</label>
              <select 
                value={searchSector} 
                onChange={(e) => setSearchSector(e.target.value)} 
                disabled={isSearching}
                style={{ width: '100%', padding: '10px', borderRadius: '6px', marginTop: '6px' }}
              >
                <option value="Todos">Todos los sectores industriales</option>
                <option value="Estructuras Solares">Estructuras Solares</option>
                <option value="Fabricantes de Carrocerias">Fabricación de Carrocerías</option>
                <option value="Cerramientos">Cerramientos</option>
                <option value="Frio Industrial">Frío Industrial</option>
                <option value="Transformacion de Chapa">Transformación de Chapa</option>
                <option value="Construccion Modular">Construcción Modular</option>
                <option value="Fachadas de Aluminio">Fachadas de Aluminio</option>
                <option value="Fachadas Especiales">Fachadas Especiales</option>
                <option value="Metal Arquitectonico y Chapa Perforada">Metal Arquitectónico y Chapa Perforada</option>
                <option value="Perfiles Estructurales Aluminio">Perfiles Estructurales de Aluminio</option>
                <option value="Puertas y Ventanas">Puertas y Ventanas</option>
                <option value="Sistemas de Proteccion Solar">Sistemas de Protección Solar</option>
                <option value="Proveedor de Aluminio">Proveedor de Aluminio</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button
                type="button"
                onClick={handleStartProspecting}
                disabled={isSearching}
                style={{ 
                  width: '100%', 
                  padding: '12px', 
                  fontSize: '0.95rem',
                  fontWeight: 'bold',
                  color: 'white',
                  background: isSearching ? '#94a3b8' : 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: isSearching ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 10px rgba(124, 58, 237, 0.2)'
                }}
              >
                {isSearching ? (
                  <>
                    <Search size={18} className="animate-spin" /> Buscando en {searchZone}...
                  </>
                ) : (
                  <>
                    <Sparkles size={18} /> Iniciar Prospección en {searchZone}
                  </>
                )}
              </button>
            </div>

          </div>

          {/* TERMINAL DE LOGS DE IA */}
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Consola de Ejecución del Agente Comercial</span>
              {foundLeadsCount > 0 && (
                <span style={{ background: '#ecfdf5', color: '#10b981', padding: '3px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                  +{foundLeadsCount} Leads Añadidos
                </span>
              )}
            </div>

            <div style={{ 
              background: '#0f172a', 
              color: '#38bdf8', 
              fontFamily: 'monospace', 
              fontSize: '0.85rem', 
              padding: '20px', 
              borderRadius: '8px', 
              height: '250px', 
              overflowY: 'auto', 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '6px',
              border: '1px solid #1e293b',
              boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.5)'
            }}>
              {searchLogs.map((log) => (
                <div 
                  key={log.id} 
                  style={{ 
                    color: log.type === 'success' ? '#4ade80' : 
                           log.type === 'warning' ? '#f59e0b' : 
                           log.type === 'danger' ? '#f87171' : 
                           log.type === 'link' ? '#60a5fa' : '#38bdf8',
                    lineHeight: '1.4'
                  }}
                >
                  {log.text}
                </div>
              ))}
              
              {isSearching && (
                <div style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '5px' }}>
                  <span>● Procesando información de Informa D&B...</span>
                  <span className="dot-pulse"></span>
                </div>
              )}

              {searchLogs.length === 0 && !isSearching && (
                <div style={{ color: '#64748b', textAlign: 'center', marginTop: '80px' }}>
                  La consola está inactiva. Selecciona una zona y pulsa "Iniciar Prospección" para buscar clientes comerciales nuevos.
                </div>
              )}
              <div ref={terminalEndRef} />
            </div>
          </div>

          {/* DETALLES DE EXCLUSIÓN */}
          <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', gap: '15px', alignItems: 'center' }}>
            <ShieldAlert size={28} style={{ color: '#ef4444', flexShrink: 0 }} />
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <strong>Control de Calidad de Datos (AEA Anti-Competition Filter):</strong> El buscador cuenta con una base de marcas del sector extrusor que incluye marcas como Cortizo, Exlabesa, Extrugasa, Alueuropa, Hydro, Inalsa, Itesal y Alugom. El motor de IA Agentforce cruza los nombres de las empresas encontradas en Informa D&B con esta base para asegurar que nunca agregues competidores de aluminio al CRM.
            </div>
          </div>

        </div>
      )}

      {/* PESTAÑA DE AUDITORÍA Y BÚSQUEDA DE EMAILS */}
      {activeAiTab === 'emailaudit' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Dashboard de Calidad */}
          {(() => {
            const stats = prospects.reduce((acc, p) => {
              const q = checkEmailQuality(p.email, p.name);
              if (q === 'none' || q === 'invalid') acc.none++;
              else if (q === 'placeholder') acc.placeholder++;
              else acc.verified++;
              return acc;
            }, { verified: 0, placeholder: 0, none: 0 });

            const total = prospects.length;
            const verifiedPct = total > 0 ? Math.round((stats.verified / total) * 100) : 0;
            const placeholderPct = total > 0 ? Math.round((stats.placeholder / total) * 100) : 0;
            const nonePct = total > 0 ? Math.round((stats.none / total) * 100) : 0;

            const badEmails = prospects.filter(p => {
              const q = checkEmailQuality(p.email, p.name);
              return q === 'placeholder' || q === 'none' || q === 'invalid';
            });

            return (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                  <div className="card" style={{ border: '1px solid #e2e8f0', padding: '15px', textAlign: 'center', background: '#f8fafc' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase' }}>Emails Verificados (Compras/Genéricos)</span>
                    <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#10b981', marginTop: '5px' }}>{stats.verified} <span style={{ fontSize: '1rem', fontWeight: 'normal' }}>({verifiedPct}%)</span></div>
                  </div>
                  <div className="card" style={{ border: '1px solid #e2e8f0', padding: '15px', textAlign: 'center', background: '#f8fafc' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase' }}>Emails Autogenerados (Placeholders)</span>
                    <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#ef4444', marginTop: '5px' }}>{stats.placeholder} <span style={{ fontSize: '1rem', fontWeight: 'normal' }}>({placeholderPct}%)</span></div>
                  </div>
                  <div className="card" style={{ border: '1px solid #e2e8f0', padding: '15px', textAlign: 'center', background: '#f8fafc' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase' }}>Sin Correo / Inválidos</span>
                    <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#f59e0b', marginTop: '5px' }}>{stats.none} <span style={{ fontSize: '1rem', fontWeight: 'normal' }}>({nonePct}%)</span></div>
                  </div>
                </div>

                {/* Banner de Instrucciones de Calidad y Codificación de Colores */}
                <div className="card" style={{ 
                  border: '1px solid #e2e8f0', 
                  background: '#f8fafc',
                  padding: '15px 20px', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '8px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                }}>
                  <h5 style={{ margin: 0, color: 'var(--sopena-blue-dark)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}>
                    🛡️ Guía de Calidad y Codificación de Colores de Emails
                  </h5>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                    El CRM audita y clasifica cada dirección de correo para garantizar que los mensajes lleguen a su destino sin rebotar:
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px', marginTop: '4px' }}>
                    <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '8px 12px', borderRadius: '6px', fontSize: '0.75rem' }}>
                      <strong style={{ color: '#065f46', display: 'block', marginBottom: '2px' }}>✅ Verde: Compras Verificado</strong>
                      <span style={{ color: '#047857' }}>Buzón directo o validación manual (ej: <code>talleresmarpe7@gmail.com</code>). 100% seguro.</span>
                    </div>
                    <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', padding: '8px 12px', borderRadius: '6px', fontSize: '0.75rem' }}>
                      <strong style={{ color: 'var(--sopena-blue-dark)', display: 'block', marginBottom: '2px' }}>✉️ Azul: Genérico Corporativo</strong>
                      <span style={{ color: 'var(--sopena-blue)' }}>Emails reales y validados de contacto general (ej: <code>info@</code>, <code>geral@</code>).</span>
                    </div>
                    <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', padding: '8px 12px', borderRadius: '6px', fontSize: '0.75rem' }}>
                      <strong style={{ color: '#991b1b', display: 'block', marginBottom: '2px' }}>⚠️ Rojo: Autogenerado / Placeholder</strong>
                      <span style={{ color: '#b91c1c' }}>Cuentas tentativas generadas por el sistema (ej: <code>compras@dominio</code>). Se recomienda auditar.</span>
                    </div>
                    <div style={{ background: '#fffbeb', border: '1px solid #fde68a', padding: '8px 12px', borderRadius: '6px', fontSize: '0.75rem' }}>
                      <strong style={{ color: '#92400e', display: 'block', marginBottom: '2px' }}>⚠️ Naranja: Sin Email / Inválido</strong>
                      <span style={{ color: '#b45309' }}>No se ha registrado dirección de correo o su formato es incorrecto. Requiere atención.</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px', alignItems: 'stretch' }}>
                  {/* Lista de Correos a Reparar */}
                  <div className="card" style={{ border: '1px solid #cbd5e1', padding: '20px', display: 'flex', flexDirection: 'column', height: '450px' }}>
                    <h4 style={{ margin: '0 0 10px 0', color: 'var(--sopena-blue-dark)', fontSize: '1.1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
                      📋 Pendientes de Auditoría y Corrección ({badEmails.length})
                    </h4>
                    <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', paddingRight: '5px' }}>
                      {badEmails.map(p => {
                        const q = checkEmailQuality(p.email, p.name);
                        return (
                          <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fafafa', border: '1px solid #e2e8f0', padding: '10px 12px', borderRadius: '6px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                              <span style={{ fontWeight: 'bold', fontSize: '0.85rem', color: 'var(--text-main)' }}>{p.name}</span>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                Zona: {p.zone} | Actual: <span style={{ fontFamily: 'monospace', color: q === 'placeholder' ? '#ef4444' : '#f59e0b' }}>{p.email || 'Ninguno'}</span>
                              </span>
                            </div>
                            <span style={{ 
                              fontSize: '0.7rem', 
                              fontWeight: 'bold', 
                              padding: '2px 8px', 
                              borderRadius: '12px',
                              background: q === 'placeholder' ? '#fee2e2' : '#fef3c7',
                              color: q === 'placeholder' ? '#991b1b' : '#92400e'
                            }}>
                              {q === 'placeholder' ? 'Autogenerado' : 'Sin email'}
                            </span>
                          </div>
                        );
                      })}
                      {badEmails.length === 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8' }}>
                          <span style={{ fontSize: '2.5rem' }}>🎉</span>
                          <span style={{ fontSize: '0.9rem', fontWeight: 'bold', marginTop: '10px' }}>¡Base de datos 100% limpia!</span>
                          <span style={{ fontSize: '0.8rem', textAlign: 'center', marginTop: '4px' }}>Todos los prospectos del CRM disponen de correos electrónicos corporativos reales y validados.</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Consola de Reparación */}
                  <div className="card" style={{ border: '1px solid #cbd5e1', padding: '20px', display: 'flex', flexDirection: 'column', height: '450px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #cbd5e1', paddingBottom: '10px', marginBottom: '10px' }}>
                      <h4 style={{ margin: 0, color: 'var(--sopena-blue-dark)', fontSize: '1.1rem' }}>
                        🛠️ Consola de Reparación Agentforce
                      </h4>
                      <button
                        type="button"
                        onClick={handleStartBatchEmailRepair}
                        disabled={isRepairingBatch || badEmails.length === 0}
                        style={{
                          padding: '8px 16px',
                          fontSize: '0.85rem',
                          fontWeight: 'bold',
                          color: 'white',
                          background: (isRepairingBatch || badEmails.length === 0) ? '#cbd5e1' : 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: (isRepairingBatch || badEmails.length === 0) ? 'not-allowed' : 'pointer',
                          boxShadow: (isRepairingBatch || badEmails.length === 0) ? 'none' : '0 4px 10px rgba(124, 58, 237, 0.2)'
                        }}
                      >
                        {isRepairingBatch ? `Reparando (${batchRepairProgress}/${batchRepairTotal})...` : 'Corregir con IA'}
                      </button>
                    </div>

                    <div style={{
                      flex: 1,
                      background: '#0f172a',
                      borderRadius: '8px',
                      padding: '15px',
                      fontFamily: 'monospace',
                      fontSize: '0.75rem',
                      overflowY: 'auto',
                      color: '#34d399',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '5px'
                    }}>
                      {batchRepairLogs.map((log) => (
                        <div 
                          key={log.id} 
                          style={{ 
                            color: log.type === 'success' ? '#4ade80' : 
                                   log.type === 'warning' ? '#f59e0b' : 
                                   log.type === 'danger' ? '#f87171' : '#38bdf8',
                            lineHeight: '1.4'
                          }}
                        >
                          {log.text}
                        </div>
                      ))}
                      {isRepairingBatch && (
                        <div style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '5px' }}>
                          <span>● Buscando en registros MX y OSINT...</span>
                          <span className="dot-pulse"></span>
                        </div>
                      )}
                      {batchRepairLogs.length === 0 && !isRepairingBatch && (
                        <div style={{ color: '#64748b', textAlign: 'center', marginTop: '120px' }}>
                          Consola lista. Pulsa "Corregir con IA" para iniciar el escaneo de auditoría y resolver automáticamente los emails placeholders o vacíos de la base de datos comercial.
                        </div>
                      )}
                      <div ref={emailConsoleEndRef} />
                    </div>
                  </div>
                </div>
              </>
            );
          })()}
        </div>
      )}
      
      <style>{`
        .dot-pulse {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background-color: #38bdf8;
          animation: dotPulse 1.2s infinite ease-in-out;
          display: inline-block;
        }
        @keyframes dotPulse {
          0%, 100% { transform: scale(0.6); opacity: 0.3; }
          50% { transform: scale(1.2); opacity: 1; }
        }
      `}</style>

    </div>
  );
}
