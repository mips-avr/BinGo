/**
 * Pre-generate NativeWind platform CSS sebelum `expo start`.
 * Menghindari timeout Tailwind CLI saat first bundle (terutama path dengan spasi).
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const input = path.join(root, 'src/styles/global.css');
const outDir = path.join(root, 'node_modules/.cache/nativewind');
const cli = path.join(root, 'node_modules/tailwindcss/lib/cli.js');

mkdirSync(outDir, { recursive: true });

for (const platform of ['ios', 'android', 'native']) {
  const output = path.join(outDir, `global.css.${platform}.css`);
  execFileSync(process.execPath, [cli, '--input', input, '--output', output], {
    cwd: root,
    stdio: 'inherit',
    env: { ...process.env, NATIVEWIND_NATIVE: platform },
  });
}
