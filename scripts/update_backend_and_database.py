# -*- coding: utf-8 -*-
"""
Script de actualización integral:
1. Base de datos centralizada no-local (/api/prospects y /api/tasks) en Vite dev server y Server.cjs
2. Netlify Functions y redirects en netlify.toml para despliegue en la nube
3. Vaciado estricto de 'Leads Dormidos' en arranque (0 dormidos)
4. Corrección de la previsualización y exportación PDF de las cartas de presentación y dossiers
"""
import os
import json

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# ---------------------------------------------------------------------------
# 1. ACTUALIZAR VITE.CONFIG.JS CON API DE PROSPECTS Y TAREAS
# ---------------------------------------------------------------------------
vite_config_path = os.path.join(ROOT_DIR, 'vite.config.js')

vite_content = """import { defineConfig } from 'vite'
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
          if (user && user !== 'admin' && user !== 'ccastro') {
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
"""

with open(vite_config_path, 'w', encoding='utf-8') as f:
    f.write(vite_content)
print("[OK] vite.config.js actualizado con API centralizada de prospectos y tareas")

# ---------------------------------------------------------------------------
# 2. ACTUALIZAR SERVER.CJS CON API DE PROSPECTS Y TAREAS
# ---------------------------------------------------------------------------
server_cjs_path = os.path.join(ROOT_DIR, 'server.cjs')

