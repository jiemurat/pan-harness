// scaffold.mjs (ph-init) and migrate.mjs (ph-update) on throwaway projects: the templates land
// in place and the check lists what is left to fill; a 1.0.0 harness moves to the current standard
// with its journal entries untouched, a 1.1.0 one gets the text boundary rule and nothing else
// changes, and a second run changes nothing.
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

test('migrate: a 1.0.0 harness moves to the current standard, entries keep their words, the check is clean', () => {
  const dir = oldHarness();
  const r = run('migrate.mjs', '--root', dir);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.ok(r.stdout.includes(`migrate: 1.0.0 -> ${VERSION};`), r.stdout);
  assert.match(r.stdout, /^by hand 1\.2\.0 step 2: AGENTS\.md: no chat rule in the template form/m, 'the demo has no chat rule');
  const runbook = read(dir, 'pan-harness/runbook.md');
  assert.match(runbook, /^## 4\. Writing the harness$/m);
  assert.match(runbook, /^Harness matnini \(`AGENTS\.md`.* R2 da\. /m);
  assert.match(read(dir, 'AGENTS.md'), /\n\n\*\*Writing\*\*\n- \*\*R2\. Matnni o'quvchisiga qarab yoz\.\*\* .* ← D1\n  - Agent o'qiydigan .*\n  - Inson o'qiydigan .*\n$/);
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
  assert.match(pan, /agent o'qiydigan matnni yozish qoidalari/);
  assert.match(pan, /^- \[ \] Shu ishda yozgan har matnni o'quvchisiga qarab tekshir \(R2\)/m);
  assert.match(pan, /Xabar `runbook\.md` → `Writing the harness` bo'yicha\./);
  assert.ok(pan.includes(`\nStandard: pan-harness ${VERSION}\n`));
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
  assert.ok(again.stdout.includes(`migrate: ${VERSION} -> ${VERSION}; 0 done, 0 by hand`), again.stdout);
});

// the 1.1.0 lines that 1.2.0 changes, as the 1.1.0 templates wrote them; the rest of a 1.1.0 harness is the 1.2.0 one
const INTRO_110 = "Harness matni (`AGENTS.md`, `PAN-HARNESS.md`, `pan-harness/`) agent uchun yoziladi: kuchli va kichik model uni bir xil tushunib, har safar bir xil jarayon bilan bajarishi kerak. Qoidalar yangi va o'zgartirilgan matnga qo'llanadi, eski matn tegilganda moslanadi. Inson uchun matn (README, loyiha hujjatlari, hisobot, commit xabari, `feedback.md` dagi `Quote:`) o'z o'quvchisi uchun yoziladi.";
const MAP_110 = "- `runbook.md` — buyruqlar, skriptlar, harness matnini yozish qoidalari, topic tag'lar, accepted warnings (buyruq kerak bo'lganda va harness'ga matn yozishdan oldin).";
const END_110 = "- [ ] Shu ishda harness'ga yozgan har matnni `runbook.md` → `Writing the harness` qoidalari bilan solishtir va mos kelmaganini tuzat.";
const CHAT_110 = "- **R2. O'zbekcha va qisqa yoz,** egasiga \"siz\" deb murojaat qil. Texnik tafsilot faqat kerak bo'lganda. Python bo'yicha mutaxassis tilida gapir. ← F1";
const REPORT_RULE = "- **R3. Hisobotni aniq va qisqa yoz,** raqam bilan. ← F1"; // also "qisqa yoz", not the chat rule

/** a 1.1.0 harness: the migrated 1.0.0 one with its 1.2.0 lines put back; `rules` replaces the Rules section */
function harness110(rules) {
  const dir = oldHarness();
  run('migrate.mjs', '--root', dir);
  const edit = (rel, f) => fs.writeFileSync(path.join(dir, rel), f(read(dir, rel)));
  edit('PAN-HARNESS.md', (s) => s.replace(`Standard: pan-harness ${VERSION}`, 'Standard: pan-harness 1.1.0')
    .replace(/^- `runbook\.md` — .*$/m, MAP_110).replace(/^- \[ \] Shu ishda yozgan har matnni .*$/m, END_110));
  edit('pan-harness/runbook.md', (s) => s.replace(/^Harness matnini \(`AGENTS\.md`.*$/m, INTRO_110));
  edit('AGENTS.md', (s) => s.slice(0, s.indexOf('## Rules')) + rules);
  // R numbers run across AGENTS.md and playbooks; the 1.1.0 playbook named the skill's file as a project path
  put(dir, 'pan-harness/playbooks/pan-harness.md', '# Playbook: pan-harness\n\n- **R4. Run ph-doctor monthly.** ← D1\n\nDoimiy savollar (`references/testing.md` → "Fixed question set") har oy beriladi.\n');
  git(dir, 'add', '-A');
  git(dir, 'commit', '-q', '-m', 'harness 1.1.0');
  return dir;
}
const RULES_110 = `## Rules\n\n- **R1. One thing at a time.** Finish it and stop. ← F1\n\n**Communication**\n${CHAT_110}\n${REPORT_RULE}\n`;

test('migrate: a 1.1.0 harness gets the text boundary rule, its chat rule points to it, nothing else changes', () => {
  const dir = harness110(RULES_110);
  const r = run('migrate.mjs', '--root', dir);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.ok(r.stdout.includes(`migrate: 1.1.0 -> ${VERSION}; 6 done, 0 by hand`), r.stdout);
  const agents = read(dir, 'AGENTS.md');
  assert.ok(agents.includes(`${CHAT_110.replace("**R2. O'zbekcha", "**R2. Egasi bilan suhbatda o'zbekcha").replace(' ← F1', ' Faylga yoziladigan matnning tili va uslubi R5 da. ← F1')}\n${REPORT_RULE}\n`), agents);
  assert.match(agents, /\n\n\*\*Writing\*\*\n- \*\*R5\. Matnni o'quvchisiga qarab yoz\.\*\* .* ← D1\n  - Agent o'qiydigan .*\n  - Inson o'qiydigan .*\n$/);
  assert.match(read(dir, 'pan-harness/runbook.md'), /^Harness matnini \(`AGENTS\.md`.* R5 da\. /m);
  const pan = read(dir, 'PAN-HARNESS.md');
  assert.match(pan, /^- `runbook\.md` — .*agent o'qiydigan matn yozishdan oldin\)\.$/m);
  assert.match(pan, /^- \[ \] Shu ishda yozgan har matnni o'quvchisiga qarab tekshir \(R5\)/m);
  assert.match(read(dir, 'pan-harness/playbooks/pan-harness.md'), /\(`ph-doctor` skill'idagi testing\.md, "Fixed question set" bo'limi\)/);
  const changed = git(dir, 'diff', '--numstat').trim().split('\n').sort();
  assert.deepEqual(changed, ['1\t1\tpan-harness/playbooks/pan-harness.md', '1\t1\tpan-harness/runbook.md', '3\t3\tPAN-HARNESS.md', '6\t1\tAGENTS.md'].sort(), 'only the changed lines');
  const check = spawnSync(process.execPath, [path.join(dir, 'pan-harness/scripts/pan-harness-check.mjs'), '--root', dir], { encoding: 'utf8' });
  assert.equal(check.status, 0, check.stdout);
  assert.doesNotMatch(check.stdout, /^WARN/m, check.stdout);
  assert.ok(run('migrate.mjs', '--root', dir).stdout.includes(`migrate: ${VERSION} -> ${VERSION}; 0 done, 0 by hand`));
});

test('migrate 1.2.0: file text in the chat rule and a harness without rules are left by hand, no pointer to a missing rule', () => {
  const readme = harness110(RULES_110.replace(CHAT_110, CHAT_110.replace(' ← F1', ' Kod izohlari va README inglizcha. ← F1')));
  const r = run('migrate.mjs', '--root', readme);
  assert.match(r.stdout, /^by hand 1\.2\.0 step 2: AGENTS\.md: R2 also sets file text \("Kod izohlari va README inglizcha\."\)/m, r.stdout);
  assert.ok(read(readme, 'AGENTS.md').includes(`\n${REPORT_RULE}\n`), 'the other "qisqa yoz" rule stays');

  const bare = harness110('## Rules\n\nYo\'q.\n');
  const before = { agents: read(bare, 'AGENTS.md'), runbook: read(bare, 'pan-harness/runbook.md') };
  const b = run('migrate.mjs', '--root', bare);
  for (const step of [1, 2, 3, 4]) assert.match(b.stdout, new RegExp(`^by hand 1\\.2\\.0 step ${step}: `, 'm'), b.stdout);
  assert.equal(read(bare, 'AGENTS.md'), before.agents);
  assert.equal(read(bare, 'pan-harness/runbook.md'), before.runbook);
  assert.ok(read(bare, 'PAN-HARNESS.md').includes(END_110), 'no pointer to a rule that is not there');
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
