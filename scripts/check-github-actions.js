const fs = require('fs');

async function checkActions() {
  const envContent = fs.readFileSync('.env', 'utf8');
  const tokenMatch = envContent.match(/github_token=([^\r\n]+)/);
  const token = tokenMatch ? tokenMatch[1].trim() : '';

  const res = await fetch('https://api.github.com/repos/abnerteles-it2a/emissor_nfe/actions/runs?per_page=5', {
    headers: {
      'Accept': 'application/vnd.github+json',
      'Authorization': `Bearer ${token}`,
      'User-Agent': 'node-fetch',
    }
  });

  if (!res.ok) {
    console.error('GitHub API error:', res.status, await res.text());
    return;
  }

  const data = await res.json();
  console.log('Total workflow runs:', data.total_count);
  for (const run of data.workflow_runs || []) {
    console.log(`Run #${run.run_number} (${run.name}): ${run.status} / ${run.conclusion} - Commit: ${run.head_commit?.message?.split('\n')[0]} (${run.head_sha.substring(0, 7)})`);
  }
}

checkActions().catch(console.error);
