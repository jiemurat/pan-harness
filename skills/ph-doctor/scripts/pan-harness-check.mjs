#!/usr/bin/env node
/*
pan-harness-check.mjs - consistency and conformance check of a pan-harness
(AGENTS.md, PAN-HARNESS.md and pan-harness/). Part of @jiemurat/pan-harness:
copied to <project>/pan-harness/scripts/ unchanged. Node 18 or newer, no
dependencies. Project-specific checks go to pan-harness/project/scripts/check-*
(.mjs, .js or .py).

Usage:
  node pan-harness/scripts/pan-harness-check.mjs [--root DIR] [--live] [--since COMMIT]
  node <skill>/scripts/pan-harness-check.mjs --root <project>

--since COMMIT: the terms check reads the lines changed since COMMIT, committed or
not, instead of the uncommitted ones, and every such line is listed as REVIEW
with flags for the audit items it may break (A20, A43, A59-A62: a negative verb,
a step, a vague word, filler, an exception, a new section or file, a Map line).
A flag is a hint for the reviewer, not a finding. ph-doctor passes the commit of
the last ph-doctor or ph-update run.

Every message says what is wrong, why it matters and how to fix it:
"<where>: <what> - <why>; <fix>".

Errors (exit 1):
  - the project is not inside a git repository (pan-harness assumes git: ph-init
    installs and sets it up);
  - a mandatory standard file is missing (secret-check only when the profile
    lists sensitive-data=secrets), an unfilled template placeholder ({{...}}),
    an unapplied [profile: ...] marker or a template note is left, or a
    CLAUDE.md does not import @AGENTS.md (Claude Code then ignores AGENTS.md);
  - the Profile line has an unknown flag or value;
  - a required section of AGENTS.md or PAN-HARNESS.md is missing;
  - R numbers (AGENTS.md, playbooks/, project/playbooks/) run 1..n and every
    "<- F/L/D" source exists; F, L and D numbers (each with its archive file)
    run 1..n and every R/F/L/D named in the standard docs exists;
  - every journal entry carries a topic tag from the runbook.md list;
  - history/YYYY-MM.md holds only entries of its own month, in date order, and
    the state.md "Last updated" date is not older than the newest entry;
  - dated task rows ("| YYYY-MM-DD") appear only in plan.md;
  - backticked paths under the known prefixes exist (in handoff.md, lines
    marked "(new)" name files still to be made and are skipped);
  - a "`file.md` -> "Section"" link in a current doc leads to a heading or bold
    label that file does not have.
Warnings:
  - no Profile line;
  - the standard sections of AGENTS.md or PAN-HARNESS.md are out of order, or
    a Boundaries line (Never, Ask first, Always) is missing, or (standard 1.2.0
    and newer) the **Writing** rule group;
  - a journal entry without its required fields (D: Why, Where; F: Quote,
    Context, Result; L: Rule, Check; history: What and why, Checks, Files, and
    Downtime when live-system=yes); entries older than check.json "fields_from"
    are skipped;
  - a file or folder in pan-harness/ that the standard does not define;
  - a standard entry, a project/ entry or a project playbook missing from the
    PAN-HARNESS.md map;
  - an R/F/L/D named in a project/ doc that does not exist; a section link in a
    journal or history entry that leads nowhere;
  - a history entry other than the last with "pending" in its Files line;
  - the newest history entry: a criterion marked done without evidence, or an
    open criterion whose decision has no open item in plan.md;
  - plan.md: a dated Scheduled row whose date has passed;
  - handoff.md: no Status line; an active task over 8 KB, without its
    sections, with steps that have no state, several active steps, or done
    steps without evidence;
  - co_change (check.json): a watched file changed but none of the docs that
    describe it did (changes come from git status);
  - terms: a term glossed in brackets ("tekshiruv (check)") in a new or
    changed line of the harness (git diff against HEAD, or against --since
    COMMIT, and untracked files; archive/ skipped) - the Glossary keeps one
    term per concept;
  - a doc read on demand over 10 KB without a "## Contents" list;
  - markers (check.json): an unfinished-work marker (TODO, TK ...) in the
    watched files;
  - never_track: git tracks a file it should not (a secret, cache, log, editor
    or OS file; check.json never_track adds patterns, track_ok exempts paths)
    or one over large_file_mb (default 50), or such a file is untracked but
    not ignored;
  - growth: the start set over the limit, another doc over the doc limit
    (history/ and archive/ are exempt), a finished item left in plan.md;
  - no Standard line in PAN-HARNESS.md, or its version differs from this
    script's.
Notes (not counted): open criteria in plan.md, untracked files that are not
ignored (commit them or add them to .gitignore), a git command that failed.
Extensions: every pan-harness/project/scripts/check-* (.mjs, .js with node,
.py with python3) is run with --root (and --live); its "ERROR ..." and
"WARN ..." lines count.
Settings: pan-harness/project/check.json (start_limit_bytes, doc_limit_bytes,
path_bases, path_prefixes, fields_from, co_change, markers, never_track,
track_ok, large_file_mb; path_prefixes replaces the default list, never_track
adds to it).
*/
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const VERSION = '1.2.0';

// Sizes in bytes. 24 KB fits the start set of a complex project written
// compactly; 40 KB keeps any doc readable in one go. An agent reads a doc over
// READ_WHOLE only in parts (AGENTS.md -> Session start), so such a doc needs a
// list of its sections.
const DEFAULT_START_LIMIT = 24 * 1024;
const DEFAULT_DOC_LIMIT = 40 * 1024;
const READ_WHOLE = 10 * 1024;
const HANDOFF_LIMIT = 8 * 1024; // an active handoff.md is read at session start along with the start set

const STANDARD_FILES = ['state.md', 'plan.md', 'handoff.md', 'system-map.md', 'runbook.md',
  'decisions.md', 'feedback.md', 'lessons.md'];
const STANDARD_DIRS = new Set(['history', 'archive', 'playbooks', 'scripts', 'project']);
const SCRIPTS = ['pan-harness-check.mjs', 'secret-check.mjs'];
const MAP_ENTRIES = [...STANDARD_FILES, 'history/', 'archive/', 'playbooks/pan-harness.md', 'scripts/'];
// standard places inside project/ that a young harness may not have yet
const OPTIONAL_DIRS = new Set(['project', 'project/playbooks', 'project/scripts', 'project/references']);
const PATH_PREFIXES = ['pan-harness', 'project', 'playbooks', 'scripts', 'references',
  'history', 'archive', 'tests', 'docs', 'src'];
// Unicode-aware word characters and boundaries (JS \w and \b are ASCII-only; used with the u flag)
const W = '[\\p{L}\\p{N}_]';
const B0 = `(?<!${W})`; // \b before a word character
const B1 = `(?!${W})`; // \b after a word character
const DATED_ROW = /^\| \**\d{4}-\d{2}-\d{2}/;
// template placeholders; Go template actions ({{.Status}}, {{json .}}) and CI
// expressions (${{ secrets.X }}) are not
const PLACEHOLDER = new RegExp(`(?<!\\$)\\{\\{(?!\\s*(?:\\.|-|range${B1}|end${B1}|json${B1}|if${B1}|else${B1}|index${B1}|printf${B1}|with${B1}))[^}\\n]*\\}\\}`, 'u');
const MONTH_FILE = /^\d{4}-\d{2}\.md$/;
const SECTION_LINK = new RegExp(`\`((?:${W}|[./-])+\\.md)\` → (?:\`([^\`]+)\`|"([^"]+)")`, 'gu');
const HANDOFF_SECTIONS = ['## Task', '## Criteria', '## Steps', '## Changed files', '## Checks',
  '## Decisions', '## Open questions', '## Next step', '## Work files'];
const STEP_STATE = /`(todo|active|blocked|done)`/;

