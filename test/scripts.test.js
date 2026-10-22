// scaffold.mjs (ph-init) and migrate.mjs (ph-update) on throwaway projects: the templates land
// in place and the check lists what is left to fill; on the current standard migrate replaces an
// old script copy and the standard hook, leaves a project's own hook to the owner and changes
// nothing on a second run; a harness of a standard it does not list stops it.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { tmpDir } from './tmp.js';

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
  const dir = tmpDir('ph-scripts-');
  git(dir, 'init', '-q', '-b', 'main');
  git(dir, 'config', 'user.name', 'Test');
  git(dir, 'config', 'user.email', 'test@example.com');
  git(dir, 'config', 'core.autocrlf', 'false');
  return dir;
}
const run = (script, ...args) => spawnSync(process.execPath, [path.join(SKILL, 'scripts', script), ...args], { encoding: 'utf8' });
const read = (dir, rel) => fs.readFileSync(path.join(dir, ...rel.split('/')), 'utf8');
const startSet = (dir) => ['AGENTS.md', 'PAN-HARNESS.md', 'pan-harness/state.md', 'pan-harness/plan.md'].reduce((n, rel) => n + Buffer.byteLength(read(dir, rel)), 0);
function put(dir, rel, body) {
  fs.mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true });
  fs.writeFileSync(path.join(dir, rel), body);
}

test('scaffold: copies every template once, sets the hook, the check lists what is left to fill', () => {
  const dir = repo();
  const r = run('scaffold.mjs', '--root', dir, '--secrets');
  assert.equal(r.status, 0, r.stderr);
  for (const rel of ['AGENTS.md', 'PAN-HARNESS.md', 'pan-harness/state.md', 'pan-harness/runbook.md', 'pan-harness/decisions.md',
    `pan-harness/history/${MONTH}.md`, 'pan-harness/playbooks/pan-harness.md', 'pan-harness/playbooks/large-task.md',
    'pan-harness/playbooks/end-of-task.md', 'pan-harness/project/check.json', 'pan-harness/scripts/pan-harness-check.mjs',
    'pan-harness/scripts/secret-check.mjs', '.githooks/pre-commit']) {
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
  assert.doesNotMatch(check.stdout, /missing standard file/, 'scaffold makes every standard file');

  fs.writeFileSync(path.join(dir, 'AGENTS.md'), '# Mine\n');
  const again = run('scaffold.mjs', '--root', dir);
  assert.equal(again.status, 0);
  assert.match(again.stdout, /^kept {4}AGENTS\.md/m);
  assert.equal(read(dir, 'AGENTS.md'), '# Mine\n');
});

test('scaffold: with no active task the handoff keeps only its paragraphs and status line, and no template links to a section it lacks', () => {
  const dir = repo();
  assert.equal(run('scaffold.mjs', '--root', dir).status, 0);
  const handoff = read(dir, 'pan-harness/handoff.md').replace(/^<!--[\s\S]*?-->\n/, '');
  put(dir, 'pan-harness/handoff.md', `${handoff.slice(0, handoff.search(/^\*\*Status:\*\*/m))}**Status:** none\n`);
  const check = spawnSync(process.execPath, [path.join(dir, 'pan-harness/scripts/pan-harness-check.mjs'), '--root', dir], { encoding: 'utf8' });
  assert.doesNotMatch(check.stdout, /leads to no heading or bold label/);
});

test('scaffold: another pre-commit hook is left for the owner', () => {
  const dir = repo();
  put(dir, '.pre-commit-config.yaml', 'repos: []\n');
  const r = run('scaffold.mjs', '--root', dir);
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /already has a pre-commit hook \(\.pre-commit-config\.yaml\)/);
  assert.equal(spawnSync('git', ['config', '--get', 'core.hooksPath'], { cwd: dir, encoding: 'utf8' }).stdout.trim(), '');
});

test('scaffold: in a subfolder of a repository the hook is left to the owner with the command', () => {
  const top = repo();
  const sub = path.join(top, 'apps', 'book');
  fs.mkdirSync(sub, { recursive: true });
  const r = run('scaffold.mjs', '--root', sub);
  assert.equal(r.status, 0, r.stderr);
  assert.ok(fs.existsSync(path.join(sub, '.githooks', 'pre-commit')));
  assert.equal(spawnSync('git', ['config', '--get', 'core.hooksPath'], { cwd: top, encoding: 'utf8' }).stdout.trim(), '', 'the repository config is left as it is');
  assert.match(r.stdout, /^note +the project is a subfolder \(apps\/book\/\) of the git repository .*: core\.hooksPath was not set.*`git -C .+ config core\.hooksPath apps\/book\/\.githooks`/m);
});

