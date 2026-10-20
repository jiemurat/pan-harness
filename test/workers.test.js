// workers.mjs (ph-workers and its sibling skills) on throwaway repos: a worker folder equals
// the main folder (ignored files and a nested repo included) and git sees it clean; a merged
// branch lets the worker take its next task in the same folder; unmerged work, the main-agent
// and a cloud-synced place are refused; the list keeps names, renames and states.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { tmpDir } from './tmp.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SCRIPT = path.join(ROOT, 'core', 'workers', 'workers.mjs');
const WIN = process.platform === 'win32';

// every commit, a submodule's too, has an author where git has no global identity (CI)
const GIT_ENV = { ...process.env, GIT_AUTHOR_NAME: 'Test', GIT_AUTHOR_EMAIL: 'test@example.com', GIT_COMMITTER_NAME: 'Test', GIT_COMMITTER_EMAIL: 'test@example.com' };
function git(dir, ...args) {
  const r = spawnSync('git', args, { cwd: dir, encoding: 'utf8', env: GIT_ENV });
  assert.equal(r.status, 0, `git ${args.join(' ')}: ${r.stderr}`);
  return r.stdout;
}
function init(dir) {
  fs.mkdirSync(dir, { recursive: true });
  git(dir, 'init', '-q', '-b', 'main');
  git(dir, 'config', 'user.name', 'Test');
  git(dir, 'config', 'user.email', 'test@example.com');
  git(dir, 'config', 'core.autocrlf', 'false');
}
function put(dir, rel, body) {
  fs.mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true });
  fs.writeFileSync(path.join(dir, rel), body);
}
const run = (...args) => spawnSync(process.execPath, [SCRIPT, ...args], { encoding: 'utf8', env: { ...process.env, WORKERS_COPY: 'plain' } });
function ok(...args) {
  const r = run(...args);
  assert.equal(r.status, 0, `${args.join(' ')}: ${r.stderr}${r.stdout}`);
  return r.stdout;
}
/** Files and folders under dir, without .git, '/' separated. */
function list(dir, rel = '') {
  const out = [];
  for (const e of fs.readdirSync(path.join(dir, rel), { withFileTypes: true })) {
    if (e.name === '.git') continue;
    const r = rel ? `${rel}/${e.name}` : e.name;
    out.push(r);
    if (e.isDirectory()) out.push(...list(dir, r));
  }
  return out.sort();
}
const dirty = (dir) => git(dir, 'status', '--porcelain').trim();

/** A project with an ignored skill folder, a nested ignored repo src/ and the list made. */
function project() {
  const base = tmpDir('ph-workers-');
  const root = path.join(base, 'proj');
  init(root);
  put(root, 'AGENTS.md', '# P\n\n- **Main-agent:** COOPER.\n');
  put(root, '.gitignore', '.claude/skills/\nsrc/\n');
  put(root, 'docs/a.md', 'a\n');
  put(root, '.claude/skills/ph-x/SKILL.md', 'skill\n');
  if (!WIN) fs.symlinkSync('a.md', path.join(root, 'docs', 'link.md'));
  init(path.join(root, 'src'));
  put(root, 'src/code.js', 'code\n');
  git(path.join(root, 'src'), 'add', '-A');
  git(path.join(root, 'src'), 'commit', '-qm', 'src');
  ok('init', '--root', root);
  git(root, 'add', '-A');
  git(root, 'commit', '-qm', 'init');
  return { root, workers: path.join(base, 'workers') };
}

test('init makes the list with the five preset workers; status names the main-agent', () => {
  const { root } = project();
  const text = fs.readFileSync(path.join(root, 'pan-harness', 'workers.md'), 'utf8');
  for (const name of ['TARS', 'CASE', 'PLEX', 'KIPP', 'WALLE']) assert.match(text, new RegExp(`^\\| ${name} \\| free \\|`, 'm'));
  assert.match(ok('status', '--root', root), /^main-agent: COOPER;/);
});

