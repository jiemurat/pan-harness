// scaffold.mjs (ph-init) and migrate.mjs (ph-update) on throwaway projects: the templates land
// in place and the check lists what is left to fill; a 1.0.0 harness moves to 1.1.0 with its
// journal entries untouched, and a second run changes nothing.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SKILL = path.join(ROOT, 'skills', 'ph-update');
const VERSION = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8')).version;
const DAY = new Date().toISOString().slice(0, 10);
const MONTH = DAY.slice(0, 7);

function git(dir, ...args) {
  const r = spawnSync('git', args, { cwd: dir, encoding: 'utf8' });
  assert.equal(r.status, 0, `git ${args.join(' ')}: ${r.stderr}`);
  return r.stdout;
}
function repo() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ph-scripts-'));
  git(dir, 'init', '-q', '-b', 'main');
  git(dir, 'config', 'user.name', 'Test');
  git(dir, 'config', 'user.email', 'test@example.com');
  git(dir, 'config', 'core.autocrlf', 'false');
  return dir;
}
const run = (script, ...args) => spawnSync(process.execPath, [path.join(SKILL, 'scripts', script), ...args], { encoding: 'utf8' });
const read = (dir, rel) => fs.readFileSync(path.join(dir, ...rel.split('/')), 'utf8');
function put(dir, rel, body) {
  fs.mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true });
  fs.writeFileSync(path.join(dir, rel), body);
}

test('scaffold: copies every template once, sets the hook, the check lists what is left to fill', () => {
  const dir = repo();
  const r = run('scaffold.mjs', '--root', dir, '--secrets');
  assert.equal(r.status, 0, r.stderr);
  for (const rel of ['AGENTS.md', 'PAN-HARNESS.md', 'pan-harness/state.md', 'pan-harness/runbook.md', 'pan-harness/decisions.md',
    `pan-harness/history/${MONTH}.md`, 'pan-harness/playbooks/pan-harness.md', 'pan-harness/project/check.json',
    'pan-harness/scripts/pan-harness-check.mjs', 'pan-harness/scripts/secret-check.mjs', '.githooks/pre-commit']) {
    assert.ok(fs.existsSync(path.join(dir, rel)), rel);
  }
  assert.match(read(dir, 'PAN-HARNESS.md'), new RegExp(`^Standard: pan-harness ${VERSION.replace(/\./g, '\\.')}$`, 'm'));
  assert.match(read(dir, `pan-harness/history/${MONTH}.md`), new RegExp(`^# History: ${MONTH}$`, 'm'));
  assert.equal(git(dir, 'config', '--get', 'core.hooksPath').trim(), '.githooks');
  const check = spawnSync(process.execPath, [path.join(dir, 'pan-harness/scripts/pan-harness-check.mjs'), '--root', dir], { encoding: 'utf8' });
  assert.equal(check.status, 1);
  assert.match(check.stdout, /^ERROR AGENTS\.md: the template note is still at the top/m);
  assert.match(check.stdout, /^ERROR AGENTS\.md:\d+: unapplied profile marker \[profile: /m);
  assert.match(check.stdout, /^ERROR AGENTS\.md:\d+: unfilled template placeholder/m);

  fs.writeFileSync(path.join(dir, 'AGENTS.md'), '# Mine\n');
  const again = run('scaffold.mjs', '--root', dir);
  assert.equal(again.status, 0);
  assert.match(again.stdout, /^kept {4}AGENTS\.md/m);
  assert.equal(read(dir, 'AGENTS.md'), '# Mine\n');
});

test('scaffold: another pre-commit hook is left for the owner', () => {
  const dir = repo();
  put(dir, '.pre-commit-config.yaml', 'repos: []\n');
  const r = run('scaffold.mjs', '--root', dir);
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /already has a pre-commit hook \(\.pre-commit-config\.yaml\)/);
  assert.equal(spawnSync('git', ['config', '--get', 'core.hooksPath'], { cwd: dir, encoding: 'utf8' }).stdout.trim(), '');
});

