#!/usr/bin/env node
/*
workers.mjs - the worker-agents of a project: the list in pan-harness/workers.md and the
folder of each worker. Part of @jiemurat/pan-harness: it runs from the skill folder of
ph-workers, ph-create-worker, ph-merge-work and ph-delete-worker. Node 18 or newer, no
dependencies.

Usage:
  node <skill>/workers/workers.mjs <command> --root <project> [options]

Commands:
  init                      make pan-harness/workers.md with the five preset workers
  status                    each worker: state, folder, branch, commits to merge, conflicts with
                            the base branch and between the branches that wait for a merge
  add --name N              a new worker row
  rename --from A --to B    rename a worker (when it has no folder) or the main-agent
  prepare --name N --task T a folder for the worker's next task on branch <n>/<T>:
                            a new one (a git worktree filled with copy-on-write copies of
                            the main folder, untracked and ignored files included; a submodule
                            gets a worktree at its commit), or the worker's folder switched to a
                            new branch; prints the brief
          [--dir D]         the parent of the worker folders (default ~/pan-workers/<project>)
          [--copy]          allow a plain copy where the disk cannot copy-on-write
  record --name N [--status S] [--task T] [--session ID]
                            change fields of a worker row
  remove --name N [--forget] [--force]
                            remove the worker's folder and its merged branches; --forget
                            also removes the row; --force removes unmerged work too

The main-agent is named in AGENTS.md ("- **Main-agent:** NAME."); no command removes it or
its folder. A worker folder is never placed in a cloud-synced folder (Dropbox, iCloud,
OneDrive, Google Drive): a sync service would upload every copy in full.
*/
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const PRESET = ['TARS', 'CASE', 'PLEX', 'KIPP', 'WALLE'];
const STATES = ['free', 'working', 'review'];
const COLUMNS = ['Name', 'Status', 'Task', 'Branch', 'Folder', 'Session'];
const LIST = 'pan-harness/workers.md';
const CLOUD = [/[\\/]Dropbox( \([^\\/]*\))?([\\/]|$)/i, /[\\/]Library[\\/]CloudStorage[\\/]/, /[\\/]Library[\\/]Mobile Documents[\\/]/,
  /[\\/]OneDrive( - [^\\/]*)?([\\/]|$)/i, /[\\/]Google ?Drive([\\/]|$)/i, /[\\/]iCloud ?Drive([\\/]|$)/i];

function fail(message, code = 1) {
  console.error(`workers: ${message}`);
  process.exit(code);
}

function args(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) out._.push(a);
    else if (['--copy', '--forget', '--force'].includes(a)) out[a.slice(2)] = true;
    else if (i + 1 < argv.length) out[a.slice(2)] = argv[++i];
    else fail(`${a} needs a value`, 2);
  }
  return out;
}

function git(dir, ...a) {
  return spawnSync('git', a, { cwd: dir, encoding: 'utf8' });
}
function gitOk(dir, ...a) {
  const r = git(dir, ...a);
  if (r.status !== 0) fail(`git ${a.join(' ')} in ${dir}: ${(r.stderr || r.stdout).trim()}`);
  return r.stdout;
}

// ---- the list ---------------------------------------------------------------------------

function mainAgent(root) {
  const file = path.join(root, 'AGENTS.md');
  const m = fs.existsSync(file) && /^- \*\*Main-agent:\*\* ([A-Za-z][\w-]*)/m.exec(fs.readFileSync(file, 'utf8'));
  return m ? m[1] : 'COOPER';
}

function readList(root) {
  const file = path.join(root, LIST);
  if (!fs.existsSync(file)) fail(`${LIST} not found - run: init --root <project>`);
  const text = fs.readFileSync(file, 'utf8');
  const rows = [];
  for (const line of text.split('\n')) {
    const cells = line.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
    if (!line.trim().startsWith('|') || cells[0] === COLUMNS[0] || /^-+$/.test(cells[0])) continue;
    const row = {};
    COLUMNS.forEach((c, i) => { row[c] = (cells[i] || '—').replace(/^`|`$/g, ''); });
    rows.push(row);
  }
  return { text, rows };
}