const PROFILE_FLAGS = { 'live-system': new Set(['yes', 'no']), code: new Set(['yes', 'no']) };
// files git should not track: secrets, caches and dependencies, logs, editor and OS files;
// a pattern ending in / is a folder at any depth, others match the file name or the path
const NEVER_TRACK = ['.env', '.env.*', '*.pem', '*.key', '*.p12', '*.pfx', '*.kdbx', 'id_rsa', 'id_ed25519', 'id_ecdsa',
  'credentials.json', 'secrets.yml', 'secrets.yaml', 'secrets.json', '.netrc', 'rclone.conf',
  '__pycache__/', '*.pyc', '*.pyo', 'node_modules/', '.venv/', 'venv/', '.pytest_cache/',
  '.mypy_cache/', '.ruff_cache/', '.ipynb_checkpoints/', '*.log',
  '.DS_Store', 'Thumbs.db', 'desktop.ini', '*.swp', '*.swo', '~$*', '.~lock.*#'];
const TRACK_OK = ['.env.example', '.env.sample', '.env.template', '.env.dist'];
const SENSITIVE_KINDS = new Set(['secrets', 'pii', 'confidential', 'none']);

// required sections, in this order
const AGENTS_SECTIONS = ['## Project', '## Boundaries', '## Session start', '## Workflow', '## Working style', '## Rules'];
const BOUNDARY_LABELS = ['**Never:**', '**Ask first:**', '**Always:**'];
const PAN_SECTIONS = ['## Profile', '## Map', '## Journals', '## End of task', '## Growth limits', '## Project checks'];

// ---------------------------------------------------------------- helpers

function parseArgs(argv) {
  const out = { root: null, live: false, since: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--live') out.live = true;
    else if (a === '--root') out.root = argv[++i];
    else if (a.startsWith('--root=')) out.root = a.slice(7);
    else if (a === '--since') out.since = argv[++i];
    else if (a.startsWith('--since=')) out.since = a.slice(8);
    else if (a === '-h' || a === '--help') {
      console.log('usage: pan-harness-check.mjs [--root DIR] [--live] [--since COMMIT]');
      process.exit(0);
    } else {
      console.error(`pan-harness-check: unknown argument ${a}`);
      process.exit(2);
    }
  }
  return out;
}

/** Lines of a text: every line break kind, no trailing empty line. */
function splitlines(s) {
  if (!s) return [];
  const parts = s.split(/\r\n|[\n\r\v\f\x1c\x1d\x1e\x85\u2028\u2029]/);
  if (/(?:\r\n|[\n\r\v\f\x1c\x1d\x1e\x85\u2028\u2029])$/.test(s)) parts.pop();
  return parts;
}

const fnCache = new Map();
/** Shell-style pattern match: case-sensitive, '*' also matches '/'. */
function fnmatch(name, pat) {
  let re = fnCache.get(pat);
  if (!re) {
    let i = 0;
    let src = '';
    while (i < pat.length) {
      const c = pat[i++];
      if (c === '*') {
        src += '[\\s\\S]*';
        while (pat[i] === '*') i++;
      } else if (c === '?') src += '[\\s\\S]';
      else if (c === '[') {
        let j = i;
        if (pat[j] === '!') j++;
        if (pat[j] === ']') j++;
        while (j < pat.length && pat[j] !== ']') j++;
        if (j >= pat.length) src += '\\[';
        else {
          let stuff = pat.slice(i, j).replace(/\\/g, '\\\\');
          i = j + 1;
          if (stuff[0] === '!') stuff = `^${stuff.slice(1)}`;
          else if (stuff[0] === '^') stuff = `\\${stuff}`;
          src += `[${stuff}]`;
        }
      } else src += c.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
    }
    re = new RegExp(`^${src}$`, 'u');
    fnCache.set(pat, re);
  }
  return re.test(name);
}

/** Paths sorted part by part. */
function comparePaths(a, b) {
  const pa = a.split(path.sep);
  const pb = b.split(path.sep);
  for (let i = 0; i < Math.min(pa.length, pb.length); i++) {
    if (pa[i] !== pb[i]) return pa[i] < pb[i] ? -1 : 1;
  }
  return pa.length - pb.length;
}
const sortPaths = (list) => [...new Set(list)].sort(comparePaths);

const isFile = (p) => { try { return fs.statSync(p).isFile(); } catch { return false; } };
const isDir = (p) => { try { return fs.statSync(p).isDirectory(); } catch { return false; } };
const exists = (p) => fs.existsSync(p);
const listDir = (d) => { try { return fs.readdirSync(d).map((n) => path.join(d, n)); } catch { return []; } };

function allDirs(dir) {
  const out = [];
  const rec = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      if (e.isDirectory()) {
        const p = path.join(d, e.name);
        out.push(p);
        rec(p);
      }
    }
  };
  if (isDir(dir)) rec(dir);
  return out;
}

/** Glob: '*' and '?' within a name, '**' for any depth (including none). */
function glob(base, pattern) {
  let current = [base];
  for (const part of pattern.split('/').filter((x) => x && x !== '.')) {
    const next = [];
    if (part === '**') current.forEach((d) => { if (isDir(d)) next.push(d, ...allDirs(d)); });
    else current.forEach((d) => { for (const p of listDir(d)) if (fnmatch(path.basename(p), part)) next.push(p); });
    current = [...new Set(next)];
  }
  return sortPaths(current);
}
const rglob = (base, pattern) => glob(base, `**/${pattern}`);

// ---------------------------------------------------------------- setup

const args = parseArgs(process.argv.slice(2));
const ROOT = args.root ? path.resolve(args.root) : path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
if (!exists(path.join(ROOT, 'AGENTS.md')) && !isDir(path.join(ROOT, 'pan-harness'))) {
  console.error(`pan-harness-check: ${ROOT} has neither AGENTS.md nor pan-harness/; pass --root <project>`);
  process.exit(1);
}
const H = path.join(ROOT, 'pan-harness');
const P = path.join(H, 'project');
const errors = [];
const warnings = [];
const notes = [];
const review = []; // --since: new or changed lines for ph-doctor to judge (19b)
let reviewTotal = 0;

let config = {};
if (exists(path.join(P, 'check.json'))) {
  try {
    config = JSON.parse(fs.readFileSync(path.join(P, 'check.json'), 'utf8'));
  } catch (exc) {
    errors.push(`pan-harness/project/check.json: invalid JSON (${exc.message}) - its settings are ignored `
      + 'and defaults apply; fix the syntax');
  }
}
const startLimit = parseInt(config.start_limit_bytes ?? DEFAULT_START_LIMIT, 10);
const docLimit = parseInt(config.doc_limit_bytes ?? DEFAULT_DOC_LIMIT, 10);

// paths in messages use / on every system, as in the harness docs
const rel = (p) => path.relative(ROOT, p).split(path.sep).join('/');
const read = (p) => (isFile(p) ? fs.readFileSync(p).toString('utf8') : '');

/** Lines of a markdown file that are not inside ``` blocks. */
function outsideCode(body) {
  const out = [];
  let inside = false;
  for (const line of splitlines(body)) {
    if (line.trimStart().startsWith('```')) inside = !inside;
    else if (!inside) out.push(line);
  }
  return out;
}

/** [line number, line] pairs of a markdown file outside ``` blocks. */
function numberedOutsideCode(body) {
  const out = [];
  let inside = false;
  splitlines(body).forEach((line, i) => {
    if (line.trimStart().startsWith('```')) inside = !inside;
    else if (!inside) out.push([i + 1, line]);
  });
  return out;
}

const starts = (line, heading) => line === heading || line.startsWith(`${heading} `);

/** Lines under a '## ' heading, up to the next '## ' heading. */
function section(body, heading) {
  const out = [];
  let inside = false;
  for (const line of outsideCode(body)) {
    if (line.startsWith('## ')) inside = starts(line, heading);
    else if (inside) out.push(line);
  }
  return out;
}

const panText = read(path.join(ROOT, 'PAN-HARNESS.md'));

