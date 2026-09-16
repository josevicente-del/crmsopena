import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Building2, 
  Calendar, 
  ChevronDown, 
  ChevronUp, 
  ExternalLink, 
  X, 
  Eye, 
  Layers, 
  MapPin, 
  CheckCircle2, 
  Clock 
} from 'lucide-react';
import './NovedadBanner.css';

/**
 * ============================================================================
 * NovedadBanner.jsx - Componente de Alerta de Novedad Comercial Temporal
 * ============================================================================
 * Propósito:
 * 1. Informar al usuario en la pantalla de inicio (Base de Datos / Prospects)
 *    de la incorporación reciente de empresas en el CRM.
 * 2. Mantenerse activo exclusivamente durante los próximos 6 días
 *    (desde el 16 hasta el 22 de septiembre de 2026 inclusive).
 * 3. Proporcionar acceso rápido al filtrado de novedades y visualización
 *    interactiva de las empresas añadidas en Castilla y León, Madrid y Valencia.
 * 4. Opciones de colapso, minimizado y cierre temporal amigables con el usuario.
 * ============================================================================
 */

// Fecha de vencimiento exacta fijada a 6 días naturales (22 de septiembre de 2026 a las 23:59:59 CET)
const NOVEDAD_EXPIRATION_TIMESTAMP = new Date('2026-09-22T23:59:59').getTime();

// Clave para almacenamiento en sessionStorage del estado minimizado o cerrado por el usuario
const SESSION_STORAGE_KEY_DISMISSED = 'crm_novedad_banner_dismissed_v1';
const SESSION_STORAGE_KEY_MINIMIZED = 'crm_novedad_banner_minimized_v1';

// Listado de referencia de las empresas incorporadas y actualizadas en esta oleada
const RECENTLY_ADDED_COMPANIES = [
  {
    id: 'PROP-APPR-0390',
    name: 'Carpintería de Aluminio M. Zamora, S.L.',
    zone: 'Castilla y Leon',
    city: 'Aldeamayor de San Martín (Valladolid)',
    cif: 'B47507710',
    phone: '+34 983 52 85 17',
    revenue: '1.250.000 €',
    web: 'https://carpinteriasmanuelzamora.com',
    sector: 'Puertas y Ventanas',
    specialty: 'Taller industrial en Pol. Ind. El Brizo con marcado CE y RPT'
  },
  {
    id: 'PROP-APPR-0391',
    name: 'Aluminios Barriuso, S.L.',
    zone: 'Castilla y Leon',
    city: 'Villalbilla de Burgos (Burgos)',
    cif: 'B09392630',
    phone: '+34 947 29 10 78',
    revenue: '1.100.000 €',
    web: 'https://www.aluminiosbarriuso.es',
    sector: 'Puertas y Ventanas',
    specialty: 'Fabricante en Pol. Ind. Los Brezos de cerramientos térmicos'
  },
  {
    id: 'PROP-APPR-0392',
    name: 'Antonio Esteban e Hijos, S.L.',
    zone: 'Castilla y Leon',
    city: 'Salamanca (Salamanca)',
    cif: 'B37472420',
    phone: '+34 923 19 11 37',
    revenue: '1.350.000 €',
    web: 'https://www.antonio-esteban.com',
    sector: 'Puertas y Ventanas',
    specialty: 'Fabricación en Pol. Ind. Montalvo II de ventanas RPT'
  },
  {
    id: 'PROP-APPR-0393',
    name: 'Talleres Govi, S.L.',
    zone: 'Castilla y Leon',
    city: 'Vallelado (Segovia)',
    cif: 'B40133704',
    phone: '+34 921 15 03 15',
    revenue: '1.750.000 €',
    web: 'https://www.govi.es',
    sector: 'Puertas y Ventanas',
    specialty: 'Cerramientos térmicos y ventanas en Pol. Ind. Los Arenales'
  },
  {
    id: 'PROP-APPR-0394',
    name: 'Aluminios de Frutos, S.A.',
    zone: 'Comunidad de Madrid',
    city: 'Ajalvir (Madrid)',
    cif: 'A28682250',
    phone: '+34 91 884 31 65',
    revenue: '3.400.000 €',
    web: 'https://www.aluminiosdefrutos.com',
    sector: 'Puertas y Ventanas',
    specialty: 'Factoría industrial de gran formato para carpintería de alta gama'
  },
  {
    id: 'PROP-APPR-0395',
    name: 'Alucon 96, S.A.',
    zone: 'Comunidad de Madrid',
    city: 'Coslada / Arganda (Madrid)',
    cif: 'A81386062',
    phone: '+34 91 874 22 42',
    revenue: '2.900.000 €',
    web: 'https://www.alucon96.es',
    sector: 'Puertas y Ventanas',
    specialty: 'Fabricación industrial de ventanas RPT y cerramientos'
  },
  {
    id: 'PROP-APPR-0396',
    name: 'Aluminios Ciupal, S.L.',
    zone: 'Comunidad de Madrid',
    city: 'Madrid (Madrid)',
    cif: 'B80935547',
    phone: '+34 91 552 64 26',
    revenue: '1.650.000 €',
    web: 'https://www.aluminiosciupal.com',
    sector: 'Puertas y Ventanas',
    specialty: 'Taller propio en Sierra de Meira con más de 40 años de trayectoria'
  },
  {
    id: 'PROP-APPR-0397',
    name: 'Hierro y Aluminio Entero 2020 (Ventacol)',
    zone: 'Comunidad de Madrid',
    city: 'Colmenarejo (Madrid)',
    cif: 'B88607825',
    phone: '+34 91 858 93 49',
    revenue: '850.000 €',
    web: 'https://www.ventacol.com',
    sector: 'Puertas y Ventanas',
    specialty: 'Fabricante de cerramientos y ventanas RPT en el noroeste de Madrid'
  },
  {
    id: 'PROP-VERIF-0015',
    name: 'Vicente Vila, S.L.',
    zone: 'Comunidad Valenciana',
    city: 'Alzira (Valencia)',
    cif: 'B46552923',
    phone: '+34 962 40 39 61',
    revenue: '2.800.000 €',
    web: 'https://www.vicentevilasl.com',
    sector: 'Puertas y Ventanas',
    specialty: 'Actualizada y verificada oficialmente: taller histórico en Alzira'
  }
];

