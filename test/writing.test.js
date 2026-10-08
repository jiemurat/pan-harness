// P26 in the package's own agent texts (skills, references, skill parts, templates): one term per
// concept with no glossed term in brackets, and skill descriptions that stay short (they sit in
// every session's context). ph-grilling is upstream text and keeps its own wording.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CORE = path.join(ROOT, 'core');

function files(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? files(p) : [p];
  });
}

const agentTexts = [
  ...files(path.join(CORE, 'references')),
  ...files(path.join(CORE, 'skill-parts')),
  ...files(path.join(CORE, 'templates')),
  ...['ph-init', 'ph-doctor', 'ph-update'].map((s) => path.join(ROOT, 'skills-src', s, 'SKILL.md')),
].filter((p) => /\.(md|tmpl)$/.test(p));

// the same list and pattern as the terms check of pan-harness-check.mjs, read from its source
const src = fs.readFileSync(path.join(CORE, 'scripts', 'pan-harness-check.mjs'), 'utf8');
const terms = [.../const GLOSS_TERMS = \[([\s\S]*?)\];/.exec(src)[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
const TERM = `(?:${terms.join('|')})`;
const GLOSS = new RegExp(`[\\p{L}\\p{N}_'’ʻ]*[\\p{L}\\p{N}_]\\s+\\(${TERM}(?:(?:,|\\s+(?:yoki|va|or|and))\\s+${TERM})*\\)`, 'giu');

test('no glossed term in brackets in the agent texts', () => {
  const hits = [];
  for (const p of agentTexts) {
    fs.readFileSync(p, 'utf8').split('\n').forEach((line, i) => {
      for (const m of line.matchAll(GLOSS)) hits.push(`${path.relative(ROOT, p)}:${i + 1}: ${m[0]}`);
    });
  }
  assert.deepEqual(hits, []);
});

test('skill descriptions stay within 900 bytes together', () => {
  const sizes = fs.readdirSync(path.join(ROOT, 'skills-src')).map((s) => {
    const body = fs.readFileSync(path.join(ROOT, 'skills-src', s, 'SKILL.md'), 'utf8');
    return [s, Buffer.byteLength(/^description: (.*)$/m.exec(body)[1], 'utf8')];
  });
  const total = sizes.reduce((n, [, b]) => n + b, 0);
  assert.ok(total <= 900, `${total} bytes: ${sizes.map(([s, b]) => `${s} ${b}`).join(', ')}`);
});