// a small 1.0.0 harness: the standard's 1.0.0 lines where 1.1.0 changed them, plus project text
const OLD = {
  'PAN-HARNESS.md': `# PAN-HARNESS

## Profile

Profile: live-system=no, code=yes, sensitive-data=none

## Map

- \`state.md\`, \`plan.md\`, \`handoff.md\`, \`system-map.md\`.
- \`runbook.md\` — buyruqlar, skriptlar, hujjat yozish uslubi, topic tag'lar, accepted warnings (buyruq kerak bo'lganda va hujjat yozishdan oldin).
- \`decisions.md\`, \`feedback.md\`, \`lessons.md\`, \`history/\`, \`archive/\`, \`playbooks/pan-harness.md\`, \`scripts/\`.

## Journals

- Journals are append-only.

## End of task

- [ ] Hujjatni \`runbook.md\` → \`Writing docs\` uslubida yoz.
- [ ] Commit (R1). Xabar \`runbook.md\` → \`Writing docs\` bo'yicha.

## Growth limits

- Limits are in \`project/check.json\`.

## Project checks

None.

Standard: pan-harness 1.0.0
`,
  'pan-harness/runbook.md': `# Runbook

Ko'p ishlatiladigan buyruqlar va hujjat yozish qoidalari. Loyihaning README yoki Makefile'ida bor buyruqni bu yerga ko'chirma (copy), unga havola ber.

## 4. Writing docs

- **Til:** o'zbekcha. Kod izohlari inglizcha.
- **Atamalar:** atamalar inglizcha, noaniq so'z birinchi uchraganda yonida inglizchasi qavsda.
- Maydon nomlari, sarlavhalar va jadval ustunlari inglizcha (pan-harness standarti).
- Buyruq, yo'l, ID va sozlama kalitlari backtick ichida yoziladi.
- **Shakl:** qisqa gaplar va ro'yxatlar, bitta bandda bitta fikr. Ko'rsatma buyruq shaklida, bajaruvchi aniq bo'ladi.
- **Sana va vaqt:** sanalar \`YYYY-MM-DD\`, vaqt UTC bo'yicha.
- **Har fakt bitta joyda yuritiladi** (\`PAN-HARNESS.md\` → \`Map\`): joriy holat (state) \`state.md\` da, kelajakdagi ishlar va sanalar \`plan.md\` da, tuzilma \`system-map.md\` da.
- **Loyiha qoidasi:** chapters are numbered.
- **Topic tags:** \`[docs]\` \`[workflow]\`

## 5. Accepted warnings

Yo'q.
`,
  'pan-harness/decisions.md': `# Decisions

Bu faylda tizim va harness haqidagi amaldagi qarorlar turadi: nima tanlangani, nega, qaysi variantlar rad etilgani va qarorning qayerda amalga oshgani. Egasining ishlash uslubi haqidagi ko'rsatmalari bu yerda emas, \`feedback.md\` da turadi.
- **Shakl.** Har qaror bitta paragraf: \`- **D<n>** (YYYY-MM-DD) [tag] Qaror. Why: … Rejected: … Where: …\`. \`Where:\` qaror qaysi fayl yoki sozlamada amalga oshganini ko'rsatadi. Qarorga tayanishdan oldin o'sha joyni tekshir.

---

- **D1** (${DAY}) [docs] The standard. Why: a test. Where: \`PAN-HARNESS.md\`.
`,
  'pan-harness/feedback.md': `# Feedback\n\n### F1 — ${DAY} — One thing at a time [workflow]\n- **Quote:** "one at a time"\n- **Context:** a test.\n- **Result:** R1.\n`,
  'pan-harness/lessons.md': `# Lessons

Bu faylda ishlardagi xatolar va ulardan chiqqan saboqlar (L…) turadi. \`AGENTS.md\` dagi qoidalar ularga \`← L…\` bilan havola beradi. Har saboq sarlavhasidan keyin topic tag turadi (\`runbook.md\` → \`Writing docs\`).

- **L1 (${DAY}) — A lesson (\`runbook.md\` → \`Writing docs\`).** [docs]
  - Rule: do it.
  - Check: see it.
`,
  'pan-harness/plan.md': "# Plan\n\nBarcha ochiq ishlar, turidan qat'i nazar. Bajarilgan ishni o'chir (yozuvi `history/` da qoladi). Sanali ishlarni faqat shu faylga yoz.\n\n## 1. Queue\n\n## 2. Scheduled\n\n| Date | Task |\n|---|---|\n",
  'pan-harness/handoff.md': "# Handoff\n\nFaol large task'ning holati (state). Agent uni har holat xabarida, egasidan savol so'rab to'xtashdan oldin va kontekst tugashiga yaqin yangilaydi; kontekst tugayotganda ham tekshiruvlar (checks) qisqartirilmaydi. Yangi sessiya ishni shu fayldan davom ettiradi.\n\n**Status:** none\n",
  [`pan-harness/history/${MONTH}.md`]: `# History: ${MONTH}

Har ish uchun bitta yozuv, yangisi oxiriga qo'shiladi. Har oy o'z faylida: oy boshida yangi fayl ochiladi va bu sarlavha unga ko'chiriladi (copy). Qoidalar: \`PAN-HARNESS.md\` → \`Journals\`.

---

### ${DAY} — Harness created [docs]
- **What and why:** created; holat (state) yozildi.
- **Checks:** checks ran.
- **Files:** all. (commit: abc1234)
`,
};

