/**
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
