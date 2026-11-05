/**
 * src/utils/supabaseSync.js
 * ---------------------------------------------------------------------
 * Módulo de Sincronización Bidireccional en Tiempo Real con Supabase.
 * Conecta el frontend de la aplicación directamente con PostgreSQL:
 * 
 *  1. Carga inicial unificada de prospectos y tareas desde Supabase.
 *  2. Mapeo transparente entre esquema snake_case (Postgres) y camelCase (React).
 *  3. Suscripción en tiempo real (Supabase Realtime) a inserciones y cambios.
 *  4. Persistencia directa de prospectos, tareas y borrados lógicos.
 * ---------------------------------------------------------------------
 */

import { getSupabaseClient } from './supabaseClient';

/**
 * Convierte una fila de PostgreSQL (`prospects`) al objeto estándar de React en cliente.
 * Preserva compatibilidad total con los campos utilizados por App.jsx.
 */
export function mapDbProspectToClient(row) {
  if (!row) return null;

  // Restaurar array de productos
  let products = [];
  if (Array.isArray(row.products)) {
    products = row.products;
  } else if (typeof row.products === 'string' && row.products.trim().length > 0) {
    products = row.products.split(' | ');
  }

  // Coordenadas
  let location = [40.4168, -3.7038];
  if (Array.isArray(row.location) && row.location.length === 2 && !isNaN(row.location[0])) {
    location = [Number(row.location[0]), Number(row.location[1])];
  }

  const extra = row.extra || {};

  return {
    id: row.id,
    name: row.name || 'Empresa sin nombre',
    cif: row.cif || '',
    zone: row.zone || 'Otras',
    department: row.department || '',
    city: row.city || extra.city || '',
    address: row.address || '',
    location: location,
    lat: location[0],
    lng: location[1],
    phone: row.phone || '',
    email: row.email || '',
    secondaryEmail: row.secondary_email || null,
    web: row.web || '',
    website: row.web || row.website || '',
    revenue: typeof row.revenue === 'number' ? row.revenue : (row.revenue ? Number(row.revenue) : null),
    tier: row.tier || 'Tier 3',
    b2bTier: row.b2b_tier || row.tier || 'Tier 3',
    purchasingManager: row.purchasing_manager || '',
    purchasingPhone: row.purchasing_phone || '',
    purchasingLinkedin: row.purchasing_linkedin || '',
    sector: row.sector || '',
    products: products,
    profileType: row.profile_type || extra.profileType || 'Industrial',
    alloy: row.alloy || '6063-T5 / 6060',
    finish: row.finish || 'Lacado / Anodizado',
    contacted: Boolean(row.contacted),
    contactDate: row.contact_date || null,
    emailVerified: Boolean(row.email_verified),
    emailVerifiedType: extra.emailVerifiedType || (row.email_verified ? 'corporate_official' : null),
    response: row.response || 'Pendiente de primer contacto comercial',
    notes: row.notes || '',
    createdAt: row.created_at || new Date().toISOString(),
    pipelineStage: row.pipeline_stage || 'Lead',
    certamen: row.certamen || null,
    emailableStatus: row.email_status || extra.safetyMailsStatus || 'unverified',
    tasks: Array.isArray(row.tasks) ? row.tasks : [],
    history: Array.isArray(row.history) ? row.history : [],
    version: row.version || 1,
    ...extra
  };
}

/**
 * Convierte un objeto de prospecto de React al formato esperado por la tabla `prospects` de Postgres.
 */
