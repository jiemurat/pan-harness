// Every reference in the package's agent texts leads to a real place. A link names a file and,
// after an arrow (→ or ->), a section: "`file.md` → "Section"", "`file.md` → `Section` → `Label`",
// and in script messages "file.md -> Section". The file is one the skill ships (SKILL.md, references/,
// templates/, scripts/) or a project file made from one of its templates (AGENTS.md, plan.md,
// playbooks/pan-harness.md); each section is a heading, a bold label or a key of that file. Every ID
// (A12, P3, S5, R4, D1, F1, E2, a source number [7]) has its definition. A target or an ID that is
// neither is listed in ALLOWED_TARGETS or ALLOWED_IDS with its reason. The texts: core/ as the
// harness skills get it, and every SKILL.md source with the skill it builds.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildAll } from '../scripts/build.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const built = buildAll();
const textOf = (skill, rel) => built.get(skill).get(rel).toString('utf8');

// link targets that no skill file or template stands for, with the reason
const ALLOWED_TARGETS = {
  '.pan-harness.json': 'the install manifest the CLI writes next to the skills (lib/install.js)',
  'file.md': 'the notation of a link in the writing rules and the check',
};
// IDs that have no definition in the package, with the files they may appear in
const ALLOWED_IDS = {
  B0: [['core/scripts/pan-harness-check.mjs', 'core/scripts/secret-check.mjs'], 'a regex constant'],
  B1: [['core/scripts/pan-harness-check.mjs', 'core/scripts/secret-check.mjs'], 'a regex constant'],
  U0: [['core/scripts/pan-harness-check.mjs'], 'the git diff option -U0'],
  L1: [['core/references/structure.md'], 'the format of lesson IDs'],
  L03: [['core/references/principles.md'], 'a lecture of source 28'],
  L04: [['core/references/principles.md'], 'a lecture of source 28'],
  L05: [['core/references/principles.md'], 'a lecture of source 28'],
  L07: [['core/references/principles.md'], 'a lecture of source 28'],
  L14: [['core/references/principles.md'], 'a lecture of source 28'],
  D2: [['core/references/init.md'], 'the decision ph-init writes into the project'],
  F2: [['core/references/init.md'], 'an example rule source'],
  K1: [['core/templates/pan-harness/handoff.md.tmpl', 'core/templates/pan-harness/history/YYYY-MM.md.tmpl',
    'core/templates/pan-harness/plan.md.tmpl'], 'a criterion number in an example'],
  K2: [['core/templates/pan-harness/history/YYYY-MM.md.tmpl'], 'a criterion number in an example'],
  K4: [['core/references/audit.md', 'core/scripts/pan-harness-check.mjs',
    'core/skill-parts/core-rules.md', 'core/templates/AGENTS.md.tmpl'], 'a criterion number in the example label set'],
  Q1: [['core/references/init.md', 'core/templates/pan-harness/playbooks/large-task.md.tmpl',
    'skills-src/ph-grilling/SKILL.md', 'skills-src/ph-init/SKILL.md'], 'a planning question number'],
  Q2: [['core/references/init.md', 'skills-src/ph-grilling/SKILL.md'], 'a planning question number'],
};

// the texts to check: [shown path, skill whose files it links to, text]
const texts = [];
const CORE = path.join(ROOT, 'core');
const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
  const p = path.join(dir, e.name);
  return e.isDirectory() ? walk(p) : [p];
});
for (const p of walk(CORE)) texts.push([path.relative(ROOT, p).split(path.sep).join('/'), 'ph-init', fs.readFileSync(p, 'utf8')]);
for (const skill of fs.readdirSync(path.join(ROOT, 'skills-src'))) {
  texts.push([`skills-src/${skill}/SKILL.md`, skill, fs.readFileSync(path.join(ROOT, 'skills-src', skill, 'SKILL.md'), 'utf8')]);
}

// ---------------------------------------------------------------- links

