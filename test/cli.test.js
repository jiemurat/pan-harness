// CLI tests: init, update, remove and status in throwaway project folders.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CLI = path.join(ROOT, 'cli', 'pan-harness.js');
const VERSION = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8')).version;
const SKILLS = fs.readdirSync(path.join(ROOT, 'skills')).filter((n) => n.startsWith('ph-')).sort();

function project() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'ph-cli-'));
}

function runEnv(dir, env, ...args) {
  const r = spawnSync(process.execPath, [CLI, ...args], { cwd: dir, encoding: 'utf8', env: { ...process.env, PH_OFFLINE: '1', ...env }, input: '' });
  return { code: r.status, out: r.stdout + r.stderr };
}

const run = (dir, ...args) => runEnv(dir, {}, ...args);
const hasGit = spawnSync('git', ['--version']).status === 0;
const noLinks = process.platform === 'win32' && 'symbolic links need extra rights on Windows';

const exists = (dir, rel) => fs.existsSync(path.join(dir, rel));
const read = (dir, rel) => fs.readFileSync(path.join(dir, rel), 'utf8');
const manifest = (dir, base = '.agents/skills') => JSON.parse(read(dir, `${base}/.pan-harness.json`));

test('the package ships the four ph-* skills', () => {
  assert.deepEqual(SKILLS, ['ph-doctor', 'ph-grilling', 'ph-init', 'ph-update', 'ph-writing-for-agents']);
});

test('init installs into .agents/skills and .claude/skills, writes commands, manifest and .gitignore', () => {
  const dir = project();
  const r = run(dir, 'init');
  assert.equal(r.code, 0, r.out);
  for (const s of SKILLS) {
    assert.ok(exists(dir, `.agents/skills/${s}/SKILL.md`), s);
    assert.ok(exists(dir, `.claude/skills/${s}/SKILL.md`), s);
    assert.ok(exists(dir, `.gemini/commands/${s}.toml`), s);
    assert.ok(exists(dir, `.opencode/commands/${s}.md`), s);
  }
  assert.ok(exists(dir, '.agents/skills/ph-init/references/init.md'));
  const m = manifest(dir);
  assert.equal(m.version, VERSION);
  assert.deepEqual(m.targets, ['agents', 'claude']);
  const ignore = read(dir, '.gitignore');
  for (const line of ['.agents/skills/ph-*/', '.claude/skills/ph-*/', '.agents/skills/.pan-harness.json', '.gemini/commands/ph-*.toml', '.opencode/commands/ph-*.md']) {
    assert.ok(ignore.includes(line), line);
  }
  assert.match(r.out, /\/ph-init/);
  assert.match(r.out, /\$ph-init/);
  assert.match(read(dir, '.gemini/commands/ph-init.toml'), /\{\{args\}\}/);
  assert.match(read(dir, '.opencode/commands/ph-init.md'), /\$ARGUMENTS/);
});

test('init again says the skills are already there and changes nothing', () => {
  const dir = project();
  run(dir, 'init');
  const before = read(dir, '.agents/skills/.pan-harness.json');
  const r = run(dir, 'init');
  assert.equal(r.code, 0);
  assert.match(r.out, /already installed/);
  assert.equal(read(dir, '.agents/skills/.pan-harness.json'), before);
});

test('init keeps the existing .gitignore lines and does not repeat its block', () => {
  const dir = project();
  fs.writeFileSync(path.join(dir, '.gitignore'), 'node_modules/\n');
  run(dir, 'init');
  run(dir, 'update', '--yes');
  const ignore = read(dir, '.gitignore');
  assert.ok(ignore.startsWith('node_modules/\n'));
  assert.equal(ignore.split('>>> pan-harness tools').length, 2);
});

test('--agents claude installs only for Claude Code, without command files', () => {
  const dir = project();
  const r = run(dir, 'init', '--agents', 'claude');
  assert.equal(r.code, 0, r.out);
  assert.ok(exists(dir, '.claude/skills/ph-init/SKILL.md'));
  assert.ok(!exists(dir, '.agents'));
  assert.ok(!exists(dir, '.gemini'));
  assert.ok(exists(dir, '.claude/skills/.pan-harness.json'));
  assert.ok(!read(dir, '.gitignore').includes('.agents/'));
});

