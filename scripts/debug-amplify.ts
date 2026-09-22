import fs from 'fs';
import {
  AmplifyClient,
  GetAppCommand,
  UpdateAppCommand,
  ListBranchesCommand,
  ListJobsCommand,
  StartJobCommand,
  GetJobCommand,
  ListDomainAssociationsCommand,
} from '@aws-sdk/client-amplify';

const region = 'sa-east-1';
const credentials = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID || process.env.ACCESS_KEY_ID || '',
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || process.env.SECRET_ACCESS_KEY || '',
};

const amplify = new AmplifyClient({ region, credentials });

async function checkAmplify() {
  const appId = 'd15241n8smr1hf';
  const branchName = 'main';

  console.log('--- 0. Syncing buildSpec from amplify.yml ---');
  if (fs.existsSync('amplify.yml')) {
    const buildSpec = fs.readFileSync('amplify.yml', 'utf8');
    await amplify.send(new UpdateAppCommand({ appId, buildSpec }));
    console.log('Amplify buildSpec updated successfully!');
  }

  console.log('\n--- 1. App Info ---');
  const appRes = await amplify.send(new GetAppCommand({ appId }));
  console.log(`App: ${appRes.app?.name} | Repo: ${appRes.app?.repository}`);


  console.log('\n--- 2. Branches ---');
  const branches = await amplify.send(new ListBranchesCommand({ appId }));
  for (const b of branches.branches || []) {
    console.log(`Branch: ${b.branchName} | Framework: ${b.framework} | Stage: ${b.stage}`);
  }

  console.log('\n--- 3. Jobs / Builds ---');
  let jobs = await amplify.send(new ListJobsCommand({ appId, branchName, maxResults: 3 }));
  const latest = jobs.jobSummaries?.[0];

  // Se o último job falhou ou não tem job rodando, dispara novo build
  if (!latest || latest.status === 'FAILED') {
    console.log(`Último job (${latest?.jobId}) status: ${latest?.status}. Disparando novo build...`);
    const start = await amplify.send(new StartJobCommand({ appId, branchName, jobType: 'RELEASE' }));
    console.log(`Novo Job disparado! ID: ${start.jobSummary?.jobId} | Status: ${start.jobSummary?.status}`);
    jobs = await amplify.send(new ListJobsCommand({ appId, branchName, maxResults: 3 }));
  }

  for (const j of jobs.jobSummaries || []) {
    console.log(`\nJob ID: ${j.jobId} | Status: ${j.status} | Start: ${j.startTime?.toISOString()} | End: ${j.endTime?.toISOString()}`);
    const detail = await amplify.send(new GetJobCommand({ appId, branchName, jobId: j.jobId! }));
    for (const step of detail.job?.steps || []) {
      console.log(`  Step: ${step.stepName} | Status: ${step.status}`);
      if ((step.status === 'FAILED' || step.status === 'RUNNING') && step.logUrl) {
        try {
          const res = await fetch(step.logUrl);
          const txt = await res.text();
          console.log(`  --- LOG (${step.status}) ---`);
          console.log(txt.slice(-1000));
        } catch (e) {
          // ignore
        }
      }
    }
  }

  console.log('\n--- 4. Domínio Customizado ---');
  const da = await amplify.send(new ListDomainAssociationsCommand({ appId }));
  for (const d of da.domainAssociations || []) {
    console.log(`Domínio: ${d.domainName} | Status: ${d.domainStatus} | Subdomínios:`, d.subDomains?.map((s) => `${s.subDomainSetting?.prefix}.${d.domainName} (${s.dnsRecord})`));
  }
}

checkAmplify().catch(console.error);
