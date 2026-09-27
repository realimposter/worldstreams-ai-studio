import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';

const port = 4399;
const baseUrl = `http://127.0.0.1:${port}`;
const child = spawn(process.execPath, ['server.mjs'], {
  cwd: new URL('..', import.meta.url),
  env: { ...process.env, NODE_ENV: 'production', HOST: '127.0.0.1', PORT: String(port), GEMINI_API_KEY: '' },
  stdio: ['ignore', 'pipe', 'pipe'],
});
let output = '';
child.stdout.on('data', chunk => { output += chunk; });
child.stderr.on('data', chunk => { output += chunk; });

async function waitForServer() {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const response = await fetch(`${baseUrl}/api/health`);
      if (response.ok) return;
    } catch {
      // Server is still starting.
    }
    await delay(150);
  }
  throw new Error(`Server did not start.\n${output}`);
}

try {
  await waitForServer();

  const health = await fetch(`${baseUrl}/api/health`);
  if (!health.ok || !(await health.json()).ok) throw new Error('Health endpoint failed.');

  const page = await fetch(baseUrl);
  const html = await page.text();
  if (!page.ok || !html.includes('Worldstreams')) throw new Error('Production page failed.');

  const catalogResponse = await fetch(`${baseUrl}/api/worldstreams`);
  const catalog = await catalogResponse.json();
  if (!catalogResponse.ok || !Array.isArray(catalog.worldstreams) || catalog.worldstreams.length === 0) {
    throw new Error('Catalog endpoint failed.');
  }

  const discoveryResponse = await fetch(`${baseUrl}/api/discover`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: 'a magical adventure in space' }),
  });
  const discovery = await discoveryResponse.json();
  if (!discoveryResponse.ok || discovery.poweredBy !== 'catalog' || discovery.recommendations.length !== 3) {
    throw new Error('Discovery fallback failed.');
  }

  console.log(`Smoke test passed with ${catalog.worldstreams.length} worlds.`);
} finally {
  child.kill('SIGTERM');
}