/** A harness on the current standard, made by scaffold, with an old script copy and the hook's comments edited. */
function current() {
  const dir = repo();
  assert.equal(run('scaffold.mjs', '--root', dir).status, 0);
  put(dir, 'pan-harness/scripts/pan-harness-check.mjs', '// an old copy\n');
  const hook = read(dir, '.githooks/pre-commit');
  put(dir, '.githooks/pre-commit', hook.replace(/^# pre-commit \(pan-harness\).*$/m, '# pre-commit (pan-harness): an old comment'));
  git(dir, 'add', '-A');
  git(dir, 'commit', '-q', '-m', 'harness');
  return dir;
}

test('migrate: on the current standard it replaces an old script copy and the standard hook, a second run changes nothing', () => {
  const dir = current();
  const agents = read(dir, 'AGENTS.md');
  const r = run('migrate.mjs', '--root', dir);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /^done +pan-harness\/scripts\/pan-harness-check\.mjs: replaced with the skill's copy$/m);
  assert.match(r.stdout, /^done +\.githooks\/pre-commit: comments updated from the template$/m);
  assert.ok(r.stdout.includes(`migrate: ${VERSION} -> ${VERSION}; 2 done, 0 by hand`), r.stdout);
  assert.equal(read(dir, 'pan-harness/scripts/pan-harness-check.mjs'), fs.readFileSync(path.join(SKILL, 'scripts', 'pan-harness-check.mjs'), 'utf8'));
  assert.equal(read(dir, '.githooks/pre-commit'), fs.readFileSync(path.join(SKILL, 'templates', 'githooks', 'pre-commit.tmpl'), 'utf8'));
  assert.equal(read(dir, 'AGENTS.md'), agents, 'the harness text is left as it is');

  const again = run('migrate.mjs', '--root', dir);
  assert.ok(again.stdout.includes(`migrate: ${VERSION} -> ${VERSION}; 0 done, 0 by hand`), again.stdout);
});

test('migrate: the old standard hook, which ran from the repository top, is replaced with the template', () => {
  const dir = current();
  const tmpl = fs.readFileSync(path.join(SKILL, 'templates', 'githooks', 'pre-commit.tmpl'), 'utf8');
  put(dir, '.githooks/pre-commit', tmpl
    .replace('cd "$(dirname "$0")/.." || exit 1', 'root=$(git rev-parse --show-toplevel) || exit 1\ncd "$root" || exit 1')
    .replace(' --relative -z', ' -z'));
  const r = run('migrate.mjs', '--root', dir);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /^done +\.githooks\/pre-commit: replaced with the template \(the checks run in the project-folder\)$/m);
  assert.equal(read(dir, '.githooks/pre-commit'), tmpl);
});

test('migrate: from 2.8.3 a project in a subfolder with the hook pointed at the top gets the command by hand', () => {
  const top = repo();
  const sub = path.join(top, 'apps', 'book');
  fs.mkdirSync(sub, { recursive: true });
  assert.equal(run('scaffold.mjs', '--root', sub).status, 0);
  put(sub, 'PAN-HARNESS.md', read(sub, 'PAN-HARNESS.md').replace(/^Standard: pan-harness \S+$/m, 'Standard: pan-harness 2.8.3'));
  git(top, 'config', 'core.hooksPath', '.githooks'); // what the old scaffold set
  const r = run('migrate.mjs', '--root', sub);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /^by hand 2\.8\.4 step 2: the project is a subfolder \(apps\/book\/\) .*`git -C ".+" config core\.hooksPath apps\/book\/\.githooks`$/m);
  assert.equal(git(top, 'config', '--get', 'core.hooksPath').trim(), '.githooks', 'the repository config is left as it is');
  git(top, 'config', 'core.hooksPath', 'apps/book/.githooks');
  put(sub, 'PAN-HARNESS.md', read(sub, 'PAN-HARNESS.md').replace(/^Standard: pan-harness \S+$/m, 'Standard: pan-harness 2.8.3'));
  assert.doesNotMatch(run('migrate.mjs', '--root', sub).stdout, /2\.8\.4 step 2/);
});

test('migrate: a project hook with its own commands is left by hand for the owner', () => {
  const dir = current();
  put(dir, '.githooks/pre-commit', `${read(dir, '.githooks/pre-commit')}npm run lint\n`);
  const r = run('migrate.mjs', '--root', dir);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /^by hand \.githooks\/pre-commit differs from the template: show the difference to the owner/m);
  assert.match(read(dir, '.githooks/pre-commit'), /npm run lint\n$/, 'the hook is kept');
});

test('migrate: a dry run writes nothing, an old or unknown standard stops, CRLF files keep CRLF', () => {
  const dir = current();
  const dry = run('migrate.mjs', '--root', dir, '--dry-run');
  assert.equal(dry.status, 0);
  assert.match(dry.stdout, /dry run/);
  assert.equal(read(dir, 'pan-harness/scripts/pan-harness-check.mjs'), '// an old copy\n');

  fs.writeFileSync(path.join(dir, 'PAN-HARNESS.md'), read(dir, 'PAN-HARNESS.md').replace(/\n/g, '\r\n'));
  assert.equal(run('migrate.mjs', '--root', dir).status, 0);
  assert.ok(!/[^\r]\n/.test(read(dir, 'PAN-HARNESS.md')), 'CRLF kept');

  const old = repo();
  put(old, 'PAN-HARNESS.md', '# PAN-HARNESS\n\nStandard: pan-harness 0.9.0\n');
  const r = run('migrate.mjs', '--root', old);
  assert.equal(r.status, 3);
  assert.match(r.stdout, /unknown standard \(version 0\.9\.0\): compare the harness with structure\.md and templates\/ by hand/);

  const unknown = repo();
  put(unknown, 'PAN-HARNESS.md', '# PAN-HARNESS\n');
  const u = run('migrate.mjs', '--root', unknown);
  assert.equal(u.status, 3);
  assert.match(u.stdout, /unknown standard \(no Standard line\)/);
});