function writeList(root, rows, text) {
  const cell = (c, v) => (v === '—' || !['Branch', 'Folder', 'Session'].includes(c) ? v : `\`${v}\``);
  const table = [`| ${COLUMNS.join(' | ')} |`, `|${COLUMNS.map(() => '---').join('|')}|`,
    ...rows.map((r) => `| ${COLUMNS.map((c) => cell(c, r[c])).join(' | ')} |`)];
  const lines = text.replace(/\n$/, '').split('\n');
  const start = lines.findIndex((l) => l.startsWith('| Name |'));
  if (start < 0) fail(`${LIST} has no table starting with "| Name |"`);
  let end = start;
  while (end < lines.length && lines[end].startsWith('|')) end++;
  lines.splice(start, end - start, ...table);
  fs.writeFileSync(path.join(root, LIST), `${lines.join('\n')}\n`);
}

function findRow(rows, name) {
  return rows.find((r) => r.Name.toLowerCase() === String(name).toLowerCase());
}

function checkName(name) {
  if (!/^[A-Za-z][A-Za-z0-9-]{0,23}$/.test(name || '')) fail(`a name is a letter, then letters, digits or '-', up to 24: ${name}`, 2);
}

// ---- folders ----------------------------------------------------------------------------

/** The folder named in a row: `~/...` is the home folder. */
function expand(p) {
  return p.startsWith('~/') ? path.join(os.homedir(), p.slice(2)) : p;
}
function shorten(p) {
  const home = os.homedir();
  return p.startsWith(home + path.sep) ? `~/${path.relative(home, p).split(path.sep).join('/')}` : p;
}

function isFile(p) {
  try {
    return fs.statSync(p).isFile();
  } catch {
    return false;
  }
}

function cloudSynced(p) {
  if (CLOUD.some((re) => re.test(p))) return true;
  for (let dir = p; ; dir = path.dirname(dir)) {
    if (isFile(path.join(dir, '.dropbox')) || fs.existsSync(path.join(dir, '.dropbox.cache'))) return true; // a Dropbox root
    if (path.dirname(dir) === dir) return false;
  }
}

/** Ignored or untracked folders of a repo that hold a git repository of their own. */
function nestedRepos(dir) {
  const out = [];
  for (const flags of [['--ignored', '--exclude-standard'], ['--exclude-standard']]) {
    const r = git(dir, 'ls-files', '--others', '--directory', ...flags);
    for (const rel of r.stdout.split('\n').map((s) => s.replace(/\/$/, '')).filter(Boolean)) {
      if (!out.includes(rel) && fs.existsSync(path.join(dir, rel, '.git'))) out.push(rel);
    }
  }
  return out.sort();
}

/** Checked-out submodules of a repo: tracked gitlinks whose folder holds a .git. */
function submodules(dir) {
  return git(dir, 'ls-files', '-s', '-z').stdout.split('\0').filter((l) => l.startsWith('160000 '))
    .map((l) => l.split('\t')[1]).filter((rel) => fs.existsSync(path.join(dir, rel, '.git')));
}

function sizeOf(p) {
  const st = fs.lstatSync(p);
  if (!st.isDirectory()) return st.size;
  let sum = 0;
  for (const e of fs.readdirSync(p)) if (e !== '.git') sum += sizeOf(path.join(p, e));
  return sum;
}

/** 'clone' when the disk can copy-on-write from src to the folder dst, else 'plain'. */
function copyMethod(sample, dst) {
  if (process.env.WORKERS_COPY === 'plain') return 'plain'; // the tests of the plain path
  if (process.platform !== 'darwin' && process.platform !== 'linux') return 'plain';
  const probe = path.join(dst, '.workers-probe');
  const r = process.platform === 'darwin'
    ? spawnSync('cp', ['-c', sample, probe]) : spawnSync('cp', ['--reflink=always', sample, probe]);
  fs.rmSync(probe, { force: true });
  return r.status === 0 ? 'clone' : 'plain';
}

