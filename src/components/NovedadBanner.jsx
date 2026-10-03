import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  ChevronDown, 
  ChevronUp, 
  X, 
  Eye, 
  Clock 
} from 'lucide-react';
import './NovedadBanner.css';

/**
 * ============================================================================
 * NovedadBanner.jsx - Componente de Alerta de Novedad Comercial Temporal
 * ============================================================================
 * Propósito:
 * 1. Informar al usuario en la pantalla de inicio (Base de Datos de Prospectos)
 *    de la incorporación de nuevas empresas en el CRM.
 * 2. Mantenerse visible exclusivamente durante los próximos 6 días
 *    (desde el 16 hasta el 22 de septiembre de 2026 inclusive).
 * 3. Proporcionar un botón de acceso directo ("Ver empresas en la tabla")
 *    para filtrar inmediatamente la tabla principal por novedades.
 * 4. Diseño limpio y compacto sin desplegables que sobrecarguen la pantalla.
 * ============================================================================
 */

// Fecha de expiración: 10 de octubre de 2026 a las 23:59:59 CET (7 días de vigencia para esta versión)
const NOVEDAD_EXPIRATION_TIMESTAMP = new Date('2026-10-10T23:59:59').getTime();

// Claves de sessionStorage para recordar si el usuario minimizó o cerró el aviso en la sesión (v2.4)
const SESSION_STORAGE_KEY_DISMISSED = 'crm_novedad_banner_dismissed_v2_4';
const SESSION_STORAGE_KEY_MINIMIZED = 'crm_novedad_banner_minimized_v2_4';

export const NovedadBanner = ({ onFilterNew }) => {
  // Estado que calcula si el aviso sigue dentro de los días de vigencia
  const [isActive, setIsActive] = useState(true);
  const [remainingDays, setRemainingDays] = useState(7);
  
  // Estado para descartar el aviso en la sesión actual
  const [isDismissed, setIsDismissed] = useState(() => {
    return sessionStorage.getItem(SESSION_STORAGE_KEY_DISMISSED) === 'true';
  });
  
  // Estado para minimizar el aviso a una barra compacta
  const [isMinimized, setIsMinimized] = useState(() => {
    return sessionStorage.getItem(SESSION_STORAGE_KEY_MINIMIZED) === 'true';
  });

  // Verificación periódica de la fecha de vencimiento
  useEffect(() => {
    const checkExpiration = () => {
      const now = Date.now();
      const diffMs = NOVEDAD_EXPIRATION_TIMESTAMP - now;

      if (diffMs <= 0) {
        setIsActive(false);
      } else {
        setIsActive(true);
        const days = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
        setRemainingDays(days);
      }
    };

    checkExpiration();
    const interval = setInterval(checkExpiration, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Si han pasado los días o el usuario lo descartó, no se renderiza
  if (!isActive || isDismissed) {
    return null;
  }

  // Cierre del banner durante la sesión
  const handleDismiss = () => {
    sessionStorage.setItem(SESSION_STORAGE_KEY_DISMISSED, 'true');
    setIsDismissed(true);
  };

  // Alternar vista minimizada
  const handleToggleMinimize = () => {
    const nextState = !isMinimized;
    setIsMinimized(nextState);
    sessionStorage.setItem(SESSION_STORAGE_KEY_MINIMIZED, String(nextState));
  };

  // Renderizado en formato píldora compacta cuando está minimizado
  if (isMinimized) {
    return (
      <div className="novedad-banner-container">
        <div className="novedad-minimized-pill">
          <div className="novedad-minimized-info">
            <span className="novedad-pulse-dot" />
            <span>
              <strong>✨ Novedades Versión 2.4:</strong> Incorporadas nuevas firmas líderes en Estructuras Solares Fotovoltaicas y Escaleras de Aluminio (Mecasolar, Rolser, Stansol Group, Pegasolar).
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
                title="Filtrar las nuevas incorporaciones en la tabla"
              >
                <Eye size={14} /> Ver en tabla
              </button>
            )}
            <button 
              className="novedad-minimized-btn" 
              onClick={handleToggleMinimize}
              title="Expandir aviso completo"
            >
              <ChevronDown size={14} /> Expandir
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Renderizado principal del Banner de Novedad (diseño limpio sin desplegable)
  return (
    <div className="novedad-banner-container">
      <div className="novedad-banner-card">
        {/* Cabecera del aviso con badges y temporizador */}
        <div className="novedad-banner-header">
          <div className="novedad-badges-group">
            <span className="novedad-badge-main">
              <span className="novedad-pulse-dot" />
              Novedades Versión 2.4
            </span>
            <span className="novedad-timer-badge">
              <Clock size={13} style={{ color: '#38bdf8' }} />
              Aviso activo durante los próximos <strong>{remainingDays} {remainingDays === 1 ? 'día' : 'días'}</strong> (hasta el 10 de octubre)
            </span>
          </div>

          <div className="novedad-controls">
            <button 
              className="novedad-control-btn" 
              onClick={handleToggleMinimize}
              title="Minimizar aviso a una barra compacta"
            >
              <ChevronUp size={14} /> Minimizar
            </button>
            <button 
              className="novedad-control-btn close" 
              onClick={handleDismiss}
              title="Ocultar aviso en esta sesión"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Contenido descriptivo del aviso */}
        <div className="novedad-banner-body">
          <div className="novedad-icon-box">
            <Sparkles size={24} />
          </div>
          
          <div className="novedad-info">
            <h3 className="novedad-title">
              ¡Nuevas Empresas Estratégicas y Actualizaciones en la Base de Datos!
            </h3>
            <p className="novedad-text">
              Expansión en sectores de alto valor añadido en extrusión: <strong>Estructuras Solares Fotovoltaicas</strong> y <strong>Escaleras y Sistemas Industriales</strong>. Se incorporan <strong>Mecasolar (Mecanizados Solares S.L.)</strong> (18.5M€), <strong>Rolser S.A.</strong> (14.1M€), <strong>Stansol Group (Stansol Energy S.L.)</strong> (11.5M€) y <strong>Pegasolar Energy</strong>. Además, se han auditado las integraciones de <em>INSO Estructuras Solares, Braux Solar, Grup Anudal y ESLA Plataformas</em>.
            </p>

            {/* Píldoras informativas territoriales y sectoriales */}
            <div className="novedad-zones-grid">
              <div className="novedad-zone-pill valencia">
                <span className="pill-tag">Solar & Escaleras</span>
                <span>Mecasolar, Rolser, Stansol, Pegasolar</span>
              </div>
              <div className="novedad-zone-pill madrid">
                <span className="pill-tag">Flujos Agénticos</span>
                <span>Recordatorio de contacto a 7 días en Tareas</span>
              </div>
              <div className="novedad-zone-pill">
                <span className="pill-tag">Georutas</span>
                <span>Corrección de coordenadas y geolocalización</span>
              </div>
              <div className="novedad-zone-pill total">
                <span className="pill-tag">CRM Total</span>
                <span><strong>454 empresas auditadas</strong></span>
              </div>
            </div>

            {/* Acción directa para filtrar en la tabla principal */}
            <div className="novedad-actions-bar">
              {onFilterNew && (
                <button 
                  className="novedad-action-btn-primary" 
                  onClick={onFilterNew}
                  title="Aplica el filtro de novedades en la tabla de prospectos"
                >
                  <Eye size={16} /> Ver empresas en la tabla
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NovedadBanner;