export const NovedadBanner = ({ 
  prospects = [], 
  onSelectProspect, 
  onFilterNew 
}) => {
  // Estado que calcula si el período de 6 días sigue activo en tiempo real
  const [isActive, setIsActive] = useState(true);
  const [remainingDays, setRemainingDays] = useState(6);
  
  // Estados de control de visualización
  const [isDismissed, setIsDismissed] = useState(() => {
    return sessionStorage.getItem(SESSION_STORAGE_KEY_DISMISSED) === 'true';
  });
  
  const [isMinimized, setIsMinimized] = useState(() => {
    return sessionStorage.getItem(SESSION_STORAGE_KEY_MINIMIZED) === 'true';
  });

  const [showAccordion, setShowAccordion] = useState(false);

  // Efecto para verificar la vigencia temporal de los 6 días
  useEffect(() => {
    const checkExpiration = () => {
      const now = Date.now();
      const diffMs = NOVEDAD_EXPIRATION_TIMESTAMP - now;

      if (diffMs <= 0) {
        // El aviso ha expirado (han transcurrido los 6 días)
        setIsActive(false);
      } else {
        setIsActive(true);
        // Cálculo redondeado hacia arriba de los días restantes
        const days = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
        setRemainingDays(days);
      }
    };

    checkExpiration();
    // Re-evaluar cada 30 minutos mientras la aplicación esté abierta
    const interval = setInterval(checkExpiration, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Si ya han pasado los 6 días o el usuario lo cerró en esta sesión, no renderizamos nada
  if (!isActive || isDismissed) {
    return null;
  }

  // Función para descartar el banner temporalmente en esta sesión
  const handleDismiss = () => {
    sessionStorage.setItem(SESSION_STORAGE_KEY_DISMISSED, 'true');
    setIsDismissed(true);
  };

  // Función para alternar el modo minimizado
  const handleToggleMinimize = () => {
    const nextState = !isMinimized;
    setIsMinimized(nextState);
    sessionStorage.setItem(SESSION_STORAGE_KEY_MINIMIZED, String(nextState));
  };

  // Si está minimizado, renderizamos una barra compacta no invasiva
  if (isMinimized) {
    return (
      <div className="novedad-banner-container">
        <div className="novedad-minimized-pill">
          <div className="novedad-minimized-info">
            <span className="novedad-pulse-dot" />
            <span>
              <strong>✨ Novedad Comercial:</strong> Incorporadas nuevas empresas de carpintería y cerramientos RPT en Castilla y León y Madrid (+8 empresas).
            </span>
            <span style={{ color: '#94a3b8', fontSize: '0.78rem' }}>
              ({remainingDays} {remainingDays === 1 ? 'día restante' : 'días restantes'})
            </span>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {onFilterNew && (
              <button 
                className="novedad-minimized-btn" 
                onClick={onFilterNew}
                title="Filtrar automáticamente las nuevas incorporaciones en la tabla"
              >
                <Eye size={14} /> Ver en tabla
              </button>
            )}
            <button 
              className="novedad-minimized-btn" 
              onClick={handleToggleMinimize}
              title="Expandir el panel completo de novedades"
            >
              <ChevronDown size={14} /> Expandir
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Renderizado completo del Banner de Novedad
  return (
    <div className="novedad-banner-container">
      <div className="novedad-banner-card">
        {/* Cabecera del aviso */}
        <div className="novedad-banner-header">
          <div className="novedad-badges-group">
            <span className="novedad-badge-main">
              <span className="novedad-pulse-dot" />
              Novedad Comercial
            </span>
            <span className="novedad-timer-badge">
              <Clock size={13} style={{ color: '#38bdf8' }} />
              Aviso activo durante los próximos <strong>{remainingDays} {remainingDays === 1 ? 'día' : 'días'}</strong> (hasta el 22 de septiembre)
            </span>
          </div>

          <div className="novedad-controls">
            <button 
              className="novedad-control-btn" 
              onClick={handleToggleMinimize}
              title="Minimizar este aviso a una barra compacta"
            >
              <ChevronUp size={14} /> Minimizar
            </button>
            <button 
              className="novedad-control-btn close" 
              onClick={handleDismiss}
              title="Ocultar aviso durante esta sesión de navegación"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Cuerpo informativo principal */}
        <div className="novedad-banner-body">
          <div className="novedad-icon-box">
            <Sparkles size={24} />
          </div>
          
          <div className="novedad-info">
            <h3 className="novedad-title">
              ¡Se han incorporado más empresas a la Base de Datos!
            </h3>
            <p className="novedad-text">
              Ampliación cualificada en el sector <strong>Puertas y Ventanas</strong>: se han integrado <strong>8 nuevos fabricantes y talleres industriales</strong> de cerramientos con rotura de puente térmico (RPT) con marcado CE en <strong>Castilla y León</strong> y la <strong>Comunidad de Madrid</strong>, junto con la depuración registral y de contacto de <strong>Vicente Vila, S.L.</strong> en Alzira (Valencia).
            </p>

            {/* Píldoras de distribución territorial */}
            <div className="novedad-zones-grid">
              <div className="novedad-zone-pill">
                <span className="pill-tag">Castilla y León (+4)</span>
                <span>Valladolid, Burgos, Salamanca y Segovia</span>
              </div>
              <div className="novedad-zone-pill madrid">
                <span className="pill-tag">Madrid (+4)</span>
                <span>Ajalvir, Coslada, Madrid y Colmenarejo</span>
              </div>
              <div className="novedad-zone-pill valencia">
                <span className="pill-tag">C. Valenciana (Verificada)</span>
                <span>Vicente Vila S.L. (Alzira)</span>
              </div>
              <div className="novedad-zone-pill total">
                <span className="pill-tag">CRM Total</span>
                <span><strong>382 empresas auditadas</strong></span>
              </div>
            </div>

            {/* Barra de botones de acción */}
            <div className="novedad-actions-bar">
              {onFilterNew && (
                <button 
                  className="novedad-action-btn-primary" 
                  onClick={onFilterNew}
                  title="Aplica el filtro para ver únicamente estas empresas en la tabla inferior"
                >
                  <Eye size={16} /> Ver empresas en la tabla
                </button>
              )}

              <button 
                className="novedad-action-btn-secondary" 
                onClick={() => setShowAccordion(!showAccordion)}
              >
                <Layers size={16} /> 
                {showAccordion ? 'Ocultar listado rápido' : 'Desplegar detalle de las empresas'}
                {showAccordion ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            </div>
          </div>
        </div>

        {/* Panel Acordeón Desplegable con el Listado de Empresas */}
        {showAccordion && (
          <div className="novedad-accordion-panel">
            <div className="novedad-table-wrapper">
              <table className="novedad-companies-table">
                <thead>
                  <tr>
                    <th>Empresa</th>
                    <th>Ubicación</th>
                    <th>CIF</th>
                    <th>Teléfono</th>
                    <th>Facturación Est.</th>
                    <th>Especialidad Técnica</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {RECENTLY_ADDED_COMPANIES.map((comp) => {
                    // Si disponemos de la función onSelectProspect y la lista completa, buscamos el objeto
                    const realProspect = prospects.find(p => p.id === comp.id);
                    return (
                      <tr key={comp.id}>
                        <td>
                          <strong>{comp.name}</strong>
                          <div>
                            <a 
                              href={comp.web} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="novedad-company-link"
                            >
                              {comp.web.replace(/^https?:\/\//, '')} <ExternalLink size={11} />
                            </a>
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <MapPin size={12} style={{ color: '#38bdf8' }} />
                            <span>{comp.city}</span>
                          </div>
                        </td>
                        <td><code>{comp.cif}</code></td>
                        <td>{comp.phone}</td>
                        <td><span style={{ color: '#34d399', fontWeight: 'bold' }}>{comp.revenue}</span></td>
                        <td style={{ fontSize: '0.78rem', color: '#94a3b8' }}>{comp.specialty}</td>
                        <td>
                          {onSelectProspect && realProspect && (
                            <button 
                              className="novedad-row-btn"
                              onClick={() => onSelectProspect(realProspect)}
                              title="Abrir ficha técnica y comercial completa en el CRM"
                            >
                              Ficha CRM
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NovedadBanner;