test('agent names map to their folders and an unknown agent is a usage error', () => {
  const dir = project();
  assert.equal(run(dir, 'init', '--agents', 'cursor,claude-code', '--no-commands').code, 0);
  const agy = project();
  assert.equal(run(agy, 'init', '--agents', 'antigravity', '--no-commands').code, 0);
  assert.ok(exists(agy, '.agents/skills/ph-init/SKILL.md'));
  assert.ok(!exists(agy, '.agent'));
  assert.ok(exists(dir, '.agents/skills/ph-init/SKILL.md'));
  assert.ok(exists(dir, '.claude/skills/ph-init/SKILL.md'));
  assert.ok(!exists(dir, '.gemini'));
  assert.equal(run(project(), 'init', '--agents', 'nosuch').code, 2);
});

test('--dry-run writes nothing', () => {
  const dir = project();
  const r = run(dir, 'init', '--dry-run');
  assert.equal(r.code, 0, r.out);
  assert.deepEqual(fs.readdirSync(dir), []);
});

test('a ph-* folder pan-harness did not write is not overwritten without --yes', () => {
  const dir = project();
  fs.mkdirSync(path.join(dir, '.claude/skills/ph-init'), { recursive: true });
  fs.writeFileSync(path.join(dir, '.claude/skills/ph-init/SKILL.md'), 'mine\n');
  const r = run(dir, 'init');
  assert.equal(r.code, 3, r.out);
  assert.equal(read(dir, '.claude/skills/ph-init/SKILL.md'), 'mine\n');
  assert.equal(run(dir, 'init', '--yes').code, 0);
  assert.notEqual(read(dir, '.claude/skills/ph-init/SKILL.md'), 'mine\n');
});

test('update: up to date, then a file changed by hand stops it (exit 3) until --yes', () => {
  const dir = project();
  run(dir, 'init');
  assert.match(run(dir, 'update').out, /up to date/);
  fs.appendFileSync(path.join(dir, '.claude/skills/ph-init/SKILL.md'), 'local edit\n');
  const r = run(dir, 'update');
  assert.equal(r.code, 3, r.out);
  assert.match(r.out, /\.claude\/skills\/ph-init\/SKILL\.md/);
  assert.ok(read(dir, '.claude/skills/ph-init/SKILL.md').endsWith('local edit\n'));
  assert.equal(run(dir, 'update', '--yes').code, 0);
  assert.ok(!read(dir, '.claude/skills/ph-init/SKILL.md').includes('local edit'));
});

test('update from an older version replaces the files and drops ones the new version no longer has', () => {
  const dir = project();
  run(dir, 'init');
  const mfile = path.join(dir, '.agents/skills/.pan-harness.json');
  const m = JSON.parse(fs.readFileSync(mfile, 'utf8'));
  m.version = '0.9.0';
  const stale = '.agents/skills/ph-init/references/old-file.md';
  fs.writeFileSync(path.join(dir, stale), 'old\n');
  m.files[stale] = '5d41402abc4b2a76b9719d911017c592ccf9e1d58df3a8d8e5b4d7e5a1c66d7d'; // not the real hash: changed by hand
  fs.writeFileSync(mfile, JSON.stringify(m));
  const r = run(dir, 'update', '--yes');
  assert.equal(r.code, 0, r.out);
  assert.match(r.out, /0\.9\.0 -> /);
  assert.match(r.out, /ph-update\/references\/changelog\.md/);
  assert.ok(!exists(dir, stale));
  assert.equal(manifest(dir).version, VERSION);
});

test('update without an installation points to init', () => {
  const r = run(project(), 'update');
  assert.equal(r.code, 1);
  assert.match(r.out, /init/);
});