export function mapClientProspectToDb(p) {
  if (!p) return null;

  return {
    id: String(p.id),
    name: p.name,
    cif: p.cif || null,
    zone: p.zone || 'Otras',
    department: p.department || null,
    city: p.city || null,
    address: p.address || null,
    revenue: (typeof p.revenue === 'number' && !isNaN(p.revenue)) ? p.revenue : null,
    tier: p.tier || null,
    b2b_tier: p.b2bTier || p.tier || null,
    sector: p.sector || null,
    products: Array.isArray(p.products) ? p.products.join(' | ') : (p.products || null),
    email: p.email || null,
    secondary_email: p.secondaryEmail || null,
    phone: p.phone || null,
    web: p.web || p.website || null,
    website: p.website || p.web || null,
    purchasing_manager: p.purchasingManager || null,
    purchasing_phone: p.purchasingPhone || null,
    purchasing_linkedin: p.purchasingLinkedin || null,
    pipeline_stage: p.pipelineStage || 'Lead',
    contacted: Boolean(p.contacted),
    contact_date: p.contactDate ? new Date(p.contactDate).toISOString() : null,
    location: Array.isArray(p.location) ? p.location : [p.lat || 40.4168, p.lng || -3.7038],
    notes: p.notes || '',
    profile_type: p.profileType || null,
    alloy: p.alloy || null,
    finish: p.finish || null,
    certamen: p.certamen || null,
    email_verified: Boolean(p.emailVerified),
    email_status: p.emailableStatus || null,
    response: p.response || null,
    tasks: Array.isArray(p.tasks) ? p.tasks : [],
    history: Array.isArray(p.history) ? p.history : [],
    source: 'ui'
  };
}

/**
 * Carga completa de prospectos desde Supabase con paginación limpia (para superar el límite por defecto de 1000).
 */
export async function fetchAllProspectsFromSupabase() {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  try {
    const PAGE_SIZE = 1000;
    let allRows = [];
    let from = 0;
    let keepGoing = true;

    while (keepGoing) {
      const { data, error } = await supabase
        .from('prospects')
        .select('*')
        .is('deleted_at', null)
        .order('name', { ascending: true })
        .range(from, from + PAGE_SIZE - 1);

      if (error) {
        console.warn('[SupabaseSync] Error recuperando página de prospectos:', error.message);
        return null;
      }

      if (data && data.length > 0) {
        allRows = allRows.concat(data);
        if (data.length < PAGE_SIZE) {
          keepGoing = false;
        } else {
          from += PAGE_SIZE;
        }
      } else {
        keepGoing = false;
      }
    }

    return allRows.map(mapDbProspectToClient);
  } catch (err) {
    console.error('[SupabaseSync] Error en fetchAllProspectsFromSupabase:', err);
    return null;
  }
}

/**
 * Guarda o actualiza un prospecto individual directamente en Supabase.
 */
export async function syncSingleProspectToSupabase(prospect) {
  const supabase = getSupabaseClient();
  if (!supabase || !prospect) return false;

  try {
    const row = mapClientProspectToDb(prospect);
    const { error } = await supabase
      .from('prospects')
      .upsert(row, { onConflict: 'id' });

    if (error) {
      console.warn('[SupabaseSync] Error al guardar prospecto:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[SupabaseSync] Error al sincronizar prospecto:', err);
    return false;
  }
}

/**
 * Marca como borrado lógico un prospecto en Supabase (auditable y seguro).
 */
export async function softDeleteProspectInSupabase(prospectId) {
  const supabase = getSupabaseClient();
  if (!supabase || !prospectId) return false;

  try {
    const { error } = await supabase
      .from('prospects')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', String(prospectId));

    if (error) {
      console.warn('[SupabaseSync] Error en borrado lógico:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[SupabaseSync] Error al realizar soft-delete:', err);
    return false;
  }
}

/**
 * Suscribe la aplicación a eventos de actualización en tiempo real (Supabase Realtime).
 * Permite que si otro comercial actualiza un lead, el cambio se refleje al instante.
 */
export function subscribeToProspectChanges(onInsert, onUpdate, onDelete) {
  const supabase = getSupabaseClient();
  if (!supabase) return () => {};

  const channel = supabase
    .channel('public:prospects')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'prospects' },
      (payload) => {
        if (payload.new && onInsert) {
          onInsert(mapDbProspectToClient(payload.new));
        }
      }
    )
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'prospects' },
      (payload) => {
        if (payload.new) {
          if (payload.new.deleted_at && onDelete) {
            onDelete(payload.new.id);
          } else if (onUpdate) {
            onUpdate(mapDbProspectToClient(payload.new));
          }
        }
      }
    )
    .on(
      'postgres_changes',
      { event: 'DELETE', schema: 'public', table: 'prospects' },
      (payload) => {
        if (payload.old && payload.old.id && onDelete) {
          onDelete(payload.old.id);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
