// The ph-init interview and plan: the owner is asked only what nobody else can know (the goal, what
// "done" means, the limits, the git identity when it is missing); every other style, workflow and
// safety choice is a standard choice that the short plan shows in plain words and nobody waits on.
// The plan holds what the owner decides on: no file list, no internal label.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CORE = path.join(ROOT, 'core');
const read = (...p) => fs.readFileSync(path.join(...p), 'utf8');

// the text from a `## <heading>` line (heading starts with `prefix`) to the next `## ` line
function section(text, prefix) {
  const lines = text.split('\n');
  const from = lines.findIndex((l) => l.startsWith(`## ${prefix}`));
  assert.ok(from >= 0, `heading "## ${prefix}"`);
  const rest = lines.slice(from + 1);
  const to = rest.findIndex((l) => l.startsWith('## '));
  return rest.slice(0, to < 0 ? rest.length : to).join('\n');
}
const ids = (text) => [...text.matchAll(/^\| (S\d+) \|/gm)].map((m) => m[1]);

test('style-questions.md asks four things and keeps every other choice as a standard choice', () => {
  const text = read(CORE, 'references', 'style-questions.md');
  assert.deepEqual(ids(section(text, 'Asked')), ['S1', 'S29', 'S30', 'S31'], 'the asked rows');
  const standard = text.split('\n').filter((l) => l.startsWith('## Standard choices'));
  assert.equal(standard.length, 4, standard.join(' | '));
  const rest = standard.flatMap((h) => ids(section(text, h.slice(3))));
  const expected = Array.from({ length: 27 }, (_, i) => `S${i + 2}`); // S2..S28
  assert.deepEqual([...rest].sort(), [...expected].sort(), 'S2..S28 each once, in the standard choices');
  assert.doesNotMatch(text, /^## Round \d/m, 'no rounds of questions any more');
  assert.doesNotMatch(text, /^## Project knowledge/m, 'the project knowledge moved into the asked rows');
  assert.match(text, /javob kutilmaydi/, 'a standard choice is not waited on');
  assert.match(text, /rejada ro'yxatlanadi/, 'an open issue is listed in the plan: plan.md does not exist before the files are created');
  assert.match(text, /Mavjud loyihada \(repo bor\)/, 'an existing project is asked in one round');
  assert.doesNotMatch(text, /Bitta xizmat va git/, 'the size choice does not depend on a service in a document project');
});

test('the asked rows carry the open questions and the topics of the old project-knowledge list', () => {
  const asked = section(read(CORE, 'references', 'style-questions.md'), 'Asked');
  const row = (id) => new RegExp(`^\\| ${id} \\|(.*)$`, 'm').exec(asked)[1];
  assert.match(row('S1'), /yaqin rejalar/);
  assert.match(row('S1'), /ma'lum muammolar/);
  assert.match(row('S1'), /alohida tasdiq savoli yo'q/, 'the goal is restated in the plan, not confirmed in a question of its own');
  assert.match(row('S1'), /README va manifestdan topilgan maqsad/, 'in an existing project the agent proposes the goal it found');
  assert.match(row('S1'), /egasining ismi so'ralmaydi/, "the owner's name is not a question: it costs a line of the plan and nothing depends on it");
  assert.match(read(CORE, 'references', 'init.md'), /`\{\{egasi\}\}` ga egasi o'zi aytgan ism, aytmagan bo'lsa/, 'the placeholder of the owner is filled without a question');
  assert.match(row('S29'), /Git'da identity yo'q bo'lsa/);
  for (const part of ['natija qanday yaratiladi', 'qanday tekshiriladi', 'atamalar, tuzilma, iqtibos shakli']) assert.match(row('S30'), new RegExp(part), `S30: ${part}`);
  for (const part of ['shaxsiy yoki maxfiy ma', 'qaytarib bo\'lmaydigan amal', 'tashqi xizmat', 'doimiy ishlaydigan xizmat']) assert.match(row('S31'), new RegExp(part), `S31: ${part}`);
  assert.match(row('S31'), /`live-system=yes`/, 'the service part only for a live system');
});

test('init.md interview: two rounds, an own suggestion in every open question, "I do not know" is an answer, at most 5 questions', () => {
  const interview = section(read(CORE, 'references', 'init.md'), '3. Interview');
  for (const part of ['`style-questions.md` → `Asked`', 'standart tanlov', 'ko\'pi bilan 5', 'ikki raundda', 'o\'z taklifingni yoz', 'Bilmayman', 'Awaiting owner decision', 'javob kutilmaydi', 'axborot sifatida',
    'rejada ro\'yxatlanadi', 'kriteriyalarni egasidan so\'rama', 'taklif yozilmaydi', 'javob hisoblanadi (savol javobsiz qolgan emas)', 'README dan topib',
    '1–2 gap sababi bilan', 'yozishdan oldin `templates/AGENTS.md.tmpl` → `Planning` ni o\'qi', 'Mavjud loyihada (repo bor)', 'reja tasdig\'i bu songa kirmaydi',
    'o\'sha qism ochiq masala bo\'ladi']) {
    assert.ok(interview.includes(part), `interview: ${part}`);
  }
  assert.doesNotMatch(interview, /tavsiya bo'yicha qabul qilinsinmi/, 'ph-init has no accept-the-recommendation list');
});

test('init.md plan: short, for the owner, no file list, the migration table only when old content moves', () => {
  const init = read(CORE, 'references', 'init.md');
  const plan = section(init, '4. Plan');
  for (const part of ['15 qatordan oshmasin', 'egasi qaror qiladigan narsadan iborat', 'standart tanlovlar', 'Fayllar ro\'yxati rejada emas', 'faqat eski mazmun ko\'chirilganda', 'ikki `grep`',
    'vaqt zonasi', 'Murojaat shaklini va texnik darajani yozma', '`mktemp`', '`wc -lm`', 'qator hisobiga kirmaydi', 'ochiq masalalar',
    "to'rt qatorda, har qatorda shu so'zlar bo'lsin", "ish turlari, bittadan va hisobot", "Harness ichida qoida yoki ro'yxat borligi kriteriya emas",
    "Harness atamasini", "grep -niE 'start set|profile|playbook|handoff|migration'", 'belgi hisobiga ham', "masalan, ko'chiriladigan eski fayllar"]) {
    assert.ok(plan.includes(part), `plan: ${part}`);
  }
  assert.match(section(init, '2. Facts'), /`date '\+%Z %z'`/, 'the time zone is a fact the agent finds with a command, quoted so that the shell passes one argument');
  assert.doesNotMatch(plan, /yaratiladigan fayllar/, 'the plan does not list the files to create');
  const prep = section(init, '1. Preparation');
  assert.match(prep, /`Pre-init state`[^\n]*reja tasdig'idan keyin|reja tasdig'idan keyin[^\n]*`Pre-init state`/i,'the commit of the owner\'s own changes waits for the approval');
  assert.doesNotMatch(prep, /S11 birinchi raundda/, 'the commit order is not asked in a round');
  assert.match(prep, /o'zing kiritgan `\.gitignore` o'zgarishi egasining commit qilinmagan o'zgarishi emas/i, "the agent's own .gitignore change is not the owner's work");
});

test('the core rules ask only what the owner alone can know, and ph-init says the same in its steps', () => {
  const rules = read(CORE, 'skill-parts', 'core-rules.md');
  const nine = /^9\. \*\*Faqat egasi bila oladigan narsani so'ra\.\*\* (.*)$/m.exec(rules);
  assert.ok(nine, 'core rule 9');
  for (const part of ['`references/style-questions.md` → `Asked`', 'standart tanlov', 'javob kutilmaydi', 'rejada']) assert.ok(nine[1].includes(part), `core rule 9: ${part}`);
  assert.doesNotMatch(rules, /Egasining uslubini so'ra/);
  assert.match(rules, /^1\. \*\*Faktni o'zing top, qarorni egasi qiladi\.\*\* .*savolsiz/m, 'core rule 1: a clear, safe standard choice is taken without a question');
  const skill = read(ROOT, 'skills-src', 'ph-init', 'SKILL.md');
  const steps = Object.fromEntries([...skill.matchAll(/^(\d)\. \*\*([^*]+)\*\* (.*)$/gm)].map((m) => [m[1], m[3]]));
  assert.match(steps['3'], /`Asked`/);
  assert.match(steps['3'], /standart tanlov/);
  assert.match(steps['3'], /templates\/AGENTS\.md\.tmpl` → `Planning`/, 'the shape of the first question is read before it is written');
  assert.match(steps['4'], /15 qatordan oshmaydi/);
  assert.doesNotMatch(steps['3'], /\(S11\)/, 'the commit order is not asked in the first round');
});

test('the AGENTS.md template fills the rules from standard choices and drops a missing answer', () => {
  const head = read(CORE, 'templates', 'AGENTS.md.tmpl').split('-->')[0];
  for (const part of ['standart tanlov', 'Har qoidaning manbasi: egasining gapi yozilgan F yoki standart tanlovlar qarori (D)', 'texnik darajasini aytmagan bo\'lsa', 'murojaat shaklini aytmagan bo\'lsa']) {
    assert.ok(head.includes(part), `template header: ${part}`);
  }
});

test('README and the Uzbek guide describe the new interview', () => {
  const en = read(ROOT, 'README.md');
  const uz = read(ROOT, 'docs', 'uz.md');
  assert.match(en, /asks only what you alone can answer/);
  assert.doesNotMatch(en, /each with options and a recommendation/);
  assert.match(uz, /faqat siz bila oladigan narsani so'raydi/);
  assert.doesNotMatch(uz, /har biri variant va tavsiya bilan\), reja tuzadi/);
});

test('the principle: a clear, safe standard choice is taken without a question, the owner changes it', () => {
  const principles = read(CORE, 'references', 'principles.md');
  const p20 = /^- \*\*P20\. .*$/m.exec(principles);
  assert.ok(p20, 'P20');
  for (const part of ['savolsiz olinadi', 'rejada ko\'rsatiladi', 'egasi o\'zgartiradi', '[31]']) assert.ok(p20[0].includes(part), `P20: ${part}`);
  assert.match(principles, /^31\. GitHub Spec Kit.*clarify/m, 'source 31');
});

test('the scenarios expect the short interview, the plan without labels and no waiting on standard choices', () => {
  const sc = read(ROOT, 'evals', 'scenarios.md');
  assert.doesNotMatch(sc, /S11 birinchi raundda/);
  assert.doesNotMatch(sc, /tasdiqlatilgan/);
  const e10 = section(sc, 'E10.');
  for (const part of ['ko\'pi bilan 5 ta savol', '15 qatordan oshmaydi', 'javob kutilmagan']) assert.ok(e10.includes(part), `E10: ${part}`);
  const e2 = section(sc, 'E2.');
  assert.match(e2, /rejada ko'chirish jadvali bor/);
  assert.match(e2, /jadvaldan tashqari 15 qatordan oshmaydi/, 'the migration table is not counted in the 15 lines');
});
