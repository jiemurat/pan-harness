#!/usr/bin/env node
/*
secret-check.mjs - make sure files about to be committed hold no secrets.
Part of @jiemurat/pan-harness: copied to <project>/pan-harness/scripts/
unchanged. Node 18 or newer, no dependencies. Nothing secret is ever printed:
only file names, line numbers and pattern names.

Usage:
  node pan-harness/scripts/secret-check.mjs [--root DIR] [PATH...]

Always scanned: AGENTS.md, PAN-HARNESS.md, CLAUDE.md (if present), pan-harness/
and the "secret_paths" of pan-harness/project/check.json. Paths given as
arguments (other changed files) are scanned in addition, never instead.
Installed when the project profile lists sensitive-data=secrets.
Extensions: every pan-harness/project/scripts/secret-check-* (.mjs or .js with
node, .py with python3, .sh with bash) is run with
the same paths, for example to compare them with live secret values or to look
for personal data patterns agreed with the owner; a non-zero exit marks a finding.
Exit code 1 if anything is found.
*/
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// Unicode-aware word boundaries (JS \b is ASCII-only; used with the u flag)
const B0 = '(?<![\\p{L}\\p{N}_])';
const B1 = '(?![\\p{L}\\p{N}_])';
const PATTERNS = [
  ['telegram-bot-token', new RegExp(`${B0}\\d{8,10}:[A-Za-z0-9_-]{35}${B1}`, 'u')],
  ['anthropic-key', new RegExp(`${B0}sk-ant-[A-Za-z0-9_-]{20,}`, 'u')],
  ['openai-key', new RegExp(`${B0}sk-(?!ant-)(?:proj-)?[A-Za-z0-9_-]{20,}`, 'u')],
  ['google-api-key', new RegExp(`${B0}AIza[0-9A-Za-z_-]{35}${B1}`, 'u')],
  ['github-token', new RegExp(`${B0}(?:gh[pousr]_[A-Za-z0-9]{36,}|github_pat_[A-Za-z0-9_]{40,})`, 'u')],
  ['aws-access-key', new RegExp(`${B0}AKIA[0-9A-Z]{16}${B1}`, 'u')],
  ['slack-token', new RegExp(`${B0}xox[abprs]-[A-Za-z0-9-]{10,}`, 'u')],
  ['private-key', /-----BEGIN [A-Z ]*PRIVATE KEY-----/],
  ['webhook-with-token', /\/rest\/\d+\/[a-z0-9]{12,}\//],
];
// user:password@ inside a URL; placeholders such as <pass> or ${PASS} are fine
const URL_PASSWORD = /[a-z][a-z0-9+.-]*:\/\/[^/\s:@]+:([^/\s:@]{6,})@/;
const PLACEHOLDER_HINTS = ['<', '{', '$', '*', 'password', 'parol', 'secret', 'xxx', '...'];
const SKIP_DIRS = new Set(['.git', 'node_modules', 'venv', '.venv', '__pycache__', 'dist', 'build']);
const MAX_BYTES = 2 * 1024 * 1024; // larger files are data, not text worth scanning

const argv = process.argv.slice(2);
let rootArg = null;
const extra = [];
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === '--root') rootArg = argv[++i];
  else if (argv[i].startsWith('--root=')) rootArg = argv[i].slice(7);
  else if (argv[i] === '-h' || argv[i] === '--help') {
    console.log('usage: secret-check.mjs [--root DIR] [PATH...]');
    process.exit(0);
  } else extra.push(argv[i]);
}

const ROOT = rootArg ? path.resolve(rootArg) : path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const P = path.join(ROOT, 'pan-harness', 'project');
let config = {};
try {
  config = JSON.parse(fs.readFileSync(path.join(P, 'check.json'), 'utf8'));
} catch {
  config = {};
}

// the default paths are always scanned; arguments add other changed files
let targets = ['AGENTS.md', 'PAN-HARNESS.md', 'CLAUDE.md', 'pan-harness'].map((n) => path.join(ROOT, n));
targets.push(...(config.secret_paths || []).map((n) => path.join(ROOT, n)));
targets.push(...extra.map((p) => path.resolve(p)));
targets = [...new Set(targets.filter((t) => fs.existsSync(t)))];

/** Files of a target; folders are walked, skipping SKIP_DIRS below the target. */
function filesOf(target) {
  const st = fs.statSync(target);
  if (st.isFile()) return [target];
  const out = [];
  const rec = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))) {
      if (SKIP_DIRS.has(e.name)) continue;
      const p = path.join(dir, e.name);
      if (e.isDirectory()) rec(p);
      else if (e.isFile()) out.push(p);
    }
  };
  rec(target);
  return out;
}

const splitlines = (s) => {
  if (!s) return [];
  const parts = s.split(/\r\n|[\n\r\v\f\x1c\x1d\x1e\x85\u2028\u2029]/);
  if (/(?:\r\n|[\n\r\v\f\x1c\x1d\x1e\x85\u2028\u2029])$/.test(s)) parts.pop();
  return parts;
};

console.log('== token-shaped strings');
const found = new Map(); // "name\0shown\0n" -> [name, shown, n]
let scanned = 0;
for (const target of targets) {
  for (const file of filesOf(target)) {
    let data;
    try {
      if (fs.statSync(file).size > MAX_BYTES) continue;
      data = fs.readFileSync(file);
    } catch {
      continue;
    }
    if (data.subarray(0, 4096).includes(0)) continue; // binary
    scanned += 1;
    const rel = path.relative(ROOT, file).split(path.sep).join('/'); // / on every system
    const shown = rel.startsWith('..') || path.isAbsolute(rel) ? file : rel; // a file outside the project
    splitlines(data.toString('utf8')).forEach((line, i) => {
      for (const [name, pattern] of PATTERNS) {
        if (pattern.test(line)) found.set(`${name}\0${shown}\0${i + 1}`, [name, shown, i + 1]);
      }
      const m = URL_PASSWORD.exec(line);
      if (m && !PLACEHOLDER_HINTS.some((h) => m[1].toLowerCase().includes(h))) {
        found.set(`url-with-password\0${shown}\0${i + 1}`, ['url-with-password', shown, i + 1]);
      }
    });
  }
}
const rows = [...found.values()].sort((a, b) => (a[1] < b[1] ? -1 : a[1] > b[1] ? 1 : a[2] - b[2] || (a[0] < b[0] ? -1 : 1)));
for (const [name, shown, n] of rows) console.log(`  ${name}: ${shown}:${n}`);
console.log(`  files scanned: ${scanned}, findings: ${found.size}`);
let status = found.size ? 1 : 0;

const extDir = path.join(P, 'scripts');
const listExt = (prefix) => {
  try {
    return fs.readdirSync(extDir).filter((n) => n.startsWith(prefix)).sort().map((n) => path.join(extDir, n));
  } catch {
    return [];
  }
};
for (const ext of listExt('secret-check-')) {
  const name = path.basename(ext);
  const runner = /\.(mjs|js)$/.test(name) ? process.execPath : name.endsWith('.py') ? 'python3' : name.endsWith('.sh') ? 'bash' : null;
  if (!runner) continue;
  console.log(`== extension ${name}`);
  const run = spawnSync(runner, [ext, ...targets], { stdio: 'inherit', timeout: 900000 });
  if (run.error) {
    console.log(`  could not run: ${run.error.message}`);
    status = 1;
  } else if (run.status !== 0) status = 1;
}

console.log(status === 0 ? 'RESULT: clean' : 'RESULT: FOUND SOMETHING - do not commit');
process.exitCode = status;
