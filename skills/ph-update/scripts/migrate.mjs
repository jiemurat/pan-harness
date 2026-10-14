#!/usr/bin/env node
/*
migrate.mjs - applies the mechanical migration steps of the pan-harness standard
(references/changelog.md) to a project's harness. Part of @jiemurat/pan-harness:
it runs from the skill folder and is not copied into the project. Node 18 or
newer, no dependencies.

Usage:
  node <skill>/scripts/migrate.mjs --root <project> [--dry-run]

It reads the project's version from the PAN-HARNESS.md "Standard:" line and runs
the steps of every newer version up to this skill's, oldest first, writing each
version into the Standard line once its steps are done (a stopped run resumes
there). It also copies the skill's pan-harness-check.mjs, and secret-check.mjs
when the project has one, into pan-harness/scripts/. A line is changed only when
it is the standard's own text or the step names it; journal entries keep their
words, only links in them are renamed. What it cannot place (a line the project
reworded) is printed as "by hand" for the agent, and so are the hook differences
for the owner. An unknown standard (no Standard line, or a version this script
does not list) stops it: follow references/doctor.md -> "3. Migration".
Exit codes: 0 done, 2 usage, 3 unknown standard.
*/
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SKILL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TEMPLATES = path.join(SKILL, 'templates');

function usage(message) {
  if (message) console.error(`migrate: ${message}`);
  console.error('usage: node <skill>/scripts/migrate.mjs --root <project> [--dry-run]');
  process.exit(2);
}

const argv = process.argv.slice(2);
let root = null;
let dryRun = false;
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === '--root') root = argv[++i];
  else if (argv[i] === '--dry-run') dryRun = true;
  else if (argv[i] === '--help' || argv[i] === '-h') usage();
  else usage(`unknown argument ${argv[i]}`);
}
if (!root) usage('--root is required');
root = path.resolve(root);
if (!fs.existsSync(path.join(root, 'PAN-HARNESS.md'))) usage(`no PAN-HARNESS.md in ${root}: this is not a pan-harness project (ph-init creates one)`);

const SKILL_VERSION = (/^\s*version:\s*"([^"]+)"/m.exec(fs.readFileSync(path.join(SKILL, 'SKILL.md'), 'utf8')) || [])[1];
const KNOWN = ['2.4.2', '2.5.2']; // every version in references/changelog.md
const done = [];
const byHand = [];

// files are read once and written at the end, CRLF kept
const cache = new Map();
function file(rel) {
  if (!cache.has(rel)) {
    const p = path.join(root, ...rel.split('/'));
    const raw = fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null;
    cache.set(rel, raw === null ? null : { eol: raw.includes('\r\n') ? '\r\n' : '\n', lines: raw.split(/\r?\n/), changed: false });
  }
  return cache.get(rel);
}

// the mechanical steps of each version of references/changelog.md, oldest first: '<version>': [step, …];
// a step changes a line only when it is the standard's own text or the step names it, and prints
// what it cannot place as "by hand". The first version has none.
const STEPS = {};

// ---------------------------------------------------------------- run

const pan = file('PAN-HARNESS.md');
const stdLine = pan.lines.findIndex((l) => /^Standard: pan-harness \S+/.test(l));
const from = stdLine >= 0 ? /^Standard: pan-harness (\S+)/.exec(pan.lines[stdLine])[1] : null;
if (!from || !KNOWN.includes(from)) {
  console.log(`migrate: unknown standard (${from ? `version ${from}` : 'no Standard line'}): compare the harness with structure.md and templates/ by hand (references/doctor.md -> "3. Migration")`);
  process.exit(3);
}
const order = (v) => KNOWN.indexOf(v);
for (const v of KNOWN.filter((k) => order(k) > order(from) && order(k) <= order(SKILL_VERSION))) {
  for (const step of STEPS[v] || []) step();
  pan.lines[stdLine] = `Standard: pan-harness ${v}`;
  pan.changed = true;
  done.push(`Standard: pan-harness ${v}`);
}

// standard scripts: the skill's copy, always
for (const s of ['pan-harness-check.mjs', 'secret-check.mjs']) {
  const dest = path.join(root, 'pan-harness', 'scripts', s);
  if (s === 'secret-check.mjs' && !fs.existsSync(dest)) continue;
  const src = fs.readFileSync(path.join(SKILL, 'scripts', s), 'utf8');
  if (!fs.existsSync(dest) || fs.readFileSync(dest, 'utf8') !== src) {
    if (!dryRun) { fs.mkdirSync(path.dirname(dest), { recursive: true }); fs.writeFileSync(dest, src); }
    done.push(`pan-harness/scripts/${s}: replaced with the skill's copy`);
  }
}
// the hook: replaced only when the project kept the standard one (its commands equal the template's)
const hook = path.join(root, '.githooks', 'pre-commit');
if (fs.existsSync(hook)) {
  const tmpl = fs.readFileSync(path.join(TEMPLATES, 'githooks', 'pre-commit.tmpl'), 'utf8');
  const code = (s) => s.split(/\r?\n/).filter((l) => !/^\s*#/.test(l) && l.trim()).join('\n');
  const now = fs.readFileSync(hook, 'utf8');
  if (now !== tmpl) {
    if (code(now) === code(tmpl)) {
      if (!dryRun) fs.writeFileSync(hook, tmpl, { mode: 0o755 });
      done.push('.githooks/pre-commit: comments updated from the template');
    } else {
      byHand.push('.githooks/pre-commit differs from the template: show the difference to the owner (references/doctor.md -> "3. Migration")');
    }
  }
}

if (!dryRun) {
  for (const [rel, f] of cache) {
    if (f && f.changed) fs.writeFileSync(path.join(root, ...rel.split('/')), f.lines.join(f.eol));
  }
}
for (const d of done) console.log(`done    ${d}`);
for (const b of byHand) console.log(`by hand ${b}`);
console.log(`migrate${dryRun ? ' (dry run)' : ''}: ${from} -> ${order(SKILL_VERSION) > order(from) ? SKILL_VERSION : from}; ${done.length} done, ${byHand.length} by hand`);
