import fs from 'fs';
import dns from 'dns/promises';
import net from 'net';

const prospects = JSON.parse(fs.readFileSync('src/data/prospects.json', 'utf8'));

// Comprobación de buzón individual mediante Socket TCP SMTP (Handshake RFC 5321)
function verifySmtpMailbox(email, mxHost, timeoutMs = 8000) {
  return new Promise((resolve) => {
    let step = 0;
    let resolved = false;
    let serverBanner = '';

    const socket = net.createConnection(25, mxHost);
    socket.setTimeout(timeoutMs);

    const finish = (result) => {
      if (!resolved) {
        resolved = true;
        try {
          socket.write('QUIT\r\n');
          socket.end();
          socket.destroy();
        } catch (e) {}
        resolve(result);
      }
    };

    socket.on('timeout', () => {
      finish({ status: 'TIMEOUT', code: 0, message: 'Conexión SMTP expirada (posible bloqueo de puerto 25 por ISP/Firewall)' });
    });

    socket.on('error', (err) => {
      finish({ status: 'ERROR', code: 0, message: err.message });
    });

    socket.on('data', (chunk) => {
      const response = chunk.toString();
      const code = parseInt(response.substring(0, 3), 10);

      if (step === 0) {
        serverBanner = response.trim();
        if (code === 220) {
          step = 1;
          socket.write('HELO verify.crm.sopena.es\r\n');
        } else {
          finish({ status: 'REJECTED_BANNER', code, message: response });
        }
      } else if (step === 1) {
        if (code === 250) {
          step = 2;
          socket.write('MAIL FROM:<check@verify.crm.sopena.es>\r\n');
        } else {
          finish({ status: 'REJECTED_HELO', code, message: response });
        }
      } else if (step === 2) {
        if (code === 250) {
          step = 3;
          socket.write(`RCPT TO:<${email}>\r\n`);
        } else {
          finish({ status: 'REJECTED_MAIL_FROM', code, message: response });
        }
      } else if (step === 3) {
        if (code === 250) {
          finish({ status: 'DELIVERABLE', code: 250, message: 'Buzón aceptado por el servidor receptor' });
        } else if (code === 550 || code === 551 || code === 553) {
          finish({ status: 'UNDELIVERABLE_BOUNCE', code, message: 'Buzón no existe (rebote garantizado)' });
        } else if (code === 450 || code === 451 || code === 452) {
          finish({ status: 'GREYLISTED_TEMP', code, message: 'Greylisting / Límite temporal del servidor' });
        } else {
          finish({ status: 'UNKNOWN_RESPONSE', code, message: response.trim() });
        }
      }
    });
  });
}

async function testSample() {
  console.log('--- TEST DE CONECTIVIDAD SMTP PUERTO 25 ---');
  // Probar con 3 servidores de muestra
  const testCases = [
    { email: prospects[0].email, domain: prospects[0].email.split('@')[1] },
    { email: prospects[1].email, domain: prospects[1].email.split('@')[1] },
    { email: prospects[2].email, domain: prospects[2].email.split('@')[1] }
  ];

  for (const t of testCases) {
    try {
      const records = await dns.resolveMx(t.domain);
      const host = records[0].exchange;
      console.log(`Verificando ${t.email} contra ${host}...`);
      const res = await verifySmtpMailbox(t.email, host, 6000);
      console.log(`Resultado: ${res.status} | Código: ${res.code} | ${res.message}`);
    } catch(err) {
      console.log(`Error DNS/Host para ${t.email}: ${err.message}`);
    }
  }
}

testSample();
