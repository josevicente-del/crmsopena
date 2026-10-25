/**
 * Servidor HTTP Backend Autónomo Node.js Grupo Sopena
 * Proporciona la API REST /api/tasks y sirve los estáticos compilados en producción.
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 5173;
const TASKS_FILE = path.join(__dirname, 'src', 'data', 'tasks.json');
const DIST_DIR = path.join(__dirname, 'dist');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2'
};

function readTasks() {
  try {
    if (!fs.existsSync(TASKS_FILE)) return [];
    const content = fs.readFileSync(TASKS_FILE, 'utf-8');
    const parsed = JSON.parse(content);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('[Backend Server] Error leyendo tasks.json:', e);
    return [];
  }
}

function writeTasks(tasks) {
  try {
    const dir = path.dirname(TASKS_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(TASKS_FILE, JSON.stringify(tasks, null, 2), 'utf-8');
    return true;
  } catch (e) {
    console.error('[Backend Server] Error escribiendo tasks.json:', e);
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
  // API REST: /api/tasks (SERVIDOR PERSISTENTE)
  // ==========================================
  if (pathname.startsWith('/api/tasks')) {
    // 1. GET /api/tasks
    if (req.method === 'GET' && (pathname === '/api/tasks' || pathname === '/api/tasks/')) {
      const tasks = readTasks();
      return sendJson(res, 200, tasks);
    }

    // 2. POST /api/tasks
    if (req.method === 'POST' && (pathname === '/api/tasks' || pathname === '/api/tasks/')) {
      return parseBody(req, (err, payload) => {
        if (err) return sendJson(res, 400, { error: 'Payload JSON inválido' });

        let tasks = readTasks();
        if (Array.isArray(payload)) {
          tasks = payload;
        } else if (payload && Array.isArray(payload.tasks)) {
          tasks = payload.tasks;
        } else if (payload && payload.text) {
          const newTask = {
            id: payload.id || (Date.now() + Math.floor(Math.random() * 1000)),
            prospectId: payload.prospectId || null,
            prospectName: payload.prospectName || 'Tarea General',
            text: payload.text,
            date: payload.date || new Date().toISOString(),
            dueDate: payload.dueDate || null,
            dueDateFormatted: payload.dueDateFormatted || null,
            completed: !!payload.completed,
            priority: payload.priority || 'Normal',
            category: payload.category || 'General'
          };
          tasks = [newTask, ...tasks.filter(t => t.id !== newTask.id)];
        }

        writeTasks(tasks);
        return sendJson(res, 201, { success: true, tasks });
      });
    }

    // 3. PATCH / PUT /api/tasks/:id
    if ((req.method === 'PATCH' || req.method === 'PUT') && pathname.startsWith('/api/tasks/')) {
      const cleanPath = pathname.replace('/api/tasks/', '');
      const isToggle = cleanPath.endsWith('/toggle');
      const taskIdStr = isToggle ? cleanPath.replace('/toggle', '') : cleanPath;

      return parseBody(req, (err, payload) => {
        let tasks = readTasks();
        tasks = tasks.map(t => {
          if (String(t.id) === taskIdStr) {
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

        writeTasks(tasks);
        return sendJson(res, 200, { success: true, tasks });
      });
    }

    // 4. DELETE /api/tasks/:id
    if (req.method === 'DELETE' && pathname.startsWith('/api/tasks/')) {
      const taskIdStr = pathname.replace('/api/tasks/', '').trim();
      let tasks = readTasks();
      tasks = tasks.filter(t => String(t.id) !== taskIdStr);
      writeTasks(tasks);
      return sendJson(res, 200, { success: true, deletedId: taskIdStr, tasks });
    }

    return sendJson(res, 405, { error: 'Método no permitido' });
  }

  // ==========================================
  // SERVIR CLIENTE FRONTEND (SPA FALLBACK)
  // ==========================================
  let filePath = path.join(DIST_DIR, pathname === '/' ? 'index.html' : pathname);
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(DIST_DIR, 'index.html');
  }

  if (fs.existsSync(filePath)) {
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('CRM Sopena - Archivo no encontrado. Ejecuta npm run build primero.');
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 [Servidor CRM Sopena] Activo en http://localhost:${PORT}`);
  console.log(`📁 [Persistencia] Tareas almacenadas en ${TASKS_FILE}`);
});
