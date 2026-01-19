import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const packageRoot = resolve(__dirname, '..');
const skillsRoot = resolve(packageRoot, '../..');
const targetDir = join(skillsRoot, 'skills', 'reactlynx');

function ensureDir(dir) {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

function cleanDir(dir) {
  if (existsSync(dir)) {
    rmSync(dir, { recursive: true, force: true });
  }
}

function main() {
  console.log('Syncing skills to', targetDir);

  cleanDir(targetDir);
  ensureDir(targetDir);

  const distDir = join(packageRoot, 'dist');
  const scriptsTargetDir = join(targetDir, 'scripts');
  if (existsSync(distDir)) {
    ensureDir(scriptsTargetDir);
    cpSync(distDir, scriptsTargetDir, { recursive: true });
    console.log('Copied dist/ to', scriptsTargetDir);
  } else {
    console.warn(
      'Warning: dist/ directory not found. Run "pnpm run build" first.',
    );
  }

  const rulesSourceDir = join(packageRoot, 'src', 'rules');
  const rulesTargetDir = join(targetDir, 'rules');
  if (existsSync(rulesSourceDir)) {
    ensureDir(rulesTargetDir);
    cpSync(rulesSourceDir, rulesTargetDir, { recursive: true });
    console.log('Copied rules/ to', rulesTargetDir);
  }

  const skillMdSource = join(packageRoot, 'src', 'SKILL.md');
  const skillMdTarget = join(targetDir, 'SKILL.md');
  if (existsSync(skillMdSource)) {
    cpSync(skillMdSource, skillMdTarget);
    console.log('Copied SKILL.md to', skillMdTarget);
  } else {
    console.warn('Warning: src/SKILL.md not found.');
  }

  console.log('Sync completed successfully!');
}

main();