// the usage limit rule: three bullets at the end of the large-task playbook's Execution section
const LIMIT_LINE = /^- (If you can see the usage limit|If the budget is over|If you cannot see the limit),/;
const executionOf = (playbook) => playbook.split('## Execution\n')[1].split(/\n## /)[0].split('\n');
const templateLimitLines = () => executionOf(fs.readFileSync(path.join(SKILL, 'templates', 'pan-harness', 'playbooks', 'large-task.md.tmpl'), 'utf8'))
  .filter((l) => LIMIT_LINE.test(l));

test('the large-task playbook template and scaffold carry the usage limit rule at the end of Execution, within 620 bytes', () => {
  const lines = templateLimitLines();
  assert.equal(lines.length, 3, 'three bullets');
  assert.ok(Buffer.byteLength(lines.join('\n')) <= 620, `${Buffer.byteLength(lines.join('\n'))} bytes`);
  const bullets = executionOf(fs.readFileSync(path.join(SKILL, 'templates', 'pan-harness', 'playbooks', 'large-task.md.tmpl'), 'utf8'))
    .filter((l) => l.startsWith('- '));
  assert.deepEqual(bullets.slice(-3), lines, 'the last three bullets of Execution');
  const dir = repo();
  assert.equal(run('scaffold.mjs', '--root', dir).status, 0);
  assert.deepEqual(executionOf(read(dir, 'pan-harness/playbooks/large-task.md')).filter((l) => LIMIT_LINE.test(l)), lines);
});

// the project's full check: an end-of-task item before the harness check item; migrate brings it to 2.4.2 and 2.5.2 harnesses
const FULL_CHECK = /^- \[ \] If this task changed a file outside the harness /;
const HARNESS_CHECK = /^- \[ \] Run `node pan-harness\/scripts\/pan-harness-check\.mjs`/;
const templateEndOfTask = () => fs.readFileSync(path.join(SKILL, 'templates', 'pan-harness', 'playbooks', 'end-of-task.md.tmpl'), 'utf8').split('\n');

test('the end-of-task template runs the project\'s full check after a change outside the harness, before the harness check', () => {
  const lines = templateEndOfTask();
  const at = lines.findIndex((l) => FULL_CHECK.test(l));
  assert.ok(at >= 0, 'the full check item');
  assert.ok(HARNESS_CHECK.test(lines[at + 1]), 'right before the harness check item');
  for (const part of ['`AGENTS.md`, `PAN-HARNESS.md`, `CLAUDE.md`, `pan-harness/`', '`.gitignore` lines of this checklist do not count', '`PAN-HARNESS.md` → `Project checks`',
    'not the status checks', 'names no full check (for example, "None.")', 'before the commit', 'was there before the task', '`plan.md`', "count it as this task's"]) {
    assert.ok(lines[at].includes(part), `full check item: ${part}`);
  }
  const dir = repo();
  assert.equal(run('scaffold.mjs', '--root', dir).status, 0);
  assert.ok(read(dir, 'pan-harness/playbooks/end-of-task.md').split('\n').includes(lines[at]), 'scaffold writes it');
});

test('migrate: from 2.4.2 and 2.5.2 the end-of-task playbook gets the full check item once; a reworded playbook is left by hand', () => {
  const item = templateEndOfTask().find((l) => FULL_CHECK.test(l));
  const without = (dir) => put(dir, 'pan-harness/playbooks/end-of-task.md', read(dir, 'pan-harness/playbooks/end-of-task.md').split('\n').filter((l) => l !== item).join('\n'));
  const standard = (dir, v) => put(dir, 'PAN-HARNESS.md', read(dir, 'PAN-HARNESS.md').replace(/^Standard: pan-harness \S+$/m, `Standard: pan-harness ${v}`));
  for (const from of ['2.4.2', '2.5.2']) {
    const dir = current();
    without(dir);
    standard(dir, from);
    const r = run('migrate.mjs', '--root', dir);
    assert.equal(r.status, 0, r.stdout + r.stderr);
    assert.match(r.stdout, /^done +2\.6\.2 step 1: playbooks\/end-of-task\.md: End of task got the item that runs the project's full check$/m, r.stdout);
    assert.match(r.stdout, /^done +Standard: pan-harness 2\.6\.2$/m);
    const lines = read(dir, 'pan-harness/playbooks/end-of-task.md').split('\n');
    const at = lines.indexOf(item);
    assert.ok(at >= 0 && HARNESS_CHECK.test(lines[at + 1]), 'before the harness check item');
    assert.equal(lines.filter((l) => l === item).length, 1, 'once');
    const again = run('migrate.mjs', '--root', dir);
    assert.ok(again.stdout.includes(`migrate: ${VERSION} -> ${VERSION}; 0 done, 0 by hand`), again.stdout);
  }
  const reworded = current();
  without(reworded);
  put(reworded, 'pan-harness/playbooks/end-of-task.md', read(reworded, 'pan-harness/playbooks/end-of-task.md').replace(/^- \[ \] Run `node pan-harness\/scripts\/pan-harness-check\.mjs`/m, '- [ ] Check the harness with `node pan-harness/scripts/pan-harness-check.mjs`'));
  standard(reworded, '2.5.2');
  const r = run('migrate.mjs', '--root', reworded);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /^by hand 2\.6\.2 step 1: playbooks\/end-of-task\.md: no harness check item in the template form/m, r.stdout);
  const own = current();
  without(own);
  put(own, 'pan-harness/playbooks/end-of-task.md', read(own, 'pan-harness/playbooks/end-of-task.md').replace(new RegExp(HARNESS_CHECK.source, 'm'), '- [ ] Run `make test` (`PAN-HARNESS.md` → `Project checks`).\n$&'));
  standard(own, '2.5.2');
  const o = run('migrate.mjs', '--root', own);
  assert.match(o.stdout, /^by hand 2\.6\.2 step 1: playbooks\/end-of-task\.md: an item in the project's own words names `Project checks`/m, o.stdout);
  assert.equal(read(own, 'pan-harness/playbooks/end-of-task.md').split('\n').filter((l) => l === item).length, 0, 'not added next to the own item');
});

// 2.8.2: the fast check items (code=yes), the lesson questions part, the end-of-task sentence; the commands and the outside content rules by hand
test('migrate: from 2.7.2 the fast check items come with code=yes only, the lesson questions once; the commands and the two rules by hand', () => {
  const tmpl = (rel) => fs.readFileSync(path.join(SKILL, 'templates', ...rel.split('/')), 'utf8').split('\n');
  const loop = tmpl('AGENTS.md.tmpl').find((l) => l.includes('**Check while you work.**')).replace('[profile: code=yes] ', '');
  const baseline = tmpl('AGENTS.md.tmpl').find((l) => l.includes('Before each task that changes the artifacts, a small change too, run the fast check')).replace(/^\d+\. \[profile: code=yes\] /, '');
  const lessonItem = tmpl('pan-harness/playbooks/end-of-task.md.tmpl').find((l) => l.includes('Turn a repeated mistake into a rule.'));
  const oldItem = lessonItem.replace('`Layer:`, ', '').replace(/ When a lesson becomes a rule, .*$/, '');
  // a 2.7.2 harness: the scaffolded one without the new parts
  const old = (code) => {
    const dir = current();
    const agents = read(dir, 'AGENTS.md').split('\n')
      .filter((l) => !l.includes('**Check while you work.**') && !l.includes('Before each task that changes the artifacts') && !/^(\*\*Outside content\*\*|- \*\*R2[45]\. )/.test(l))
      .map((l) => l.replace(/^(\d+)\. Read other files only when needed/, (m, n) => `${n - 1}. Read other files only when needed`));
    put(dir, 'AGENTS.md', agents.join('\n'));
    put(dir, 'pan-harness/playbooks/end-of-task.md', read(dir, 'pan-harness/playbooks/end-of-task.md').replace(lessonItem, oldItem));
    put(dir, 'pan-harness/playbooks/pan-harness.md', read(dir, 'pan-harness/playbooks/pan-harness.md').replace(/\n### Lesson questions\n[\s\S]*?(?=\n## )/, ''));
    put(dir, 'PAN-HARNESS.md', read(dir, 'PAN-HARNESS.md').replace(/^Standard: pan-harness \S+$/m, 'Standard: pan-harness 2.7.2')
      .replace(/^Profile: .*$/m, `Profile: live-system=no, code=${code}, sensitive-data=none`).split('\n').filter((l) => !/\*\*(Fast check|See the result):\*\*/.test(l)).join('\n'));
    return dir;
  };
  const dir = old('yes');
  const r = run('migrate.mjs', '--root', dir);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  for (const line of [/^done +2\.8\.2 step 1: AGENTS\.md: Working style got the "Check while you work" item$/m, /^done +2\.8\.2 step 2: AGENTS\.md: Session start got the fast check before a task$/m,
    /^done +2\.8\.2 step 3: playbooks\/end-of-task\.md: the lesson item names the layer and adds a lesson question$/m, /^done +2\.8\.2 step 4: playbooks\/pan-harness\.md: Test questions got the Lesson questions part$/m,
    /^by hand 2\.8\.2 step 5: PAN-HARNESS\.md: Project checks has no Fast check and See the result lines/m, /^by hand 2\.8\.2 step 6: AGENTS\.md: no outside content rules/m, /^done +Standard: pan-harness 2\.8\.2$/m]) {
    assert.match(r.stdout, line, r.stdout);
  }
  const agents = read(dir, 'AGENTS.md').split('\n');
  assert.ok(agents[agents.indexOf(loop) - 1].startsWith('- **Small, reversible steps.**'), 'after "Small, reversible steps"');
  const b = agents.findIndex((l) => l.endsWith(baseline));
  assert.ok(b >= 0 && /^(\d+)\. /.test(agents[b]), 'the baseline item');
  assert.equal(Number(/^(\d+)\./.exec(agents[b + 1])[1]), Number(/^(\d+)\./.exec(agents[b])[1]) + 1, '"Read other files" moved one down');
  assert.ok(read(dir, 'pan-harness/playbooks/end-of-task.md').split('\n').includes(lessonItem));
  assert.equal(read(dir, 'pan-harness/playbooks/pan-harness.md').split('### Lesson questions\n').length, 2, 'the part once');
  const again = run('migrate.mjs', '--root', dir);
  assert.ok(again.stdout.includes(`migrate: ${VERSION} -> ${VERSION}; 0 done, 0 by hand`), again.stdout);
  const doc = old('no');
  const d = run('migrate.mjs', '--root', doc);
  assert.equal(d.status, 0, d.stdout + d.stderr);
  assert.doesNotMatch(d.stdout, /2\.8\.2 step [125]:/, d.stdout);
  assert.ok(!read(doc, 'AGENTS.md').includes('**Check while you work.**'), 'code=no: no item');
  assert.match(d.stdout, /^done +2\.8\.2 step 4: /m);
});

// 2.8.2, the second part: the lesson layer, the check command of a step; the logs, the first run and markers by hand
test('migrate: from 2.7.2 the lessons get the layer, check.json starts it at the next lesson, a step names its check command', () => {
  const tmpl = (rel) => fs.readFileSync(path.join(SKILL, 'templates', ...rel.split('/')), 'utf8').split('\n');
  const format = tmpl('pan-harness/lessons.md.tmpl').find((l) => l.startsWith('- **L<n> '));
  const layerLine = tmpl('pan-harness/lessons.md.tmpl').find((l) => l.startsWith('`Layer:` '));
  const checkLine = tmpl('pan-harness/playbooks/large-task.md.tmpl').find((l) => l.startsWith('  - each criterion and each step names its check command'));
  const lessonItem = tmpl('pan-harness/playbooks/end-of-task.md.tmpl').find((l) => l.includes('Turn a repeated mistake into a rule.'));
  const dir = current();
  put(dir, 'pan-harness/lessons.md', read(dir, 'pan-harness/lessons.md').replace(format, format.replace(' Layer: …', '')).replace(`${layerLine}\n`, '')
    + `\n- **L1 (${DAY}) — A lesson.** [docs] It happened. Rule: do it. Check: see it.\n- **L2 (${DAY}) — Another.** [docs] It happened. Rule: do it. Check: see it.\n`);
  put(dir, 'pan-harness/playbooks/large-task.md', read(dir, 'pan-harness/playbooks/large-task.md').replace(`${checkLine}\n`, ''));
  const oldName = ['ph', 'paket'].join('-'); // the earlier name, kept out of this file
  put(dir, 'pan-harness/playbooks/pan-harness.md', read(dir, 'pan-harness/playbooks/pan-harness.md').replace('If a new version of the pan-harness package is out', `If a new version of ${oldName} is out`));
  put(dir, 'pan-harness/handoff.md', read(dir, 'pan-harness/handoff.md').replace('each step with its outcome, completion criterion and check command when one exists;', 'each step with its outcome and completion criterion;'));
  put(dir, 'pan-harness/playbooks/end-of-task.md', read(dir, 'pan-harness/playbooks/end-of-task.md').replace(lessonItem, lessonItem.replace('`Layer:`, ', '').replace(/ When a lesson becomes a rule, .*$/, '')));
  put(dir, 'PAN-HARNESS.md', read(dir, 'PAN-HARNESS.md').replace(/^Standard: pan-harness \S+$/m, 'Standard: pan-harness 2.7.2')
    .replace(/^Profile: .*$/m, 'Profile: live-system=no, code=yes, sensitive-data=none').split('\n').filter((l) => !/\*\*(Fast check|See the result|Logs):\*\*/.test(l)).join('\n'));
  const r = run('migrate.mjs', '--root', dir);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  for (const line of [/^done +2\.8\.2 step 3: playbooks\/end-of-task\.md: the lesson item names the layer and adds a lesson question$/m,
    /^done +2\.8\.2 step 7: lessons\.md: the format names the layer$/m, /^done +2\.8\.2 step 8: project\/check\.json: fields_from Layer 3 \(older lessons keep their form\)$/m,
    /^done +2\.8\.2 step 9: playbooks\/large-task\.md: Planning names the check command of a step$/m, /^done +2\.8\.2 step 10: handoff\.md: Steps name their check command$/m,
    /^done +2\.8\.2 step 12: playbooks\/pan-harness\.md: the upkeep line names the pan-harness package$/m,
    /^by hand 2\.8\.2 step 11: with code=yes, PAN-HARNESS\.md: a Logs line, the dated result of the first run of the fast and full check, and check\.json markers/m]) {
    assert.match(r.stdout, line, r.stdout);
  }
  assert.ok(read(dir, 'pan-harness/lessons.md').split('\n').includes(format) && read(dir, 'pan-harness/lessons.md').includes(layerLine));
  assert.equal(JSON.parse(read(dir, 'pan-harness/project/check.json')).fields_from.Layer, 3);
  const planning = read(dir, 'pan-harness/playbooks/large-task.md').split('\n');
  assert.equal(planning[planning.findIndex((l) => l.startsWith('  - evidence is re-run where possible')) + 1], checkLine);
  assert.ok(read(dir, 'pan-harness/playbooks/end-of-task.md').split('\n').includes(lessonItem));
  assert.ok(!read(dir, 'pan-harness/playbooks/pan-harness.md').includes(oldName), 'the old name is gone');
  const again = run('migrate.mjs', '--root', dir);
  assert.ok(again.stdout.includes(`migrate: ${VERSION} -> ${VERSION}; 0 done, 0 by hand`), again.stdout);
});

// 2.8.3: the handoff intro names the sections and the status line in plain words
test('migrate: from 2.8.2 the handoff intro loses its heading names; a reworded intro is left by hand', () => {
  const OLD = 'When a large task is approved, write `**Status:** active` and fill the sections: `## Task` (task, goal, not done, budget), `## Criteria` (K1…: what is observed, the threshold, how and when it is checked, status), `## Steps` (each step with its outcome, completion criterion and check command when one exists; status — `todo`, `active`, `blocked` or `done`, one `active` at a time), `## Changed files` (the files this task has changed so far), `## Checks`, `## Decisions`, `## Open questions`, `## Next step`, `## Work files` (the planned and the temporary files). When the task ends, move the decisions into `decisions.md` and the rest into the history entry, and leave `**Status:** none` here.';
  const intro = fs.readFileSync(path.join(SKILL, 'templates', 'pan-harness', 'handoff.md.tmpl'), 'utf8').split('\n').find((l) => l.startsWith('When a large task is approved, '));
  const old = (line) => {
    const dir = current();
    put(dir, 'pan-harness/handoff.md', read(dir, 'pan-harness/handoff.md').replace(intro, line));
    put(dir, 'PAN-HARNESS.md', read(dir, 'PAN-HARNESS.md').replace(/^Standard: pan-harness \S+$/m, 'Standard: pan-harness 2.8.2'));
    return dir;
  };
  const dir = old(OLD);
  const r = run('migrate.mjs', '--root', dir);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /^done +2\.8\.3 step 1: handoff\.md: the intro names the sections and the status line in plain words$/m);
  assert.match(r.stdout, /^done +Standard: pan-harness 2\.8\.3$/m);
  const handoff = read(dir, 'pan-harness/handoff.md');
  assert.ok(handoff.split('\n').includes(intro) && !handoff.includes(OLD), 'the new intro in place of the old');
  const again = run('migrate.mjs', '--root', dir);
  assert.ok(again.stdout.includes(`migrate: ${VERSION} -> ${VERSION}; 0 done, 0 by hand`), again.stdout);
  const mine = old(OLD.replace('When a large task is approved', 'When the owner approves a large task'));
  assert.match(run('migrate.mjs', '--root', mine).stdout, /^by hand 2\.8\.3 step 1: handoff\.md: the intro is reworded/m);
});

test('migrate 2.9.4 -> 2.10.5: AGENTS.md gets the main-agent, one task in each session, the Agent: line, the ph-workers pointer and the delegation item; the delegation playbook is made', () => {
  const dir = current();
  const old = read(dir, 'AGENTS.md')
    .replace(/^- \*\*Main-agent:\*\* .*\n/m, '')
    .replace('one task at a time in each session (R1)', 'one task at a time (R1)')
    .replace('**R1. One task at a time in each session.**', '**R1. One task at a time.**')
    .replace(/ End each commit message with the line `Agent: <your name>`[^.]*\./, '')
    .replace(/\n\nSet the type first[^\n]*/, '')
    .replace(/\n\nA request that names a worker-agent[^\n]*/, '')
    .replace(/\n- \*\*Delegate reading\.\*\*[^\n]*/, '');
  put(dir, 'AGENTS.md', old);
  fs.rmSync(path.join(dir, 'pan-harness', 'playbooks', 'delegation.md'));
  put(dir, 'pan-harness/project/check.json', read(dir, 'pan-harness/project/check.json').replace(/"start_limit_bytes": \d+/, '"start_limit_bytes": 24576'));
  put(dir, 'PAN-HARNESS.md', read(dir, 'PAN-HARNESS.md').replace(/^Standard: pan-harness .*$/m, 'Standard: pan-harness 2.9.4'));
  const before = startSet(dir);
  const r = run('migrate.mjs', '--root', dir);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  for (const step of [1, 2, 3, 4, 5, 6]) assert.match(r.stdout, new RegExp(`^done +2\\.10\\.4 step ${step}: `, 'm'));
  const added = startSet(dir) - before - (Buffer.byteLength(VERSION) - Buffer.byteLength('2.9.4')); // the Standard line is written after the steps
  assert.match(r.stdout, new RegExp(`^done +2\\.10\\.4 step 5: project/check\\.json: start_limit_bytes ${added} bytes higher for the worker-agent lines$`, 'm'));
  const agents = read(dir, 'AGENTS.md');
  const tmpl = fs.readFileSync(path.join(SKILL, 'templates', 'AGENTS.md.tmpl'), 'utf8');
  for (const line of ['- **Main-agent:** COOPER.', '**R1. One task at a time in each session.**', 'one task at a time in each session (R1)',
    'End each commit message with the line `Agent: <your name>`', 'A request that names a worker-agent', '- **Delegate reading.** ']) {
    assert.ok(agents.includes(line), line);
    assert.ok(tmpl.includes(line), `the template has ${line}`);
  }
  assert.match(read(dir, 'pan-harness/project/check.json'), new RegExp(`"start_limit_bytes": ${24576 + added}`));
  const playbook = read(dir, 'pan-harness/playbooks/delegation.md');
  assert.match(playbook, /^# Playbook: delegation$/m);
  assert.doesNotMatch(playbook, /<!--/, 'the template note is left out');
  assert.match(read(dir, 'PAN-HARNESS.md'), new RegExp(`^Standard: pan-harness ${VERSION.replace(/\./g, '\\.')}$`, 'm'));
  const again = run('migrate.mjs', '--root', dir);
  assert.ok(again.stdout.includes('0 by hand'), again.stdout);
  assert.equal(read(dir, 'AGENTS.md'), agents, 'a second run changes nothing');
});

test('migrate 2.10.4 -> 2.10.5: AGENTS.md gets the question rule, the questions playbook is made, the planning playbook and the map point to it', () => {
  const dir = current();
  const tmplRule = fs.readFileSync(path.join(SKILL, 'templates', 'AGENTS.md.tmpl'), 'utf8').split('\n').find((l) => l.startsWith('  - **Questions.** '));
  assert.ok(tmplRule, 'the template has the rule');
  put(dir, 'AGENTS.md', read(dir, 'AGENTS.md').split('\n').filter((l) => !l.startsWith('  - **Questions.** ')).join('\n'));
  fs.rmSync(path.join(dir, 'pan-harness', 'playbooks', 'questions.md'));
  put(dir, 'pan-harness/playbooks/large-task.md', read(dir, 'pan-harness/playbooks/large-task.md')
    .replace(/- each question in the form of `playbooks\/questions\.md` \(the `ph-grilling` skill writes it too\): options a\), b\), c\)/, '- each question in the `ph-grilling` format: options a/b/c'));
  put(dir, 'PAN-HARNESS.md', read(dir, 'PAN-HARNESS.md')
    .replace(/^- `playbooks\/questions\.md` — .*\n/m, '')
    .replace(/^Standard: pan-harness .*$/m, 'Standard: pan-harness 2.10.4'));
  const r = run('migrate.mjs', '--root', dir);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  for (const step of [1, 2, 3]) assert.match(r.stdout, new RegExp(`^done +2\\.10\\.5 step ${step}: `, 'm'));
  const agents = read(dir, 'AGENTS.md');
  assert.ok(agents.split('\n').includes(tmplRule), 'the rule is in AGENTS.md as the template has it');
  const rule = agents.split('\n').indexOf(tmplRule);
  assert.match(agents.split('\n')[rule - 1], /Where a word has several meanings|Short sentences, one idea per item/, 'the rule stands in the chat rule');
  assert.match(read(dir, 'pan-harness/playbooks/questions.md'), /^# Playbook: questions$/m);
  assert.match(read(dir, 'pan-harness/playbooks/large-task.md'), /form of `playbooks\/questions\.md`/);
  assert.match(read(dir, 'PAN-HARNESS.md'), /^- `playbooks\/questions\.md` — .+\(before .+\)\.$/m);
  assert.match(read(dir, 'PAN-HARNESS.md'), new RegExp(`^Standard: pan-harness ${VERSION.replace(/\./g, '\\.')}$`, 'm'));
  const again = run('migrate.mjs', '--root', dir);
  assert.ok(again.stdout.includes('0 by hand'), again.stdout);
  assert.equal(read(dir, 'AGENTS.md'), agents, 'a second run changes nothing');
});

const STANDARD_LINES = (text) => text.split('\n').filter((l) => l.startsWith('Standard: pan-harness ')).length;

test('migrate 2.9.4 -> current: one Standard line with its blank line, the delegation and questions map lines', () => {
  const dir = current();
  put(dir, 'PAN-HARNESS.md', read(dir, 'PAN-HARNESS.md')
    .replace(/^- `playbooks\/(delegation|questions)\.md` — .*\n/gm, '')
    .replace(/^Standard: pan-harness .*$/m, 'Standard: pan-harness 2.9.4'));
  const r = run('migrate.mjs', '--root', dir);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  const pan = read(dir, 'PAN-HARNESS.md');
  assert.equal(STANDARD_LINES(pan), 1, pan);
  assert.match(pan, new RegExp(`\\n\\nStandard: pan-harness ${VERSION.replace(/\./g, '\\.')}\\n?$`));
  assert.match(pan, /^- `playbooks\/delegation\.md` — /m);
  assert.match(pan, /^- `playbooks\/questions\.md` — /m);
});

test('migrate 2.10.4 -> 2.10.5: a chat rule that already has the ❓/➡️ form gets no second rule', () => {
  const dir = current();
  const own = '  - Ask in the ❓/➡️ form: several questions numbered, ➡️ one recommendation with its reason.';
  put(dir, 'AGENTS.md', read(dir, 'AGENTS.md').split('\n').map((l) => (l.startsWith('  - **Questions.** ') ? own : l)).join('\n'));
  put(dir, 'PAN-HARNESS.md', read(dir, 'PAN-HARNESS.md').replace(/^Standard: pan-harness .*$/m, 'Standard: pan-harness 2.10.4'));
  const r = run('migrate.mjs', '--root', dir);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /^by hand 2\.10\.5 step 1: AGENTS\.md: the chat rule already asks for the ❓\/➡️ form/m);
  assert.doesNotMatch(read(dir, 'AGENTS.md'), /^ {2}- \*\*Questions\.\*\* /m);
});

test('migrate 2.10.4 -> 2.10.5: the start set limit grows by the bytes the steps add, the size is printed', () => {
  const dir = current();
  const rule = read(dir, 'AGENTS.md').split('\n').find((l) => l.startsWith('  - **Questions.** '));
  const mapLine = read(dir, 'PAN-HARNESS.md').split('\n').find((l) => l.startsWith('- `playbooks/questions.md` — '));
  put(dir, 'AGENTS.md', read(dir, 'AGENTS.md').split('\n').filter((l) => l !== rule).join('\n'));
  put(dir, 'PAN-HARNESS.md', read(dir, 'PAN-HARNESS.md').replace(`${mapLine}\n`, '').replace(/^Standard: pan-harness .*$/m, 'Standard: pan-harness 2.10.4'));
  put(dir, 'pan-harness/project/check.json', read(dir, 'pan-harness/project/check.json').replace(/"start_limit_bytes": \d+/, '"start_limit_bytes": 20480'));
  const before = startSet(dir);
  const r = run('migrate.mjs', '--root', dir);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  const added = Buffer.byteLength(`${rule}\n${mapLine}\n`);
  assert.match(read(dir, 'pan-harness/project/check.json'), new RegExp(`"start_limit_bytes": ${20480 + added}`));
  assert.match(r.stdout, /^done +2\.10\.5 step 4: project\/check\.json: start_limit_bytes \d+ bytes higher for the question form$/m);
  assert.ok(r.stdout.includes(`start set: ${before} -> ${startSet(dir)} bytes (limit ${20480 + added})`), r.stdout);

  const over = current();
  put(over, 'pan-harness/project/check.json', read(over, 'pan-harness/project/check.json').replace(/"start_limit_bytes": \d+/, '"start_limit_bytes": 1000'));
  assert.match(run('migrate.mjs', '--root', over).stdout, /^by hand start set: \d+ bytes, over the limit 1000: /m);
});

test('migrate 2.10.5 -> current: the planning playbook makes the session title step 1 of every plan, once', () => {
  const dir = current();
  const tmpl = fs.readFileSync(path.join(SKILL, 'templates', 'pan-harness', 'playbooks', 'large-task.md.tmpl'), 'utf8').split('\n');
  const item = tmpl.find((l) => l.includes('`ph-rename-claude-session`'));
  assert.ok(item && tmpl[tmpl.indexOf(item) - 1].startsWith('- at the end, a short plan'), 'the item follows the plan item of Planning');
  assert.ok(!item.includes('"boshl') && !fs.readFileSync(path.join(SKILL, 'templates', 'AGENTS.md.tmpl'), 'utf8').includes('ph-rename-claude-session'), 'only the playbook names the step');
  const rel = 'pan-harness/playbooks/large-task.md';
  put(dir, rel, read(dir, rel).replace(`${item}\n`, ''));
  put(dir, 'PAN-HARNESS.md', read(dir, 'PAN-HARNESS.md').replace(/^Standard: pan-harness .*$/m, 'Standard: pan-harness 2.10.5'));
  const r = run('migrate.mjs', '--root', dir);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /^done +2\.10\.6 step 1: playbooks\/large-task\.md: step 1 of every plan retitles the session$/m);
  const lines = read(dir, rel).split('\n');
  assert.equal(lines.filter((l) => l === item).length, 1);
  assert.ok(lines[lines.indexOf(item) - 1].startsWith('- at the end, a short plan'));
  const again = run('migrate.mjs', '--root', dir);
  assert.ok(again.stdout.includes('0 by hand'), again.stdout);
  assert.equal(read(dir, rel), lines.join('\n'), 'a second run changes nothing');

  const own = current();
  put(own, rel, read(own, rel).replace(`${item}\n`, '').replace('- at the end, a short plan', '- finally, a short plan'));
  put(own, 'PAN-HARNESS.md', read(own, 'PAN-HARNESS.md').replace(/^Standard: pan-harness .*$/m, 'Standard: pan-harness 2.10.5'));
  assert.match(run('migrate.mjs', '--root', own).stdout, /^by hand 2\.10\.6 step 1: playbooks\/large-task\.md: no "at the end, a short plan" item in Planning/m);
});
test('ph-rename-claude-session has a short form for the session-title rule', () => {
  const text = fs.readFileSync(path.join(ROOT, 'skills', 'ph-rename-claude-session', 'SKILL.md'), 'utf8');
  assert.match(text, /^\*\*Short form\.\*\* When step 1 of a large task's plan runs this skill/m);
  assert.match(text.split('\n').find((l) => l.startsWith('description:')), /short form as step 1 of a large task's plan/);
});

test('migrate 2.9.4 -> current: a commit rule the step cannot place still gets the limit for its Agent: line', () => {
  const dir = current();
  const trailer = / End each commit message with the line `Agent: <your name>`[^.]*\./.exec(fs.readFileSync(path.join(SKILL, 'templates', 'AGENTS.md.tmpl'), 'utf8'))[0];
  put(dir, 'AGENTS.md', read(dir, 'AGENTS.md').replace(trailer, '').replace('only when files changed.', 'only when a file changed.'));
  put(dir, 'PAN-HARNESS.md', read(dir, 'PAN-HARNESS.md').replace(/^Standard: pan-harness .*$/m, 'Standard: pan-harness 2.9.4'));
  const r = run('migrate.mjs', '--root', dir);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /^by hand 2\.10\.4 step 3: AGENTS\.md: the commit rule is reworded/m);
  assert.match(read(dir, 'pan-harness/project/check.json'), new RegExp(`"start_limit_bytes": ${25600 + Buffer.byteLength(trailer)}`));
});
