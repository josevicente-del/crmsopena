/**
 * Netlify Serverless Function para /api/tasks
 * Permite responder a las peticiones del CRM en despliegues en la nube Netlify.
 */
let initialTasks = [];
try {
  initialTasks = require('../../src/data/tasks.json');
} catch (e) {
  initialTasks = [];
}

// Memoria viva del runtime serverless (con fallback a tasks.json)
let inMemoryTasks = Array.isArray(initialTasks) ? [...initialTasks] : [];

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

  // GET /api/tasks (con soporte de filtrado por privilegios)
  if (method === 'GET') {
    let result = inMemoryTasks;
    const query = event.queryStringParameters || {};
    const user = query.user;
    const zone = query.zone;
    if (zone && zone !== 'ALL') {
      result = result.filter(t => t.zone === zone || t.zone === 'ALL');
    }
    if (user && user !== 'admin' && user !== 'ccastro') {
      result = result.filter(t => t.assignedTo === user || t.createdBy === user);
    }
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result)
    };
  }

  // POST /api/tasks o /api/tasks/sync
  if (method === 'POST') {
    try {
      const payload = event.body ? JSON.parse(event.body) : {};
      if (Array.isArray(payload) || (payload && Array.isArray(payload.tasks))) {
        const incoming = Array.isArray(payload) ? payload : payload.tasks;
        const map = new Map();
        inMemoryTasks.forEach(t => map.set(String(t.id).trim(), t));
        incoming.forEach(t => {
          if (t && t.id) map.set(String(t.id).trim(), t);
        });
        inMemoryTasks = Array.from(map.values());
      } else if (payload && payload.text) {
        const newTask = {
          id: payload.id || Date.now(),
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
        inMemoryTasks = [newTask, ...inMemoryTasks.filter(t => String(t.id).trim() !== String(newTask.id).trim())];
      }

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({ success: true, tasks: inMemoryTasks })
      };
    } catch (e) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Payload JSON inválido' })
      };
    }
  }

  // PATCH / PUT /api/tasks/:id/toggle
  if (method === 'PATCH' || method === 'PUT') {
    const isToggle = path.endsWith('/toggle');
    const segments = path.split('/').filter(Boolean);
    const taskIdStr = (isToggle ? segments[segments.length - 2] : segments[segments.length - 1]).trim();

    inMemoryTasks = inMemoryTasks.map(t => {
      if (String(t.id).trim() === taskIdStr) {
        if (isToggle) {
          return {
            ...t,
            completed: !t.completed,
            completedAt: !t.completed ? new Date().toISOString() : null
          };
        }
      }
      return t;
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, tasks: inMemoryTasks })
    };
  }

  // DELETE /api/tasks/:id
  if (method === 'DELETE') {
    const segments = path.split('/').filter(Boolean);
    const taskIdStr = segments[segments.length - 1].trim();
    inMemoryTasks = inMemoryTasks.filter(t => String(t.id).trim() !== taskIdStr);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, deletedId: taskIdStr, tasks: inMemoryTasks })
    };
  }

  return {
    statusCode: 405,
    headers,
    body: JSON.stringify({ error: 'Método no permitido' })
  };
};