const ARROW = '(?:→|(?<!-)->)'; // not the end of an HTML comment
const FILE = '[\\p{L}\\p{N}_./<>-]+\\.(?:md|tmpl|json|mjs|js)';
// a section after an arrow: `name`, "name" or a bare word (Sources, 1.2.0, R4)
const HOP = '(?:`[^`]+`|"[^"]+"|[\\p{L}\\p{N}][\\p{L}\\p{N}._-]*)';
const TICKED = new RegExp(`\`(${FILE})\`\\s*${ARROW}\\s*(${HOP}(?:\\s*${ARROW}\\s*${HOP})*)`, 'gu');
// script messages and comments: a bare file name, then quoted sections or plain words up to ) , ; or a quote
const PLAIN = `(?:"[^"]+"|\`[^\`]+\`|[^\\s)"'\`,;][^)"'\`,;\\n]*?)`;
const BARE = new RegExp(`(?<![\\p{L}\\p{N}_\`./-])(${FILE})\\s*${ARROW}\\s*(${PLAIN}(?:\\s*${ARROW}\\s*${PLAIN})*)(?=\\s*(?:[)"'\`,;]|\\.(?:\\s|$)|$))`, 'gu');
const HOPS = new RegExp(`\\s*${ARROW}\\s*`, 'u');

