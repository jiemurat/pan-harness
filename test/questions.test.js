// The form of the agent's questions to the owner: the short rule in the AGENTS.md template, the
// standard playbook questions.md with filled examples, and the same form in ph-grilling. The
// examples are the text a model copies, so each one is checked as a whole block.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { tmpDir } from './tmp.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TEMPLATES = path.join(ROOT, 'core', 'templates');
const read = (...p) => fs.readFileSync(path.join(...p), 'utf8');
const AGENTS = read(TEMPLATES, 'AGENTS.md.tmpl');
const PLAYBOOK_FILE = path.join(TEMPLATES, 'pan-harness', 'playbooks', 'questions.md.tmpl');
const playbook = () => read(PLAYBOOK_FILE);
const GRILLING = read(ROOT, 'skills-src', 'ph-grilling', 'SKILL.md');

// every ❓ block of a text: from its ❓ line to the next ❓ line, the end of a code fence or the end
function blocks(text) {
  return text.split('\n').reduce((acc, line) => {
    if (line.startsWith('❓')) acc.push([line]);
    else if (line.startsWith('```')) acc.push(null);
    else if (acc.length && acc[acc.length - 1]) acc[acc.length - 1].push(line);
    return acc;
  }, []).filter(Boolean).map((b) => b.join('\n'));
}

test('AGENTS.md template: a short rule points to playbooks/questions.md and names the form', () => {
  const rule = AGENTS.split('\n').filter((l) => l.includes('playbooks/questions.md'));
  assert.equal(rule.length, 1, 'one rule line points to the playbook');
  const text = rule[0];
  for (const part of ['❓ **<title>**: <question>', '`a)`, `b)`', '`➡️ <letter and option> — <why>`', 'a number before each title', 'a single question has none',
    'never joined', 'up to 120 characters drops only its title', 'bold']) {
    assert.ok(text.includes(part), `the rule has "${part}"`);
  }
  assert.ok(Buffer.byteLength(text) <= 800, `the rule stays short (${Buffer.byteLength(text)} bytes)`);
});

test('questions.md template: a standard playbook with filled examples of every form', () => {
  assert.ok(fs.existsSync(PLAYBOOK_FILE), 'playbooks/questions.md.tmpl exists');
  const text = playbook();
  assert.match(text, /^# Playbook: questions$/m);
  const all = blocks(text);
  // a single question: a title without a number, an option list, one ➡️ line with a reason
  assert.ok(all.some((b) => /^❓ \*\*[^*\d][^*]*\*\*: .+\n(- a\) .+\n)- b\) .+\n+➡️ [a-z]\) .+ — .+$/.test(b)), 'a filled single question');
  // several questions: a number before each title, each a full block
  const numbered = all.filter((b) => /^❓ \*\*\d+\. [^*]+\*\*: /.test(b));
  assert.ok(numbered.length >= 2, 'a filled example with two numbered questions');
  for (const b of numbered) assert.match(b, /(- a\) .+\n)+- b\) .+\n+➡️ [a-z]\) .+ — .+/, 'each numbered question is a full block');
  // a short question: no title, but the ➡️ line stays
  assert.ok(all.some((b) => /^❓ [^*\n]+\?\n+➡️ .+/.test(b)), 'a filled short question without a title, with its ➡️ line');
  // a question with no recommendation: the ➡️ line says what the agent does without an answer
  assert.ok(all.some((b) => /➡️ Without an answer, /.test(b)), 'a filled question without a recommendation');
  // bold in a long message
  assert.match(text, /\*\*Source:\*\*/, 'a filled long message with bold labels');
  assert.match(text, /\*\*not pushed\*\*/, 'a filled long message with bold important words');
  // a message with one question has no number, even in a task whose numbers run on
  assert.match(text, /A message with one question has no number/);
  // the words that stop the common slips
  assert.match(text, /never joined/i);
  assert.match(text, /never inline with "or"/i);
  // every block has its ➡️ line
  for (const b of all) assert.match(b, /➡️/, `a block without ➡️: ${b.slice(0, 40)}`);
  // each option stands on its own line: no "b)" inside an "a)" line
  for (const b of all) assert.doesNotMatch(b, /^- a\) .*\bb\)/m, `inline options: ${b.slice(0, 40)}`);
});

test('ph-grilling: the same form as the playbook, with an option list and a reason', () => {
  assert.doesNotMatch(GRILLING, /\*\*Q\d+\*\*/, 'no "Q1" form');
  const all = blocks(GRILLING);
  assert.ok(all.length >= 2, 'the format shows two numbered blocks');
  for (const b of all) {
    assert.match(b, /^❓ \*\*\d+\. /, 'a number before the title');
    assert.match(b, /^- a\) /m, 'an option list');
    assert.match(b, /➡️ <letter and option> — <why/, 'one recommendation with its reason');
  }
  assert.match(GRILLING, /never joined/i);
  assert.match(GRILLING, /changes: ".*question form/, 'the change from upstream is recorded');
});

