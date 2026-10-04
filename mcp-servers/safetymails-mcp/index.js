#!/usr/bin/env node
/**
 * SafetyMails MCP Server
 * Conector MCP para la API y script de SafetyMails (https://www.safetymails.com)
 * Permite validar correos electrónicos en tiempo real comprobando sintaxis,
 * validez de buzón, estado de riesgo y entregabilidad.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import crypto from 'node:crypto';

// Parámetros de configuración extraídos del script de SafetyMails
const TICKET_ORIGEM = process.env.SAFETYMAILS_TICKET || '75f9fbeddb6d1f10294ef22b8a9c95391b4c7b11';
const C1 = process.env.SAFETYMAILS_C1 || '97a8c565af';
const FIELD_EMAIL_CODE = process.env.SAFETYMAILS_FIELD_CODE || '2d3981ee5c';
const OFFSET_RIGHT = process.env.SAFETYMAILS_OFFSET_RIGHT || '5098f39262';
const OFFSET_LOADING_RIGHT = process.env.SAFETYMAILS_OFFSET_LOADING_RIGHT || '4cd9841858';
const AUTHORIZED_DOMAIN = process.env.SAFETYMAILS_AUTHORIZED_DOMAIN || '';

/**
 * Realiza la llamada a la API de SafetyMails para un email dado
 * @param {string} email - Correo a verificar
 * @param {string} [originUrl] - URL o dominio de origen autorizado
 * @returns {Promise<any>}
 */
async function callSafetyMailsApi(email, originUrl = '') {
  const effectiveOrigin = originUrl || AUTHORIZED_DOMAIN || 'https://safetymails.com/';
  const a = `${OFFSET_RIGHT}${OFFSET_LOADING_RIGHT}`;
  const regPage = `${FIELD_EMAIL_CODE}${C1}`;
  const tmp = `${a}${regPage}`;
  const k = crypto.createHash('sha1').update(TICKET_ORIGEM).digest('hex');
  const endpoint = `https://${TICKET_ORIGEM}.safetymails.com/api/${k}`;

  const h = crypto.createHmac('sha256', tmp).update(email).digest('hex');
  const h34 = crypto.createHash('sha1').update(effectiveOrigin).digest('hex');

  const formData = new FormData();
  formData.append('email', email);
  formData.append('H34', h34);
  formData.append('version', '6.3');
  formData.append('address', effectiveOrigin);

  const headers = {
    'Sf-Hmac': h,
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  };

  if (effectiveOrigin) {
    headers['Referer'] = effectiveOrigin;
    try {
      headers['Origin'] = new URL(effectiveOrigin).origin;
    } catch {
      // Ignorar si no es una URL parseable
    }
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    body: formData,
    headers
  });

  const text = await response.text();
  try {
    const json = JSON.parse(text);
    return {
      status: response.status,
      ok: response.ok,
      data: json
    };
  } catch {
    return {
      status: response.status,
      ok: response.ok,
      raw: text
    };
  }
}

// Inicialización del servidor MCP
const server = new Server(
  {
    name: 'safetymails-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Definición de las herramientas del servidor
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'verify_email_safetymails',
        description: 'Verifica la entregabilidad y estado de un correo con SafetyMails API (script ticket). Comprueba si es válido, inválido o spam.',
        inputSchema: {
          type: 'object',
          properties: {
            email: {
              type: 'string',
              description: 'El correo electrónico a validar (ej: compras@empresa.com)',
            },
            origin_domain: {
              type: 'string',
              description: 'URL o dominio de origen registrado en SafetyMails (opcional)',
            },
          },
          required: ['email'],
        },
      },
      {
        name: 'get_safetymails_status',
        description: 'Consulta los parámetros de configuración y el estado de la conexión con SafetyMails.',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
    ],
  };
});

// Manejador de llamadas a herramientas
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (name === 'verify_email_safetymails') {
      const email = args?.email;
      if (!email) {
        return {
          content: [{ type: 'text', text: 'Error: El parámetro "email" es obligatorio.' }],
          isError: true,
        };
      }

      const result = await callSafetyMailsApi(email, args?.origin_domain);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }

    if (name === 'get_safetymails_status') {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              ticket: TICKET_ORIGEM,
              c1: C1,
              authorized_domain: AUTHORIZED_DOMAIN || '(pendiente de especificar por usuario)',
              version: '6.3'
            }, null, 2),
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

async function run() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

run().catch((error) => {
  process.stderr.write(`Error fatal en safetymails-mcp-server: ${error.stack}\n`);
  process.exit(1);
});
