// P26 in the package's own agent texts (skills, references, skill parts, templates): one term per
// concept with no glossed term in brackets, and skill descriptions that stay short (they sit in
// every session's context). ph-grilling and ph-writing-for-agents are upstream text and keep their own wording. The text
// boundary: the writing rules for every text an agent reads, English for the harness, the owner's
// instruction for texts for people, the chat rules for the chat.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseFrontmatter } from '../lib/frontmatter.js';

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
const GLOSS = new RegExp(`[\\p{L}\\p{N}_'’ʻ]*[\\p{L}\\p{N}_]\\s+\\(${TERM}(?:(?:,|\\s+(?:or|and))\\s+${TERM})*\\)`, 'giu');

test('no glossed term in brackets in the agent texts', () => {
  const hits = [];
  for (const p of agentTexts) {
    fs.readFileSync(p, 'utf8').split('\n').forEach((line, i) => {
      for (const m of line.matchAll(GLOSS)) hits.push(`${path.relative(ROOT, p)}:${i + 1}: ${m[0]}`);
    });
  }
  assert.deepEqual(hits, []);
});

test('each skill description stays within 300 bytes', () => {
  const over = [];
  for (const s of fs.readdirSync(path.join(ROOT, 'skills-src'))) {
    const { data } = parseFrontmatter(fs.readFileSync(path.join(ROOT, 'skills-src', s, 'SKILL.md'), 'utf8'));
    const bytes = Buffer.byteLength(data.description, 'utf8');
    if (bytes > 300) over.push(`${s} ${bytes}`);
  }
  assert.deepEqual(over, []);
});

test('a skill description says what the skill does and when to use it, its first sentence within 160 characters', () => {
  for (const s of ['ph-init', 'ph-doctor', 'ph-update', 'ph-pdf-to-md', 'ph-word-to-md', 'ph-excel-to-md']) {
    const description = /^description: (.*)$/m.exec(fs.readFileSync(path.join(ROOT, 'skills-src', s, 'SKILL.md'), 'utf8'))[1];
    const first = description.split(/(?<=\.)\s/)[0];
    assert.ok(first.length <= 160, `${s}: ${first.length} characters`);
    assert.match(description, /\. Use it (in|when)/, `${s}: when to use it`);
  }
});

