import { ECRClient, GetAuthorizationTokenCommand } from '@aws-sdk/client-ecr';
import { execSync } from 'node:child_process';

async function main() {
  const region = process.env.AWS_REGION || 'sa-east-1';
  const client = new ECRClient({
    region,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || process.env.ACCESS_KEY_ID || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || process.env.SECRET_ACCESS_KEY || '',
    },
  });

  console.log('Solicitando token de autenticacao do Amazon ECR em', region, '...');
  const response = await client.send(new GetAuthorizationTokenCommand({}));

  const authData = response.authorizationData?.[0];
  if (!authData || !authData.authorizationToken || !authData.proxyEndpoint) {
    throw new Error('Nao foi possivel obter dados de autorizacao do ECR');
  }

  const decoded = Buffer.from(authData.authorizationToken, 'base64').toString('utf8');
  const [username, password] = decoded.split(':');
  const endpoint = authData.proxyEndpoint.replace('https://', '');

  console.log(`Efetuando login no Docker para o endpoint: ${endpoint} ...`);
  const loginCommand = `docker login -u ${username} -p ${password} ${endpoint}`;
  execSync(loginCommand, { stdio: 'inherit' });
  console.log('Login no Amazon ECR realizado com sucesso!');
}

main().catch((err) => {
  console.error('Falha no login ECR:', err);
  process.exit(1);
});
