import { readdir, readFile } from 'node:fs/promises';
import { extname, join, relative } from 'node:path';

const root = new URL('..', import.meta.url);
const allowedExtensions = new Set(['.js', '.mjs', '.ts', '.tsx', '.json', '.md', '.html', '.css', '.example']);
const ignoredDirectories = new Set(['.git', 'dist', 'node_modules']);
const findings = [];
const patterns = [
  { name: 'Google API key', expression: /AIza[0-9A-Za-z_-]{30,}/g },
  { name: 'OpenAI key', expression: /sk-(?:proj-)?[0-9A-Za-z_-]{20,}/g },
  { name: 'private key', expression: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g },
  { name: 'Firebase storage token', expression: /[?&]token=[0-9a-f]{8}-[0-9a-f-]{27,}/gi },
];

async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (ignoredDirectories.has(entry.name)) continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      await walk(path);
      continue;
    }
    if (!allowedExtensions.has(extname(entry.name)) && entry.name !== '.env.example') continue;
    const content = await readFile(path, 'utf8');
    for (const pattern of patterns) {
      pattern.expression.lastIndex = 0;
      if (pattern.expression.test(content)) {
        findings.push(`${pattern.name}: ${relative(root.pathname, path)}`);
      }
    }
  }
}

await walk(root.pathname);
if (findings.length) {
  console.error(`Potential secrets found:\n${findings.join('\n')}`);
  process.exit(1);
}
console.log('Security check passed: no embedded credentials or private keys found.');