function copyEntry(src, dst, method) {
  if (method === 'clone') {
    const r = process.platform === 'darwin'
      ? spawnSync('cp', ['-c', '-R', '-p', src, dst], { encoding: 'utf8' })
      : spawnSync('cp', ['-a', '--reflink=always', src, dst], { encoding: 'utf8' });
    if (r.status !== 0) fail(`cp ${src}: ${r.stderr.trim()}`);
  } else {
    fs.cpSync(src, dst, { recursive: true, verbatimSymlinks: true, preserveTimestamps: true });
  }
}

/** Fill the worktree dst with the files of src: every entry but .git; a nested repo or a submodule becomes a worktree of its own. */
function fill(src, dst, branch, method, made) {
  const nested = nestedRepos(src);
  const subs = submodules(src);
  const rec = (rel) => {
    for (const entry of fs.readdirSync(path.join(src, rel))) {
      const r = rel ? `${rel}/${entry}` : entry;
      if (r === '.git') continue;
      if (nested.includes(r)) addWorktree(path.join(src, r), path.join(dst, r), branch, method, made);
      else if (subs.includes(r)) addSubmodule(path.join(src, r), path.join(dst, r), branch, method, made);
      else if ([...nested, ...subs].some((n) => n.startsWith(`${r}/`))) {
        fs.mkdirSync(path.join(dst, r), { recursive: true });
        rec(r);
      } else copyEntry(path.join(src, r), path.join(dst, r), method);
    }
  };
  rec('');
}

function addWorktree(src, dst, branch, method, made) {
  const base = currentBranch(src);
  gitOk(src, 'worktree', 'add', '-q', '--no-checkout', '-b', branch, dst, base);
  made.push({ repo: src, folder: dst, base });
  fill(src, dst, branch, method, made);
  gitOk(dst, 'reset', '-q');
}

/** A submodule: a worktree at its commit, detached; the main-agent moves it, a worker's commit there goes to the owner. */
function addSubmodule(src, dst, branch, method, made) {
  const head = gitOk(src, 'rev-parse', 'HEAD').trim();
  gitOk(src, 'worktree', 'add', '-q', '--no-checkout', '--detach', dst, head);
  made.push({ repo: src, folder: dst, base: head, sub: true });
  fill(src, dst, branch, method, made);
  gitOk(dst, 'reset', '-q');
}

function currentBranch(dir) {
  const r = git(dir, 'symbolic-ref', '--short', 'HEAD');
  if (r.status !== 0) fail(`${dir} is not on a branch (detached HEAD) - switch it to the base branch first`);
  return r.stdout.trim();
}

function dirty(dir) {
  const r = git(dir, 'status', '--porcelain');
  if (r.status !== 0) fail(`git status failed in ${dir} - fix the repository first: ${r.stderr.trim()}`);
  return r.stdout.split('\n').filter(Boolean);
}

/** The main repo and its nested repos: [{rel, dir}]. */
function repos(root) {
  const out = [{ rel: '.', dir: root }];
  const rec = (dir, prefix) => {
    for (const n of nestedRepos(dir)) {
      out.push({ rel: prefix + n, dir: path.join(dir, n) });
      rec(path.join(dir, n), `${prefix}${n}/`);
    }
  };
  rec(root, '');
  return out;
}

/** The submodules of the main repo and its nested repos, at any depth: [{rel, dir}]. */
function subRepos(root) {
  const out = [];
  const rec = (dir, prefix) => {
    for (const n of submodules(dir)) {
      out.push({ rel: prefix + n, dir: path.join(dir, n) });
      rec(path.join(dir, n), `${prefix}${n}/`);
    }
  };
  for (const repo of repos(root)) rec(repo.dir, repo.rel === '.' ? '' : `${repo.rel}/`);
  return out;
}

/** A worker's submodule worktree whose commit the main folder's submodule does not have yet. */
function subCommitted(sub, wt) {
  const head = git(wt, 'rev-parse', 'HEAD').stdout.trim();
  return head && git(sub.dir, 'merge-base', '--is-ancestor', head, 'HEAD').status !== 0;
}

// ---- commands ---------------------------------------------------------------------------

