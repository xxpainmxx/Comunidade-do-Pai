import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const serverFile = join(__dirname, 'server.ts');

// Executa o bot com limite estrito de memória para o limite de 300MB da ACLClouds/Pterodactyl
const child = spawn(
  process.execPath,
  [
    '--max-old-space-size=180',
    '--import',
    'tsx/esm',
    serverFile,
    ...process.argv.slice(2)
  ],
  {
    stdio: 'inherit',
    env: process.env
  }
);

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
  } else {
    process.exit(code ?? 0);
  }
});

process.on('SIGINT', () => child.kill('SIGINT'));
process.on('SIGTERM', () => child.kill('SIGTERM'));
