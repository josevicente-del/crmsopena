/**
 * Netlify Serverless Function para /api/interactions y /api/audit-logs
 * Registra de forma centralizada todas las interacciones de los usuarios.
 */
let inMemoryLogs = [];

exports.handler = async (event) => {
  const method = event.httpMethod;

  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  };

  if (method === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  if (method === 'GET') {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(inMemoryLogs)
    };
  }

  if (method === 'POST') {
    try {
      const payload = event.body ? JSON.parse(event.body) : {};
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

      inMemoryLogs = [newLog, ...inMemoryLogs].slice(0, 1000);

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({ success: true, log: newLog })
      };
    } catch (e) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Payload JSON inválido' })
      };
    }
  }

  return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
};

