// pan-harness-check.mjs, secret-check.mjs and the pre-commit hook template on a small
// harness built in a throwaway git repository: each defect is caught, a clean harness is silent.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CORE = path.join(ROOT, 'core');
const VERSION = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8')).version;
// the fixture's dates: today, so that no fixed date sits in this file
const DAY = new Date().toISOString().slice(0, 10);
const MONTH = DAY.slice(0, 7);

const FILES = {
  'AGENTS.md': `# Demo

Entry point for any agent. The harness is described in \`PAN-HARNESS.md\`.

## Project

- **Demo** — a small document project.

## Boundaries

- **Never:** push (R1).
- **Ask first:** deleting files (R1).
- **Always:** one thing at a time (R1).

## Session start

1. Read this file, then \`PAN-HARNESS.md\`.

## Workflow

1. **Question** — answer with read-only commands.

## Working style

- Check every claim.

## Rules

- **R1. One thing at a time.** Finish it and stop. ← F1

**Writing**
- **R2. Write for the reader.** Texts for people follow the owner. ← F1

**Communication**
- **R3. Egasi bilan suhbatda write briefly.** ← F1
  - Egasi harness fayllarini o'qimaydi: no labels like A1, P1, S2, K4 in the messages to the owner.
`,
  'PAN-HARNESS.md': `# PAN-HARNESS

## Profile

Profile: live-system=no, code=no, sensitive-data=secrets

## Map

- \`state.md\`, \`plan.md\`, \`handoff.md\`, \`system-map.md\`, \`runbook.md\`.
- \`decisions.md\`, \`feedback.md\`, \`lessons.md\`, \`history/\`, \`archive/\`, \`playbooks/pan-harness.md\`, \`scripts/\`.

## Journals

- Journals are append-only.

## End of task

- [ ] Run the checks.

## Growth limits

- Limits are in \`project/check.json\`.

## Project checks

None.

Standard: pan-harness ${VERSION}
`,
  'pan-harness/state.md': `# State\n\n**Last updated:** ${DAY}\n`,
  'pan-harness/plan.md': '# Plan\n\n## 1. Queue\n\n## 2. Scheduled\n\n| Date | Task |\n|---|---|\n',
  'pan-harness/handoff.md': '# Handoff\n\n**Status:** none\n',
  'pan-harness/system-map.md': '# System map\n\n- Chapters in `docs/`.\n',
  'pan-harness/runbook.md': '# Runbook\n\n- **Topic tags:** `[docs]` `[workflow]`\n',
  'pan-harness/decisions.md': `# Decisions\n\n- **D1** (${DAY}) [docs] The standard. Why: a test. Where: here.\n`,
  'pan-harness/feedback.md': `# Feedback\n\n### F1 — ${DAY} — One thing at a time [workflow]\n- **Quote:** "one at a time"\n- **Context:** a test.\n- **Result:** R1.\n`,
  'pan-harness/lessons.md': `# Lessons\n\n- **L1 (${DAY}) — A lesson.** [docs]\n  - Rule: do it.\n  - Check: see it.\n`,
  'pan-harness/playbooks/pan-harness.md': '# Playbook: pan-harness\n\n- Run ph-doctor monthly.\n',
  [`pan-harness/history/${MONTH}.md`]: `# History ${MONTH}\n\n### ${DAY} — Harness created [docs]\n- **What and why:** created.\n- **Checks:** checks ran.\n- **Files:** all. (commit: abc1234)\n`,
  'pan-harness/project/check.json': '{}\n',
  'docs/chapter-1.md': '# Chapter 1\n',
};

function git(dir, ...args) {
  const r = spawnSync('git', args, { cwd: dir, encoding: 'utf8' });
  assert.equal(r.status, 0, `git ${args.join(' ')}: ${r.stderr}`);
  return r.stdout;
}

/** A clean 1.0.0 harness in a fresh git repository (everything committed). */
function harness({ gitInit = true } = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ph-check-'));
  for (const [rel, body] of Object.entries(FILES)) {
    fs.mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true });
    fs.writeFileSync(path.join(dir, rel), body);
  }
  fs.mkdirSync(path.join(dir, 'pan-harness', 'scripts'), { recursive: true });
  for (const s of ['pan-harness-check.mjs', 'secret-check.mjs']) {
    fs.copyFileSync(path.join(CORE, 'scripts', s), path.join(dir, 'pan-harness', 'scripts', s));
  }
  if (gitInit) {
    git(dir, 'init', '-q', '-b', 'main');
    git(dir, 'config', 'user.name', 'Test');
    git(dir, 'config', 'user.email', 'test@example.com');
    git(dir, 'config', 'core.autocrlf', 'false');
    git(dir, 'add', '-A');
    git(dir, 'commit', '-q', '-m', 'init');
  }
  return dir;
}