function cmdInit(root) {
  const file = path.join(root, LIST);
  if (fs.existsSync(file)) {
    console.log(`${LIST} is there already`);
    return;
  }
  const rows = PRESET.map((n) => ({ Name: n, Status: 'free', Task: '—', Branch: '—', Folder: '—', Session: '—' }));
  const text = `# Workers\n\nThe worker-agents of this project; the main-agent (\`AGENTS.md\`) gives them tasks with the \`ph-workers\` skill, and \`node <skill>/workers/workers.mjs\` keeps this table. Status: \`free\` (no task), \`working\`, \`review\` (done, waits for the owner's word to merge).\n\n| Name |\n`;
  fs.mkdirSync(path.dirname(file), { recursive: true });
  writeList(root, rows, text);
  console.log(`made ${LIST}: main-agent ${mainAgent(root)}, workers ${PRESET.join(', ')}`);
}

function cmdStatus(root) {
  const { rows } = readList(root);
  const main = mainAgent(root);
  console.log(`main-agent: ${main}; main folder ${shorten(root)} on ${currentBranch(root)}`);
  for (const r of rows) {
    let line = `${r.Name}: ${r.Status}`;
    if (r.Task !== '—') line += `; task: ${r.Task}`;
    if (r.Session !== '—') line += `; session ${r.Session}`;
    if (r.Folder !== '—') {
      const folder = expand(r.Folder);
      if (!fs.existsSync(folder)) line += `; folder ${r.Folder} is missing`;
      else {
        const branch = git(folder, 'symbolic-ref', '--short', 'HEAD').stdout.trim() || '(detached)';
        line += `; folder ${r.Folder} on ${branch}`;
        for (const repo of repos(root)) {
          const wt = repo.rel === '.' ? folder : path.join(folder, repo.rel);
          if (!fs.existsSync(path.join(wt, '.git'))) continue;
          const base = currentBranch(repo.dir);
          const ahead = git(repo.dir, 'rev-list', '--count', `${base}..${branch}`).stdout.trim() || '0';
          const st = git(wt, 'status', '--porcelain');
          if (st.status !== 0) {
            line += `\n  ${repo.rel === '.' ? 'repo' : repo.rel}: git status failed - ${st.stderr.trim()}`;
            continue;
          }
          const changes = st.stdout.split('\n').filter(Boolean).length;
          let conflicts = '';
          if (ahead !== '0') {
            const m = git(repo.dir, 'merge-tree', '--write-tree', '--name-only', '--no-messages', base, branch);
            if (m.status === 1) conflicts = `, conflicts in ${m.stdout.split('\n').slice(1).filter(Boolean).join(', ')}`;
            else if (m.status !== 0) conflicts = ', conflicts not checked (git 2.38 or newer needed)';
          }
          line += `\n  ${repo.rel === '.' ? 'repo' : repo.rel}: ${ahead} commit(s) not in ${base}, ${changes} uncommitted change(s)${conflicts}`;
        }
        for (const sub of subRepos(root)) {
          const wt = path.join(folder, sub.rel);
          if (fs.existsSync(path.join(wt, '.git')) && subCommitted(sub, wt)) {
            line += `\n  ${sub.rel} (submodule): a commit inside the submodule - ask the owner how it goes in`;
          }
        }
      }
    }
    console.log(line);
  }
  // branches that wait for a merge may also clash with each other: the second merge would meet it
  for (const repo of repos(root)) {
    const base = currentBranch(repo.dir);
    const waiting = rows.filter((r) => r.Branch !== '—' && git(repo.dir, 'rev-list', '--count', `${base}..${r.Branch}`).stdout.trim() > '0');
    for (let i = 0; i < waiting.length; i++) {
      for (let j = i + 1; j < waiting.length; j++) {
        const m = git(repo.dir, 'merge-tree', '--write-tree', '--name-only', '--no-messages', waiting[i].Branch, waiting[j].Branch);
        if (m.status === 1) {
          console.log(`${waiting[i].Name} and ${waiting[j].Name}${repo.rel === '.' ? '' : ` (${repo.rel})`}: the second merge will conflict in ${m.stdout.split('\n').slice(1).filter(Boolean).join(', ')}`);
        }
      }
    }
  }
}

