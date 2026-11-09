// ph-humanize script: `fix` replaces the characters an ordinary keyboard cannot type (code and
// URLs untouched), removes invisible characters and emoji, lists unknown characters and
// mixed-script words, and copies the original first unless git can restore it; `scan` counts
// the signs that are counts in any language. Russian and Uzbek text is built from code points,
// so this file stays English for test/language.test.js.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { tmpDir } from './tmp.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SCRIPT = path.join(ROOT, 'skills', 'ph-humanize', 'scripts', 'humanize.mjs');
const c = (...codes) => String.fromCodePoint(...codes);
const APOS = c(0x2bb); // the Uzbek turned comma

function run(args, cwd) {
  const r = spawnSync(process.execPath, [SCRIPT, ...args], { encoding: 'utf8', cwd });
  return { code: r.status, out: r.stdout + r.stderr };
}

function file(name, text, dir = tmpDir('ph-humanize-')) {
  const p = path.join(dir, name);
  fs.writeFileSync(p, text);
  return p;
}

test('fix replaces the table characters and keeps code, URLs and the kept characters', () => {
  const ru = c(0x422, 0x43e, 0x43a, 0x435, 0x43d); // a Russian word
  const text = [
    `Token ${c(0x2014)} part of a word, pages 3${c(0x2013)}5, ${c(0x2212)}4 degrees.`,
    `${c(0x201c)}Quoted${c(0x201d)} and ${c(0xab)}${ru}${c(0xbb)}, it${c(0x2019)}s o${APOS}z, wait${c(0x2026)}`,
    `${c(0x2022)} item ${c(0x2192)} next ${c(0x2190)} back, 2${c(0xd7)}3 ${c(0x2248)} 6, a ${c(0x2264)} b ${c(0x2265)} c ${c(0x2260)} d`,
    `Kept: ${c(0x2116)} 5, 20${c(0xb0)}, 10${c(0x20ac)}, 50%, decomposed e${c(0x301)}. Unknown: ${c(0xa9)} and ${c(0xbd)}, stress ${c(0x43c, 0x430, 0x301)}.`,
    '```',
    `code ${c(0x2014)} stays`,
    '```',
    `Inline \`a ${c(0x2014)} b\` and https://example.org/a${c(0x2013)}b stay.`,
    '',
  ].join('\n');
  const p = file('note.md', text);
  const r = run(['fix', p]);
  assert.equal(r.code, 0, r.out);
  const got = fs.readFileSync(p, 'utf8');
  assert.match(got, /^Token - part of a word, pages 3-5, -4 degrees\.$/m);
  assert.ok(got.includes(`"Quoted" and "${ru}", it's o\u0027z, wait...`), got);
  assert.ok(got.includes('- item -> next <- back, 2x3 ~ 6, a <= b >= c != d'), got);
  assert.ok(got.includes(`Kept: ${c(0x2116)} 5, 20${c(0xb0)}, 10${c(0x20ac)}, 50%, decomposed e${c(0x301)}. Unknown: ${c(0xa9)} and ${c(0xbd)}, stress ${c(0x43c, 0x430, 0x301)}.`), got);
  assert.ok(got.includes(`code ${c(0x2014)} stays`), got);
  assert.ok(got.includes(`\`a ${c(0x2014)} b\``), got);
  assert.ok(got.includes(`https://example.org/a${c(0x2013)}b`), got);
  assert.match(r.out, /characters replaced: 18\b/);
  assert.match(r.out, /long dash .*: 1\b/);
  assert.match(r.out, /unknown characters/);
  assert.ok(r.out.includes(`U+00A9`) && r.out.includes('U+00BD') && r.out.includes('U+0301'), r.out);
  assert.equal((r.out.match(/U\+0301/g) || []).length, 1, 'the decomposed e is kept, the stress mark listed');
});

test('fix removes invisible characters and emoji and turns styled letters plain', () => {
  const text = `a${c(0xa0)}b${c(0x202f)}c${c(0x2009)}d, zero${c(0x200b)}width, soft${c(0xad)}hyphen, ${c(0xfeff)}start.\n`
    + `${c(0x1d401, 0x1d428, 0x1d425, 0x1d41d)} and ${c(0xff26, 0xff55, 0xff4c, 0xff4c)} done ${c(0x1f680)} ${c(0x2705)}${c(0xfe0f)}.\n`;
  const p = file('note.txt', text);
  const r = run(['fix', p]);
  assert.equal(r.code, 0, r.out);
  assert.equal(fs.readFileSync(p, 'utf8'), 'a b c d, zerowidth, softhyphen, start.\nBold and Full done  .\n');
});