server_content = """/**
 * Servidor HTTP Backend Autónomo Node.js Grupo Sopena
 * Proporciona la API REST centralizada (/api/tasks y /api/prospects)
 * y sirve los estáticos compilados en producción para acceso multi-usuario.
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 5173;
const TASKS_FILE = path.join(__dirname, 'src', 'data', 'tasks.json');
const PROSPECTS_FILE = path.join(__dirname, 'src', 'data', 'prospects.json');
const EXCLUDED_FILE = path.join(__dirname, 'src', 'data', 'excludedCompanies.json');
const DIST_DIR = path.join(__dirname, 'dist');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2'
};

function readJson(file, fallback = []) {
  try {
    if (!fs.existsSync(file)) return fallback;
    const content = fs.readFileSync(file, 'utf-8');
    const parsed = JSON.parse(content);
    return parsed;
  } catch (e) {
    console.error(`[Backend Server] Error leyendo ${file}:`, e);
    return fallback;
  }
}

function writeJson(file, data) {
  try {
    const dir = path.dirname(file);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (e) {
    console.error(`[Backend Server] Error escribiendo ${file}:`, e);
    return false;
  }
}

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  res.end(JSON.stringify(data));
}

function parseBody(req, callback) {
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
}

const server = http.createServer((req, res) => {
  const parsed = url.parse(req.url, true);
  const pathname = parsed.pathname;

  // Manejo de CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    return res.end();
  }

  // ==========================================
  // API REST: /api/tasks (TAREAS CENTRALIZADAS)
  // ==========================================
  if (pathname.startsWith('/api/tasks')) {
    if (req.method === 'GET' && (pathname === '/api/tasks' || pathname === '/api/tasks/')) {
      let tasks = readJson(TASKS_FILE, []);
      const user = parsed.query && parsed.query.user;
      const zone = parsed.query && parsed.query.zone;
      if (zone && zone !== 'ALL') {
        tasks = tasks.filter(t => t.zone === zone || t.zone === 'ALL');
      }
      if (user && user !== 'admin' && user !== 'ccastro') {
        tasks = tasks.filter(t => t.assignedTo === user || t.createdBy === user);
      }
      return sendJson(res, 200, tasks);
    }

    if (req.method === 'POST' && (pathname === '/api/tasks' || pathname === '/api/tasks/' || pathname === '/api/tasks/sync')) {
      return parseBody(req, (err, payload) => {
        if (err) return sendJson(res, 400, { error: 'Payload JSON inválido' });

        let existingTasks = readJson(TASKS_FILE, []);
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

        writeJson(TASKS_FILE, existingTasks);
        return sendJson(res, 201, { success: true, tasks: existingTasks });
      });
    }

    if ((req.method === 'PATCH' || req.method === 'PUT') && pathname.startsWith('/api/tasks/')) {
      const cleanPath = pathname.replace('/api/tasks/', '');
      const isToggle = cleanPath.endsWith('/toggle');
      const taskIdStr = (isToggle ? cleanPath.replace('/toggle', '') : cleanPath).trim();

      return parseBody(req, (err, payload) => {
        let tasks = readJson(TASKS_FILE, []);
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

        writeJson(TASKS_FILE, tasks);
        return sendJson(res, 200, { success: true, tasks });
      });
    }

    if (req.method === 'DELETE' && pathname.startsWith('/api/tasks/')) {
      const taskIdStr = pathname.replace('/api/tasks/', '').trim();
      let tasks = readJson(TASKS_FILE, []);
      tasks = tasks.filter(t => String(t.id).trim() !== taskIdStr);
      writeJson(TASKS_FILE, tasks);
      return sendJson(res, 200, { success: true, deletedId: taskIdStr, tasks });
    }
  }

  // ==========================================
  // API REST: /api/prospects (BASE DE DATOS CENTRALIZADA NO-LOCAL)
  // ==========================================
  if (pathname.startsWith('/api/prospects')) {
    if (req.method === 'GET' && (pathname === '/api/prospects' || pathname === '/api/prospects/')) {
      const prospects = readJson(PROSPECTS_FILE, []);
      return sendJson(res, 200, prospects);
    }

    if (req.method === 'POST') {
      return parseBody(req, (err, payload) => {
        if (err) return sendJson(res, 400, { error: 'Payload JSON inválido' });

        let prospects = readJson(PROSPECTS_FILE, []);

        if (pathname === '/api/prospects/sync' || Array.isArray(payload) || (payload && payload.sync)) {
          const incoming = Array.isArray(payload) ? payload : (payload.modifications || payload.prospects || []);
          const added = payload.added || [];
          const deletedIds = new Set((payload.deleted || []).map(d => String(typeof d === 'object' ? d.id : d)));

          const map = new Map();
          prospects.forEach(p => map.set(String(p.id), p));

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

          added.forEach(add => {
            if (add && add.id && !map.has(String(add.id))) {
              map.set(String(add.id), add);
            }
          });

          deletedIds.forEach(delId => map.delete(delId));

          prospects = Array.from(map.values());
          writeJson(PROSPECTS_FILE, prospects);
          return sendJson(res, 200, { success: true, count: prospects.length, message: 'Base de datos sincronizada' });
        }

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

        writeJson(PROSPECTS_FILE, prospects);
        return sendJson(res, 201, { success: true, prospect: newProspect });
      });
    }

    if ((req.method === 'PUT' || req.method === 'PATCH') && pathname.startsWith('/api/prospects/')) {
      const prospectIdStr = pathname.replace('/api/prospects/', '').trim();

      return parseBody(req, (err, payload) => {
        if (err) return sendJson(res, 400, { error: 'Payload JSON inválido' });

        let prospects = readJson(PROSPECTS_FILE, []);
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

        writeJson(PROSPECTS_FILE, prospects);
        return sendJson(res, 200, { success: true, prospect: updated });
      });
    }

    if (req.method === 'DELETE' && pathname.startsWith('/api/prospects/')) {
      const prospectIdStr = pathname.replace('/api/prospects/', '').trim();
      let prospects = readJson(PROSPECTS_FILE, []);
      const target = prospects.find(p => String(p.id).trim() === prospectIdStr);

      prospects = prospects.filter(p => String(p.id).trim() !== prospectIdStr);
      writeJson(PROSPECTS_FILE, prospects);

      if (target) {
        let excluded = readJson(EXCLUDED_FILE, []);
        const alreadyExcluded = excluded.some(e => String(e.id || e).trim() === prospectIdStr);
        if (!alreadyExcluded) {
          excluded.push({
            id: target.id,
            name: target.name,
            cif: target.cif || '',
            reason: 'Baja solicitada por usuario en CRM',
            deletedAt: new Date().toISOString()
          });
          writeJson(EXCLUDED_FILE, excluded);
        }
      }

      return sendJson(res, 200, { success: true, deletedId: prospectIdStr });
    }
  }

  // ==========================================
  // SERVIR ARCHIVOS ESTÁTICOS DE PRODUCCIÓN
  // ==========================================
  let reqPath = parsed.pathname === '/' ? '/index.html' : parsed.pathname;
  let filePath = path.join(DIST_DIR, reqPath);

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      filePath = path.join(DIST_DIR, 'index.html');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (readErr, content) => {
      if (readErr) {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        return res.end('Error interno del servidor al leer archivo.');
      }
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    });
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`====================================================`);
  console.log(`🚀 SERVIDOR GRUPO SOPENA INICIADO EN PUERTO ${PORT}`);
  console.log(`📡 URL Local:           http://localhost:${PORT}`);
  console.log(`📋 API de Tareas BD:    http://localhost:${PORT}/api/tasks`);
  console.log(`🏢 API de Prospectos BD: http://localhost:${PORT}/api/prospects`);
  console.log(`💾 Base de datos:       ${PROSPECTS_FILE}`);
  console.log(`====================================================`);
});
"""