function cmdAdd(root, a) {
  checkName(a.name);
  const { text, rows } = readList(root);
  if (a.name.toLowerCase() === mainAgent(root).toLowerCase()) fail(`${a.name} is the main-agent's name`);
  if (findRow(rows, a.name)) fail(`${a.name} is in the list already`);
  rows.push({ Name: a.name, Status: 'free', Task: '—', Branch: '—', Folder: '—', Session: '—' });
  writeList(root, rows, text);
  console.log(`added ${a.name}`);
}

function cmdRename(root, a) {
  checkName(a.to);
  const { text, rows } = readList(root);
  const main = mainAgent(root);
  const taken = [main, ...rows.map((r) => r.Name)].map((n) => n.toLowerCase());
  if (taken.includes(a.to.toLowerCase())) fail(`${a.to} is taken`);
  if (String(a.from).toLowerCase() === main.toLowerCase()) {
    const file = path.join(root, 'AGENTS.md');
    const body = fs.readFileSync(file, 'utf8');
    if (!/^- \*\*Main-agent:\*\* /m.test(body)) fail('AGENTS.md has no "- **Main-agent:**" line');
    const re = new RegExp(`\\b${main}\\b`, 'g');
    const line = /^- \*\*Main-agent:\*\* .*$/m.exec(body)[0];
    fs.writeFileSync(file, body.replace(line, line.replace(re, a.to)));
    console.log(`main-agent ${main} -> ${a.to} (AGENTS.md)`);
    return;
  }
  const row = findRow(rows, a.from);
  if (!row) fail(`${a.from} is not in the list`);
  if (row.Folder !== '—') fail(`${row.Name} has a folder: remove it first (remove --name ${row.Name})`);
  row.Name = a.to;
  writeList(root, rows, text);
  console.log(`renamed ${a.from} -> ${a.to}`);
}

function nestedNote(made) {
  const subs = made.filter((m) => m.sub).length;
  const nested = made.length - 1 - subs;
  return `${nested ? `, ${nested} nested repo(s)` : ''}${subs ? `, ${subs} submodule(s)` : ''}`;
}

