const http = require('http');

async function check() {
  const res = await fetch('http://localhost:3001');
  const html = await res.text();
  console.log('Home Status:', res.status);
  const regex = /href="([^"]+\.css[^"]*)"/g;
  let match;
  while ((match = regex.exec(html)) !== null) {
    const cssUrl = match[1];
    const cssRes = await fetch('http://localhost:3001' + cssUrl);
    console.log('CSS:', cssUrl, '=>', cssRes.status, cssRes.headers.get('content-type'));
  }
}

check().catch(console.error);