test('prepare: the worker folder equals the main folder and git sees it clean, nested repo too', () => {
  const { root, workers } = project();
  const out = ok('prepare', '--root', root, '--name', 'tars', '--task', 'doc-a', '--dir', workers, '--copy');
  const folder = path.join(workers, 'TARS');
  assert.match(out, /on branch tars\/doc-a \(plain copy, 1 nested repo\(s\)\)/);
  assert.match(out, /^BRIEF\nYou are TARS, a worker-agent/m);
  assert.deepEqual(list(folder), list(root));
  assert.equal(dirty(folder), '');
  assert.equal(dirty(path.join(folder, 'src')), '');
  assert.equal(git(path.join(folder, 'src'), 'branch', '--show-current').trim(), 'tars/doc-a');
  if (!WIN) assert.equal(fs.readlinkSync(path.join(folder, 'docs', 'link.md')), 'a.md');
  assert.match(fs.readFileSync(path.join(root, 'pan-harness', 'workers.md'), 'utf8'), /^\| TARS \| working \| doc-a \| `tars\/doc-a` \|/m);
});

test('prepare without --copy on a disk with no copy-on-write stops and names the size', () => {
  const { root, workers } = project();
  const r = run('prepare', '--root', root, '--name', 'TARS', '--task', 'x', '--dir', workers);
  assert.equal(r.status, 3);
  assert.match(r.stdout, /plain copy of [\d.]+ MB/);
  assert.equal(fs.existsSync(path.join(workers, 'TARS')), false);
});

test('next task: after the merge the worker takes a new branch in the same folder; unmerged work stops it', () => {
  const { root, workers } = project();
  ok('prepare', '--root', root, '--name', 'TARS', '--task', 'doc-a', '--dir', workers, '--copy');
  git(root, 'commit', '-qam', 'list');
  const folder = path.join(workers, 'TARS');
  put(folder, 'docs/b.md', 'b\n');
  git(folder, 'add', '-A');
  git(folder, 'commit', '-qm', 'b');
  const status = ok('status', '--root', root);
  assert.match(status, /repo: 1 commit\(s\) not in main, 0 uncommitted change\(s\)/);
  let r = run('prepare', '--root', root, '--name', 'TARS', '--task', 'doc-b');
  assert.equal(r.status, 1);
  assert.match(r.stderr, /tars\/doc-a is not merged into main/);
  git(root, 'merge', '-q', '--no-ff', '-m', 'merge', 'tars/doc-a');
  ok('prepare', '--root', root, '--name', 'TARS', '--task', 'doc-b');
  assert.equal(git(folder, 'branch', '--show-current').trim(), 'tars/doc-b');
  assert.equal(git(path.join(folder, 'src'), 'branch', '--show-current').trim(), 'tars/doc-b');
  r = run('prepare', '--root', root, '--name', 'TARS', '--task', 'doc-c');
  assert.match(r.stderr, /uncommitted changes - commit them first/);
});

test('status shows a conflict before the merge', () => {
  const { root, workers } = project();
  ok('prepare', '--root', root, '--name', 'CASE', '--task', 'doc', '--dir', workers, '--copy');
  const folder = path.join(workers, 'CASE');
  put(folder, 'docs/a.md', 'case\n');
  git(folder, 'commit', '-qam', 'case');
  put(root, 'docs/a.md', 'main\n');
  git(root, 'commit', '-qam', 'main');
  const out = ok('status', '--root', root);
  assert.match(out, /conflicts in docs\/a\.md|conflicts not checked/);
});

test('status shows when the branches of two workers will clash with each other', () => {
  const { root, workers } = project();
  for (const name of ['TARS', 'CASE']) {
    ok('prepare', '--root', root, '--name', name, '--task', 'idx', '--dir', workers, '--copy');
    git(root, 'commit', '-qam', `list ${name}`);
    const folder = path.join(workers, name);
    put(folder, 'docs/a.md', `${name}\n`);
    git(folder, 'commit', '-qam', name);
  }
  assert.match(ok('status', '--root', root), /^TARS and CASE: the second merge will conflict in docs\/a\.md$/m);
});

