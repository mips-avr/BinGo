import { spawn } from 'node:child_process';
import { statSync, writeFileSync } from 'node:fs';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const chromeCandidates = [
  process.env.CHROME_BIN,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
].filter(Boolean);
const url = process.argv[2] ?? 'http://127.0.0.1:4173';
const profile = await mkdtemp(join(tmpdir(), 'bingo-web-smoke-'));
const chrome = chromeCandidates.find((candidate) => {
  try {
    return statSync(candidate).isFile();
  } catch {
    return false;
  }
});

if (!chrome) {
  throw new Error('Chrome/Chromium tidak ditemukan untuk smoke test render web.');
}

const logPath = join(profile, 'chrome.log');
const child = spawn(
  chrome,
  [
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    `--user-data-dir=${profile}`,
    '--virtual-time-budget=8000',
    '--enable-logging=stderr',
    '--dump-dom',
    url,
  ],
  { stdio: ['ignore', 'pipe', 'pipe'] },
);
let dom = '';
let logs = '';
child.stdout.on('data', (chunk) => (dom += chunk));
child.stderr.on('data', (chunk) => (logs += chunk));
let timedOut = false;
const timeout = setTimeout(() => {
  timedOut = true;
  child.kill('SIGTERM');
}, 20_000);
const forceTimeout = setTimeout(() => {
  if (timedOut) child.kill('SIGKILL');
}, 22_000);
const exitCode = await new Promise((resolve) => child.on('close', resolve));
clearTimeout(timeout);
clearTimeout(forceTimeout);
writeFileSync(logPath, logs);

if ((!timedOut && exitCode !== 0) || /Uncaught (SyntaxError|TypeError|ReferenceError)|Cannot use 'import\.meta'/.test(logs)) {
  throw new Error(`Bundle web crash saat startup. Log: ${logPath}\n${logs.slice(-2000)}`);
}
if (!dom.includes('Masuk') || !dom.includes('BinGo')) {
  throw new Error(`Halaman login tidak dirender. DOM hanya ${dom.length} byte. Log: ${logPath}`);
}
console.log(`Web render smoke test lulus: ${url}`);