// 1. profile
let profile = {};
const pm = /^Profile:\s*(.+)$/m.exec(panText);
if (pm) {
  profile = Object.fromEntries([...pm[1].matchAll(/([a-z-]+)=([a-z+]+)/g)].map((m) => [m[1], m[2]]));
  for (const key of [...Object.keys(PROFILE_FLAGS), 'sensitive-data']) {
    if (!(key in profile)) {
      errors.push(`PAN-HARNESS.md: the Profile line has no ${key}= flag - the profile decides which `
        + 'rules and files the project needs; add it (structure.md -> Profile)');
    }
  }
  for (const [key, value] of Object.entries(profile)) {
    if (key in PROFILE_FLAGS && !PROFILE_FLAGS[key].has(value)) {
      errors.push(`PAN-HARNESS.md: Profile ${key}=${value} - only yes or no is understood; use one of them`);
    } else if (key === 'sensitive-data') {
      const kinds = new Set(value.split('+'));
      if (![...kinds].every((k) => SENSITIVE_KINDS.has(k)) || (kinds.has('none') && kinds.size > 1)) {
        errors.push(`PAN-HARNESS.md: Profile sensitive-data=${value} - other values switch no rule on; `
          + 'use secrets, pii, confidential joined with +, or none');
      }
    } else if (!(key in PROFILE_FLAGS)) {
      errors.push(`PAN-HARNESS.md: unknown Profile flag ${key} - the skill ignores it; `
        + 'use live-system, code and sensitive-data');
    }
  }
} else {
  warnings.push("PAN-HARNESS.md: no 'Profile:' line - the agent cannot tell which rules apply; "
    + 'add the ## Profile section (structure.md -> Profile)');
}
const liveOn = profile['live-system'] === 'yes'; // unknown: Downtime is not demanded
const sensitive = new Set((profile['sensitive-data'] || 'secrets').split('+')); // no profile line: secret-check stays mandatory

/** stdout of a git command run in ROOT, null when git is missing or fails */
function git(...cmd) {
  const r = spawnSync('git', ['-C', ROOT, ...cmd], { encoding: 'utf8', timeout: 60000, maxBuffer: 256 * 1024 * 1024 });
  return r.error || r.status !== 0 ? null : r.stdout;
}

const hasGit = (git('rev-parse', '--is-inside-work-tree') || '').trim() === 'true';
if (!hasGit) {
  errors.push(`${ROOT}: not inside a git repository - pan-harness keeps history, checkpoints and the owner's `
    + "and the agent's changes apart with git; install and set it up as ph-init does "
    + '(references/init.md -> 1. Preparation)');
}
// --since: with a commit git does not know, the terms check would read no lines and stay silent
if (args.since !== null && (!args.since || !hasGit
    || git('rev-parse', '--verify', '--quiet', `${args.since}^{commit}`) === null)) {
  console.error(`pan-harness-check: --since ${args.since || '(empty)'}: no such commit in ${ROOT}; pass one from git log`);
  process.exit(2);
}

const stdMatch = /Standard: pan-harness (\S+)/.exec(panText);
const stdVersion = stdMatch ? stdMatch[1] : null;
const atLeast = (v, w) => { // v >= w for x.y.z versions
  const [a, b] = [v, w].map((x) => x.split('.').map(Number));
  const i = [0, 1, 2].find((k) => (a[k] || 0) !== (b[k] || 0));
  return i === undefined || (a[i] || 0) > (b[i] || 0);
};

// 2. mandatory standard files
const mandatory = [path.join(ROOT, 'AGENTS.md'), path.join(ROOT, 'PAN-HARNESS.md'), ...STANDARD_FILES.map((f) => path.join(H, f)),
  path.join(H, 'playbooks', 'pan-harness.md'), path.join(H, 'scripts', SCRIPTS[0])];
if (sensitive.has('secrets')) mandatory.push(path.join(H, 'scripts', SCRIPTS[1]));
for (const p of mandatory) {
  if (!isFile(p)) {
    errors.push(`missing standard file: ${rel(p)} - every project keeps the same files, so an agent `
      + "knows where to look; create it from the skill's templates/ (one line if nothing applies)");
  }
}
const months = glob(path.join(H, 'history'), '*.md').filter((p) => MONTH_FILE.test(path.basename(p)));
if (!months.length) {
  errors.push('pan-harness/history/: no YYYY-MM.md month file - finished work has nowhere to go; '
    + "create this month's file from the skill's templates/");
}

// 3. the standard part holds only standard things
if (isDir(H)) {
  for (const entry of sortPaths(listDir(H))) {
    const name = path.basename(entry);
    if (name.startsWith('.') || name === '__pycache__') continue;
    if ((isDir(entry) && !STANDARD_DIRS.has(name)) || (isFile(entry) && !STANDARD_FILES.includes(name))) {
      warnings.push(`${rel(entry)}: not part of the standard - agents look here only for standard names; `
        + 'move project-specific things to pan-harness/project/');
    }
  }
  for (const entry of glob(path.join(H, 'playbooks'), '*')) {
    if (path.basename(entry) !== 'pan-harness.md') {
      warnings.push(`${rel(entry)}: pan-harness/playbooks/ holds only pan-harness.md - project playbooks `
        + 'are looked for elsewhere; move it to pan-harness/project/playbooks/');
    }
  }
  for (const entry of glob(path.join(H, 'scripts'), '*')) {
    if (!SCRIPTS.includes(path.basename(entry))) {
      warnings.push(`${rel(entry)}: not one of the skill's scripts - pan-harness/scripts/ is a copy of the skill `
        + 'and gets replaced; delete it, or move a project script to pan-harness/project/scripts/');
    }
  }
  for (const entry of glob(path.join(H, 'history'), '*')) {
    if (!MONTH_FILE.test(path.basename(entry))) {
      warnings.push(`${rel(entry)}: history/ holds only YYYY-MM.md month files - other files are not `
        + 'searched; move the content into a month file or archive/');
    }
  }
}

// 4. Claude Code reads AGENTS.md only when no CLAUDE.md is present
for (const p of [path.join(ROOT, 'CLAUDE.md'), path.join(ROOT, '.claude', 'CLAUDE.md')]) {
  if (isFile(p) && !read(p).includes('@AGENTS.md')) {
    errors.push(`${rel(p)}: no @AGENTS.md import - Claude Code then ignores AGENTS.md; add the line @AGENTS.md`);
  }
}
if (isFile(path.join(ROOT, 'CLAUDE.local.md'))) {
  warnings.push('CLAUDE.local.md exists - Claude Code then skips AGENTS.md; import @AGENTS.md in it or remove it');
}

const coreDocs = [path.join(ROOT, 'AGENTS.md'), path.join(ROOT, 'PAN-HARNESS.md'), ...glob(H, '*.md'),
  ...glob(path.join(H, 'playbooks'), '*.md'), ...months].filter(isFile);
const journalArchives = ['decisions.md', 'feedback.md', 'lessons.md'].map((f) => path.join(H, 'archive', f)).filter(isFile);
const projectDocs = isDir(P) ? rglob(P, '*.md').filter(isFile) : [];
const docs = [...coreDocs, ...projectDocs];
const text = new Map([...docs, ...journalArchives].map((p) => [p, read(p)]));
const journals = new Set(['decisions.md', 'feedback.md', 'lessons.md'].map((f) => path.join(H, f)));
const startFiles = [path.join(ROOT, 'AGENTS.md'), path.join(ROOT, 'PAN-HARNESS.md'), path.join(H, 'state.md'), path.join(H, 'plan.md')];
const HANDOFF = path.join(H, 'handoff.md');
const monthSet = new Set(months);
const projectSet = new Set(projectDocs);

// 5. what filling a template leaves behind: placeholders, profile markers, the template note
const MARKER = /\[profile: [^\]\n]*\]/;
for (const p of docs) {
  if (/^<!--\s*pan-harness template\./.test(text.get(p))) {
    errors.push(`${rel(p)}: the template note is still at the top - it guides the agent filling the template, `
      + 'not the agents using the harness; delete it once the file is filled');
  }
  splitlines(text.get(p)).forEach((line, i) => {
    const m = PLACEHOLDER.exec(line);
    if (m) {
      errors.push(`${rel(p)}:${i + 1}: unfilled template placeholder ${m[0].slice(0, 40)} `
        + '- an agent would read it as an instruction; fill it in or remove the line');
    }
    const k = MARKER.exec(line);
    if (k) {
      errors.push(`${rel(p)}:${i + 1}: unapplied profile marker ${k[0].slice(0, 60)} - an agent cannot tell whether `
        + "the rule holds here; keep or drop that part for this project's profile and delete the marker "
        + '(references/structure.md -> "Profile")');
    }
  });
}

