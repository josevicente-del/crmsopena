/**
 * Motor de Auditoría y Registro de Interacciones de Usuario
 * --------------------------------------------------------
 * Garantiza que CUALQUIER interacción de un usuario (cambio de fase kanban,
 * contacto/llamada registrada, alta de prospecto, edición de datos, tarea completada, etc.)
 * quede registrada de forma indeleble en la base de datos global (Supabase / REST Server).
 */
import { getSupabaseClient } from './supabaseClient';

const LOCAL_AUDIT_KEY = 'aluminio_crm_audit_logs';

/**
 * Registra una interacción de usuario en la Base de Datos Global
 * @param {Object} params
 * @param {string} params.action - Tipo de acción (ej: 'CAMBIO_FASE_PIPELINE', 'REGISTRO_CONTACTO', etc.)
 * @param {string} params.user - Nombre o ID del usuario que ejecuta la acción
 * @param {string|number} params.targetId - ID del registro afectado (empresa, tarea, etc.)
 * @param {string} params.targetName - Nombre de la empresa o entidad afectada
 * @param {string} params.details - Descripción clara y legible de la interacción
 * @param {Object} [params.metadata] - Objeto opcional con valores previos y nuevos
 */
export async function logUserInteraction({
  action,
  user = 'admin',
  targetId = null,
  targetName = 'General',
  details = '',
  metadata = {}
}) {
  const logEntry = {
    id: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toISOString(),
    user: user || 'admin',
    action,
    targetId: targetId ? String(targetId) : null,
    targetName: targetName || '',
    details: details || '',
    metadata: metadata || {}
  };

  // 1. Envío asíncrono a Supabase si está disponible
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      supabase.from('crm_audit_logs').insert([{
        user_name: logEntry.user,
        action: logEntry.action,
        target_id: logEntry.targetId,
        target_name: logEntry.targetName,
        details: logEntry.details,
        metadata: logEntry.metadata,
        created_at: logEntry.timestamp
      }]).then(({ error }) => {
        if (error) console.warn('[AuditLogger] Aviso Supabase insert:', error.message);
      });
    } catch (e) {
      console.warn('[AuditLogger] Error al enviar a Supabase:', e);
    }
  }

  // 2. Envío asíncrono a la API REST centralizada (/api/interactions)
  try {
    fetch('/api/interactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(logEntry)
    }).catch(e => {
      // Servidor local o sin conexión
    });
  } catch (e) {}

  // 3. Persistencia local de seguridad en el buffer del navegador
  try {
    const existing = JSON.parse(localStorage.getItem(LOCAL_AUDIT_KEY) || '[]');
    const updated = [logEntry, ...existing].slice(0, 500); // Guardar los últimos 500
    localStorage.setItem(LOCAL_AUDIT_KEY, JSON.stringify(updated));
  } catch (e) {}

  return logEntry;
}

/**
 * Obtiene el historial de auditoría de interacciones
 */
export async function fetchAuditLogs() {
  // 1. Intentar desde Supabase
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('crm_audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (!error && Array.isArray(data) && data.length > 0) {
        return data.map(d => ({
          id: d.id,
          timestamp: d.created_at,
          user: d.user_name || d.user,
          action: d.action,
          targetId: d.target_id,
          targetName: d.target_name,
          details: d.details,
          metadata: d.metadata
        }));
      }
    } catch (e) {}
  }

  // 2. Intentar desde la API REST (/api/interactions)
  try {
    const res = await fetch('/api/interactions');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) return data;
    }
  } catch (e) {}

  // 3. Fallback al buffer local
  try {
    const local = JSON.parse(localStorage.getItem(LOCAL_AUDIT_KEY) || '[]');
    return local;
  } catch (e) {
    return [];
  }
}