function check(dir, ...extra) {
  const r = spawnSync(process.execPath, [path.join(dir, 'pan-harness', 'scripts', 'pan-harness-check.mjs'), ...extra], { cwd: dir, encoding: 'utf8' });
  return { code: r.status, out: r.stdout + r.stderr };
}

function secrets(dir, ...paths) {
  const r = spawnSync(process.execPath, [path.join(dir, 'pan-harness', 'scripts', 'secret-check.mjs'), ...paths], { cwd: dir, encoding: 'utf8' });
  return { code: r.status, out: r.stdout + r.stderr };
}

function put(dir, rel, data, commit = false) {
  fs.mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true });
  fs.writeFileSync(path.join(dir, rel), data);
  if (commit) {
    git(dir, 'add', '-f', rel);
    git(dir, 'commit', '-q', '-m', rel);
  }
}

// fake secrets, built at run time so that this file itself holds none (secret scanners,
// push protection): AWS's documented example key and a URL with a made-up password
const FAKE_KEY = ['AKIA', 'IOSFODNN7', 'EXAMPLE'].join('');
const FAKE_URL = ['https://user', ':hunter2', 'pass@example.com/x'].join('');

const edit = (dir, rel, from, to) => {
  const f = path.join(dir, rel);
  const s = fs.readFileSync(f, 'utf8');
  assert.ok(s.includes(from), `${rel}: ${from}`);
  fs.writeFileSync(f, s.replace(from, to));
};

test('the script versions match the package', () => {
  const src = fs.readFileSync(path.join(CORE, 'scripts', 'pan-harness-check.mjs'), 'utf8');
  assert.match(src, new RegExp(`const VERSION = '${VERSION.replace(/\./g, '\\.')}'`));
});

test('a clean harness: no error, no warning', () => {
  const r = check(harness());
  assert.equal(r.code, 0, r.out);
  assert.match(r.out, /0 error\(s\), 0 warning\(s\)/, r.out);
});

test('outside a git repository: an error', () => {
  const r = check(harness({ gitInit: false }));
  assert.equal(r.code, 1);
  assert.match(r.out, /^ERROR .*not inside a git repository/m);
});

test('profile: an unknown flag is an error', () => {
  const dir = harness();
  edit(dir, 'PAN-HARNESS.md', 'Profile: ', 'Profile: foo=yes, ');
  assert.match(check(dir).out, /^ERROR PAN-HARNESS\.md: unknown Profile flag foo/m);
});

test('an unfilled template placeholder is an error', () => {
  const dir = harness();
  edit(dir, 'AGENTS.md', '- Check every claim.', '- {{rule from the owner}}');
  assert.match(check(dir).out, /^ERROR AGENTS\.md:\d+: unfilled template placeholder/m);
});

test('a missing reference and a broken section link are errors', () => {
  const dir = harness();
  edit(dir, 'pan-harness/system-map.md', '- Chapters in `docs/`.', '- See D9 and `runbook.md` → "Nowhere".');
  const out = check(dir).out;
  assert.match(out, /^ERROR pan-harness\/system-map\.md: D9 does not exist/m);
  assert.match(out, /^ERROR pan-harness\/system-map\.md:3: link `runbook\.md` → "Nowhere" leads to no heading/m);
});