function oldHarness() {
  const dir = repo();
  for (const [rel, body] of Object.entries(OLD)) put(dir, rel, body);
  put(dir, 'AGENTS.md', '# Demo\n\n## Project\n\n- Demo.\n\n## Boundaries\n\n- **Never:** push (R1).\n- **Ask first:** deleting files (R1).\n- **Always:** one thing at a time (R1).\n\n## Session start\n\n1. Read this file.\n\n## Workflow\n\n1. **Question** — read only.\n\n## Working style\n\n- Check every claim.\n\n## Rules\n\n- **R1. One thing at a time.** Finish it and stop. ← F1\n');
  put(dir, 'pan-harness/state.md', `# State\n\n**Last updated:** ${DAY}\n`);
  put(dir, 'pan-harness/system-map.md', '# System map\n\n- Chapters in `docs/`.\n');
  put(dir, 'pan-harness/playbooks/pan-harness.md', '# Playbook: pan-harness\n\n- Run ph-doctor monthly.\n');
  put(dir, 'pan-harness/project/check.json', '{}\n');
  put(dir, 'pan-harness/scripts/pan-harness-check.mjs', '// an old copy\n');
  put(dir, 'docs/chapter-1.md', '# Chapter 1\n');
  git(dir, 'add', '-A');
  git(dir, 'commit', '-q', '-m', 'harness 1.0.0');
  return dir;
}