function cmdPrepare(root, a) {
  const { text, rows } = readList(root);
  const row = findRow(rows, a.name);
  if (!row) fail(`${a.name} is not in the list`);
  if (!/^[a-z0-9][a-z0-9-]{0,47}$/.test(a.task || '')) fail('--task is a short slug: a-z, 0-9 and -', 2);
  const branch = `${row.Name.toLowerCase()}/${a.task}`;
  for (const repo of repos(root)) {
    const d = dirty(repo.dir);
    if (d.length) fail(`${repo.rel === '.' ? 'the main folder' : repo.rel} has uncommitted changes - commit them first (${LIST} too):\n${d.join('\n')}`);
    if (git(repo.dir, 'rev-parse', '--verify', '--quiet', `refs/heads/${branch}`).status === 0) fail(`branch ${branch} exists in ${repo.rel}`);
  }
  let folder;
  if (row.Folder !== '—' && fs.existsSync(expand(row.Folder))) {
    folder = expand(row.Folder);
    const subs = subRepos(root).filter((sub) => fs.existsSync(path.join(folder, sub.rel, '.git')));
    for (const sub of subs) {
      const wt = path.join(folder, sub.rel);
      if (dirty(wt).length || subCommitted(sub, wt)) fail(`${row.Name}'s folder has work inside the submodule ${sub.rel} - ask the owner how it goes in`);
    }
    for (const repo of repos(root)) {
      const wt = repo.rel === '.' ? folder : path.join(folder, repo.rel);
      if (!fs.existsSync(path.join(wt, '.git'))) continue;
      const d = dirty(wt);
      if (d.length) fail(`${row.Name}'s folder has uncommitted changes in ${repo.rel}:\n${d.join('\n')}`);
      const old = git(wt, 'symbolic-ref', '--short', 'HEAD').stdout.trim();
      const base = currentBranch(repo.dir);
      if (old && git(repo.dir, 'merge-base', '--is-ancestor', old, base).status !== 0) {
        fail(`${row.Name}'s branch ${old} is not merged into ${base} - merge it (ph-merge-work) or remove it first`);
      }
    }
    for (const repo of repos(root)) {
      const wt = repo.rel === '.' ? folder : path.join(folder, repo.rel);
      if (fs.existsSync(path.join(wt, '.git'))) gitOk(wt, 'switch', '-q', '-c', branch, currentBranch(repo.dir));
    }
    for (const sub of subs) gitOk(path.join(folder, sub.rel), 'switch', '-q', '--detach', gitOk(sub.dir, 'rev-parse', 'HEAD').trim());
    console.log(`${row.Name}'s folder ${shorten(folder)} is on the new branch ${branch}`);
  } else {
    const parent = path.resolve(expand(a.dir || path.join(os.homedir(), 'pan-workers', path.basename(root))));
    folder = path.join(parent, row.Name);
    if (cloudSynced(folder)) fail(`${shorten(folder)} is in a cloud-synced folder; a sync service would upload every worker copy - give --dir outside it`);
    if (path.resolve(folder) === path.resolve(root) || path.resolve(folder).startsWith(path.resolve(root) + path.sep)) fail('a worker folder lies outside the main folder');
    if (fs.existsSync(folder)) fail(`${shorten(folder)} exists - remove it or give another --dir`);
    fs.mkdirSync(parent, { recursive: true });
    const sample = fs.readdirSync(root).map((e) => path.join(root, e)).find((p) => fs.lstatSync(p).isFile());
    const method = sample ? copyMethod(sample, parent) : 'plain';
    if (method === 'plain' && !a.copy) {
      const mb = (sizeOf(root) / 1048576).toFixed(1);
      console.log(`this disk cannot copy-on-write: a worker folder would be a plain copy of ${mb} MB (without .git).`);
      console.log('ask the owner; on a yes, run the same command with --copy');
      process.exit(3);
    }
    const made = [];
    addWorktree(root, folder, branch, method, made);
    for (const m of made) {
      const d = dirty(m.folder);
      if (d.length) fail(`the new folder ${shorten(m.folder)} differs from git:\n${d.slice(0, 10).join('\n')}`);
    }
    console.log(`${row.Name}'s folder ${shorten(folder)} on branch ${branch} (${method === 'clone' ? 'copy-on-write' : 'plain copy'}${nestedNote(made)})`);
  }
  if (cloudSynced(root)) console.log(`note: the main folder is in a cloud-synced folder; the worker folder is outside it on purpose`);
  Object.assign(row, { Status: 'working', Task: a.task, Branch: branch, Folder: shorten(folder) });
  writeList(root, rows, text);
  console.log(`\nBRIEF\nYou are ${row.Name}, a worker-agent of this project; the main-agent ${mainAgent(root)} opened this session for one task, and the owner sees it.\n- Your folder: ${folder}, branch ${branch}. Work only there; the main folder ${root} and the other worker folders are not yours.\n- Work as AGENTS.md says, with the worker lines there and the "Worker-agent" section of the ph-workers skill.\n- First set the task's type by the Workflow of AGENTS.md: this brief is not the owner's approval.\n- Task:`);
}

function cmdRecord(root, a) {
  const { text, rows } = readList(root);
  const row = findRow(rows, a.name);
  if (!row) fail(`${a.name} is not in the list`);
  if (a.status && !STATES.includes(a.status)) fail(`status is one of ${STATES.join(', ')}`, 2);
  if (a.status) row.Status = a.status;
  if (a.status === 'free') Object.assign(row, { Task: '—', Branch: '—' }); // the folder and the session stay for the next task
  if (a.task) row.Task = a.task;
  if (a.session) row.Session = a.session;
  writeList(root, rows, text);
  console.log(`${row.Name}: ${row.Status}${row.Session !== '—' ? `, session ${row.Session}` : ''}`);
}

