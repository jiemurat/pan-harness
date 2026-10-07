// init, update, remove and status: copy the ph-* skills of this package into a project,
// write command files and the .gitignore block, and keep a manifest of what was written
// (with hashes, so files changed by hand are noticed before they are overwritten).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { TARGETS, COMMANDS, DEFAULT_COMMANDS } from './agents.js';
import { walk, sha256, writeFile, pruneEmpty } from './fsutil.js';
import { setBlock, removeBlock } from './gitignore.js';
import { parseFrontmatter } from './frontmatter.js';
import { compareVersions } from './registry.js';

export const PKG_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const PKG = JSON.parse(fs.readFileSync(path.join(PKG_ROOT, 'package.json'), 'utf8'));
const MANIFEST = '.pan-harness.json';

export class LocalChanges extends Error {
  constructor(files) {
    super(`${files.length} file(s) were changed by hand`);
    this.files = files;
  }
}

/** Folders an installation writes to: each target's skill folder and each command folder. */
const MANAGED_DIRS = [...Object.values(TARGETS).map((t) => t.dir), ...Object.values(COMMANDS).map((c) => c.dir)];

/** The absolute path of a manifest entry, or null when it would leave the managed folders. */
function managedPath(root, rel) {
  if (typeof rel !== 'string' || path.isAbsolute(rel) || rel.includes('\\')) return null;
  const norm = path.posix.normalize(rel);
  if (norm === '..' || norm.startsWith('../') || !MANAGED_DIRS.some((d) => norm.startsWith(`${d}/`))) return null;
  return path.join(root, ...norm.split('/'));
}

/** Stop when a folder on the way to file is a link that leads out of the project. */
function assertInside(root, file) {
  const realRoot = fs.realpathSync(root);
  let dir = path.dirname(file);
  while (!fs.existsSync(dir)) dir = path.dirname(dir);
  const real = fs.realpathSync(dir);
  if (real !== realRoot && !real.startsWith(realRoot + path.sep)) {
    throw new Error(`${path.relative(root, dir).split(path.sep).join('/') || '.'} leads outside the project (${real}) - nothing was changed; `
      + 'replace that link with a real folder and run again');
  }
}

