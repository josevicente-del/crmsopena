// Importamos los hooks de React (React no se importa directamente porque no se usa en el alcance)
import { useState, useEffect, useMemo, useRef } from 'react';
// Importamos únicamente los iconos de lucide-react que se utilizan en la aplicación
import { MapPin, Building2, Briefcase, FileText, CheckCircle, Navigation, Sparkles, Mic, MicOff, Database, Mail, Download, Smartphone, Info } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
// html2canvas: captura el DOM renderizado para exportar a PDF interactivo
import html2canvas from 'html2canvas';
// jsPDF: genera el archivo PDF con soporte de links activos
import { jsPDF } from 'jspdf';
import rawProspects from './data/prospects.json';
import './App.css';
import './index.css';
import { calculateShortestDistance } from './utils/distance';
import AgentforceAssistant from './components/AgentforceAssistant';
import { findEmailWithIA, checkEmailQuality } from './utils/emailFinderEngine';
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});
// Haversine distance calculator
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  return R * c;
}
const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => localStorage.getItem('aluminio_auth') === 'true');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState(false);
  const [activeTab, setActiveTab] = useState('prospects');
  const [showWhatsNew, setShowWhatsNew] = useState(false);
  const [showBackupPrompt, setShowBackupPrompt] = useState(false);
  
  // ==========================================
  // ESTADOS Y LÓGICA DE CLOUDFLARE PROTECTION
  // ==========================================
  const [isPassingCloudflare, setIsPassingCloudflare] = useState(() => {
    // Si el usuario ya está autenticado, no mostramos el portal de verificación.
    const alreadyAuth = localStorage.getItem('aluminio_auth') === 'true';
    if (alreadyAuth) return false;
    // Si ya superó el desafío en esta sesión de navegación, no lo molestamos otra vez.
    return sessionStorage.getItem('cloudflare_passed') !== 'true';
  });
  
  // Estado interno del desafío:
  // - 'analyzing': El sistema realiza un análisis inicial silencioso del navegador
  // - 'waiting_interaction': Se requiere interacción con el widget (Turnstile) o espera la resolución automática
  // - 'verifying': Mostramos el spinner de carga de Cloudflare simulando la verificación activa
  // - 'success': Muestra el checkmark verde indicando acceso seguro concedido
  const [cloudflareState, setCloudflareState] = useState('analyzing');
  const [rayId, setRayId] = useState('');
  const [userIp, setUserIp] = useState('');

  // Generar datos únicos del Ray ID y simular la detección de IP al cargar la pantalla
  useEffect(() => {
    if (isPassingCloudflare) {
      // Generación de Ray ID hexadecimal con formato oficial de Cloudflare
      const hexChars = '0123456789abcdef';
      let generatedRay = '';
      for (let i = 0; i < 16; i++) {
        generatedRay += hexChars[Math.floor(Math.random() * hexChars.length)];
      }
      setRayId(generatedRay);

      // Simulación de detección de la IP pública del usuario
      const simulatedIps = [
        '185.156.172.5',
        '84.120.93.104',
        '192.168.1.88',
        '2.136.242.19',
        '90.163.20.154'
      ];
      setUserIp(simulatedIps[Math.floor(Math.random() * simulatedIps.length)]);

      // 1. Análisis inicial silencioso (1.5 segundos)
      const analysisTimer = setTimeout(() => {
        setCloudflareState('waiting_interaction');
      }, 1500);

      // 2. Auto-resolución en caso de inactividad (después de 3.5s en waiting, total 5s)
      const autoResolveTimer = setTimeout(() => {
        setCloudflareState('verifying');
        const verificationTimer = setTimeout(() => {
          setCloudflareState('success');
          const finalTimer = setTimeout(() => {
            setIsPassingCloudflare(false);
            sessionStorage.setItem('cloudflare_passed', 'true');
          }, 800);
          return () => clearTimeout(finalTimer);
        }, 1200);
        return () => clearTimeout(verificationTimer);
      }, 5000);

      return () => {
        clearTimeout(analysisTimer);
        clearTimeout(autoResolveTimer);
      };
    }
  }, [isPassingCloudflare]);

  // Manejo de la verificación por interacción directa (clic en el checkbox)
  const handleTurnstileClick = () => {
    if (cloudflareState !== 'waiting_interaction') return;
    setCloudflareState('verifying');
    
    // Simula una verificación activa y rápida (1.2 segundos) tras hacer clic
    setTimeout(() => {
      setCloudflareState('success');
      // Espera corta con el check de éxito verde para la confirmación visual
      setTimeout(() => {
        setIsPassingCloudflare(false);
        sessionStorage.setItem('cloudflare_passed', 'true');
      }, 800);
    }, 1200);
  };

  // Activa la pantalla de Cloudflare bajo demanda para pruebas o simulación de DDoS
  const triggerDdosSimulation = () => {
    sessionStorage.removeItem('cloudflare_passed');
    setCloudflareState('analyzing');
    setIsPassingCloudflare(true);
  };
  
  // Evalúa si el usuario abre la aplicación con nuevas características pendientes de ver
  useEffect(() => {
    const lastSeenVersion = localStorage.getItem('aluminio_whats_new_version');
    if (lastSeenVersion !== 'v1.2') {
      setShowWhatsNew(true);
    }
  }, []);

  // Control periódico del recordatorio de copia de seguridad (dos veces por semana)
  useEffect(() => {
    const lastPrompt = localStorage.getItem('aluminio_last_backup_prompt');
    const now = Date.now();
    const threeDaysMs = 3 * 24 * 60 * 60 * 1000; // ~3 días (dos veces por semana)
    
    if (!lastPrompt || (now - parseInt(lastPrompt, 10)) > threeDaysMs) {
      setShowBackupPrompt(true);
    }
  }, []);

  const handleCloseBackupPrompt = () => {
    localStorage.setItem('aluminio_last_backup_prompt', String(Date.now()));
    setShowBackupPrompt(false);
  };
  const handleCloseWhatsNew = () => {
    localStorage.setItem('aluminio_whats_new_version', 'v1.2');
    setShowWhatsNew(false);
  };
  
  // CRM Modal State
  const [selectedProspect, setSelectedProspect] = useState(null);
  const [activeModalTab, setActiveModalTab] = useState('contacto');

  // Estados para el buscador de emails de Agentforce
  const [emailScannerTarget, setEmailScannerTarget] = useState(null);
  const [emailScannerLogs, setEmailScannerLogs] = useState([]);
  const [emailScannerStatus, setEmailScannerStatus] = useState('idle');
  const [emailScannerResult, setEmailScannerResult] = useState('');

  // Inicia el análisis inteligente de email para una sola empresa
  const startSingleEmailScan = (prospect) => {
    setEmailScannerTarget(prospect);
    setEmailScannerLogs([]);
    setEmailScannerStatus('scanning');
    setEmailScannerResult('');
    
    findEmailWithIA(prospect.name, prospect.web, (logText, logType) => {
      setEmailScannerLogs(prev => [...prev, { text: logText, type: logType }]);
    }).then(result => {
      setEmailScannerStatus('found');
      setEmailScannerResult(result.email);
    }).catch(err => {
      console.error('Error en escáner de email:', err);
      setEmailScannerStatus('error');
    });
  };

  // Aplica el email verificado encontrado a la base de datos local y del modal
  const handleApplyEmailFind = (companyId, foundEmail) => {
    setProspects(prev => prev.map(p => {
      if (p.id === companyId) {
        return {
          ...p,
          email: foundEmail,
          emailSource: 'agentforce_verified',
          history: [
            {
              id: Date.now(),
              type: '📝 Nota',
              text: `Email comercial verificado y reparado con Agentforce IA. Dirección actualizada a: ${foundEmail}`,
              date: new Date().toISOString()
            },
            ...(p.history || [])
          ]
        };
      }
      return p;
    }));
    
    // Actualizar el prospecto seleccionado actualmente en el modal para reflejar cambios
    setSelectedProspect(prev => {
      if (prev && prev.id === companyId) {
        return { ...prev, email: foundEmail };
      }
      return prev;
    });

    const emailInput = document.getElementById('modalProspectEmailInput');
    if (emailInput) {
      emailInput.value = foundEmail;
    }
    
    setEmailScannerTarget(null);
  };
  // Speech Recognition States
  const [activeSpeechInput, setActiveSpeechInput] = useState(null); // 'newTaskInput' | 'newHistoryText' | null
  const recognitionRef = useRef(null);
  /**
   * Activa o desactiva el reconocimiento de voz para un input de texto.
   * @param {string} inputId - ID del input de texto a rellenar
   * @param {string} lang - Idioma de transcripción (es-ES o pt-PT)
   */
  const toggleSpeechRecognition = (inputId, lang = 'es-ES') => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('El dictado por voz no está soportado en este navegador. Utilice Google Chrome o MS Edge.');
      return;
    }
    if (activeSpeechInput === inputId) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setActiveSpeechInput(null);
      return;
    }
    // Detener cualquier otra grabación activa
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    try {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = lang;
      rec.onstart = () => {
        setActiveSpeechInput(inputId);
      };
      rec.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        const inputElement = document.getElementById(inputId);
        if (inputElement) {
          const currentVal = inputElement.value;
          inputElement.value = currentVal ? `${currentVal} ${transcript}` : transcript;
        }
      };
      rec.onerror = (err) => {
        console.error('Error de reconocimiento de voz:', err);
        setActiveSpeechInput(null);
      };
      rec.onend = () => {
        setActiveSpeechInput(null);
      };
      recognitionRef.current = rec;
      rec.start();
    } catch (e) {
      console.error('Error al iniciar SpeechRecognition:', e);
      setActiveSpeechInput(null);
    }
  };
  
  const [prospects, setProspects] = useState(() => {
    try {
      // Limpiar versiones antiguas masivas que excedan la cuota de LocalStorage
      try { localStorage.removeItem('aluminio_crm_data'); } catch (e) {}
      
      let deletedRecords = [];
      try {
        const deletedSaved = localStorage.getItem('aluminio_crm_deleted');
        deletedRecords = deletedSaved ? JSON.parse(deletedSaved) : [];
        if (!Array.isArray(deletedRecords)) deletedRecords = [];
      } catch (e) {
        localStorage.removeItem('aluminio_crm_deleted');
      }
      const deletedIds = new Set(deletedRecords.map(r => typeof r === 'object' ? r.id : r));
      
      const forbiddenDomains = ['adla-aluminium.pt', 'extrugasa.com', 'anicolor.pt', 'accelum.pt', 'tafe.pt', 'cortizo.com', 'camillasgalicia.es', 'raesa.com', 'extralum.es', 'grupoayuso'];
      const forbiddenNames = ['adla', 'extrugasa', 'anicolor', 'accelum', 'tafe', 'cortizo', 'camillasgalicia', 'raesa', 'extralum', 'ayuso'];

      const sanitize = (list) => {
        return list
          .filter(p => {
            if (p.web) {
              const matchesForbidden = forbiddenDomains.some(domain => p.web.includes(domain));
              if (matchesForbidden) return false;
            }
            if (p.name) {
              const matchesName = forbiddenNames.some(name => p.name.toLowerCase().includes(name.toLowerCase()));
              if (matchesName) return false;
            }
            return true;
          })
          .map(p => {
            let clean = { ...p };
            if (!clean.location || !Array.isArray(clean.location) || clean.location.length !== 2 || isNaN(clean.location[0]) || isNaN(clean.location[1])) {
              clean.location = [40, -4];
            }
            if (!clean.products || !Array.isArray(clean.products)) clean.products = [];
            if (!clean.tasks || !Array.isArray(clean.tasks)) clean.tasks = [];
            if (!clean.history || !Array.isArray(clean.history)) clean.history = [];
            return clean;
          });
      };

      const savedMods = localStorage.getItem('aluminio_crm_modifications');
      if (savedMods) {
        try {
          const parsedMods = JSON.parse(savedMods);
          if (Array.isArray(parsedMods) && parsedMods.length > 0) {
            const modsMap = new Map(parsedMods.map(m => [m.id, m]));
            const merged = rawProspects
              .filter(p => !deletedIds.has(p.id))
              .map(p => {
                const mod = modsMap.get(p.id);
                return mod ? { ...p, ...mod } : p;
              });
            return sanitize(merged);
          }
        } catch (e) {
          localStorage.removeItem('aluminio_crm_modifications');
        }
      }
      return sanitize(rawProspects.filter(p => !deletedIds.has(p.id)));
    } catch (err) {
      console.error('Error al inicializar prospectos:', err);
      return rawProspects;
    }
  });
  // ==========================================
  // CONFIGURACIÓN DE USUARIOS GRUPO SOPEÑA
  // ==========================================
  const SOPENA_USERS = useMemo(() => ({
    admin: {
      username: 'admin',
      name: 'Superadministrador Grupo Sopeña',
      role: 'Superadministrador',
      email: 'admin@gruposopena.com',
      phone: '+34 900 000 000',
      whatsapp: '',
      zones: ['ALL'],
      isDefaultPass: true,
      defaultPass: 'lacado2025'
    },
    ccastro: {
      username: 'ccastro',
      name: 'Carlos Castro',
      role: 'Comercial Noroeste y Portugal',
      email: 'ccastro@gruposopena.com',
      phone: '+34 600 111 222',
      whatsapp: '34600111222',
      zones: ['Asturias', 'Castilla y Leon', 'Portugal', 'Pais Vasco']
    },
    adominguez: {
      username: 'adominguez',
      name: 'Alfredo Domingo',
      role: 'Comercial Senior',
      email: 'adomingo@gruposopena.com',
      phone: '+34 609 634 869',
      whatsapp: '34609634869',
      zones: ['Comunidad Valenciana', 'Comunidad de Madrid', 'Castilla-La Mancha']
    },
    karim: {
      username: 'karim',
      name: 'Karim Kharkhor',
      role: 'Comercial Francia',
      email: 'karim@gruposopena.com',
      phone: '+33 1 40 00 00 00',
      whatsapp: '',
      zones: ['Francia']
    }
  }), []);

  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('sopena_user_session');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    // Usuario por defecto si ya estaba autenticado previamente
    if (localStorage.getItem('aluminio_auth') === 'true') {
      return SOPENA_USERS.ccastro;
    }
    return null;
  });

  const [userPasswords, setUserPasswords] = useState(() => {
    const saved = localStorage.getItem('sopena_user_passwords');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return {};
  });

  // Estados para el flujo de primer acceso y perfil
  const [isFirstAccessModalOpen, setIsFirstAccessModalOpen] = useState(false);
  const [firstAccessUser, setFirstAccessUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordPolicyError, setPasswordPolicyError] = useState('');
  const [showProfileDrawer, setShowProfileDrawer] = useState(false);

  // Zonas permitidas para el usuario autenticado activo
  const userAllowedZones = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.zones.includes('ALL')) return ['ALL'];
    return currentUser.zones;
  }, [currentUser]);

  const handleLogin = (e) => {
    e.preventDefault();
    const trimmedUser = username.trim().toLowerCase();
    const userDef = SOPENA_USERS[trimmedUser];

    if (!userDef) {
      setLoginError(true);
      return;
    }

    // Superadministrador: login con clave por defecto
    if (userDef.role === 'Superadministrador') {
      if (password === userDef.defaultPass) {
        setIsAuthenticated(true);
        setCurrentUser(userDef);
        localStorage.setItem('aluminio_auth', 'true');
        localStorage.setItem('sopena_user_session', JSON.stringify(userDef));
        setLoginError(false);
      } else {
        setLoginError(true);
      }
      return;
    }

    // Usuario comercial (adominguez / karim)
    const savedPass = userPasswords[trimmedUser];

    // Primer acceso: requiere crear contraseña corporativa propia
    if (!savedPass) {
      setFirstAccessUser(userDef);
      setIsFirstAccessModalOpen(true);
      setLoginError(false);
      return;
    }

    // Validación de contraseña guardada
    if (password === savedPass) {
      setIsAuthenticated(true);
      setCurrentUser(userDef);
      localStorage.setItem('aluminio_auth', 'true');
      localStorage.setItem('sopena_user_session', JSON.stringify(userDef));
      setLoginError(false);
    } else {
      setLoginError(true);
    }
  };

  const handleSetFirstPassword = (e) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      setPasswordPolicyError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (!/[A-Z]/.test(newPassword)) {
      setPasswordPolicyError('La contraseña debe incluir al menos una letra mayúscula.');
      return;
    }
    if (!/[a-z]/.test(newPassword)) {
      setPasswordPolicyError('La contraseña debe incluir al menos una letra minúscula.');
      return;
    }
    if (!/[0-9]/.test(newPassword)) {
      setPasswordPolicyError('La contraseña debe incluir al menos un número.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordPolicyError('Las contraseñas no coinciden.');
      return;
    }

    const updated = { ...userPasswords, [firstAccessUser.username]: newPassword };
    setUserPasswords(updated);
    localStorage.setItem('sopena_user_passwords', JSON.stringify(updated));

    setIsAuthenticated(true);
    setCurrentUser(firstAccessUser);
    localStorage.setItem('aluminio_auth', 'true');
    localStorage.setItem('sopena_user_session', JSON.stringify(firstAccessUser));

    setIsFirstAccessModalOpen(false);
    setNewPassword('');
    setConfirmPassword('');
    setPasswordPolicyError('');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    localStorage.removeItem('aluminio_auth');
    localStorage.removeItem('sopena_user_session');
    setUsername('');
    setPassword('');
  };
  // State for shortest distance calculation
  const [shortestDistance, setShortestDistance] = useState(null);
  const [shortestRoute, setShortestRoute] = useState([]);
  // Handler to calculate shortest distance for filtered prospects
  const handleCalculateShortest = async () => {
    const points = filteredProspects.map(p => p.location);
    if (points.length < 2) {
      alert('Se necesitan al menos dos prospectos para calcular la distancia.');
      return;
    }
    try {
      const result = await calculateShortestDistance(points);
      setShortestDistance(result.distance.toFixed(2));
      setShortestRoute(result.geometry);
    } catch (err) {
      console.error('Error calculating shortest route:', err);
      alert('No se pudo calcular la distancia. Intente más tarde.');
    }
  };
  useEffect(() => {
    try {
      // Guardar únicamente prospectos modificados/contactados para evitar QuotaExceededError de LocalStorage
      const modifiedOnly = prospects.filter(p => p.contacted || (p.notes && p.notes.length > 0) || (p.tasks && p.tasks.length > 0) || (p.history && p.history.length > 1));
      localStorage.setItem('aluminio_crm_modifications', JSON.stringify(modifiedOnly));
    } catch (e) {
      console.warn('Límite de cuota de LocalStorage alcanzado. Los datos se mantienen en memoria viva.', e);
    }
  }, [prospects]);
  useEffect(() => {
    if (selectedProspect) {
      setActiveModalTab('contacto');
    }
  }, [selectedProspect]);
  // Filters
  const [filterName, setFilterName] = useState('');
  const [filterZone, setFilterZone] = useState('');
  const [filterProduct, setFilterProduct] = useState('');
  const [filterSector, setFilterSector] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterRevenue, setFilterRevenue] = useState('');
  const [filterNewOnly, setFilterNewOnly] = useState(false);
  // Estado para controlar el ordenamiento en la Base de Datos (por defecto alfabético A-Z)
  const [sortOrder, setSortOrder] = useState('alphabetical');
  // Estado para controlar el ordenamiento en el Pipeline de Ventas (por defecto alfabético A-Z)
  const [pipelineSortOrder, setPipelineSortOrder] = useState('alphabetical');

  // Base de datos restringida a las zonas autorizadas del usuario activo
  const userProspects = useMemo(() => {
    if (!currentUser) return prospects;
    if (currentUser.zones.includes('ALL')) return prospects;
    return prospects.filter(p => currentUser.zones.includes(p.zone));
  }, [prospects, currentUser]);

  // Memoizamos la lista filtrada de prospectos para evitar recálculos innecesarios en cada renderizado.
  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const filteredProspects = useMemo(() => {
    const result = userProspects.filter(p => {
      const matchName = filterName.trim() === '' || 
        p.name.toLowerCase().includes(filterName.trim().toLowerCase()) ||
        (p.cif && p.cif.toLowerCase().includes(filterName.trim().toLowerCase()));
      const matchZone = filterZone === '' || p.zone === filterZone;
      const matchProduct = filterProduct === '' || p.products.includes(filterProduct);
      const matchSector = filterSector === '' || p.sector === filterSector;
      const matchStatus = filterStatus === '' || (filterStatus === 'contacted' ? p.contacted : !p.contacted);
      
      let matchRevenue = true;
      if (filterRevenue === 'gt10') matchRevenue = p.revenue > 10000000;
      else if (filterRevenue === '5to10') matchRevenue = p.revenue >= 5000000 && p.revenue <= 10000000;
      else if (filterRevenue === 'lt5') matchRevenue = p.revenue < 5000000;
      let matchNewOnly = true;
      if (filterNewOnly) {
        if (!p.createdAt) {
          matchNewOnly = false;
        } else {
          const createdTime = new Date(p.createdAt).getTime();
          const diffTime = Math.abs(new Date().getTime() - createdTime);
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          matchNewOnly = diffDays <= 21; // 3 semanas son 21 días
        }
      }
      return matchName && matchZone && matchProduct && matchSector && matchStatus && matchRevenue && matchNewOnly;
    });

    // Retornamos una copia ordenada según el criterio seleccionado en el filtro (por defecto alfabético A-Z)
    return [...result].sort((a, b) => {
      if (sortOrder === 'alphabetical') {
        return a.name.localeCompare(b.name, 'es', { sensitivity: 'base' });
      } else if (sortOrder === 'alphabetical-desc') {
        return b.name.localeCompare(a.name, 'es', { sensitivity: 'base' });
      } else if (sortOrder === 'revenue-desc') {
        return b.revenue - a.revenue;
      } else if (sortOrder === 'revenue-asc') {
        return a.revenue - b.revenue;
      }
      return 0;
    });
  }, [userProspects, filterName, filterZone, filterProduct, filterSector, filterStatus, filterRevenue, filterNewOnly, sortOrder]);

  // Estados y lógica de paginación ultra-optimizada
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  // Reiniciar a la página 1 cuando varíe cualquier filtro o búsqueda
  useEffect(() => {
    setCurrentPage(1);
  }, [filterName, filterZone, filterProduct, filterSector, filterStatus, filterRevenue, filterNewOnly, sortOrder]);

  const totalPages = useMemo(() => {
    return Math.ceil(filteredProspects.length / itemsPerPage) || 1;
  }, [filteredProspects, itemsPerPage]);

  const paginatedProspects = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredProspects.slice(start, start + itemsPerPage);
  }, [filteredProspects, currentPage, itemsPerPage]);

  // Memoizamos la lista específica para el Pipeline (Kanban), aplicando únicamente prospectos autorizados
  const pipelineProspects = useMemo(() => {
    const result = userProspects.filter(p => {
      const matchZone = filterZone === '' || p.zone === filterZone;
      const matchSector = filterSector === '' || p.sector === filterSector;
      return matchZone && matchSector;
    });
    return [...result].sort((a, b) => {
      if (pipelineSortOrder === 'alphabetical') {
        return a.name.localeCompare(b.name, 'es', { sensitivity: 'base' });
      } else if (pipelineSortOrder === 'alphabetical-desc') {
        return b.name.localeCompare(a.name, 'es', { sensitivity: 'base' });
      } else if (pipelineSortOrder === 'revenue-desc') {
        return b.revenue - a.revenue;
      } else if (pipelineSortOrder === 'revenue-asc') {
        return a.revenue - b.revenue;
      }
      return 0;
    });
  }, [userProspects, filterZone, filterSector, pipelineSortOrder]);
  // Ordenar prospectos para la calculadora de rutas por zona y luego por orden alfabético
  const routingSortedProspects = useMemo(() => {
    return [...userProspects].sort((a, b) => {
      const zoneCompare = a.zone.localeCompare(b.zone, 'es', { sensitivity: 'base' });
      if (zoneCompare !== 0) return zoneCompare;
      return a.name.localeCompare(b.name, 'es', { sensitivity: 'base' });
    });
  }, [userProspects]);
  const handleSaveCrm = (id, data) => {
    setProspects(prev => prev.map(p => p.id === id ? { ...p, ...data } : p));
    setSelectedProspect(null);
  };
  const handleAddTask = (prospectId, taskText) => {
    if (!taskText || !taskText.trim()) return;
    setProspects(prev => prev.map(p => {
      if (p.id === prospectId) {
        return {
          ...p,
          tasks: [...(p.tasks || []), { id: Date.now(), text: taskText, date: new Date().toISOString(), completed: false }]
        };
      }
      return p;
    }));
  };
  const handleToggleTask = (prospectId, taskId) => {
    setProspects(prev => prev.map(p => {
      if (p.id === prospectId) {
        return {
          ...p,
          tasks: (p.tasks || []).map(t => t.id === taskId ? { ...t, completed: !t.completed } : t)
        };
      }
      return p;
    }));
  };
  const handleAddHistory = (prospectId, type, text) => {
    if (!text || !text.trim()) return;
    setProspects(prev => prev.map(p => {
      if (p.id === prospectId) {
        return { ...p, history: [{ id: Date.now(), type, text, date: new Date().toISOString() }, ...(p.history || [])] };
      }
      return p;
    }));
  };
  const handleUpdatePipelineStage = (prospectId, newStage) => {
    setProspects(prev => prev.map(p => {
      if (p.id === prospectId) {
        const oldStage = p.pipelineStage || 'Lead';
        let updatedProspect = { ...p, pipelineStage: newStage };
        // Si se transiciona de la columna 'Lead' a 'Propuesta', generamos una tarea automática para dentro de 3 días
        if (oldStage === 'Lead' && newStage === 'Propuesta') {
          const targetDate = new Date();
          targetDate.setDate(targetDate.getDate() + 3);
          const formattedDate = targetDate.toLocaleDateString('es-ES');
          const autoFollowUpTask = {
            id: Date.now(),
            text: `📞 Llamada de seguimiento: contacto comercial (Agendada para el ${formattedDate})`,
            date: new Date().toISOString(), // Fecha de creación actual
            completed: false
          };
          updatedProspect.tasks = [...(p.tasks || []), autoFollowUpTask];
          // Registrar en el historial del prospecto para mantener la trazabilidad del proceso
          const historyEntry = {
            id: Date.now() + 1,
            type: '📝 Nota',
            text: `Tránsito automático: Movido de 'Lead' a 'Propuesta'. Generada tarea de llamada de seguimiento para el ${formattedDate}.`,
            date: new Date().toISOString()
          };
          updatedProspect.history = [historyEntry, ...(p.history || [])];
        }
        return updatedProspect;
      }
      return p;
    }));
  };
  const handleDeleteProspect = (prospectId) => {
    const prospect = prospects.find(p => p.id === prospectId);
    const name = prospect ? prospect.name : 'esta empresa';
    if (window.confirm(`⚠️ ¿Estás seguro de que deseas eliminar permanentemente a "${name}" de la base de datos?\nEsta acción no se puede deshacer.`)) {
      // Leer historial de borrados enriquecido
      let deletedRecords = [];
      try {
        const deletedSaved = localStorage.getItem('aluminio_crm_deleted');
        deletedRecords = deletedSaved ? JSON.parse(deletedSaved) : [];
        if (!Array.isArray(deletedRecords)) deletedRecords = [];
      } catch (e) {
        console.error('Error parsing deleted list during delete:', e);
      }
      // Comprobar si ya existe en la lista (por ID o formato legacy string)
      const alreadyDeleted = deletedRecords.some(r =>
        typeof r === 'object' ? r.id === prospectId : r === prospectId
      );
      if (!alreadyDeleted) {
        // Guardar registro enriquecido con nombre y fecha de borrado
        deletedRecords.push({
          id: prospectId,
          name: name,
          deletedAt: new Date().toISOString()
        });
        localStorage.setItem('aluminio_crm_deleted', JSON.stringify(deletedRecords));
      }
      setProspects(prev => prev.filter(p => p.id !== prospectId));
      if (selectedProspect && selectedProspect.id === prospectId) {
        setSelectedProspect(null);
      }
    }
  };
  const [showAddCompanyModal, setShowAddCompanyModal] = useState(false);
  const handleAddCompany = (formData) => {
    const companyName = formData.get('name');
    // Buscar si esta empresa (por nombre similar) fue borrada anteriormente
    let wasDeletedRecord = null;
    try {
      const deletedSaved = localStorage.getItem('aluminio_crm_deleted');
      const deletedRecords = deletedSaved ? JSON.parse(deletedSaved) : [];
      if (Array.isArray(deletedRecords)) {
        // Comparación insensible a mayúsculas y espacios extra
        const nameNorm = companyName.trim().toLowerCase();
        wasDeletedRecord = deletedRecords.find(r => {
          const rName = typeof r === 'object' ? (r.name || '').trim().toLowerCase() : '';
          return rName === nameNorm;
        }) || null;
      }
    } catch (e) {
      console.error('Error checking deleted history:', e);
    }
    const newCompany = {
      id: 'P' + (prospects.length + 1).toString().padStart(3, '0'),
      name: companyName,
      sector: formData.get('sector'),
      revenue: 1000000,
      purchasingManager: formData.get('purchasingManager'),
      purchasingPhone: formData.get('purchasingPhone') || '',
      purchasingLinkedin: formData.get('purchasingLinkedin') || '',
      // Solo se guarda si el email fue introducido manualmente (no generado)
      email: formData.get('email') || null,
      emailSource: formData.get('email') ? 'manual' : 'none',
      address: formData.get('address') || 'Desconocida',
      city: formData.get('city') || 'Desconocida',
      zone: formData.get('zone'),
      location: [40, -4],
      web: formData.get('web') || 'No disponible',
      linkedin: 'No disponible',
      contacted: false,
      notes: null,
      response: null,
      products: [],
      tasks: [],
      history: [],
      pipelineStage: 'Lead',
      quality: '',
      logistics: '',
      packaging: '',
      // Flag de reincorporación si fue borrada anteriormente
      wasDeleted: wasDeletedRecord ? true : false,
      previouslyDeletedAt: wasDeletedRecord ? (typeof wasDeletedRecord === 'object' ? wasDeletedRecord.deletedAt : null) : null
    };
    setProspects([newCompany, ...prospects]);
    setShowAddCompanyModal(false);
  };
  const getFormattedTimestamp = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `${year}${month}${day}_${hours}${minutes}${seconds}`;
  };

  const handleImportJSON = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedData = JSON.parse(event.target.result);
        if (!Array.isArray(importedData)) {
          alert("⚠️ Error: El archivo JSON debe contener un array de prospectos.");
          return;
        }

        const validLeads = importedData.filter(p => p.id && p.name);
        if (validLeads.length === 0) {
          alert("⚠️ Error: No se encontraron prospectos válidos en el archivo importado.");
          return;
        }

        if (!window.confirm(`¿Deseas importar ${validLeads.length} prospectos? Se sobrescribirán los datos repetidos (con el mismo ID).`)) {
          return;
        }

        setProspects(prev => {
          const currentMap = new Map(prev.map(p => [p.id, p]));
          let updatedCount = 0;
          let addedCount = 0;

          validLeads.forEach(lead => {
            let cleanLead = { ...lead };
            if (!cleanLead.location || !Array.isArray(cleanLead.location) || cleanLead.location.length !== 2) {
              cleanLead.location = [40, -4];
            }
            if (!cleanLead.products || !Array.isArray(cleanLead.products)) {
              cleanLead.products = [];
            }
            if (!cleanLead.tasks || !Array.isArray(cleanLead.tasks)) {
              cleanLead.tasks = [];
            }
            if (!cleanLead.history || !Array.isArray(cleanLead.history)) {
              cleanLead.history = [];
            }

            if (currentMap.has(cleanLead.id)) {
              currentMap.set(cleanLead.id, { ...currentMap.get(cleanLead.id), ...cleanLead });
              updatedCount++;
            } else {
              currentMap.set(cleanLead.id, cleanLead);
              addedCount++;
            }
          });

          const merged = Array.from(currentMap.values());
          alert(`🎉 Importación completada con éxito:\n- ${updatedCount} registros existentes actualizados (sobrescritos).\n- ${addedCount} registros nuevos añadidos.`);
          return merged;
        });

      } catch (err) {
        console.error("Error al procesar el archivo importado:", err);
        alert("⚠️ Error: El archivo importado no tiene un formato JSON válido.");
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleDownloadJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(prospects, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `clientes_aluminio_${getFormattedTimestamp()}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };
  // Función para exportar toda la base de datos de prospectos a un formato CSV compatible con Excel en español
  const handleExportCSV = () => {
    const passwordConfirm = window.prompt("Por seguridad, introduzca la contraseña de administración del CRM para exportar los datos:");
    if (passwordConfirm === null) return; // Canceló el prompt
    if (passwordConfirm !== 'aluminio') {
      alert("⚠️ Contraseña incorrecta. Operación de exportación cancelada.");
      return;
    }
    const escapeCSV = (val) => {
      if (val === null || val === undefined) return '';
      let str = String(val);
      // Si contiene punto y coma, comillas o saltos de línea, lo escapamos con comillas dobles
      if (str.includes(';') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
        str = str.replace(/"/g, '""');
        return `"${str}"`;
      }
      return str;
    };
    const headers = [
      'ID',
      'Nombre',
      'Sector',
      'Facturacion (€)',
      'Contacto de Compras',
      'Telefono',
      'Email',
      'LinkedIn de Contacto',
      'Sitio Web',
      'Direccion',
      'Ciudad',
      'Zona / Pais',
      'Estado CRM',
      'Tareas Pendientes',
      'Historial de Actividades',
      'Calidad',
      'Logistica',
      'Embalaje',
      'Notas / Observaciones'
    ];
    const rows = prospects.map(p => {
      // Concatenar tareas pendientes
      const pendingTasks = (p.tasks || [])
        .filter(t => !t.completed)
        .map(t => t.text)
        .join(' | ');
      // Concatenar historial
      const historyText = (p.history || [])
        .map(h => `[${new Date(h.date).toLocaleDateString('es-ES')}] ${h.type}: ${h.text}`)
        .join(' | ');
      return [
        p.id,
        p.name,
        p.sector,
        p.revenue,
        p.purchasingManager,
        p.purchasingPhone || '',
        p.email || '',
        p.purchasingLinkedin || '',
        p.web || '',
        p.address || '',
        p.city || '',
        p.zone || '',
        p.contacted ? 'Contactado' : 'Pendiente',
        pendingTasks,
        historyText,
        p.quality || '',
        p.logistics || '',
        p.packaging || '',
        p.notes || ''
      ];
    });
    const csvContent = [
      headers.join(';'),
      ...rows.map(row => row.map(escapeCSV).join(';'))
    ].join('\r\n');
    // Usar la marca de orden de bytes (BOM) UTF-8 (\uFEFF) para que Excel detecte la codificación correctamente
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `backup_crm_clientes_aluminio_${getFormattedTimestamp()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  // Genera un logotipo en HTML con estilos inline compatible con exportadores e emails
  const getClientLogoHtml = (name) => {
    if (!name) return '';
    const cleanName = name.replace(/\(.*\)/, '').replace(/S\.?L\.?/i, '').trim();
    const initials = cleanName
      ? cleanName.split(' ').filter(n => n.length > 0).map(n => n[0]).join('').substring(0, 2).toUpperCase()
      : 'CL';
    return `
      <div style="display: inline-flex; align-items: center; gap: 10px; margin-left: 20px; background-color: rgba(255, 255, 255, 0.15); padding: 6px 12px; border-radius: 6px; border: 1px solid rgba(255, 255, 255, 0.25);">
        <div style="width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, #1e293b 0%, #475569 100%); color: #ffffff; font-size: 0.85rem; font-weight: 700; display: flex; align-items: center; justify-content: center; border: 1px solid rgba(255, 255, 255, 0.3); box-shadow: 0 2px 4px rgba(0,0,0,0.1); flex-shrink: 0;">
          ${initials}
        </div>
        <span style="font-size: 0.8rem; font-weight: bold; color: #ffffff;">${cleanName}</span>
      </div>
    `;
  };

  // Función para exportar la propuesta comercial como un archivo HTML interactivo y autocontenido (standalone) para enviar por email.
  const handleExportInteractiveHTML = () => {
    // Si no hay empresa seleccionada en la presentación, usamos una versión genérica
    const target = presentationTarget;
    const isPt = target && target.zone === 'Portugal';
    const clientName = target ? target.name : 'Excelencia en Extrusión';
    
    // Títulos y fechas adaptados al idioma del prospecto
    const titleText = isPt ? `Soluções de Alumínio para ${clientName}` : `Soluciones de Aluminio para ${clientName}`;
    const dateStr = new Date().toLocaleDateString(isPt ? 'pt-PT' : 'es-ES');
    
    // Contenido dinámico adaptado según el sector comercial de la empresa
    let sectorHtml = '';
    if (target) {
      let sectorText = '';
      if (['Cerramientos', 'Puertas y Ventanas', 'Construccion Modular'].includes(target.sector)) {
        sectorText = isPt 
          ? `Centrados no setor de ${target.sector}, fabricamos e montamos perfis com rotura de ponte térmica e poliamidas "Low Lambda" para o máximo isolamento. Extrudimos tanto para os nossos sistemas próprios de arquitetura como para sistemas de terceiros. Além disso, os nossos lacados Qualicoat Seaside e acabamentos com efeito madeira (Qualideco) garantirão a máxima resistência e estética nas suas caixilharias.`
          : `Centrados en el sector de ${target.sector}, fabricamos y ensamblamos perfiles con rotura de puente térmico y poliamidas "Low Lambda" para el máximo aislamiento. Extruimos tanto para nuestros sistemas propios de arquitectura como para sistemas de terceros. Además, nuestros lacados Qualicoat Seaside y acabados con efecto madera (Qualideco) garantizarán la máxima resistencia y estética en todos sus cerramientos.`;
      } else if (['Fachadas de Aluminio', 'Escaleras', 'Fabricantes de Escaleras de Aluminio'].includes(target.sector)) {
        sectorText = isPt
          ? `Para ${target.sector}, extrudimos ligas estruturais (6005/6083) que oferecem as propriedades mecânicas avançadas requeridas para muros cortina e estruturas portantes, sempre con acabamentos Qualideco impecáveis.`
          : `Para ${target.sector}, extruimos aleaciones estructurales (6005/6083) que ofrecen las propiedades mecánicas avanzadas requeridas para muros cortina y estructuras portantes, siempre con acabados Qualideco impecables.`;
      } else if (['Estructuras Solares'].includes(target.sector)) {
        sectorText = isPt
          ? `Em Estructuras Solares, o alumínio leve e sem corrosão é vital. As nossas ligas anodizadas (Qualanod) garantirão a ${target.name} a máxima durabilidade em plantas fotovoltaicas e trackers.`
          : `En Estructuras Solares, el aluminio ligero y sin corrosión es vital. Nuestras aleaciones anodizadas (Qualanod) asegurarán a ${target.name} la máxima durabilidad en plantas fotovoltaicas y trackers.`;
      } else if (['Frio Industrial', 'Plataformas', 'Fabricantes de Estanterias de Aluminio'].includes(target.sector)) {
        sectorText = isPt
          ? `Para reduzir tempos de montagem em ${target.sector}, na Empresa de Aluminio integramos ranhuras e encaixes diretos na matriz de extrusão, agilizando radicalmente a fabricação dos seus produtos.`
          : `Para reducir tiempos de montaje en ${target.sector}, en Empresa de Aluminio integramos ranuras y encajes directos en la matriz de extrusión, agilizando radicalmente la fabricación de sus productos.`;
      } else if (['Fabricantes de Carrocerias'].includes(target.sector)) {
        sectorText = isPt
          ? `No setor dos transportes, asseguramos a ${target.name} perfis estruturais leves e robustos para maximizar a carga útil em carroçarias frigoríficas e plataformas.`
          : `En el sector del transporte, aseguramos a ${target.name} perfiles estructurales ligeros y robustos para maximizar la carga útil en carrocerías frigoríficas y plataformas.`;
      } else if (['Sistemas de Proteccion Solar'].includes(target.sector)) {
        sectorText = isPt
          ? `Oferecemos tolerâncias estritas para ${target.sector}, ideais para pérgolas e toldos, avalizados por acabamentos Seaside resistentes à corrosão salina.`
          : `Ofrecemos tolerancias estrictas para ${target.sector}, ideales para pérgolas y toldos, avalados por acabados Seaside resistentes a la corrosión salina.`;
      } else if (['Instalacion de Cubiertas'].includes(target.sector)) {
        sectorText = isPt
          ? `Para ${target.sector}, proporcionamos perfilaria industrial hermética com certificações europeias e fornecimento pontual graças à nossa proximidade logística.`
          : `Para ${target.sector}, proporcionamos perfilería industrial hermética con certificaciones europeas y suministro de confianza gracias a nuestra cercanía logística.`;
      } else if (['Transformacion de Chapa', 'Metal Arquitectonico y Chapa Perforada', 'PLV y Mobiliario Comercial', 'Armarios de Aluminio'].includes(target.sector)) {
        sectorText = isPt
          ? `Para ${target.sector}, aplicamos tratamentos superficiais Premium (Qualicoat, Qualideco) que mantêm as suas fachadas, expositores e exposições comerciais inalteráveis ao longo do tempo.`
          : `Para ${target.sector}, aplicamos tratamientos superficiales Premium (Qualicoat, Qualideco) que mantienen sus envolventes, expositores y displays comerciales inalterables a lo largo del tiempo.`;
      } else if (['Perfiles Estructurales Aluminio'].includes(target.sector)) {
        sectorText = isPt
          ? `Na indústria moderna, os ${target.sector} são o standard para a construção de maquinaria e líneas de montagem. Na Aluminios Innovations contamos com a capacidade técnica para extrudar perfis ranhurados con tolerâncias milimétricas.`
          : `En la industria moderna, los ${target.sector} son el estándar para la construcción de maquinaria y líneas de ensamblaje. En Aluminios Innovations contamos con la capacidad técnica para extruir perfiles ranurados con tolerancias milimétricas.`;
      } else if (['Proveedor de Aluminio'].includes(target.sector)) {
        sectorText = isPt
          ? `Sendo a ${target.name} uma referência no fornecimento e distribuição de alumínio, propomos colaborar como parceiro industrial de extrusão. Fornecemos perfis de alumínio e acessórios certificados (Qualicoat/Qualanod) para expandir o vosso catálogo e stock, assegurando tolerâncias de precisão e prazos de entrega ágeis.`
          : `Como ${target.name} es un referente en el suministro y distribución de aluminio, proponemos colaborar como partner industrial de extrusión. Suministramos perfiles de aluminio y accesorios certificados (Qualicoat/Qualanod) para expandir su catálogo y stock, garantizando tolerancias de precisión y plazos de entrega rápidos.`;
      } else {
        sectorText = isPt
          ? `Oferecemos perfilaria de alumínio sob medida com ligas otimizadas e acabamentos de tratamento de superfície certificados para apoiar os seus processos de fabrico.`
          : `Ofrecemos perfilería de aluminio a medida con aleaciones optimizadas y acabados superficiales certificados para dar soporte a sus procesos de producción.`;
      }
      
      sectorHtml = `
        <div class="card sector-card" style="margin-top: 40px; background: #f8fafc; padding: 30px; border-radius: 12px; border-left: 4px solid var(--sopena-blue); box-shadow: 0 4px 6px rgba(0,0,0,0.02);">
          <h3 style="color: var(--sopena-blue-dark); margin-top: 0; font-size: 1.4rem;">${isPt ? 'Abordagem Comercial para' : 'Enfoque Comercial para'} ${target.name}</h3>
          <p style="line-height: 1.7; color: #475569; margin: 0;">${sectorText}</p>
        </div>
      `;
    }
    // Enlaces de Catálogos dinámicos
    let catalogsHtml = '';
    if (includeArchitectureLink || includeIndustrialLink) {
      catalogsHtml = `
        <div class="card catalogs-card" style="margin-top: 40px; border-left: 4px solid #10b981; background: #ecfdf5; padding: 25px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.02);">
          <h4 style="margin-top: 0; color: #047857; font-size: 1.2rem; margin-bottom: 15px;">${isPt ? 'Documentação Técnica Interativa:' : 'Documentación Técnica Interactiva:'}</h4>
          <div style="display: flex; flex-direction: column; gap: 12px;">
            \${includeArchitectureLink ? \`
              <a href="https://www.empresa-aluminio.com/architectural.php?lang=es" target="_blank" rel="noopener noreferrer" style="display: flex; align-items: center; gap: 10px; text-decoration: none; color: #0f172a; background: white; padding: 12px 15px; border-radius: 6px; border: 1px solid #a7f3d0; box-shadow: 0 2px 4px rgba(0,0,0,0.05); font-weight: bold; transition: all 0.2s ease;">
                <span style="font-size: 1.5rem;">🏛️</span> \${isPt ? 'Catálogo de Sistemas de Arquitetura' : 'Catálogo de Sistemas de Arquitectura'} <span style="color: #10b981; margin-left: auto;">\${isPt ? 'Aceder catálogo →' : 'Acceder catálogo →'}</span>
              </a>
            \` : ''}
            \${includeIndustrialLink ? \`
              <a href="https://www.empresa-aluminio.com/series.php?lang=es&cat=1&id=54" target="_blank" rel="noopener noreferrer" style="display: flex; align-items: center; gap: 10px; text-decoration: none; color: #0f172a; background: white; padding: 12px 15px; border-radius: 6px; border: 1px solid #a7f3d0; box-shadow: 0 2px 4px rgba(0,0,0,0.05); font-weight: bold; transition: all 0.2s ease;">
                <span style="font-size: 1.5rem;">🏭</span> \${isPt ? 'Catálogo de Perfis Industriais' : 'Catálogo de Perfiles Industriales'} <span style="color: #10b981; margin-left: auto;">\${isPt ? 'Aceder catálogo →' : 'Acceder catálogo →'}</span>
              </a>
            \` : ''}
          </div>
        </div>
      `;
    }
    // HTML del documento completo
    const htmlContent = `
<!DOCTYPE html>
<html lang="\${isPt ? 'pt' : 'es'}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>\${titleText}</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    :root {
      --sopena-blue: #0a3d91;
      --sopena-blue-dark: #072b66;
      --sopena-blue-light: #3b82f6;
      --sopena-accent: #f59e0b;
      --text-main: #1e293b;
      --text-secondary: #475569;
      --bg-color: #f8fafc;
    }
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: 'Inter', sans-serif;
      color: var(--text-main);
      background-color: var(--bg-color);
      line-height: 1.6;
      padding: 20px;
    }
    .container {
      max-width: 900px;
      margin: 40px auto;
      background: white;
      border-radius: 16px;
      box-shadow: 0 20px 40px rgba(0,0,0,0.05);
      overflow: hidden;
      border: 1px solid #e2e8f0;
      animation: fadeIn 0.8s ease-out;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    header {
      background: linear-gradient(135deg, var(--sopena-blue-dark) 0%, var(--sopena-blue) 100%);
      padding: 40px 50px;
      color: white;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 20px;
    }
    .logo-container {
      background: white;
      padding: 10px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.1);
    }
    .logo-container img {
      height: 50px;
      object-fit: contain;
      display: block;
    }
    .header-info {
      text-align: right;
      font-size: 0.9rem;
      opacity: 0.9;
    }
    @media (max-width: 600px) {
      header {
        flex-direction: column;
        text-align: center;
        padding: 30px;
      }
      .header-info {
        text-align: center;
      }
    }
    .content {
      padding: 50px;
      position: relative;
    }
    @media (max-width: 600px) {
      .content {
        padding: 25px;
      }
    }
    .decorator-bar {
      position: absolute;
      top: 0;
      right: 50px;
      width: 4px;
      height: 100px;
      background: var(--sopena-accent);
      border-radius: 0 0 4px 4px;
    }
    .intro {
      margin-bottom: 40px;
    }
    h2 {
      color: var(--sopena-blue-dark);
      font-size: 2.2rem;
      margin-bottom: 15px;
      font-weight: 800;
      letter-spacing: -0.5px;
    }
    .meta-box {
      background: #f8fafc;
      padding: 20px;
      border-radius: 8px;
      border-left: 4px solid var(--sopena-accent);
      display: inline-block;
      min-width: 300px;
      margin-top: 10px;
    }
    .meta-box p {
      margin-bottom: 6px;
      color: var(--text-secondary);
      font-size: 0.95rem;
    }
    .grid {
      display: grid;
      grid-template-columns: 3fr 2fr;
      gap: 40px;
    }
    @media (max-width: 768px) {
      .grid {
        grid-template-columns: 1fr;
        gap: 30px;
      }
    }
    h3 {
      color: var(--sopena-accent);
      margin-top: 0;
      font-size: 1.4rem;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 10px;
      font-weight: 700;
    }
    p {
      color: #334155;
      margin-bottom: 15px;
      font-size: 1rem;
      line-height: 1.7;
    }
    ul {
      margin-bottom: 20px;
      padding-left: 20px;
    }
    li {
      margin-bottom: 10px;
      color: #334155;
    }
    .capabilities-box {
      background: var(--sopena-blue);
      color: white;
      padding: 30px;
      border-radius: 12px;
      box-shadow: 0 10px 25px rgba(10, 61, 145, 0.15);
    }
    .capabilities-box h3 {
      color: white;
      border-bottom: 2px solid rgba(255,255,255,0.2);
    }
    .capabilities-box li {
      color: white;
      opacity: 0.95;
      list-style-type: square;
    }
    .cert-grid {
      margin-top: 30px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }
    .cert-tag {
      background: #e2e8f0;
      padding: 10px;
      border-radius: 6px;
      font-size: 0.8rem;
      text-align: center;
      font-weight: bold;
      color: #334155;
      transition: all 0.3s ease;
      cursor: default;
    }
    .cert-tag:hover {
      background: var(--sopena-blue);
      color: white;
      transform: translateY(-2px);
    }
    .footer-section {
      margin-top: 50px;
      padding-top: 30px;
      border-top: 2px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      flex-wrap: wrap;
      gap: 20px;
    }
    .signature-info {
      color: #334155;
    }
    .signature-info a {
      color: var(--sopena-blue-light);
      text-decoration: none;
      font-weight: 600;
    }
    .social-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      border-radius: 6px;
      text-decoration: none;
      font-size: 0.85rem;
      font-weight: bold;
      color: white;
      transition: all 0.2s ease;
      box-shadow: 0 4px 6px rgba(0,0,0,0.05);
    }
    .social-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 12px rgba(0,0,0,0.1);
    }
    .whatsapp-btn { background-color: #25D366; }
    .instagram-btn { background: linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%); }
    .linkedin-btn { background-color: #0077b5; padding: 10px 20px; }
    a.catalogs-card:hover {
      transform: scale(1.01);
      box-shadow: 0 6px 12px rgba(0,0,0,0.05);
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div class="logo-container">
        <img src="https://empresa-aluminio.com/images/global/logo/grupo-sopena-sistemas.png" alt="Logotipo Grupo de Aluminio">
      </div>
      <div class="header-info">
        <strong>Aluminios Innovations, S.L.</strong><br>
        Pol. Ind. Los Vientos, C/ Garbí, 9<br>
        46119 Náquera, Valencia (\${isPt ? 'Espanha' : 'España'})<br>
        +34 96 145 20 50 | empresa-aluminio.com
      </div>
    </header>
    <div class="content">
      <div class="decorator-bar"></div>
      
      <div class="intro">
        <h2>\${titleText}</h2>
        <div class="meta-box">
          \${target ? \`
            <p><strong>\${isPt ? 'A/C:' : 'A/A:'}</strong> \${target.purchasingManager} 
            \${target.purchasingPhone ? \`| 📞 \${target.purchasingPhone}\` : ''}
            \${target.email ? \`| ✉️ \${target.email}\` : ''}</p>
          \` : ''}
          <p><strong>De:</strong> Carmen Castro</p>
          <p><strong>\${isPt ? 'Data:' : 'Fecha:'}</strong> \${dateStr}</p>
        </div>
      </div>
      <div class="grid">
        <div>
          <h3>\${isPt ? 'Quem Somos' : 'Quiénes Somos'}</h3>
          <p>\${isPt ? 'Somos uma empresa industrial especializada no design e fabricação de perfis de alumínio extrudado sob medida, localizados estrategicamente no ' : 'Somos una empresa industrial especializada en el diseño y fabricación de perfiles de aluminio extruido a medida, ubicados estratégicamente en el '}<strong>Polígono Industrial Los Vientos (Náquera, Valencia)</strong>. \${isPt ? 'Esta produção centralizada permite-nos oferecer uma proximidade logística imbatível para toda a Península Ibérica, garantindo prazos de entrega ágeis, nula dependência de importações e um suporte técnico direto.' : 'Esta produção centralizada nos permite oferecer uma corrência logística inmelhorável para toda a Península Ibérica, garantindo prazos de entrega ágeis, nula dependência de importações e um suporte técnico direto.'}</p>
          
          <h3 style="margin-top: 30px;">\${isPt ? 'Compromisso e Normativa' : 'Compromiso y Normativa'}</h3>
          <ul>
            <li><strong>\${isPt ? 'Alumínio Reciclado:' : 'Aluminio Reciclado:'}</strong> \${isPt ? 'Utilização de tarugos de alumínio reciclável de muito baixo impacto.' : 'Uso de tochos de aluminio reciclable de muy bajo impacto.'}</li>
            <li><strong>\${isPt ? 'Ligas Especializadas:' : 'Aleaciones Especializadas:'}</strong> \${isPt ? 'Capacidade para extrudar ligas exigentes (6060, 6005, 6083).' : 'Capacidad para extruir aleaciones exigentes (6060, 6005, 6083).'}</li>
            <li><strong>\${isPt ? 'Cumprimento Rigoroso:' : 'Cumplimiento Estricto:'}</strong> \${isPt ? 'Marcação CE e avalizados pelos selos internacionais mais exigentes.' : 'Marcado CE y avalados por los sellos internacionales más exigentes.'}</li>
          </ul>
        </div>
        <div>
          <div class="capabilities-box">
            <h3>\${isPt ? 'As Nossas Capacidades' : 'Nuestras Capacidades'}</h3>
            <ul style="margin: 0; padding-left: 15px;">
              <li style="margin-bottom: 12px;"><strong>\${isPt ? 'Extrusão de Precisão:' : 'Extrusión de Precisión:'}</strong><br>\${isPt ? 'Manuseamento avançado da série 6000.' : 'Manejo avanzado de la serie 6000.'}</li>
              <li style="margin-bottom: 12px;"><strong>\${isPt ? 'Tratamentos Superficiais:' : 'Tratamientos Superficiales:'}</strong><br>\${isPt ? 'Anodização e Lacagem de máxima durabilidade.' : 'Anodizado y Lacado de máxima durabilidad.'}</li>
              <li><strong>\${isPt ? 'Engenharia e Design:' : 'Ingeniería y Diseño:'}</strong><br>\${isPt ? 'Desenvolvimento de matrizes exclusivas.' : 'Desarrollo de matrices exclusivas.'}</li>
            </ul>
          </div>
          <div class="cert-grid">
            <div class="cert-tag">⚙️ ISO 9001</div>
            <div class="cert-tag">🌱 ISO 14001</div>
            <div class="cert-tag">🛡️ ISO 45001</div>
            <div class="cert-tag">🇪🇺 Marcado CE</div>
            <div class="cert-tag">🎖 QUALANOD</div>
            <div class="cert-tag">🎖 QUALICOAT</div>
          </div>
        </div>
      </div>
      \${sectorHtml}
      \${catalogsHtml}
      <div class="footer-section">
        <div class="signature-info">
          <p style="margin-bottom: 15px;">\${isPt ? 'Com os melhores cumprimentos,' : 'Atentamente,'}</p>
          <p style="font-weight: bold; font-size: 1.1rem; color: var(--sopena-blue-dark); margin: 0;">Carmen Castro</p>
          <p style="font-size: 0.9rem; margin: 0; font-weight: 500;">PROJECT MANAGER - GRUPO SOPENA</p>
          <p style="font-size: 0.85rem; margin: 5px 0 0 0; color: var(--text-secondary);">
            📞 +34 610 240 017 | ✉️ <a href="mailto:ccastro@empresa-aluminio.com">ccastro@empresa-aluminio.com</a>
          </p>
          <div style="margin-top: 15px; display: flex; gap: 8px;">
            <a href="https://wa.me/34610240017?text=Hola%20Carmen,%20recibi%20su%20propuesta" class="social-btn whatsapp-btn" target="_blank" rel="noopener noreferrer">
              WhatsApp
            </a>
            <a href="https://www.instagram.com/gruposopena/" class="social-btn instagram-btn" target="_blank" rel="noopener noreferrer">
              Instagram
            </a>
          </div>
        </div>
        \${target && target.purchasingLinkedin && target.purchasingLinkedin !== 'No disponible' ? \`
          <div>
            <a href="\${target.purchasingLinkedin}" class="social-btn linkedin-btn" target="_blank" rel="noopener noreferrer">
              Conectar en LinkedIn
            </a>
          </div>
        \` : ''}
      </div>
    </div>
  </div>
</body>
</html>
    `;
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const sanitizedName = clientName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    link.setAttribute('href', url);
    link.setAttribute('download', `propuesta_aluminio_\${sanitizedName}.html`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  // ===============================================================
  // EXPORTACIÓN A PDF INTERACTIVO CON LINKS ACTIVOS
  // Captura el elemento .a4-page con html2canvas, luego incrusta
  // la imagen en jsPDF añadiendo las anotaciones de link para cada
  // enlace encontrado en el DOM. Usa showSaveFilePicker (File System
  // Access API) si está disponible para preguntar la ruta de guardado,
  // con fallback a descarga directa del navegador.
  // ===============================================================
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  const handleExportPDF = async () => {
    // Obtener el elemento A4 renderizado en el DOM
    const a4El = document.querySelector('.a4-page');
    if (!a4El) {
      alert('No se encuentra la presentación. Asegúrate de estar en la pestaña Presentación.');
      return;
    }
    setIsExportingPDF(true);
    try {
      // Nombre del fichero basado en la empresa destinataria
      const targetName = presentationTarget ? presentationTarget.name : 'Presentacion_Aluminio';
      const safeName = targetName.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]/g, '_');
      const fileName = `Propuesta_Empresa de Aluminio_${safeName}.pdf`;

      // --- 1. Capturar el DOM como imagen de alta resolución ---
      const canvas = await html2canvas(a4El, {
        scale: 2,               // 2x para mayor calidad (equivale a ~192 DPI)
        useCORS: true,          // Permitir imágenes externas (logos)
        allowTaint: false,
        logging: false,
        backgroundColor: '#ffffff'
      });

      // --- 2. Dimensiones del PDF (A4 en mm) ---
      const PDF_W_MM = 210;
      const PDF_H_MM = 297;
      const imgW = canvas.width;
      const imgH = canvas.height;
      // Calcular cuántas páginas necesitamos
      const pxPerMm = imgW / PDF_W_MM;
      const pageHeightPx = PDF_H_MM * pxPerMm;
      const totalPages = Math.ceil(imgH / pageHeightPx);

      // --- 3. Crear documento PDF ---
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

      for (let page = 0; page < totalPages; page++) {
        if (page > 0) pdf.addPage();
        // Recortar fragmento de la imagen correspondiente a esta página
        const sliceCanvas = document.createElement('canvas');
        sliceCanvas.width = imgW;
        const sliceH = Math.min(pageHeightPx, imgH - page * pageHeightPx);
        sliceCanvas.height = sliceH;
        const sliceCtx = sliceCanvas.getContext('2d');
        sliceCtx.drawImage(canvas, 0, page * pageHeightPx, imgW, sliceH, 0, 0, imgW, sliceH);
        const sliceData = sliceCanvas.toDataURL('image/jpeg', 0.95);
        const sliceHMm = (sliceH / pxPerMm);
        pdf.addImage(sliceData, 'JPEG', 0, 0, PDF_W_MM, sliceHMm);

        // --- 4. Añadir anotaciones de enlace (PDF interactivo) ---
        // Buscar todos los <a> dentro del elemento a4-page
        const links = a4El.querySelectorAll('a[href]');
        const a4Rect = a4El.getBoundingClientRect();
        links.forEach(link => {
          const href = link.getAttribute('href');
          if (!href || href.startsWith('#') || href.startsWith('javascript')) return;
          const linkRect = link.getBoundingClientRect();
          // Posición relativa al elemento a4-page en píxeles del canvas (x2 scale)
          const relTop = (linkRect.top - a4Rect.top) * 2;
          const relLeft = (linkRect.left - a4Rect.left) * 2;
          const relW = linkRect.width * 2;
          const relH = linkRect.height * 2;
          // Convertir a mm para esta página
          const topInPage = relTop - page * pageHeightPx;
          if (topInPage < 0 || topInPage > pageHeightPx) return; // link fuera de esta página
          const xMm = relLeft / pxPerMm;
          const yMm = topInPage / pxPerMm;
          const wMm = relW / pxPerMm;
          const hMm = relH / pxPerMm;
          pdf.link(xMm, yMm, wMm, hMm, { url: href });
        });
      }

      // --- 5. Guardar el PDF: preguntar ruta si el navegador lo soporta ---
      const pdfBlob = pdf.output('blob');
      if (typeof window.showSaveFilePicker === 'function') {
        // File System Access API: abre diálogo nativo de guardado
        try {
          const fileHandle = await window.showSaveFilePicker({
            suggestedName: fileName,
            types: [{ description: 'Archivo PDF', accept: { 'application/pdf': ['.pdf'] } }]
          });
          const writable = await fileHandle.createWritable();
          await writable.write(pdfBlob);
          await writable.close();
          alert(`✅ PDF guardado correctamente como:\n"${fileName}"`);
        } catch (saveErr) {
          if (saveErr.name !== 'AbortError') {
            // Fallback si falla el guardado nativo
            pdf.save(fileName);
          }
        }
      } else {
        // Fallback: descarga directa con nombre de fichero personalizado
        pdf.save(fileName);
      }
    } catch (err) {
      console.error('Error al exportar PDF:', err);
      alert('❌ Error al generar el PDF. Comprueba la consola para más detalles.');
    } finally {
      setIsExportingPDF(false);
    }
  };

  // Copia la carta de presentación al portapapeles como HTML enriquecido para que se pueda pegar en Outlook/Gmail directamente.
  const handleCopyToMailClipboard = async () => {
    const target = presentationTarget;
    const isPt = target && target.zone === 'Portugal';
    const clientName = target ? target.name : 'Excelencia en Extrusión';
    
    // Títulos y fechas adaptados al idioma del prospecto
    const titleText = isPt ? `Soluções de Alumínio para ${clientName}` : `Soluciones de Aluminio para ${clientName}`;
    const dateStr = new Date().toLocaleDateString(isPt ? 'pt-PT' : 'es-ES');
    
    let sectorText = '';
    if (target) {
      if (['Cerramientos', 'Puertas y Ventanas', 'Construccion Modular'].includes(target.sector)) {
        sectorText = isPt 
          ? `Centrados no setor de ${target.sector}, fabricamos e montamos perfis com rotura de ponte térmica e poliamidas "Low Lambda" para o máximo isolamento. Extrudimos tanto para os nossos sistemas próprios de arquitetura como para sistemas de terceiros. Além disso, os nossos lacados Qualicoat Seaside e acabamentos com efeito madeira (Qualideco) garantirão a máxima resistência e estética nas suas caixilharias.`
          : `Centrados en el sector de ${target.sector}, fabricamos y ensamblamos perfiles con rotura de puente térmico y poliamidas "Low Lambda" para el máximo aislamiento. Extruimos tanto para nuestros sistemas propios de arquitectura como para sistemas de terceros. Además, nuestros lacados Qualicoat Seaside y acabados con efecto madera (Qualideco) garantizarán la máxima resistencia y estética en todos sus cerramientos.`;
      } else if (['Fachadas de Aluminio', 'Escaleras', 'Fabricantes de Escaleras de Aluminio'].includes(target.sector)) {
        sectorText = isPt
          ? `Para ${target.sector}, extrudimos ligas estruturais (6005/6083) que oferecem as propriedades mecânicas avançadas requeridas para muros cortina e estruturas portantes, sempre com acabamentos Qualideco impecáveis.`
          : `Para ${target.sector}, extruimos aleaciones estructurales (6005/6083) que ofrecen las propiedades mecánicas avanzadas requeridas para muros cortina y estructuras portantes, siempre con acabados Qualideco impecables.`;
      } else if (['Estructuras Solares'].includes(target.sector)) {
        sectorText = isPt
          ? `Em Estructuras Solares, o alumínio leve e sem corrosão é vital. As nossas ligas anodizadas (Qualanod) garantirão a ${target.name} a máxima durabilidade em plantas fotovoltaicas e trackers.`
          : `En Estructuras Solares, el aluminio ligero y sin corrosión es vital. Nuestras aleaciones anodizadas (Qualanod) asegurarán a ${target.name} la máxima durabilidad en plantas fotovoltaicas y trackers.`;
      } else if (['Frio Industrial', 'Plataformas', 'Fabricantes de Estanterias de Aluminio'].includes(target.sector)) {
        sectorText = isPt
          ? `Para reduzir tempos de montagem em ${target.sector}, na Empresa de Aluminio integramos ranhuras e encaixes diretos na matriz de extrusão, agilizando radicalmente a fabricação dos seus produtos.`
          : `Para reducir tiempos de montaje en ${target.sector}, en Empresa de Aluminio integramos ranuras y encajes directos en la matriz de extrusión, agilizando radicalmente la fabricación de sus productos.`;
      } else if (['Fabricantes de Carrocerias'].includes(target.sector)) {
        sectorText = isPt
          ? `No setor dos transportes, asseguramos a ${target.name} perfis estruturais leves e robustos para maximizar a carga útil em carroçarias frigoríficas e plataformas.`
          : `En el sector del transporte, aseguramos a ${target.name} perfiles estructurales ligeros y robustos para maximizar la carga útil en carrocerías frigoríficas y plataformas.`;
      } else if (['Sistemas de Proteccion Solar'].includes(target.sector)) {
        sectorText = isPt
          ? `Oferecemos tolerâncias estritas para ${target.sector}, ideais para pérgolas e toldos, avalizados por acabamentos Seaside resistentes à corrosão salina.`
          : `Ofrecemos tolerancias estrictas para ${target.sector}, ideales para pergolas y toldos, avalados por acabados Seaside resistentes a la corrosión salina.`;
      } else if (['Instalacion de Cubiertas'].includes(target.sector)) {
        sectorText = isPt
          ? `Para ${target.sector}, proporcionamos perfilaria industrial hermética com certificações europeias e fornecimento pontual graças à nossa proximidade logística.`
          : `Para ${target.sector}, proporcionamos perfilería industrial hermética con certificaciones europeas y suministro de confianza gracias a nuestra cercanía logística.`;
      } else if (['Transformacion de Chapa', 'Metal Arquitectonico y Chapa Perforada', 'PLV y Mobiliario Comercial', 'Armarios de Aluminio'].includes(target.sector)) {
        sectorText = isPt
          ? `Para ${target.sector}, aplicamos tratamentos superficiais Premium (Qualicoat, Qualideco) que mantêm as suas fachadas, expositores e exposições comerciais inalteráveis ao longo do tempo.`
          : `Para ${target.sector}, aplicamos tratamientos superficiales Premium (Qualicoat, Qualideco) que mantienen sus envolventes, expositores y displays comerciales inalterables a lo largo del tiempo.`;
      } else if (['Perfiles Estructurales Aluminio'].includes(target.sector)) {
        sectorText = isPt
          ? `Na indústria moderna, os ${target.sector} são o standard para a construção de maquinaria e linhas de montagem. Na Aluminios Innovations contamos com a capacidade técnica para extrudar perfis ranhurados con tolerâncias milimétricas.`
          : `En la industria moderna, los ${target.sector} son el estándar para la construcción de maquinaria y líneas de ensamblaje. En Aluminios Innovations contamos con la capacidad técnica para extruir perfiles ranurados con tolerancias milimétricas.`;
      } else {
        sectorText = isPt
          ? `Oferecemos perfilaria de alumínio sob medida com ligas otimizadas e acabamentos de tratamento de superfície certificados para apoiar os seus processos de fabrico.`
          : `Ofrecemos perfilería de aluminio a medida con aleaciones optimizadas y acabados superficiales certificados para dar soporte a sus procesos de producción.`;
      }
    }
    // Cuerpo HTML de la carta de presentación optimizado para el portapapeles de los editores de correo (Outlook/Gmail)
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; color: #1e293b; background-color: #f8fafc; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); overflow: hidden; border: 1px solid #e2e8f0;">
          <!-- Encabezado de email -->
          <div style="background: linear-gradient(135deg, #072b66 0%, #0a3d91 100%); padding: 30px; color: #ffffff; text-align: left; display: flex; justify-content: space-between; align-items: center;">
            <div style="background: #ffffff; padding: 8px 15px; border-radius: 6px; display: inline-block;">
              <img src="https://empresa-aluminio.com/images/global/logo/grupo-sopena-sistemas.png" alt="Grupo de Aluminio Logo" style="height: 35px; width: auto; display: block;" />
            </div>
            <div style="font-size: 0.8rem; line-height: 1.4; opacity: 0.9; text-align: right; margin-left: 20px; color: #ffffff;">
              <strong>Aluminios Innovations, S.L.</strong><br/>
              Náquera, Valencia<br/>
              empresa-aluminio.com
            </div>
          </div>
          
          <!-- Contenido del email -->
          <div style="padding: 40px 30px;">
            <h2 style="color: #072b66; font-size: 1.6rem; margin-top: 0; margin-bottom: 20px; font-weight: bold; font-family: Arial, sans-serif;">
              ${titleText}
            </h2>
            
            <div style="background: #f1f5f9; padding: 15px; border-radius: 6px; border-left: 4px solid #f59e0b; margin-bottom: 35px; font-size: 0.9rem; color: #475569;">
              ${target ? `<strong>${isPt ? 'A/C:' : 'A/A:'}</strong> ${target.purchasingManager}<br/>` : ''}
              <strong>${isPt ? 'Data:' : 'Fecha:'}</strong> ${dateStr}
            </div>
            <h3 style="color: #f59e0b; font-size: 1.1rem; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-top: 0; margin-bottom: 12px; font-weight: bold; text-transform: uppercase;">
              ${isPt ? 'Quem Somos' : 'Quiénes Somos'}
            </h3>
            <p style="font-size: 0.95rem; line-height: 1.6; color: #334155; margin-bottom: 20px;">
              ${isPt ? 'Somos uma empresa industrial especializada no design e fabricação de perfis de alumínio extrudado sob medida, localizados estrategicamente no ' : 'Somos una empresa industrial especializada en el diseño y fabricación de perfiles de aluminio extruido a medida, ubicados estrategicamente en el '}<strong>Polígono Industrial Los Vientos (Náquera, Valencia)</strong>. ${isPt ? 'Esta produção centralizada permite-nos oferecer uma proximidade logística imbatível para toda a Península Ibérica, garantindo prazos de entrega ágeis, nula dependência de importações e um suporte técnico direto.' : 'Esta producción centralizada nos permite ofrecer una cercanía logística inmejorable para toda la Península Ibérica, garantizando plazos de entrega ágiles, nula dependencia de importaciones y un soporte técnico directo.'}
            </p>
            ${target ? `
              <div style="background: #f8fafc; padding: 20px; border-radius: 8px; border-left: 4px solid #0a3d91; margin-bottom: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.01);">
                <h4 style="color: #072b66; font-size: 1rem; margin-top: 0; margin-bottom: 8px; font-weight: bold;">
                  ${isPt ? 'Abordagem Comercial Especializada' : 'Enfoque Comercial Especializado'}
                </h4>
                <p style="font-size: 0.9rem; line-height: 1.6; color: #475569; margin: 0;">
                  ${sectorText}
                </p>
              </div>
            ` : ''}
            <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; font-size: 0.95rem; line-height: 1.6; color: #334155;">
              <p style="margin-bottom: 12px;">${isPt ? 'Com os melhores cumprimentos,' : 'Atentamente,'}</p>
              <strong style="color: #072b66; font-size: 1.05rem;">Carmen Castro</strong><br/>
              <span style="font-size: 0.85rem; color: #475569; font-weight: 500;">PROJECT MANAGER - GRUPO SOPENA</span>
            </div>
          </div>
        </div>
      </div>
    `;
    const blobHtml = new Blob([emailHtml], { type: 'text/html' });
    const plainText = `${titleText}\n\nDe: Carmen Castro\n${isPt ? 'Data:' : 'Fecha:'} ${dateStr}\n\n${isPt ? 'Quem Somos' : 'Quiénes Somos'}\n...`;
    const blobText = new Blob([plainText], { type: 'text/plain' });
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': blobHtml,
          'text/plain': blobText
        })
      ]);
      alert('📋 ¡Propuesta copiada al portapapeles!');
    } catch (err) {
      console.error('Error al copiar al portapapeles:', err);
      alert('No se pudo copiar de forma automática. Por favor selecciona el texto manualmente.');
    }
  };
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportDates, setReportDates] = useState({ start: '', end: '' });
  const [reportComments, setReportComments] = useState('');
  const [reportOthers, setReportOthers] = useState('');
  const getReportData = () => {
    if (!reportDates.start || !reportDates.end) return [];
    return prospects.filter(p => {
      if (!p.contacted || !p.contactDate) return false;
      const d = new Date(p.contactDate);
      return d >= new Date(reportDates.start) && d <= new Date(reportDates.end);
    });
  };
  // Presentation State
  const [presentationTargetId, setPresentationTargetId] = useState('');
  const presentationTarget = useMemo(() => prospects.find(p => p.id === presentationTargetId) || null, [presentationTargetId, prospects]);
  const [includeArchitectureLink, setIncludeArchitectureLink] = useState(false);
  const [includeIndustrialLink, setIncludeIndustrialLink] = useState(false);
  
  // ==========================================
  // CONFIGURACIÓN DUAL Y LOGOS PARA CARPINTERÍAS
  // ==========================================
  const [presentationType, setPresentationType] = useState('corta'); // 'corta' | 'detallada'

  // Indica si un prospecto califica para la presentación detallada (dossier)
  const canShowDetailedPresentation = (target) => {
    if (!target) return false;
    const sector = (target.sector || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return (
      sector === 'puertas y ventanas' ||
      sector === 'cerramientos' ||
      sector === 'sistemas de proteccion solar' ||
      sector === 'proveedor de aluminio' ||
      sector === 'fachadas de aluminio'
    );
  };

  // Asegura que el tipo de presentación vuelva a 'corta' si el sector no permite la propuesta detallada
  useEffect(() => {
    if (presentationTarget && !canShowDetailedPresentation(presentationTarget)) {
      setPresentationType('corta');
    }
  }, [presentationTarget]);

  // Identifica si un cliente está relacionado con el sector de la carpintería o el aluminio
  const isCarpinteriaRelated = (target) => {
    if (!target) return false;
    const sectorLower = (target.sector || '').toLowerCase();
    const nameLower = (target.name || '').toLowerCase();
    return (
      sectorLower.includes('puertas') ||
      sectorLower.includes('ventanas') ||
      sectorLower.includes('cerramientos') ||
      sectorLower.includes('aluminio') ||
      sectorLower.includes('mosquiteras') ||
      sectorLower.includes('cubiertas') ||
      sectorLower.includes('proteccion solar') ||
      sectorLower.includes('proveedor de aluminio') ||
      nameLower.includes('carpinteria') ||
      nameLower.includes('metalica') ||
      nameLower.includes('aluminio') ||
      nameLower.includes('ventanas') ||
      nameLower.includes('mapeal')
    );
  };

  // Genera un logotipo minimalista SVG dinámico a partir del nombre del cliente
  const renderClientLogo = (name) => {
    if (!name) return null;
    const cleanName = name.replace(/\(.*\)/, '').replace(/S\.?L\.?/i, '').trim();
    const initials = cleanName
      ? cleanName.split(' ').filter(n => n.length > 0).map(n => n[0]).join('').substring(0, 2).toUpperCase()
      : 'CL';
    return (
      <div className="client-logo-box">
        <div className="client-logo-circle">
          {initials}
        </div>
        <span className="client-logo-text">{cleanName}</span>
      </div>
    );
  };
  // Routing State
  const [routeClients, setRouteClients] = useState([]);
  const handleToggleRouteClient = (client) => {
    if (routeClients.find(c => c.id === client.id)) {
      setRouteClients(routeClients.filter(c => c.id !== client.id));
    } else {
      setRouteClients([...routeClients, client]);
    }
  };
  const totalDistance = useMemo(() => {
    let dist = 0;
    for (let i = 0; i < routeClients.length - 1; i++) {
      dist += calculateDistance(
        routeClients[i].location[0], routeClients[i].location[1],
        routeClients[i+1].location[0], routeClients[i+1].location[1]
      );
    }
    return dist;
  }, [routeClients]);
  if (isPassingCloudflare) {
    return (
      <div className="cf-ddos-container">
        <div className="cf-ddos-wrapper">
          <div className="cf-logo-area">
            {/* Logotipo SVG oficial de Cloudflare con degradado premium */}
            <svg viewBox="0 0 120 120" width="70" height="70" style={{ filter: 'drop-shadow(0 4px 6px rgba(243, 128, 32, 0.15))' }}>
              <defs>
                <linearGradient id="cfGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f38020" />
                  <stop offset="50%" stopColor="#faae40" />
                  <stop offset="100%" stopColor="#f38020" />
                </linearGradient>
              </defs>
              <path fill="url(#cfGrad)" d="M102.6,56.5c-0.2-1.9-0.8-3.7-1.7-5.3c-2.3-3.8-6.5-6.3-11.2-6.3c-0.8,0-1.6,0.1-2.4,0.2c-2.9-6.3-9.3-10.7-16.7-10.7c-7.3,0-13.6,4.3-16.5,10.5c-1.3-0.7-2.9-1.1-4.5-1.1c-4.9,0-9,3.5-9.9,8.2c-0.6-0.1-1.3-0.2-1.9-0.2c-5.5,0-10,4.5-10,10c0,5.5,4.5,10,10,10c0.3,0,0.6,0,1,0c1.7,4.8,6.3,8.2,11.7,8.2c1.7,0,3.3-0.3,4.8-1c3,5.8,9.1,9.8,16.2,9.8c7.2,0,13.3-4,16.2-9.9c1.3,0.6,2.8,1,4.4,1c5.2,0,9.5-3.9,10.1-9c0.7,0.1,1.4,0.2,2.1,0.2c5.5,0,10-4.5,10-10C104.3,60.8,103.6,58.5,102.6,56.5z" />
            </svg>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#f38020', background: 'rgba(243,128,32,0.08)', padding: '4px 12px', borderRadius: '20px', border: '1px solid rgba(243,128,32,0.15)' }}>
                DDoS Protection Active
              </span>
            </div>
          </div>
          
          <h1 className="cf-title">
            {cloudflareState === 'analyzing' && 'Analizando tu navegador...'}
            {cloudflareState === 'waiting_interaction' && 'Verifica que eres humano'}
            {cloudflareState === 'verifying' && 'Comprobando seguridad...'}
            {cloudflareState === 'success' && '¡Verificación Completada!'}
          </h1>
          
          <p className="cf-subtitle">
            {cloudflareState === 'analyzing' && 'carmen-sopena-crm.com está analizando la seguridad de tu conexión antes de permitir el acceso.'}
            {cloudflareState === 'waiting_interaction' && 'Por favor, completa el desafío de seguridad interactivo para acceder al portal comercial.'}
            {cloudflareState === 'verifying' && 'Un momento, estamos confirmando que la conexión con el servidor de la base de datos es segura.'}
            {cloudflareState === 'success' && 'Conexión segura establecida. Redirigiendo al portal comercial de forma segura...'}
          </p>

          {/* Widget de Turnstile */}
          <div className={`cf-turnstile-widget ${cloudflareState === 'success' ? 'success-border' : ''}`}>
            <div className="cf-turnstile-left">
              <div className="cf-checkbox-container">
                {cloudflareState === 'waiting_interaction' && (
                  <button 
                    type="button" 
                    onClick={handleTurnstileClick} 
                    className="cf-checkbox-input"
                    title="Haga clic aquí para verificar que es un humano"
                  />
                )}
                {cloudflareState === 'analyzing' && (
                  <div className="cf-turnstile-spinner" style={{ borderWidth: '2px', width: '18px', height: '18px' }} />
                )}
                {cloudflareState === 'verifying' && (
                  <div className="cf-turnstile-spinner" />
                )}
                {cloudflareState === 'success' && (
                  <div className="cf-checkmark-icon">
                    <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                )}
              </div>
              <span className="cf-turnstile-text" style={{ cursor: cloudflareState === 'waiting_interaction' ? 'pointer' : 'default' }} onClick={cloudflareState === 'waiting_interaction' ? handleTurnstileClick : undefined}>
                {cloudflareState === 'analyzing' && 'Comprobación de seguridad inicial...'}
                {cloudflareState === 'waiting_interaction' && 'Soy humano'}
                {cloudflareState === 'verifying' && 'Verificando navegador...'}
                {cloudflareState === 'success' && 'Verificación exitosa'}
              </span>
            </div>
            
            <div className="cf-turnstile-right">
              <div className="cf-brand-logo">
                <svg viewBox="0 0 120 120" width="16" height="16" style={{ opacity: 0.7 }}>
                  <path fill="#404040" d="M102.6,56.5c-0.2-1.9-0.8-3.7-1.7-5.3c-2.3-3.8-6.5-6.3-11.2-6.3c-0.8,0-1.6,0.1-2.4,0.2c-2.9-6.3-9.3-10.7-16.7-10.7c-7.3,0-13.6,4.3-16.5,10.5c-1.3-0.7-2.9-1.1-4.5-1.1c-4.9,0-9,3.5-9.9,8.2c-0.6-0.1-1.3-0.2-1.9-0.2c-5.5,0-10,4.5-10,10c0,5.5,4.5,10,10,10c0.3,0,0.6,0,1,0c1.7,4.8,6.3,8.2,11.7,8.2c1.7,0,3.3-0.3,4.8-1c3,5.8,9.1,9.8,16.2,9.8c7.2,0,13.3-4,16.2-9.9c1.3,0.6,2.8,1,4.4,1c5.2,0,9.5-3.9,10.1-9c0.7,0.1,1.4,0.2,2.1,0.2c5.5,0,10-4.5,10-10C104.3,60.8,103.6,58.5,102.6,56.5z" />
                </svg>
                <span className="cf-brand-text">cloudflare</span>
              </div>
              <a href="https://www.cloudflare.com/privacypolicy/" target="_blank" rel="noopener noreferrer" className="cf-brand-subtext">Turnstile | Privacidad</a>
            </div>
          </div>

          {/* Caja de Información Técnica */}
          <div className="cf-info-box">
            <div className="cf-info-row">
              <span className="cf-info-label">Ray ID (ID del Rayo)</span>
              <span className="cf-info-value">{rayId || 'Generando Ray ID...'}</span>
            </div>
            <div className="cf-info-row">
              <span className="cf-info-label">Tu Dirección IP</span>
              <span className="cf-info-value">{userIp || 'Detectando IP...'}</span>
            </div>
            <div className="cf-info-row">
              <span className="cf-info-label">Rendimiento y Seguridad</span>
              <span className="cf-info-value" style={{ 
                color: cloudflareState === 'success' ? '#10b981' : cloudflareState === 'verifying' ? '#f59e0b' : '#2563eb',
                fontWeight: 'bold'
              }}>
                {cloudflareState === 'analyzing' && 'Analizando'}
                {cloudflareState === 'waiting_interaction' && 'Esperando Confirmación'}
                {cloudflareState === 'verifying' && 'Verificando...'}
                {cloudflareState === 'success' && 'Seguro (Protegido)'}
              </span>
            </div>
          </div>

          <div className="cf-alert-row">
            <div className="cf-alert-icon">
              <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
            </div>
            <div style={{ color: '#52525b', fontSize: '0.82rem' }}>
              <strong>Seguridad DDoS Activa:</strong> Cloudflare mitiga ataques automatizados de bots en tiempo real, garantizando la confidencialidad y alta disponibilidad de Aluminios Innovations CRM.
            </div>
          </div>

          <div className="cf-footer">
            Seguridad avanzada y rendimiento optimizados por <a href="https://www.cloudflare.com" target="_blank" rel="noopener noreferrer" style={{ color: '#f38020', textDecoration: 'none', fontWeight: 600 }}>Cloudflare</a>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'var(--bg-color)', fontFamily: 'Inter, sans-serif', padding: '20px'}}>
        <div style={{background: 'white', padding: '2.5rem', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.12)', width: '100%', maxWidth: '440px', textAlign: 'center'}}>
          <div style={{background: 'linear-gradient(135deg, #072b66 0%, #1e1b4b 100%)', color: 'white', width: '64px', height: '64px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 'bold', margin: '0 auto 1.2rem auto', boxShadow: '0 4px 12px rgba(7, 43, 102, 0.3)'}}>GS</div>
          <h2 style={{color: 'var(--sopena-blue-dark)', margin: '0 0 0.2rem 0', fontSize: '1.5rem', fontWeight: 800}}>Grupo Sopeña</h2>
          <p style={{color: 'var(--text-secondary)', margin: '0 0 1.5rem 0', fontSize: '0.9rem'}}>CRM Corporativo con Segmentación Geográfica</p>

          {/* Sugerencias rápidas de usuarios autorizados */}
          <div style={{ marginBottom: '1.5rem', background: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', textAlign: 'left' }}>
            <p style={{ margin: '0 0 8px 0', fontSize: '0.75rem', fontWeight: 'bold', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Usuarios del Sistema:</p>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              <button 
                type="button" 
                onClick={() => { setUsername('ccastro'); setPassword(''); }} 
                style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', background: username === 'ccastro' ? '#e0e7ff' : 'white', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600, color: '#3730a3' }}
              >
                👤 ccastro (Ast, CyL, Por, PV)
              </button>
              <button 
                type="button" 
                onClick={() => { setUsername('adominguez'); setPassword(''); }} 
                style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', background: username === 'adominguez' ? '#e0f2fe' : 'white', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600, color: '#0369a1' }}
              >
                👤 adominguez (CV, Mad, CLM)
              </button>
              <button 
                type="button" 
                onClick={() => { setUsername('karim'); setPassword(''); }} 
                style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', background: username === 'karim' ? '#fef3c7' : 'white', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600, color: '#b45309' }}
              >
                👤 karim (Francia)
              </button>
              <button 
                type="button" 
                onClick={() => { setUsername('admin'); setPassword('lacado2025'); }} 
                style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', background: username === 'admin' ? '#f3e8ff' : 'white', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600, color: '#7e22ce' }}
              >
                👑 admin (Superadmin)
              </button>
            </div>
          </div>

          <form onSubmit={handleLogin} style={{display: 'flex', flexDirection: 'column', gap: '14px'}}>
            <div style={{ textAlign: 'left' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '4px', display: 'block' }}>Usuario</label>
              <input 
                type="text" 
                placeholder="Ej. adominguez, karim, ccastro" 
                value={username} 
                onChange={e => setUsername(e.target.value)} 
                style={{width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.95rem', boxSizing: 'border-box'}}
                required
              />
            </div>
            <div style={{ textAlign: 'left' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '4px', display: 'block' }}>Contraseña</label>
              <input 
                type="password" 
                placeholder={userPasswords[username.trim().toLowerCase()] ? "••••••••" : "Introduce contraseña o accede para configurar"} 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                style={{width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.95rem', boxSizing: 'border-box'}}
              />
            </div>

            {loginError && <p style={{color: '#ef4444', margin: 0, fontSize: '0.85rem', fontWeight: '600'}}>Credenciales incorrectas o usuario no encontrado.</p>}
            
            <button type="submit" className="action-btn" style={{padding: '12px', fontSize: '1rem', marginTop: '6px', fontWeight: 'bold', borderRadius: '8px'}}>
              Acceder al CRM
            </button>
          </form>

          {/* Modal de Primer Acceso / Configuración de Contraseña */}
          {isFirstAccessModalOpen && firstAccessUser && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }}>
              <div style={{ background: 'white', padding: '2rem', borderRadius: '16px', maxWidth: '440px', width: '100%', textWrap: 'wrap', textAlign: 'left', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1rem' }}>
                  <div style={{ background: '#e0f2fe', color: '#0284c7', padding: '10px', borderRadius: '12px' }}>
                    <ShieldAlert size={24} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a' }}>Primer Acceso Comercial</h3>
                    <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b' }}>Usuario: <strong>{firstAccessUser.name}</strong> ({firstAccessUser.username})</p>
                  </div>
                </div>

                <p style={{ fontSize: '0.85rem', color: '#334155', lineHeight: '1.4', marginBottom: '1.2rem', background: '#f8fafc', padding: '10px', borderRadius: '8px', borderLeft: '4px solid #0284c7' }}>
                  Por política de seguridad corporativa, los administradores no conocen tu clave. Debes establecer tu propia contraseña personal para activar tu cuenta.
                </p>

                <form onSubmit={handleSetFirstPassword} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Nueva Contraseña Corporativa</label>
                    <input 
                      type="password" 
                      placeholder="Mín. 8 caracteres, mayúscula, minúscula y número"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', boxSizing: 'border-box', marginTop: '4px' }}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Confirmar Contraseña</label>
                    <input 
                      type="password" 
                      placeholder="Repite la contraseña"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', boxSizing: 'border-box', marginTop: '4px' }}
                      required
                    />
                  </div>

                  {passwordPolicyError && (
                    <p style={{ color: '#dc2626', fontSize: '0.8rem', margin: 0, fontWeight: 600 }}>⚠️ {passwordPolicyError}</p>
                  )}

                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                    <button 
                      type="button" 
                      onClick={() => setIsFirstAccessModalOpen(false)} 
                      style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f1f5f9', color: '#475569', fontWeight: 600, cursor: 'pointer' }}
                    >
                      Cancelar
                    </button>
                    <button 
                      type="submit" 
                      style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg, #072b66 0%, #1e1b4b 100%)', color: 'white', fontWeight: 600, cursor: 'pointer' }}
                    >
                      Activar y Acceder
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
          
          {/* Botón para simular la protección DDoS de Cloudflare */}
          <button 
            type="button" 
            onClick={triggerDdosSimulation} 
            className="cf-sim-trigger"
            style={{ marginTop: '1.2rem' }}
          >
            🔒 Simular Protección DDoS de Cloudflare
          </button>
        </div>
      </div>
    );
  }
  const isPt = presentationTarget && presentationTarget.zone === 'Portugal';
  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">
            <Building2 size={24} />
          </div>
          CRM de la Empresa de Aluminio
        </div>
        <ul className="nav-links">
          <li className={`nav-link ${activeTab === 'prospects' ? 'active' : ''}`} onClick={() => setActiveTab('prospects')}>
            <Briefcase size={20} /> Base de Datos
          </li>
          <li className={`nav-link ${activeTab === 'map' ? 'active' : ''}`} onClick={() => setActiveTab('map')}>
            <MapPin size={20} /> Mapa Interactivo
          </li>
          <li className={`nav-link ${activeTab === 'routing' ? 'active' : ''}`} onClick={() => setActiveTab('routing')}>
            <Navigation size={20} /> Calculadora de Rutas
          </li>
          <li className={`nav-link ${activeTab === 'presentation' ? 'active' : ''}`} onClick={() => setActiveTab('presentation')}>
            <FileText size={20} /> Presentación
          </li>
          <li className={`nav-link ${activeTab === 'tasks' ? 'active' : ''}`} onClick={() => setActiveTab('tasks')}>
            <CheckCircle size={20} /> Tareas Pendientes
          </li>
          <li className={`nav-link ${activeTab === 'pipeline' ? 'active' : ''}`} onClick={() => setActiveTab('pipeline')}>
            <Briefcase size={20} /> Pipeline de Ventas
          </li>
          <li className={`nav-link ${activeTab === 'agentforce' ? 'active' : ''}`} onClick={() => setActiveTab('agentforce')} style={{ background: activeTab === 'agentforce' ? 'linear-gradient(135deg, rgba(124, 58, 237, 0.15) 0%, rgba(79, 70, 229, 0.15) 100%)' : 'transparent', color: activeTab === 'agentforce' ? '#a78bfa' : '' }}>
            <Sparkles size={20} style={{ color: '#a78bfa' }} /> Asistente IA (Agentforce)
          </li>
          <li className={`nav-link ${activeTab === 'instructions' ? 'active' : ''}`} onClick={() => setActiveTab('instructions')} style={{ background: activeTab === 'instructions' ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.15) 100%)' : 'transparent', color: activeTab === 'instructions' ? '#34d399' : '' }}>
            <Info size={20} style={{ color: '#34d399' }} /> Guía de Usuario
          </li>
          <li className="nav-link" onClick={handleLogout} style={{marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.1)', borderRadius: '0', paddingTop: '20px'}}>🚪 Cerrar Sesión</li>
        </ul>
      </aside>
      <main className="main-content">
        <header className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
          <div>
            <h1>{activeTab === 'prospects' && 'Base de Datos de Prospectos'}
                {activeTab === 'map' && 'Mapa de Clientes Potenciales'}
                {activeTab === 'routing' && 'Planificador de Rutas Comerciales'}
                {activeTab === 'presentation' && 'Presentación Corporativa'}
                {activeTab === 'tasks' && 'Gestión de Tareas Pendientes'}
                {activeTab === 'pipeline' && 'Pipeline de Ventas (Kanban)'}
                {activeTab === 'agentforce' && 'Asistente de Inteligencia Artificial (Agentforce)'}
                {activeTab === 'instructions' && 'Guía de Usuario e Instrucciones del CRM'}
            </h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            {currentUser && (
              <div 
                onClick={() => setShowProfileDrawer(!showProfileDrawer)}
                style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'white', padding: '6px 14px', borderRadius: '30px', border: '1px solid #cbd5e1', cursor: 'pointer', boxShadow: '0 2px 6px rgba(0,0,0,0.05)', transition: 'all 0.2s' }}
                title="Ver Ficha de Perfil de Usuario y Permisos por Zona"
              >
                <div style={{ background: 'linear-gradient(135deg, #072b66 0%, #1e1b4b 100%)', color: 'white', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.85rem' }}>
                  {currentUser.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#1e293b' }}>{currentUser.name}</div>
                  <div style={{ fontSize: '0.72rem', color: '#0284c7', fontWeight: 600 }}>{currentUser.role}</div>
                </div>
              </div>
            )}
            <div className="kpi-container no-print">
              <div className="kpi-badge">
                <strong>Empresas Zona:</strong>
                <span className="count">{userProspects.length}</span>
              </div>
              <div className="kpi-badge">
                <strong>Contactadas:</strong>
                <span className="count success">{userProspects.filter(p => p.contacted).length}</span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginLeft: '4px' }}>
                  ({userProspects.length > 0 ? Math.round((userProspects.filter(p => p.contacted).length / userProspects.length) * 100) : 0}%)
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Drawer / Modal de Perfil de Usuario */}
        {showProfileDrawer && currentUser && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.5)', zIndex: 9999, display: 'flex', justifyContent: 'flex-end' }}>
            <div style={{ background: 'white', width: '100%', maxWidth: '380px', height: '100%', padding: '2rem', boxSizing: 'border-box', boxShadow: '-10px 0 25px rgba(0,0,0,0.15)', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', pb: '1rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a' }}>Perfil de Usuario CRM</h3>
                <button onClick={() => setShowProfileDrawer(false)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}>❌</button>
              </div>

              <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <div style={{ background: 'linear-gradient(135deg, #072b66 0%, #1e1b4b 100%)', color: 'white', width: '70px', height: '70px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', fontWeight: 'bold', margin: '0 auto 10px auto' }}>
                  {currentUser.name.split(' ').map(n => n[0]).join('')}
                </div>
                <h4 style={{ margin: 0, fontSize: '1.1rem', color: '#1e293b' }}>{currentUser.name}</h4>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.85rem', color: '#0284c7', fontWeight: 600 }}>{currentUser.role}</p>
                <span style={{ display: 'inline-block', marginTop: '6px', background: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                  Usuario: @{currentUser.username}
                </span>
              </div>

              <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '12px', marginBottom: '1.5rem', border: '1px solid #e2e8f0' }}>
                <h5 style={{ margin: '0 0 10px 0', fontSize: '0.85rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Datos de Contacto Directo</h5>
                <div style={{ fontSize: '0.88rem', color: '#334155', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div>📧 <strong>Email:</strong> <a href={`mailto:${currentUser.email}`} style={{ color: '#0284c7' }}>{currentUser.email}</a></div>
                  <div>📞 <strong>Teléfono:</strong> {currentUser.phone || 'No configurado'}</div>
                  {currentUser.whatsapp && (
                    <div>💬 <strong>WhatsApp:</strong> <a href={`https://wa.me/${currentUser.whatsapp}`} target="_blank" rel="noreferrer" style={{ color: '#16a34a', fontWeight: 'bold' }}>{currentUser.phone}</a></div>
                  )}
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <h5 style={{ margin: '0 0 10px 0', fontSize: '0.85rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Zonas Geográficas Asignadas</h5>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {currentUser.zones.map((z, i) => (
                    <span key={i} style={{ background: '#3b82f6', color: 'white', padding: '4px 10px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600 }}>
                      {z === 'ALL' ? '🌍 Acceso Total (Todas las Zonas)' : z}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
        <div className="content-scroll">
          {/* PROSPECTS TAB */}
          {activeTab === 'prospects' && (
            <>
              <div style={{display: 'flex', justifyContent: 'flex-end', gap: '10px', marginBottom: '15px'}}>
                <button className="action-btn outline" onClick={() => document.getElementById('import-json-input').click()}>📤 Importar JSON</button>
                <input 
                  type="file" 
                  id="import-json-input" 
                  accept=".json" 
                  onChange={handleImportJSON} 
                  style={{display: 'none'}} 
                />
                <button className="action-btn outline" onClick={handleDownloadJSON}>📥 Descargar JSON</button>
                <button className="action-btn outline" onClick={handleExportCSV}>🟢 Exportar a Excel (CSV)</button>
                <button className="action-btn outline" onClick={() => setShowReportModal(true)}>📊 Generar Reporte</button>
                <button className="action-btn" onClick={() => setShowAddCompanyModal(true)}>➕ Añadir Empresa</button>
              </div>
              <div className="filter-bar">
                <div className="filter-group search-company-group" style={{ minWidth: '240px' }}>
                  <label>🔍 Buscar Empresa</label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input
                      type="text"
                      id="company-search-input"
                      placeholder="Buscar por nombre o CIF..."
                      value={filterName}
                      onChange={e => {
                        setFilterName(e.target.value);
                        setCurrentPage(1);
                      }}
                      style={{
                        width: '100%',
                        padding: '8px 30px 8px 10px',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        fontSize: '13px',
                        backgroundColor: '#ffffff',
                        color: '#0f172a'
                      }}
                    />
                    {filterName && (
                      <button
                        onClick={() => {
                          setFilterName('');
                          setCurrentPage(1);
                        }}
                        style={{
                          position: 'absolute',
                          right: '8px',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: '#64748b',
                          fontSize: '14px',
                          fontWeight: 'bold',
                          padding: 0
                        }}
                        title="Limpiar búsqueda"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
                <div className="filter-group">
                  <label>Zona</label>
                  <select value={filterZone} onChange={e => setFilterZone(e.target.value)}>
                    <option value="">Todas las zonas autorizadas</option>
                    <option value="Comunidad Valenciana">Comunidad Valenciana</option>
                    <option value="Comunidad de Madrid">Comunidad de Madrid</option>
                    <option value="Castilla-La Mancha">Castilla-La Mancha</option>
                    <option value="Francia">Francia</option>
                    <option value="Portugal">Portugal</option>
                    <option value="Pais Vasco">País Vasco</option>
                    <option value="Castilla y Leon">Castilla y León</option>
                    <option value="Galicia">Galicia</option>
                    <option value="Cataluña">Cataluña</option>
                    <option value="Andalucia">Andalucía</option>
                    <option value="Argelia">Argelia</option>
                  </select>
                </div>
                <div className="filter-group">
                  <label>Sector</label>
                  <select value={filterSector} onChange={e => setFilterSector(e.target.value)}>
                    <option value="">Todos los sectores</option>
                    <option value="Cerramientos">Cerramientos</option>
                    <option value="Construccion Modular">Construcción Modular</option>
                    <option value="Frio Industrial">Frío Industrial</option>
                    <option value="Puertas y Ventanas">Puertas y Ventanas</option>
                    <option value="Plataformas">Plataformas</option>
                    <option value="Escaleras">Escaleras</option>
                    <option value="Estructuras Solares">Estructuras Solares</option>
                    <option value="Fachadas de Aluminio">Fachadas de Aluminio</option>
                    <option value="Fachadas Especiales">Fachadas Especiales</option>
                    <option value="Fabricantes de Escaleras de Aluminio">Fab. Escaleras</option>
                    <option value="Fabricantes de Estanterias de Aluminio">Fab. Estanterías</option>
                    <option value="Fabricantes de Carrocerias">Fab. Carrocerías</option>
                    <option value="Transformacion de Chapa">Transformación de Chapa</option>
                    <option value="Instalacion de Cubiertas">Instalación de Cubiertas</option>
                    <option value="Sistemas de Proteccion Solar">Sistemas de Protección Solar</option>
                    <option value="Metal Arquitectonico y Chapa Perforada">Metal Arquitectónico y Chapa Perforada</option>
                    <option value="Perfiles Estructurales Aluminio">Perfiles Estructurales Aluminio</option>
                    <option value="Piscinas Desmontables">Piscinas Desmontables</option>
                    <option value="Iluminacion Publica">Iluminación Pública</option>
                    <option value="Mesas de Invernadero">Mesas de Invernadero</option>
                    <option value="Divisiones de Oficina">Divisiones de Oficina</option>
                    <option value="Senalizacion">Señalización</option>
                    <option value="Camillas de Aluminio">Camillas de Aluminio</option>
                    <option value="Pistas de Padel">Pistas de Pádel</option>
                    <option value="Puertas Industriales">Puertas Industriales</option>
                    <option value="Puertas Frigorificas">Puertas Frigoríficas</option>
                    <option value="Mosquiteras">Mosquiteras</option>
                    <option value="PLV y Mobiliario Comercial">PLV y Mobiliario Comercial</option>
                    <option value="Proveedor de Aluminio">Proveedor de Aluminio</option>
                    <option value="Distribucion de Aluminio y Metales">Distribución de Aluminio y Metales</option>
                    <option value="Armarios de Aluminio">Armarios de Aluminio</option>
                  </select>
                </div>
                <div className="filter-group">
                  <label>Producto</label>
                  <select value={filterProduct} onChange={e => setFilterProduct(e.target.value)}>
                    <option value="">Todos los productos</option>
                    <option value="Perfiles">Perfiles</option>
                    <option value="Lamas">Lamas</option>
                    <option value="Rotura Puente Termico">Rotura Puente Térmico</option>
                    <option value="Accesorios">Accesorios</option>
                    <option value="Paneles Composite">Paneles Composite</option>
                    <option value="Perfiles Ranurados">Perfiles Ranurados</option>
                    <option value="Chapas de Aluminio">Chapas de Aluminio</option>
                  </select>
                </div>
                <div className="filter-group">
                  <label>Estado</label>
                  <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                    <option value="">Todos</option>
                    <option value="pending">Pendientes</option>
                    <option value="contacted">Contactados</option>
                  </select>
                </div>
                <div className="filter-group">
                  <label>Facturación</label>
                  <select value={filterRevenue} onChange={e => setFilterRevenue(e.target.value)}>
                    <option value="">Todas</option>
                    <option value="gt10">&gt; 10M €</option>
                    <option value="5to10">5M € - 10M €</option>
                    <option value="lt5">&lt; 5M €</option>
                  </select>
                </div>
                <div className="filter-group">
                  <label>Ordenar por</label>
                  <select value={sortOrder} onChange={e => setSortOrder(e.target.value)}>
                    <option value="alphabetical">Nombre (A-Z)</option>
                    <option value="alphabetical-desc">Nombre (Z-A)</option>
                    <option value="revenue-desc">Facturación (Desc.)</option>
                    <option value="revenue-asc">Facturación (Asc.)</option>
                  </select>
                </div>
                <div className="filter-group" style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '20px' }}>
                  <input 
                    type="checkbox" 
                    id="filterNewOnly" 
                    checked={filterNewOnly} 
                    onChange={e => setFilterNewOnly(e.target.checked)} 
                    style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                  />
                  <label htmlFor="filterNewOnly" style={{ cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem', color: '#7c3aed' }}>Novedades (3 sem.)</label>
                </div>
              </div>
              <div className="card table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Empresa</th>
                      <th>Facturación</th>
                      <th>Contacto & Email</th>
                      <th>Teléfono</th>
                      <th>Sector & Zona</th>
                      <th>Estado CRM</th>
                      <th>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedProspects.map(p => (
                      <tr key={p.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                            <strong>{p.name}</strong>
                            {p.createdAt && (() => {
                              const createdTime = new Date(p.createdAt).getTime();
                              const diffTime = Math.abs(new Date().getTime() - createdTime);
                              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                              if (diffDays <= 21) {
                                return (
                                  <span style={{ 
                                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', 
                                    color: 'white', 
                                    padding: '2px 6px', 
                                    borderRadius: '4px', 
                                    fontSize: '0.65rem', 
                                    fontWeight: 'bold',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px',
                                    boxShadow: '0 2px 4px rgba(16, 185, 129, 0.2)'
                                  }}>NUEVO</span>
                                );
                              }
                              return null;
                            })()}
                            {/* Badge: empresa reincorporada (fue borrada anteriormente) */}
                            {p.wasDeleted && (
                              <span
                                title={p.previouslyDeletedAt ? `Borrada el ${new Date(p.previouslyDeletedAt).toLocaleDateString('es-ES')}` : 'Empresa borrada anteriormente'}
                                style={{
                                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                                  color: 'white',
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  fontSize: '0.65rem',
                                  fontWeight: 'bold',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.5px',
                                  cursor: 'help',
                                  boxShadow: '0 2px 4px rgba(245, 158, 11, 0.3)'
                                }}
                              >
                                ♻️ REINCORPORADA
                              </span>
                            )}
                          </div>
                          {p.web !== 'No disponible' ? (
                            <a href={p.web.startsWith('http') ? p.web : `https://${p.web}`} target="_blank" rel="noreferrer" style={{color: 'var(--sopena-blue)', fontSize: '0.85rem'}}>{p.web.replace('https://www.','').replace('http://www.','').replace('https://','')}</a>
                          ) : (
                            <span style={{color: 'var(--text-secondary)', fontSize: '0.85rem'}}>No disponible</span>
                          )}
                        </td>
                        <td>{new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(p.revenue)}</td>
                        <td>
                          {/* Nombre del responsable de compras */}
                          <span style={{fontWeight: 500}}>{p.purchasingManager}</span><br/>
                          {/* Email con clasificación: válido, genérico, sin email */}
                          {(() => {
                            const email = p.email;
                            const quality = checkEmailQuality(email, p.name);
                            if (quality === 'none' || quality === 'invalid') {
                              return (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                                  <span style={{fontSize: '0.8rem', color: '#f59e0b', fontWeight: 600}} title="Sin email verificado">⚠️ Sin email</span>
                                  <button 
                                    type="button" 
                                    onClick={(e) => { e.stopPropagation(); startSingleEmailScan(p); }} 
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', fontSize: '0.95rem', borderRadius: '4px', display: 'flex', alignItems: 'center' }} 
                                    title="Buscar email real con Agentforce IA"
                                  >
                                    🧙‍♂️
                                  </button>
                                </span>
                              );
                            }
                            if (quality === 'placeholder') {
                              return (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                                  <span style={{fontSize: '0.8rem', color: '#ef4444'}} title="Email autogenerado / no verificado">⚠️ {email}</span>
                                  <button 
                                    type="button" 
                                    onClick={(e) => { e.stopPropagation(); startSingleEmailScan(p); }} 
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', fontSize: '0.95rem', borderRadius: '4px', display: 'flex', alignItems: 'center' }} 
                                    title="Buscar email real con Agentforce IA"
                                  >
                                    🧙‍♂️
                                  </button>
                                </span>
                              );
                            }
                            if (quality === 'verified_purchasing') {
                              return <a href={`mailto:${email}`} style={{fontSize: '0.8rem', color: '#10b981', textDecoration: 'none', fontWeight: 600}} title="Email de compras verificado">✅ {email}</a>;
                            }
                            // verified_generic
                            return <a href={`mailto:${email}`} style={{fontSize: '0.8rem', color: 'var(--sopena-blue)', textDecoration: 'none'}} title="Email genérico de la empresa">✉️ {email}</a>;
                          })()}
                        </td>
                        <td>
                          {p.phone ? (
                            <a href={`tel:${p.phone.replace(/\s+/g, '')}`} style={{color: 'var(--sopena-blue)', fontSize: '0.85rem', textDecoration: 'none', fontWeight: 600}} title="Llamada telefónica directa">
                              📞 {p.phone}
                            </a>
                          ) : (
                            <span style={{color: 'var(--text-secondary)', fontSize: '0.85rem'}}>No disponible</span>
                          )}
                        </td>
                        <td>
                          <span style={{fontWeight: 600}}>{p.sector}</span><br/>
                          <span style={{fontSize: '0.85rem'}}>{p.zone} (Lat: {p.location[0].toFixed(2)}, Lng: {p.location[1].toFixed(2)})</span>
                        </td>
                        <td>
                          <span className={`status-badge ${p.contacted ? 'status-contacted' : 'status-pending'}`}>
                            {p.contacted ? 'Contactado' : 'Pendiente'}
                          </span>
                        </td>
                        <td>
                          <button className="action-btn outline" onClick={() => setSelectedProspect(p)}>
                            Gestionar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* CONTROLES DE PAGINACIÓN */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 18px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Mostrando <strong>{paginatedProspects.length}</strong> de <strong>{filteredProspects.length}</strong> empresas | Página <strong>{currentPage}</strong> de <strong>{totalPages}</strong>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Por página:</label>
                    <select 
                      value={itemsPerPage} 
                      onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                      style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem', background: 'white' }}
                    >
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                      <option value={200}>200</option>
                    </select>

                    <button 
                      disabled={currentPage === 1} 
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      className="action-btn outline"
                      style={{ padding: '5px 10px', fontSize: '0.82rem', opacity: currentPage === 1 ? 0.5 : 1, cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
                    >
                      ◀ Anterior
                    </button>
                    <button 
                      disabled={currentPage >= totalPages} 
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      className="action-btn outline"
                      style={{ padding: '5px 10px', fontSize: '0.82rem', opacity: currentPage >= totalPages ? 0.5 : 1, cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer' }}
                    >
                      Siguiente ▶
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
          {/* MAP TAB */}
          {activeTab === 'map' && (
            <div className="card map-container" style={{padding: 0}}>
              <MapContainer center={[42.0, -4.0]} zoom={6} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {filteredProspects.slice(0, 150).map(p => (
                  <Marker key={p.id} position={p.location}>
                    <Popup>
                      <strong>{p.name}</strong><br/>
                      {p.zone} - {p.sector}<br/>
                      <button className="action-btn" style={{marginTop:'10px', width:'100%'}} onClick={() => { setActiveTab('prospects'); setSelectedProspect(p); }}>
                        Ver Detalles
                      </button>
                    </Popup>
                  </Marker>
                ))}
                {shortestRoute.length > 0 && (
                  <Polyline positions={shortestRoute} color="var(--sopena-blue)" weight={4} />
                )}
              </MapContainer>
              {/* Botón para calcular distancia más corta */}
              <div className="no-print" style={{ marginTop: '10px', textAlign: 'center' }}>
                <button className="action-btn" onClick={handleCalculateShortest} style={{ padding: '8px 16px' }}>
                  Calcular distancia más corta
                </button>
                {shortestDistance !== null && (
                  <div style={{ marginTop: '8px', fontWeight: 'bold' }}>
                    Distancia más corta: {shortestDistance} km
                  </div>
                )}
              </div>
            </div>
          )}
          {/* ROUTING TAB */}
          {activeTab === 'routing' && (
            <div className="dashboard-grid">
              <div className="card" style={{gridColumn: '1 / 2'}}>
                <h3>1. Selecciona Clientes para la Ruta</h3>
                <div style={{maxHeight: '400px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '10px'}}>
                  {routingSortedProspects.map(p => (
                    <div key={p.id} style={{display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px'}}>
                      <input
                        type="checkbox"
                        checked={!!routeClients.find(c => c.id === p.id)}
                        onChange={() => handleToggleRouteClient(p)}
                      />
                      <div>
                        <strong>{p.name}</strong> <span style={{fontSize: '0.8rem', color: '#666'}}>({p.zone})</span>
                      </div>
                    </div>
                  ))}
                </div>

                {routeClients.length > 1 && (
                  <div style={{marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '12px'}}>
                    {/* Distancia estimada */}
                    <div style={{padding: '15px', background: '#f1f5f9', borderRadius: '8px'}}>
                      <strong>Distancia Total Estimada: </strong>
                      <span style={{color: 'var(--sopena-blue)', fontSize: '1.2rem', fontWeight: 600}}>
                        {totalDistance.toFixed(1)} km
                      </span>
                      <div style={{marginTop: '8px', fontSize: '0.78rem', color: '#64748b'}}>
                        📍 Orden de visita: {routeClients.map(c => c.name).join(' → ')}
                      </div>
                    </div>

                    {/* Botón Google Maps */}
                    <button
                      type="button"
                      onClick={() => {
                        // Construir URL de Google Maps con origen, waypoints intermedios y destino
                        const coords = routeClients.map(c => `${c.location[0]},${c.location[1]}`);
                        const origin = coords[0];
                        const destination = coords[coords.length - 1];
                        // Google Maps acepta hasta 8 waypoints intermedios en URL pública
                        const waypoints = coords.slice(1, -1).join('|');
                        let url = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&travelmode=driving`;
                        if (waypoints) {
                          url += `&waypoints=${encodeURIComponent(waypoints)}`;
                        }
                        window.open(url, '_blank', 'noopener,noreferrer');
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '10px',
                        width: '100%',
                        padding: '14px',
                        background: 'linear-gradient(135deg, #34a853 0%, #1a8a3a 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '10px',
                        fontSize: '0.95rem',
                        fontWeight: '700',
                        cursor: 'pointer',
                        boxShadow: '0 4px 14px rgba(52, 168, 83, 0.35)',
                        transition: 'all 0.2s ease',
                        letterSpacing: '0.3px'
                      }}
                      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(52, 168, 83, 0.45)'; }}
                      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(52, 168, 83, 0.35)'; }}
                      title={`Abrir ruta de ${routeClients.length} paradas en Google Maps`}
                    >
                      {/* Icono SVG de Google Maps */}
                      <svg width="22" height="22" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M24 4C16.27 4 10 10.27 10 18c0 11.25 14 26 14 26s14-14.75 14-26C38 10.27 31.73 4 24 4z" fill="white" opacity="0.9"/>
                        <circle cx="24" cy="18" r="5" fill="#34a853"/>
                      </svg>
                      Abrir Ruta en Google Maps ({routeClients.length} paradas)
                    </button>

                    {/* Aviso si hay más de 9 puntos (límite URL de Google Maps) */}
                    {routeClients.length > 9 && (
                      <div style={{
                        padding: '10px 14px',
                        background: 'rgba(245, 158, 11, 0.1)',
                        border: '1px solid rgba(245, 158, 11, 0.4)',
                        borderRadius: '8px',
                        fontSize: '0.78rem',
                        color: '#92400e'
                      }}>
                        ⚠️ <strong>Nota:</strong> Google Maps admite hasta 9 puntos en su URL pública. Se incluirán los primeros 9 puntos de tu selección. Para rutas de más paradas, añádelas manualmente en Google Maps.
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="card map-container" style={{gridColumn: '2 / -1', padding: 0, height: '500px'}}>
                <MapContainer center={[42.0, -4.0]} zoom={6} style={{ height: '100%', width: '100%' }}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  {routeClients.map(p => (
                    <Marker key={`route-${p.id}`} position={p.location}>
                      <Popup>{p.name}</Popup>
                    </Marker>
                  ))}
                  {routeClients.length > 1 && (
                    <Polyline
                      positions={routeClients.map(c => c.location)}
                      color="var(--sopena-blue)"
                      weight={4}
                      dashArray="10, 10"
                    />
                  )}
                </MapContainer>
              </div>
            </div>
          )}

          {/* PRESENTATION TAB */}
          {activeTab === 'presentation' && (
            <div className="dashboard-grid">
              
              <div className="card no-print" style={{gridColumn: '1 / -1', marginBottom: '-1rem', display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px'}}>
                <div className="filter-group" style={{maxWidth: '300px'}}>
                  <label>Personalizar presentación para:</label>
                  <select value={presentationTargetId} onChange={e => setPresentationTargetId(e.target.value)}>
                    <option value="">-- Versión General --</option>
                    {prospects.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.sector})</option>
                    ))}
                  </select>
                </div>
                
                {/* Selector de Tipo de Presentación */}
                <div className="filter-group" style={{maxWidth: '300px'}}>
                  <label>Tipo de Presentación:</label>
                  <div className="presentation-type-toggle">
                    <button 
                      type="button" 
                      className={`toggle-btn ${presentationType === 'corta' ? 'active' : ''}`}
                      onClick={() => setPresentationType('corta')}
                    >
                      Corta (Carta)
                    </button>
                    <button 
                      type="button" 
                      className={`toggle-btn ${presentationType === 'detallada' ? 'active' : ''}`}
                      onClick={() => {
                        const isDetailedAllowed = canShowDetailedPresentation(presentationTarget);
                        if (isDetailedAllowed) {
                          setPresentationType('detallada');
                        } else {
                          alert('La presentación detallada (dossier corporativo) solo está disponible para los sectores de: Puertas y Ventanas, Cerramientos, Sistemas de Protección Solar, Proveedor de Aluminio y Fachadas de Aluminio.');
                        }
                      }}
                      style={{
                        opacity: canShowDetailedPresentation(presentationTarget) ? 1 : 0.5,
                        cursor: canShowDetailedPresentation(presentationTarget) ? 'pointer' : 'not-allowed'
                      }}
                      title={!canShowDetailedPresentation(presentationTarget) ? 'Solo disponible para sectores de carpintería y aluminio' : ''}
                    >
                      Detallada (Dossier)
                    </button>
                  </div>
                </div>

                <div className="filter-group" style={{display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap'}}>
                  <label style={{display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', fontWeight: 'bold', color: 'var(--sopena-blue-dark)'}}>
                    <input type="checkbox" checked={includeArchitectureLink} onChange={e => setIncludeArchitectureLink(e.target.checked)} />
                    🔗 Catálogo Sistemas Arquitectura
                  </label>
                  <label style={{display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', fontWeight: 'bold', color: 'var(--sopena-blue-dark)'}}>
                    <input type="checkbox" checked={includeIndustrialLink} onChange={e => setIncludeIndustrialLink(e.target.checked)} />
                    🔗 Catálogo Perfiles Industriales
                  </label>
                </div>
                <div style={{display: 'flex', gap: '10px', flexWrap: 'wrap'}}>
                  <button className="action-btn outline" onClick={handleCopyToMailClipboard} style={{height: 'fit-content'}}>
                    📋 Copiar para Correo (Ctrl+V)
                  </button>
                  <button className="action-btn outline" onClick={handleExportInteractiveHTML} style={{height: 'fit-content'}}>
                    📧 Exportar HTML Comercial
                  </button>
                  {/* Botón PDF interactivo: captura el .a4-page y genera PDF con links clicables */}
                  <button
                    className="action-btn"
                    onClick={handleExportPDF}
                    disabled={isExportingPDF}
                    style={{
                      height: 'fit-content',
                      background: isExportingPDF
                        ? '#94a3b8'
                        : 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
                      border: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '7px',
                      cursor: isExportingPDF ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s'
                    }}
                    title="Exportar la presentación como PDF interactivo con enlaces clicables"
                  >
                    {isExportingPDF ? (
                      <>
                        <span style={{display:'inline-block', width:'14px', height:'14px', border:'2px solid rgba(255,255,255,0.4)', borderTopColor:'white', borderRadius:'50%', animation:'spin 0.8s linear infinite'}} />
                        Generando PDF...
                      </>
                    ) : (
                      <>
                        📄 Exportar PDF Interactivo
                      </>
                    )}
                  </button>
                  <button className="action-btn outline" onClick={() => window.print()} style={{height: 'fit-content'}}>
                    🗈️ Imprimir
                  </button>
                </div>
              </div>
              <div style={{gridColumn: '1 / -1'}} className="a4-container">
                <div className="a4-page" style={{padding: 0, overflow: 'hidden', position: 'relative', height: 'auto', minHeight: '297mm'}}>
                  
                  {/* MODERN HEADER CON DOBLE LOGO PARA CARPINTERÍAS */}
                  <div style={{background: 'linear-gradient(135deg, var(--sopena-blue-dark) 0%, var(--sopena-blue) 100%)', padding: '40px 50px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px'}}>
                    <div style={{display: 'flex', alignItems: 'center', gap: '20px'}}>
                      <div style={{background: 'white', padding: '10px 20px', borderRadius: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)'}}>
                        <img src="https://empresa-aluminio.com/images/global/logo/grupo-sopena-sistemas.png" alt="Logotipo Grupo de Aluminio" style={{height: '50px', objectFit: 'contain'}} />
                      </div>
                      {/* Mostrar logotipo dinámico del cliente si está relacionado con carpintería */}
                      {presentationTarget && isCarpinteriaRelated(presentationTarget) && renderClientLogo(presentationTarget.name)}
                    </div>
                    <div style={{textAlign: 'right', fontSize: '0.85rem', lineHeight: '1.4', opacity: 0.9}}>
                      <strong>Aluminios Innovations, S.L.</strong><br/>
                      Pol. Ind. Los Vientos, C/ Garbí, 9<br/>
                      46119 Náquera, Valencia {isPt ? 'Espanha' : 'España'}<br/>
                      +34 96 145 20 50 | empresa-aluminio.com
                    </div>
                  </div>
                  {/* CONTENT AREA */}
                  <div style={{padding: '50px', position: 'relative'}}>
                    {/* Decorative element */}
                    <div style={{position: 'absolute', top: '0', right: '50px', width: '4px', height: '100px', background: 'var(--sopena-accent)', borderRadius: '0 0 4px 4px'}}></div>
                    
                    {presentationTarget ? (
                      <div style={{marginBottom: '40px'}}>
                        <h2 style={{color: 'var(--sopena-blue-dark)', fontSize: '2.2rem', marginTop: 0, marginBottom: '15px', fontWeight: '800', letterSpacing: '-0.5px'}}>{isPt ? 'Soluções de Alumínio para' : 'Soluciones de Aluminio para'} <br/><span style={{color: 'var(--sopena-blue)'}}>{presentationTarget.name}</span></h2>
                        <div style={{background: '#f8fafc', padding: '20px', borderRadius: '8px', borderLeft: '4px solid var(--sopena-accent)', display: 'inline-block', minWidth: '350px'}}>
                          <p style={{margin: '0 0 8px 0', color: 'var(--text-secondary)'}}>
                            <strong>{isPt ? 'A/C:' : 'A/A:'}</strong> {presentationTarget.purchasingManager} 
                            {presentationTarget.purchasingPhone && <span> | 📞 {presentationTarget.purchasingPhone}</span>}
                            {presentationTarget.email && <span> | ✉️ {presentationTarget.email}</span>}
                          </p>
                          {/* Dirección física del cliente (Carpintería) */}
                          {(isCarpinteriaRelated(presentationTarget) || presentationTarget.address) && (
                            <p style={{margin: '0 0 8px 0', color: 'var(--text-secondary)', fontSize: '0.9rem'}}>
                              <strong>📍 Dirección:</strong> {presentationTarget.address || 'Polígono de Pocomaco, 1ª Avda. 26'}, {presentationTarget.city || 'A Coruña'} ({presentationTarget.zone})
                            </p>
                          )}
                          <p style={{margin: '0 0 8px 0', color: 'var(--text-secondary)'}}><strong>De:</strong> Carmen Castro</p>
                          <p style={{margin: 0, color: 'var(--text-secondary)'}}><strong>{isPt ? 'Data:' : 'Fecha:'}</strong> {new Date().toLocaleDateString(isPt ? 'pt-PT' : 'es-ES')}</p>
                        </div>
                      </div>
                    ) : (
                      <div style={{marginBottom: '40px'}}>
                        <h2 style={{color: 'var(--sopena-blue-dark)', fontSize: '2.2rem', marginTop: 0, marginBottom: '15px', fontWeight: '800', letterSpacing: '-0.5px'}}>{isPt ? 'Soluções de Alumínio' : 'Soluciones de Aluminio'}</h2>
                      </div>
                    )}

                    {/* VISTA 1: PRESENTACIÓN CORTA (CARTA TRADICIONAL) o VISTA 2: PRESENTACIÓN DETALLADA (DOSSIER) */}
                    {presentationType === 'corta' ? (
                      <div style={{display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '40px'}}>
                        <div>
                          <h3 style={{color: 'var(--sopena-accent)', marginTop: 0, fontSize: '1.4rem', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px'}}>{isPt ? 'Quem Somos' : 'Quiénes Somos'}</h3>
                          <p style={{lineHeight: '1.7', color: '#475569'}}>{isPt ? 'Somos uma empresa industrial especializada no design e fabricação de perfis de alumínio extrudado sob medida, localizados estrategicamente no ' : 'Somos una empresa industrial especializada en el diseño y fabricación de perfiles de aluminio extruido a medida, ubicados estratégicamente en el '}<strong>Polígono Industrial Los Vientos (Náquera, Valencia)</strong>. {isPt ? 'Esta produção centralizada permite-nos oferecer uma proximidade logística imbatível para toda a Península Ibérica, garantindo prazos de entrega ágeis, nula dependência de importações e um suporte técnico direto.' : 'Esta producción centralizada nos permite ofrecer una cercanía logística inmejorable para toda la Península Ibérica, garantizando plazos de entrega ágiles, nula dependencia de importaciones y un soporte técnico directo.'}</p>
                          
                          <h3 style={{color: 'var(--sopena-accent)', fontSize: '1.4rem', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px', marginTop: '30px'}}>{isPt ? 'Compromisso e Normativa' : 'Compromiso y Normativa'}</h3>
                          <ul style={{paddingLeft: '20px', lineHeight: '1.7', color: '#475569'}}>
                            <li><strong>{isPt ? 'Alumínio Reciclado:' : 'Aluminio Reciclado:'}</strong> {isPt ? 'Utilização de tarugos de alumínio reciclável de muito baixo impacto.' : 'Uso de tochos de aluminio reciclable de muy bajo impacto.'}</li>
                            <li><strong>{isPt ? 'Ligas Especializadas:' : 'Aleaciones Especializadas:'}</strong> {isPt ? 'Capacidade para extrudar ligas exigentes (6060, 6005, 6083).' : 'Capacidad para extruir aleaciones exigentes (6060, 6005, 6083).'}</li>
                            <li><strong>{isPt ? 'Cumprimento Rigoroso:' : 'Cumplimiento Estricto:'}</strong> {isPt ? 'Marcação CE e avalizados pelos selos internacionais mais exigentes.' : 'Marcado CE y avalados por los sellos internacionales más exigentes.'}</li>
                          </ul>
                        </div>
                        
                        <div>
                          <div style={{background: 'var(--sopena-blue)', color: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 10px 25px rgba(10, 61, 145, 0.2)'}}>
                            <h3 style={{marginTop: 0, color: 'white', fontSize: '1.4rem'}}>{isPt ? 'As Nossas Capacidades' : 'Nuestras Capacidades'}</h3>
                            <ul style={{paddingLeft: '20px', lineHeight: '1.6', margin: 0, opacity: 0.9}}>
                              <li style={{marginBottom: '15px'}}><strong>{isPt ? 'Extrusão de Precisão:' : 'Extrusión de Precisión:'}</strong><br/>{isPt ? 'Manuseamento avançado da série 6000.' : 'Manejo avanzado de la serie 6000.'}</li>
                              <li style={{marginBottom: '15px'}}><strong>{isPt ? 'Tratamentos Superficiais:' : 'Tratamientos Superficiales:'}</strong><br/>{isPt ? 'Anodização e Lacagem de máxima durabilidade.' : 'Anodizado y Lacado de máxima durabilidad.'}</li>
                              <li><strong>{isPt ? 'Engenharia e Design:' : 'Ingeniería y Diseño:'}</strong><br/>{isPt ? 'Desenvolvimento de matrizes exclusivas.' : 'Desarrollo de matrices exclusivas.'}</li>
                            </ul>
                          </div>
                          <div className="cert-grid" style={{marginTop: '30px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px'}}>
                            <div style={{background: '#f1f5f9', padding: '8px', borderRadius: '6px', fontSize: '0.8rem', textAlign: 'center', fontWeight: 'bold', color: '#334155'}}>⚙️ ISO 9001</div>
                            <div style={{background: '#f1f5f9', padding: '8px', borderRadius: '6px', fontSize: '0.8rem', textAlign: 'center', fontWeight: 'bold', color: '#334155'}}>🌱 ISO 14001</div>
                            <div style={{background: '#f1f5f9', padding: '8px', borderRadius: '6px', fontSize: '0.8rem', textAlign: 'center', fontWeight: 'bold', color: '#334155'}}>🛡️ ISO 45001</div>
                            <div style={{background: '#f1f5f9', padding: '8px', borderRadius: '6px', fontSize: '0.8rem', textAlign: 'center', fontWeight: 'bold', color: '#334155'}}>🇪🇺 Marcado CE</div>
                            <div style={{background: '#f1f5f9', padding: '8px', borderRadius: '6px', fontSize: '0.8rem', textAlign: 'center', fontWeight: 'bold', color: '#334155'}}>🎖 QUALANOD</div>
                            <div style={{background: '#f1f5f9', padding: '8px', borderRadius: '6px', fontSize: '0.8rem', textAlign: 'center', fontWeight: 'bold', color: '#334155'}}>🎖 QUALICOAT</div>
                          </div>
                        </div>
                        {presentationTarget && (
                          <div style={{gridColumn: '1 / -1', marginTop: '40px', background: '#f8fafc', padding: '30px', borderRadius: '12px', border: '1px solid #e2e8f0'}}>
                            <h3 style={{color: 'var(--sopena-blue-dark)', marginTop: 0, fontSize: '1.4rem'}}>{isPt ? 'Abordagem para' : 'Enfoque Especializado para'} {presentationTarget.name}</h3>
                            <div style={{lineHeight: '1.7', color: '#475569'}}>
                              {['Cerramientos', 'Puertas y Ventanas', 'Construccion Modular'].includes(presentationTarget.sector) && (
                                <p style={{margin: 0}}>{isPt ? `Centrados no setor de ${presentationTarget.sector}, fabricamos e montamos perfis com rotura de ponte térmica e poliamidas "Low Lambda" para o máximo isolamento. Extrudimos tanto para os nossos sistemas próprios de arquitetura como para sistemas de terceiros. Além disso, os nossos lacados Qualicoat Seaside e acabamentos com efeito madeira (Qualideco) garantirão a máxima resistência e estética nas suas caixilharias.` : `Centrados en el sector de ${presentationTarget.sector}, fabricamos y ensamblamos perfiles con rotura de puente térmico y poliamidas "Low Lambda" para el máximo aislamiento. Extruimos tanto para nuestros sistemas propios de arquitectura como para sistemas de terceros. Además, nuestros lacados Qualicoat Seaside y acabados con efecto madera (Qualideco) garantizarán la máxima resistencia y estética en todos sus cerramientos.`}</p>
                              )}
                              {['Fachadas de Aluminio', 'Escaleras', 'Fabricantes de Escaleras de Aluminio'].includes(presentationTarget.sector) && (
                                <p style={{margin: 0}}>{isPt ? `Para ${presentationTarget.sector}, extrudimos ligas estruturais (6005/6083) que oferecem as propriedades mecânicas avançadas requeridas para muros cortina e estruturas portantes, sempre com acabamentos Qualideco impecáveis.` : `Para ${presentationTarget.sector}, extruimos aleaciones estructurales (6005/6083) que ofrecen las propiedades mecánicas avanzadas requeridas para muros cortina y estructuras portantes, siempre con acabados Qualideco impecables.`}</p>
                              )}
                              {['Estructuras Solares'].includes(presentationTarget.sector) && (
                                <p style={{margin: 0}}>{isPt ? `Em Estructuras Solares, o alumínio leve e sem corrosão é vital. As nossas ligas anodizadas (Qualanod) garantirão a ${presentationTarget.name} a máxima durabilidade em plantas fotovoltaicas e trackers.` : `En Estructuras Solares, el aluminio ligero y sin corrosión es vital. Nuestras aleaciones anodizadas (Qualanod) asegurarán a ${presentationTarget.name} la máxima durabilidad en plantas fotovoltaicas y trackers.`}</p>
                              )}
                              {['Frio Industrial', 'Plataformas', 'Fabricantes de Estanterias de Aluminio'].includes(presentationTarget.sector) && (
                                <p style={{margin: 0}}>{isPt ? `Para reduzir tempos de montagem em ${presentationTarget.sector}, na Empresa de Aluminio integramos ranhuras e encaixes diretos na matriz de extrusão, agilizando radicalmente a fabricação dos sus produtos.` : `Para reducir tiempos de montaje en ${presentationTarget.sector}, en Empresa de Aluminio integramos ranuras y encajes directos en la matriz de extrusión, agilizando radicalmente la fabricación de sus productos.`}</p>
                              )}
                              {['Fabricantes de Carrocerias'].includes(presentationTarget.sector) && (
                                <p style={{margin: 0}}>{isPt ? `No setor dos transportes, asseguramos a ${presentationTarget.name} perfis estruturais leves e robustos para maximizar a carga útil em carroçarias frigoríficas e plataformas.` : `En el sector del transporte, aseguramos a ${presentationTarget.name} perfiles estructurales ligeros y robustos para maximizar la carga útil en carrocerías frigoríficas y plataformas.`}</p>
                              )}
                              {['Sistemas de Proteccion Solar', 'Armarios de Aluminio'].includes(presentationTarget.sector) && (
                                <p style={{margin: 0}}>{isPt ? `Oferecemos tolerâncias estritas para ${presentationTarget.sector}, ideais para pergolas e toldos, avalados por acabamentos Seaside resistentes à corrosão salina.` : `Ofrecemos tolerancias estrictas para ${presentationTarget.sector}, ideales para pergolas y toldos, avalados por acabados Seaside resistentes a la corrosión salina.`}</p>
                              )}
                              {['Instalacion de Cubiertas'].includes(presentationTarget.sector) && (
                                <p style={{margin: 0}}>{isPt ? `Para ${presentationTarget.sector}, proporcionamos perfilaria industrial hermética com certificações europeias e fornecimento de confiança graças à nossa cercânia logística.` : `Para ${presentationTarget.sector}, proporcionamos perfilería industrial hermética con certificaciones europeas y suministro de confianza gracias a nuestra cercanía logística.`}</p>
                              )}
                              {['Transformacion de Chapa', 'Metal Arquitectonico y Chapa Perforada', 'PLV y Mobiliario Comercial', 'Armarios de Aluminio'].includes(presentationTarget.sector) && (
                                <p style={{margin: 0}}>{isPt ? `Para ${presentationTarget.sector}, aplicamos tratamentos superficiais Premium (Qualicoat, Qualideco) que mantêm as suas envolventes, expositores e displays comerciais inalteráveis ao longo do tempo.` : `Para ${presentationTarget.sector}, aplicamos tratamientos superficiales Premium (Qualicoat, Qualideco) que mantienen sus envolventes, expositores y displays comerciales inalterables a lo largo del tiempo.`}</p>
                              )}
                              {['Perfiles Estructurales Aluminio'].includes(presentationTarget.sector) && (
                                <p style={{margin: 0}}>{isPt ? `Na indústria moderna, os ${presentationTarget.sector} são o standard para a construção de maquinaria e linhas de montagem. Na Aluminios Innovations contamos com a capacidade técnica para extrudar perfis ranhurados con tolerâncias milimétricas.` : `En el sector de ${presentationTarget.sector}, proporcionamos perfiles estructurales de precisión con acabados certificados para soportar sus líneas de montaje.`}</p>
                              )}
                              {['Proveedor de Aluminio', 'Distribucion de Aluminio y Metales'].includes(presentationTarget.sector) && (
                                <p style={{margin: 0}}>{isPt ? `Como distribuidor e fornecedor de alumínio, propomos a ${presentationTarget.name} uma colaboração estratégica de extrusão. Podemos fornecer perfis e lamas sob medida com acabamentos premium anodizados e lacados com a garantia de qualidade Aluminios Innovations.` : `Como distribuidor y proveedor de aluminio, proponemos a ${presentationTarget.name} una colaboración estratégica de extrusión. Podemos suministrar perfiles y lamas a medida con acabados premium anodizados y lacados con la garantía de calidad de Aluminios Innovations.`}</p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      /* VISTA 2: PRESENTACIÓN DETALLADA (DOSSIER TÉCNICO Y COMERCIAL) */
                      <div style={{ color: '#334155', lineHeight: '1.7' }}>
                        <div>
                          <h3 style={{ color: 'var(--sopena-blue-dark)', marginTop: 0, fontSize: '1.4rem', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px' }}>
                            {isPt ? 'Proposta de Colaboração e Distribuição B2B' : 'Propuesta de Colaboración y Distribución B2B'}
                          </h3>
                          <p style={{ whiteSpace: 'pre-line', marginBottom: '20px' }}>
                            {isPt ? (
                              `Estimados companheiros da ${presentationTarget ? presentationTarget.name : 'Mapeal'},

Me dirijo a vocês na minha qualidade de Project Manager do Grupo de Aluminio para a zona Noroeste de Espanha e Portugal. Conheço em primeira mão a vossa liderança no fornecimento e distribuição de perfilaria e acessórios de alumínio. O vosso compromisso com a qualidade e a capacidade de oferecer soluções à medida à rede de serralharias e carpintarias metálicas da região coincide plenamente com os valores da nossa empresa.

A Aluminios Innovations conta com uma trajetória de mais de 75 anos na vanguarda da extrusão e tratamento de superfícies de alumínio na Península Ibérica. Especializamo-nos no desenvolvimento de sistemas próprios de arquitetura com marcação CE e ensaios oficiais de alta performance. Dispomos de armazém regulador próprio para garantir um fornecimento ágil e estável, eliminando as incertezas de stock no mercado.`
                            ) : (
                              `Estimados compañeros de ${presentationTarget ? presentationTarget.name : 'Mapeal'},

Me dirijo a ustedes en mi calidad de Project Manager de Grupo de Aluminio para la zona Noroeste de España y Portugal. Conozco de primera mano el liderazgo de ${presentationTarget ? presentationTarget.name : 'Mapeal'} en el suministro y distribución de perfilería y accesorios de aluminio. Su compromiso con la calidad y la capacidad de ofrecer soluciones a medida a la red de carpinterías metálicas coincide plenamente con los valores fundacionales de nuestra compañía.

Aluminios Innovations atesora una trayectoria de más de 75 años a la vanguardia de la extrusión y el tratamiento de superficies de aluminio en España. A lo largo de esta historia, nos hemos especializado en el desarrollo de sistemas propios de carpintería y fachadas (con ensayos oficiales y marcado CE) de altísimas prestaciones térmicas y acústicas. Contamos con un almacén regulador propio y una sólida capacidad productiva que nos permite garantizar un suministro ágil, estable y directo a nuestros colaboradores, eliminando las incertidumbres de stock que tanto afectan al sector en la actualidad.`
                            )}
                          </p>
                          
                          <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '10px', borderLeft: '4px solid var(--sopena-accent)', border: '1px solid #e2e8f0', borderLeftWidth: '4px', marginTop: '20px', marginBottom: '30px' }}>
                            <strong style={{ color: 'var(--sopena-blue-dark)', display: 'block', marginBottom: '8px', fontSize: '1rem' }}>
                              🛡️ Acabados Certificados para Ambientes Exigentes:
                            </strong>
                            <p style={{ margin: 0, fontSize: '0.85rem', lineHeight: '1.5' }}>
                              Controlamos íntegramente todo el proceso de acabados superficiales bajo sellos internacionales de máxima exigencia:
                              <br/>• <strong>Qualicoat / Qualicoat Seaside:</strong> Sello para lacado arquitectónico. El tratamiento Seaside previene la corrosión filiforme, idóneo para combatir la humedad y salinidad del litoral gallego y portugués.
                              <br/>• <strong>Qualanod:</strong> Certificación para anodizado, garantizando máxima dureza superficial frente a la abrasión salina.
                              <br/>• <strong>Qualideco:</strong> Tecnología de sublimación de alta precisión para acabados de efecto madera con máxima fidelidad visual y resistencia a la radiación UV.
                            </p>
                          </div>
                        </div>

                        {/* ANEXO: DOSSIER TÉCNICO DE OBRAS REALES */}
                        <div className="dossier-section page-break">
                          <h3 className="dossier-section-title">Anexo: Dossier Técnico de Obras Reales</h3>
                          <p style={{ fontSize: '0.85rem', marginBottom: '15px' }}>
                            Nuestros desarrollos técnicos de extrusión y acabados de aluminio dan soporte a obras singulares de gran repercusión:
                          </p>
                          <div className="dossier-project-grid">
                            <div className="dossier-project-card">
                              <div className="dossier-image-placeholder">
                                🏟️ Roig Arena
                                <span className="dossier-image-subtext">Valencia, España</span>
                              </div>
                              <div className="dossier-project-content">
                                <h4 className="dossier-project-name">1. Fachada Singulares: Roig Arena</h4>
                                <p className="dossier-project-desc">Participamos mediante el suministro de matrices y perfiles especiales para la envolvente de lamas de aluminio onduladas, resistente a altas cargas dinámicas de viento.</p>
                              </div>
                            </div>
                            <div className="dossier-project-card">
                              <div className="dossier-image-placeholder" style={{ background: 'linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)' }}>
                                🏛️ Mercado Municipal
                                <span className="dossier-image-subtext">Renovación de Espacio Público</span>
                              </div>
                              <div className="dossier-project-content">
                                <h4 className="dossier-project-name">2. Carpintería Interior y Lucernarios</h4>
                                <p className="dossier-project-desc">Renovación del Mercado Municipal. Instalación de lucernarios superiores y carpintería abatible Empresa de Aluminio para el aprovechamiento de luz natural y climatización pasiva.</p>
                              </div>
                            </div>
                            <div className="dossier-project-card">
                              <div className="dossier-image-placeholder" style={{ background: 'linear-gradient(135deg, #312e81 0%, #4f46e5 100%)' }}>
                                🏡 Viviendas Premium
                                <span className="dossier-image-subtext">Arquitectura Minimalista</span>
                              </div>
                              <div className="dossier-project-content">
                                <h4 className="dossier-project-name">3. Residencial de Alta Gama</h4>
                                <p className="dossier-project-desc">Cerramientos con sistemas de corredera minimalista RPT (serie GS-120RT) de Aluminios Innovations. Sección de cruce central de 25 mm y rodamientos reforzados.</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* CAPACIDAD FABRIL PROPIA */}
                        <div className="dossier-section page-break">
                          <h3 className="dossier-section-title">Capacidad Industrial e Infraestructura Propia</h3>
                          <p style={{ fontSize: '0.85rem', marginBottom: '15px' }}>
                            En Aluminios Innovations controlamos todo el ciclo productivo de forma autónoma en nuestras plantas fabriles:
                          </p>
                          <div className="dossier-fabril-grid">
                            <div className="dossier-fabril-card">
                              <span className="dossier-fabril-icon">🔬</span>
                              <div>
                                <h4 className="dossier-fabril-title">Ingeniería e I+D de Producto</h4>
                                <p className="dossier-fabril-desc">Diseño interno de matrices y perfiles personalizados bajo plano exclusivo para nuestros partners.</p>
                              </div>
                            </div>
                            <div className="dossier-fabril-card">
                              <span className="dossier-fabril-icon">🏭</span>
                              <div>
                                <h4 className="dossier-fabril-title">Dos Prensas de Extrusión</h4>
                                <p className="dossier-fabril-desc">Maquinaria de extrusión de alta potencia para geometrías complejas de la serie 6000.</p>
                              </div>
                            </div>
                            <div className="dossier-fabril-card">
                              <span className="dossier-fabril-icon">⚙️</span>
                              <div>
                                <h4 className="dossier-fabril-title">Ensamblaje RPT Integrado</h4>
                                <p className="dossier-fabril-desc">Línea automatizada para inserción de varillas de poliamida reforzada en los perfiles.</p>
                              </div>
                            </div>
                            <div className="dossier-fabril-card">
                              <span className="dossier-fabril-icon">🎨</span>
                              <div>
                                <h4 className="dossier-fabril-title">Planta de Lacado Vertical</h4>
                                <p className="dossier-fabril-desc">Línea robotizada para acabados uniformes certificados (Qualicoat Seaside).</p>
                              </div>
                            </div>
                            <div className="dossier-fabril-card">
                              <span className="dossier-fabril-icon">🪵</span>
                              <div>
                                <h4 className="dossier-fabril-title">Planta de Sublimación Madera</h4>
                                <p className="dossier-fabril-desc">Decoración efecto madera con extraordinario realismo y máxima resistencia exterior (Qualideco).</p>
                              </div>
                            </div>
                            <div className="dossier-fabril-card">
                              <span className="dossier-fabril-icon">🛡️</span>
                              <div>
                                <h4 className="dossier-fabril-title">Anodizado del Aluminio</h4>
                                <p className="dossier-fabril-desc">Endurecimiento superficial electroquímico para protección costera y salina (Qualanod).</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* RESUMEN TÉCNICO DE SISTEMAS SOPENA */}
                        <div className="dossier-section page-break">
                          <h3 className="dossier-section-title">Resumen de Especificaciones de Carpintería</h3>
                          <p style={{ fontSize: '0.85rem', marginBottom: '15px' }}>
                            Especificaciones de las series del catálogo arquitectónico ensayadas en laboratorios acreditados (con marcado CE):
                          </p>
                          <div className="dossier-tech-grid">
                            <div className="dossier-tech-card">
                              <div className="dossier-tech-header">
                                <span className="dossier-tech-name">Serie GS-88 RT</span>
                                <span className="dossier-tech-badge">Premium Abisagrada</span>
                              </div>
                              <div className="dossier-tech-specs">
                                <div className="dossier-tech-spec-item">Transmitancia: <strong>Uw &lt; 0.8 W/m²K</strong></div>
                                <div className="dossier-tech-spec-item">Ensayos AEV: <strong>Clase 4 / E1500 / C5</strong></div>
                              </div>
                              <p className="dossier-tech-desc">Sistema abisagrada practicable y oscilobatiente de máximas prestaciones con marco de 80 u 88 mm, ideal para triple vidrio y opción de hoja oculta.</p>
                            </div>

                            <div className="dossier-tech-card">
                              <div className="dossier-tech-header">
                                <span className="dossier-tech-name">Serie GS-73 RT</span>
                                <span className="dossier-tech-badge">Estándar Abisagrada</span>
                              </div>
                              <div className="dossier-tech-specs">
                                <div className="dossier-tech-spec-item">Transmitancia: <strong>Uf = 1.6 W/m²K</strong></div>
                                <div className="dossier-tech-spec-item">Ensayos AEV: <strong>Clase 4 / 9A / C5</strong></div>
                              </div>
                              <p className="dossier-tech-desc">Carpintería practicable y oscilobatiente versátil con rotura de puente térmico y marco de 65 o 73 mm. Excelente relación calidad/coste para edificación colectiva.</p>
                            </div>

                            <div className="dossier-tech-card">
                              <div className="dossier-tech-header">
                                <span className="dossier-tech-name">Serie GS-120 RT</span>
                                <span className="dossier-tech-badge">Minimalista Corredera</span>
                              </div>
                              <div className="dossier-tech-specs">
                                <div className="dossier-tech-spec-item">Sección Cruce: <strong>25 mm visual</strong></div>
                                <div className="dossier-tech-spec-item">Carga de Hoja: <strong>Hasta 400 kg (Elevable)</strong></div>
                              </div>
                              <p className="dossier-tech-desc">Corredera elevable perimetral para grandes dimensiones de acristalamiento. Nudo central minimalista y rodadura reforzada para deslizamiento suave.</p>
                            </div>

                            <div className="dossier-tech-card">
                              <div className="dossier-tech-header">
                                <span className="dossier-tech-name">Serie GS-82 RT</span>
                                <span className="dossier-tech-badge">Estándar Corredera</span>
                              </div>
                              <div className="dossier-tech-specs">
                                <div className="dossier-tech-spec-item">Espesor Marco: <strong>82 mm</strong></div>
                                <div className="dossier-tech-spec-item">Ensayos AEV: <strong>Clase 3 / 7A / C3</strong></div>
                              </div>
                              <p className="dossier-tech-desc">Corredera perimetral clásica con rotura de puente térmico. Apta para hojas de peso medio de hasta 200 kg. Óptima para reposición y reformas rápidas.</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    {(includeArchitectureLink || includeIndustrialLink) && (
                      <div style={{marginTop: '30px', borderLeft: '4px solid #10b981', background: '#ecfdf5', padding: '20px', borderRadius: '0 8px 8px 0'}}>
                        <h4 style={{marginTop: 0, color: '#047857', fontSize: '1.2rem', marginBottom: '15px'}}>{isPt ? 'Documentação Técnica Anexa:' : 'Documentación Técnica Adjunta:'}</h4>
                        <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
                          {includeArchitectureLink && (
                            <a href="https://www.empresa-aluminio.com/architectural.php?lang=es" target="_blank" rel="noopener noreferrer" style={{display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', color: 'var(--sopena-blue-dark)', background: 'white', padding: '12px 15px', borderRadius: '6px', border: '1px solid #a7f3d0', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', fontWeight: 'bold'}}>
                              <span style={{fontSize: '1.5rem'}}>🏛️</span> {isPt ? 'Catálogo de Sistemas de Arquitetura' : 'Catálogo de Sistemas de Arquitectura'} <span style={{color: '#10b981', marginLeft: 'auto'}}>{isPt ? 'Ver online \u2192' : 'Ver online \u2192'}</span>
                            </a>
                          )}
                          {includeIndustrialLink && (
                            <a href="https://www.empresa-aluminio.com/series.php?lang=es&cat=1&id=54" target="_blank" rel="noopener noreferrer" style={{display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', color: 'var(--sopena-blue-dark)', background: 'white', padding: '12px 15px', borderRadius: '6px', border: '1px solid #a7f3d0', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', fontWeight: 'bold'}}>
                              <span style={{fontSize: '1.5rem'}}>🏭</span> {isPt ? 'Catálogo de Perfis Industriais' : 'Catálogo de Perfiles Industriales'} <span style={{color: '#10b981', marginLeft: 'auto'}}>{isPt ? 'Ver online \u2192' : 'Ver online \u2192'}</span>
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                    <div style={{marginTop: '40px', paddingTop: '30px', borderTop: '2px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end'}}>
                      <div style={{lineHeight: '1.6', color: '#334155'}}>
                        <p style={{margin: '0 0 15px 0'}}>{isPt ? 'Com os melhores cumprimentos,' : 'Atentamente,'}</p>
                        <p style={{margin: 0, fontWeight: 'bold', fontSize: '1.1rem', color: 'var(--sopena-blue-dark)'}}>Carmen Castro</p>
                        <p style={{margin: 0, fontSize: '0.9rem'}}>PROJECT MANAGER - GRUPO SOPENA - ZONA NOROESTE DE ESPAÑA Y PORTUGAL</p>
                        <p style={{margin: '5px 0 0 0', fontSize: '0.9rem', color: 'var(--text-secondary)'}}>
                          📞 +34 610 240 017 | ✉️ <a href="mailto:ccastro@empresa-aluminio.com" style={{color: 'var(--sopena-blue)', textDecoration: 'none'}}>ccastro@empresa-aluminio.com</a>
                        </p>
                        <div className="no-print" style={{marginTop: '10px', display: 'flex', gap: '10px', flexWrap: 'wrap'}}>
                          <a href="https://wa.me/34610240017?text=Hola%20Carmen,%20me%20gustar%C3%ADa%20hacer%20una%20consulta" target="_blank" rel="noopener noreferrer" style={{display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#25D366', color: 'white', padding: '6px 12px', borderRadius: '4px', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 'bold'}}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                            Contactar por WhatsApp
                          </a>
                          <a href="https://www.instagram.com/gruposopena/" target="_blank" rel="noopener noreferrer" style={{display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)', color: 'white', padding: '6px 12px', borderRadius: '4px', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 'bold'}}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                            Instagram
                          </a>
                        </div>
                      </div>
                      {presentationTarget && presentationTarget.purchasingLinkedin && (
                        <div className="no-print">
                            <a href={presentationTarget.purchasingLinkedin} target="_blank" rel="noopener noreferrer" style={{background: '#0077b5', color: 'white', padding: '8px 15px', borderRadius: '4px', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 'bold', display: 'inline-block'}}>
                                Conectar en LinkedIn
                            </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          {/* TASKS TAB */}
          {activeTab === 'tasks' && (
            <div className="tasks-container" style={{padding: '20px', background: 'white', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)'}}>
              <h2 style={{color: 'var(--sopena-blue-dark)', marginBottom: '20px'}}>Todas las tareas pendientes</h2>
              <div style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
                {prospects.flatMap(p => (p.tasks || []).map(t => ({...t, prospectName: p.name, prospectId: p.id})))
                  .filter(t => !t.completed)
                  .sort((a, b) => new Date(b.date) - new Date(a.date))
                  .map(task => (
                    <div key={task.id} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', background: '#f8fafc', borderRadius: '8px', borderLeft: '4px solid var(--sopena-blue)'}}>
                      <div>
                        <strong style={{display: 'block', fontSize: '1.1rem', color: '#1e293b'}}>{task.text}</strong>
                        <span style={{fontSize: '0.9rem', color: '#64748b'}}>Empresa: {task.prospectName} - Creada: {new Date(task.date).toLocaleDateString()}</span>
                      </div>
                      <button className="action-btn" onClick={() => handleToggleTask(task.prospectId, task.id)} style={{background: '#10b981', border: 'none'}}>
                        ✔ Completar
                      </button>
                    </div>
                ))}
                {prospects.flatMap(p => (p.tasks || []).filter(t => !t.completed)).length === 0 && (
                  <p style={{textAlign: 'center', color: '#64748b', padding: '40px', fontSize: '1.1rem'}}>No hay tareas pendientes en este momento. ¡Todo al día! 🎉</p>
                )}
              </div>
            </div>
          )}
          {/* PIPELINE TAB */}
          {activeTab === 'pipeline' && (
            <div style={{display: 'flex', flexDirection: 'column', height: '100%'}}>
              <div className="filter-bar" style={{marginBottom: '20px'}}>
                <div className="filter-group">
                  <label>Zona</label>
                  <select value={filterZone} onChange={e => setFilterZone(e.target.value)}>
                    <option value="">Todas las zonas</option>
                    <option value="Portugal">Portugal</option>
                    <option value="Pais Vasco">País Vasco</option>
                    <option value="Castilla y Leon">Castilla y León</option>
                    <option value="Cantabria">Cantabria</option>
                    <option value="Galicia">Galicia</option>
                    <option value="Asturias">Asturias</option>
                  </select>
                </div>
                <div className="filter-group">
                  <label>Sector</label>
                  <select value={filterSector} onChange={e => setFilterSector(e.target.value)}>
                    <option value="">Todos los sectores</option>
                    <option value="Cerramientos">Cerramientos</option>
                    <option value="Construccion Modular">Construcción Modular</option>
                    <option value="Frio Industrial">Frío Industrial</option>
                    <option value="Puertas y Ventanas">Puertas y Ventanas</option>
                    <option value="Plataformas">Plataformas</option>
                    <option value="Escaleras">Escaleras</option>
                    <option value="Estructuras Solares">Estructuras Solares</option>
                    <option value="Fachadas de Aluminio">Fachadas de Aluminio</option>
                    <option value="Fachadas Especiales">Fachadas Especiales</option>
                    <option value="Fabricantes de Escaleras de Aluminio">Fab. Escaleras</option>
                    <option value="Fabricantes de Estanterias de Aluminio">Fab. Estanterías</option>
                    <option value="Fabricantes de Carrocerias">Fab. Carrocerías</option>
                    <option value="Transformacion de Chapa">Transformación de Chapa</option>
                    <option value="Instalacion de Cubiertas">Instalación de Cubiertas</option>
                    <option value="Sistemas de Proteccion Solar">Sistemas de Protección Solar</option>
                    <option value="Metal Arquitectonico y Chapa Perforada">Metal Arquitectónico y Chapa Perforada</option>
                    <option value="Perfiles Estructurales Aluminio">Perfiles Estructurales Aluminio</option>
                    <option value="Piscinas Desmontables">Piscinas Desmontables</option>
                    <option value="Iluminacion Publica">Iluminación Pública</option>
                    <option value="Mesas de Invernadero">Mesas de Invernadero</option>
                    <option value="Divisiones de Oficina">Divisiones de Oficina</option>
                    <option value="Senalizacion">Señalización</option>
                    <option value="Camillas de Aluminio">Camillas de Aluminio</option>
                    <option value="Pistas de Padel">Pistas de Pádel</option>
                    <option value="Puertas Industriales">Puertas Industriales</option>
                    <option value="Puertas Frigorificas">Puertas Frigoríficas</option>
                    <option value="Mosquiteras">Mosquiteras</option>
                    <option value="PLV y Mobiliario Comercial">PLV y Mobiliario Comercial</option>
                    <option value="Proveedor de Aluminio">Proveedor de Aluminio</option>
                    <option value="Distribucion de Aluminio y Metales">Distribución de Aluminio y Metales</option>
                    <option value="Armarios de Aluminio">Armarios de Aluminio</option>
                  </select>
                </div>
                <div className="filter-group">
                  <label>Ordenar por</label>
                  <select value={pipelineSortOrder} onChange={e => setPipelineSortOrder(e.target.value)}>
                    <option value="alphabetical">Nombre (A-Z)</option>
                    <option value="alphabetical-desc">Nombre (Z-A)</option>
                    <option value="revenue-desc">Facturación (Desc.)</option>
                    <option value="revenue-asc">Facturación (Asc.)</option>
                  </select>
                </div>
              </div>
              <div className="pipeline-container" style={{display: 'flex', gap: '20px', overflowX: 'auto', paddingBottom: '20px', height: 'calc(100vh - 150px)'}}>
                {['Lead', 'Contactado', 'Propuesta', 'Cerrado Ganado', 'Cerrado Perdido'].map(stage => (
                  <div key={stage} style={{flex: '0 0 300px', background: '#f1f5f9', borderRadius: '12px', padding: '15px', display: 'flex', flexDirection: 'column'}}>
                    <h3 style={{margin: '0 0 15px 0', paddingBottom: '10px', borderBottom: '2px solid var(--sopena-blue)', color: 'var(--sopena-blue-dark)', display: 'flex', justifyContent: 'space-between'}}>
                       {stage} 
                       <span style={{background: 'var(--sopena-blue)', color: 'white', borderRadius: '50%', padding: '2px 8px', fontSize: '0.8rem'}}>{pipelineProspects.filter(p => (p.pipelineStage || (p.contacted ? 'Contactado' : 'Lead')) === stage).length}</span>
                    </h3>
                    <div style={{flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', paddingRight: '5px'}}>
                      {pipelineProspects.filter(p => (p.pipelineStage || (p.contacted ? 'Contactado' : 'Lead')) === stage).map(p => (
                        <div key={p.id} style={{background: 'white', padding: '15px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', borderLeft: `4px solid ${stage.includes('Ganado') ? '#10b981' : stage.includes('Perdido') ? '#ef4444' : 'var(--sopena-blue)'}`, position: 'relative'}}>
                          <button onClick={() => handleDeleteProspect(p.id)} style={{position: 'absolute', top: '10px', right: '10px', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1.2rem', padding: 0}} title="Borrar Empresa">🗑️</button>
                          <h4 style={{margin: '0 0 5px 0', color: '#1e293b', paddingRight: '20px'}}>{p.name}</h4>
                          <p style={{margin: '0 0 10px 0', fontSize: '0.85rem', color: '#64748b'}}>{p.sector} - {new Intl.NumberFormat('es-ES', {style: 'currency', currency: 'EUR'}).format(p.revenue)}</p>
                          <select 
                            value={p.pipelineStage || 'Lead'} 
                            onChange={(e) => handleUpdatePipelineStage(p.id, e.target.value)}
                            style={{width: '100%', padding: '5px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.8rem'}}
                          >
                            <option value="Lead">Lead</option>
                            <option value="Contactado">Contactado</option>
                            <option value="Propuesta">Propuesta</option>
                            <option value="Cerrado Ganado">Cerrado Ganado</option>
                            <option value="Cerrado Perdido">Cerrado Perdido</option>
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* AGENTFORCE TAB */}
          {activeTab === 'agentforce' && (
            <AgentforceAssistant 
              prospects={userProspects} 
              setProspects={setProspects} 
              userAllowedZones={userAllowedZones} 
              currentUser={currentUser} 
            />
          )}
          {/* INSTRUCTIONS TAB (GUÍA DE USUARIO) */}
          {activeTab === 'instructions' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '25px', fontFamily: 'Inter, sans-serif' }}>
              
              {/* Tarjeta de bienvenida de la guía */}
              <div className="card" style={{ background: 'linear-gradient(135deg, #072b66 0%, #1e1b4b 100%)', color: 'white', border: 'none', padding: '30px 40px' }}>
                <h2 style={{ margin: '0 0 10px 0', fontWeight: '800', fontSize: '1.8rem', color: '#34d399' }}>
                  Manual & Guía de Usuario del CRM
                </h2>
                <p style={{ margin: 0, fontSize: '0.95rem', color: '#94a3b8', lineHeight: '1.6' }}>
                  Bienvenido a la central de aprendizaje de Aluminios Innovations CRM. Aquí encontrarás toda la documentación detallada de las herramientas implementadas en el sistema para optimizar tu flujo de ventas en la zona Noroeste y Portugal.
                </p>
              </div>
              {/* Grid principal de la documentación */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '25px' }}>
                
                {/* Bloque 1: Gestión Comercial General */}
                <div className="card" style={{ border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <h3 style={{ margin: 0, color: 'var(--sopena-blue-dark)', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '2px solid #f1f5f9', paddingBottom: '10px' }}>
                    📦 Gestión Comercial y CRM
                  </h3>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.85rem', lineHeight: '1.5' }}>
                    <div>
                      <strong>1. Base de Datos & Filtros:</strong>
                      <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)' }}>
                        Visualiza de forma ordenada todos los prospectos comerciales de la empresa. Utiliza el buscador general en tiempo real o filtra directamente por zona comercial (Portugal, País Vasco, Galicia, Asturias, Cantabria o Castilla y León).
                      </p>
                    </div>
                    <div>
                      <strong>2. Mapa Interactivo:</strong>
                      <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)' }}>
                        Representación geográfica de todos los prospectos del CRM mediante mapas de calor y marcadores interactivos (React Leaflet).
                      </p>
                    </div>
                    <div>
                      <strong>3. Planificador de Rutas Inteligente:</strong>
                      <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)' }}>
                        Calcula la ruta más corta y optimizada de visitas a clientes en base a la distancia en kilómetros (algoritmo Haversine), ahorrando tiempo y costes de combustible.
                      </p>
                    </div>
                    <div>
                      <strong>4. Pipeline de Ventas (Kanban):</strong>
                      <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)' }}>
                        Organiza el estado de tus prospectos arrastrándolos visualmente entre columnas (*Lead, Contactado, Propuesta, Cerrado Ganado y Cerrado Perdido*). Al transicionar una tarjeta de la etapa <strong>Lead</strong> a <strong>Propuesta</strong>, el sistema generará de manera autónoma una tarea de llamada de seguimiento programada para dentro de 3 días y la registrará en el historial de la empresa.
                      </p>
                    </div>
                    <div>
                      <strong>5. Copia de Seguridad Protegida:</strong>
                      <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)' }}>
                        Permite descargar toda la base de datos CRM del sistema en formato Excel (CSV) compatible. Como medida de seguridad obligatoria, requiere ingresar la clave de administrador para autorizar la exportación.
                      </p>
                    </div>
                  </div>
                </div>
                {/* Bloque 2: Inteligencia Artificial (Agentforce) */}
                <div className="card" style={{ border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <h3 style={{ margin: 0, color: 'var(--sopena-blue-dark)', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '2px solid #f1f5f9', paddingBottom: '10px' }}>
                    🤖 Inteligencia Artificial Agentforce
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.85rem', lineHeight: '1.5' }}>
                    <div>
                      <strong>1. Asistente Comercial Chatbot:</strong>
                      <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)' }}>
                        Chatea con la IA en lenguaje natural. Puedes hacer consultas predictivas de facturación, listar tareas comerciales pendientes, o filtrar rápidamente por zona de venta activa en la cabecera.
                      </p>
                    </div>
                    <div>
                      <strong>2. Resúmenes Inteligentes de CRM:</strong>
                      <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)' }}>
                        Accede a fichas unificadas y a una síntesis ejecutiva autogenerada por IA que resume la historia de interacción de cada cliente y su volumen potencial.
                      </p>
                    </div>
                    <div>
                      <strong>3. Preparador de Reuniones y Llamadas:</strong>
                      <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)' }}>
                        Genera dinámicamente el pitch idóneo de venta adaptado al sector del cliente, un listado de preguntas para calificar, objeciones comunes y enlaces de catálogos Empresa de Aluminio recomendados.
                      </p>
                    </div>
                    <div>
                      <strong>4. Redactor Inteligente de Propuestas:</strong>
                      <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)' }}>
                        Crea emails comerciales bilingües. Solicita cambios al chatbot en directo (ej: *"traduce al inglés"*, *"hazlo más corto"*, *"añade garantía"*) y el borrador se actualizará instantáneamente.
                      </p>
                    </div>
                    <div>
                      <strong>5. Agentforce Lead Finder (Prospección):</strong>
                      <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)' }}>
                        Buscador autónomo de empresas que valida datos de Informa D&B y excluye de forma automática a los competidores extrusores de la **AEA** (Asociación Española del Aluminio).
                      </p>
                    </div>
                  </div>
                </div>
                {/* Bloque 3: Operativa Avanzada y PWA */}
                <div className="card" style={{ border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <h3 style={{ margin: 0, color: 'var(--sopena-blue-dark)', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '2px solid #f1f5f9', paddingBottom: '10px' }}>
                    🎙️ Operativa Avanzada y Soporte PWA
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.85rem', lineHeight: '1.5' }}>
                    <div>
                      <strong>1. Dictado por Voz (Speech-to-Text):</strong>
                      <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)' }}>
                        Evita tener que escribir las minutas de visitas. Utiliza los botones de micrófono del formulario de seguimiento de clientes en el CRM para rellenar los datos de interacción mediante la voz.
                      </p>
                    </div>
                    <div>
                      <strong>2. Soporte Offline (Sin Conexión):</strong>
                      <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)' }}>
                        Gracias a la implementación del Service Worker (`sw.js`), puedes consultar la base de datos de tus prospectos e interactuar con los layouts principales de la app en zonas rurales o de carretera sin cobertura de internet.
                      </p>
                    </div>
                    <div>
                      <strong>3. Instalabilidad en Dispositivos (PWA):</strong>
                      <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)' }}>
                        Al abrir la aplicación en tu navegador (móvil u ordenador), verás un icono de instalación en la barra de direcciones. Instálala como una aplicación nativa para acceder directamente desde tu pantalla de inicio.
                      </p>
                    </div>
                    <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '12px', borderRadius: '8px', marginTop: '10px' }}>
                      <span style={{ fontSize: '0.8rem', color: '#065f46', fontWeight: 'bold' }}>💡 Consejo Comercial:</span>
                      <p style={{ margin: '4px 0 0 0', fontSize: '0.75rem', color: '#047857' }}>
                        Utiliza el dictado por voz cuando estés de camino en tu ruta programada para actualizar de inmediato las notas en el CRM sin perder tiempo.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Bloque 4: Codificación de Colores y Calidad de Email */}
                <div className="card" style={{ border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <h3 style={{ margin: 0, color: 'var(--sopena-blue-dark)', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '2px solid #f1f5f9', paddingBottom: '10px' }}>
                    🛡️ Calidad de Datos & Estado de Emails
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.85rem', lineHeight: '1.5' }}>
                    <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                      El sistema audita automáticamente el estado y la calidad de las direcciones de correo electrónico del CRM, clasificándolas con colores para evitar rebotes y garantizar una comunicación efectiva:
                    </p>
                    <div>
                      <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '12px', background: '#d1fae5', color: '#065f46', fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '4px' }}>
                        ✅ Verde (Compras Verificado)
                      </span>
                      <p style={{ margin: 0, color: 'var(--text-secondary)', paddingLeft: '8px' }}>
                        Buzones específicos del departamento de compras o cuentas validadas de directores comerciales (ej: <code>talleresmarpe7@gmail.com</code>). Son 100% seguros de usar.
                      </p>
                    </div>
                    <div>
                      <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '12px', background: 'rgba(7, 43, 102, 0.1)', color: 'var(--sopena-blue)', fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '4px' }}>
                        ✉️ Azul (Genérico Corporativo)
                      </span>
                      <p style={{ margin: 0, color: 'var(--text-secondary)', paddingLeft: '8px' }}>
                        Correos genéricos reales como <code>info@</code>, <code>contacto@</code> o <code>geral@</code>. Son reales y verificados, aunque no son cuentas directas de compras.
                      </p>
                    </div>
                    <div>
                      <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '12px', background: '#fee2e2', color: '#991b1b', fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '4px' }}>
                        ⚠️ Rojo (Autogenerado / Placeholder)
                      </span>
                      <p style={{ margin: 0, color: 'var(--text-secondary)', paddingLeft: '8px' }}>
                        Correos creados automáticamente con el formato <code>compras@dominio</code>. El sistema advierte de que podrían ser inexistentes y recomienda escanearlos.
                      </p>
                    </div>
                    <div>
                      <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '12px', background: '#fef3c7', color: '#92400e', fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '4px' }}>
                        ⚠️ Naranja (Sin email / Inválido)
                      </span>
                      <p style={{ margin: 0, color: 'var(--text-secondary)', paddingLeft: '8px' }}>
                        Indica que no hay ningún correo de contacto registrado o que el formato es incorrecto. Requiere atención comercial inmediata.
                      </p>
                    </div>
                    <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: '10px' }}>
                      <strong>Uso del Asistente 🧙‍♂️:</strong> Haz clic en el icono del mago 🧙‍♂️ al lado del email en la tabla o en el modal para iniciar un escaneo OSINT en tiempo real y corregir el correo.
                    </div>
                  </div>
                </div>

              </div>
              {/* Sección de pantallas de ejemplo interactivas */}
              <div className="card" style={{ border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <h3 style={{ margin: 0, color: 'var(--sopena-blue-dark)', fontSize: '1.3rem', borderBottom: '2px solid #f1f5f9', paddingBottom: '10px' }}>
                  📸 Ejemplos Visuales de Pantallas Clave
                </h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                  
                  {/* Mockup de la terminal de prospección */}
                  <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', overflow: 'hidden' }}>
                    <div style={{ background: '#0f172a', padding: '8px 12px', color: '#38bdf8', fontSize: '0.75rem', fontFamily: 'monospace', fontWeight: 'bold' }}>
                      PANTALLA: Agentforce Lead Finder
                    </div>
                    <div style={{ background: '#1e293b', padding: '15px', color: 'white', fontFamily: 'monospace', fontSize: '0.7rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div>⚡ Iniciando búsqueda inteligente...</div>
                      <div style={{ color: '#f59e0b' }}>⚠️ Detectada coincidencia comercial: "Cortizo España"</div>
                      <div style={{ color: '#f87171' }}>❌ EXCLUSIÓN AEA: Empresa descartada automáticamente (Extrusores AEA)</div>
                      <div style={{ color: '#4ade80' }}>✅ VALIDADO: "Metalusa S.A." | Importada al CRM con éxito</div>
                    </div>
                  </div>
                  {/* Mockup de la preparación IA */}
                  <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', overflow: 'hidden' }}>
                    <div style={{ background: '#1e1b4b', padding: '8px 12px', color: '#a78bfa', fontSize: '0.75rem', fontWeight: 'bold' }}>
                      PANTALLA: Preparación de Reuniones
                    </div>
                    <div style={{ background: '#f5f3ff', padding: '15px', fontSize: '0.75rem', color: '#4c1d95', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <strong>Pitch:</strong> "Presentar capacidad de extrusión flexible Empresa de Aluminio..."
                      <strong>Preguntas:</strong> "¿Qué aleaciones de aluminio utilizan actualmente?"
                      <strong>Objeción:</strong> "Lacado costero" → "Argumentar sello Qualicoat Seaside (10 años garantía)"
                    </div>
                  </div>
                  {/* Mockup del Dictado por voz */}
                  <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', overflow: 'hidden' }}>
                    <div style={{ background: '#0f172a', padding: '8px 12px', color: '#34d399', fontSize: '0.75rem', fontWeight: 'bold' }}>
                      PANTALLA: Dictado de Minutas
                    </div>
                    <div style={{ background: '#fafafa', padding: '15px', fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ef4444', display: 'inline-block', animation: 'dotPulse 1.2s infinite' }}></span>
                        <span style={{ color: '#ef4444', fontWeight: 'bold' }}>DICTANDO VOZ EN CURSO...</span>
                      </div>
                      <div style={{ fontStyle: 'italic', color: '#475569', borderLeft: '3px solid #10b981', paddingLeft: '8px' }}>
                        "El cliente está muy interesado en las lamas con rotura de puente térmico..."
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      {/* CRM MODAL */}
      {selectedProspect && (
        <div className="modal-overlay" onClick={() => setSelectedProspect(null)}>
          <div className="modal crm-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '1000px', width: '95%', maxHeight: '95vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-color)', paddingBottom: '15px', marginBottom: '15px' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.6rem', color: 'var(--sopena-blue-dark)' }}>{selectedProspect.name}</h2>
                <span className="prospect-header-badge" style={{ background: selectedProspect.contacted ? 'rgba(34, 197, 94, 0.15)' : 'rgba(245, 158, 11, 0.15)', color: selectedProspect.contacted ? 'var(--success)' : 'var(--warning)' }}>
                  {selectedProspect.contacted ? '🟢 Contactado' : '🟡 Pendiente'}
                </span>
                <span style={{ marginLeft: '10px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>ID: {selectedProspect.id} | {selectedProspect.zone}</span>
                {/* Aviso si la empresa fue borrada y luego reincorporada */}
                {selectedProspect.wasDeleted && (
                  <div style={{
                    marginTop: '8px',
                    padding: '6px 12px',
                    background: 'rgba(245, 158, 11, 0.1)',
                    border: '1px solid rgba(245, 158, 11, 0.4)',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    color: '#92400e',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <span>&#9888;&#65039;</span>
                    <span>
                      <strong>Empresa reincorporada.</strong>{' '}
                      {selectedProspect.previouslyDeletedAt
                        ? `Fue borrada de la base de datos el ${new Date(selectedProspect.previouslyDeletedAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}.`
                        : 'Previamente eliminada de la base de datos.'}
                    </span>
                  </div>
                )}
              </div>
              <button onClick={() => setSelectedProspect(null)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-secondary)' }}>&times;</button>
            </div>
            {/* TAB SELECTOR */}
            <div className="modal-tabs">
              <button type="button" className={`modal-tab ${activeModalTab === 'contacto' ? 'active' : ''}`} onClick={() => setActiveModalTab('contacto')}>
                📞 Contacto
              </button>
              <button type="button" className={`modal-tab ${activeModalTab === 'seguimiento' ? 'active' : ''}`} onClick={() => setActiveModalTab('seguimiento')}>
                📈 Seguimiento
              </button>
              <button type="button" className={`modal-tab ${activeModalTab === 'tecnico' ? 'active' : ''}`} onClick={() => setActiveModalTab('tecnico')}>
                ⚙️ Ficha & Ofertas
              </button>
              <button type="button" className={`modal-tab ${activeModalTab === 'tareas' ? 'active' : ''}`} onClick={() => setActiveModalTab('tareas')}>
                📋 Actividad & Tareas
              </button>
            </div>
            <form onSubmit={e => {
              e.preventDefault();
              const formData = new FormData(e.target);
              handleSaveCrm(selectedProspect.id, {
                contacted: formData.get('contacted') === 'true',
                contactDate: formData.get('contactDate'),
                notes: formData.get('notes'),
                response: formData.get('response'),
                quality: formData.get('quality'),
                logistics: formData.get('logistics'),
                packaging: formData.get('packaging'),
                purchasingManager: formData.get('purchasingManager'),
                purchasingPhone: formData.get('purchasingPhone'),
                purchasingLinkedin: formData.get('purchasingLinkedin'),
                email: formData.get('email'),
                sector: formData.get('sector'),
                causaNoAceptacion: formData.get('causaNoAceptacion'),
                lastContactDates: formData.getAll('lastContactDates'),
                offerDates: formData.getAll('offerDates')
              });
            }} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflowY: 'auto' }}>
              
              <div className="tab-content" style={{ flex: 1, marginBottom: '20px' }}>
                
                {/* TAB 1: CONTACTO */}
                {activeModalTab === 'contacto' && (
                  <div className="modal-grid-2">
                    <div className="form-group">
                      <label>Persona de Contacto (Compras)</label>
                      <input type="text" name="purchasingManager" defaultValue={selectedProspect.purchasingManager || ''} required />
                    </div>
                     <div className="form-group">
                      <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>Email Corporativo</span>
                        <button
                          type="button"
                          onClick={() => startSingleEmailScan(selectedProspect)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--sopena-accent)',
                            fontSize: '0.75rem',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '3px',
                            padding: '0'
                          }}
                          title="Buscar y verificar email con Agentforce IA"
                        >
                          🧙‍♂️ Buscar con IA
                        </button>
                      </label>
                      <input 
                        type="email" 
                        id="modalProspectEmailInput" 
                        name="email" 
                        defaultValue={selectedProspect.email || ''} 
                        required 
                      />
                    </div>
                    <div className="form-group">
                      <label>Teléfono Directo</label>
                      <input type="text" name="purchasingPhone" defaultValue={selectedProspect.purchasingPhone || ''} />
                    </div>
                    <div className="form-group">
                      <label>LinkedIn del Contacto</label>
                      <input type="text" name="purchasingLinkedin" defaultValue={selectedProspect.purchasingLinkedin || ''} placeholder="https://linkedin.com/in/..." />
                    </div>
                    <div className="form-group">
                      <label>Sector de Actividad</label>
                      <select name="sector" defaultValue={selectedProspect.sector || ''} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'white' }} required>
                        <option value="Cerramientos">Cerramientos</option>
                        <option value="Construccion Modular">Construcción Modular</option>
                        <option value="Frio Industrial">Frío Industrial</option>
                        <option value="Puertas y Ventanas">Puertas y Ventanas</option>
                        <option value="Plataformas">Plataformas</option>
                        <option value="Escaleras">Escaleras</option>
                        <option value="Estructuras Solares">Estructuras Solares</option>
                        <option value="Fachadas de Aluminio">Fachadas de Aluminio</option>
                        <option value="Fachadas Especiales">Fachadas Especiales</option>
                        <option value="Fabricantes de Escaleras de Aluminio">Fabricantes de Escaleras de Aluminio</option>
                        <option value="Fabricantes de Estanterias de Aluminio">Fabricantes de Estanterías de Aluminio</option>
                        <option value="Fabricantes de Carrocerias">Fabricantes de Carrocerías</option>
                        <option value="Transformacion de Chapa">Transformación de Chapa</option>
                        <option value="Instalacion de Cubiertas">Instalación de Cubiertas</option>
                        <option value="Sistemas de Proteccion Solar">Sistemas de Protección Solar</option>
                        <option value="Metal Arquitectonico y Chapa Perforada">Metal Arquitectónico y Chapa Perforada</option>
                        <option value="Perfiles Estructurales Aluminio">Perfiles Estructurales Aluminio</option>
                        <option value="PLV y Mobiliario Comercial">PLV y Mobiliario Comercial</option>
                    <option value="Proveedor de Aluminio">Proveedor de Aluminio</option>
                    <option value="Distribucion de Aluminio y Metales">Distribución de Aluminio y Metales</option>
                    <option value="Armarios de Aluminio">Armarios de Aluminio</option>
                        <option value="Pistas de Padel">Pistas de Pádel</option>
                        <option value="Puertas Industriales">Puertas Industriales</option>
                        <option value="Puertas Frigorificas">Puertas Frigoríficas</option>
                        <option value="Mosquiteras">Mosquiteras</option>
                      </select>
                    </div>
                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                      <label>Sitio Web</label>
                      <input type="text" value={selectedProspect.web} readOnly style={{ background: '#f1f5f9', cursor: 'not-allowed' }} />
                    </div>
                  </div>
                )}
                {/* TAB 2: SEGUIMIENTO */}
                {activeModalTab === 'seguimiento' && (
                  <div>
                    <div className="modal-grid-2" style={{ marginBottom: '15px' }}>
                      <div className="form-group">
                        <label>Estado de Contacto</label>
                        <select name="contacted" defaultValue={selectedProspect.contacted ? 'true' : 'false'}>
                          <option value="false">Pendiente</option>
                          <option value="true">Contactado</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Fecha de Contacto</label>
                        <input type="date" name="contactDate" defaultValue={selectedProspect.contactDate || ''} />
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Respuesta / Estado Comercial</label>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <input type="text" id="crmResponseInput" name="response" defaultValue={selectedProspect.response || ''} placeholder="Ej: Interesado, Enviar catálogo de perfiles comerciales..." style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)' }} />
                        <button 
                          type="button" 
                          onClick={() => toggleSpeechRecognition('crmResponseInput', selectedProspect.zone === 'Portugal' ? 'pt-PT' : 'es-ES')}
                          className={`action-btn outline ${activeSpeechInput === 'crmResponseInput' ? 'recording-pulse' : ''}`}
                          style={{ 
                            padding: '10px', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            borderColor: activeSpeechInput === 'crmResponseInput' ? '#ef4444' : 'var(--border-color)',
                            color: activeSpeechInput === 'crmResponseInput' ? '#ef4444' : 'var(--text-secondary)'
                          }}
                          title="Dictar respuesta por voz"
                        >
                          {activeSpeechInput === 'crmResponseInput' ? <MicOff size={18} /> : <Mic size={18} />}
                        </button>
                      </div>
                    </div>
                    <div className="form-group" style={{ marginTop: '15px' }}>
                      <label>Causa No Aceptación (si aplica)</label>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <input type="text" id="crmCausaInput" name="causaNoAceptacion" defaultValue={selectedProspect.causaNoAceptacion || ''} placeholder="Ej: Precios altos, plazos de entrega, exige tocho reciclado..." style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)' }} />
                        <button 
                          type="button" 
                          onClick={() => toggleSpeechRecognition('crmCausaInput', selectedProspect.zone === 'Portugal' ? 'pt-PT' : 'es-ES')}
                          className={`action-btn outline ${activeSpeechInput === 'crmCausaInput' ? 'recording-pulse' : ''}`}
                          style={{ 
                            padding: '10px', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            borderColor: activeSpeechInput === 'crmCausaInput' ? '#ef4444' : 'var(--border-color)',
                            color: activeSpeechInput === 'crmCausaInput' ? '#ef4444' : 'var(--text-secondary)'
                          }}
                          title="Dictar causa por voz"
                        >
                          {activeSpeechInput === 'crmCausaInput' ? <MicOff size={18} /> : <Mic size={18} />}
                        </button>
                      </div>
                    </div>
                    <div className="form-group" style={{ marginTop: '15px' }}>
                      <label>Comentarios / Notas Generales</label>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                        <textarea id="crmNotesInput" name="notes" rows="4" defaultValue={selectedProspect.notes || ''} placeholder="Detalles de la última conversación, necesidades detectadas..." style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)', resize: 'vertical' }}></textarea>
                        <button 
                          type="button" 
                          onClick={() => toggleSpeechRecognition('crmNotesInput', selectedProspect.zone === 'Portugal' ? 'pt-PT' : 'es-ES')}
                          className={`action-btn outline ${activeSpeechInput === 'crmNotesInput' ? 'recording-pulse' : ''}`}
                          style={{ 
                            padding: '10px', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            borderColor: activeSpeechInput === 'crmNotesInput' ? '#ef4444' : 'var(--border-color)',
                            color: activeSpeechInput === 'crmNotesInput' ? '#ef4444' : 'var(--text-secondary)',
                            marginTop: '2px'
                          }}
                          title="Dictar comentarios por voz"
                        >
                          {activeSpeechInput === 'crmNotesInput' ? <MicOff size={18} /> : <Mic size={18} />}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                {/* TAB 3: FICHA TECNICA & OFERTAS */}
                {activeModalTab === 'tecnico' && (
                  <div>
                    <h3 style={{ marginTop: 0, fontSize: '1.1rem', color: 'var(--sopena-blue)' }}>Requisitos Técnicos</h3>
                    <div className="modal-grid-3" style={{ marginBottom: '20px' }}>
                      <div className="form-group">
                        <label>Calidad</label>
                        <input type="text" name="quality" defaultValue={selectedProspect.quality || ''} placeholder="Certificaciones, tolerancias..." />
                      </div>
                      <div className="form-group">
                        <label>Logística</label>
                        <input type="text" name="logistics" defaultValue={selectedProspect.logistics || ''} placeholder="Entrega, transporte..." />
                      </div>
                      <div className="form-group">
                        <label>Embalaje</label>
                        <input type="text" name="packaging" defaultValue={selectedProspect.packaging || ''} placeholder="Palets, protecciones..." />
                      </div>
                    </div>
                    <h3 style={{ fontSize: '1.1rem', color: 'var(--sopena-blue)', marginBottom: '10px' }}>Seguimiento de Ofertas & Contactos</h3>
                    <div className="form-group">
                       <label style={{ display: 'block', marginBottom: '8px' }}>Últimas 4 Fechas de Contacto Comercial</label>
                       <div className="modal-grid-4">
                         <input type="date" name="lastContactDates" defaultValue={selectedProspect.lastContactDates?.[0] || ''} />
                         <input type="date" name="lastContactDates" defaultValue={selectedProspect.lastContactDates?.[1] || ''} />
                         <input type="date" name="lastContactDates" defaultValue={selectedProspect.lastContactDates?.[2] || ''} />
                         <input type="date" name="lastContactDates" defaultValue={selectedProspect.lastContactDates?.[3] || ''} />
                       </div>
                    </div>
                    <div className="form-group" style={{ marginTop: '15px' }}>
                       <label style={{ display: 'block', marginBottom: '8px' }}>Las 4 Últimas Ofertas (Productos Ofertados)</label>
                       <div className="modal-grid-4">
                         {[0, 1, 2, 3].map(index => (
                           <select key={index} name="offerDates" defaultValue={selectedProspect.offerDates?.[index] || ''}>
                             <option value="">Ninguna</option>
                             <option value="Perfiles">Perfiles</option>
                             <option value="Lamas">Lamas</option>
                             <option value="Rotura Puente Termico">Rotura Puente Térmico</option>
                             <option value="Accesorios">Accesorios</option>
                             <option value="Paneles Composite">Paneles Composite</option>
                             <option value="Perfiles Ranurados">Perfiles Ranurados</option>
                             <option value="Chapas de Aluminio">Chapas de Aluminio</option>
                           </select>
                         ))}
                       </div>
                    </div>
                  </div>
                )}
                {/* TAB 4: TAREAS & HISTORIAL */}
                {activeModalTab === 'tareas' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* Sección de Tareas */}
                    <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '20px' }}>
                      <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>Tareas Pendientes</label>
                      <div style={{ display: 'flex', gap: '10px', marginBottom: '12px', alignItems: 'center' }}>
                        <input type="text" id="newTaskInput" placeholder="Ej: Enviar nuevo presupuesto..." style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)' }} />
                        <button 
                          type="button" 
                          onClick={() => toggleSpeechRecognition('newTaskInput', selectedProspect.zone === 'Portugal' ? 'pt-PT' : 'es-ES')}
                          className={`action-btn outline ${activeSpeechInput === 'newTaskInput' ? 'recording-pulse' : ''}`}
                          style={{ 
                            padding: '10px', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            borderColor: activeSpeechInput === 'newTaskInput' ? '#ef4444' : 'var(--border-color)',
                            color: activeSpeechInput === 'newTaskInput' ? '#ef4444' : 'var(--text-secondary)'
                          }}
                          title="Dictar tarea por voz"
                        >
                          {activeSpeechInput === 'newTaskInput' ? <MicOff size={18} /> : <Mic size={18} />}
                        </button>
                        <button type="button" className="action-btn" onClick={() => {
                          const input = document.getElementById('newTaskInput');
                          const text = input.value;
                          if (!text.trim()) return;
                          handleAddTask(selectedProspect.id, text);
                          input.value = '';
                          setSelectedProspect(prev => ({ ...prev, tasks: [...(prev.tasks || []), { id: Date.now(), text: text, date: new Date().toISOString(), completed: false }] }));
                        }}>+ Añadir</button>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '140px', overflowY: 'auto' }}>
                        {(selectedProspect.tasks || []).map(t => (
                          <div key={t.id} className={`modal-task-item ${t.completed ? 'completed' : ''}`}>
                            <span style={{ textDecoration: t.completed ? 'line-through' : 'none', color: t.completed ? '#94a3b8' : '#0f172a', fontSize: '0.9rem' }}>{t.text}</span>
                            <button type="button" onClick={() => {
                              handleToggleTask(selectedProspect.id, t.id);
                              setSelectedProspect(prev => ({ ...prev, tasks: prev.tasks.map(task => task.id === t.id ? { ...task, completed: !task.completed } : task) }));
                            }} style={{ background: 'none', border: 'none', color: t.completed ? '#10b981' : 'var(--sopena-blue)', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}>
                              {t.completed ? 'Deshacer' : '✔ Completar'}
                            </button>
                          </div>
                        ))}
                        {(!selectedProspect.tasks || selectedProspect.tasks.length === 0) && (
                          <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem', margin: '5px 0' }}>Sin tareas pendientes.</p>
                        )}
                      </div>
                    </div>
                    {/* Timeline de Actividad */}
                    <div>
                      <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>Historial de Actividades (Timeline)</label>
                      <div style={{ display: 'flex', gap: '10px', marginBottom: '12px', alignItems: 'center' }}>
                        <select id="newHistoryType" style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.9rem' }}>
                          <option value="📞 Llamada">Llamada</option>
                          <option value="✉️ Email">Email</option>
                          <option value="🤝 Reunión">Reunión</option>
                          <option value="📝 Nota">Nota</option>
                        </select>
                        <input type="text" id="newHistoryText" placeholder="Ej: Resumen de llamada..." style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.9rem' }} />
                        <button 
                          type="button" 
                          onClick={() => toggleSpeechRecognition('newHistoryText', selectedProspect.zone === 'Portugal' ? 'pt-PT' : 'es-ES')}
                          className={`action-btn outline ${activeSpeechInput === 'newHistoryText' ? 'recording-pulse' : ''}`}
                          style={{ 
                            padding: '10px', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            borderColor: activeSpeechInput === 'newHistoryText' ? '#ef4444' : 'var(--border-color)',
                            color: activeSpeechInput === 'newHistoryText' ? '#ef4444' : 'var(--text-secondary)'
                          }}
                          title="Dictar resumen por voz"
                        >
                          {activeSpeechInput === 'newHistoryText' ? <MicOff size={18} /> : <Mic size={18} />}
                        </button>
                        <button type="button" className="action-btn" onClick={() => {
                          const typeInput = document.getElementById('newHistoryType');
                          const textInput = document.getElementById('newHistoryText');
                          const type = typeInput.value;
                          const text = textInput.value;
                          if (!text.trim()) return;
                          handleAddHistory(selectedProspect.id, type, text);
                          textInput.value = '';
                          setSelectedProspect(prev => ({ ...prev, history: [{ id: Date.now(), type, text, date: new Date().toISOString() }, ...(prev.history || [])] }));
                        }}>Registrar</button>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto' }}>
                        {(selectedProspect.history || []).map(h => (
                          <div key={h.id} className="modal-timeline-item">
                            <div className="modal-timeline-header">
                              <strong style={{ color: 'var(--sopena-blue-dark)' }}>{h.type}</strong>
                              <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{new Date(h.date).toLocaleDateString()}</span>
                            </div>
                            <div style={{ color: '#475569', fontSize: '0.85rem' }}>{h.text}</div>
                          </div>
                        ))}
                        {(!selectedProspect.history || selectedProspect.history.length === 0) && (
                          <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem', margin: '5px 0' }}>Sin historial de contacto registrado.</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                
              </div>
              {/* ACCIONES DEL MODAL */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '15px', marginTop: 'auto' }}>
                <button type="button" className="delete-btn-danger" onClick={() => handleDeleteProspect(selectedProspect.id)}>
                  🗑️ Borrar Empresa
                </button>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="button" className="action-btn outline" onClick={() => setSelectedProspect(null)}>Cancelar</button>
                  <button type="submit" className="action-btn">Guardar Cambios</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ADD COMPANY MODAL */}
      {showAddCompanyModal && (
        <div className="modal-overlay" onClick={() => setShowAddCompanyModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Añadir Empresa Manualmente</h2>
            <form onSubmit={e => {
              e.preventDefault();
              handleAddCompany(new FormData(e.target));
            }}>
              <div className="form-group">
                <label>Nombre de la Empresa</label>
                <input type="text" name="name" required />
              </div>
              <div className="form-group">
                <label>Sector</label>
                <select name="sector" style={{width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)'}} required>
                  <option value="Cerramientos">Cerramientos</option>
                  <option value="Construccion Modular">Construcción Modular</option>
                  <option value="Frio Industrial">Frío Industrial</option>
                  <option value="Puertas y Ventanas">Puertas y Ventanas</option>
                  <option value="Plataformas">Plataformas</option>
                  <option value="Escaleras">Escaleras</option>
                  <option value="Estructuras Solares">Estructuras Solares</option>
                  <option value="Fachadas de Aluminio">Fachadas de Aluminio</option>
                  <option value="Fachadas Especiales">Fachadas Especiales</option>
                  <option value="Fabricantes de Escaleras de Aluminio">Fab. Escaleras</option>
                  <option value="Fabricantes de Estanterias de Aluminio">Fab. Estanterías</option>
                  <option value="Fabricantes de Carrocerias">Fab. Carrocerías</option>
                  <option value="Transformacion de Chapa">Transformación de Chapa</option>
                  <option value="Instalacion de Cubiertas">Instalación de Cubiertas</option>
                  <option value="Sistemas de Proteccion Solar">Sistemas de Protección Solar</option>
                  <option value="Metal Arquitectonico y Chapa Perforada">Metal Arquitectónico y Chapa Perforada</option>
                  <option value="Perfiles Estructurales Aluminio">Perfiles Estructurales Aluminio</option>
                  <option value="Piscinas Desmontables">Piscinas Desmontables</option>
                  <option value="Iluminacion Publica">Iluminación Pública</option>
                  <option value="Mesas de Invernadero">Mesas de Invernadero</option>
                  <option value="Divisiones de Oficina">Divisiones de Oficina</option>
                  <option value="Senalizacion">Señalización</option>
                  <option value="Camillas de Aluminio">Camillas de Aluminio</option>
                  <option value="Pistas de Padel">Pistas de Pádel</option>
                  <option value="Puertas Industriales">Puertas Industriales</option>
                  <option value="Puertas Frigorificas">Puertas Frigoríficas</option>
                  <option value="Mosquiteras">Mosquiteras</option>
                  <option value="Proveedor de Aluminio">Proveedor de Aluminio</option>
                  <option value="Distribucion de Aluminio y Metales">Distribución de Aluminio y Metales</option>
                  <option value="Armarios de Aluminio">Armarios de Aluminio</option>
                </select>
              </div>
              <div className="form-group">
                <label>Responsable de Compras</label>
                <input type="text" name="purchasingManager" required />
              </div>
              <div className="form-group">
                <label>Email de Contacto</label>
                <input type="email" name="email" placeholder="Ej: compras@empresa.com" />
              </div>
              <div className="form-group">
                <label>Teléfono Directo</label>
                <input type="tel" name="purchasingPhone" placeholder="Ej: +34 600 000 000" />
              </div>
              <div className="form-group">
                <label>Perfil de LinkedIn</label>
                <input type="url" name="purchasingLinkedin" placeholder="https://linkedin.com/in/usuario" />
              </div>
              <div className="form-group">
                <label>Zona / País</label>
                <select name="zone" style={{width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)'}} required>
                  <option value="Portugal">Portugal</option>
                  <option value="Pais Vasco">País Vasco</option>
                  <option value="Castilla y Leon">Castilla y León</option>
                  <option value="Cantabria">Cantabria</option>
                  <option value="Galicia">Galicia</option>
                  <option value="Asturias">Asturias</option>
                  <option value="Otra">Otra</option>
                </select>
              </div>
              <div className="form-group">
                <label>Sitio Web</label>
                <input type="text" name="web" placeholder="ej: https://www.empresa.com" />
              </div>
              <div className="modal-actions">
                <button type="button" className="action-btn outline" onClick={() => setShowAddCompanyModal(false)}>Cancelar</button>
                <button type="submit" className="action-btn">Crear Empresa</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* MODAL DE BÚSQUEDA INDIVIDUAL DE EMAIL CON IA */}
      {emailScannerTarget && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(7, 27, 102, 0.4)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 99999,
          animation: 'fadeIn 0.3s ease-out'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            boxShadow: '0 25px 50px -12px rgba(7, 43, 102, 0.25)',
            width: '90%',
            maxWidth: '550px',
            padding: '30px',
            position: 'relative',
            border: '1px solid rgba(226, 232, 240, 0.8)',
            display: 'flex',
            flexDirection: 'column',
            gap: '15px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #cbd5e1', paddingBottom: '10px' }}>
              <h3 style={{ margin: 0, color: 'var(--sopena-blue-dark)', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                🤖 Agentforce Email Finder
              </h3>
              <button 
                onClick={() => setEmailScannerTarget(null)} 
                style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--text-secondary)' }}
              >
                ✕
              </button>
            </div>
            
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Buscando y verificando dirección de email comercial para: <strong>{emailScannerTarget.name}</strong>
            </p>
            
            {/* Terminal de Logs */}
            <div style={{ 
              background: '#0f172a', 
              borderRadius: '8px', 
              padding: '15px', 
              height: '220px', 
              overflowY: 'auto', 
              fontFamily: 'monospace', 
              fontSize: '0.75rem', 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '6px',
              color: '#34d399'
            }}>
              {emailScannerLogs.map((log, idx) => (
                <div key={idx} style={{ 
                  color: log.type === 'success' ? '#4ade80' : log.type === 'warning' ? '#fbbf24' : log.type === 'danger' ? '#f87171' : '#38bdf8' 
                }}>
                  {log.text}
                </div>
              ))}
              {emailScannerStatus === 'scanning' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '5px' }}>
                  <span className="recording-pulse" style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#38bdf8' }}></span>
                  <span style={{ color: '#94a3b8' }}>Buscando en directorios y realizando comprobaciones...</span>
                </div>
              )}
            </div>
            
            {/* Resultados de la búsqueda con clasificación dinámica de color */}
            {emailScannerStatus === 'found' && (() => {
              const quality = checkEmailQuality(emailScannerResult, emailScannerTarget.name);
              let bg = '#ecfdf5';
              let border = '1px solid #a7f3d0';
              let text = '#047857';
              let badgeBg = '#d1fae5';
              let badgeText = '#065f46';
              let badgeLabel = '✅ Verde: Compras Verificado';

              if (quality === 'verified_generic') {
                bg = '#eff6ff';
                border = '1px solid #bfdbfe';
                text = 'var(--sopena-blue-dark)';
                badgeBg = 'rgba(7, 43, 102, 0.1)';
                badgeText = 'var(--sopena-blue)';
                badgeLabel = '✉️ Azul: Genérico Corporativo';
              } else if (quality === 'placeholder') {
                bg = '#fef2f2';
                border = '1px solid #fca5a5';
                text = '#991b1b';
                badgeBg = '#fee2e2';
                badgeText = '#991b1b';
                badgeLabel = '⚠️ Rojo: Autogenerado / Placeholder';
              } else if (quality === 'none' || quality === 'invalid') {
                bg = '#fffbeb';
                border = '1px solid #fde68a';
                text = '#92400e';
                badgeBg = '#fef3c7';
                badgeText = '#92400e';
                badgeLabel = '⚠️ Naranja: Sin Email / Inválido';
              }

              return (
                <div style={{ 
                  background: bg, 
                  border: border, 
                  padding: '12px 15px', 
                  borderRadius: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: text, fontWeight: 'bold' }}>✓ Email Comercial Localizado:</span>
                    <span style={{ fontSize: '0.7rem', fontWeight: 'bold', padding: '2px 8px', borderRadius: '12px', background: badgeBg, color: badgeText }}>
                      {badgeLabel}
                    </span>
                  </div>
                  <div style={{ fontSize: '1rem', color: text, fontWeight: '800', fontFamily: 'monospace' }}>
                    {emailScannerResult}
                  </div>
                </div>
              );
            })()}

            {/* Leyenda de Codificación de Colores (Instrucciones de Calidad en el Popup) */}
            <div style={{
              background: '#f8fafc',
              border: '1px dashed #cbd5e1',
              borderRadius: '8px',
              padding: '10px 12px',
              fontSize: '0.75rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}>
              <span style={{ fontWeight: 'bold', color: 'var(--sopena-blue-dark)', fontSize: '0.78rem' }}>
                💡 Codificación de Colores de Calidad de Email:
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></span>
                  <span style={{ color: '#065f46', fontWeight: 'bold' }}>Verde:</span>
                  <span style={{ color: 'var(--text-secondary)' }}>Compras Verificado</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--sopena-blue)' }}></span>
                  <span style={{ color: 'var(--sopena-blue-dark)', fontWeight: 'bold' }}>Azul:</span>
                  <span style={{ color: 'var(--text-secondary)' }}>Genérico Corporativo</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444' }}></span>
                  <span style={{ color: '#991b1b', fontWeight: 'bold' }}>Rojo:</span>
                  <span style={{ color: 'var(--text-secondary)' }}>Autogenerado / Placeholder</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b' }}></span>
                  <span style={{ color: '#92400e', fontWeight: 'bold' }}>Naranja:</span>
                  <span style={{ color: 'var(--text-secondary)' }}>Sin Email / Inválido</span>
                </div>
              </div>
            </div>
            
            {/* Acciones */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
              <button 
                type="button" 
                onClick={() => setEmailScannerTarget(null)} 
                className="action-btn outline"
                style={{ padding: '10px 16px' }}
              >
                {emailScannerStatus === 'found' ? 'Descartar' : 'Cancelar'}
              </button>
              {emailScannerStatus === 'found' && (
                <button 
                  type="button" 
                  onClick={() => handleApplyEmailFind(emailScannerTarget.id, emailScannerResult)} 
                  className="action-btn"
                  style={{ 
                    padding: '10px 16px',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    border: 'none'
                  }}
                >
                  💾 Aplicar y Guardar
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      {/* REPORT MODAL */}
      {showReportModal && (
        <div className="modal-overlay" onClick={() => setShowReportModal(false)}>
          <div className="modal a4-page" onClick={e => e.stopPropagation()} style={{maxWidth: '1000px', width: '95%', maxHeight: '90vh', overflowY: 'auto'}}>
            <div className="no-print" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
              <h2 style={{margin: 0, color: 'var(--sopena-blue-dark)'}}>Generar Reporte de Actividad</h2>
              <button className="action-btn outline" onClick={() => setShowReportModal(false)}>Cerrar</button>
            </div>
            
            <div className="no-print filter-bar" style={{marginBottom: '20px', padding: '15px'}}>
              <div className="filter-group">
                <label>Fecha Inicio</label>
                <input type="date" value={reportDates.start} onChange={e => setReportDates({...reportDates, start: e.target.value})} />
              </div>
              <div className="filter-group">
                <label>Fecha Fin</label>
                <input type="date" value={reportDates.end} onChange={e => setReportDates({...reportDates, end: e.target.value})} />
              </div>
              <div className="filter-group" style={{gridColumn: '1 / -1'}}>
                <label>Observaciones Globales (Aparecerán en el PDF)</label>
                <textarea rows="3" value={reportComments} onChange={e => setReportComments(e.target.value)} placeholder="Ej: Cumplimiento de objetivos del mes, prioridades para la semana que viene..." style={{padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', resize: 'vertical'}} />
              </div>
              <div className="filter-group" style={{gridColumn: '1 / -1'}}>
                <label>Varios (Comentarios no recogidos o puntos pendientes - Campo obligatorio)</label>
                <textarea rows="3" value={reportOthers} onChange={e => setReportOthers(e.target.value)} required placeholder="Ej: Gestiones adicionales, reuniones con clientes y visitas comerciales planificadas..." style={{padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', resize: 'vertical'}} />
              </div>
              <div className="filter-group" style={{justifyContent: 'flex-end', gridColumn: '1 / -1'}}>
                <button className="action-btn" onClick={() => window.print()} disabled={!reportDates.start || !reportDates.end || !reportOthers.trim()}>
                  📄 Imprimir / Exportar PDF
                </button>
              </div>
            </div>
            {/* ZONA IMPRIMIBLE */}
            <div className="print-report" style={{width: '100%', fontFamily: 'Inter, sans-serif', color: '#1e293b'}}>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '3px solid var(--sopena-blue)', paddingBottom: '15px', marginBottom: '20px'}}>
                <div style={{background: 'white', padding: '5px 10px', borderRadius: '4px'}}>
                  <img src="https://empresa-aluminio.com/images/global/logo/grupo-sopena-sistemas.png" alt="Logotipo Empresa de Aluminio" style={{height: '45px', objectFit: 'contain'}} />
                </div>
                <div style={{textAlign: 'right'}}>
                  <h2 style={{margin: 0, color: 'var(--sopena-blue-dark)', fontSize: '1.5rem', fontWeight: 800}}>Reporte de Actividad Comercial</h2>
                  <p style={{margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)'}}>
                    {reportDates.start && reportDates.end ? `Período: ${new Date(reportDates.start).toLocaleDateString('es-ES')} al ${new Date(reportDates.end).toLocaleDateString('es-ES')}` : 'Rango de fechas'}
                  </p>
                </div>
              </div>
              {/* RESUMEN METRICAS (KPI) DEL PERIODO */}
              {reportDates.start && reportDates.end && (
                <div style={{display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', marginBottom: '25px'}}>
                  <div style={{background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px', textAlign: 'center'}}>
                    <span style={{fontSize: '0.75rem', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase'}}>Contactos Totales</span>
                    <div style={{fontSize: '1.4rem', fontWeight: '800', color: 'var(--sopena-blue-dark)', marginTop: '4px'}}>{getReportData().length}</div>
                  </div>
                  <div style={{background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px', textAlign: 'center'}}>
                    <span style={{fontSize: '0.75rem', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase'}}>Leads Interesados</span>
                    <div style={{fontSize: '1.4rem', fontWeight: '800', color: '#10b981', marginTop: '4px'}}>
                      {getReportData().filter(p => p.response === 'Interesado' || p.response === 'Aceptado' || (p.response && p.response.toLowerCase().includes('interes'))).length}
                    </div>
                  </div>
                  <div style={{background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px', textAlign: 'center'}}>
                    <span style={{fontSize: '0.75rem', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase'}}>Tasa de Interés</span>
                    <div style={{fontSize: '1.4rem', fontWeight: '800', color: 'var(--sopena-blue)', marginTop: '4px'}}>
                      {getReportData().length > 0 ? Math.round((getReportData().filter(p => p.response === 'Interesado' || p.response === 'Aceptado' || (p.response && p.response.toLowerCase().includes('interes'))).length / getReportData().length) * 100) : 0}%
                    </div>
                  </div>
                  <div style={{background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px', textAlign: 'center'}}>
                    <span style={{fontSize: '0.75rem', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase'}}>Facturación en Juego</span>
                    <div style={{fontSize: '1.1rem', fontWeight: '800', color: '#f59e0b', marginTop: '6px'}}>
                      {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(getReportData().reduce((sum, p) => sum + (p.revenue || 0), 0))}
                    </div>
                  </div>
                </div>
              )}
              {reportComments && (
                <div style={{background: '#f8fafc', padding: '15px', borderRadius: '8px', marginBottom: '20px', borderLeft: '4px solid var(--sopena-blue)', border: '1px solid #e2e8f0', borderLeftWidth: '4px'}}>
                  <h4 style={{margin: '0 0 6px 0', color: 'var(--sopena-blue-dark)', fontSize: '0.9rem', fontWeight: 'bold'}}>Observaciones del Período</h4>
                  <p style={{margin: 0, fontSize: '0.85rem', color: '#334155', whiteSpace: 'pre-wrap', lineHeight: '1.5'}}>{reportComments}</p>
                </div>
              )}
              {reportOthers && (
                <div style={{background: '#f8fafc', padding: '15px', borderRadius: '8px', marginBottom: '25px', borderLeft: '4px solid var(--sopena-accent)', border: '1px solid #e2e8f0', borderLeftWidth: '4px'}}>
                  <h4 style={{margin: '0 0 6px 0', color: 'var(--sopena-blue-dark)', fontSize: '0.9rem', fontWeight: 'bold'}}>Varios (Comentarios y Puntos Pendientes)</h4>
                  <p style={{margin: 0, fontSize: '0.85rem', color: '#334155', whiteSpace: 'pre-wrap', lineHeight: '1.5'}}>{reportOthers}</p>
                </div>
              )}
              <table style={{width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left', marginBottom: '40px', border: '1px solid #e2e8f0'}}>
                <thead>
                  <tr style={{background: 'var(--sopena-blue-dark)', color: 'white'}}>
                    <th style={{padding: '10px 12px', fontWeight: 'bold'}}>Empresa</th>
                    <th style={{padding: '10px 12px', fontWeight: 'bold'}}>Fecha</th>
                    <th style={{padding: '10px 12px', fontWeight: 'bold'}}>Contacto</th>
                    <th style={{padding: '10px 12px', fontWeight: 'bold'}}>Respuesta</th>
                    <th style={{padding: '10px 12px', fontWeight: 'bold'}}>Notas / Comentarios</th>
                    <th style={{padding: '10px 12px', fontWeight: 'bold'}}>Motivo Descarte</th>
                  </tr>
                </thead>
                <tbody>
                  {getReportData().map((p, idx) => (
                    <tr key={p.id} style={{borderBottom: '1px solid #e2e8f0', background: idx % 2 === 0 ? '#ffffff' : '#f8fafc'}}>
                      <td style={{padding: '10px 12px', fontWeight: 'bold', color: 'var(--sopena-blue-dark)'}}>{p.name}</td>
                      <td style={{padding: '10px 12px'}}>{new Date(p.contactDate).toLocaleDateString('es-ES')}</td>
                      <td style={{padding: '10px 12px'}}>{p.purchasingManager}</td>
                      <td style={{padding: '10px 12px'}}>
                        <span style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: 'bold',
                          background: p.response === 'Interesado' || p.response === 'Aceptado' ? '#d1fae5' : p.response === 'No Interesado' || p.response === 'Rechazado' ? '#fee2e2' : '#f1f5f9',
                          color: p.response === 'Interesado' || p.response === 'Aceptado' ? '#065f46' : p.response === 'No Interesado' || p.response === 'Rechazado' ? '#991b1b' : '#334155'
                        }}>
                          {p.response || 'Sin definir'}
                        </span>
                      </td>
                      <td style={{padding: '10px 12px', color: '#475569', fontSize: '0.75rem', lineHeight: '1.4'}}>{p.notes || 'Sin observaciones'}</td>
                      <td style={{padding: '10px 12px', color: '#991b1b', fontWeight: '500'}}>{p.causaNoAceptacion || '-'}</td>
                    </tr>
                  ))}
                  {getReportData().length === 0 && (
                    <tr>
                      <td colSpan="6" style={{padding: '30px', textAlign: 'center', color: '#64748b', fontStyle: 'italic'}}>No se registran interacciones en el rango de fechas seleccionado.</td>
                    </tr>
                  )}
                </tbody>
              </table>
              {/* SECCIÓN DE FIRMAS PARA EL REPORTE */}
              {getReportData().length > 0 && (
                <div style={{display: 'flex', justifyContent: 'space-between', marginTop: '60px', padding: '0 20px', pageBreakInside: 'avoid'}}>
                  <div style={{textAlign: 'center', width: '200px', borderTop: '1px solid #cbd5e1', paddingTop: '10px'}}>
                    <div style={{fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--sopena-blue-dark)'}}>Carmen Castro</div>
                    <div style={{fontSize: '0.75rem', color: '#64748b'}}>Project Manager Emisor</div>
                  </div>
                  <div style={{textAlign: 'center', width: '200px', borderTop: '1px solid #cbd5e1', paddingTop: '10px'}}>
                    <div style={{fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--sopena-blue-dark)'}}>Dirección Comercial</div>
                    <div style={{fontSize: '0.75rem', color: '#64748b'}}>Aprobado por</div>
                  </div>
                </div>
              )}
              <div style={{marginTop: '40px', borderTop: '1px solid #e2e8f0', paddingTop: '15px', fontSize: '0.75rem', color: '#94a3b8', textAlign: 'center'}}>
                Documento interno confidencial - Aluminios Innovations CRM v1.0.0
              </div>
            </div>
          </div>
        </div>
      )}
      {/* MODAL SÚPER PREMIUM DE NOVEDADES (WHAT'S NEW) */}
      {showBackupPrompt && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(7, 27, 102, 0.4)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 99998,
          animation: 'fadeIn 0.3s ease-out'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '20px',
            boxShadow: '0 25px 50px -12px rgba(7, 43, 102, 0.25)',
            width: '90%',
            maxWidth: '500px',
            padding: '35px 40px',
            position: 'relative',
            border: '1px solid rgba(226, 232, 240, 0.8)',
            textAlign: 'center'
          }}>
            <div style={{ 
              background: 'linear-gradient(135deg, var(--sopena-blue) 0%, var(--sopena-blue-dark) 100%)', 
              width: '60px', 
              height: '60px', 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              margin: '0 auto 20px auto',
              boxShadow: '0 8px 16px rgba(10, 61, 145, 0.2)',
              color: 'white',
              fontSize: '28px'
            }}>
              💾
            </div>
            <h2 style={{ color: 'var(--sopena-blue-dark)', margin: '0 0 12px 0', fontSize: '1.4rem', fontWeight: '800' }}>
              Recordatorio de Copia de Seguridad
            </h2>
            <p style={{ margin: '0 0 24px 0', color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.5' }}>
              Para garantizar la seguridad de tus datos comerciales, se recomienda exportar periódicamente la base de datos de prospectos de CRM de la Empresa de Aluminio tanto en formato **Excel (CSV)** como en **JSON**.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
              <button 
                type="button"
                onClick={() => { handleDownloadJSON(); }}
                className="action-btn outline"
                style={{ width: '100%', padding: '12px', fontWeight: 'bold' }}
              >
                📥 Descargar JSON (.json)
              </button>
              <button 
                type="button"
                onClick={() => { handleExportCSV(); }}
                className="action-btn outline"
                style={{ width: '100%', padding: '12px', fontWeight: 'bold' }}
              >
                🟢 Exportar a Excel (.csv)
              </button>
              <div style={{ borderTop: '1px dashed #e2e8f0', marginTop: '10px', paddingTop: '10px' }}>
                <input 
                  type="file" 
                  id="import-database-backup-input" 
                  accept=".json" 
                  onChange={handleImportJSON} 
                  style={{ display: 'none' }} 
                />
                <button 
                  type="button"
                  onClick={() => document.getElementById('import-database-backup-input').click()}
                  className="action-btn outline"
                  style={{ width: '100%', padding: '12px', fontWeight: 'bold', borderColor: 'var(--sopena-accent)', color: 'var(--sopena-accent)' }}
                >
                  📤 Importar Base de Datos (.json)
                </button>
              </div>
            </div>
            <button 
              type="button"
              onClick={handleCloseBackupPrompt} 
              className="action-btn"
              style={{
                width: '100%',
                padding: '13px',
                background: 'linear-gradient(135deg, #072b66 0%, #1e1b4b 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.9rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(7, 43, 102, 0.2)'
              }}
            >
              Entendido y Guardado
            </button>
          </div>
        </div>
      )}

      {showWhatsNew && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(7, 27, 102, 0.4)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 99999,
          animation: 'fadeIn 0.3s ease-out'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '20px',
            boxShadow: '0 25px 50px -12px rgba(7, 43, 102, 0.25)',
            width: '90%',
            maxWidth: '620px',
            maxHeight: '85vh',
            overflowY: 'auto',
            padding: '35px 40px',
            position: 'relative',
            border: '1px solid rgba(226, 232, 240, 0.8)',
            animation: 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
            scrollbarWidth: 'thin'
          }}>
            {/* Encabezado */}
            <div style={{ textAlign: 'center', marginBottom: '25px' }}>
              <div style={{ 
                background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)', 
                width: '60px', 
                height: '60px', 
                borderRadius: '16px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                margin: '0 auto 15px auto',
                boxShadow: '0 8px 16px rgba(124, 58, 237, 0.2)'
              }}>
                <Sparkles size={30} style={{ color: 'white' }} />
              </div>
              <h2 style={{ color: 'var(--sopena-blue-dark)', margin: '0 0 8px 0', fontSize: '1.5rem', fontWeight: '800' }}>
                ¡Resumen de Nuevas Funciones!
              </h2>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: '1.4' }}>
                Hemos incorporado potentes herramientas de inteligencia artificial y funciones operativas al CRM de Aluminios Innovations.
              </p>
              {/* Badge de versión */}
              <div style={{ display: 'inline-block', marginTop: '10px', padding: '3px 10px', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', color: 'white', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 'bold', letterSpacing: '1px' }}>
                VERSIÓN 1.2 — JUNIO 2026
              </div>
            </div>
            {/* Listado de Novedades */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', marginBottom: '30px' }}>
              
              <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                <div style={{ background: '#f5f3ff', color: '#7c3aed', padding: '8px', borderRadius: '8px', flexShrink: 0 }}>
                  <Sparkles size={18} />
                </div>
                <div>
                  <h4 style={{ margin: '0 0 3px 0', fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--text-main)' }}>
                    Dossier de Presentación Dual y Enfoque de Carpintería
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                    Elige entre una presentación corta (carta) y una detallada (dossier comercial e industrial basado en Mapeal, con anexo de obras, capacidad fabril y series GS). Para carpinterías, incluye dirección postal y logo circular SVG dinámico en el visor, exportador HTML e email.
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                <div style={{ background: '#e0f2fe', color: '#0284c7', padding: '8px', borderRadius: '8px', flexShrink: 0 }}>
                  <Database size={18} />
                </div>
                <div>
                  <h4 style={{ margin: '0 0 3px 0', fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--text-main)' }}>
                    Importación Directa de Bases de Datos
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                    Sube y restaura tu base de datos de prospectos en formato JSON directamente desde este prompt o mediante el recordatorio periódico de copia de seguridad.
                  </p>
                  <div style={{ marginTop: '8px' }}>
                    <input 
                      type="file" 
                      id="import-database-whatsnew-input" 
                      accept=".json" 
                      onChange={handleImportJSON} 
                      style={{ display: 'none' }} 
                    />
                    <button 
                      type="button"
                      onClick={() => document.getElementById('import-database-whatsnew-input').click()}
                      style={{ 
                        padding: '6px 12px', 
                        fontSize: '0.75rem', 
                        fontWeight: 'bold', 
                        backgroundColor: '#f5f3ff', 
                        color: '#7c3aed', 
                        border: '1px solid #ddd6fe', 
                        borderRadius: '6px', 
                        cursor: 'pointer' 
                      }}
                    >
                      📤 Importar JSON ahora
                    </button>
                  </div>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                <div style={{ background: '#f5f3ff', color: '#7c3aed', padding: '8px', borderRadius: '8px', flexShrink: 0 }}>
                  <Sparkles size={18} />
                </div>
                <div>
                  <h4 style={{ margin: '0 0 3px 0', fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--text-main)' }}>
                    Resúmenes y Preparación IA
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                    Accede a una síntesis ejecutiva completa de tus clientes del CRM y obtén un plan comercial inteligente (pitch de ventas, preguntas de calificación y manejo de objeciones) antes de cada llamada.
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                <div style={{ background: '#e0f2fe', color: '#0284c7', padding: '8px', borderRadius: '8px', flexShrink: 0 }}>
                  <Mail size={18} />
                </div>
                <div>
                  <h4 style={{ margin: '0 0 3px 0', fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--text-main)' }}>
                    Redactor Inteligente Interactivo
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                    Modifica borradores de propuestas directamente desde el chatbot: pídele al agente que traduzca al inglés, resuma el texto o añada la garantía de calidad de 10 años en acabados certificados.
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                <div style={{ background: '#ecfdf5', color: '#10b981', padding: '8px', borderRadius: '8px', flexShrink: 0 }}>
                  <Mic size={18} />
                </div>
                <div>
                  <h4 style={{ margin: '0 0 3px 0', fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--text-main)' }}>
                    Dictado por Voz (Speech-to-Text)
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                    Rellena las minutas comerciales del reporte de seguimiento hablando directamente con el micrófono de tu dispositivo. Ideal para reportar rutas rápidamente.
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                <div style={{ background: '#fff7ed', color: '#ea580c', padding: '8px', borderRadius: '8px', flexShrink: 0 }}>
                  <Database size={18} />
                </div>
                <div>
                  <h4 style={{ margin: '0 0 3px 0', fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--text-main)' }}>
                    Lead Finder con Exclusión AEA
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                    Filtra automáticamente de forma autónoma cualquier competidor del sector del aluminio que pertenezca a la AEA, previniendo duplicidades y conflictos en tu CRM.
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                <div style={{ background: '#f0fdf4', color: '#16a34a', padding: '8px', borderRadius: '8px', flexShrink: 0 }}>
                  <Download size={18} />
                </div>
                <div>
                  <h4 style={{ margin: '0 0 3px 0', fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--text-main)' }}>
                    Copia de Seguridad Protegida
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                    Exporta la base de datos completa de prospectos a formato Excel (CSV) compatible de forma segura introduciendo tu clave comercial personal.
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                <div style={{ background: '#fef2f2', color: '#dc2626', padding: '8px', borderRadius: '8px', flexShrink: 0 }}>
                  <Smartphone size={18} />
                </div>
                {/* Contenedor de texto informativo sobre la instalación de la aplicación PWA */}
                <div>
                  <h4 style={{ margin: '0 0 3px 0', fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--text-main)' }}>
                    Instalación de Aplicación PWA
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                    Instala la aplicación en tu móvil, tableta o PC como una aplicación nativa y accede a la base de datos de prospectos incluso si no dispones de conexión a Internet.
                  </p>
                </div>
              </div>

              {/* ─── NOVEDADES v1.2 ─── */}
              <div style={{ borderTop: '2px dashed #e2e8f0', paddingTop: '18px', marginTop: '4px' }}>
                <p style={{ margin: '0 0 14px 0', fontSize: '0.72rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1.5px', color: '#7c3aed' }}>✨ Novedades v1.2</p>

                <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', marginBottom: '18px' }}>
                  <div style={{ background: '#ecfdf5', color: '#059669', padding: '8px', borderRadius: '8px', flexShrink: 0 }}>
                    <Mail size={18} />
                  </div>
                  <div>
                    <h4 style={{ margin: '0 0 3px 0', fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--text-main)' }}>
                      Validación de Emails en Tiempo Real
                    </h4>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                      El CRM clasifica cada email como ✅ <strong>verificado de compras</strong>, ✉️ <strong>genérico real</strong> o ⚠️ <strong>no verificado / sin email</strong>. Si no hay email de compras, se muestra el genérico; si no hay ninguno, se indica claramente antes de enviar cualquier comunicación.
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', marginBottom: '18px' }}>
                  <div style={{ background: '#fff7ed', color: '#d97706', padding: '8px', borderRadius: '8px', flexShrink: 0 }}>
                    <Database size={18} />
                  </div>
                  <div>
                    <h4 style={{ margin: '0 0 3px 0', fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--text-main)' }}>
                      Historial de Empresas Borradas ♻️
                    </h4>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                      Si eliminas una empresa y la vuelves a añadir, el sistema la marcará con el badge <strong>♻️ REINCORPORADA</strong> visible en tabla y modal, con la fecha exacta en que fue borrada. El historial se guarda permanentemente.
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                  <div style={{ background: '#fef2f2', color: '#dc2626', padding: '8px', borderRadius: '8px', flexShrink: 0 }}>
                    <Download size={18} />
                  </div>
                  <div>
                    <h4 style={{ margin: '0 0 3px 0', fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--text-main)' }}>
                      Exportación a PDF Interactivo
                    </h4>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                      Desde la pestaña <strong>Presentación</strong>, exporta el dossier o carta a PDF con <strong>enlaces clicables</strong>. El fichero se nombra con el nombre de la empresa destinataria y el sistema te pregunta dónde guardarlo.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            {/* Acción de Cierre */}

            <button 
              onClick={handleCloseWhatsNew} 
              style={{
                width: '100%',
                padding: '13px',
                background: 'linear-gradient(135deg, #072b66 0%, #1e1b4b 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.9rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(7, 43, 102, 0.2)',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              ¡Comenzar a Trabajar!
            </button>
          </div>
          <style>{`
            @keyframes fadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            @keyframes slideUp {
              from { transform: translateY(20px); opacity: 0; }
              to { transform: translateY(0); opacity: 1; }
            }
          `}</style>
        </div>
      )}
    </div>
  );
}
export default App;