test('remove deletes the tools, their folders and the .gitignore block, and keeps other skills', () => {
  const dir = project();
  fs.writeFileSync(path.join(dir, '.gitignore'), 'dist/\n');
  fs.mkdirSync(path.join(dir, '.claude/skills/my-skill'), { recursive: true });
  fs.writeFileSync(path.join(dir, '.claude/skills/my-skill/SKILL.md'), '---\nname: my-skill\ndescription: x\n---\n');
  run(dir, 'init');
  const r = run(dir, 'remove');
  assert.equal(r.code, 0, r.out);
  assert.equal(read(dir, '.gitignore'), 'dist/\n');
  assert.ok(exists(dir, '.claude/skills/my-skill/SKILL.md'));
  assert.ok(!exists(dir, '.claude/skills/ph-init'));
  assert.ok(!exists(dir, '.agents'));
  assert.ok(!exists(dir, '.gemini'));
  assert.ok(!exists(dir, '.opencode'));
});

test('remove deletes a .gitignore that held only the block', () => {
  const dir = project();
  run(dir, 'init');
  run(dir, 'remove');
  assert.deepEqual(fs.readdirSync(dir), []);
});

test('status reports the version and files changed by hand', () => {
  const dir = project();
  assert.match(run(dir, 'status').out, /not installed/);
  run(dir, 'init');
  assert.match(run(dir, 'status').out, new RegExp(`${VERSION.replace(/\./g, '\\.')} installed`));
  fs.appendFileSync(path.join(dir, '.agents/skills/ph-doctor/SKILL.md'), 'x\n');
  assert.match(run(dir, 'status').out, /Changed by hand: 1 file/);
});

test('help, version and an unknown command', () => {
  const dir = project();
  assert.match(run(dir, '--help').out, /Usage: npx @jiemurat\/pan-harness@latest/);
  assert.equal(run(dir, '--version').out.trim(), VERSION);
  assert.equal(run(dir, 'nosuch').code, 2);
});

test('a manifest path outside the skill folders is refused and nothing is deleted', () => {
  const dir = project();
  run(dir, 'init');
  const victim = path.join(path.dirname(dir), `ph-victim-${path.basename(dir)}.txt`);
  fs.writeFileSync(victim, 'keep\n');
  const mfile = path.join(dir, '.agents/skills/.pan-harness.json');
  const m = JSON.parse(fs.readFileSync(mfile, 'utf8'));
  m.files[`../${path.basename(victim)}`] = 'x';
  fs.writeFileSync(mfile, JSON.stringify(m));
  for (const cmd of ['remove', 'update']) {
    const r = run(dir, cmd, '--yes');
    assert.equal(r.code, 1, r.out);
    assert.match(r.out, /outside the skill and command folders/);
  }
  assert.equal(fs.readFileSync(victim, 'utf8'), 'keep\n');
  assert.ok(exists(dir, '.agents/skills/ph-init/SKILL.md'));
});

test('a damaged manifest gives a clear error', () => {
  const dir = project();
  run(dir, 'init');
  fs.writeFileSync(path.join(dir, '.agents/skills/.pan-harness.json'), '{bad');
  const r = run(dir, 'status');
  assert.equal(r.code, 1);
  assert.match(r.out, /\.pan-harness\.json is not valid JSON .* init --yes/);
});

test('update does not go back to an older version without --yes', () => {
  const dir = project();
  run(dir, 'init');
  const mfile = path.join(dir, '.agents/skills/.pan-harness.json');
  const m = JSON.parse(fs.readFileSync(mfile, 'utf8'));
  m.version = '99.0.0';
  fs.writeFileSync(mfile, JSON.stringify(m));
  const r = run(dir, 'update');
  assert.equal(r.code, 1, r.out);
  assert.match(r.out, /newer than this pan-harness/);
  assert.equal(manifest(dir).version, '99.0.0');
  assert.match(run(dir, 'init').out, /newer than this/);
  assert.equal(run(dir, 'update', '--yes').code, 0);
  assert.equal(manifest(dir).version, VERSION);
});

