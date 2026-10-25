/**
 * Netlify Serverless Function para /api/tasks
 * Permite responder a las peticiones del CRM en despliegues en la nube Netlify.
 */
const initialTasks = require('../../src/data/tasks.json');

// Memoria viva del runtime serverless (con fallback a tasks.json)
let inMemoryTasks = [...initialTasks];

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

  // GET /api/tasks
  if (method === 'GET') {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(inMemoryTasks)
    };
  }

  // POST /api/tasks
  if (method === 'POST') {
    try {
      const payload = event.body ? JSON.parse(event.body) : {};
      if (Array.isArray(payload)) {
        inMemoryTasks = payload;
      } else if (payload && Array.isArray(payload.tasks)) {
        inMemoryTasks = payload.tasks;
      } else if (payload && payload.text) {
        const newTask = {
          id: payload.id || Date.now(),
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
        inMemoryTasks = [newTask, ...inMemoryTasks.filter(t => t.id !== newTask.id)];
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
    const taskIdStr = isToggle ? segments[segments.length - 2] : segments[segments.length - 1];

    inMemoryTasks = inMemoryTasks.map(t => {
      if (String(t.id) === taskIdStr) {
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
    const taskIdStr = segments[segments.length - 1];
    inMemoryTasks = inMemoryTasks.filter(t => String(t.id) !== taskIdStr);

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
