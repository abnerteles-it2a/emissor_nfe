import fs from 'node:fs';

const env = fs.readFileSync('.env', 'utf8');
const envCert = env.match(/CERT_PFX_BASE64="([^"]+)"/)?.[1];
const envPass = env.match(/CERT_PASSWORD="([^"]+)"/)?.[1];

if (!envCert || !envPass) {
  throw new Error('Cert not found in .env');
}

const tfvarsPath = 'infra/terraform/terraform.tfvars';
let tfvars = fs.readFileSync(tfvarsPath, 'utf8');

tfvars = tfvars.replace(/cert_pfx_base64\s*=\s*"[^"]+"/, `cert_pfx_base64 = "${envCert}"`);
tfvars = tfvars.replace(/cert_password\s*=\s*"[^"]+"/, `cert_password   = "${envPass}"`);

fs.writeFileSync(tfvarsPath, tfvars, 'utf8');
console.log('✅ terraform.tfvars updated with valid cert from .env');