/** The ph-* skills shipped in this package: [{name, dir, description}]. */
export function packageSkills() {
  const base = path.join(PKG_ROOT, 'skills');
  return fs.readdirSync(base, { withFileTypes: true })
    .filter((e) => e.isDirectory() && e.name.startsWith('ph-') && fs.existsSync(path.join(base, e.name, 'SKILL.md')))
    .map((e) => {
      const dir = path.join(base, e.name);
      const { data } = parseFrontmatter(fs.readFileSync(path.join(dir, 'SKILL.md'), 'utf8'));
      return { name: e.name, dir, description: (data && data.description) || e.name };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** The manifest of an installation in root, or null: {file, data}. A damaged one throws. */
export function findManifest(root) {
  for (const t of Object.values(TARGETS)) {
    const file = path.join(root, t.dir, MANIFEST);
    if (!fs.existsSync(file)) continue;
    const name = `${t.dir}/${MANIFEST}`;
    const fix = `delete ${name} and run: npx ${PKG.name}@latest init --yes`;
    let data;
    try {
      data = JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch {
      throw new Error(`${name} is not valid JSON - nothing was changed; ${fix}`);
    }
    if (!data || typeof data.version !== 'string' || !Array.isArray(data.targets) || !data.targets.length
      || !data.targets.every((k) => TARGETS[k]) || typeof data.files !== 'object' || data.files === null) {
      throw new Error(`${name} is damaged (version, targets or files) - nothing was changed; ${fix}`);
    }
    const outside = Object.keys(data.files).filter((rel) => !managedPath(root, rel));
    if (outside.length) {
      throw new Error(`${name} lists ${outside.length} path(s) outside the skill and command folders `
        + `(${outside[0]}) - nothing was changed; ${fix}`);
    }
    return { file, data };
  }
  return null;
}

/** Managed files whose content differs from what was installed (or that are gone). */
export function changedFiles(root, files) {
  return Object.entries(files)
    .filter(([rel, hash]) => {
      const f = managedPath(root, rel);
      return !f || !fs.existsSync(f) || sha256(fs.readFileSync(f)) !== hash;
    })
    .map(([rel]) => rel);
}

/** Every file an installation writes: [{rel, data}] (paths relative to root, '/' separated). */
function plan(targets, commands) {
  const out = [];
  const skills = packageSkills();
  for (const key of targets) {
    for (const s of skills) {
      for (const rel of walk(s.dir)) {
        out.push({ rel: `${TARGETS[key].dir}/${s.name}/${rel}`, data: fs.readFileSync(path.join(s.dir, rel)) });
      }
    }
  }
  if (targets.includes('agents')) {
    for (const c of commands) {
      for (const s of skills) {
        out.push({ rel: `${COMMANDS[c].dir}/${COMMANDS[c].file(s.name)}`, data: Buffer.from(COMMANDS[c].render(s.name, s.description, TARGETS.agents.dir)) });
      }
    }
  }
  return out;
}

function ignoreLines(targets, commands, manifestRel) {
  const lines = targets.map((k) => `${TARGETS[k].dir}/ph-*/`);
  lines.push(manifestRel);
  if (targets.includes('agents')) commands.forEach((c) => lines.push(COMMANDS[c].ignore));
  return lines;
}

function write(root, targets, commands, dryRun) {
  const files = plan(targets, commands);
  const manifestRel = `${TARGETS[targets[0]].dir}/${MANIFEST}`;
  if (!dryRun) {
    const hashes = {};
    // every destination is checked before the first file is written
    for (const f of files) assertInside(root, path.join(root, f.rel));
    for (const f of files) {
      writeFile(path.join(root, f.rel), f.data);
      hashes[f.rel] = sha256(f.data);
    }
    writeFile(path.join(root, manifestRel), JSON.stringify({
      package: PKG.name,
      version: PKG.version,
      installedAt: new Date().toISOString(),
      targets,
      commands: targets.includes('agents') ? commands : [],
      files: hashes,
    }, null, 2) + '\n');
    setBlock(root, ignoreLines(targets, targets.includes('agents') ? commands : [], manifestRel));
  }
  return files.map((f) => f.rel);
}

function deleteManaged(root, manifest) {
  // findManifest has refused any path outside the managed folders; links out of the project
  // are checked for every file before the first one is deleted
  const targets = Object.keys(manifest.data.files).map((rel) => managedPath(root, rel)).filter(Boolean);
  for (const f of targets) assertInside(root, f);
  const dirs = new Set();
  for (const f of targets) {
    if (fs.existsSync(f)) fs.rmSync(f);
    dirs.add(path.dirname(f));
  }
  fs.rmSync(manifest.file, { force: true });
  // deepest folders first, so a skill folder goes before its parents
  [...dirs].sort((a, b) => b.length - a.length).forEach((d) => pruneEmpty(d, root));
}

/** init: install the skills. Returns {status: 'installed'|'present'|'outdated'|'newer', ...}. */
export function install(root, { targets, commands = DEFAULT_COMMANDS, dryRun = false, yes = false } = {}) {
  const found = findManifest(root);
  if (found) {
    const cmp = compareVersions(found.data.version, PKG.version);
    const status = cmp === 0 ? 'present' : cmp < 0 ? 'outdated' : 'newer';
    return { status, version: found.data.version, targets: found.data.targets };
  }
  // a ph-* folder that pan-harness did not write is not overwritten without --yes
  const foreign = [];
  for (const key of targets) {
    for (const s of packageSkills()) {
      if (fs.existsSync(path.join(root, TARGETS[key].dir, s.name))) foreign.push(`${TARGETS[key].dir}/${s.name}/`);
    }
  }
  if (foreign.length && !yes) throw new LocalChanges(foreign);
  const files = write(root, targets, commands, dryRun);
  return { status: 'installed', version: PKG.version, files };
}

const sameSet = (a, b) => a.length === b.length && a.every((x) => b.includes(x));

/** update: replace the installed files with this package's version, or install them for other agents. */
export function update(root, { targets, commands, dryRun = false, yes = false } = {}) {
  const found = findManifest(root);
  if (!found) return { status: 'missing' };
  const from = found.data.version;
  // a CLI older than the installed skills does not replace them unless asked to
  if (compareVersions(from, PKG.version) > 0 && !yes) return { status: 'newer', version: from };
  const useTargets = targets || found.data.targets;
  const useCommands = useTargets.includes('agents') ? (commands || found.data.commands || DEFAULT_COMMANDS) : [];
  const relayout = !sameSet(useTargets, found.data.targets) || !sameSet(useCommands, found.data.commands || []);
  const changed = changedFiles(root, found.data.files);
  if (compareVersions(from, PKG.version) === 0 && !changed.length && !relayout) return { status: 'current', version: from };
  if (changed.length && !yes) throw new LocalChanges(changed);
  if (dryRun) return { status: 'updated', from, to: PKG.version, relayout, targets: useTargets, files: plan(useTargets, useCommands).map((f) => f.rel), dryRun };
  deleteManaged(root, found);
  removeBlock(root);
  const files = write(root, useTargets, useCommands, false);
  return { status: 'updated', from, to: PKG.version, relayout, targets: useTargets, commands: useCommands, files, skillDir: TARGETS[useTargets[0]].dir };
}

/** remove: delete the installed files, the manifest and the .gitignore block. */
export function remove(root, { dryRun = false, yes = false } = {}) {
  const found = findManifest(root);
  if (!found) return { status: 'missing' };
  const changed = changedFiles(root, found.data.files);
  if (changed.length && !yes) throw new LocalChanges(changed);
  const files = Object.keys(found.data.files);
  if (!dryRun) {
    deleteManaged(root, found);
    removeBlock(root);
  }
  return { status: 'removed', version: found.data.version, files };
}

/** status: what is installed and whether it was changed by hand. */
export function status(root) {
  const found = findManifest(root);
  if (!found) return { status: 'missing', packageVersion: PKG.version };
  return {
    status: 'installed',
    version: found.data.version,
    packageVersion: PKG.version,
    targets: found.data.targets,
    commands: found.data.commands || [],
    changed: changedFiles(root, found.data.files),
  };
}

/** CHANGELOG.md sections newer than from, up to this package's version. */
export function changelogSince(from) {
  const file = path.join(PKG_ROOT, 'CHANGELOG.md');
  if (!fs.existsSync(file)) return '';
  const parts = fs.readFileSync(file, 'utf8').split(/^(?=## \d+\.\d+\.\d+)/m);
  return parts
    .filter((p) => {
      const v = /^## (\d+\.\d+\.\d+)/.exec(p);
      return v && compareVersions(v[1], from) > 0 && compareVersions(v[1], PKG.version) <= 0;
    })
    .join('')
    .trim();
}
