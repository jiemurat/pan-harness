// Build and validation tests: the generated skills match their sources and the
// Agent Skills specification.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { buildAll } from '../scripts/build.js';
import { validateSkill } from '../scripts/validate.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const VERSION = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8')).version;

test('the committed skills/ is a fresh build of skills-src/ and core/', () => {
  const r = spawnSync(process.execPath, [path.join(ROOT, 'scripts', 'build.js'), '--check'], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stdout + r.stderr);
});

test('includes are resolved and the version is filled in', () => {
  const built = buildAll();
  for (const [name, files] of built) {
    const skill = files.get('SKILL.md').toString('utf8');
    assert.ok(!skill.includes('<!-- include:'), name);
    assert.ok(!skill.includes('{{version}}'), name);
    assert.ok(skill.includes(`version: "${VERSION}"`), name);
  }
  assert.ok(built.get('ph-init').has('references/init.md'));
  assert.ok(built.get('ph-update').has('references/changelog.md'));
  assert.ok(built.get('ph-grilling').has('LICENSE'));
  assert.ok(!built.get('ph-grilling').has('references/init.md'));
});

test('every shipped skill passes the specification checks', () => {
  for (const name of fs.readdirSync(path.join(ROOT, 'skills'))) {
    const r = validateSkill(path.join(ROOT, 'skills', name));
    assert.deepEqual(r.errors, [], name);
  }
});

function fakeSkill(name, frontmatter) {
  const dir = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'ph-val-')), name);
  fs.mkdirSync(dir);
  fs.writeFileSync(path.join(dir, 'SKILL.md'), `---\n${frontmatter}\n---\nbody\n`);
  return dir;
}

test('the validator catches what the specification forbids', () => {
  const cases = [
    ['ph-x', 'name: ph-y\ndescription: d', /does not match the folder/],
    ['Bad_Name', 'name: Bad_Name\ndescription: d', /lowercase letters/],
    ['ph--x', 'name: ph--x\ndescription: d', /single hyphens/],
    ['ph-x', 'name: ph-x', /description is missing/],
    ['ph-x', `name: ph-x\ndescription: ${'a'.repeat(1025)}`, /max 1024/],
    ['ph-x', 'name: ph-x\ndescription: d\nuser-invocable: false', /not in the specification/],
  ];
  for (const [folder, fm, want] of cases) {
    const r = validateSkill(fakeSkill(folder, fm));
    assert.ok(r.errors.some((e) => want.test(e)), `${fm} -> ${r.errors.join('; ')}`);
  }
  assert.deepEqual(validateSkill(fakeSkill('ph-ok', 'name: ph-ok\ndescription: fine\nmetadata:\n  version: "1"')).errors, []);
});

test('the repository is a valid Claude Code plugin: version, default skills/ layout, no top-level bin/', () => {
  const plugin = JSON.parse(fs.readFileSync(path.join(ROOT, '.claude-plugin', 'plugin.json'), 'utf8'));
  assert.equal(plugin.version, VERSION);
  // Claude Code scans skills/ itself; a "skills" list would add the same folders a second time
  assert.equal(plugin.skills, undefined);
  assert.deepEqual(fs.readdirSync(path.join(ROOT, 'skills')).filter((n) => n.startsWith('ph-')).sort(),
    ['ph-doctor', 'ph-grilling', 'ph-init', 'ph-update']);
  // a plugin with a top-level bin/ is not installed by claude.ai and Cowork, and bin/ goes on the Bash PATH
  assert.ok(!fs.existsSync(path.join(ROOT, 'bin')));
  const market = JSON.parse(fs.readFileSync(path.join(ROOT, '.claude-plugin', 'marketplace.json'), 'utf8'));
  assert.equal(market.plugins[0].name, plugin.name);
});

test('the P26 writing rules carry the same names in principles.md, structure.md and the runbook template', () => {
  const names = ['Context pointer', 'Progressive disclosure va co-location', 'Completion criterion', 'Positive form',
    'Leading word', 'Single source', 'Manba', 'No-op'];
  const read = (rel) => fs.readFileSync(path.join(ROOT, 'core', rel), 'utf8');
  const writing = read('references/structure.md').split('## Writing\n')[1].split('\n## ')[0];
  const runbook = read('templates/pan-harness/runbook.md.tmpl').split('## 4. Writing the harness\n')[1].split('\n## ')[0];
  const p26 = read('references/principles.md').split('**P26.')[1].split('\n## ')[0];
  for (const n of names) {
    assert.ok(p26.includes(`**${n}.**`), `principles.md P26: ${n}`);
    assert.ok(writing.includes(`**${n}.**`), `structure.md Writing: ${n}`);
    assert.ok(runbook.includes(`**${n}:**`), `runbook.md.tmpl Writing the harness: ${n}`);
  }
});
