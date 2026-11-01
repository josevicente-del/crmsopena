/**
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
const AUDIT_FILE = path.join(__dirname, 'src', 'data', 'audit_logs.json');
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
      if (user && user !== 'admin' && user !== 'norte1') {
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
  // API DE AUDITORÍA E INTERACCIONES (/api/interactions)
  // ==========================================
  if (pathname === '/api/interactions' || pathname === '/api/audit-logs' || pathname === '/api/interactions/' || pathname === '/api/audit-logs/') {
    if (req.method === 'GET') {
      const logs = readJson(AUDIT_FILE, []);
      return sendJson(res, 200, logs);
    }

    if (req.method === 'POST') {
      return parseBody(req, (err, payload) => {
        if (err) return sendJson(res, 400, { error: 'Payload JSON inválido' });

        const logs = readJson(AUDIT_FILE, []);
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

        const updatedLogs = [newLog, ...logs].slice(0, 1000);
        writeJson(AUDIT_FILE, updatedLogs);
        return sendJson(res, 201, { success: true, log: newLog });
      });
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