test('scripts: a missing copy is an error, any other file in scripts/ a warning', () => {
  const dir = harness();
  fs.rmSync(path.join(dir, 'pan-harness', 'scripts', 'secret-check.mjs'));
  put(dir, 'pan-harness/scripts/helper.sh', 'echo\n');
  const out = check(dir).out;
  assert.match(out, /^ERROR missing standard file: pan-harness[\\/]scripts[\\/]secret-check\.mjs/m);
  assert.match(out, /^WARN +pan-harness[\\/]scripts[\\/]helper\.sh: not one of the skill's scripts/m);
});

test('the Writing rule group: missing in a 1.2.0 harness is a warning, in an older one not', () => {
  const dir = harness();
  edit(dir, 'AGENTS.md', '**Writing**\n', '');
  assert.match(check(dir).out, /^WARN +AGENTS\.md: no '\*\*Writing\*\*' rule group/m);
  edit(dir, 'PAN-HARNESS.md', `Standard: pan-harness ${VERSION}`, 'Standard: pan-harness 1.1.0');
  assert.doesNotMatch(check(dir).out, /'\*\*Writing\*\*' rule group/);
});

test('open criteria: a ⏳ in the plan.md header text is not an item', () => {
  const dir = harness();
  edit(dir, 'pan-harness/plan.md', '# Plan\n', '# Plan\n\nHar ⏳ band qachon tekshirilishi bilan yoziladi.\n');
  assert.match(check(dir).out, /0 open ⏳/);
});

test('the standard version: another one points to ph-update, a missing line to ph-doctor', () => {
  const dir = harness();
  edit(dir, 'PAN-HARNESS.md', `Standard: pan-harness ${VERSION}`, 'Standard: pan-harness 0.1.0');
  assert.match(check(dir).out, /^WARN +PAN-HARNESS\.md: standard 0\.1\.0, this script .* run ph-update/m);
  edit(dir, 'PAN-HARNESS.md', 'Standard: pan-harness 0.1.0', '');
  assert.match(check(dir).out, /^WARN +PAN-HARNESS\.md: no 'Standard: pan-harness <version>' line .* run ph-doctor/m);
});

test('never_track: tracked and untracked files git should not keep', () => {
  const dir = harness();
  put(dir, '.env', 'A=1\n', true);
  put(dir, '.env.example', 'A=\n', true);
  put(dir, 'notes/~$draft.docx', 'lock', true);
  put(dir, '.env.local', 'A=1\n');
  put(dir, 'docs/chapter-2.md', '# Chapter 2\n');
  const out = check(dir).out;
  assert.match(out, /^WARN +never_track: \.env is tracked and matches '\.env'/m);
  assert.doesNotMatch(out, /never_track: \.env\.example/);
  assert.match(out, /^WARN +never_track: notes\/~\$draft\.docx is tracked/m);
  assert.match(out, /^WARN +never_track: \.env\.local is untracked but not ignored/m);
  assert.match(out, /^NOTE +untracked, not ignored: 1 \(docs\/chapter-2\.md\)/m);
});

test('never_track: large files, track_ok and project patterns', () => {
  const dir = harness();
  fs.writeFileSync(path.join(dir, 'pan-harness/project/check.json'), JSON.stringify({ large_file_mb: 1, never_track: ['exports/'], track_ok: ['logs/kept.log'] }));
  put(dir, 'assets/big.bin', Buffer.alloc(2 * 2 ** 20, 1), true);
  put(dir, 'exports/book.pdf', 'pdf', true);
  put(dir, 'logs/kept.log', 'kept', true);
  const out = check(dir).out;
  assert.match(out, /^WARN +never_track: assets\/big\.bin is tracked and is 2 MB \(over large_file_mb 1\)/m);
  assert.match(out, /^WARN +never_track: exports\/book\.pdf is tracked and matches 'exports\/' \(check\.json never_track\)/m);
  assert.doesNotMatch(out, /logs\/kept\.log/);
});

test('co_change: a watched file changed and its doc did not', () => {
  const dir = harness();
  fs.writeFileSync(path.join(dir, 'pan-harness/project/check.json'), JSON.stringify({ co_change: { 'docs/': ['pan-harness/system-map.md'] } }));
  git(dir, 'add', '-A');
  git(dir, 'commit', '-q', '-m', 'co_change');
  put(dir, 'docs/chapter-1.md', '# Chapter 1, edited\n');
  assert.match(check(dir).out, /^WARN +co_change: docs\/chapter-1\.md changed \(git status\), pan-harness\/system-map\.md did not/m);
  put(dir, 'pan-harness/system-map.md', '# System map\n\n- Chapters in `docs/`, edited.\n');
  assert.doesNotMatch(check(dir).out, /co_change/);
});

test('co_change: a harness in a subfolder of the repository sees its own changes', () => {
  const dir = harness();
  const top = fs.mkdtempSync(path.join(os.tmpdir(), 'ph-mono-'));
  fs.renameSync(path.join(dir, '.git'), path.join(top, '.git'));
  fs.cpSync(dir, path.join(top, 'apps', 'book'), { recursive: true });
  git(top, 'add', '-A');
  git(top, 'commit', '-q', '-m', 'move');
  const sub = path.join(top, 'apps', 'book');
  put(sub, 'pan-harness/project/check.json', '{"co_change": {"docs/": ["pan-harness/system-map.md"]}}\n', true);
  fs.appendFileSync(path.join(sub, 'docs', 'chapter-1.md'), 'more\n');
  assert.match(check(sub).out, /^WARN +co_change: docs\/chapter-1\.md changed \(git status\), pan-harness\/system-map\.md did not/m);
});

test('secret-check: clean, then a token in the harness and one in a staged file', () => {
  const dir = harness();
  let r = secrets(dir);
  assert.equal(r.code, 0, r.out);
  assert.match(r.out, /RESULT: clean/);
  put(dir, 'pan-harness/notes.md', `key ${FAKE_KEY}\n`);
  r = secrets(dir);
  assert.equal(r.code, 1);
  assert.match(r.out, /aws-access-key: pan-harness[\\/]notes\.md:1/);
  fs.rmSync(path.join(dir, 'pan-harness/notes.md'));
  put(dir, 'src/config.txt', `url ${FAKE_URL}\nok https://user:<password>@example.com/x\n`);
  r = secrets(dir, 'src/config.txt');
  assert.equal(r.code, 1);
  assert.match(r.out, /url-with-password: src[\\/]config\.txt:1/);
  assert.doesNotMatch(r.out, /config\.txt:2/);
});

test('the pre-commit hook passes a clean commit and stops a staged secret', { skip: process.platform === 'win32' && 'needs sh' }, () => {
  const dir = harness();
  fs.mkdirSync(path.join(dir, '.githooks'));
  fs.copyFileSync(path.join(CORE, 'templates', 'githooks', 'pre-commit.tmpl'), path.join(dir, '.githooks', 'pre-commit'));
  fs.chmodSync(path.join(dir, '.githooks', 'pre-commit'), 0o755);
  git(dir, 'config', 'core.hooksPath', '.githooks');
  git(dir, 'add', '-A');
  const env = { ...process.env, PATH: `${path.dirname(process.execPath)}${path.delimiter}${process.env.PATH}` };
  let r = spawnSync('git', ['commit', '-q', '-m', 'hook'], { cwd: dir, encoding: 'utf8', env });
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stderr, /pan-harness checks passed/);
  put(dir, 'docs/keys.md', `${FAKE_KEY}\n`);
  git(dir, 'add', 'docs/keys.md');
  r = spawnSync('git', ['commit', '-q', '-m', 'secret'], { cwd: dir, encoding: 'utf8', env });
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /secret-check is not clean/);
});