test('the text boundary is in the AGENTS.md template, the runbook, structure.md, the style questions and the audit', () => {
  const read = (rel) => fs.readFileSync(path.join(CORE, rel), 'utf8');
  const agents = read('templates/AGENTS.md.tmpl');
  const r23 = /^- \*\*R23\. Write a text for its reader\.\*\* (.*) ← D\{\{…\}\}$/m.exec(agents);
  assert.ok(r23, 'R23 in the AGENTS.md template');
  for (const part of ['Checking every claim (`Working style`) and `Boundaries` apply to every text', '`runbook.md` → `Writing the harness`']) {
    assert.ok(r23[1].includes(part), `R23: ${part}`);
  }
  assert.match(agents, /^- \*\*R12\. In the chat with the owner, write in \{\{language\}\} and briefly,\*\* .* The language of file text: R23\. ← F\{\{…\}\}$/m);
  assert.match(read('templates/pan-harness/playbooks/end-of-task.md.tmpl'), /^- \[ \] Check every text written in this task for its reader \(R23\): /m);

  const runbook = read('templates/pan-harness/runbook.md.tmpl');
  const intro = /^Write the harness text \(`AGENTS\.md`, `PAN-HARNESS\.md`, `CLAUDE\.md`, `pan-harness\/`\) with all the rules of this section; (.*)$/m.exec(runbook);
  assert.ok(intro, 'the runbook intro says what to do');
  for (const part of ['`CLAUDE.local.md`', '`GEMINI.md`', '`.github/copilot-instructions.md`', '`.cursor/rules/`', '`CONTEXT.md`',
    '`AGENTS.md` in subfolders', 'skill, command and subagent files', 'the prompts in the product', "the files of other systems' agents", '`Language of other texts`']) {
    assert.ok(intro[1].includes(part), `runbook intro: ${part}`);
  }
  const other = /^- \*\*Language of other texts\*\* \(R23\):\n {2}- (Write another text an agent reads .*)\n {2}- (For a text people read .*)\n/m.exec(runbook);
  assert.ok(other, 'the language of other texts in the runbook: two sub-items, one idea each');
  assert.match(other[1], /in the language the owner asked for, else in the existing file's language; a new file in English\./);
  for (const part of ['a report file', 'choose the language and the style separately', "(1) the owner's instruction, given in the chat or written in the harness",
    "(2) the document's own language and style", "(3) in a new document, those of the project's documents with the same purpose",
    '(4) otherwise, the chat language and a style that fits the document type', 'the final message',
    'Add a source, file path or ID line to a text for people only when the owner asks']) {
    assert.ok(other[2].includes(part), `the text for people: ${part}`);
  }
  const writing = /^## Writing\n\n(.*)$/m.exec(read('references/structure.md'));
  for (const part of ['with all the rules below', 'with the first nine rules, from `Command form` to `No-op`',
    "else the existing file's language, a new file in English", 'a report file', 'A source, file path or ID line goes into a text for people only when the owner asks',
    'the chat rules (language, style, form of address; template R12) only the chat with the owner']) {
    assert.ok(writing[1].includes(part), `structure.md Writing: ${part}`);
  }

  const style = read('references/style-questions.md');
  const row = (id) => new RegExp(`^\\| ${id} \\|(.*)$`, 'm').exec(style)[1];
  assert.match(row('S7'), /The language of the chat .* The harness and the code comments are in English\. The language of the README and other project documents is not asked here: the agent writes them by `runbook\.md` → `Writing the harness` → `Language of other texts`/);
  assert.match(row('S11'), /^ The time zone of the dates and times in the harness/);
  const s8 = row('S8').split(' | ');
  assert.match(s8[0], /how it addresses the owner/);
  assert.match(s8[2], /address without a recommendation/);
  assert.doesNotMatch(row('S8'), /"(siz|sen|Sie|du|tu|vous)"/i, 'S8 suggests no form of address');
  for (const p of agentTexts) { // no form of address is put in the owner's mouth
    assert.doesNotMatch(fs.readFileSync(p, 'utf8'), /"(siz|sen)"/, path.relative(ROOT, p));
  }
  const audit = read('references/audit.md');
  assert.match(audit, /^- Writing: A39–A50$/m);
  assert.match(audit, /^\| A49 \| .*`\*\*Writing\*\*` group.* \| Rule leak \| script .* \| mechanical .* \|$/m);
  assert.match(audit, /^\| A50 \| .* \| Rule leak \| manual: .* \| structural: .* \|$/m);
});

test('the rules for agent text outside the harness are the same nine in the runbook intro, its bullets and structure.md', () => {
  const read = (rel) => fs.readFileSync(path.join(CORE, rel), 'utf8');
  const runbook = read('templates/pan-harness/runbook.md.tmpl');
  const named = /`Command form`.*`No-op`/.exec(runbook)[0].match(/`([^`]+)`/g).map((n) => n.slice(1, -1));
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

// The owner does not read the harness files: what an agent writes to the owner carries no internal
// label (A1, P1, S2, K4: a letter and a number; rule, decision, feedback and lesson numbers too), only the meaning.
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

test('the rule against internal labels and the chat rules are in the AGENTS.md template, the core rules, the report and the audit', () => {
  const read = (rel) => fs.readFileSync(path.join(CORE, rel), 'utf8');
  const r12 = /^- \*\*R12\. In the chat with the owner, .*\n {2}- (The owner does not read the harness files: .*)\n {2}- (Where a word has several meanings, .*)\n/m.exec(read('templates/AGENTS.md.tmpl'));
  assert.ok(r12, 'R12 of the AGENTS.md template has the sub-items for the messages to the owner');
  for (const part of ['in a message (question, report, proposal, status) say the meaning',
    'an internal label (a numbered name such as A1, P1, S2, K4; rule, decision, feedback and lesson numbers too)',
    'and of a step number inside a document', 'with a link', 'If the owner asks about a label or names it, say its meaning']) {
    assert.ok(r12[1].includes(part), `R12 sub-item: ${part}`);
  }
  for (const part of ['use the English term: structure, copy, move, migration, state, status, check, verification, test, limit, boundary, estimate, assumption',
    'one term per concept, explained once at its first use', 'Commands, paths, IDs and keys in backticks', 'Short sentences, one idea per item']) {
    assert.ok(r12[2].includes(part), `R12 terms sub-item: ${part}`);
  }
  assert.match(read('templates/AGENTS.md.tmpl'), /^- \*\*R12\. .* If the owner writes in another language, answer in it; for a message that is only a command, take the language from the context\./m);
  const rule = /^14\. \*\*Write so that the owner understands\.\*\* (.*)$/m.exec(read('skill-parts/core-rules.md'));
  assert.ok(rule, 'core rule 14');
  for (const part of ['The owner does not read the harness files', 'an internal label (a numbered name such as A1, P1, S2, K4; rule, decision, feedback and lesson numbers too)',
    'write its content in plain words', 'The labels stay in the harness files', 'the number in the `#` column is for the agent',
    'when the owner writes in another language, answer in that one', 'use the English term', 'commands, paths, IDs and keys in backticks', 'short sentences, one idea per item']) {
    assert.ok(rule[1].includes(part), `core rule 14: ${part}`);
  }
  const report = read('skill-parts/report.md');
  for (const part of ['the items are named by their meaning', 'the full table (with numbers) stays in the history entry', 'Before sending, write the report draft',
    "grep -nE '[A-Za-z0-9_./-]+\\.(md|mjs|json)' <file>", "grep -nE '(^|[^[:alnum:]_])[ADFKLPRS][0-9]{1,3}([^[:alnum:]_]|$)' <file>",
    "grep -nE 'Awaiting owner decision|Later and watch|"]) assert.ok(report.includes(part), `report: ${part}`);
  assert.match(read('references/audit.md'), /^\| A49 \| .*A1, P1, S2, K4.* \| Rule leak \|/m);
});

