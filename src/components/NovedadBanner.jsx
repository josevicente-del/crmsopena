import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  ChevronDown, 
  ChevronUp, 
  X, 
  Eye, 
  Clock,
  ShieldCheck,
  Building2,
  Zap,
  CheckCircle2
} from 'lucide-react';
import './NovedadBanner.css';

/**
 * ============================================================================
 * NovedadBanner.jsx - Modal Pop-up y Alerta de Novedad Comercial Temporal
 * ============================================================================
 * Propósito:
 * 1. Informar al usuario en un Pop-up modal de alto impacto y banner superior
 *    de la incorporación de Técnicas Expansivas, S.L. (INDEX Fixing Systems, >130M€)
 *    proveniente de GENERA (IFEMA Madrid) y las últimas firmas líderes integradas.
 * 2. Mantenerse activo durante los próximos 7 días (hasta el 12 de octubre de 2026).
 * 3. Proporcionar acceso directo a filtrar en tabla y revisar datos de contacto.
 * ============================================================================
 */

// Fecha de expiración: 12 de octubre de 2026 a las 23:59:59 CET (7 días de vigencia)
const NOVEDAD_EXPIRATION_TIMESTAMP = new Date('2026-10-12T23:59:59').getTime();

// Claves de almacenamiento para estado de pop-up y banner
const STORAGE_KEY_POPUP_SEEN = 'crm_novedad_popup_seen_v2_5';
const STORAGE_KEY_BANNER_DISMISSED = 'crm_novedad_banner_dismissed_v2_5';
const STORAGE_KEY_BANNER_MINIMIZED = 'crm_novedad_banner_minimized_v2_5';

