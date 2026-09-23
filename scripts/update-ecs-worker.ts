import { 
  ECSClient, 
  DescribeTaskDefinitionCommand, 
  RegisterTaskDefinitionCommand, 
  UpdateServiceCommand 
} from '@aws-sdk/client-ecs';
import fs from 'node:fs';

const region = 'sa-east-1';
const credentials = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID || process.env.ACCESS_KEY_ID || '',
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || process.env.SECRET_ACCESS_KEY || '',
};

const certPfxBase64 = process.env.CERT_PFX_BASE64;
const certPassword = process.env.CERT_PASSWORD;

if (!certPfxBase64 || !certPassword) {
  throw new Error('Certificado e senha devem estar definidos no .env');
}

const ecs = new ECSClient({ region, credentials });

async function update() {
  console.log('🚀 Atualizando Task Definition do Worker no ECS com certificado A1 verificado...');

  const cluster = 'emissor-fiscal-cluster-staging';
  const service = 'emissor-fiscal-worker-staging';
  const family = 'emissor-fiscal-worker-staging';

  // 1. Obter a Task Definition atual
  const currentDef = await ecs.send(new DescribeTaskDefinitionCommand({ taskDefinition: family }));
  const taskDef = currentDef.taskDefinition;

  if (!taskDef) {
    throw new Error('Task definition não encontrada: ' + family);
  }

  console.log(`📋 Task Definition atual: ${taskDef.taskDefinitionArn} (Rev: ${taskDef.revision})`);

  // 2. Modifica as variáveis de ambiente do container 'worker'
  const containerDefinitions = taskDef.containerDefinitions?.map((c) => {
    if (c.name === 'worker') {
      const envVars = (c.environment || []).filter(
        (e) => e.name !== 'CERT_PFX_BASE64' && e.name !== 'CERT_PASSWORD'
      );

      envVars.push({ name: 'CERT_PFX_BASE64', value: certPfxBase64 });
      envVars.push({ name: 'CERT_PASSWORD', value: certPassword });

      return {
        ...c,
        environment: envVars,
      };
    }
    return c;
  });

  // 3. Registra a nova revisão da Task Definition
  const newDef = await ecs.send(
    new RegisterTaskDefinitionCommand({
      family: taskDef.family,
      taskRoleArn: taskDef.taskRoleArn,
      executionRoleArn: taskDef.executionRoleArn,
      networkMode: taskDef.networkMode,
      containerDefinitions,
      requiresCompatibilities: taskDef.requiresCompatibilities,
      cpu: taskDef.cpu,
      memory: taskDef.memory,
    })
  );

  const newArn = newDef.taskDefinition?.taskDefinitionArn;
  console.log(`✅ Nova Task Definition registrada com sucesso: ${newArn} (Rev: ${newDef.taskDefinition?.revision})`);

  // 4. Atualiza o serviço no ECS Fargate com a nova revisão
  console.log(`🔄 Atualizando o serviço ${service} no cluster ${cluster}...`);
  const updateRes = await ecs.send(
    new UpdateServiceCommand({
      cluster,
      service,
      taskDefinition: newArn,
      forceNewDeployment: true,
    })
  );

  console.log(`🎉 Serviço atualizado com sucesso! Status do deployment: ${updateRes.service?.status}`);
  console.log('Fargate iniciará a nova task com o certificado A1 corrigido em instantes.');
}

update().catch(console.error);
