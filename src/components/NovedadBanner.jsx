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

// Fecha de expiración: 22 de septiembre de 2026 a las 23:59:59 CET (6 días desde el alta)
const NOVEDAD_EXPIRATION_TIMESTAMP = new Date('2026-09-22T23:59:59').getTime();

// Claves de sessionStorage para recordar si el usuario minimizó o cerró el aviso en la sesión
const SESSION_STORAGE_KEY_DISMISSED = 'crm_novedad_banner_dismissed_v1';
const SESSION_STORAGE_KEY_MINIMIZED = 'crm_novedad_banner_minimized_v1';

export const NovedadBanner = ({ onFilterNew }) => {
  // Estado que calcula si el aviso sigue dentro de los 6 días de vigencia
  const [isActive, setIsActive] = useState(true);
  const [remainingDays, setRemainingDays] = useState(6);
  
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

  // Si han pasado los 6 días o el usuario lo descartó, no se renderiza
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
              <strong>✨ Novedad Comercial:</strong> Incorporadas nuevas empresas líderes en Mosquiteras y Protección Solar (+11 empresas como Zanzar Iberia, Nevaluz, Llaza World).
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
              ¡Se han incorporado más empresas a la Base de Datos!
            </h3>
            <p className="novedad-text">
              Ampliación estratégica en <strong>Mosquiteras y Sistemas de Protección Solar</strong>: se ha integrado <strong>Zanzar Iberia S.L.</strong> junto al top 10 nacional de mayor facturación en sistemas y perfiles de aluminio (<em>Nevaluz, Llaza World, Hunter Douglas, Siplan, Samer Systems, Mitjavila, Tamiluz...</em>), sumado a los nuevos talleres de cerramientos RPT de Castilla y León y Madrid.
            </p>

            {/* Píldoras informativas territoriales y sectoriales */}
            <div className="novedad-zones-grid">
              <div className="novedad-zone-pill valencia">
                <span className="pill-tag">Zanzar & Similares (+11)</span>
                <span>Mosquiteras y Protección Solar</span>
              </div>
              <div className="novedad-zone-pill">
                <span className="pill-tag">Castilla y León (+4)</span>
                <span>Valladolid, Burgos, Salamanca y Segovia</span>
              </div>
              <div className="novedad-zone-pill madrid">
                <span className="pill-tag">Madrid (+5)</span>
                <span>Alcobendas, Ajalvir, Coslada, Madrid y Colmenarejo</span>
              </div>
              <div className="novedad-zone-pill total">
                <span className="pill-tag">CRM Total</span>
                <span><strong>393 empresas auditadas</strong></span>
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