test('terms: a glossed term in a new or changed line is a warning, old text is not', () => {
  const dir = harness();
  put(dir, 'pan-harness/system-map.md', '# System map\n\n- Chapters in `docs/`: tuzilma (structure) eski.\n', true);
  assert.doesNotMatch(check(dir).out, /terms:/);
  fs.appendFileSync(path.join(dir, 'pan-harness', 'lessons.md'),
    `- **L2 (${DAY}) — Another lesson.** [docs]\n  - Rule: tekshiruvni (check) ishga tushir.\n  - Check: see it.\n`);
  const out = check(dir).out;
  assert.match(out, /^WARN +terms: pan-harness\/lessons\.md:7: a term glossed in brackets \("tekshiruvni \(check\)"\)/m, out);
  assert.doesNotMatch(out, /system-map/);
  edit(dir, 'pan-harness/system-map.md', 'eski', 'yangi'); // a touched line is new text
  assert.match(check(dir).out, /^WARN +terms: pan-harness\/system-map\.md:3: .*\("tuzilma \(structure\)"\)/m);
});

test('terms: untracked files, code blocks, the archive and a harness in a subfolder', () => {
  const dir = harness();
  put(dir, 'pan-harness/project/notes.md', "# Notes\n\n```\nko'chirish (move) in a code block\n```\n\nchegara (limit yoki boundary) here\n");
  put(dir, 'pan-harness/archive/old-notes.md', "# Old notes\n\nko'chirish (move) moved here as it was\n");
  const out = check(dir).out;
  assert.match(out, /^WARN +terms: pan-harness\/project\/notes\.md:7: .*\("chegara \(limit yoki boundary\)"\)/m, out);
  assert.doesNotMatch(out, /terms: pan-harness\/archive/);

  const top = fs.mkdtempSync(path.join(os.tmpdir(), 'ph-mono-'));
  const base = harness();
  fs.renameSync(path.join(base, '.git'), path.join(top, '.git'));
  fs.cpSync(base, path.join(top, 'apps', 'book'), { recursive: true });
  git(top, 'add', '-A');
  git(top, 'commit', '-q', '-m', 'move');
  const sub = path.join(top, 'apps', 'book');
  edit(sub, 'pan-harness/plan.md', '## 1. Queue\n', '## 1. Queue\n\n- holat (state) bandi\n');
  assert.match(check(sub).out, /^WARN +terms: pan-harness\/plan\.md:5: /m);
});

