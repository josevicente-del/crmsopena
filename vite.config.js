import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'

/**
 * Plugin de Vite para servir la API de CRM (Prospectos y Tareas) directamente en el Servidor (Node.js)
 * Permite persistir todas las empresas, fases del kanban, notas y tareas en el servidor centralizado de base de datos
 * para que múltiples usuarios desde distintos ordenadores vean los mismos datos en tiempo real.
 */
function crmApiPlugin() {
  const getFilePath = (root, relPath) => path.resolve(root || process.cwd(), relPath);

  const readJson = (filePath, fallback = []) => {
    try {
      if (!fs.existsSync(filePath)) return fallback;
      const raw = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(raw);
      return parsed;
    } catch (e) {
      console.error(`[CRM API] Error leyendo ${filePath}:`, e);
      return fallback;
    }
  };

  const writeJson = (filePath, data) => {
    try {
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
      return true;
    } catch (e) {
      console.error(`[CRM API] Error escribiendo ${filePath}:`, e);
      return false;
    }
  };

  const setupMiddleware = (server) => {
    server.middlewares.use((req, res, next) => {
      const parsedUrl = new URL(req.url, 'http://localhost');
      const pathname = parsedUrl.pathname;

      if (!pathname.startsWith('/api/')) {
        return next();
      }

      const root = server.config ? server.config.root : process.cwd();
      const tasksFilePath = getFilePath(root, 'src/data/tasks.json');
      const prospectsFilePath = getFilePath(root, 'src/data/prospects.json');
      const excludedFilePath = getFilePath(root, 'src/data/excludedCompanies.json');
      const auditFilePath = getFilePath(root, 'src/data/audit_logs.json');

      const sendJson = (status, data) => {
        res.statusCode = status;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        res.end(JSON.stringify(data));
      };

      if (req.method === 'OPTIONS') {
        res.statusCode = 204;
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        return res.end();
      }

      const parseBody = (callback) => {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
          try {
            const data = body ? JSON.parse(body) : {};
            callback(null, data);
          } catch (err) {
            callback(err);
          }
        });
      };

      // ==========================================
      // API DE TAREAS (/api/tasks)
      // ==========================================
      if (pathname.startsWith('/api/tasks')) {
        // GET /api/tasks
        if (req.method === 'GET' && (pathname === '/api/tasks' || pathname === '/api/tasks/')) {
          let tasks = readJson(tasksFilePath, []);
          const user = parsedUrl.searchParams.get('user');
          const zone = parsedUrl.searchParams.get('zone');
          if (zone && zone !== 'ALL') {
            tasks = tasks.filter(t => t.zone === zone || t.zone === 'ALL');
          }
          if (user && user !== 'admin' && user !== 'norte1') {
            tasks = tasks.filter(t => t.assignedTo === user || t.createdBy === user);
          }
          return sendJson(200, tasks);
        }

        // POST /api/tasks
        if (req.method === 'POST' && (pathname === '/api/tasks' || pathname === '/api/tasks/' || pathname === '/api/tasks/sync')) {
          return parseBody((err, payload) => {
            if (err) return sendJson(400, { error: 'Invalid JSON payload' });

            let existingTasks = readJson(tasksFilePath, []);
            if (Array.isArray(payload) || (payload && Array.isArray(payload.tasks))) {
              const incomingList = Array.isArray(payload) ? payload : payload.tasks;
              const map = new Map();
              existingTasks.forEach(t => map.set(String(t.id).trim(), t));
              incomingList.forEach(t => {
                if (t && t.id) map.set(String(t.id).trim(), t);
              });
              existingTasks = Array.from(map.values());
            } else if (payload && payload.text) {
              const newTask = {
                id: payload.id || (Date.now() + Math.floor(Math.random() * 1000)),
                prospectId: payload.prospectId || null,
                prospectName: payload.prospectName || 'Tarea General',
                zone: payload.zone || 'ALL',
                assignedTo: payload.assignedTo || 'admin',
                assignedToName: payload.assignedToName || 'Superadministrador Grupo Sopena',
                createdBy: payload.createdBy || 'admin',
                text: payload.text,
                date: payload.date || new Date().toISOString(),
                dueDate: payload.dueDate || null,
                dueDateFormatted: payload.dueDateFormatted || null,
                completed: !!payload.completed,
                priority: payload.priority || 'Normal',
                category: payload.category || 'General'
              };
              existingTasks = [newTask, ...existingTasks.filter(t => String(t.id).trim() !== String(newTask.id).trim())];
            }

            writeJson(tasksFilePath, existingTasks);
            return sendJson(201, { success: true, tasks: existingTasks });
          });
        }

        // PATCH / PUT /api/tasks/:id
        if ((req.method === 'PATCH' || req.method === 'PUT') && pathname.startsWith('/api/tasks/')) {
          const cleanPath = pathname.replace('/api/tasks/', '');
          const isToggle = cleanPath.endsWith('/toggle');
          const taskIdStr = (isToggle ? cleanPath.replace('/toggle', '') : cleanPath).trim();

          return parseBody((err, payload) => {
            let tasks = readJson(tasksFilePath, []);
            let found = false;
            tasks = tasks.map(t => {
              if (String(t.id).trim() === taskIdStr) {
                found = true;
                if (isToggle) {
                  return {
                    ...t,
                    completed: !t.completed,
                    completedAt: !t.completed ? new Date().toISOString() : null
                  };
                }
                return { ...t, ...(payload || {}) };
              }
              return t;
            });

            if (!found && !isToggle && payload && payload.id) {
              tasks.unshift(payload);
            }

            writeJson(tasksFilePath, tasks);
            return sendJson(200, { success: true, tasks });
          });
        }

        // DELETE /api/tasks/:id
        if (req.method === 'DELETE' && pathname.startsWith('/api/tasks/')) {
          const taskIdStr = pathname.replace('/api/tasks/', '').trim();
          let tasks = readJson(tasksFilePath, []);
          tasks = tasks.filter(t => String(t.id).trim() !== taskIdStr);
          writeJson(tasksFilePath, tasks);
          return sendJson(200, { success: true, deletedId: taskIdStr, tasks });
        }
      }

      // ==========================================
      // API DE PROSPECTOS CENTRALIZADA (/api/prospects)
      // Mantiene la base de datos no-local sincronizada para múltiples ordenadores
      // ==========================================
      if (pathname.startsWith('/api/prospects')) {
        // 1. GET /api/prospects: Obtener catálogo completo de prospectos
        if (req.method === 'GET' && (pathname === '/api/prospects' || pathname === '/api/prospects/')) {
          const prospects = readJson(prospectsFilePath, []);
          return sendJson(200, prospects);
        }

        // 2. POST /api/prospects o /api/prospects/sync: Crear prospecto nuevo o sincronización masiva
        if (req.method === 'POST') {
          return parseBody((err, payload) => {
            if (err) return sendJson(400, { error: 'Payload JSON inválido' });

            let prospects = readJson(prospectsFilePath, []);

            // Sincronización masiva de modificaciones y altas
            if (pathname === '/api/prospects/sync' || Array.isArray(payload) || (payload && payload.sync)) {
              const incoming = Array.isArray(payload) ? payload : (payload.modifications || payload.prospects || []);
              const added = payload.added || [];
              const deletedIds = new Set((payload.deleted || []).map(d => String(typeof d === 'object' ? d.id : d)));

              const map = new Map();
              prospects.forEach(p => map.set(String(p.id), p));

              // Aplicar modificaciones
              incoming.forEach(mod => {
                if (mod && mod.id) {
                  const existing = map.get(String(mod.id));
                  if (existing) {
                    map.set(String(mod.id), { ...existing, ...mod });
                  } else {
                    map.set(String(mod.id), mod);
                  }
                }
              });

              // Aplicar altas
              added.forEach(add => {
                if (add && add.id && !map.has(String(add.id))) {
                  map.set(String(add.id), add);
                }
              });

              // Excluir borrados
              deletedIds.forEach(delId => map.delete(delId));

              prospects = Array.from(map.values());
              writeJson(prospectsFilePath, prospects);
              return sendJson(200, { success: true, count: prospects.length, message: 'Base centralizada sincronizada con éxito' });
            }

            // Alta de un nuevo prospecto individual
            const newProspect = {
              id: payload.id || Date.now(),
              name: payload.name || 'Nueva Empresa',
              cif: payload.cif || '',
              pipelineStage: payload.pipelineStage || 'Prospección Inicial',
              ...payload,
              createdAt: payload.createdAt || new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };

            const existingIdx = prospects.findIndex(p => String(p.id) === String(newProspect.id));
            if (existingIdx >= 0) {
              prospects[existingIdx] = { ...prospects[existingIdx], ...newProspect };
            } else {
              prospects.unshift(newProspect);
            }

            writeJson(prospectsFilePath, prospects);
            return sendJson(201, { success: true, prospect: newProspect });
          });
        }

        // 3. PUT o PATCH /api/prospects/:id: Actualizar prospecto existente en base central
        if ((req.method === 'PUT' || req.method === 'PATCH') && pathname.startsWith('/api/prospects/')) {
          const prospectIdStr = pathname.replace('/api/prospects/', '').trim();

          return parseBody((err, payload) => {
            if (err) return sendJson(400, { error: 'Payload JSON inválido' });

            let prospects = readJson(prospectsFilePath, []);
            let updated = null;
            let found = false;

            prospects = prospects.map(p => {
              if (String(p.id).trim() === prospectIdStr) {
                found = true;
                updated = { ...p, ...(payload || {}), updatedAt: new Date().toISOString() };
                return updated;
              }
              return p;
            });

            if (!found && payload && payload.id) {
              updated = { ...payload, updatedAt: new Date().toISOString() };
              prospects.unshift(updated);
            }

            writeJson(prospectsFilePath, prospects);
            return sendJson(200, { success: true, prospect: updated });
          });
        }

        // 4. DELETE /api/prospects/:id: Eliminar prospecto y registrar en exclusiones centralizadas
        if (req.method === 'DELETE' && pathname.startsWith('/api/prospects/')) {
          const prospectIdStr = pathname.replace('/api/prospects/', '').trim();
          let prospects = readJson(prospectsFilePath, []);
          const target = prospects.find(p => String(p.id).trim() === prospectIdStr);
          
          prospects = prospects.filter(p => String(p.id).trim() !== prospectIdStr);
          writeJson(prospectsFilePath, prospects);

          // Registrar en excludedCompanies.json para proteger contra re-importación
          if (target) {
            let excluded = readJson(excludedFilePath, []);
            const alreadyExcluded = excluded.some(e => String(e.id || e).trim() === prospectIdStr);
            if (!alreadyExcluded) {
              excluded.push({
                id: target.id,
                name: target.name,
                cif: target.cif || '',
                reason: 'Baja solicitada por usuario en CRM',
                deletedAt: new Date().toISOString()
              });
              writeJson(excludedFilePath, excluded);
            }
          }

          return sendJson(200, { success: true, deletedId: prospectIdStr });
        }
      }

      // ==========================================
      // API DE AUDITORÍA E INTERACCIONES (/api/interactions y /api/audit-logs)
      // Registra de forma indeleble toda acción de los usuarios en la base central
      // ==========================================
      if (pathname === '/api/interactions' || pathname === '/api/audit-logs' || pathname === '/api/interactions/' || pathname === '/api/audit-logs/') {
        if (req.method === 'GET') {
          const logs = readJson(auditFilePath, []);
          return sendJson(200, logs);
        }

        if (req.method === 'POST') {
          return parseBody((err, payload) => {
            if (err) return sendJson(400, { error: 'Payload JSON inválido' });

            const logs = readJson(auditFilePath, []);
            const newLog = {
              id: payload.id || `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
              timestamp: payload.timestamp || new Date().toISOString(),
              user: payload.user || 'admin',
              action: payload.action || 'INTERACCION_GENERAL',
              targetId: payload.targetId || null,
              targetName: payload.targetName || 'General',
              details: payload.details || '',
              metadata: payload.metadata || {}
            };

            const updatedLogs = [newLog, ...logs].slice(0, 1000); // Guardar últimas 1000 acciones
            writeJson(auditFilePath, updatedLogs);
            return sendJson(201, { success: true, log: newLog });
          });
        }
      }

      return sendJson(405, { error: 'Method not allowed' });
    });
  };

  return {
    name: 'vite-plugin-crm-api',
    configureServer(server) {
      setupMiddleware(server);
    },
    configurePreviewServer(server) {
      setupMiddleware(server);
    }
  };
}

// Configuración corporativa Vite: Exposición en 0.0.0.0 para acceso multi-usuario en red local y API centralizada
export default defineConfig({
  plugins: [
    react(),
    crmApiPlugin()
  ],
  server: {
    host: true,
    port: 5173,
    cors: true
  },
  preview: {
    host: true,
    port: 5173,
    cors: true
  }
})