test('remove: the main-agent stays; unmerged work needs --force; merged work goes with its branches', () => {
  const { root, workers } = project();
  let r = run('remove', '--root', root, '--name', 'cooper');
  assert.equal(r.status, 1);
  assert.match(r.stderr, /COOPER is the main-agent; it stays/);
  ok('prepare', '--root', root, '--name', 'TARS', '--task', 'doc-a', '--dir', workers, '--copy');
  git(root, 'commit', '-qam', 'list');
  const folder = path.join(workers, 'TARS');
  put(folder, 'docs/b.md', 'b\n');
  git(folder, 'add', '-A');
  git(folder, 'commit', '-qm', 'b');
  r = run('remove', '--root', root, '--name', 'TARS');
  assert.equal(r.status, 3);
  assert.match(r.stdout, /\.: tars\/doc-a/);
  assert.ok(fs.existsSync(folder));
  git(root, 'merge', '-q', '--no-ff', '-m', 'merge', 'tars/doc-a');
  ok('remove', '--root', root, '--name', 'TARS', '--forget');
  assert.equal(fs.existsSync(folder), false);
  assert.equal(git(root, 'branch', '--list', 'tars/*').trim(), '');
  assert.equal(git(path.join(root, 'src'), 'branch', '--list', 'tars/*').trim(), '');
  assert.doesNotMatch(fs.readFileSync(path.join(root, 'pan-harness', 'workers.md'), 'utf8'), /\| TARS \|/);
});

test('a worker folder is never placed in a cloud-synced folder', () => {
  const { root, workers } = project();
  const r = run('prepare', '--root', root, '--name', 'TARS', '--task', 'x', '--dir', path.join(path.dirname(workers), 'Dropbox', 'w'), '--copy');
  assert.equal(r.status, 1);
  assert.match(r.stderr, /cloud-synced folder/);
  const marked = path.join(path.dirname(workers), 'sync');
  put(marked, '.dropbox', '{}');
  assert.match(run('prepare', '--root', root, '--name', 'TARS', '--task', 'x', '--dir', path.join(marked, 'w'), '--copy').stderr, /cloud-synced folder/);
});

test('add and rename: names stay unique; the main-agent is renamed in AGENTS.md', () => {
  const { root } = project();
  ok('add', '--root', root, '--name', 'MURPH');
  assert.equal(run('add', '--root', root, '--name', 'murph').status, 1);
  assert.equal(run('add', '--root', root, '--name', 'Cooper').status, 1);
  ok('rename', '--root', root, '--from', 'MURPH', '--to', 'MANN');
  ok('rename', '--root', root, '--from', 'COOPER', '--to', 'BRAND');
  assert.match(fs.readFileSync(path.join(root, 'AGENTS.md'), 'utf8'), /^- \*\*Main-agent:\*\* BRAND\.$/m);
  const text = fs.readFileSync(path.join(root, 'pan-harness', 'workers.md'), 'utf8');
  assert.match(text, /^\| MANN \| free \|/m);
  assert.doesNotMatch(text, /MURPH/);
  assert.equal(run('rename', '--root', root, '--from', 'TARS', '--to', 'BRAND').status, 1);
});

test('a submodule gets a worktree of its own at its commit; a commit in it goes to the owner; a broken git stops prepare', () => {
  const { root, workers } = project();
  const lib = path.join(path.dirname(root), 'lib');
  init(lib);
  put(lib, 'l.txt', 'l\n');
  git(lib, 'add', '-A');
  git(lib, 'commit', '-qm', 'lib');
  git(root, '-c', 'protocol.file.allow=always', 'submodule', 'add', '-q', lib, 'vendor/lib');
  git(root, 'commit', '-qm', 'submodule');
  assert.match(ok('prepare', '--root', root, '--name', 'TARS', '--task', 'sub', '--dir', workers, '--copy'), /\(plain copy, 1 nested repo\(s\), 1 submodule\(s\)\)/);
  git(root, 'commit', '-qam', 'list');
  const sub = path.join(workers, 'TARS', 'vendor', 'lib');
  assert.equal(fs.realpathSync.native(git(sub, 'rev-parse', '--show-toplevel').trim()), fs.realpathSync.native(sub));
  assert.equal(git(sub, 'rev-parse', 'HEAD'), git(path.join(root, 'vendor', 'lib'), 'rev-parse', 'HEAD'));
  assert.equal(dirty(sub), '');
  assert.equal(dirty(path.join(workers, 'TARS')), '');
  put(sub, 'l.txt', 'tars\n');
  git(sub, 'commit', '-qam', 'tars');
  assert.match(ok('status', '--root', root), /vendor\/lib \(submodule\): a commit inside the submodule - ask the owner/);
  let r = run('remove', '--root', root, '--name', 'TARS');
  assert.equal(r.status, 3);
  assert.match(r.stdout, /vendor\/lib: a commit inside the submodule/);
  ok('remove', '--root', root, '--name', 'TARS', '--force');
  assert.equal(fs.existsSync(path.join(workers, 'TARS')), false);
  assert.equal(git(path.join(root, 'vendor', 'lib'), 'worktree', 'list', '--porcelain').match(/^worktree /gm).length, 1);
  fs.rmSync(path.join(root, 'vendor', 'lib', '.git')); // a hidden file on Windows cannot be overwritten
  put(root, 'vendor/lib/.git', 'gitdir: ../nowhere\n');
  r = run('prepare', '--root', root, '--name', 'CASE', '--task', 'x', '--dir', workers, '--copy');
  assert.equal(r.status, 1);
  assert.match(r.stderr, /git status failed/);
});

