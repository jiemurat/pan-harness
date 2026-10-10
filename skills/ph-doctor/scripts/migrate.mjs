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
const KNOWN = ['1.0.0', '1.1.0', '1.2.0', '1.3.0', '1.3.1'];
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
function template(rel) {
  return fs.readFileSync(path.join(TEMPLATES, ...rel.split('/')), 'utf8').replace(/^<!--[\s\S]*?-->\n/, '').split('\n');
}
function harnessDocs(dir = 'pan-harness', out = ['AGENTS.md', 'PAN-HARNESS.md']) {
  const abs = path.join(root, ...dir.split('/'));
  if (!fs.existsSync(abs)) return out;
  for (const e of fs.readdirSync(abs, { withFileTypes: true })) {
    const rel = `${dir}/${e.name}`;
    if (e.isDirectory() && !['archive', 'scripts'].includes(e.name)) harnessDocs(rel, out);
    else if (e.isFile() && e.name.endsWith('.md')) out.push(rel);
  }
  return out;
}
const tline = (lines, start) => lines.find((l) => l.startsWith(start));

// ---------------------------------------------------------------- 1.1.0 (P26 writing rules)

// 1.0.0 standard lines: replaced by their 1.1.0 form only when the project kept them word for word
const OLD = {
  runbookIntro: "Ko'p ishlatiladigan buyruqlar va hujjat yozish qoidalari. Loyihaning README yoki Makefile'ida bor buyruqni bu yerga ko'chirma (copy), unga havola ber.",
  fields: '- Maydon nomlari, sarlavhalar va jadval ustunlari inglizcha (pan-harness standarti).',
  backticks: "- Buyruq, yo'l, ID va sozlama kalitlari backtick ichida yoziladi.",
  shape: "- **Shakl:** qisqa gaplar va ro'yxatlar, bitta bandda bitta fikr. Ko'rsatma buyruq shaklida, bajaruvchi aniq bo'ladi.",
  oneFact: "- **Har fakt bitta joyda yuritiladi** (`PAN-HARNESS.md` → `Map`): joriy holat (state) `state.md` da, kelajakdagi ishlar va sanalar `plan.md` da, tuzilma `system-map.md` da.",
  private: "- **Pan-harness xususiy ishga bog'lanmaydi.** Yozuv nima haqida ekanini oddiy so'z bilan aytadi, vositalarning ichki raqamlari yozilmaydi.",
  secret: "- **Maxfiy mazmun yozilmaydi:** shaxsiy ma'lumot va maxfiy hujjat mazmuni o'rniga yo'l, ID va neytral tavsif yoziladi.",
  mapRunbook: "- `runbook.md` — buyruqlar, skriptlar, hujjat yozish uslubi, topic tag'lar, accepted warnings (buyruq kerak bo'lganda va hujjat yozishdan oldin).",
};
// the 1.1.0 intro of "Writing the harness": step 2 below writes it, 1.2.0 step 3 replaces it
const INTRO_110 = "Harness matni (`AGENTS.md`, `PAN-HARNESS.md`, `pan-harness/`) agent uchun yoziladi: kuchli va kichik model uni bir xil tushunib, har safar bir xil jarayon bilan bajarishi kerak. Qoidalar yangi va o'zgartirilgan matnga qo'llanadi, eski matn tegilganda moslanadi. Inson uchun matn (README, loyiha hujjatlari, hisobot, commit xabari, `feedback.md` dagi `Quote:`) o'z o'quvchisi uchun yoziladi.";
const INTRO_120 = 'Harness matnini (`AGENTS.md`';
// the 1.1.0 map line of runbook.md and the End of task writing item: 1.1.0 step 4 writes them, 1.2.0 step 4 replaces them
const MAP_110 = "- `runbook.md` — buyruqlar, skriptlar, harness matnini yozish qoidalari, topic tag'lar, accepted warnings (buyruq kerak bo'lganda va harness'ga matn yozishdan oldin).";
const END_110 = "- [ ] Shu ishda harness'ga yozgan har matnni `runbook.md` → `Writing the harness` qoidalari bilan solishtir va mos kelmaganini tuzat.";
// 1.0.0 header lines of the journals and working files: standard text, replaced by the 1.1.0 header
const OLD_HEADERS = {
  'pan-harness/decisions.md': [
    "Bu faylda tizim va harness haqidagi amaldagi qarorlar turadi: nima tanlangani, nega, qaysi variantlar rad etilgani va qarorning qayerda amalga oshgani. Egasining ishlash uslubi haqidagi ko'rsatmalari bu yerda emas, `feedback.md` da turadi.",
    "- **Shakl.** Har qaror bitta paragraf: `- **D<n>** (YYYY-MM-DD) [tag] Qaror. Why: … Rejected: … Where: …`. `Where:` qaror qaysi fayl yoki sozlamada amalga oshganini ko'rsatadi. Qarorga tayanishdan oldin o'sha joyni tekshir.",
    "- **Amaldagi qaror tahrirlanmaydi.** Qaror o'zgarsa, yangi D yoziladi, eskisi `archive/decisions.md` ga `Archived (YYYY-MM-DD): superseded by D<n>.` belgisi bilan ko'chiriladi (move). Bajarilgan bir martalik qaror `Archived (YYYY-MM-DD): done (one-off).` belgisi bilan arxivlanadi.",
  ],
  'pan-harness/lessons.md': [
    "Bu faylda ishlardagi xatolar va ulardan chiqqan saboqlar (L…) turadi. `AGENTS.md` dagi qoidalar ularga `← L…` bilan havola beradi. Har saboq sarlavhasidan keyin topic tag turadi (`runbook.md` → `Writing docs`).",
  ],
  'pan-harness/plan.md': [
    "Barcha ochiq ishlar, turidan qat'i nazar. Bajarilgan ishni o'chir (yozuvi `history/` da qoladi). Sanali ishlarni faqat shu faylga yoz.",
  ],
  'pan-harness/handoff.md': [
    "Faol large task'ning holati (state). Agent uni har holat xabarida, egasidan savol so'rab to'xtashdan oldin va kontekst tugashiga yaqin yangilaydi; kontekst tugayotganda ham tekshiruvlar (checks) qisqartirilmaydi. Yangi sessiya ishni shu fayldan davom ettiradi.",
  ],
  history: [
    "Har ish uchun bitta yozuv, yangisi oxiriga qo'shiladi. Har oy o'z faylida: oy boshida yangi fayl ochiladi va bu sarlavha unga ko'chiriladi (copy). Qoidalar: `PAN-HARNESS.md` → `Journals`.",
    "- **Checks:** large task'da avval kriteriyalar (K1 ✅ …, K2 ⏳ …), keyin tekshiruvlar",
  ],
};
// where the header of each file ends: its first entry or section
const ENTRY = {
  'pan-harness/decisions.md': /^(---\s*$|- \*\*D\d)/,
  'pan-harness/feedback.md': /^(---\s*$|### F\d)/,
  'pan-harness/lessons.md': /^(---\s*$|- \*\*L\d|#{2,3} )/,
  'pan-harness/plan.md': /^## /,
  'pan-harness/handoff.md': /^\*\*Status:\*\*/,
  history: /^(---\s*$|#{2,3} )/,
};
const TEMPLATE_OF = {
  'pan-harness/decisions.md': 'pan-harness/decisions.md.tmpl',
  'pan-harness/feedback.md': 'pan-harness/feedback.md.tmpl',
  'pan-harness/lessons.md': 'pan-harness/lessons.md.tmpl',
  'pan-harness/plan.md': 'pan-harness/plan.md.tmpl',
  'pan-harness/handoff.md': 'pan-harness/handoff.md.tmpl',
  history: 'pan-harness/history/YYYY-MM.md.tmpl',
};

/** [start, end) of the lines between the title and the first entry, code blocks skipped */
function headerRange(lines, entry) {
  const title = lines.findIndex((l) => /^# /.test(l));
  if (title < 0) return null;
  let fence = false;
  for (let i = title + 1; i < lines.length; i++) {
    if (lines[i].trimStart().startsWith('```')) fence = !fence;
    else if (!fence && entry.test(lines[i])) return [title + 1, i];
  }
  return [title + 1, lines.length];
}

function step1Rename() {
  const runbook = file('pan-harness/runbook.md');
  let n = 0;
  if (runbook) {
    runbook.lines = runbook.lines.map((l) => {
      if (/^## (\d+\.\s*)?Writing docs\s*$/.test(l)) { n += 1; runbook.changed = true; return l.replace('Writing docs', 'Writing the harness'); }
      return l;
    });
  }
  let links = 0;
  for (const rel of harnessDocs()) {
    const f = file(rel);
    if (!f) continue;
    f.lines = f.lines.map((l) => {
      if (!l.includes('runbook.md') || !l.includes('Writing docs')) return l;
      links += 1;
      f.changed = true;
      return l.replace(/`Writing docs`/g, '`Writing the harness`').replace(/"Writing docs"/g, '"Writing the harness"');
    });
  }
  done.push(`1.1.0 step 1: runbook section renamed (${n}), links updated (${links})`);
  if (!n && !(runbook && runbook.lines.some((l) => /^## (\d+\.\s*)?Writing the harness/.test(l)))) {
    byHand.push('1.1.0 step 1: runbook.md has no "Writing docs" section; add "## <n>. Writing the harness" from the template');
  }
}

function step2Rules() {
  const f = file('pan-harness/runbook.md');
  if (!f) { byHand.push('1.1.0 step 2: pan-harness/runbook.md is missing'); return; }
  const tmpl = template('pan-harness/runbook.md.tmpl');
  const tStart = tmpl.findIndex((l) => /^## \d+\. Writing the harness/.test(l));
  const tEnd = tmpl.findIndex((l, i) => i > tStart && /^## /.test(l));
  const tSection = tmpl.slice(tStart, tEnd);
  const ruleStarts = ['- **Buyruq shakli:**', '- **Context pointer:**', '- **Progressive disclosure va co-location:**',
    '- **Completion criterion:**', '- **Positive form:**', '- **Leading word:**', '- **Single source:**', '- **Manba:**', '- **No-op:**'];
  const rules = ruleStarts.map((s) => tline(tSection, s));
  const replace = {
    [OLD.runbookIntro]: tline(tmpl, "Ko'p ishlatiladigan buyruqlar"),
    [OLD.fields]: tline(tSection, '- Maydon nomlari'),
    [OLD.private]: tline(tSection, "- **Oddiy so'z:**"),
    [OLD.secret]: tline(tSection, "- [profile: sensitive-data=pii yoki confidential] **Maxfiy mazmun o'rniga**")?.replace(/^- \[profile: [^\]]+\] /, '- '),
  };
  const drop = new Set([OLD.backticks, OLD.shape, OLD.oneFact]); // their 1.1.0 forms come with the rules
  let replaced = 0;
  let dropped = 0;
  f.lines = f.lines.flatMap((l) => {
    const key = l.trimEnd();
    if (replace[key]) { replaced += 1; return [replace[key]]; }
    if (drop.has(key)) { dropped += 1; return []; }
    return [l];
  });
  const start = f.lines.findIndex((l) => /^## (\d+\.\s*)?Writing the harness/.test(l));
  if (start < 0) { byHand.push('1.1.0 step 2: no "Writing the harness" section in runbook.md'); return; }
  let end = f.lines.findIndex((l, i) => i > start && /^## /.test(l));
  if (end < 0) end = f.lines.length;
  const section = f.lines.slice(start, end);
  if (!section.some((l) => l.startsWith('Harness matni (') || l.startsWith(INTRO_120))) {
    f.lines.splice(start + 1, 0, '', INTRO_110);
    end += 2;
  }
  if (!f.lines.slice(start, end).some((l) => l.startsWith('- **Context pointer:**'))) {
    const at = f.lines.slice(start, end).findIndex((l) => l.startsWith('- **Atamalar:**'));
    const firstBullet = f.lines.slice(start, end).findIndex((l) => l.startsWith('- '));
    const pos = start + (at >= 0 ? at + 1 : firstBullet >= 0 ? firstBullet : 1);
    f.lines.splice(pos, 0, ...rules);
    if (at < 0 && firstBullet < 0) byHand.push('1.1.0 step 2: the Writing section had no list; check where the P26 rules landed');
  }
  f.changed = true;
  done.push(`1.1.0 step 2: intro and P26 rules in "Writing the harness", ${replaced} standard line(s) updated, ${dropped} superseded line(s) removed`);
}

function step3Terms() {
  const f = file('pan-harness/runbook.md');
  if (!f) return;
  const i = f.lines.findIndex((l) => l.startsWith('- **Atamalar:**'));
  if (i < 0) { byHand.push('1.1.0 step 3: no "Atamalar:" line in runbook.md; add it from the template with the S27 answer'); return; }
  if (/inglizcha/.test(f.lines[i]) && /qavs/.test(f.lines[i])) {
    f.lines[i] = "- **Atamalar:** atamalar inglizcha; bir necha ma'noli so'z o'rniga inglizcha atama, izohsiz: structure, copy, move, migration, state, status, check, test, limit, boundary.";
    f.changed = true;
    done.push('1.1.0 step 3: Atamalar line set to the S27 a form (one English term, no bracket gloss)');
  } else {
    done.push('1.1.0 step 3: Atamalar line kept (it names no bracket gloss)');
  }
}

function step4PanHarness() {
  const f = file('PAN-HARNESS.md');
  const newMap = MAP_110;
  const newEnd = END_110;
  let n = 0;
  f.lines = f.lines.map((l) => {
    if (l.trimEnd() === OLD.mapRunbook) { n += 1; return newMap; }
    if (l.startsWith('- `runbook.md` —') && /hujjat yozish/.test(l)) {
      n += 1;
      return l.replace('hujjat yozish uslubi', 'harness matnini yozish qoidalari').replace('hujjat yozishdan oldin', "harness'ga matn yozishdan oldin");
    }
    if (/^- \[ \] Hujjatni `runbook\.md` → `Writing (docs|the harness)` uslubida yoz\.\s*$/.test(l)) { n += 1; return newEnd; }
    return l;
  });
  if (n) f.changed = true;
  done.push(`1.1.0 step 4: PAN-HARNESS.md map and End of task lines updated (${n} of 2)`);
  if (n < 2) byHand.push('1.1.0 step 4: PAN-HARNESS.md: bring the `runbook.md` map line and the End of task writing item to the template form');
}

function step5Headers() {
  const months = fs.existsSync(path.join(root, 'pan-harness', 'history'))
    ? fs.readdirSync(path.join(root, 'pan-harness', 'history')).filter((n) => /^\d{4}-\d{2}\.md$/.test(n)).sort() : [];
  const targets = ['pan-harness/decisions.md', 'pan-harness/feedback.md', 'pan-harness/lessons.md', 'pan-harness/plan.md', 'pan-harness/handoff.md'];
  if (months.length) targets.push(`pan-harness/history/${months[months.length - 1]}`);
  let n = 0;
  for (const rel of targets) {
    const key = rel.startsWith('pan-harness/history/') ? 'history' : rel;
    const f = file(rel);
    if (!f) { byHand.push(`1.1.0 step 5: ${rel} is missing`); continue; }
    const tLines = template(TEMPLATE_OF[key]);
    const tRange = headerRange(tLines, ENTRY[key]);
    const range = headerRange(f.lines, ENTRY[key]);
    if (!tRange || !range) { byHand.push(`1.1.0 step 5: ${rel}: no "# title" line; compare its top with the template by hand`); continue; }
    const tHeader = tLines.slice(...tRange);
    const header = f.lines.slice(...range);
    const known = new Set([...(OLD_HEADERS[key] || []), ...tHeader].map((l) => l.trimEnd()));
    const custom = header.filter((l) => l.trim() && !known.has(l.trimEnd()));
    const fresh = [...tHeader];
    while (fresh.length && !fresh[fresh.length - 1].trim()) fresh.pop();
    const next = [...fresh, ...(custom.length ? ['', ...custom] : []), ''];
    if (next.join('\n') !== header.join('\n')) {
      f.lines.splice(range[0], range[1] - range[0], ...next);
      f.changed = true;
      n += 1;
    }
    if (custom.length) byHand.push(`1.1.0 step 5: ${rel}: ${custom.length} own line(s) kept under the new header; drop any the template now covers`);
  }
  done.push(`1.1.0 step 5: headers brought to the template (${n} file(s)), entries untouched`);
}

// ---------------------------------------------------------------- 1.2.0 (agent text and human text)

const RULE = /^- \*\*R(\d+)\./; // as pan-harness-check.mjs counts them
const BOUNDARY = "**Writing**";
let boundaryNo = null; // the number the text boundary rule (template R23) has in this project

function hasD(n) {
  return ['pan-harness/decisions.md', 'pan-harness/archive/decisions.md']
    .some((rel) => file(rel)?.lines.some((l) => l.startsWith(`- **D${n}**`)));
}

function step1Boundary() {
  const f = file('AGENTS.md');
  const group = f.lines.findIndex((l) => l.trimEnd() === BOUNDARY); // language-neutral: the rule may be translated
  const have = group >= 0 ? f.lines.slice(group + 1).find((l) => RULE.test(l)) : f.lines.find((l) => RULE.test(l) && l.includes("Matnni o'quvchisiga qarab yoz"));
  if (have) { boundaryNo = Number(RULE.exec(have)[1]); done.push(`1.2.0 step 1: R${boundaryNo} is already the text boundary rule`); return; }
  const ruleDocs = harnessDocs().filter((rel) => rel === 'AGENTS.md' || /^pan-harness\/(project\/)?playbooks\//.test(rel));
  const next = Math.max(0, ...ruleDocs.flatMap((rel) => (file(rel)?.lines || []).map((l) => RULE.exec(l)).filter(Boolean).map((m) => Number(m[1])))) + 1;
  const panRule = f.lines.find((l) => RULE.test(l) && l.includes('Pan-harness har qanday agent va model uchun'));
  const ds = ((panRule && /← ([FLD0-9, ]+)$/.exec(panRule)) || [, ''])[1].match(/D\d+/g) || (hasD(1) ? ['D1'] : []);
  const tmpl = template('AGENTS.md.tmpl');
  const at = tmpl.findIndex((l) => l.startsWith('- **R23. '));
  let end = at + 1;
  while (end < tmpl.length && /^\s+\S/.test(tmpl[end])) end += 1; // the rule's sub-items
  const rule = tmpl.slice(at, end);
  rule[0] = rule[0].replace('**R23. ', `**R${next}. `).replace(/ ← D\{\{…\}\}$/, ds.length ? ` ← ${ds.join(', ')}` : '');
  const rulesAt = f.lines.findIndex((l) => /^## Rules\s*$/.test(l));
  let last = -1;
  f.lines.forEach((l, i) => { if (i > rulesAt && RULE.test(l)) last = i; });
  if (rulesAt < 0 || last < 0) { byHand.push(`1.2.0 step 1: AGENTS.md has no numbered rule under "## Rules"; add "${BOUNDARY}" and the template's R23 there as R${next}, then do steps 2 and 3`); return; }
  while (last + 1 < f.lines.length && /^\s+\S/.test(f.lines[last + 1])) last += 1; // the last rule's own sub-lines
  f.lines.splice(last + 1, 0, '', BOUNDARY, ...rule);
  f.changed = true;
  boundaryNo = next;
  done.push(`1.2.0 step 1: AGENTS.md: R${boundaryNo} (the text boundary) added under "${BOUNDARY}"`);
  if (!ds.length) byHand.push(`1.2.0 step 1: AGENTS.md: R${boundaryNo} has no source; add the D about the pan-harness standard ("← D<n>")`);
}

function step2Chat() {
  if (!boundaryNo) { byHand.push('1.2.0 step 2: waits for step 1 (the rule number)'); return; }
  const f = file('AGENTS.md');
  const pointer = `Faylga yoziladigan matnning tili va uslubi R${boundaryNo} da.`;
  if (f.lines.some((l) => RULE.test(l) && l.includes('Egasi bilan suhbatda'))) { done.push('1.2.0 step 2: the chat rule is already limited to the conversation'); return; }
  // the chat rule: the first rule of the "**Communication**" group, in the template form "<til> va qisqa yoz,"
  const group = f.lines.findIndex((l) => l.trimEnd() === '**Communication**');
  const at = group < 0 ? -1 : f.lines.findIndex((l, i) => i > group && RULE.test(l));
  const m = at < 0 ? null : /^(- \*\*R(\d+)\. )(\S+ va qisqa yoz,\*\*.*?)( ← [FLD0-9, ]+)?$/.exec(f.lines[at]);
  if (!m) { byHand.push(`1.2.0 step 2: AGENTS.md: no chat rule in the template form (the first "**Communication**" rule, "<til> va qisqa yoz,"); start the project's chat rule with "Egasi bilan suhbatda" and end it with "${pointer}"`); return; }
  f.lines[at] = `${m[1]}Egasi bilan suhbatda ${m[3][0].toLowerCase()}${m[3].slice(1)} ${pointer}${m[4] || ''}`;
  f.changed = true;
  done.push(`1.2.0 step 2: AGENTS.md: R${m[2]} (the chat rule) is limited to the conversation and points to R${boundaryNo}`);
  const files = m[3].split(/(?<=\.)\s+/).filter((x) => /README|izoh|hujjat|fayl/i.test(x));
  if (files.length) byHand.push(`1.2.0 step 2: AGENTS.md: R${m[2]} also sets file text (${files.map((x) => `"${x.replace(/\*\*/g, '')}"`).join(', ')}); move it out of the chat rule, for example to runbook.md -> "Writing the harness" -> "Til:"`);
}

function step3Intro() {
  if (!boundaryNo) { byHand.push('1.2.0 step 3: waits for step 1 (the rule number)'); return; }
  const f = file('pan-harness/runbook.md');
  const intro = tline(template('pan-harness/runbook.md.tmpl'), INTRO_120).replace('R23', `R${boundaryNo}`);
  if (!f) { byHand.push('1.2.0 step 3: pan-harness/runbook.md is missing'); return; }
  const i = f.lines.findIndex((l) => l.trimEnd() === INTRO_110);
  if (i >= 0) { f.lines[i] = intro; f.changed = true; done.push('1.2.0 step 3: runbook.md: the "Writing the harness" intro names every agent text and its rules'); return; }
  if (f.lines.some((l) => l.startsWith(INTRO_120))) { done.push('1.2.0 step 3: the runbook intro is already the 1.2.0 one'); return; }
  byHand.push(`1.2.0 step 3: runbook.md: the "Writing the harness" intro was reworded; bring it to the template's (every agent text, the rules for it by name, then R${boundaryNo})`);
}

function step4PanHarness120() {
  const f = file('PAN-HARNESS.md');
  const tmpl = template('PAN-HARNESS.md.tmpl');
  const pairs = [[MAP_110, tline(tmpl, '- `runbook.md` —')], [END_110, tline(tmpl, '- [ ] Shu ishda yozgan har matnni').replace(/R23/g, `R${boundaryNo || 23}`)]];
  let n = 0;
  f.lines = f.lines.map((l) => {
    const pair = pairs.find(([old]) => l.trimEnd() === old);
    if (!pair || (pair[0] === END_110 && !boundaryNo)) return l;
    n += 1;
    return pair[1];
  });
  if (n) f.changed = true;
  done.push(`1.2.0 step 4: PAN-HARNESS.md: the runbook.md map line and the End of task writing item (${n} of 2)`);
  if (n < 2 && !pairs.every(([, now]) => f.lines.some((l) => l.trimEnd() === now))) {
    byHand.push('1.2.0 step 4: PAN-HARNESS.md: bring the `runbook.md` map line and the End of task writing item to the template form (R23 as the step 1 number)');
  }
}

function step5Playbook() {
  const f = file('pan-harness/playbooks/pan-harness.md');
  if (!f) return;
  const old = '(`references/testing.md` → "Fixed question set")';
  const now = "(`ph-doctor` skill'idagi testing.md, \"Fixed question set\" bo'limi)";
  let n = 0;
  f.lines = f.lines.map((l) => (l.includes(old) ? (n += 1, l.replace(old, now)) : l));
  if (n) { f.changed = true; done.push('1.2.0 step 5: playbooks/pan-harness.md: the skill file is named without a project path'); }
}

// ---------------------------------------------------------------- 1.3.0 (messages to the owner)
// the template's sub-item of the chat rule: the owner does not read the harness files, so no internal labels in messages
const OWNER_ITEM = fs.readFileSync(path.join(TEMPLATES, 'AGENTS.md.tmpl'), 'utf8').split(/\r?\n/).find((l) => l.startsWith("  - Egasi harness fayllarini o'qimaydi: "));

function step1OwnerMessages() {
  const f = file('AGENTS.md');
  if (!f) { byHand.push('1.3.0 step 1: no AGENTS.md'); return; }
  if (f.lines.some((l) => l.includes('A1, P1, S2, K4'))) { done.push('1.3.0 step 1: AGENTS.md already has the rule against internal labels in the messages to the owner'); return; }
  const at = f.lines.findIndex((l) => RULE.test(l) && l.includes('Egasi bilan suhbatda'));
  if (at < 0) {
    byHand.push('1.3.0 step 1: AGENTS.md: no chat rule in the template form (a numbered rule that starts with "Egasi bilan suhbatda"); add the template\'s sub-item under the project\'s chat rule (templates/AGENTS.md.tmpl, under R12: "Egasi harness fayllarini o\'qimaydi: ...")');
    return;
  }
  let end = at + 1;
  while (end < f.lines.length && /^ {2}- /.test(f.lines[end])) end += 1; // after the rule's own sub-items
  f.lines.splice(end, 0, OWNER_ITEM);
  f.changed = true;
  done.push(`1.3.0 step 1: AGENTS.md: R${RULE.exec(f.lines[at])[1]} (the chat rule) got the sub-item against internal labels in the messages to the owner`);
}

function step2Playbook130() {
  const f = file('pan-harness/playbooks/pan-harness.md');
  if (!f) return;
  const old = "structure o'zgarishidan oldin va keyin bir xil beriladi, natijalar solishtiriladi.";
  const now = "structure o'zgarishidan keyin beriladi, natijalar oxirgi yozilgan natija bilan solishtiriladi (oldin run shart emas).";
  let n = 0;
  f.lines = f.lines.map((l) => (l.includes(old) ? (n += 1, l.replace(old, now)) : l));
  if (n) { f.changed = true; done.push('1.3.0 step 2: playbooks/pan-harness.md: the fixed question set is given after the change, the last recorded result is the comparison'); }
}

const STEPS = {
  '1.1.0': [step1Rename, step2Rules, step3Terms, step4PanHarness, step5Headers],
  '1.2.0': [step1Boundary, step2Chat, step3Intro, step4PanHarness120, step5Playbook],
  '1.3.0': [step1OwnerMessages, step2Playbook130],
};

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