test('a test run before the change is not required: the last recorded result is the comparison', () => {
  const read = (p) => fs.readFileSync(p, 'utf8');
  for (const rel of ['references/testing.md', 'references/doctor.md', 'templates/pan-harness/playbooks/pan-harness.md.tmpl']) {
    const text = read(path.join(CORE, rel));
    assert.match(text, /a run before is not needed/, rel);
    assert.match(text, /the last recorded result/, rel);
  }
});

test('the package is called ph-paket in the agent texts, and the glossary says what it is', () => {
  const ok = /npm package|package manager|packages' own|by package name|package\.json|^\s*package:/; // the npm package of the glossary row, a package manager, packages of a monorepo, the manifest
  const hits = [];
  for (const p of agentTexts) {
    fs.readFileSync(p, 'utf8').split('\n').forEach((line, i) => {
      for (const m of line.matchAll(/(?<![\w-])[Pp]ackages?\b/g)) {
        if (!ok.test(line.slice(Math.max(0, m.index - 12), m.index + m[0].length + 12)) && !ok.test(line)) hits.push(`${path.relative(ROOT, p)}:${i + 1}: ${m[0]}`);
      }
    });
  }
  assert.deepEqual(hits, []);
  assert.match(fs.readFileSync(path.join(CORE, 'references', 'structure.md'), 'utf8'), /^\| ph-paket \| The `@jiemurat\/pan-harness` npm package: /m);
});

test('the usage limit rule is in the large-task playbook template, the structure description, the audit and the changelog', () => {
  const read = (rel) => fs.readFileSync(path.join(CORE, rel), 'utf8');
  const execution = read('templates/pan-harness/playbooks/large-task.md.tmpl').split('## Execution\n')[1].split(/\n## /)[0];
  for (const part of ['If you can see the usage limit, before a large task, a sub-agent run or a stage over 10% of the 5-hour window',
    'the share left and its renewal time', 'with no measurement, put the stage off when under 10% is left', 'If the budget is over, the scope stays',
    '`plan.md` → `Scheduled`', 'If you cannot see the limit, go on without asking', 'limit: not checked']) {
    assert.ok(execution.includes(part), `Execution: ${part}`);
  }
  assert.match(read('references/structure.md'), /`## Execution`: .*the limit rule/);
  const audit = read('references/audit.md');
  assert.match(audit, /^- Continuity and checks: A58–A67$/m);
  assert.match(audit, /^\| A66 \| .*Execution.*limit.* \| Interrupted work \| manual.* \| mechanical.* \|$/m);
  assert.match(read('references/changelog.md'), /^## 2\.4\.2$/m);
});