// 6. required sections and their order
for (const [p, sections] of [[path.join(ROOT, 'AGENTS.md'), AGENTS_SECTIONS], [path.join(ROOT, 'PAN-HARNESS.md'), PAN_SECTIONS]]) {
  if (!isFile(p)) continue;
  const lines = outsideCode(read(p));
  const found = [];
  for (const std of sections) {
    const at = lines.findIndex((line) => starts(line, std));
    if (at >= 0) found.push(at);
    else if (std !== '## Profile') { // a missing profile is reported above
      errors.push(`${rel(p)}: required section '${std}' is missing - agents and the check look for `
        + "the standard sections; add it from the skill's template");
    }
  }
  if (found.some((v, i) => i > 0 && v < found[i - 1])) {
    warnings.push(`${rel(p)}: the standard sections are out of order - agents expect `
      + `${sections.map((s) => s.replace(/^[# ]+/, '')).join(', ')}; reorder them as in the template`);
  }
  if (path.basename(p) === 'AGENTS.md') {
    for (const label of BOUNDARY_LABELS) {
      if (!text.get(p).includes(label)) {
        warnings.push(`AGENTS.md: no ${label} line in the Boundaries block - that kind of hard rule is `
          + 'not visible at a glance; add the line');
      }
    }
    if (stdVersion && /^\d+\.\d+\.\d+$/.test(stdVersion) && atLeast(stdVersion, '1.2.0') && !/^\*\*Writing\*\*\s*$/m.test(text.get(p))) {
      warnings.push("AGENTS.md: no '**Writing**' rule group - the rule that keeps harness rules out of texts for "
        + "people (standard 1.2.0) is missing; add it from the template (references/changelog.md -> 1.2.0, step 1)");
    }
  }
}

// 7. ID sequences and sources
/** IDs of one journal (main file and its archive) must run 1..n. */
function sequence(label, files, pattern) {
  const nums = [];
  for (const p of files) for (const m of outsideCode(read(p)).join('\n').matchAll(pattern)) nums.push(Number(m[1]));
  const sorted = [...nums].sort((a, b) => a - b);
  if (sorted.some((n, i) => n !== i + 1)) {
    const dupes = [...new Set(nums.filter((n, i) => nums.indexOf(n) !== i))].sort((a, b) => a - b);
    const max = nums.length ? Math.max(...nums) : 0;
    const have = new Set(nums);
    const gaps = [];
    for (let n = 1; n <= max; n++) if (!have.has(n)) gaps.push(n);
    errors.push(`${label} numbers are not 1..${nums.length}: duplicates [${dupes.join(', ')}], gaps [${gaps.join(', ')}] - IDs are cited `
      + 'and must never repeat or vanish; renumber only a new entry, restore a lost one from git or archive/');
  }
  return new Set(nums);
}