test('terms: --since reads the lines changed since a commit, committed ones too', () => {
  const dir = harness();
  const base = git(dir, 'rev-parse', 'HEAD').trim();
  put(dir, 'pan-harness/system-map.md', '# System map\n\n- Chapters in `docs/`: tuzilma (structure) yangi.\n', true);
  assert.doesNotMatch(check(dir).out, /terms:/); // committed, so HEAD shows no change
  assert.match(check(dir, '--since', base).out, /^WARN +terms: pan-harness\/system-map\.md:3: /m);
  const bad = check(dir, '--since', 'no-such-commit');
  assert.equal(bad.code, 2);
  assert.match(bad.out, /--since no-such-commit: no such commit/);
});

test('review: --since lists every new line with the audit items it may break', () => {
  const dir = harness();
  const base = git(dir, 'rev-parse', 'HEAD').trim();
  edit(dir, 'PAN-HARNESS.md', '## Map\n', "## Map\n\n- `project/release.md` — fayl.\n");
  put(dir, 'pan-harness/project/release.md', '# Release\n\n1. Testlarni yetarlicha ishga tushir.\n\n```\nnpm publish # qilma\n```\n\n'
    + "Istisno: hotfix istalgan kuni.\nKo'rsatma egasidan keladi.\n- Matnni diqqat bilan o'qi va xato qilma.\n- Eksport tekshiruvi (check) bor.\n", true);
  const out = check(dir, '--since', base).out;
  assert.match(out, /^REVIEW 7 new or changed line\(s\) in 2 file\(s\) since [0-9a-f]+: give every flagged line ok or fail/m, out);
  assert.match(out, /^REVIEW PAN-HARNESS\.md:\d+ \[A20 map: what, then when\]: - `project\/release\.md` — fayl\.$/m);
  assert.match(out, /^REVIEW pan-harness\/project\/release\.md \(new file\) \[A20 pointer in the Map, A61 its format at the top\]$/m);
  assert.match(out, /^REVIEW pan-harness\/project\/release\.md:1 \[A20 new section: reachable\?\]: # Release$/m);
  assert.match(out, /^REVIEW pan-harness\/project\/release\.md:3 \[A60 step "yetarlicha"\]: 1\. Testlarni/m);
  assert.match(out, /^REVIEW pan-harness\/project\/release\.md:9 \[A61 "Istisno"\]: /m);
  assert.match(out, /^REVIEW pan-harness\/project\/release\.md:10: Ko'rsatma egasidan keladi\.$/m); // a noun, not a negation
  assert.match(out, /^REVIEW pan-harness\/project\/release\.md:11 \[A59 negation "qilma"; A62 "diqqat bilan"\]: /m);
  assert.match(out, /^REVIEW pan-harness\/project\/release\.md:12 \[A43 gloss "tekshiruvi \(check\)"\]: /m);
  assert.doesNotMatch(out, /# qilma/); // code blocks are left out
  assert.match(out, /; 7 line\(s\) to review$/m);
  assert.doesNotMatch(check(dir).out, /^REVIEW/m); // without --since: no list
});

test('terms: before the first commit every line of the harness is new', () => {
  const dir = harness({ gitInit: false });
  git(dir, 'init', '-q', '-b', 'main');
  put(dir, 'pan-harness/state.md', `# State\n\n**Last updated:** ${DAY}\n\nholat (state) yozildi\n`);
  assert.match(check(dir).out, /^WARN +terms: pan-harness\/state\.md:5: /m);
});

test('the rule against internal labels: missing in a 1.3.0 harness is a warning, in an older one not', () => {
  const dir = harness();
  edit(dir, 'PAN-HARNESS.md', `Standard: pan-harness ${VERSION}`, 'Standard: pan-harness 1.3.0');
  assert.doesNotMatch(check(dir).out, /internal labels/);
  edit(dir, 'AGENTS.md', "  - Egasi harness fayllarini o'qimaydi: no labels like A1, P1, S2, K4 in the messages to the owner.\n", '');
  assert.match(check(dir).out, /^WARN +AGENTS\.md: no rule against internal labels in the messages to the owner/m);
  edit(dir, 'PAN-HARNESS.md', 'Standard: pan-harness 1.3.0', 'Standard: pan-harness 1.2.0');
  assert.doesNotMatch(check(dir).out, /internal labels/);
});