test('fix lists mixed-script words and leaves them for the agent', () => {
  const word = `r${c(0x435)}port`; // a Cyrillic e inside an English word
  const p = file('note.md', `The ${word} is ready.\n`);
  const r = run(['fix', p]);
  assert.equal(r.code, 0, r.out);
  assert.ok(r.out.includes('mixed-script words') && r.out.includes(word), r.out);
  assert.ok(fs.readFileSync(p, 'utf8').includes(word));
});

test('fix copies the original once when git cannot restore it, and not when the file is clean in git', () => {
  const dir = tmpDir('ph-humanize-git-');
  const p = file('letter.md', `One ${c(0x2014)} two.\n`, dir);
  let r = run(['fix', p]);
  const copy = path.join(dir, 'letter.before-humanize.md');
  assert.equal(fs.readFileSync(copy, 'utf8'), `One ${c(0x2014)} two.\n`, r.out);
  fs.writeFileSync(p, `Three ${c(0x2014)} four.\n`);
  r = run(['fix', p]);
  assert.equal(fs.readFileSync(copy, 'utf8'), `One ${c(0x2014)} two.\n`, 'an existing copy is kept');

  const repo = tmpDir('ph-humanize-repo-');
  const git = (...a) => spawnSync('git', a, { cwd: repo, encoding: 'utf8' });
  if (git('--version').status !== 0) return;
  git('init', '-q');
  git('config', 'user.email', 'test@example.org');
  git('config', 'user.name', 'Test');
  const q = file('memo.md', `Five ${c(0x2014)} six.\n`, repo);
  git('add', 'memo.md');
  git('commit', '-q', '-m', 'memo');
  r = run(['fix', q]);
  assert.equal(r.code, 0, r.out);
  assert.equal(fs.existsSync(path.join(repo, 'memo.before-humanize.md')), false, r.out);
  assert.match(r.out, /backup: not needed/);
  assert.equal(fs.readFileSync(q, 'utf8'), 'Five - six.\n');
});

test('scan counts repeated phrases, openings, lengths, strong signs and lists', () => {
  const text = [
    '# Duties',
    '',
    'Additionally, the team delivers reports on time. Additionally, the team checks budgets on time.',
    'Additionally, the team answers letters on time. The head signs the plan.',
    '',
    `See the source contentReference[oaicite:0] and write to [Your Name] by the date ${c(0x2014)} soon.`,
    '',
    '- **Deadline:** 1 December',
    '- **Owner:** the head',
    '- plain item',
    '',
  ].join('\n');
  const p = file('duties.md', text);
  const r = run(['scan', p]);
  assert.equal(r.code, 0, r.out);
  assert.match(r.out, /"on time" x3/);
  assert.match(r.out, /same openings[^\n]*\n[^\n]*"additionally the" x3/i);
  assert.match(r.out, /sentence length: mean [\d.]+, sd [\d.]+, cv [\d.]+/);
  assert.match(r.out, /paragraph length: mean [\d.]+, sd [\d.]+, cv [\d.]+/);
  assert.match(r.out, /long dashes per 1000 words: [1-9]/);
  assert.ok(r.out.includes('oaicite') && r.out.includes('[Your Name]'), r.out);
  assert.match(r.out, /list lines: 3 of \d+/);
  assert.match(r.out, /bold-label items: 2\b/);
});

test('scan reads words with apostrophes and Cyrillic letters', () => {
  const uz = `o${APOS}z vaqtida`; // "on time" in Uzbek
  const ru = `${c(0x432)} ${c(0x441, 0x440, 0x43e, 0x43a)}`; // "on time" in Russian
  const text = `A ${uz} B. C ${uz} D. E ${uz} F. G ${ru} H. I ${ru} J. K ${ru} L.\n`;
  const p = file('mixed.txt', text);
  const r = run(['scan', p]);
  assert.equal(r.code, 0, r.out);
  assert.ok(r.out.includes(`"${uz}" x3`), r.out);
  assert.ok(r.out.includes(`"${ru}" x3`), r.out);
});

test('the script exits 2 with a usage line on a wrong call', () => {
  const r = run(['nope']);
  assert.equal(r.code, 2);
  assert.match(r.out, /usage: humanize\.mjs (fix|scan)/);
});
