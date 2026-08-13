#!/usr/bin/env node
/**
 * Secret scanner — the recurrence barrier for technical debt item TD-02.
 *
 * Scans staged files (default) or the whole working tree (--all) for committed
 * credentials. Exits non-zero on any finding, which fails the pre-commit hook
 * and the CI job.
 *
 *   node scripts/scan-secrets.mjs          # staged files only (pre-commit)
 *   node scripts/scan-secrets.mjs --all    # entire tracked tree (CI)
 *
 * Install the hook once per clone:
 *   git config core.hooksPath .githooks
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync, statSync } from 'node:fs';

const scanAll = process.argv.includes('--all');

const RULES = [
  {
    id: 'ollama-api-key',
    // 32 hex chars, a dot, then a 24-char token — the Ollama Cloud key shape.
    pattern: /\b[0-9a-f]{32}\.[A-Za-z0-9]{20,32}\b/,
    message: 'Ollama Cloud API key',
  },
  {
    id: 'postgres-url-with-password',
    pattern: /postgres(?:ql)?:\/\/[^\s:'"]+:[^\s@'"]+@/i,
    message: 'PostgreSQL connection string containing a password',
  },
  { id: 'aws-access-key-id', pattern: /\bAKIA[0-9A-Z]{16}\b/, message: 'AWS access key id' },
  { id: 'github-token', pattern: /\bgh[pousr]_[A-Za-z0-9]{36,}\b/, message: 'GitHub token' },
  { id: 'openai-key', pattern: /\bsk-[A-Za-z0-9_-]{20,}\b/, message: 'OpenAI-style secret key' },
  { id: 'stripe-secret', pattern: /\b(?:sk|rk)_live_[A-Za-z0-9]{16,}\b/, message: 'Stripe live secret key' },
  { id: 'google-api-key', pattern: /\bAIza[0-9A-Za-z_-]{35}\b/, message: 'Google API key' },
  { id: 'private-key-block', pattern: /-----BEGIN (?:RSA |EC |OPENSSH |PGP )?PRIVATE KEY-----/, message: 'Private key block' },
  {
    id: 'hardcoded-secret-fallback',
    // Catches the exact shape of the original TD-02 defect: an env lookup with
    // a non-empty string literal as its `||` fallback.
    pattern: /process\.env\.[A-Z0-9_]*(?:KEY|SECRET|TOKEN|PASSWORD|CREDENTIAL)[A-Z0-9_]*\s*\|\|\s*['"`][^'"`\s]{8,}/,
    message: 'Hard-coded credential used as an environment-variable fallback',
  },
];

// .env.example is a template of placeholders and is intentionally committed.
const SKIP_PATHS = [
  /(^|[\\/])\.env\.example$/,
  /(^|[\\/])node_modules[\\/]/,
  /(^|[\\/])\.next[\\/]/,
  /(^|[\\/])package-lock\.json$/,
  /(^|[\\/])scripts[\\/]scan-secrets\.mjs$/, // this file contains the patterns themselves
  /\.(png|jpg|jpeg|gif|webp|ico|pdf|docx|zip|woff2?|ttf|eot|mp4)$/i,
];

function listFiles() {
  const args = scanAll
    ? ['ls-files']
    : ['diff', '--cached', '--name-only', '--diff-filter=ACMR'];
  const out = execFileSync('git', args, { encoding: 'utf8' });
  return out.split('\n').map((f) => f.trim()).filter(Boolean);
}

const findings = [];

for (const file of listFiles()) {
  if (SKIP_PATHS.some((re) => re.test(file))) continue;
  if (!existsSync(file)) continue;
  try {
    if (statSync(file).size > 2 * 1024 * 1024) continue;
  } catch {
    continue;
  }

  let content;
  try {
    content = readFileSync(file, 'utf8');
  } catch {
    continue; // binary or unreadable
  }

  content.split('\n').forEach((line, i) => {
    for (const rule of RULES) {
      if (rule.pattern.test(line)) {
        findings.push({ file, line: i + 1, rule: rule.id, message: rule.message });
      }
    }
  });
}

if (findings.length === 0) {
  console.log(`✔ secret scan clean (${scanAll ? 'full tree' : 'staged files'})`);
  process.exit(0);
}

console.error('\n✖ SECRET SCAN FAILED — potential credentials detected\n');
for (const f of findings) {
  console.error(`  ${f.file}:${f.line}`);
  console.error(`    ${f.message} [${f.rule}]\n`);
}
console.error('The matched values are NOT printed here. Open each location above.');
console.error('Move the value into an environment variable and rotate the credential —');
console.error('if it was ever committed, deleting the line is not sufficient.\n');
process.exit(1);
