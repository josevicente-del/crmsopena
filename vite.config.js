import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'

/**
 * Plugin de Vite para servir la API de Tareas directamente en el Servidor (Node.js)
 * Permite persistir todas las tareas comerciales en src/data/tasks.json en el servidor.
 */
function tasksApiPlugin() {
  const getTasksFilePath = (root) => path.resolve(root || process.cwd(), 'src/data/tasks.json');

  const readTasks = (filePath) => {
    try {
      if (!fs.existsSync(filePath)) {
        return [];
      }
      const raw = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error('[Tasks Server API] Error reading tasks:', e);
      return [];
    }
  };

  const writeTasks = (filePath, tasks) => {
    try {
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(filePath, JSON.stringify(tasks, null, 2), 'utf-8');
      return true;
    } catch (e) {
      console.error('[Tasks Server API] Error writing tasks:', e);
      return false;
    }
  };

  const setupMiddleware = (server) => {
    server.middlewares.use((req, res, next) => {
      const parsedUrl = new URL(req.url, 'http://localhost');
      const pathname = parsedUrl.pathname;

      if (!pathname.startsWith('/api/tasks')) {
        return next();
      }

      const tasksFilePath = getTasksFilePath(server.config ? server.config.root : process.cwd());

      const sendJson = (status, data) => {
        res.statusCode = status;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify(data));
      };

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

      // 1. GET /api/tasks: Leer todas las tareas del servidor
      if (req.method === 'GET' && (pathname === '/api/tasks' || pathname === '/api/tasks/')) {
        const tasks = readTasks(tasksFilePath);
        return sendJson(200, tasks);
      }

      // 2. POST /api/tasks: Guardar tarea nueva o volcar tareas en el servidor
      if (req.method === 'POST' && (pathname === '/api/tasks' || pathname === '/api/tasks/')) {
        return parseBody((err, payload) => {
          if (err) {
            return sendJson(400, { error: 'Invalid JSON payload' });
          }

          let tasks = readTasks(tasksFilePath);

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

          writeTasks(tasksFilePath, tasks);
          return sendJson(201, { success: true, tasks });
        });
      }

      // 3. PATCH o PUT /api/tasks/:id: Actualizar o alternar estado de tarea en el servidor
      if ((req.method === 'PATCH' || req.method === 'PUT') && pathname.startsWith('/api/tasks/')) {
        const cleanPath = pathname.replace('/api/tasks/', '');
        const isToggle = cleanPath.endsWith('/toggle');
        const taskIdStr = isToggle ? cleanPath.replace('/toggle', '') : cleanPath;

        return parseBody((err, payload) => {
          let tasks = readTasks(tasksFilePath);
          let found = false;

          tasks = tasks.map(t => {
            if (String(t.id) === taskIdStr) {
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

          writeTasks(tasksFilePath, tasks);
          return sendJson(200, { success: true, tasks });
        });
      }

      // 4. DELETE /api/tasks/:id: Eliminar tarea del servidor
      if (req.method === 'DELETE' && pathname.startsWith('/api/tasks/')) {
        const taskIdStr = pathname.replace('/api/tasks/', '').trim();
        let tasks = readTasks(tasksFilePath);
        tasks = tasks.filter(t => String(t.id) !== taskIdStr);
        writeTasks(tasksFilePath, tasks);
        return sendJson(200, { success: true, deletedId: taskIdStr, tasks });
      }

      return sendJson(405, { error: 'Method not allowed' });
    });
  };

  return {
    name: 'vite-plugin-tasks-api',
    configureServer(server) {
      setupMiddleware(server);
    },
    configurePreviewServer(server) {
      setupMiddleware(server);
    }
  };
}

// Configuración corporativa Vite: Exposición en 0.0.0.0 para acceso local y de red con API de tareas en servidor
export default defineConfig({
  plugins: [
    react(),
    tasksApiPlugin()
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
