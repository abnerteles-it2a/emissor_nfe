import { AmplifyClient, ListAppsCommand, GetAppCommand, ListBranchesCommand, ListJobsCommand } from '@aws-sdk/client-amplify';

const region = 'sa-east-1';
const credentials = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID || process.env.ACCESS_KEY_ID || '',
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || process.env.SECRET_ACCESS_KEY || '',
};

const amplify = new AmplifyClient({ region, credentials });

async function checkAmplify() {
  console.log('--- 1. Listando Apps Amplify ---');
  const apps = await amplify.send(new ListAppsCommand({}));
  for (const app of apps.apps || []) {
    console.log(`App ID: ${app.appId} | Name: ${app.name} | Repo: ${app.repository}`);
    console.log(`Default Domain: ${app.defaultDomain}`);
    
    console.log('\n--- 2. Branches ---');
    const branches = await amplify.send(new ListBranchesCommand({ appId: app.appId! }));
    if (!branches.branches || branches.branches.length === 0) {
      console.log('NENHUMA branch configurada neste app!');
    } else {
      for (const b of branches.branches) {
        console.log(`Branch: ${b.branchName} | Stage: ${b.stage} | Framework: ${b.framework}`);
        
        console.log(`\n--- 3. Jobs/Builds da branch ${b.branchName} ---`);
        const jobs = await amplify.send(new ListJobsCommand({ appId: app.appId!, branchName: b.branchName!, maxResults: 5 }));
        if (!jobs.jobSummaries || jobs.jobSummaries.length === 0) {
          console.log('Nenhum job de build executado ainda!');
        } else {
          for (const j of jobs.jobSummaries) {
            console.log(`  Job ID: ${j.jobId} | Status: ${j.status} | Start: ${j.startTime?.toISOString()} | End: ${j.endTime?.toISOString()}`);
          }
        }
      }
    }
  }
}

checkAmplify().catch(console.error);