const norm = (s) => s.replace(/[`*]/g, '').replace(/^\s*#+\s*/, '').replace(/^[\s.:"]+|[\s.:"]+$/g, '').replace(/\s+/g, ' ').toLowerCase();

/** The file of a skill that a link target names, or null. */
function resolve(target, files) {
  const t = target.replace(/^<skill>\//, '').replace(/^\.\//, '');
  for (const rel of [t, `references/${t}`, `scripts/${t}`]) if (files.has(rel)) return rel;
  // a project file made from a template; a nested template (archive/decisions.md) only by its full path
  const bare = t.replace(/^pan-harness\//, '');
  const made = [...files.keys()].filter((k) => k === `templates/${bare}.tmpl` || k.endsWith(`/${bare}.tmpl`));
  return made.sort((a, b) => a.length - b.length)[0] ?? null;
}

const anchorCache = new Map();
/** Headings, bold labels and keys (JSON, frontmatter) of a skill file, normalized. */
function anchors(skill, rel) {
  const key = `${skill}/${rel}`;
  if (!anchorCache.has(key)) {
    const out = new Set();
    const add = (s) => {
      const n = norm(s);
      if (n) out.add(n).add(n.replace(/^\d+\.\s*/, ''));
    };
    for (const line of textOf(skill, rel).split('\n')) {
      const h = /^#+\s+(.*)$/.exec(line);
      if (h) add(h[1]);
      for (const m of line.matchAll(/\*\*([^*\n]+)\*\*/g)) add(m[1]);
      const k = /^\s*"?([\p{L}\p{N}_.-]+)"?\s*:/u.exec(line);
      if (k) add(k[1]);
    }
    anchorCache.set(key, out);
  }
  return anchorCache.get(key);
}

/** Whether a section name leads to an anchor: the same name, or an anchor that starts with it
 * (a numbered or longer heading); with loose, also a plain-text name that starts with the anchor. */
function leads(name, set, loose) {
  const w = norm(name);
  const at = (long, short) => long.startsWith(short) && /^(?:[^\p{L}\p{N}]|$)/u.test(long.slice(short.length));
  if ([...set].some((a) => at(a, w) || (loose && at(w, a)))) return true;
  return w.includes('.') && !/^\d/.test(w) && w.split('.').every((part) => set.has(part)); // a key path: metadata.version
}

/** Lines of a text; a line that ends in an arrow goes on with the next one (a wrapped comment or
 * a message split into two strings). */
function lines(text) {
  const out = [];
  const all = text.split('\n');
  const wrapped = new RegExp(`${ARROW}\\s*[\`'"]?\\s*$`, 'u');
  for (let i = 0; i < all.length; i++) {
    let line = all[i];
    const n = i + 1;
    while (wrapped.test(line) && i + 1 < all.length) {
      const head = line.replace(/[`'"]?\s*$/, '');
      const tail = all[++i].replace(/^\s*(?:\/\/|#|\*|\+)?\s*[`'"]?/, '');
      line = `${head} ${tail}`;
    }
    out.push([n, line]);
  }
  return out;
}

const links = { found: 0, resolved: 0, allowed: 0, broken: [] };
for (const [shown, skill, text] of texts) {
  const files = built.get(skill);
  for (const [n, line] of lines(text)) {
    const seen = [];
    for (const [re, loose] of [[TICKED, false], [BARE, true]]) {
      for (const m of line.matchAll(re)) {
        if (seen.some(([a, b]) => m.index >= a && m.index < b)) continue; // a ticked link is not read again as bare
        seen.push([m.index, m.index + m[0].length]);
        links.found++;
        const target = m[1];
        const hops = m[2].split(HOPS).filter(Boolean);
        const where = `${shown}:${n}: ${m[0]}`;
        if (['{{', '…', '<n>'].some((mark) => m[0].includes(mark))) { links.allowed++; continue; } // a template placeholder
        const allowed = Object.keys(ALLOWED_TARGETS).find((t) => target === t || target.endsWith(`/${t}`));
        if (allowed) { links.allowed++; continue; }
        const rel = resolve(target, files);
        if (!rel) { links.broken.push(`${where} - no file of ${skill} or its templates`); continue; }
        const bad = hops.filter((h) => !leads(h, anchors(skill, rel), loose && !/^["`]/.test(h)));
        if (bad.length) links.broken.push(`${where} - ${rel} has no heading, bold label or key ${bad.map((h) => `"${norm(h)}"`).join(', ')}`);
        else links.resolved++;
      }
    }
  }
}

test('every link in the agent texts leads to a heading, a bold label or a key of its file', (t) => {
  t.diagnostic(`links: ${links.found} found, ${links.resolved} resolved, ${links.allowed} allowed, ${links.broken.length} broken`);
  assert.deepEqual(links.broken, []);
});

// ---------------------------------------------------------------- IDs

const definitions = {
  A: ['references/audit.md', /^\| A(\d+) \|/gm],
  P: ['references/principles.md', /\*\*P(\d+)\./g],
  S: ['references/style-questions.md', /^\| S(\d+) \|/gm],
  R: ['templates/AGENTS.md.tmpl', /\*\*R(\d+)\./g],
  D: ['templates/pan-harness/decisions.md.tmpl', /\*\*D(\d+)\*\*/g],
  F: ['templates/pan-harness/feedback.md.tmpl', /^### F(\d+) /gm],
};
const defined = new Set();
for (const [prefix, [rel, re]] of Object.entries(definitions)) {
  for (const m of textOf('ph-init', rel).matchAll(re)) defined.add(`${prefix}${m[1]}`);
}
for (const m of fs.readFileSync(path.join(ROOT, 'evals', 'scenarios.md'), 'utf8').matchAll(/^## E(\d+)\./gm)) defined.add(`E${m[1]}`);
const principles = textOf('ph-init', 'references/principles.md');
const sources = new Set([...principles.slice(principles.indexOf('\n## Sources')).matchAll(/^(\d+)\. /gm)].map((m) => m[1]));

const ids = { found: 0, defined: 0, allowed: 0, unknown: [] };
for (const [shown, , text] of texts) {
  text.split('\n').forEach((line, i) => {
    for (const m of line.matchAll(/(?<![\p{L}\p{N}_])([A-Z])(\d+)(?![\p{L}\p{N}_])/gu)) {
      ids.found++;
      const id = m[1] + m[2];
      const allowed = ALLOWED_IDS[id];
      if (defined.has(id)) ids.defined++;
      else if (allowed && allowed[0].includes(shown)) ids.allowed++;
      else ids.unknown.push(`${shown}:${i + 1}: ${id}`);
    }
    if (!/\.(md|tmpl)$/.test(shown)) return; // [n] in code is an index
    for (const m of line.matchAll(/(?<![\p{L}\p{N}_\]])\[(\d{1,2})\](?!\()/gu)) {
      ids.found++;
      if (sources.has(m[1])) ids.defined++;
      else ids.unknown.push(`${shown}:${i + 1}: source [${m[1]}]`);
    }
  });
}

test('every ID in the agent texts has its definition', (t) => {
  t.diagnostic(`IDs: ${ids.found} found, ${ids.defined} defined, ${ids.allowed} allowed, ${ids.unknown.length} unknown`);
  assert.deepEqual(ids.unknown, []);
});