with open(server_cjs_path, 'w', encoding='utf-8') as f:
    f.write(server_content)
print("[OK] server.cjs actualizado con API centralizada de prospectos y tareas")

# ---------------------------------------------------------------------------
# 3. CREAR NETLIFY FUNCTION: netlify/functions/prospects.cjs
# ---------------------------------------------------------------------------
netlify_func_path = os.path.join(ROOT_DIR, 'netlify', 'functions', 'prospects.cjs')
os.makedirs(os.path.dirname(netlify_func_path), exist_ok=True)

netlify_func_content = """/**
 * Netlify Serverless Function para /api/prospects
 * Proporciona el backend cloud centralizado para acceso multi-usuario en Netlify.
 */
let initialProspects = [];
try {
  initialProspects = require('../../src/data/prospects.json');
} catch (e) {
  initialProspects = [];
}

let inMemoryProspects = Array.isArray(initialProspects) ? [...initialProspects] : [];

exports.handler = async (event) => {
  const method = event.httpMethod;
  const path = event.path;

  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  };

  if (method === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  // 1. GET /api/prospects
  if (method === 'GET') {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(inMemoryProspects)
    };
  }

  // 2. POST /api/prospects o /api/prospects/sync
  if (method === 'POST') {
    try {
      const payload = event.body ? JSON.parse(event.body) : {};

      if (path.endsWith('/sync') || Array.isArray(payload) || (payload && payload.sync)) {
        const incoming = Array.isArray(payload) ? payload : (payload.modifications || payload.prospects || []);
        const added = payload.added || [];
        const deletedIds = new Set((payload.deleted || []).map(d => String(typeof d === 'object' ? d.id : d)));

        const map = new Map();
        inMemoryProspects.forEach(p => map.set(String(p.id), p));

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

        added.forEach(add => {
          if (add && add.id && !map.has(String(add.id))) {
            map.set(String(add.id), add);
          }
        });

        deletedIds.forEach(delId => map.delete(delId));
        inMemoryProspects = Array.from(map.values());

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ success: true, count: inMemoryProspects.length })
        };
      }

      const newProspect = {
        id: payload.id || Date.now(),
        name: payload.name || 'Nueva Empresa',
        cif: payload.cif || '',
        pipelineStage: payload.pipelineStage || 'Prospección Inicial',
        ...payload,
        createdAt: payload.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const existingIdx = inMemoryProspects.findIndex(p => String(p.id) === String(newProspect.id));
      if (existingIdx >= 0) {
        inMemoryProspects[existingIdx] = { ...inMemoryProspects[existingIdx], ...newProspect };
      } else {
        inMemoryProspects.unshift(newProspect);
      }

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({ success: true, prospect: newProspect })
      };
    } catch (e) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Payload JSON inválido' })
      };
    }
  }

  // 3. PUT o PATCH /api/prospects/:id
  if (method === 'PUT' || method === 'PATCH') {
    try {
      const payload = event.body ? JSON.parse(event.body) : {};
      const segments = path.split('/').filter(Boolean);
      const prospectIdStr = segments[segments.length - 1].trim();

      let updated = null;
      let found = false;

      inMemoryProspects = inMemoryProspects.map(p => {
        if (String(p.id).trim() === prospectIdStr) {
          found = true;
          updated = { ...p, ...(payload || {}), updatedAt: new Date().toISOString() };
          return updated;
        }
        return p;
      });

      if (!found && payload && payload.id) {
        updated = { ...payload, updatedAt: new Date().toISOString() };
        inMemoryProspects.unshift(updated);
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, prospect: updated })
      };
    } catch (e) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Payload JSON inválido' })
      };
    }
  }

  // 4. DELETE /api/prospects/:id
  if (method === 'DELETE') {
    const segments = path.split('/').filter(Boolean);
    const prospectIdStr = segments[segments.length - 1].trim();

    inMemoryProspects = inMemoryProspects.filter(p => String(p.id).trim() !== prospectIdStr);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, deletedId: prospectIdStr })
    };
  }

  return {
    statusCode: 405,
    headers,
    body: JSON.stringify({ error: 'Método no permitido' })
  };
};
"""

