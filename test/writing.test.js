// P26 in the package's own agent texts (skills, references, skill parts, templates): one term per
// concept with no glossed term in brackets, and skill descriptions that stay short (they sit in
// every session's context). ph-grilling and ph-writing-for-agents are upstream text and keep their own wording. The text
// boundary (1.2.0): the writing rules for every text an agent reads, the harness language for the
// harness, the owner's instruction for texts for people, the chat rule for the chat.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CORE = path.join(ROOT, 'core');

function files(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? files(p) : [p];
  });
}

const agentTexts = [
  ...files(path.join(CORE, 'references')),
  ...files(path.join(CORE, 'skill-parts')),
  ...files(path.join(CORE, 'templates')),
  ...['ph-init', 'ph-doctor', 'ph-update'].map((s) => path.join(ROOT, 'skills-src', s, 'SKILL.md')),
].filter((p) => /\.(md|tmpl)$/.test(p));

// the same list and pattern as the terms check of pan-harness-check.mjs, read from its source
const src = fs.readFileSync(path.join(CORE, 'scripts', 'pan-harness-check.mjs'), 'utf8');
const terms = [.../const GLOSS_TERMS = \[([\s\S]*?)\];/.exec(src)[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
const TERM = `(?:${terms.join('|')})`;
const GLOSS = new RegExp(`[\\p{L}\\p{N}_'’ʻ]*[\\p{L}\\p{N}_]\\s+\\(${TERM}(?:(?:,|\\s+(?:yoki|va|or|and))\\s+${TERM})*\\)`, 'giu');

test('no glossed term in brackets in the agent texts', () => {
  const hits = [];
  for (const p of agentTexts) {
    fs.readFileSync(p, 'utf8').split('\n').forEach((line, i) => {
      for (const m of line.matchAll(GLOSS)) hits.push(`${path.relative(ROOT, p)}:${i + 1}: ${m[0]}`);
    });
  }
  assert.deepEqual(hits, []);
});

test('skill descriptions stay within 1000 bytes together', () => {
  const sizes = fs.readdirSync(path.join(ROOT, 'skills-src')).map((s) => {
    const body = fs.readFileSync(path.join(ROOT, 'skills-src', s, 'SKILL.md'), 'utf8');
    return [s, Buffer.byteLength(/^description: (.*)$/m.exec(body)[1], 'utf8')];
  });
  const total = sizes.reduce((n, [, b]) => n + b, 0);
  assert.ok(total <= 1000, `${total} bytes: ${sizes.map(([s, b]) => `${s} ${b}`).join(', ')}`);
});

test('the text boundary is in the AGENTS.md template, the runbook, structure.md, the style questions and the audit', () => {
  const read = (rel) => fs.readFileSync(path.join(CORE, rel), 'utf8');
  const agents = read('templates/AGENTS.md.tmpl');
  const r23 = /^- \*\*R23\. Matnni o'quvchisiga qarab yoz\.\*\* (.*) ← D\{\{…\}\}\n  - (Agent o'qiydigan .*)\n  - (Inson o'qiydigan .*)\n/m.exec(agents);
  assert.ok(r23, 'R23 in the AGENTS.md template: a head line and two sub-items, one idea each');
  assert.match(r23[1], /Har da'voni tekshirish \(`Working style`\) va `Boundaries` har matnga tegishli\./);
  for (const part of ['`runbook.md` → `Writing the harness`', 'Harness tili va atamalari faqat harness fayllarida',
    "egasi so'ragan tilda yoz, so'ramasa mavjud faylda shu faylning tilida, yangi faylda suhbat tilida"]) {
    assert.ok(r23[2].includes(part), `R23 agent text: ${part}`);
  }
  for (const part of ['hisobot fayli', 'tilini va uslubini alohida-alohida', "(1) egasining ko'rsatmasi, suhbatda yoki harness'da yozilgan",
    "(2) hujjatning o'z tili va uslubi", "(3) yangi hujjatda loyihadagi shu maqsaddagi hujjatlarniki", '(4) bular bo\'lmasa, suhbat tili va hujjat turiga mos uslub',
    'yakuniy xabarda egasiga ayt', "Manba, fayl yo'li va ID qatorini inson matniga faqat egasi so'rasa qo'sh"]) {
    assert.ok(r23[3].includes(part), `R23 human text: ${part}`);
  }
  assert.match(agents, /^- \*\*R12\. Egasi bilan suhbatda \{\{til\}\} va qisqa yoz,\*\* .* Faylga yoziladigan matnning tili va uslubi R23 da\. ← F\{\{…\}\}$/m);
  assert.match(read('templates/PAN-HARNESS.md.tmpl'), /^- \[ \] Shu ishda yozgan har matnni o'quvchisiga qarab tekshir \(R23\): /m);

  const intro = /^Harness matnini \(`AGENTS\.md`, `PAN-HARNESS\.md`, `CLAUDE\.md`, `pan-harness\/`\) shu bo'limning hamma qoidalari bilan yoz; (.*)$/m.exec(read('templates/pan-harness/runbook.md.tmpl'));
  assert.ok(intro, 'the runbook intro says what to do');
  for (const part of ['`CLAUDE.local.md`', '`GEMINI.md`', '`.github/copilot-instructions.md`', '`.cursor/rules/`', '`CONTEXT.md`',
    "ichki papkalardagi `AGENTS.md`", 'skill, buyruq va subagent fayllari', "mahsulotdagi prompt'lar", "boshqa tizim agentlarining fayllari", 'R23 da']) {
    assert.ok(intro[1].includes(part), `runbook intro: ${part}`);
  }
  const writing = /^## Writing\n\n(.*)$/m.exec(read('references/structure.md'));
  for (const part of ['quyidagi hamma qoidalar bilan yoz', "birinchi to'qqizta qoida bilan yoz, `Buyruq shakli` dan `No-op` gacha",
    "so'ramasa mavjud faylda shu faylning tili, yangi faylda suhbat tili", 'hisobot fayli', "Manba, fayl yo'li va ID qatori inson matniga faqat egasi so'rasa",
    'suhbat qoidalari (til, uslub, murojaat; shablonda R12) faqat egasi bilan suhbatga']) {
    assert.ok(writing[1].includes(part), `structure.md Writing: ${part}`);
  }

  const style = read('references/style-questions.md');
  const row = (id) => new RegExp(`^\\| ${id} \\|(.*)$`, 'm').exec(style)[1];
  assert.match(row('S2'), /suhbatda .* harness .* loyiha hujjatlarining tili bu yerda so'ralmaydi: agent ularni .* matn chegarasi qoidasi bo'yicha yozadi/);
  assert.match(row('S26'), /^ Harness'dagi sana va vaqt/);
  const s3 = row('S3').split(' | ');
  assert.match(s3[0], /egasiga qanday murojaat qiladi/);
  assert.match(s3[2], /murojaat tavsiyasiz/);
  assert.doesNotMatch(row('S3'), /\b(siz|sen)\b/i, 'S3 suggests no form of address');
  for (const p of agentTexts) { // no form of address is put in the owner's mouth
    assert.doesNotMatch(fs.readFileSync(p, 'utf8'), /"(siz|sen)"/, path.relative(ROOT, p));
  }
  const audit = read('references/audit.md');
  assert.match(audit, /^- Writing: A39–A43, A59–A65$/m);
  assert.match(audit, /^\| A64 \| .*`\*\*Writing\*\*` guruhida.* \| Rule leak \| script .* \| mechanical .* \|$/m);
  assert.match(audit, /^\| A65 \| .* \| Rule leak \| manual: .* \| structural: .* \|$/m);
});

test('the rules for agent text outside the harness are the same nine in the runbook intro, its bullets and structure.md', () => {
  const read = (rel) => fs.readFileSync(path.join(CORE, rel), 'utf8');
  const runbook = read('templates/pan-harness/runbook.md.tmpl');
  const named = /`Buyruq shakli`.*`No-op`/.exec(runbook)[0].match(/`([^`]+)`/g).map((n) => n.slice(1, -1));
  assert.equal(named.length, 9, named.join(', '));
  const section = runbook.slice(runbook.indexOf('## 4. Writing the harness'));
  const bullets = [...section.matchAll(/^- \*\*([^*:]+):\*\*/gm)].map((m) => m[1]);
  const at = bullets.indexOf(named[0]);
  assert.deepEqual(bullets.slice(at, at + 9), named, 'the runbook bullets, in the same order');
  const writing = read('references/structure.md').split('\n## Writing\n')[1];
  const structure = [...writing.matchAll(/^- \*\*([^*]+?)[.,:]/gm)].map((m) => m[1]).slice(0, 9);
  assert.deepEqual(structure, named, "structure.md's first nine rules");
});

test('an upstream skill names one commit, the same in its source and in THIRD_PARTY_NOTICES.md', () => {
  const notices = fs.readFileSync(path.join(ROOT, 'THIRD_PARTY_NOTICES.md'), 'utf8');
  for (const name of ['ph-grilling', 'ph-writing-for-agents']) {
    const skill = fs.readFileSync(path.join(ROOT, 'skills-src', name, 'SKILL.md'), 'utf8');
    const m = /^ {2}source: "https:\/\/github\.com\/mattpocock\/skills\/blob\/([0-9a-f]{40})\/(skills\/[\w/-]+)\/SKILL\.md"$/m.exec(skill);
    assert.ok(m, `${name}: source pinned to a commit`);
    assert.ok(notices.includes(`(commit ${m[1]}, \`${m[2]}`), `${name}: THIRD_PARTY_NOTICES.md names commit ${m[1]} and ${m[2]}`);
    assert.ok(fs.existsSync(path.join(ROOT, 'skills-src', name, 'LICENSE')), `${name}: LICENSE`);
  }
});

// The owner does not read the harness files (1.3.0): what an agent writes to the owner carries no
// internal label (A1, P1, S2, K4: a letter and a number; rule, decision, feedback and lesson numbers too), only the meaning.
const LABEL = /\b[ADFKLPRS][0-9]{1,3}\b/;

test('the texts meant for the owner hold no internal label', () => {
  const hits = [];
  const style = fs.readFileSync(path.join(CORE, 'references', 'style-questions.md'), 'utf8');
  style.split('\n').forEach((line, i) => {
    if (!/^\| S\d+ \|/.test(line)) return;
    for (const cell of line.split(' | ').slice(1, 4)) { // question, options, recommendation; the row number and the Profile condition are for the agent only
      const m = LABEL.exec(cell);
      if (m) hits.push(`style-questions.md:${i + 1}: ${m[0]}`);
    }
  });
  fs.readFileSync(path.join(CORE, 'skill-parts', 'report.md'), 'utf8').split('\n').forEach((line, i) => {
    const m = LABEL.exec(line);
    if (m) hits.push(`report.md:${i + 1}: ${m[0]}`);
  });
  assert.deepEqual(hits, []);
});

test('the rule against internal labels is in the AGENTS.md template, the core rules, the report and the audit', () => {
  const read = (rel) => fs.readFileSync(path.join(CORE, rel), 'utf8');
  const sub = /^- \*\*R12\. Egasi bilan suhbatda .*\n  - (Egasi harness fayllarini o'qimaydi: .*)\n/m.exec(read('templates/AGENTS.md.tmpl'));
  assert.ok(sub, 'R12 of the AGENTS.md template has a sub-item for the messages to the owner');
  for (const part of ['xabarda (savol, hisobot, taklif, status) gapni ma\'nosi bilan ayt', 'Ichki belgi (A1, P1, S2, K4 kabi raqamli nom; qoida, qaror, fikr va saboq raqamlari ham shunday)',
    'hujjat ichidagi qadam raqami o\'rniga mazmunini yoz', 'havola bilan yoz', 'Egasi belgini o\'zi so\'rasa yoki tilga olsa, ma\'nosini ayt']) {
    assert.ok(sub[1].includes(part), `R12 sub-item: ${part}`);
  }
  const rule = /^14\. \*\*Egasiga tushunarli yoz\.\*\* (.*)$/m.exec(read('skill-parts/core-rules.md'));
  assert.ok(rule, 'core rule 14');
  for (const part of ["Egasi harness fayllarini o'qimaydi", 'Ichki belgi (A1, P1, S2, K4 kabi raqamli nom; qoida, qaror, fikr va saboq raqamlari ham shunday)', "oddiy so'z bilan yoz",
    'Belgilar harness fayllarida', "`#` ustunidagi raqam agent uchun"]) {
    assert.ok(rule[1].includes(part), `core rule 14: ${part}`);
  }
  const report = read('skill-parts/report.md');
  for (const part of ["ma'nosi bilan nomlanadi", "to'liq jadval (raqamlari bilan) tarix yozuvida qoladi", 'Yuborishdan oldin hisobot qoralamasini', "grep -nE '[A-Za-z0-9_./-]+\\.(md|mjs|json)' <fayl>", "grep -nE '(^|[^[:alnum:]_])[ADFKLPRS][0-9]{1,3}([^[:alnum:]_]|$)' <fayl>"]) assert.ok(report.includes(part), `report: ${part}`);
  assert.match(read('references/audit.md'), /^\| A64 \| .*A1, P1, S2, K4.* \| Rule leak \|/m);
});

test('a test run before the change is not required: the last recorded result is the comparison', () => {
  const read = (p) => fs.readFileSync(p, 'utf8');
  for (const rel of ['references/testing.md', 'references/doctor.md', 'templates/pan-harness/playbooks/pan-harness.md.tmpl']) {
    const text = read(path.join(CORE, rel));
    assert.match(text, /oldin run shart emas/, rel);
    assert.match(text, /oxirgi yozilgan natija/, rel);
  }
  assert.match(read(path.join(ROOT, 'evals', 'scenarios.md')), /faqat o'zgartirishdan keyin/);
});

test('the package is called ph-paket in the agent texts, and the glossary says what it is', () => {
  const ok = /npm paketi|paket menejeri|Paketlarga xos|paket nomi/; // the npm package of the glossary row, a package manager, packages of a monorepo
  const hits = [];
  for (const p of agentTexts) {
    fs.readFileSync(p, 'utf8').split('\n').forEach((line, i) => {
      for (const m of line.matchAll(/(?<![\w-])[Pp]aket\w*/g)) {
        if (!ok.test(line.slice(Math.max(0, m.index - 12), m.index + m[0].length + 12))) hits.push(`${path.relative(ROOT, p)}:${i + 1}: ${m[0]}`);
      }
    });
  }
  assert.deepEqual(hits, []);
  assert.match(fs.readFileSync(path.join(CORE, 'references', 'structure.md'), 'utf8'), /^\| ph-paket \| `@jiemurat\/pan-harness` npm paketi: /m);
});
