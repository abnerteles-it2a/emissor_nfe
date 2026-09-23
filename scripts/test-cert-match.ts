import fs from 'node:fs';
import { parsePfx } from '@fiscal/crypto';

const env = fs.readFileSync('.env', 'utf8');
const tfvars = fs.readFileSync('infra/terraform/terraform.tfvars', 'utf8');

const envCert = env.match(/CERT_PFX_BASE64="([^"]+)"/)?.[1];
const envPass = env.match(/CERT_PASSWORD="([^"]+)"/)?.[1];

const tfCert = tfvars.match(/cert_pfx_base64\s*=\s*"([^"]+)"/)?.[1];
const tfPass = tfvars.match(/cert_password\s*=\s*"([^"]+)"/)?.[1];

console.log('Pass match:', envPass === tfPass, 'envPass:', envPass, 'tfPass:', tfPass);
console.log('Cert length match:', envCert?.length, tfCert?.length);
console.log('Cert string exact match:', envCert === tfCert);

try {
  parsePfx(Buffer.from(envCert!, 'base64'), envPass!);
  console.log('✅ envCert + envPass parse SUCCESS');
} catch (e: any) {
  console.log('❌ envCert + envPass parse FAIL:', e.message);
}

try {
  parsePfx(Buffer.from(tfCert!, 'base64'), tfPass!);
  console.log('✅ tfCert + tfPass parse SUCCESS');
} catch (e: any) {
  console.log('❌ tfCert + tfPass parse FAIL:', e.message);
}