with open(netlify_func_path, 'w', encoding='utf-8') as f:
    f.write(netlify_func_content)
print("[OK] netlify/functions/prospects.cjs creada")

# ---------------------------------------------------------------------------
# 4. ACTUALIZAR NETLIFY.TOML CON REDIRECTS PARA PROSPECTS
# ---------------------------------------------------------------------------
netlify_toml_path = os.path.join(ROOT_DIR, 'netlify.toml')
netlify_toml_content = """[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/api/tasks/*"
  to = "/.netlify/functions/tasks/:splat"
  status = 200

[[redirects]]
  from = "/api/tasks"
  to = "/.netlify/functions/tasks"
  status = 200

[[redirects]]
  from = "/api/prospects/*"
  to = "/.netlify/functions/prospects/:splat"
  status = 200

[[redirects]]
  from = "/api/prospects"
  to = "/.netlify/functions/prospects"
  status = 200

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
"""

with open(netlify_toml_path, 'w', encoding='utf-8') as f:
    f.write(netlify_toml_content)
print("[OK] netlify.toml actualizado con redirects de /api/prospects")

# ---------------------------------------------------------------------------
# 5. ACTUALIZAR SRC/APP.JSX
# ---------------------------------------------------------------------------
app_jsx_path = os.path.join(ROOT_DIR, 'src', 'App.jsx')
with open(app_jsx_path, 'r', encoding='utf-8') as f:
    app_text = f.read()

# 5.1 Corregir isLeadDormant para que arranque en 0 absoluto
old_is_lead_dormant = """export const isLeadDormant = (prospect) => {
  if (!prospect) return false;
  const stage = normalizePipelineStage(prospect.pipelineStage);
  if (stage === 'Cuenta Ganada' || stage === 'Descartado / Perdido') return false;

  let lastDateMs = null;
  if (prospect.contactDate) {
    const d = new Date(prospect.contactDate).getTime();
    if (!isNaN(d)) lastDateMs = d;
  }
  if (Array.isArray(prospect.history) && prospect.history.length > 0) {
    for (let i = prospect.history.length - 1; i >= 0; i--) {
      const h = prospect.history[i];
      if (h && h.date) {
        const d = new Date(h.date).getTime();
        if (!isNaN(d) && (!lastDateMs || d > lastDateMs)) {
          lastDateMs = d;
          break;
        }
      }
    }
  }
  if (!lastDateMs && prospect.createdAt) {
    const d = new Date(prospect.createdAt).getTime();
    if (!isNaN(d)) lastDateMs = d;
  }

  if (!lastDateMs) {
    return Boolean(prospect.contacted);
  }

  const diffDays = (Date.now() - lastDateMs) / (1000 * 60 * 60 * 24);
  return diffDays >= 15;
};"""

