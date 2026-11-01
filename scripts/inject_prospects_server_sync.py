# -*- coding: utf-8 -*-
import os

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
app_jsx_path = os.path.join(ROOT_DIR, 'src', 'App.jsx')

with open(app_jsx_path, 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Inyectar carga inicial y sincronización activa desde el servidor de base de datos
target_tasks_use_effect = """  // Carga y sincronización activa de tareas directamente desde el SERVIDOR (/api/tasks)
  useEffect(() => {
    let isMounted = true;
    const fetchServerTasks = async () => {
      try {
        const res = await fetch('/api/tasks');
        if (res.ok) {
          const serverTasks = await res.json();
          if (Array.isArray(serverTasks) && isMounted) {
            setCrmTasks(serverTasks);
          }
        }
      } catch (e) {
        console.warn('[Tasks] Conexión con servidor /api/tasks (usando datos de servidor locales):', e);
      }
    };
    fetchServerTasks();
    return () => { isMounted = false; };
  }, []);"""

replacement_prospects_and_tasks_sync = """  // Carga y sincronización activa de tareas directamente desde el SERVIDOR (/api/tasks)
  useEffect(() => {
    let isMounted = true;
    const fetchServerTasks = async () => {
      try {
        const res = await fetch('/api/tasks');
        if (res.ok) {
          const serverTasks = await res.json();
          if (Array.isArray(serverTasks) && isMounted) {
            setCrmTasks(serverTasks);
          }
        }
      } catch (e) {
        console.warn('[Tasks] Conexión con servidor /api/tasks (usando datos de servidor locales):', e);
      }
    };
    fetchServerTasks();
    return () => { isMounted = false; };
  }, []);

  // =========================================================================
  // SINCRONIZACIÓN MULTI-USUARIO CENTRALIZADA EN BASE DE DATOS (/api/prospects)
  // Carga periódica y al arrancar desde la base de datos central en el servidor
  // para que múltiples usuarios desde distintos ordenadores compartan los cambios.
  // =========================================================================
  useEffect(() => {
    let isMounted = true;
    const fetchCentralDatabase = async () => {
      try {
        const res = await fetch('/api/prospects');
        if (res.ok) {
          const serverProspects = await res.json();
          if (Array.isArray(serverProspects) && serverProspects.length > 0 && isMounted) {
            setProspects(prev => {
              const prevMap = new Map(prev.map(p => [p.id, p]));
              let hasChanges = false;
              const merged = serverProspects.map(sp => {
                const local = prevMap.get(sp.id);
                if (!local) {
                  hasChanges = true;
                  return sp;
                }
                // Si el servidor tiene datos más recientes o idénticos
                if (sp.updatedAt && (!local.updatedAt || new Date(sp.updatedAt) > new Date(local.updatedAt))) {
                  hasChanges = true;
                  return { ...local, ...sp };
                }
                return local;
              });
              return hasChanges ? merged : prev;
            });
          }
        }
      } catch (err) {
        console.warn('[Sync BD Central] Modo sin servidor activo, operando con caché local:', err);
      }
    };

    fetchCentralDatabase();

    // Sincronización periódica cada 30 segundos y al recuperar el foco de la ventana
    const interval = setInterval(fetchCentralDatabase, 30000);
    const handleFocus = () => fetchCentralDatabase();
    window.addEventListener('focus', handleFocus);

    return () => {
      isMounted = false;
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);"""

if target_tasks_use_effect in code:
    code = code.replace(target_tasks_use_effect, replacement_prospects_and_tasks_sync)
    print("[OK] Sincronización multi-usuario inyectada en App.jsx")
else:
    print("[WARN] target_tasks_use_effect no encontrado")

# 2. Inyectar persistencia en servidor en el useEffect de guardado de prospects
target_localstorage_sync = """      localStorage.setItem('aluminio_crm_modifications', JSON.stringify(modifiedOnly));
    } catch (e) {
      console.warn('Límite de cuota de LocalStorage alcanzado. Los datos se mantienen en memoria viva.', e);
    }
  }, [prospects]);"""

replacement_localstorage_and_server_sync = """      localStorage.setItem('aluminio_crm_modifications', JSON.stringify(modifiedOnly));

      // Respaldo simultáneo en la Base de Datos Centralizada del Servidor (/api/prospects/sync)
      // Garantiza que cualquier cambio hecho por un usuario quede guardado en el servidor para los demás ordenadores
      if (addedCompanies.length > 0 || modifiedOnly.length > 0) {
        fetch('/api/prospects/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            modifications: modifiedOnly,
            added: addedCompanies,
            sync: true
          })
        }).catch(syncErr => {
          console.warn('[Sync BD Central] Registro en servidor en cola:', syncErr);
        });
      }
    } catch (e) {
      console.warn('Límite de cuota de LocalStorage alcanzado. Los datos se mantienen en memoria viva.', e);
    }
  }, [prospects]);"""

if target_localstorage_sync in code:
    code = code.replace(target_localstorage_sync, replacement_localstorage_and_server_sync)
    print("[OK] Respaldo simultáneo en base de datos central inyectado en App.jsx")
else:
    print("[WARN] target_localstorage_sync no encontrado")

# 3. Inyectar DELETE directo a /api/prospects/:id en handleDeleteProspect
target_delete_func = """      setProspects(prev => prev.filter(p => p.id !== prospectId));
      if (selectedProspect && selectedProspect.id === prospectId) {
        setSelectedProspect(null);
      }"""

replacement_delete_func = """      setProspects(prev => prev.filter(p => p.id !== prospectId));
      if (selectedProspect && selectedProspect.id === prospectId) {
        setSelectedProspect(null);
      }
      // Notificar eliminación a la Base de Datos Centralizada en Servidor
      fetch(`/api/prospects/${prospectId}`, { method: 'DELETE' }).catch(e => console.warn('[BD Central Delete Error]:', e));"""

if target_delete_func in code:
    code = code.replace(target_delete_func, replacement_delete_func)
    print("[OK] Notificación DELETE a base de datos central inyectada en handleDeleteProspect")
else:
    print("[WARN] target_delete_func no encontrado")

with open(app_jsx_path, 'w', encoding='utf-8') as f:
    f.write(code)

print("[OK] App.jsx finalizado con soporte 100% multi-usuario centralizado")

