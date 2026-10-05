import crypto from 'crypto';

const TICKET_ORIGEM = '75f9fbeddb6d1f10294ef22b8a9c95391b4c7b11';
const C1 = '97a8c565af';
const FIELD_EMAIL_CODE = '2d3981ee5c';
const OFFSET_RIGHT = '5098f39262';
const OFFSET_LOADING_RIGHT = '4cd9841858';
const AUTHORIZED_DOMAIN = 'https://gmail.com/';

async function testCall() {
  const a = OFFSET_RIGHT + OFFSET_LOADING_RIGHT;
  const regPage = FIELD_EMAIL_CODE + C1;
  const tmp = a + regPage;
  const k = crypto.createHash('sha1').update(TICKET_ORIGEM).digest('hex');
  const endpoint = 'https://' + TICKET_ORIGEM + '.safetymails.com/api/' + k;

  const email = 'info@aluminiosoler.com';
  const h = crypto.createHmac('sha256', tmp).update(email).digest('hex');
  const h34 = crypto.createHash('sha1').update(AUTHORIZED_DOMAIN).digest('hex');

  const formData = new FormData();
  formData.append('email', email);
  formData.append('H34', h34);
  formData.append('version', '6.3');
  formData.append('address', AUTHORIZED_DOMAIN);

  const res = await fetch(endpoint, {
    method: 'POST',
    body: formData,
    headers: {
      'Sf-Hmac': h,
      'Referer': AUTHORIZED_DOMAIN,
      'Origin': 'https://gmail.com',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  });

  console.log('HTTP Status:', res.status);
  const text = await res.text();
  console.log('Body:', text);
}

testCall();
