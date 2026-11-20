// ph-nonstop tests: every cycle brief carries the charter's never-list word for word and says it binds
// the cycle session's own sub-agents (the brief template, the copy script, the step that runs it).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { tmpDir } from './tmp.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SKILL = path.join(ROOT, 'skills-src', 'ph-nonstop');
const CHARTER = path.join(SKILL, 'templates', 'charter.md');
const BRIEF = path.join(SKILL, 'templates', 'cycle-brief.md');
const SCRIPT = path.join(SKILL, 'scripts', 'never-list.mjs');

const read = (p) => fs.readFileSync(p, 'utf8');
const block = (text) => {
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  const start = lines.indexOf('<!-- never-list -->');
  const end = lines.indexOf('<!-- /never-list -->', start + 1);
  return start < 0 || end < 0 ? null : lines.slice(start, end + 1).join('\n');
};

function copy() {
  for (const p of [CHARTER, BRIEF, SCRIPT]) assert.ok(fs.existsSync(p), `missing ${path.relative(ROOT, p)}`);
  const dir = tmpDir('ph-nonstop-');
  const charter = path.join(dir, 'run-test.md');
  const brief = path.join(dir, 'brief-cycle.md');
  fs.copyFileSync(CHARTER, charter);
  fs.copyFileSync(BRIEF, brief);
  return { charter, brief };
}

const run = (charter, brief) => spawnSync(process.execPath, [SCRIPT, charter, brief], { encoding: 'utf8' });

test('the cycle brief template has the never-list slot and says the list binds the cycle session and its sub-agents', () => {
  assert.ok(fs.existsSync(BRIEF), 'the cycle brief template');
  const brief = read(BRIEF);
  assert.match(brief, /^\{\{never-list\}\}$/m);
  assert.match(brief, /it binds you and every sub-agent you start; put it word for word into each sub-agent's brief\./);
  const charter = read(CHARTER);
  assert.ok(block(charter), 'the charter template has the never-list markers');
  assert.match(block(charter), /not even by a script that prints nothing/);
});

test('never-list.mjs copies the charter never-list into the brief word for word, and a second run changes nothing', () => {
  const { charter, brief } = copy();
  const r = run(charter, brief);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  const filled = read(brief);
  assert.equal(block(filled), block(read(charter)));
  assert.doesNotMatch(filled, /\{\{never-list\}\}/);
  assert.equal(run(charter, brief).status, 0);
  assert.equal(read(brief), filled);
});

test('never-list.mjs fails when the brief list differs from the charter or the charter has none', () => {
  const { charter, brief } = copy();
  assert.equal(run(charter, brief).status, 0);
  fs.writeFileSync(brief, read(brief).replace('- Never touch', '- Never edit'));
  const changed = run(charter, brief);
  assert.equal(changed.status, 1);
  assert.match(changed.stderr, /differs from the charter/);
  fs.writeFileSync(charter, read(charter).replace('<!-- never-list -->', ''));
  assert.equal(run(charter, brief).status, 1);
});

test('the ph-nonstop loop runs never-list.mjs in its brief step, with the exit code as the end condition', () => {
  const skill = read(path.join(SKILL, 'SKILL.md'));
  const step = /^2\. \*\*Brief\.\*\* (.*)$/m.exec(skill);
  assert.ok(step, 'the Brief step');
  assert.ok(step[1].includes('`node <skill>/scripts/never-list.mjs pan-harness/project/run-<name>.md pan-harness/brief-cycle.md`'));
  assert.ok(step[1].endsWith('Done when it exits 0.'));
});

test('the cycle brief template names no backticked path of a file the cycle makes later, and names the history tag and the usage-limit tool', () => {
  const brief = read(BRIEF);
  // the harness check fails on a backticked path that does not exist yet (the "(new)" mark works only in handoff files)
  assert.doesNotMatch(brief, /`pan-harness\/handoff-cycle-/);
  assert.match(brief, /^- \*\*History tag:\*\* <one tag of the runbook's Topic tags line>/m);
  assert.match(brief, /`mcp__ccd_session_mgmt__get_usage`.*ToolSearch/);
});

test('the charter lives in pan-harness/project/, its map line is added at Start and the finished charter moves to archive/', () => {
  const skill = read(path.join(SKILL, 'SKILL.md'));
  const all = [skill, read(BRIEF), read(CHARTER)].join('\n');
  assert.doesNotMatch(all, /pan-harness\/run-/, 'no path next to the standard files');
  assert.match(skill, /`pan-harness\/project\/run-<name>\.md`/);
  assert.match(skill, /the Map's `project\/` list: ``- `project\/run-<name>\.md` — /);
  assert.match(skill, /`git mv pan-harness\/project\/run-<name>\.md pan-harness\/archive\/run-<name>\.md`/);
  assert.match(skill, /delete the map line/);
});

test('every journal line takes its time from `date`', () => {
  const skill = read(path.join(SKILL, 'SKILL.md'));
  assert.match(/^6\. \*\*Journal\.\*\* (.*)$/m.exec(skill)[1], /`date '\+%Y-%m-%d %H:%M'`/);
  assert.match(read(CHARTER), /Journal line:\*\*.*`date '\+%Y-%m-%d %H:%M'`/);
});
