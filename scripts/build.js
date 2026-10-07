// Builds skills/<name>/ from skills-src/<name>/ and core/, the single source of the
// references, templates and scripts the ph-* skills share (each skill gets its own copy,
// so it works wherever it is installed alone). Do not edit skills/ by hand.
//   node scripts/build.js          write skills/
//   node scripts/build.js --check  exit 1 when skills/ differs from a fresh build (CI)
// In skills-src/<name>/SKILL.md, a line "<!-- include: skill-parts/x.md -->" is replaced
// by core/skill-parts/x.md and "{{version}}" by the package version. build.json lists the
// core paths the skill gets: {"core": ["references/", "templates/", "scripts/"]}.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { walk } from '../lib/fsutil.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'skills-src');
const CORE = path.join(ROOT, 'core');
const OUT = path.join(ROOT, 'skills');
const version = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8')).version;

function render(text, name) {
  return text
    .replace(/^<!-- include: ([\w./-]+) -->$/gm, (_, rel) => {
      const file = path.join(CORE, rel);
      if (!fs.existsSync(file)) throw new Error(`${name}/SKILL.md: include ${rel} not found in core/`);
      return fs.readFileSync(file, 'utf8').replace(/\n+$/, '');
    })
    .replace(/\{\{version\}\}/g, version);
}

/** name -> Map(relative path -> Buffer) */
export function buildAll() {
  const result = new Map();
  for (const name of fs.readdirSync(SRC).sort()) {
    const dir = path.join(SRC, name);
    if (!fs.statSync(dir).isDirectory()) continue;
    const files = new Map();
    const cfgFile = path.join(dir, 'build.json');
    const cfg = fs.existsSync(cfgFile) ? JSON.parse(fs.readFileSync(cfgFile, 'utf8')) : {};
    for (const rel of cfg.core || []) {
      const src = path.join(CORE, rel);
      if (!fs.existsSync(src)) throw new Error(`${name}/build.json: core/${rel} not found`);
      const list = rel.endsWith('/') ? walk(src).map((r) => rel + r) : [rel];
      for (const r of list) files.set(r, fs.readFileSync(path.join(CORE, r)));
    }
    for (const rel of walk(dir)) {
      if (rel === 'build.json') continue;
      const data = fs.readFileSync(path.join(dir, rel));
      files.set(rel, rel === 'SKILL.md' ? Buffer.from(render(data.toString('utf8'), name)) : data);
    }
    result.set(name, files);
  }
  return result;
}

function differences(built) {
  const diffs = [];
  const names = new Set([...built.keys(), ...(fs.existsSync(OUT) ? fs.readdirSync(OUT) : [])]);
  for (const name of names) {
    const want = built.get(name) || new Map();
    const dir = path.join(OUT, name);
    const have = fs.existsSync(dir) ? walk(dir) : [];
    for (const rel of have) if (!want.has(rel)) diffs.push(`extra: skills/${name}/${rel}`);
    for (const [rel, data] of want) {
      const f = path.join(dir, rel);
      if (!fs.existsSync(f)) diffs.push(`missing: skills/${name}/${rel}`);
      else if (!fs.readFileSync(f).equals(data)) diffs.push(`differs: skills/${name}/${rel}`);
    }
  }
  return diffs;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const built = buildAll();
  if (process.argv.includes('--check')) {
    const diffs = differences(built);
    diffs.slice(0, 20).forEach((d) => console.log(d));
    console.log(diffs.length ? `skills/ is stale (${diffs.length} difference(s)) - run npm run build and commit` : 'skills/ matches the sources');
    process.exitCode = diffs.length ? 1 : 0;
  } else {
    fs.rmSync(OUT, { recursive: true, force: true });
    let count = 0;
    for (const [name, files] of built) {
      for (const [rel, data] of files) {
        const f = path.join(OUT, name, rel);
        fs.mkdirSync(path.dirname(f), { recursive: true });
        fs.writeFileSync(f, data);
        count++;
      }
    }
    console.log(`built ${built.size} skill(s), ${count} file(s), version ${version}`);
  }
}