test('scaffold: a new project gets playbooks/questions.md', () => {
  const dir = tmpDir('ph-questions-');
  spawnSync('git', ['init', '-q', '-b', 'main'], { cwd: dir });
  const skill = path.join(ROOT, 'skills', 'ph-update');
  const r = spawnSync(process.execPath, [path.join(skill, 'scripts', 'scaffold.mjs'), '--root', dir], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  assert.ok(fs.existsSync(path.join(dir, 'pan-harness', 'playbooks', 'questions.md')));
});

test('the map of PAN-HARNESS.md and the planning playbook point to the playbook', () => {
  assert.match(read(TEMPLATES, 'PAN-HARNESS.md.tmpl'), /^- `playbooks\/questions\.md` — .+\(before .+\)\.$/m);
  assert.match(read(TEMPLATES, 'pan-harness', 'playbooks', 'large-task.md.tmpl'), /`playbooks\/questions\.md`/);
});

// ---- stage 2: the other texts, the check, the audit, the migration

const SRC_TEXTS = (() => {
  const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
  return [...walk(path.join(ROOT, 'core')), ...walk(path.join(ROOT, 'skills-src'))].filter((p) => /\.(md|tmpl)$/.test(p));
})();

test('no old question form is left in the core and the skill sources', () => {
  const found = [];
  for (const p of SRC_TEXTS) {
    read(p).split('\n').forEach((line, i) => {
      if (/\*\*Q\d+\*\*/.test(line) || /^a\. English$/.test(line) || /\bQ[1-9]\b/.test(line)) found.push(`${path.relative(ROOT, p)}:${i + 1}: ${line.slice(0, 80)}`);
    });
  }
  assert.deepEqual(found, []);
});

test('the language question is a question block of the same form', () => {
  const text = read(ROOT, 'core', 'references', 'style-questions.md');
  assert.match(text, /^❓ \*\*Language\*\*: Which language should we talk in\?/m);
  for (const o of ['- a) English', "- b) O'zbek", '- d) Other']) assert.ok(text.includes(o), o);
  assert.match(text, /^- c\) \S+$/m);
  assert.match(text, /^➡️ Without an answer, I talk in English\./m);
  assert.doesNotMatch(text, /no recommendation line/);
});

test('ph-init and ph-doctor write a question in the form of the playbook', () => {
  assert.match(read(ROOT, 'core', 'references', 'init.md'), /templates\/pan-harness\/playbooks\/questions\.md\.tmpl/);
  assert.match(read(ROOT, 'core', 'references', 'doctor.md'), /templates\/pan-harness\/playbooks\/questions\.md\.tmpl/);
});

test('the structure, the audit and the changelogs name the question form', () => {
  const structure = read(ROOT, 'core', 'references', 'structure.md');
  assert.match(structure, /playbooks\/questions\.md/);
  const audit = read(ROOT, 'core', 'references', 'audit.md');
  const row = audit.split('\n').find((l) => l.startsWith('| A75 |')) || '';
  assert.ok(row.includes('playbooks/questions.md') && row.includes('migrate.mjs'), 'an audit row A75');
  const changelog = read(ROOT, 'core', 'references', 'changelog.md');
  const section = changelog.slice(changelog.indexOf('## 2.10.5'), changelog.indexOf('## 2.10.4\n'));
  assert.ok(section.startsWith('## 2.10.5'), 'a changelog section for the next version');
  assert.equal((section.match(/^\d+\. `mechanical`/gm) || []).length, 3, 'three mechanical steps');
  assert.match(read(ROOT, 'CHANGELOG.md'), /^## 2\.10\.5$/m);
});

test('the approval of a plan is a question block too: the playbook shows it, ph-init and ph-doctor point to it', () => {
  assert.ok(blocks(playbook()).some((b) => /^❓ Do you approve [^\n]*\?\n- a\) yes\n- b\) [^\n]+\n+➡️ Without an answer, I change nothing\./.test(b)), 'a filled approval question');
  assert.match(read(ROOT, 'core', 'references', 'init.md'), /ends with the approval question of `templates\/pan-harness\/playbooks\/questions\.md\.tmpl`/);
  assert.match(read(ROOT, 'core', 'references', 'doctor.md'), /an approval too/);
});

test('the check lists the questions playbook as a standard file', () => {
  assert.match(read(ROOT, 'core', 'scripts', 'pan-harness-check.mjs'), /const PLAYBOOKS = \[[^\]]*'questions\.md'/);
});