test('update --agents installs the skills for another set of agents', () => {
  const dir = project();
  run(dir, 'init');
  assert.match(run(dir, 'init', '--agents', 'claude,windsurf').out, /update --agents claude,windsurf/);
  let r = run(dir, 'update', '--agents', 'agents,claude,windsurf');
  assert.equal(r.code, 0, r.out);
  assert.match(r.out, /Reinstalled/);
  assert.ok(exists(dir, '.windsurf/skills/ph-init/SKILL.md'));
  assert.deepEqual(manifest(dir).targets, ['agents', 'claude', 'windsurf']);
  r = run(dir, 'update', '--agents', 'claude');
  assert.equal(r.code, 0, r.out);
  for (const gone of ['.agents', '.gemini', '.opencode', '.windsurf']) assert.ok(!exists(dir, gone), gone);
  assert.ok(exists(dir, '.claude/skills/ph-init/SKILL.md'));
  assert.deepEqual(manifest(dir, '.claude/skills').targets, ['claude']);
  assert.ok(!read(dir, '.gitignore').includes('.agents/'));
  assert.match(run(dir, 'update', '--agents', 'claude').out, /up to date/);
});

test('a folder that does not exist is a usage error and is not created', () => {
  const dir = project();
  const r = run(dir, 'init', '--dir', path.join(dir, 'no', 'such'));
  assert.equal(r.code, 2, r.out);
  assert.match(r.out, /no such folder/);
  assert.ok(!exists(dir, 'no'));
});

test('the home folder needs --yes', () => {
  const home = project();
  const env = { HOME: home, USERPROFILE: home };
  const r = runEnv(home, env, 'init');
  assert.equal(r.code, 2, r.out);
  assert.match(r.out, /home folder/);
  assert.ok(!exists(home, '.claude'));
  assert.equal(runEnv(home, env, 'init', '--yes').code, 0);
});

test('init in a subfolder of a git repository points to the repository root', { skip: !hasGit && 'git is missing' }, () => {
  const top = project();
  spawnSync('git', ['init', '-q'], { cwd: top });
  fs.mkdirSync(path.join(top, 'sub'));
  const r = run(path.join(top, 'sub'), 'init');
  assert.equal(r.code, 0, r.out);
  assert.match(r.out, /inside the git repository/);
  assert.doesNotMatch(run(project(), 'init').out, /inside the git repository/);
});

test('a .gitignore with CRLF line endings keeps them', () => {
  const dir = project();
  const original = 'node_modules/\r\ndist/\r\n';
  fs.writeFileSync(path.join(dir, '.gitignore'), original);
  run(dir, 'init');
  const text = read(dir, '.gitignore');
  assert.ok(!/(^|[^\r])\n/.test(text), JSON.stringify(text.slice(0, 80)));
  run(dir, 'remove');
  assert.equal(read(dir, '.gitignore'), original);
});

test('a linked skill file is replaced, never written through', { skip: noLinks }, () => {
  const dir = project();
  const outside = path.join(path.dirname(dir), `ph-outside-${path.basename(dir)}.md`);
  fs.writeFileSync(outside, 'mine\n');
  fs.mkdirSync(path.join(dir, '.claude/skills/ph-init'), { recursive: true });
  fs.symlinkSync(outside, path.join(dir, '.claude/skills/ph-init/SKILL.md'));
  assert.equal(run(dir, 'init', '--yes').code, 0);
  assert.equal(fs.readFileSync(outside, 'utf8'), 'mine\n');
  assert.ok(!fs.lstatSync(path.join(dir, '.claude/skills/ph-init/SKILL.md')).isSymbolicLink());
});

test('a skill folder that links out of the project stops the install before any file is written', { skip: noLinks }, () => {
  const dir = project();
  const outside = fs.mkdtempSync(path.join(os.tmpdir(), 'ph-outside-'));
  fs.mkdirSync(path.join(dir, '.claude/skills'), { recursive: true });
  fs.symlinkSync(outside, path.join(dir, '.claude/skills/ph-init'), 'dir');
  const r = run(dir, 'init', '--yes');
  assert.equal(r.code, 1, r.out);
  assert.match(r.out, /leads outside the project/);
  assert.deepEqual(fs.readdirSync(outside), []);
  assert.ok(!exists(dir, '.agents'));
});