test('a worker folder whose git is broken: status names it and goes on; remove --force cleans it', () => {
  const { root, workers } = project();
  ok('prepare', '--root', root, '--name', 'TARS', '--task', 'x', '--dir', workers, '--copy');
  git(root, 'commit', '-qam', 'list');
  fs.rmSync(path.join(workers, 'TARS', '.git')); // a hidden file on Windows cannot be overwritten
  put(workers, 'TARS/.git', 'gitdir: ../nowhere\n');
  const out = ok('status', '--root', root);
  assert.match(out, /^ {2}repo: git status failed/m);
  assert.match(out, /^CASE: free$/m);
  assert.equal(run('remove', '--root', root, '--name', 'TARS').status, 3);
  ok('remove', '--root', root, '--name', 'TARS', '--force');
  assert.equal(fs.existsSync(path.join(workers, 'TARS')), false);
  assert.equal(git(root, 'worktree', 'list', '--porcelain').match(/^worktree /gm).length, 1);
});

test('next task with a submodule: its worktree follows the main folder; work inside it stops the switch', () => {
  const { root, workers } = project();
  const lib = path.join(path.dirname(root), 'lib');
  init(lib);
  put(lib, 'l.txt', 'l\n');
  git(lib, 'add', '-A');
  git(lib, 'commit', '-qm', 'lib');
  git(root, '-c', 'protocol.file.allow=always', 'submodule', 'add', '-q', lib, 'vendor/lib');
  git(root, 'commit', '-qm', 'submodule');
  ok('prepare', '--root', root, '--name', 'TARS', '--task', 'a', '--dir', workers, '--copy');
  git(root, 'commit', '-qam', 'list');
  const main = path.join(root, 'vendor', 'lib');
  put(main, 'l.txt', 'main\n');
  git(main, 'commit', '-qam', 'main');
  git(root, 'commit', '-qam', 'bump');
  ok('prepare', '--root', root, '--name', 'TARS', '--task', 'b');
  const sub = path.join(workers, 'TARS', 'vendor', 'lib');
  assert.equal(git(sub, 'rev-parse', 'HEAD'), git(main, 'rev-parse', 'HEAD'));
  git(root, 'commit', '-qam', 'list b');
  git(root, 'merge', '-q', '--no-ff', '-m', 'merge', 'tars/b');
  put(sub, 'l.txt', 'tars\n');
  git(sub, 'commit', '-qam', 'tars');
  const r = run('prepare', '--root', root, '--name', 'TARS', '--task', 'c');
  assert.equal(r.status, 1);
  assert.match(r.stderr, /work inside the submodule vendor\/lib - ask the owner/);
});

test('on APFS (macOS) the worker folder is a copy-on-write copy', { skip: process.platform !== 'darwin' }, () => {
  const { root, workers } = project();
  const r = spawnSync(process.execPath, [SCRIPT, 'prepare', '--root', root, '--name', 'TARS', '--task', 'x', '--dir', workers], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /\(copy-on-write, 1 nested repo\(s\)\)/);
  assert.equal(dirty(path.join(workers, 'TARS')), '');
});
