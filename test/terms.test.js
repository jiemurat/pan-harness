// The terms the package texts and the agent use with the owner: project, artifact, project-folder,
// artifact-folder and owner. The old folder wording is gone, the glossary defines the five terms, the
// chat term list names the four work and folder terms wherever it stands, the AGENTS.md template names
// the artifact-folder and the audit checks it.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const walk = (dir) => fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })
  .flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]));
const OLD = /project folder|project root|project's content/i;

test('the old folder wording is gone: project-folder takes its place', () => {
  const files = [...['core', 'skills-src', 'lib', 'cli', 'evals'].flatMap(walk), 'README.md'];
  const hits = files.flatMap((rel) => read(rel).split('\n').flatMap((line, i) => (OLD.test(line) ? [`${rel}:${i + 1}`] : [])));
  assert.deepEqual(hits, []);
});

test('the glossary defines project, artifact, project-folder, artifact-folder and owner', () => {
  const glossary = read('core/references/structure.md').split('## Glossary')[1].split('\n## ')[0];
  for (const term of ['project', 'artifact', 'project-folder', 'artifact-folder', 'owner']) {
    assert.match(glossary, new RegExp(`^\\| ${term} \\|`, 'm'), term);
  }
});

test('the chat term list names the four work and folder terms wherever it stands', () => {
  const places = {
    'the AGENTS.md template chat rule': read('core/templates/AGENTS.md.tmpl'),
    'core rule 14': read('core/skill-parts/core-rules.md'),
    'the runbook Terms line': read('core/templates/pan-harness/runbook.md.tmpl'),
    'the glossary note of structure.md': read('core/references/structure.md'),
  };
  for (const [where, text] of Object.entries(places)) {
    assert.match(text, /assumption, project, artifact, project-folder, artifact-folder/, where);
  }
  for (const where of ['the AGENTS.md template chat rule', 'core rule 14']) {
    assert.match(places[where], /The project-folder, the artifacts and the artifact-folder are always called by these terms\./, `${where}: always these terms`);
  }
  assert.match(read('core/references/init.md'), /Ask it with the term artifact-folder, explained in one sentence at its first use/, 'the artifact-folder question uses the term');
});

test('the AGENTS.md template names the artifact-folder and the audit checks it', () => {
  assert.match(read('core/templates/AGENTS.md.tmpl'), /^- \*\*Artifact-folder:\*\* `\{\{artifact-folder\}\}`/m);
  const row = read('core/references/audit.md').split('\n').find((l) => /^\| A\d+ \|.*artifact-folder/.test(l));
  assert.ok(row, 'an audit row on the artifact-folder');
  assert.match(row, /S31/, 'its fix asks the artifact-folder question');
});
