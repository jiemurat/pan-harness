// The ph-init interview and plan: the first message asks the chat language in three languages; then
// the owner is asked only what nobody else can know (the goal, the limits, the artifact-folder, the git
// identity when it is missing); what "done" means is agreed in each task's plan, the checks the agent
// finds go into the plan as information; every other style, workflow and safety choice is a standard choice
// that the short plan shows in plain words and nobody waits on. The plan holds what the owner decides
// on: no file list, no internal label.
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
  assert.deepEqual(ids(section(text, 'Asked')), ['S1', 'S2', 'S4', 'S31'], 'the asked rows');
  assert.doesNotMatch(text, /^\| S3 \|/m, 'what "done" means is not a question: each task\'s plan agrees it');
  assert.match(text, /usually 3/, 'the usual number of questions');
  const standard = text.split('\n').filter((l) => l.startsWith('## Standard choices'));
  assert.equal(standard.length, 4, standard.join(' | '));
  const rest = standard.flatMap((h) => ids(section(text, h.slice(3))));
  const expected = Array.from({ length: 26 }, (_, i) => `S${i + 5}`); // S5..S30
  assert.deepEqual([...rest].sort(), [...expected].sort(), 'S5..S30 each once, in the standard choices');
  assert.doesNotMatch(text, /^## Round \d/m, 'no rounds of questions any more');
  assert.doesNotMatch(text, /^## Project knowledge/m, 'the project knowledge moved into the asked rows');
  assert.match(text, /no answer is waited for/, 'a standard choice is not waited on');
  assert.match(text, /the plan's list of open issues/, 'an open issue is listed in the plan: plan.md does not exist before the files are created');
  assert.match(text, /In an existing project \(a repo is there\)/, 'an existing project is asked in one round');
  assert.doesNotMatch(text, /one service and git/i, 'the size choice does not depend on a service in a document project');
});

test('the language question: the first message, in three languages, four options, outside the count', () => {
  const lines = ['Which language should we talk in? / Qaysi tilda gaplashamiz? / На каком языке будем общаться?',
    'a. English', "b. O'zbek", 'c. Русский', 'd. Other'].join('\n');
  const style = read(CORE, 'references', 'style-questions.md');
  const question = section(style, 'Language question');
  assert.ok(question.includes(lines), 'the question as it is, in style-questions.md');
  for (const part of ['no Q number and no recommendation line', 'does not count toward the question limit',
    'ask again in the three languages', 'the harness is in English', 'When a harness is there, the question is not asked']) {
    assert.ok(question.includes(part), `language question: ${part}`);
  }
  const situation = section(read(CORE, 'references', 'init.md'), '0. Finding the situation');
  assert.ok(situation.includes(lines), 'the question as it is, in init.md');
  assert.match(situation, /the first message to the owner is always this question/);
  assert.match(situation, /in an existing project 2 \(the language question, then the interview\), in an empty folder 3/, 'the rounds');
  const skill = read(ROOT, 'skills-src', 'ph-init', 'SKILL.md');
  assert.match(skill, /^0\. \*\*Situation\.\*\* .*the first message is the language question in three languages/m);
});

test('the asked rows carry the open questions and the topics of the old project-knowledge list', () => {
  const asked = section(read(CORE, 'references', 'style-questions.md'), 'Asked');
  const row = (id) => new RegExp(`^\\| ${id} \\|(.*)$`, 'm').exec(asked)[1];
  assert.match(row('S1'), /near plans/);
  assert.match(row('S1'), /known problems/);
  assert.match(row('S1'), /no separate confirmation question/, 'the goal is restated in the plan, not confirmed in a question of its own');
  assert.match(row('S1'), /the goal found in the README and the manifest/, 'in an existing project the agent proposes the goal it found');
  assert.match(row('S1'), /the owner's name is not asked/, "the owner's name is not a question: it costs a line of the plan and nothing depends on it");
  assert.match(read(CORE, 'references', 'init.md'), /`\{\{owner\}\}` gets the name the owner gave, otherwise/, 'the placeholder of the owner is filled without a question');
  assert.match(row('S2'), /Git has no identity/);
  for (const part of ['an invariant', 'a step the repo does not show']) assert.match(row('S4'), new RegExp(part), `S4: ${part}`);
  for (const part of ['personal or confidential data', 'irreversible action', 'outside services', 'a service that runs all the time']) assert.match(row('S4'), new RegExp(part), `S4: ${part}`);
  assert.match(row('S4'), /`live-system=yes`/, 'the service part only for a live system');
});

test('init.md interview: two rounds, an own suggestion in every open question, "I do not know" is an answer, at most 5 questions', () => {
  const interview = section(read(CORE, 'references', 'init.md'), '3. Interview');
  for (const part of ['`style-questions.md` → `Asked`', 'standard choice', 'at most 5', 'in two rounds', 'write your proposal', "I don't know", 'Awaiting owner decision',
    'no answer is waited for', 'as information', "the plan's list of open issues", 'do not ask the owner for the criteria', 'no proposal is written',
    'counts as an answer (the question is not left open)', 'find the goal in the README', 'with a reason of 1–2 sentences',
    'Before writing Q1, read `templates/pan-harness/playbooks/large-task.md.tmpl` → `Planning`', 'In an existing project (a repo is there)',
    "neither the language question nor the plan's approval counts", 'that part becomes an open issue', 'usually 3', "agreed in each task's plan"]) {
    assert.ok(interview.includes(part), `interview: ${part}`);
  }
  assert.doesNotMatch(interview, /accept as recommended/, 'ph-init has no accept-the-recommendation list');
});

test('the artifact-folder question: options by the type of the artifacts, the owner\'s own name last, no docs/, a move proposed', () => {
  const row = read(CORE, 'references', 'style-questions.md').split('\n').find((l) => l.startsWith('| S31 |'));
  assert.ok(row, 'the S31 row');
  for (const part of ['artifact-folder', '`src/`', '`app/`', '`documents/`', '`files/`', '`data/`', '`datasets/`', '`artifacts/`', '`work/`', "the owner's own folder name"]) {
    assert.ok(row.includes(part), `S31: ${part}`);
  }
  assert.match(row, /never `docs\/`/, 'docs/ is not offered');
  const init = read(CORE, 'references', 'init.md');
  assert.match(section(init, '3. Interview'), /S31/, 'the interview asks the artifact-folder');
  for (const part of ['the goal and the expected benefit', 'what moves', 'stays in the root', '`ph-init` moves no artifact', 'the first large task', 'when the owner declines']) {
    assert.ok(init.includes(part), `the move proposal: ${part}`);
  }
  assert.match(section(init, '5. Create'), /artifact-folder.*empty/, 'an empty project gets the artifact-folder empty');
});

test('init.md plan check: as many grep commands as the report part holds, plus the harness terms grep', () => {
  const words = ['no', 'one', 'two', 'three', 'four', 'five'];
  const n = (read(CORE, 'skill-parts', 'report.md').match(/^- `grep -nE /gm) || []).length;
  const plan = section(read(CORE, 'references', 'init.md'), '4. Plan');
  assert.ok(plan.includes(`the ${words[n]} \`grep\` commands of \`Report\``), `plan: the ${words[n]} grep commands of Report`);
  assert.ok(plan.includes(`the ${words[n + 1]} \`grep\` results are clean`), `plan: the ${words[n + 1]} grep results`);
});

test('init.md plan: short, for the owner, no file list, the migration table only when old content moves', () => {
  const init = read(CORE, 'references', 'init.md');
  const plan = section(init, '4. Plan');
  for (const part of ['up to 15 lines', 'It holds what the owner decides', 'the standard choices', 'The file list is not in the plan', 'only when old content moves',
    'the three `grep` commands', 'time zone', 'Leave out the form of address and the technical level', '`mktemp`', '`LC_ALL=C.UTF-8 wc -lm`', 'counts neither in the lines',
    'the open issues', 'The plan calls the folders the project-folder and the artifact-folder', 'in four lines, each with these words', 'task types, one at a time and the report', 'A rule or a list inside the harness is not a criterion',
    'Leave the harness terms', "grep -niE 'start set|profile|playbook|handoff|migration'", 'nor in the characters', 'for example the old files to move',
    "the project's full check command found in the repo", 'no check found']) {
    assert.ok(plan.includes(part), `plan: ${part}`);
  }
  assert.match(section(init, '2. Facts'), /`date '\+%Z %z'`/, 'the time zone is a fact the agent finds with a command, quoted so that the shell passes one argument');
  assert.doesNotMatch(plan, /files to create/, 'the plan does not list the files to create');
  const prep = section(init, '1. Preparation');
  assert.match(prep, /After the plan's approval[^\n]*`Pre-init state`/, "the commit of the owner's own changes waits for the approval");
  assert.doesNotMatch(prep, /S6 in the first round/, 'the commit order is not asked in a round');
  assert.match(prep, /The `\.gitignore` change you made is not the owner's uncommitted change/, "the agent's own .gitignore change is not the owner's work");
});

test('the core rules ask only what the owner alone can know, and ph-init says the same in its steps', () => {
  const rules = read(CORE, 'skill-parts', 'core-rules.md');
  const nine = /^9\. \*\*Ask only what only the owner can know\.\*\* (.*)$/m.exec(rules);
  assert.ok(nine, 'core rule 9');
  for (const part of ['`references/style-questions.md` → `Asked`', 'standard choices', 'no answer is waited for', 'the plan shows them']) assert.ok(nine[1].includes(part), `core rule 9: ${part}`);
  assert.doesNotMatch(rules, /Ask the owner about the style/);
  assert.match(rules, /^1\. \*\*Find the facts yourself, the owner makes the decisions\.\*\* .*without a question/m, 'core rule 1: a clear, safe standard choice is taken without a question');
  const skill = read(ROOT, 'skills-src', 'ph-init', 'SKILL.md');
  const steps = Object.fromEntries([...skill.matchAll(/^(\d)\. \*\*([^*]+)\*\* (.*)$/gm)].map((m) => [m[1], m[3]]));
  assert.match(steps['3'], /`Asked`/);
  assert.match(steps['3'], /standard choices/);
  assert.match(steps['3'], /templates\/pan-harness\/playbooks\/large-task\.md\.tmpl` → `Planning`/, 'the shape of the first question is read before it is written');
  assert.match(steps['4'], /within 15 lines/);
  assert.doesNotMatch(steps['3'], /\(S6\)/, 'the commit order is not asked in the first round');
});

test('the AGENTS.md template fills the rules from standard choices and drops a missing answer', () => {
  const head = read(CORE, 'templates', 'AGENTS.md.tmpl').split('-->')[0];
  for (const part of ['the standard choices', "The source of each rule: the F with the owner's words or the decision on the standard choices (D)",
    'If the owner named no technical level', 'If the owner named no form of address']) {
    assert.ok(head.includes(part), `template header: ${part}`);
  }
});

test('what "done" means is not asked in the interview: the plan of each task agrees it', () => {
  const files = [[CORE, 'skill-parts', 'core-rules.md'], [CORE, 'references', 'init.md'], [CORE, 'references', 'style-questions.md'],
    [CORE, 'references', 'principles.md'], [ROOT, 'skills-src', 'ph-init', 'SKILL.md'], [ROOT, 'README.md'], [ROOT, 'evals', 'scenarios.md']];
  for (const f of files) assert.doesNotMatch(read(...f), /what "done" means/, f.slice(1).join('/'));
  assert.doesNotMatch(read(CORE, 'references', 'init.md'), /\bS3\b/, 'init.md: no S3');
});

test('README describes the new interview', () => {
  const en = read(ROOT, 'README.md');
  assert.match(en, /asks only what you alone can answer/);
  assert.doesNotMatch(en, /each with options and a recommendation/);
});

test('the principle: a clear, safe standard choice is taken without a question, the owner changes it', () => {
  const principles = read(CORE, 'references', 'principles.md');
  const p20 = /^- \*\*P20\. .*$/m.exec(principles);
  assert.ok(p20, 'P20');
  for (const part of ['is taken without a question', 'shown in the plan', 'the owner changes it', '[31]']) assert.ok(p20[0].includes(part), `P20: ${part}`);
  assert.match(principles, /^31\. GitHub Spec Kit.*clarify/m, 'source 31');
});

test('the scenarios expect the language question, the short interview, the plan without labels and no waiting on standard choices', () => {
  const sc = read(ROOT, 'evals', 'scenarios.md');
  assert.doesNotMatch(sc, /S6 in the first round/);
  assert.match(sc, /A test runs only after the change: a run before is not needed\./);
  const e10 = section(sc, 'E10.');
  for (const part of ['at most 5 questions (the language question does not count)', 'within 15 lines', 'no answer to them is waited for',
    'the first message is the language question in three languages with four options', 'no `ph-init` and no language question']) {
    assert.ok(e10.includes(part), `E10: ${part}`);
  }
  const e1 = section(sc, 'E1.');
  assert.match(e1, /The first message is the language question in three languages with four options/);
  assert.match(e1, /`make test`/, 'E1: the project has a check the agent can find');
  assert.match(e1, /full check command found in the repo/, 'E1: the plan gives the found check as information');
  const e2 = section(sc, 'E2.');
  assert.match(e2, /holds the table of moves/);
  assert.match(e2, /within 15 lines apart from the table/, 'the migration table is not counted in the 15 lines');
});
