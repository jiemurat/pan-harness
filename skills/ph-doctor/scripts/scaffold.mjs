#!/usr/bin/env node
/*
scaffold.mjs - copies the pan-harness templates into a project for ph-init. Part of
@jiemurat/pan-harness: it runs from the skill folder and is not copied into the
project. Node 18 or newer, no dependencies.

Usage:
  node <skill>/scripts/scaffold.mjs --root <project> [--secrets]

Every standard file is copied from templates/ with its {{...}} placeholders,
[profile: ...] markers and template notes in place, so the text stays the
standard's; the agent then fills them in (references/init.md -> "5. Create") and
pan-harness-check.mjs reports any that are left. The Standard line and the month
of the history file are filled in here. Existing files are kept as they are.
--secrets also copies secret-check.mjs (the profile lists sensitive-data=secrets).
The pre-commit hook goes to .githooks/pre-commit and git is pointed at it, unless
the project already has another hook: then the agent merges the two with the owner.
*/
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const SKILL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TEMPLATES = path.join(SKILL, 'templates');

function usage(message) {
  if (message) console.error(`scaffold: ${message}`);
  console.error('usage: node <skill>/scripts/scaffold.mjs --root <project> [--secrets]');
  process.exit(2);
}

const argv = process.argv.slice(2);
let root = null;
let secrets = false;
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === '--root') root = argv[++i];
  else if (argv[i] === '--secrets') secrets = true;
  else if (argv[i] === '--help' || argv[i] === '-h') usage();
  else usage(`unknown argument ${argv[i]}`);
}
if (!root) usage('--root is required');
root = path.resolve(root);
if (!fs.existsSync(root) || !fs.statSync(root).isDirectory()) usage(`no such folder: ${root}`);

const version = (/^\s*version:\s*"([^"]+)"/m.exec(fs.readFileSync(path.join(SKILL, 'SKILL.md'), 'utf8')) || [])[1];
const month = new Date().toISOString().slice(0, 7);
// template (relative to templates/) -> project path
const FILES = [
  ['AGENTS.md.tmpl', 'AGENTS.md'],
  ['PAN-HARNESS.md.tmpl', 'PAN-HARNESS.md'],
  ...['state', 'plan', 'handoff', 'system-map', 'runbook', 'decisions', 'feedback', 'lessons']
    .map((f) => [`pan-harness/${f}.md.tmpl`, `pan-harness/${f}.md`]),
  ['pan-harness/archive/decisions.md.tmpl', 'pan-harness/archive/decisions.md'],
  ['pan-harness/history/YYYY-MM.md.tmpl', `pan-harness/history/${month}.md`],
  ['pan-harness/playbooks/pan-harness.md.tmpl', 'pan-harness/playbooks/pan-harness.md'],
  ['pan-harness/project/check.json.tmpl', 'pan-harness/project/check.json'],
  ['githooks/pre-commit.tmpl', '.githooks/pre-commit'],
];
const SCRIPTS = ['pan-harness-check.mjs', ...(secrets ? ['secret-check.mjs'] : [])];

const created = [];
const kept = [];
const notes = [];

function place(rel, body, mode) {
  const dest = path.join(root, ...rel.split('/'));
  if (fs.existsSync(dest)) {
    kept.push(rel);
    return false;
  }
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, body, mode ? { mode } : undefined);
  created.push(rel);
  return true;
}

for (const [tmpl, rel] of FILES) {
  let body = fs.readFileSync(path.join(TEMPLATES, ...tmpl.split('/')), 'utf8');
  if (rel === 'PAN-HARNESS.md' && version) body = body.replace('Standard: pan-harness {{version}}', `Standard: pan-harness ${version}`);
  if (rel.startsWith('pan-harness/history/')) body = body.replace('# History: {{YYYY-MM}}', `# History: ${month}`);
  place(rel, body, rel === '.githooks/pre-commit' ? 0o755 : undefined);
}
for (const s of SCRIPTS) {
  place(`pan-harness/scripts/${s}`, fs.readFileSync(path.join(SKILL, 'scripts', s), 'utf8'));
}

// the hook: point git at .githooks unless the project already runs another pre-commit hook
const git = (...args) => spawnSync('git', ['-C', root, ...args], { encoding: 'utf8' });
if (git('rev-parse', '--is-inside-work-tree').stdout.trim() !== 'true') {
  notes.push('not a git repository yet: run `git config core.hooksPath .githooks` after `git init` (references/init.md -> "1. Preparation")');
} else {
  const hooksPath = git('config', '--get', 'core.hooksPath').stdout.trim();
  const gitDir = git('rev-parse', '--git-dir').stdout.trim();
  const oldHook = path.join(path.resolve(root, gitDir), 'hooks', 'pre-commit');
  const framework = fs.existsSync(path.join(root, '.pre-commit-config.yaml'));
  if (hooksPath === '.githooks') {
    // already set
  } else if (hooksPath || fs.existsSync(oldHook) || framework) {
    notes.push(`the project already has a pre-commit hook (${hooksPath ? `core.hooksPath=${hooksPath}` : framework ? '.pre-commit-config.yaml' : '.git/hooks/pre-commit'}): `
      + 'merge it with .githooks/pre-commit together with the owner (references/init.md -> "5. Create"), then run `git config core.hooksPath .githooks`');
  } else {
    git('config', 'core.hooksPath', '.githooks');
    notes.push('git config core.hooksPath .githooks: the hook runs the checks before every commit');
  }
}

for (const rel of created) console.log(`created ${rel}`);
for (const rel of kept) console.log(`kept    ${rel} (it exists; compare it with the template by hand)`);
for (const n of notes) console.log(`note    ${n}`);
console.log(`scaffold: ${created.length} created, ${kept.length} kept. Next: in every created file fill each {{...}}, `
  + 'apply each [profile: ...] marker (references/structure.md -> "Profile") and delete the template note at the top; '
  + 'node pan-harness/scripts/pan-harness-check.mjs lists what is left.');
