import { ECSClient, ListTasksCommand, DescribeTasksCommand, DescribeServicesCommand } from '@aws-sdk/client-ecs';
import { CloudWatchLogsClient, GetLogEventsCommand, DescribeLogStreamsCommand } from '@aws-sdk/client-cloudwatch-logs';

const region = 'sa-east-1';
const credentials = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID || process.env.ACCESS_KEY_ID || '',
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || process.env.SECRET_ACCESS_KEY || '',
};

const ecs = new ECSClient({ region, credentials });
const logs = new CloudWatchLogsClient({ region, credentials });

async function check() {
  const cluster = 'emissor-fiscal-cluster-staging';
  console.log('--- 1. Verificando Todos os Servicos ECS ---');
  const servicesList = await ecs.send(new (await import('@aws-sdk/client-ecs')).ListServicesCommand({ cluster }));
  console.log('Serviços no cluster:', servicesList.serviceArns);
  if (servicesList.serviceArns && servicesList.serviceArns.length > 0) {
    const serviceRes = await ecs.send(new DescribeServicesCommand({ cluster, services: servicesList.serviceArns }));
    for (const service of serviceRes.services || []) {
      console.log(`\nServiço: ${service.serviceName}`);
      console.log(`  Running: ${service.runningCount}, Desired: ${service.desiredCount}, Pending: ${service.pendingCount}`);
      console.log('  Eventos recentes:');
      service.events?.slice(0, 3).forEach((e) => console.log(`    [${e.createdAt?.toISOString()}] ${e.message}`));
    }
  }

  console.log('\n--- 2. Verificando Tasks Paradas (Stopped) ---');
  const stoppedTasks = await ecs.send(new ListTasksCommand({ cluster, desiredStatus: 'STOPPED', maxResults: 5 }));
  if (stoppedTasks.taskArns && stoppedTasks.taskArns.length > 0) {
    const desc = await ecs.send(new DescribeTasksCommand({ cluster, tasks: stoppedTasks.taskArns }));
    for (const t of desc.tasks || []) {
      console.log(`Task ARN: ${t.taskArn}`);
      console.log(`  Stopped reason: ${t.stoppedReason}`);
      console.log(`  Stop code: ${t.stopCode}`);
      for (const c of t.containers || []) {
        console.log(`  Container: ${c.name} | ExitCode: ${c.exitCode} | Reason: ${c.reason}`);
      }
    }
  } else {
    console.log('Nenhuma task parada encontrada.');
  }

  console.log('\n--- 3. Verificando Grupos de Logs e Logs do CloudWatch ---');
  try {
    const lgRes = await logs.send(new (await import('@aws-sdk/client-cloudwatch-logs')).DescribeLogGroupsCommand({ logGroupNamePrefix: '/ecs/' }));
    console.log('Log groups /ecs/:', lgRes.logGroups?.map((g) => g.logGroupName));

    for (const lg of lgRes.logGroups || []) {
      const logGroupName = lg.logGroupName!;
      const streams = await logs.send(new DescribeLogStreamsCommand({ logGroupName, orderBy: 'LastEventTime', descending: true, limit: 1 }));
      if (streams.logStreams && streams.logStreams.length > 0) {
        for (const s of streams.logStreams) {
          console.log(`\nLog Stream: ${logGroupName} -> ${s.logStreamName}`);
          const events = await logs.send(new GetLogEventsCommand({ logGroupName, logStreamName: s.logStreamName!, limit: 10 }));

          events.events?.forEach((ev) => console.log(`  [${new Date(ev.timestamp || 0).toISOString()}] ${ev.message}`));
        }
      }
    }
  } catch (err: any) {
    console.log('Erro ao ler CloudWatch logs:', err.message);
  }
}

check().catch(console.error);