export const NovedadBanner = ({ onFilterNew }) => {
  // Estado de vigencia temporal de 7 días
  const [isActive, setIsActive] = useState(true);
  const [remainingDays, setRemainingDays] = useState(7);
  
  // Estado para el Pop-up Modal inicial
  const [showModal, setShowModal] = useState(false);

  // Estado para descartar el banner en la sesión
  const [isDismissed, setIsDismissed] = useState(() => {
    return sessionStorage.getItem(STORAGE_KEY_BANNER_DISMISSED) === 'true';
  });
  
  // Estado para minimizar el banner
  const [isMinimized, setIsMinimized] = useState(() => {
    return sessionStorage.getItem(STORAGE_KEY_BANNER_MINIMIZED) === 'true';
  });

  // Verificación periódica de la fecha de expiración
  useEffect(() => {
    const checkExpiration = () => {
      const now = Date.now();
      const diffMs = NOVEDAD_EXPIRATION_TIMESTAMP - now;

      if (diffMs <= 0) {
        setIsActive(false);
        setShowModal(false);
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

  // Mostrar Pop-up automáticamente al entrar si no se ha cerrado antes en la sesión
  useEffect(() => {
    if (isActive) {
      const seen = sessionStorage.getItem(STORAGE_KEY_POPUP_SEEN);
      if (!seen) {
        setShowModal(true);
      }
    }
  }, [isActive]);

  const handleCloseModal = () => {
    sessionStorage.setItem(STORAGE_KEY_POPUP_SEEN, 'true');
    setShowModal(false);
  };

  const handleDismissBanner = () => {
    sessionStorage.setItem(STORAGE_KEY_BANNER_DISMISSED, 'true');
    setIsDismissed(true);
  };

  const handleToggleMinimize = () => {
    const nextState = !isMinimized;
    setIsMinimized(nextState);
    sessionStorage.setItem(STORAGE_KEY_BANNER_MINIMIZED, String(nextState));
  };

  const handleFilterFromModal = () => {
    handleCloseModal();
    if (onFilterNew) {
      onFilterNew();
    }
  };

  if (!isActive) {
    return null;
  }

  return (
    <>
      {/* POP-UP MODAL DE NOVEDADES */}
      {showModal && (
        <div className="novedad-modal-overlay" onClick={handleCloseModal}>
          <div className="novedad-modal-card" onClick={(e) => e.stopPropagation()}>
            <button className="novedad-modal-close-btn" onClick={handleCloseModal} title="Cerrar ventana">
              <X size={20} />
            </button>

            <div className="novedad-modal-header">
              <div className="novedad-modal-icon-badge">
                <Sparkles size={28} />
              </div>
              <div>
                <div className="novedad-modal-tag">Novedad Comercial • GENERA Madrid</div>
                <h2 className="novedad-modal-title">Nueva Gran Empresa Estratégica Incorporada</h2>
              </div>
            </div>

            <div className="novedad-modal-body">
              <div className="novedad-highlight-box">
                <div className="novedad-highlight-title">
                  <Building2 size={18} style={{ color: '#38bdf8' }} />
                  <strong>Técnicas Expansivas, S.L. (INDEX Fixing Systems)</strong>
                </div>
                <div className="novedad-highlight-meta">
                  <span><strong>CIF:</strong> B26220491</span>
                  <span><strong>Facturación:</strong> &gt; 130.000.000 €</span>
                  <span><strong>Ubicación:</strong> La Rioja (Logroño)</span>
                </div>
                <p className="novedad-highlight-desc">
                  Fabricante multinacional de sistemas de fijación y perfiles estructurales de aluminio para energía solar y cubiertas industriales. Expositor líder en <strong>GENERA (IFEMA Madrid)</strong>, con consumo intensivo de aluminio técnico y perfiles estructurales certificados.
                </p>
                <div className="novedad-highlight-status">
                  <ShieldCheck size={16} style={{ color: '#34d399' }} />
                  <span>Email validado con servidor MX corporativo activo: <code>info@indexfix.com</code></span>
                </div>
              </div>

              <div className="novedad-features-summary">
                <div className="novedad-feature-item">
                  <CheckCircle2 size={16} style={{ color: '#38bdf8' }} />
                  <span>Verificación estricta: <strong>Excluido de la AEA</strong> y facturación contrastada superior a 5M€.</span>
                </div>
                <div className="novedad-feature-item">
                  <CheckCircle2 size={16} style={{ color: '#38bdf8' }} />
                  <span>Base de datos optimizada: <strong>466 prospectos industriales</strong> en cartera.</span>
                </div>
                <div className="novedad-feature-item">
                  <Clock size={16} style={{ color: '#f59e0b' }} />
                  <span>Este aviso informativo permanecerá activo durante los próximos <strong>{remainingDays} días</strong> (hasta el 12 de octubre).</span>
                </div>
              </div>
            </div>

            <div className="novedad-modal-footer">
              <button className="novedad-modal-btn-secondary" onClick={handleCloseModal}>
                Continuar al CRM
              </button>
              {onFilterNew && (
                <button className="novedad-modal-btn-primary" onClick={handleFilterFromModal}>
                  <Eye size={18} /> Ver Novedades en Tabla
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* BANNER EN PANTALLA PRINCIPAL (si no ha sido descartado) */}
      {!isDismissed && (
        <div className="novedad-banner-container">
          {isMinimized ? (
            <div className="novedad-minimized-pill">
              <div className="novedad-minimized-info">
                <span className="novedad-pulse-dot" />
                <span>
                  <strong>✨ Novedad Comercial:</strong> Incorporada <strong>Técnicas Expansivas, S.L. (INDEX)</strong> (&gt;130M€) desde GENERA Madrid.
                </span>
                <span style={{ color: '#94a3b8', fontSize: '0.78rem' }}>
                  ({remainingDays} {remainingDays === 1 ? 'día restante' : 'días restantes'})
                </span>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button 
                  className="novedad-minimized-btn" 
                  onClick={() => setShowModal(true)}
                  title="Abrir ventana informativa completa"
                >
                  <Sparkles size={14} /> Ver detalles
                </button>
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
          ) : (
            <div className="novedad-banner-card">
              <div className="novedad-banner-header">
                <div className="novedad-badges-group">
                  <span className="novedad-badge-main">
                    <span className="novedad-pulse-dot" />
                    Novedad Comercial • GENERA Madrid
                  </span>
                  <span className="novedad-timer-badge">
                    <Clock size={13} style={{ color: '#38bdf8' }} />
                    Aviso activo durante los próximos <strong>{remainingDays} {remainingDays === 1 ? 'día' : 'días'}</strong> (hasta el 12 de octubre)
                  </span>
                </div>

                <div className="novedad-controls">
                  <button 
                    className="novedad-control-btn" 
                    onClick={() => setShowModal(true)}
                    title="Abrir resumen en ventana emergente"
                  >
                    <Sparkles size={14} /> Ver Pop-up
                  </button>
                  <button 
                    className="novedad-control-btn" 
                    onClick={handleToggleMinimize}
                    title="Minimizar aviso a una barra compacta"
                  >
                    <ChevronUp size={14} /> Minimizar
                  </button>
                  <button 
                    className="novedad-control-btn close" 
                    onClick={handleDismissBanner}
                    title="Ocultar aviso en esta sesión"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>

              <div className="novedad-banner-body">
                <div className="novedad-icon-box">
                  <Zap size={24} />
                </div>
                
                <div className="novedad-info">
                  <h3 className="novedad-title">
                    ¡Nueva Firma Estratégica Incorporada: Técnicas Expansivas, S.L. (INDEX)!
                  </h3>
                  <p className="novedad-text">
                    Identificada en la prospección de <strong>GENERA (IFEMA Madrid)</strong>: Fabricante internacional de perfiles y estructuras de aluminio solar con facturación superior a <strong>130M €</strong>, validación de correo corporativo MX entregable (<code>info@indexfix.com</code>) y verificación de no pertenencia a la AEA.
                  </p>

                  <div className="novedad-zones-grid">
                    <div className="novedad-zone-pill valencia">
                      <span className="pill-tag">Empresa</span>
                      <span>INDEX Fixing Systems (B26220491)</span>
                    </div>
                    <div className="novedad-zone-pill madrid">
                      <span className="pill-tag">Sector & Origen</span>
                      <span>Solar & Cubiertas • GENERA Madrid</span>
                    </div>
                    <div className="novedad-zone-pill">
                      <span className="pill-tag">Facturación</span>
                      <span>&gt; 130.000.000 €</span>
                    </div>
                    <div className="novedad-zone-pill total">
                      <span className="pill-tag">CRM Total</span>
                      <span><strong>466 empresas</strong></span>
                    </div>
                  </div>

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
                    <button 
                      className="novedad-action-btn-secondary" 
                      onClick={() => setShowModal(true)}
                    >
                      <Sparkles size={16} /> Abrir Ficha Resumen
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default NovedadBanner;