test('migrate: a 1.0.0 harness moves to 1.1.0, entries keep their words, the check is clean', () => {
  const dir = oldHarness();
  const r = run('migrate.mjs', '--root', dir);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /^migrate: 1\.0\.0 -> 1\.1\.0;/m);
  const runbook = read(dir, 'pan-harness/runbook.md');
  assert.match(runbook, /^## 4\. Writing the harness$/m);
  assert.match(runbook, /^Harness matni \(`AGENTS\.md`/m);
  for (const rule of ['Context pointer', 'Completion criterion', 'Positive form', 'Leading word', 'Single source', 'Manba', 'No-op']) {
    assert.ok(runbook.includes(`- **${rule}:**`), rule);
  }
  const handoff = read(dir, 'pan-harness/handoff.md'); // the active-task format stays at the top, also with Status none
  assert.match(handoff, /^Large task tasdiqlangach `\*\*Status:\*\* active` deb yoz va bo'limlarni to'ldir: `## Task`/m);
  assert.match(handoff, /\n\*\*Status:\*\* none\n$/);
  assert.match(runbook, /- \*\*Atamalar:\*\* atamalar inglizcha; bir necha ma'noli so'z o'rniga inglizcha atama, izohsiz/);
  assert.ok(!runbook.includes('- **Shakl:**') && !runbook.includes('Har fakt bitta joyda yuritiladi'));
  assert.ok(runbook.includes('- **Loyiha qoidasi:** chapters are numbered.'), "the project's own line stays");
  const pan = read(dir, 'PAN-HARNESS.md');
  assert.match(pan, /harness matnini yozish qoidalari/);
  assert.match(pan, /^- \[ \] Shu ishda harness'ga yozgan har matnni/m);
  assert.match(pan, /Xabar `runbook\.md` → `Writing the harness` bo'yicha\./);
  assert.match(pan, /^Standard: pan-harness 1\.1\.0$/m);
  assert.match(read(dir, 'pan-harness/decisions.md'), /`Qaror` nima tanlanganini aytadi/);
  assert.ok(read(dir, 'pan-harness/decisions.md').includes(`- **D1** (${DAY}) [docs] The standard. Why: a test. Where: \`PAN-HARNESS.md\`.`));
  const lessons = read(dir, 'pan-harness/lessons.md');
  assert.match(lessons, /`Rule:` nima qilishni aytadi \(positive form\)/);
  assert.ok(lessons.includes(`- **L1 (${DAY}) — A lesson (\`runbook.md\` → \`Writing the harness\`).** [docs]`), 'a link in an entry is renamed');
  const history = read(dir, `pan-harness/history/${MONTH}.md`);
  assert.match(history, /bu sarlavha unga copy qilinadi/);
  assert.ok(history.includes('- **What and why:** created; holat (state) yozildi.'), 'an entry keeps its words');
  assert.equal(read(dir, 'pan-harness/scripts/pan-harness-check.mjs'), fs.readFileSync(path.join(SKILL, 'scripts', 'pan-harness-check.mjs'), 'utf8'));
  const check = spawnSync(process.execPath, [path.join(dir, 'pan-harness/scripts/pan-harness-check.mjs'), '--root', dir], { encoding: 'utf8' });
  assert.equal(check.status, 0, check.stdout);
  assert.doesNotMatch(check.stdout, /^WARN/m, check.stdout);

  const again = run('migrate.mjs', '--root', dir);
  assert.match(again.stdout, /^migrate: 1\.1\.0 -> 1\.1\.0; 0 done, 0 by hand$/m);
});

test('migrate: a dry run writes nothing, an unknown standard stops, CRLF files keep CRLF', () => {
  const dir = oldHarness();
  const before = read(dir, 'pan-harness/runbook.md');
  const dry = run('migrate.mjs', '--root', dir, '--dry-run');
  assert.equal(dry.status, 0);
  assert.match(dry.stdout, /dry run/);
  assert.equal(read(dir, 'pan-harness/runbook.md'), before);

  fs.writeFileSync(path.join(dir, 'pan-harness/plan.md'), OLD['pan-harness/plan.md'].replace(/\n/g, '\r\n'));
  run('migrate.mjs', '--root', dir);
  const plan = read(dir, 'pan-harness/plan.md');
  assert.match(plan, /Har ⏳ band qachon/);
  assert.ok(!/[^\r]\n/.test(plan), 'CRLF kept');

  const unknown = repo();
  put(unknown, 'PAN-HARNESS.md', '# PAN-HARNESS\n');
  const r = run('migrate.mjs', '--root', unknown);
  assert.equal(r.status, 3);
  assert.match(r.stdout, /unknown standard \(no Standard line\)/);
});
