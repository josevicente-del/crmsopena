/**
 * Cliente Universal Supabase & Base de Datos Global
 * ------------------------------------------------
 * Gestiona la conexión global a Supabase (PostgreSQL Cloud) para el CRM de Grupo Sopena.
 * Si las credenciales están configuradas (mediante variables de entorno o panel de administración),
 * sincroniza en tiempo real las empresas, tareas y auditorías de interacción.
 */
import { createClient } from '@supabase/supabase-js';

// Claves de almacenamiento local de configuración de Supabase
const CONFIG_KEY = 'aluminio_crm_supabase_config';

/**
 * Obtiene la configuración actual de Supabase (desde env o desde configuración persistida)
 */
export function getSupabaseConfig() {
  const envUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

  if (envUrl && envKey) {
    return { url: envUrl, anonKey: envKey, source: 'env' };
  }

  try {
    const saved = localStorage.getItem(CONFIG_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.url && parsed.anonKey) {
        return { url: parsed.url, anonKey: parsed.anonKey, source: 'user_configured' };
      }
    }
  } catch (e) {
    console.error('[SupabaseClient] Error leyendo configuración:', e);
  }

  return { url: '', anonKey: '', source: 'none' };
}

/**
 * Guarda credenciales de Supabase configuradas por el usuario/administrador
 */
export function saveSupabaseConfig(url, anonKey) {
  try {
    if (!url || !anonKey) {
      localStorage.removeItem(CONFIG_KEY);
      return { success: true, cleared: true };
    }
    const cleanUrl = url.trim();
    const cleanKey = anonKey.trim();
    localStorage.setItem(CONFIG_KEY, JSON.stringify({ url: cleanUrl, anonKey: cleanKey }));
    _supabaseInstance = null; // Reiniciar instancia
    return { success: true, configured: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

let _supabaseInstance = null;

/**
 * Obtiene la instancia activa de Supabase (o null si no está configurado)
 */
export function getSupabaseClient() {
  const config = getSupabaseConfig();
  if (!config.url || !config.anonKey) {
    return null;
  }

  if (!_supabaseInstance) {
    try {
      _supabaseInstance = createClient(config.url, config.anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true
        }
      });
    } catch (e) {
      console.error('[SupabaseClient] Error al inicializar cliente Supabase:', e);
      return null;
    }
  }

  return _supabaseInstance;
}

/**
 * Comprueba si Supabase está activo y listo
 */
export function isSupabaseConfigured() {
  const config = getSupabaseConfig();
  return Boolean(config.url && config.anonKey);
}

/**
 * Verifica la conectividad real con Supabase
 */
export async function testSupabaseConnection(customUrl = null, customKey = null) {
  const url = customUrl || getSupabaseConfig().url;
  const key = customKey || getSupabaseConfig().anonKey;

  if (!url || !key) {
    return { ok: false, error: 'Faltan URL o Anon Key de Supabase' };
  }

  try {
    const client = createClient(url, key);
    // Intentar leer de una tabla o comprobar auth
    const { error } = await client.from('crm_audit_logs').select('id').limit(1);
    if (error && error.code !== 'PGRST116') {
      // Si la tabla no existe aún, comprobamos si al menos respondió la API
      if (error.message.includes('relation "public.crm_audit_logs" does not exist')) {
        return {
          ok: true,
          warning: 'Conexión exitosa a Supabase, pero la tabla "crm_audit_logs" aún no ha sido creada. Ejecute el script SQL provisto.',
          tablePending: true
        };
      }
      return { ok: false, error: error.message };
    }
    return { ok: true, message: 'Conexión con Supabase verificada con éxito' };
  } catch (err) {
    return { ok: false, error: err.message || 'Error de red al conectar con Supabase' };
  }
}