function cmdRemove(root, a) {
  const main = mainAgent(root);
  if (String(a.name).toLowerCase() === main.toLowerCase()) fail(`${main} is the main-agent; it stays`);
  const { text, rows } = readList(root);
  const row = findRow(rows, a.name);
  if (!row) fail(`${a.name} is not in the list`);
  const all = repos(root);
  const folder = row.Folder !== '—' ? expand(row.Folder) : null;
  if (folder && path.resolve(folder) === path.resolve(root)) fail('the worker folder is the main folder; it stays');
  const unmerged = [];
  for (const repo of all) {
    const base = currentBranch(repo.dir);
    const branches = gitOk(repo.dir, 'for-each-ref', '--format=%(refname:short)', `refs/heads/${row.Name.toLowerCase()}/`).split('\n').filter(Boolean);
    for (const b of branches) if (git(repo.dir, 'merge-base', '--is-ancestor', b, base).status !== 0) unmerged.push(`${repo.rel}: ${b}`);
    if (folder) {
      const wt = repo.rel === '.' ? folder : path.join(folder, repo.rel);
      const st = fs.existsSync(path.join(wt, '.git')) && git(wt, 'status', '--porcelain');
      if (st && (st.status !== 0 || st.stdout.trim())) unmerged.push(`${repo.rel}: uncommitted changes in ${shorten(wt)}`);
    }
  }
  for (const sub of folder ? subRepos(root) : []) {
    const wt = path.join(folder, sub.rel);
    if (!fs.existsSync(path.join(wt, '.git'))) continue;
    const st = git(wt, 'status', '--porcelain');
    if (st.status !== 0 || st.stdout.trim() || subCommitted(sub, wt)) unmerged.push(`${sub.rel}: a commit inside the submodule or uncommitted changes in ${shorten(wt)}`);
  }
  if (unmerged.length && !a.force) {
    console.log(`${row.Name} has work not in the base branch:\n${unmerged.join('\n')}\nmerge it, or with the owner's word run again with --force`);
    process.exit(3);
  }
  const subs = subRepos(root);
  if (folder && fs.existsSync(folder)) {
    for (const sub of [...subs].reverse()) {
      const wt = path.join(folder, sub.rel);
      if (fs.existsSync(path.join(wt, '.git'))) git(sub.dir, 'worktree', 'remove', '--force', wt); // a broken one: the folder is deleted and pruned below
    }
    for (const repo of [...all].reverse()) {
      const wt = repo.rel === '.' ? folder : path.join(folder, repo.rel);
      if (fs.existsSync(path.join(wt, '.git'))) git(repo.dir, 'worktree', 'remove', '--force', wt);
    }
    fs.rmSync(folder, { recursive: true, force: true });
    const parent = path.dirname(folder);
    if (fs.existsSync(parent) && fs.readdirSync(parent).length === 0) fs.rmdirSync(parent);
    console.log(`removed the folder ${shorten(folder)}`);
  }
  for (const sub of subs) gitOk(sub.dir, 'worktree', 'prune');
  for (const repo of all) {
    gitOk(repo.dir, 'worktree', 'prune');
    const branches = gitOk(repo.dir, 'for-each-ref', '--format=%(refname:short)', `refs/heads/${row.Name.toLowerCase()}/`).split('\n').filter(Boolean);
    for (const b of branches) {
      gitOk(repo.dir, 'branch', a.force ? '-D' : '-d', b);
      console.log(`deleted branch ${b}${repo.rel === '.' ? '' : ` in ${repo.rel}`}`);
    }
  }
  if (a.forget) {
    rows.splice(rows.indexOf(row), 1);
    console.log(`removed ${row.Name} from the list`);
  } else Object.assign(row, { Status: 'free', Task: '—', Branch: '—', Folder: '—', Session: '—' });
  writeList(root, rows, text);
}

const a = args(process.argv.slice(2));
const command = a._[0];
if (!command || command === 'help' || a.help) {
  console.log('usage: node <skill>/workers/workers.mjs <init|status|add|rename|prepare|record|remove> --root <project> [options]');
  process.exit(command ? 0 : 2);
}
if (!a.root) fail('--root is required', 2);
const root = path.resolve(a.root);
if (git(root, 'rev-parse', '--show-toplevel').status !== 0) fail(`${root} is not a git repository`);
const commands = { init: cmdInit, status: cmdStatus, add: cmdAdd, rename: cmdRename, prepare: cmdPrepare, record: cmdRecord, remove: cmdRemove };
if (!commands[command]) fail(`unknown command ${command}`, 2);
commands[command](root, a);