new_is_lead_dormant = """export const isLeadDormant = (prospect) => {
  if (!prospect) return false;
  // Un lead solo puede estar dormido si ya fue contactado activamente y cesó la comunicación (>15d)
  if (!prospect.contacted && !prospect.contactDate) return false;

  const stage = normalizePipelineStage(prospect.pipelineStage);
  if (stage === 'Cuenta Ganada' || stage === 'Descartado / Perdido' || stage === 'Prospección Inicial') return false;

  let lastDateMs = null;
  if (prospect.contactDate) {
    const d = new Date(prospect.contactDate).getTime();
    if (!isNaN(d)) lastDateMs = d;
  }
  if (Array.isArray(prospect.history) && prospect.history.length > 0) {
    for (let i = prospect.history.length - 1; i >= 0; i--) {
      const h = prospect.history[i];
      if (h && h.date) {
        const d = new Date(h.date).getTime();
        if (!isNaN(d) && (!lastDateMs || d > lastDateMs)) {
          lastDateMs = d;
          break;
        }
      }
    }
  }

  if (!lastDateMs) {
    return false; // Al empezar no hay ningún lead dormido
  }

  const diffDays = (Date.now() - lastDateMs) / (1000 * 60 * 60 * 24);
  return diffDays >= 15;
};"""

if old_is_lead_dormant in app_text:
    app_text = app_text.replace(old_is_lead_dormant, new_is_lead_dormant)
    print("[OK] isLeadDormant actualizado (0 leads dormidos al empezar)")
else:
    print("[WARN] old_is_lead_dormant no encontrado directamente; buscando coincidencia normalizada...")
    # fallback reemplazo por split
    import re
    app_text = re.sub(
        r'export const isLeadDormant = \(prospect\) => \{.*?return diffDays >= 15;\s*\};',
        new_is_lead_dormant,
        app_text,
        flags=re.DOTALL
    )
    print("[OK] isLeadDormant reemplazado con regex")

# 5.2 Eliminar la sección duplicada de obras con emojis placeholders en Dossier (líneas 4705-4743 aprox)
duplicate_placeholder_section = """                        {/* ANEXO: DOSSIER TÉCNICO DE OBRAS REALES */}
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
                        </div>"""

if duplicate_placeholder_section in app_text:
    app_text = app_text.replace(duplicate_placeholder_section, '')
    print("[OK] Sección duplicada con emojis en Dossier eliminada limpiamente")

# 5.3 Optimizar el contenedor a4-page y la exportación a PDF en App.jsx
app_text = app_text.replace(
    '<div className="a4-page" style={{padding: 0, overflow: \'hidden\', position: \'relative\', height: \'auto\', minHeight: \'297mm\'}}>',
    '<div className="a4-page" style={{padding: 0, overflow: \'visible\', position: \'relative\', height: \'auto\', minHeight: \'297mm\'}}>'
)

# 5.4 Asegurar precarga de imágenes y escala en handleExportPDF
old_handle_pdf = """      // --- 1. Capturar el DOM como imagen de alta resolución ---
      const canvas = await html2canvas(a4El, {
        scale: 2,               // 2x para mayor calidad (equivale a ~192 DPI)
        useCORS: true,          // Permitir imágenes externas (logos)
        allowTaint: false,
        logging: false,
        backgroundColor: '#ffffff'
      });"""

new_handle_pdf = """      // --- 1. Precargar todas las imágenes para garantizar renderizado perfecto ---
      const images = Array.from(a4El.querySelectorAll('img'));
      await Promise.all(images.map(img => {
        if (img.complete && img.naturalHeight !== 0) return Promise.resolve();
        return new Promise(resolve => {
          img.onload = resolve;
          img.onerror = resolve;
        });
      }));

      // Capturar el DOM como imagen de alta resolución sin recortes
      const canvas = await html2canvas(a4El, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 1200,
        onclone: (clonedDoc) => {
          const clonedA4 = clonedDoc.querySelector('.a4-page');
          if (clonedA4) {
            clonedA4.style.maxHeight = 'none';
            clonedA4.style.height = 'auto';
            clonedA4.style.overflow = 'visible';
            clonedA4.style.boxShadow = 'none';
          }
        }
      });"""

if old_handle_pdf in app_text:
    app_text = app_text.replace(old_handle_pdf, new_handle_pdf)
    print("[OK] handleExportPDF optimizado con precarga y onclone")

with open(app_jsx_path, 'w', encoding='utf-8') as f:
    f.write(app_text)
print("[OK] App.jsx actualizado con éxito")

