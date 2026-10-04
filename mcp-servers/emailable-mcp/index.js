#!/usr/bin/env node
/**
 * Emailable MCP Server
 * Conector MCP para la API de verificación de emails de Emailable (https://emailable.com)
 * Permite a agentes IA verificar el estado de entregabilidad, registros MX,
 * detección de buzones desechables, catch-all y calidad de correos.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import https from 'node:https';

const API_KEY = process.env.EMAILABLE_API_KEY || 'live_108b9c493b9a8eb668bf';

/**
 * Función auxiliar para realizar peticiones HTTPS GET a la API de Emailable
 * @param {string} path - Ruta relativa de la API (ej: /v1/verify)
 * @param {object} params - Parámetros de consulta
 * @returns {Promise<any>}
 */
function callEmailableApi(path, params = {}) {
  return new Promise((resolve, reject) => {
    const query = new URLSearchParams({ ...params, api_key: API_KEY }).toString();
    const url = `https://api.emailable.com${path}?${query}`;

    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (err) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

// Inicializar el servidor MCP
const server = new Server(
  {
    name: 'emailable-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Definición de las herramientas expuestas por el servidor MCP
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'verify_email',
        description: 'Verifica la entregabilidad, estado de servidor MX, buzón desechable y validez de un correo electrónico con Emailable.',
        inputSchema: {
          type: 'object',
          properties: {
            email: {
              type: 'string',
              description: 'El correo electrónico que se desea verificar (ej: compras@empresa.com)',
            },
          },
          required: ['email'],
        },
      },
      {
        name: 'get_account_balance',
        description: 'Consulta los créditos disponibles y el estado de la cuenta en Emailable.',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
    ],
  };
});

// Manejador de ejecución de herramientas
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (name === 'verify_email') {
      const email = args?.email;
      if (!email) {
        return {
          content: [{ type: 'text', text: 'Error: El parámetro "email" es obligatorio.' }],
          isError: true,
        };
      }

      const result = await callEmailableApi('/v1/verify', { email });
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result.data || result, null, 2),
          },
        ],
      };
    }

    if (name === 'get_account_balance') {
      const result = await callEmailableApi('/v1/account');
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result.data || result, null, 2),
          },
        ],
      };
    }

    throw new Error(`Herramienta no reconocida: ${name}`);
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error ejecutando ${name}: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

// Conectar con el transporte estándar Stdio de MCP
async function run() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

run().catch((error) => {
  process.stderr.write(`Error fatal en emailable-mcp-server: ${error.stack}\n`);
  process.exit(1);
});
