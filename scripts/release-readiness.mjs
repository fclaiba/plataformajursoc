import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const envPath = path.join(root, '.env.local');
const checklistPath = path.join(root, 'docs', 'release', 'checklist.md');

const requiredEnvVars = [
  'VITE_CONVEX_URL',
  'VITE_CONVEX_SITE_URL',
  'CONVEX_DEPLOYMENT',
  'VITE_SENTRY_DSN',
];

const envContents = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
const checklistContents = fs.existsSync(checklistPath) ? fs.readFileSync(checklistPath, 'utf8') : '';

const readEnvVar = (name) => {
  const match = envContents.match(new RegExp(`^${name}=(.*)$`, 'm'));
  return match?.[1]?.trim() || '';
};

const checks = requiredEnvVars.map((name) => ({
  name,
  ok: Boolean(readEnvVar(name) || process.env[name]),
}));

const checklistGo = checklistContents.includes('Decision: `GO`');
const checklistNoGo = checklistContents.includes('Decision: `NO-GO`');

console.log('Release readiness');
console.log('=================');
for (const check of checks) {
  console.log(`${check.ok ? 'OK' : 'MISSING'} ${check.name}`);
}
console.log('');
console.log(`Checklist decision: ${checklistGo ? 'GO' : checklistNoGo ? 'NO-GO' : 'UNSET'}`);

const missing = checks.filter((check) => !check.ok);
if (missing.length > 0) {
  console.log('');
  console.log('Missing env vars:');
  for (const check of missing) {
    console.log(`- ${check.name}`);
  }
  process.exitCode = 1;
}