const pools = {
  F: sequence('F', [path.join(H, 'feedback.md'), path.join(H, 'archive', 'feedback.md')], /^### F(\d+) /gm),
  L: sequence('L', [path.join(H, 'lessons.md'), path.join(H, 'archive', 'lessons.md')], /^- \*\*L(\d+) /gm),
  D: sequence('D', [path.join(H, 'decisions.md'), path.join(H, 'archive', 'decisions.md')], /^- \*\*D(\d+)\*\*/gm),
};
const rules = [];
const ruleFiles = [path.join(ROOT, 'AGENTS.md'), ...glob(path.join(H, 'playbooks'), '*.md'),
  ...(isDir(P) ? rglob(path.join(P, 'playbooks'), '*.md') : [])];
for (const p of ruleFiles) {
  for (const m of read(p).matchAll(/^- \*\*R(\d+)\.(.*)$/gm)) {
    rules.push(Number(m[1]));
    const src = /← ([FLD0-9, ]+)$/.exec(m[2]);
    for (const ref of (src ? src[1] : '').match(/[FLD]\d+/g) || []) {
      if (!pools[ref[0]].has(Number(ref.slice(1)))) {
        errors.push(`${rel(p)}: R${m[1]} source ${ref} does not exist - a rule without its source `
          + 'cannot be judged or removed safely; fix the reference');
      }
    }
  }
}
const sortedRules = [...rules].sort((a, b) => a - b);
if (sortedRules.some((n, i) => n !== i + 1)) {
  errors.push(`R numbers are not 1..${rules.length} (AGENTS.md and playbooks): [${sortedRules.join(', ')}] - rules are cited `
    + 'by number; find the gap or the duplicate');
}
pools.R = new Set(rules);
const ID_REF = new RegExp(`(?<!${W}|-)([FLDR])(\\d+)(?!${W}|[…-])`, 'gu');
for (const p of docs) {
  for (const m of text.get(p).matchAll(ID_REF)) {
    if (!pools[m[1]].has(Number(m[2]))) {
      (projectSet.has(p) ? warnings : errors).push(
        `${rel(p)}: ${m[1]}${m[2]} does not exist - the reference leads nowhere; fix the number or remove it`);
    }
  }
}

// 8. topic tags, listed in the runbook.md "Topic tags" line
const tagLine = splitlines(read(path.join(H, 'runbook.md'))).find((line) => line.includes('Topic tags') || line.includes('Mavzu yorliqlari')) || '';
const TAGS = new Set([...tagLine.matchAll(/`\[([a-z0-9-]+)\]`/g)].map((m) => m[1]));
if (!TAGS.size) {
  errors.push('pan-harness/runbook.md: no topic tag list - journal tags cannot be checked; '
    + "add a 'Topic tags' line with `[tag]` items");
}
const entryLines = new Map([
  [path.join(H, 'feedback.md'), /^### F\d+ /],
  [path.join(H, 'decisions.md'), /^- \*\*D\d+\*\*/],
  [path.join(H, 'lessons.md'), /^- \*\*L\d+ /],
  ...months.map((p) => [p, /^### \d{4}-/]),
]);
for (const [p, pattern] of entryLines) {
  for (const line of outsideCode(read(p))) {
    if (!pattern.test(line)) continue;
    const head = ['decisions.md', 'lessons.md'].includes(path.basename(p)) ? line.slice(0, 200) : line;
    const tags = new Set([...head.matchAll(/\[([a-z0-9-]+)\]/g)].map((m) => m[1]));
    if (!tags.size) {
      errors.push(`${rel(p)}: entry without a topic tag: ${line.slice(0, 70)} - entries are found by tag; `
        + 'add one from runbook.md -> Topic tags');
    }
    if (TAGS.size) {
      for (const tag of [...tags].filter((t) => !TAGS.has(t)).sort()) {
        errors.push(`${rel(p)}: unknown topic tag [${tag}] in: ${line.slice(0, 60)} - add it to runbook.md -> `
          + 'Topic tags or use a listed one');
      }
    }
  }
}

// 9. required fields of journal entries
/** Blocks of lines from a line matching start up to the next start or stop line. */
function entriesOf(body, start, stop) {
  const blocks = [];
  let cur = null;
  for (const line of outsideCode(body)) {
    if (start.test(line)) {
      if (cur) blocks.push(cur);
      cur = [line];
    } else if (cur && stop.test(line)) {
      blocks.push(cur);
      cur = null;
    } else if (cur) cur.push(line);
  }
  if (cur) blocks.push(cur);
  return blocks.map((b) => b.join('\n'));
}

const FIELDS_FROM = config.fields_from || {}; // older, append-only entries keep their format

function require(p, blocks, fields, label, kind) {
  const missing = new Map();
  const since = FIELDS_FROM[kind];
  for (const block of blocks) {
    const name = label.exec(block);
    if (since && name && (kind === 'history' ? name[1] < String(since) : Number(name[1].slice(1)) < Number(since))) continue;
    for (const [field, pattern] of fields) {
      if (!pattern.test(block)) {
        if (!missing.has(field)) missing.set(field, []);
        missing.get(field).push(name ? name[1] : block.slice(0, 20));
      }
    }
  }
  for (const [field, names] of missing) {
    const shown = names.slice(0, 5).join(', ') + (names.length > 5 ? ' …' : '');
    warnings.push(`${rel(p)}: ${names.length} entr${names.length === 1 ? 'y' : 'ies'} without '${field}' `
      + `(${shown}) - the format keeps the 'why' findable later; add it to new entries `
      + '(older ones: check.json fields_from)');
  }
}

const bw = (alts) => new RegExp(`${B0}(${alts}):`, 'u');
require(path.join(H, 'decisions.md'),
  entriesOf(read(path.join(H, 'decisions.md')), /^- \*\*D\d+\*\*/, /^(- \*\*|#|---|\s*$)/),
  [['Why:', bw('Why')], ['Where:', bw('Where')]], /^- \*\*(D\d+)/, 'D');
require(path.join(H, 'feedback.md'),
  entriesOf(read(path.join(H, 'feedback.md')), /^### F\d+ /, /^#/),
  [['Quote:', /\*\*Quote:\*\*/], ['Context:', /\*\*Context:\*\*/],
    ['Result:', /\*\*Result:\*\*/]], /^### (F\d+)/, 'F');
require(path.join(H, 'lessons.md'),
  entriesOf(read(path.join(H, 'lessons.md')), /^- \*\*L\d+ /, /^#/),
  [['Rule:', bw('Rule')], ['Check:', bw('Check')]], /^- \*\*(L\d+)/, 'L');
const historyFields = [['What and why:', /\*\*What and why:\*\*/],
  ['Checks:', /\*\*Checks:\*\*/], ['Files:', /\*\*Files:\*\*/]];
if (liveOn) historyFields.push(['Downtime:', /\*\*Downtime:\*\*/]);
for (const p of months) {
  require(p, entriesOf(read(p), /^### \d{4}-/, /^#{1,3} (?!\d{4}-)/), historyFields, /^### (\d{4}-\d{2}-\d{2})/, 'history');
}

// 10. history: one file per month, order, state date, pending commits
const entries = [];
const blocks = [];
for (const p of months) {
  const body = outsideCode(read(p)).join('\n');
  const dates = [...body.matchAll(/^### (\d{4}-\d{2}-\d{2})/gm)].map((m) => m[1]);
  const stem = path.basename(p, '.md');
  for (const d of dates) {
    if (!d.startsWith(stem)) errors.push(`${rel(p)}: entry ${d} belongs to another month's file - history is searched by month; move it`);
  }
  if (dates.some((d, i) => i > 0 && d < dates[i - 1])) {
    errors.push(`${rel(p)}: entry dates go backwards somewhere - new entries go to the end; reorder them`);
  }
  entries.push(...dates);
  body.split(/^### /m).slice(1).forEach((b) => blocks.push([rel(p), b]));
}
const lastUpdated = /\*\*Last updated:\*\* (\d{4}-\d{2}-\d{2})/.exec(read(path.join(H, 'state.md')));
if (lastUpdated && entries.length && lastUpdated[1] < entries[entries.length - 1]) {
  errors.push(`pan-harness/state.md: 'Last updated' ${lastUpdated[1]} is older than the last history entry `
    + `${entries[entries.length - 1]} - the state may be stale; refresh it (a status check, if the project has one)`);
}
if (hasGit) {
  for (const [name, block] of blocks.slice(0, -1)) {
    if (/^- \*\*Files:\*\*.*pending/m.test(block)) {
      warnings.push(`${name}: entry '${splitlines(block)[0].slice(0, 60)}' still has 'pending' in its Files line `
        + '- later nobody knows which commit it was; write the hash from git log');
    }
  }
}

// 11. dated task rows only in plan.md
for (const p of docs) {
  if (p === path.join(H, 'plan.md')) continue;
  for (const line of outsideCode(text.get(p))) {
    if (DATED_ROW.test(line)) {
      errors.push(`${rel(p)}: dated task row belongs only in plan.md: ${line.slice(0, 60)} - dates elsewhere are `
        + 'not watched; move it to plan.md -> Scheduled');
    }
  }
}

// 12. backticked paths exist (handoff.md lines marked "(new)" name files still to be made)
const prefixes = (config.path_prefixes && config.path_prefixes.length) ? config.path_prefixes : PATH_PREFIXES; // a project list replaces the default
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&'); // '-' needs no escape outside a class (and the u flag forbids it)
const PATH_RE = new RegExp(`\`((?:${prefixes.map(escapeRe).join('|')})/(?:${W}|[./-])*)\``, 'gu');
const extraBases = (config.path_bases || []).flatMap((pattern) => glob(ROOT, pattern)).filter(isDir);
for (const p of docs) {
  const bases = [path.dirname(p), H, P, ROOT, ...extraBases];
  const body = p !== HANDOFF ? text.get(p) : splitlines(text.get(p)).filter((line) => !line.includes('(new)')).join('\n');
  for (const found of [...new Set([...body.matchAll(PATH_RE)].map((m) => m[1]))].sort()) {
    if (['*', '<', 'YYYY', '…', '{{'].some((mark) => found.includes(mark)) || found.startsWith('archive/')) continue;
    const bare = found.replace(/\/+$/, '');
    if (OPTIONAL_DIRS.has(bare.startsWith('pan-harness/') ? bare.slice('pan-harness/'.length) : bare)) continue;
    if (!bases.some((b) => exists(path.join(b, found)))) {
      errors.push(`${rel(p)}: path \`${found}\` does not exist - an agent will look for it in vain; fix the `
        + 'path (in handoff.md, mark a file still to be made with (new))');
    }
  }
}

// 13. section links: "`file.md` → "Section"" must lead to a heading or a bold label of that file
const anchorCache = new Map();
function anchors(p) {
  if (!anchorCache.has(p)) {
    const body = read(p);
    const names = outsideCode(body).filter((line) => line.startsWith('#')).map((line) => line.replace(/^#+/, '').trim());
    for (const m of body.matchAll(/\*\*([^*\n]+)\*\*/g)) names.push(m[1]);
    anchorCache.set(p, names.map((n) => n.replace(/^[ .:]+|[ .:]+$/g, '').toLowerCase()));
  }
  return anchorCache.get(p);
}

for (const p of docs) {
  // a bare file name ("SKILL.md") is looked up only in the harness places: in the project
  // folders (path_bases) many files share such a name
  for (const [i, line] of numberedOutsideCode(text.get(p))) {
    for (const lm of line.matchAll(SECTION_LINK)) {
      const target = lm[1];
      const name = lm[2] ?? lm[3];
      if (['<', '{{', '…'].some((mark) => (target + name).includes(mark))) continue;
      const bases = [path.dirname(p), H, P, ROOT, ...(target.includes('/') ? extraBases : [])];
      const candidates = bases.map((b) => path.join(b, target)).filter(isFile);
      if (!candidates.length) continue; // files outside the known places are not checked here
      const wanted = name.replace(/^[ .:]+|[ .:]+$/g, '').toLowerCase();
      if (!candidates.some((c) => anchors(c).some((a) => a.includes(wanted)))) {
        (journals.has(p) || monthSet.has(p) ? warnings : errors).push(
          `${rel(p)}:${i}: link \`${target}\` → "${name}" leads to no heading or bold label of ${rel(candidates[0])} `
          + '- a renamed section breaks a link silently; point it to the current name (grep the old one)');
      }
    }
  }
}

// 14. the PAN-HARNESS.md map names the standard entries, project/ entries and project playbooks
for (const name of MAP_ENTRIES) {
  if (!panText.includes(`\`${name}\``) && !panText.includes(`\`${name.replace(/\/$/, '')}\``)) {
    warnings.push(`PAN-HARNESS.md: standard entry ${name} is not on the map - agents find files through `
      + 'the map; add it with what it holds and when to read it');
  }
}
if (isDir(P)) {
  for (const entry of sortPaths(listDir(P))) {
    const name = path.basename(entry);
    if (name.startsWith('.') || name === '__pycache__' || name === 'check.json') continue;
    if (!panText.includes(`project/${name}`)) {
      warnings.push(`${rel(entry)}: not on the PAN-HARNESS.md map - an agent will not find it; add it `
        + 'with key words and when to read it');
    }
  }
  for (const playbook of glob(path.join(P, 'playbooks'), '*.md')) {
    const stem = path.basename(playbook, '.md');
    if (!new RegExp(`(?<!${W}|-)${escapeRe(stem)}(?!${W}|-)`, 'u').test(panText)) {
      warnings.push(`${rel(playbook)}: not named on the PAN-HARNESS.md map - an agent will not read it `
        + 'before that kind of work; name it there');
    }
  }
}

// 15. growth and docs read in parts
const startBytes = startFiles.reduce((n, p) => n + Buffer.byteLength(read(p), 'utf8'), 0);
if (startBytes > startLimit) {
  warnings.push(`start set: ${startBytes} bytes (> ${startLimit}) - every session reads it whole; drop `
    + 'duplicates and finished items, move domain rules to their playbooks (P2, P9)');
}
for (const p of docs) {
  const size = Buffer.byteLength(text.get(p), 'utf8');
  if (size > docLimit && !monthSet.has(p)) {
    warnings.push(`${rel(p)}: ${size} bytes (> ${docLimit}) - too big to read; archive closed parts `
      + '(playbooks/pan-harness.md)');
  }
  if (size > READ_WHOLE && !startFiles.includes(p) && !journals.has(p) && !monthSet.has(p)
      && !/^## Contents(?![\p{L}\p{N}_])/mu.test(splitlines(text.get(p)).slice(0, 40).join('\n'))) {
    warnings.push(`${rel(p)}: ${size} bytes and no '## Contents' near the top - an agent reads a doc over `
      + '10 KB only in parts and needs a list of sections to find its part; add one');
  }
}
if (read(path.join(H, 'plan.md')).includes('✅')) {
  warnings.push('pan-harness/plan.md: a finished (✅) item is left - plan.md lists only open work; '
    + 'remove it, the history keeps the record');
}

// 16. criteria: the newest history entry and plan.md
const planText = read(path.join(H, 'plan.md'));
const openItems = outsideCode(planText).filter((line) => /^\s*(?:[-*]|\d+\.|\|)\s/.test(line) && line.includes('⏳')).map((line) => line.trim()); // items, not the header text
if (blocks.length) {
  const [name, block] = blocks[blocks.length - 1];
  const cm = /^- \*\*(?:Checks|Tekshiruv):\*\*([\s\S]*?)(?=^- \*\*[^*\n]+:\*\*|$(?![\s\S]))/m.exec(block);
  const checks = cm ? cm[1] : '';
  for (let part of checks.split(/[;\n]/)) {
    part = part.replace(new RegExp(`^\\s*(?:${W}|[' -]){0,30}:\\s*(?=K\\d)`, 'u'), ''); // a label before the list, e.g. "criteria:"
    if (part.includes('✅') && part.replace(new RegExp(`${B0}K\\d+${B1}|✅|[^\\p{L}\\p{N}]|_`, 'gu'), '').length < 12) {
      warnings.push(`${name}: newest entry, '${part.trim().slice(0, 50)}' - ✅ without evidence; a criterion counts `
        + 'as met only with evidence (P21): add what showed it (number, command, file)');
    }
  }
  if (checks.includes('⏳')) {
    const ds = [...new Set([...block.matchAll(new RegExp(`${B0}D(\\d+)${B1}`, 'gu'))].map((m) => m[1]))].sort((a, b) => a - b);
    if (ds.length && !openItems.some((item) => new RegExp(`${B0}D(?:${ds.join('|')})${B1}`, 'u').test(item))) {
      warnings.push(`${name}: newest entry has ⏳ criteria, but plan.md has no ⏳ item naming `
        + `D${ds.join('/D')} - an open criterion is forgotten unless it is tracked; add it to `
        + 'plan.md -> Later and watch with when and how it is checked');
    }
  }
}
const now = new Date();
const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
const scheduled = section(planText, '## 2. Scheduled');
for (const line of (scheduled.length ? scheduled : section(planText, '## Scheduled'))) {
  const cells = line.split('|').slice(1, 2).map((c) => c.replace(/^[ *]+|[ *]+$/g, ''));
  if (!cells.length) continue;
  const dates = cells[0].match(/\d{4}-\d{2}-\d{2}/g) || [];
  let end = dates.length ? dates[dates.length - 1] : null;
  if (end && cells[0].includes('…') && /…\s*\d{2}-\d{2}(?![\p{L}\p{N}_])/u.test(cells[0]) && !/…\s*\d{4}-/.test(cells[0])) {
    end = end.slice(0, 5) + /…\s*(\d{2}-\d{2})(?![\p{L}\p{N}_])/u.exec(cells[0])[1];
  }
  if (end && end < today) {
    warnings.push(`pan-harness/plan.md: Scheduled row '${cells[0].slice(0, 30)}' is past its date - a dated task `
      + 'is either done or late; remove it (the history keeps it) or give it a new date');
  }
}
if (openItems.length) {
  const shown = openItems.slice(0, 5).map((item) => item.replace(/\*/g, '').replace(/^[- ]+/, '').slice(0, 50)).join('; ');
  notes.push(`open criteria in plan.md: ${openItems.length} (${shown}${openItems.length > 5 ? ' …' : ''}) - `
    + 'close those this task can check (End of task)');
}

// 17. handoff.md: the state of an active large task
if (isFile(HANDOFF)) {
  const ht = text.has(HANDOFF) ? text.get(HANDOFF) : read(HANDOFF);
  const st = /^\*\*Status:\*\*\s*(\w+)/m.exec(ht);
  if (!st) {
    warnings.push("pan-harness/handoff.md: no '**Status:** none' or '**Status:** active' line - the next "
      + 'session cannot tell whether a task is in progress; add it (template handoff.md.tmpl)');
  } else if (st[1] === 'active') {
    const size = Buffer.byteLength(ht, 'utf8');
    if (size > HANDOFF_LIMIT) {
      warnings.push(`pan-harness/handoff.md: ${size} bytes (> ${HANDOFF_LIMIT}) - an active handoff is read at `
        + 'every session start with the start set; move finished stages to the history entry');
    }
    const lines = outsideCode(ht);
    for (const sec of HANDOFF_SECTIONS) {
      if (!lines.some((line) => starts(line, sec))) {
        warnings.push(`pan-harness/handoff.md: an active task without '${sec}' - a new session resumes `
          + 'the task from this file; add the section (template handoff.md.tmpl)');
      }
    }
    const steps = section(ht, '## Steps').filter((line) => line.startsWith('- ')); // nested lines are details
    const actives = steps.filter((line) => line.includes('`active`'));
    if (actives.length > 1) {
      warnings.push(`pan-harness/handoff.md: ${actives.length} steps are \`active\` - one step at a time keeps `
        + 'work finishable (WIP=1); mark the others `todo` or `blocked`');
    }
    for (const line of steps) {
      if (!STEP_STATE.test(line)) {
        warnings.push(`pan-harness/handoff.md: step without a state: '${line.trim().slice(0, 50)}' - a new `
          + 'session cannot tell what is done; add `todo`, `active`, `blocked` or `done`');
      } else if (line.includes('`done`') && line.replace(/`done`|[^\p{L}\p{N}]|_/gu, '').length < 15) {
        warnings.push(`pan-harness/handoff.md: '${line.trim().slice(0, 50)}' - \`done\` without evidence; `
          + 'say what showed it (P21)');
      }
    }
  } else if (st[1] !== 'none') {
    warnings.push(`pan-harness/handoff.md: unknown status '${st[1]}' - the next session reads only `
      + 'none or active; use one of them');
  }
}

// 18. co_change: a watched file changed, the doc that describes it did not
const coChange = config.co_change || {};
if (Object.keys(coChange).length) {
  let changed = null;
  // ROOT's place inside the repository ('' at its top) from git itself: comparing absolute
  // paths breaks where one folder has two spellings (short names and letter case on Windows)
  const prefix = hasGit ? git('rev-parse', '--show-prefix') : null;
  const out = prefix !== null ? git('status', '--porcelain=v1', '-uall') : null;
  if (out !== null) {
    changed = new Set();
    const pre = prefix.trim();
    for (const line of splitlines(out)) {
      const p = line.slice(3).split(' -> ').pop().replace(/^"|"$/g, ''); // relative to the repository top
      if (p.startsWith(pre)) changed.add(p.slice(pre.length));
    }
  }
  if (changed === null) {
    if (hasGit) {
      notes.push('co_change: not checked - git status failed; check by hand that the docs describing the '
        + 'changed files are current (End of task)');
    }
  } else {
    for (const [watched, desc] of Object.entries(coChange)) {
      const described = typeof desc === 'string' ? [desc] : [...desc];
      const hit = (p) => (watched.endsWith('/') ? p.startsWith(watched) : fnmatch(p, watched));
      const touched = [...changed].filter((c) => hit(c) && !described.includes(c)).sort();
      if (touched.length && !described.some((d) => changed.has(d))) {
        warnings.push(`co_change: ${touched.slice(0, 3).join(', ')}${touched.length > 3 ? ' …' : ''} changed `
          + `(git status), ${described.join(' / ')} did not - the doc that describes these files `
          + 'may be stale now; update it, or say in the report why it does not need it');
      }
    }
  }
}

// 19. terms: a term glossed in brackets in a new or changed line ("tekshiruv (check)"); changed
// since HEAD, or since --since COMMIT (ph-doctor). The Glossary keeps one term per concept
// (P26); old text is adapted when someone touches it.
const GLOSS_TERMS = ['structure', 'copy', 'copied', 'move', 'moved', 'migrate', 'migrated', 'migration', 'state', 'status', 'checks?',
  'verification', 'tests?', 'limits?', 'boundary', 'boundaries', 'estimate', 'assumption', 'approval',
  'acceptance criteria', 'task types?', 'append-only', 'invariant', 'checkpoints?', 'cron', 'PII', 'domain rules?',
  'workaround', 'rubric', 'playbooks?', 'executable', 'compaction'];
const TERM = `(?:${GLOSS_TERMS.join('|')})`;
const GLOSS = new RegExp(`[\\p{L}\\p{N}_'’ʻ]*${W}\\s+\\(${TERM}(?:(?:,|\\s+(?:yoki|va|or|and))\\s+${TERM})*\\)`, 'iu');
if (hasGit) {
  const scope = ['AGENTS.md', 'PAN-HARNESS.md', 'CLAUDE.md', 'pan-harness'];
  const fresh = new Map(); // ROOT-relative path -> the numbers of its new lines, null when the whole file is new
  const added = new Set(); // files that did not exist at the base commit
  if (!args.since && git('rev-parse', '--verify', '--quiet', 'HEAD') === null) {
    for (const p of docs) fresh.set(rel(p), null); // no commit yet (ph-init): every line is new
  } else {
    // --relative: paths relative to ROOT, also when the harness sits in a subfolder of the repository
    const diff = git('-c', 'core.quotepath=off', 'diff', '-U0', '--no-color', '--no-ext-diff', '--relative', args.since || 'HEAD', '--', ...scope);
    let file = null;
    let header = false;
    let fromNothing = false;
    let n = 0;
    for (const line of splitlines(diff || '')) {
      if (line.startsWith('diff --git ')) {
        header = true;
        file = null;
        fromNothing = false;
      } else if (header && line.startsWith('--- ')) {
        fromNothing = line === '--- /dev/null';
      } else if (header && line.startsWith('+++ ')) {
        const name = line.slice(4).replace(/^"|"$/g, '');
        file = name.startsWith('b/') ? name.slice(2) : null; // /dev/null: a deleted file
        if (file !== null && !fresh.has(file)) fresh.set(file, new Set());
        if (file !== null && fromNothing) added.add(file);
      } else if (line.startsWith('@@')) {
        header = false;
        n = parseInt((/\+(\d+)/.exec(line) || [0, 0])[1], 10);
      } else if (!header && file !== null && line.startsWith('+')) {
        fresh.get(file).add(n);
        n += 1;
      }
    }
  }
  const untracked = git('-c', 'core.quotepath=off', 'ls-files', '--others', '--exclude-standard', '--', ...scope);
  for (const f of splitlines(untracked || '')) {
    fresh.set(f.replace(/^"|"$/g, ''), null);
    added.add(f.replace(/^"|"$/g, ''));
  }
  for (const [file, lines] of [...fresh].sort(([a], [b]) => comparePaths(a, b))) {
    if (!file.endsWith('.md') || file.startsWith('pan-harness/archive/')) continue; // the archive keeps old text
    const hits = numberedOutsideCode(read(path.join(ROOT, ...file.split('/'))))
      .filter(([i, line]) => (lines === null || lines.has(i)) && GLOSS.test(line));
    if (hits.length) {
      const sample = GLOSS.exec(hits[0][1])[0];
      warnings.push(`terms: ${file}:${hits.slice(0, 5).map(([i]) => i).join(', ')}${hits.length > 5 ? ' …' : ''}: `
        + `a term glossed in brackets ("${sample}") in a new or changed line - one concept then has two names, `
        + 'which blurs the term and costs tokens; write the term alone (Glossary, S27); old text is adapted '
        + 'when it is touched');
    }
  }

  // 19b. review (--since only): every new or changed harness line, flagged with the audit item it
  // may break, so that ph-doctor judges each line instead of skimming whole files (audit.md ->
  // "Writing"). A flag is a hint, not a finding: the agent decides ok or fail.
  if (args.since) {
    const NEG = /(?:ma|mang|mangiz|maydi|maymiz|masin|masdan|maslik)$/;
    // words that only end like a negative verb: nouns and loanwords
    const NOT_NEG = new Set(['hamma', "ko'rsatma", "qo'llanma", 'eslatma', 'chizma', 'yozma', "qo'shma", 'tema', 'sxema',
      'sistema', 'problema', 'firma', 'norma', 'reklama', 'dilemma', 'schema', 'comma', 'prisma', 'figma', 'llama', 'gamma',
      'sigma', 'karma', 'plasma', 'drama', 'panorama', 'magma', 'diploma', 'cinema', 'aroma', 'enigma', 'pragma', 'lemma',
      'dogma', 'stigma', 'trauma', 'puma', 'mama']);
    const isNeg = (w) => w.length > 3 && NEG.test(w) && !NOT_NEG.has(w) && !/(?:noma|gramma|forma)$/.test(w);
    const NEG_EN = /\b(?:do not|don't|never|must not|should not|avoid)\b/i;
    const word = (re) => new RegExp(`(?<![\\p{L}'])(?:${re})(?![\\p{L}'])`, 'iu');
    const VAGUE = word("yetarli\\p{L}*|asosiy\\p{L}*|kerakli\\p{L}*|ba'zi\\p{L}*|imkon qadar|iloji boricha|odatda|taxminan|"
      + 'enough|sufficient\\p{L}*|as needed|if needed|appropriate\\p{L}*|properly');
    const FILLER = word("diqqat bilan|ehtiyot bo'l\\p{L}*|yaxshilab|e'tibor ber\\p{L}*|unutma\\p{L}*|esda tut\\p{L}*|"
      + 'carefully|make sure|be careful|remember to|pay attention');
    const EXCEPTION = word("istisno\\p{L}*|bundan tashqari|except\\p{L}*|unless");
    const prose = (line) => line.replace(/`[^`]*`/g, ' ').replace(/[’ʻ‘]/g, "'"); // code spans are commands and paths
    const LIMIT = 300;
    let shown = 0;
    let total = 0;
    let files = 0;
    for (const [file, lines] of [...fresh].sort(([a], [b]) => comparePaths(a, b))) {
      if (!file.endsWith('.md') || file.startsWith('pan-harness/archive/')) continue;
      const body = read(path.join(ROOT, ...file.split('/')));
      const picked = [];
      let heading = '';
      for (const [i, line] of numberedOutsideCode(body)) {
        if (line.startsWith('## ')) heading = line;
        if ((lines !== null && !lines.has(i)) || !line.trim() || /^\s*\|?[\s:|-]+\|?\s*$/.test(line)) continue;
        const flags = [];
        const text = prose(line);
        const neg = (text.toLowerCase().match(/[\p{L}']+/gu) || []).find(isNeg) || (NEG_EN.exec(text) || [])[0];
        if (neg) flags.push(`A59 negation "${neg}"`);
        if (GLOSS.test(line)) flags.push(`A43 gloss "${GLOSS.exec(line)[0]}"`);
        const step = /^\s*(?:\d+\.|[-*] \[[ x]\])\s/.test(line) || line.includes('⏳')
          || (file === 'pan-harness/handoff.md' && starts(heading, '## Steps')) || /\bCheck:/.test(line);
        const vague = (VAGUE.exec(text) || [])[0];
        if (step || vague) flags.push(`A60 ${step ? 'step' : 'vague'}${vague ? ` "${vague}"` : ''}`);
        const filler = (FILLER.exec(text) || [])[0];
        if (filler) flags.push(`A62 "${filler}"`);
        const exception = (EXCEPTION.exec(text) || [])[0];
        if (exception) flags.push(`A61 "${exception}"`);
        if (/^#{1,4} /.test(line)) flags.push('A20 new section: reachable?');
        if (file === 'PAN-HARNESS.md' && starts(heading, '## Map')) flags.push('A20 map: what, then when');
        picked.push([i, line, flags]);
      }
      if (!picked.length) continue;
      files += 1;
      total += picked.length;
      if (added.has(file) && shown < LIMIT) review.push(`${file} (new file) [A20 pointer in the Map, A61 its format at the top]`);
      for (const [i, line, flags] of picked) {
        if (shown >= LIMIT) break;
        const t = line.trim();
        review.push(`${file}:${i}${flags.length ? ` [${flags.join('; ')}]` : ''}: ${t.length > 160 ? `${t.slice(0, 157)}...` : t}`);
        shown += 1;
      }
    }
    reviewTotal = total;
    if (total > shown) review.push(`... ${total - shown} more line(s): git diff ${args.since} -- AGENTS.md PAN-HARNESS.md pan-harness/`);
    if (total) {
      review.unshift(`${total} new or changed line(s) in ${files} file(s) since ${args.since}: give every flagged line ok or fail `
        + 'with the reason in the conformance table, and read the rest for A61 to A63 (references/audit.md -> "Writing")');
    }
  }
}

// 20. markers: unfinished work in the watched files
const markers = config.markers || {};
if ((markers.patterns || []).length && (markers.paths || []).length) {
  const patterns = [];
  for (const x of markers.patterns) {
    try {
      patterns.push([x, new RegExp(x)]);
    } catch (exc) {
      errors.push(`pan-harness/project/check.json: markers pattern '${x}' is not a valid regular expression `
        + `(${exc.message}) - it finds nothing; fix it`);
    }
  }
  const files = sortPaths(markers.paths.flatMap((g) => glob(ROOT, g)).filter(isFile));
  let hits = 0;
  for (const f of files) {
    splitlines(read(f)).forEach((line, i) => {
      const pat = patterns.find(([, re]) => re.test(line));
      if (pat) {
        hits += 1;
        if (hits <= 20) {
          warnings.push(`${rel(f)}:${i + 1}: marker '${pat[0]}' - unfinished work hides here, plan.md `
            + 'does not see it; finish it or move it to plan.md (check.json markers)');
        }
      }
    });
  }
  if (hits > 20) warnings.push(`markers: ${hits - 20} more not shown`);
}

// 21. never_track: files git should not track (End of task: keep .gitignore current)
if (hasGit) {
  const never = [...NEVER_TRACK, ...(config.never_track || [])];
  const exempt = [...TRACK_OK, ...(config.track_ok || [])];
  const largeMb = config.large_file_mb ?? 50;
  const caught = (p, patterns) => {
    const parts = p.split('/');
    for (const pat of patterns) {
      if (pat.endsWith('/')) {
        if (parts.slice(0, -1).some((part) => fnmatch(part, pat.slice(0, -1)))) return pat;
      } else if (fnmatch(parts[parts.length - 1], pat) || fnmatch(p, pat)) return pat;
    }
    return null;
  };
  const ok = (p) => caught(p, exempt) !== null;
  const tracked = (git('ls-files', '-z') || '').split('\0');
  const untracked = (git('ls-files', '-z', '--others', '--exclude-standard') || '').split('\0');
  let shown = 0;
  for (const f of tracked.filter(Boolean)) {
    const pat = caught(f, never);
    let why = null;
    if (pat && !ok(f)) {
      const kind = !NEVER_TRACK.includes(pat) ? 'check.json never_track' : 'a secret, cache, log or editor file';
      why = `matches '${pat}' (${kind})`;
    } else if (!ok(f)) {
      let size = 0;
      try { size = fs.statSync(path.join(ROOT, f)).size; } catch { size = 0; }
      if (size > largeMb * 2 ** 20) why = `is ${Math.round(size / 2 ** 20)} MB (over large_file_mb ${largeMb})`;
    }
    if (why) {
      shown += 1;
      if (shown <= 10) {
        warnings.push(`never_track: ${f} is tracked and ${why} - git keeps it in every clone and in `
          + 'history; add it to .gitignore and run git rm --cached on it (the file stays on '
          + 'disk); a secret already in history: tell the owner, rotate it, do not rewrite '
          + 'history without the owner (check.json track_ok if it belongs in git)');
      }
    }
  }
  const loose = [];
  for (const f of untracked.filter(Boolean)) {
    const pat = caught(f, never);
    if (pat && !ok(f)) {
      shown += 1;
      if (shown <= 10) {
        warnings.push(`never_track: ${f} is untracked but not ignored and matches '${pat}' - the next `
          + 'git add may take it in; add it to .gitignore');
      }
    } else loose.push(f);
  }
  if (shown > 10) warnings.push(`never_track: ${shown - 10} more not shown`);
  if (loose.length) {
    notes.push(`untracked, not ignored: ${loose.length} (${loose.slice(0, 5).join(', ')}${loose.length > 5 ? ' …' : ''})`
      + ' - commit them with the work, or add them to .gitignore if git should not keep them');
  }
}

// 22. standard version
if (!stdVersion) {
  warnings.push("PAN-HARNESS.md: no 'Standard: pan-harness <version>' line - the harness standard is unknown, "
    + 'so no update steps apply; run ph-doctor: it compares the harness with the standard and adds the line');
} else if (stdVersion !== VERSION) {
  warnings.push(`PAN-HARNESS.md: standard ${stdVersion}, this script ${VERSION} - the harness and the skill `
    + "differ; run ph-update (ph-doctor when its changelog.md does not list this version)");
}

// 23. project extensions
let extCount = 0;
const extDir = path.join(P, 'scripts');
const extensions = isDir(P) ? glob(extDir, 'check-*').filter((f) => /\.(mjs|js|py)$/.test(f)) : [];
for (const ext of extensions) {
  extCount += 1;
  const name = path.basename(ext);
  const runner = ext.endsWith('.py') ? 'python3' : process.execPath;
  const run = spawnSync(runner, [ext, '--root', ROOT, ...(args.live ? ['--live'] : [])],
    { encoding: 'utf8', timeout: 600000, maxBuffer: 64 * 1024 * 1024 });
  if (run.error) {
    errors.push(`${rel(ext)}: could not run (${run.error.message}) - its checks are missing from this result; run it by hand`);
    continue;
  }
  let found = false;
  for (const line of splitlines((run.stdout || '') + (run.stderr || ''))) {
    if (line.startsWith('ERROR')) {
      errors.push(`${name}: ${line.slice(5).trim()}`);
      found = true;
    } else if (line.startsWith('WARN')) {
      warnings.push(`${name}: ${line.slice(4).trim()}`);
    }
  }
  if (run.status !== 0 && !found) {
    errors.push(`${rel(ext)}: exited with ${run.status} - its checks are missing from this result; run it by hand`);
  }
}

for (const e of errors) console.log(`ERROR ${e}`);
for (const w of warnings) console.log(`WARN  ${w}`);
for (const n of notes) console.log(`NOTE  ${n}`);
for (const r of review) console.log(`REVIEW ${r}`);
console.log(`pan-harness-check ${VERSION}: ${errors.length} error(s), ${warnings.length} warning(s); `
  + `start set ${startBytes} bytes (limit ${startLimit}); ${extCount} extension(s); ${openItems.length} open ⏳`
  + `${args.since ? `; ${reviewTotal} line(s) to review` : ''}`);
process.exitCode = errors.length ? 1 : 0;
