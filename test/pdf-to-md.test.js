// ph-pdf-to-md scripts on the PDFs that test/fixtures/pdf-to-md/make_pdfs.py draws: the check
// passes the right Markdown and fails one that puts the cells of several table columns into one
// cell; the draft writer gives the expected Markdown, keeps heading levels in a page range and
// warns at text set in columns. The tests need Python 3 and poppler; where either is missing
// they are skipped.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { tmpDir } from './tmp.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SCRIPTS = path.join(ROOT, 'skills', 'ph-pdf-to-md', 'scripts');
const FIXTURES = path.join(ROOT, 'test', 'fixtures', 'pdf-to-md');

const has = (cmd, args) => spawnSync(cmd, args, { encoding: 'utf8' }).status === 0;
const PYTHON = ['python3', 'python'].find((p) => has(p, ['-c', 'import sys; sys.exit(sys.version_info < (3, 8))']));
const POPPLER = ['pdftotext', 'pdftocairo'].every((c) => has(c, ['-v']));
const SKIP = !PYTHON ? 'needs Python 3.8 or newer' : !POPPLER ? 'needs poppler (pdftotext, pdftocairo)' : false;

let pdfDir;
function pdfs() {
  if (!pdfDir) {
    pdfDir = tmpDir('ph-pdf-');
    const r = spawnSync(PYTHON, ['-I', path.join(FIXTURES, 'make_pdfs.py'), pdfDir], { encoding: 'utf8' });
    assert.equal(r.status, 0, r.stderr);
  }
  return pdfDir;
}
function verify(pdf, md, ...args) {
  return spawnSync(PYTHON, ['-I', path.join(SCRIPTS, 'verify_markdown.py'), path.join(pdfs(), pdf), md, ...args],
    { encoding: 'utf8' });
}

test('verify_markdown passes the right Markdown of a PDF with ruled tables', { skip: SKIP }, () => {
  const r = verify('report.pdf', path.join(FIXTURES, 'report.md'));
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /^TABLE COLUMNS: \d+ row\(s\) checked against \d+ ruled table\(s\), 0 with cells of several columns$/m);
  assert.match(r.stdout, /^RESULT: PASS$/m);
});

test('verify_markdown fails a table whose cells were put into one column', { skip: SKIP }, () => {
  const r = verify('report.pdf', path.join(FIXTURES, 'report-one-column.md'));
  assert.equal(r.status, 1, r.stdout + r.stderr);
  assert.match(r.stdout, /^TABLE COLUMNS: 42 row\(s\) checked against 3 ruled table\(s\), 42 with cells of several columns$/m);
  assert.match(r.stdout, /^TABLE CELLS holding words of several PDF columns/m);
  assert.match(r.stdout, /line 19: \| Branch Visitors Notes \|/);
  assert.match(r.stdout, /^RESULT: FAIL$/m);
});

function draft(pdf, ...args) {
  const out = path.join(pdfs(), pdf.replace(/\.pdf$/, '.md'));
  const r = spawnSync(PYTHON, ['-I', path.join(SCRIPTS, 'pdf_to_md.py'), path.join(pdfs(), pdf), out, ...args],
    { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stdout + r.stderr);
  return { out, stdout: r.stdout };
}

test('pdf_to_md writes headings, paragraphs, lists and ruled tables as the expected Markdown', { skip: SKIP }, () => {
  const { out, stdout } = draft('report.pdf');
  assert.equal(fs.readFileSync(out, 'utf8'), fs.readFileSync(path.join(FIXTURES, 'report.md'), 'utf8'));
  assert.match(stdout, /^FONTS: body 10 pt; heading sizes 18 pt = #, 14 pt = ##, 12 pt = ###$/m);
  assert.match(stdout, /^FURNITURE left out: "Annual report, Riverside Library" x3, "#" x3$/m);
  assert.match(stdout, /^WARNINGS: 0$/m);
  assert.match(verify('report.pdf', out).stdout, /^RESULT: PASS$/m);
});

test('pdf_to_md keeps heading levels in a page range and warns at a table from the page before', { skip: SKIP }, () => {
  const { out, stdout } = draft('report.pdf', '--pages', '2-3');
  assert.match(fs.readFileSync(out, 'utf8'), /^## 3\. Plans$/m);
  assert.match(stdout, /^ {2}page 2: starts with a table; when it goes on from page 1, join it/m);
  assert.match(verify('report.pdf', out, '--pages', '2-3').stdout, /^RESULT: PASS$/m);
});

test('pdf_to_md warns at text set in columns and writes it in reading order', { skip: SKIP }, () => {
  const { out, stdout } = draft('columns.pdf');
  assert.match(stdout, /^ {2}page 1: text set in columns/m);
  assert.match(verify('columns.pdf', out).stdout, /^RESULT: PASS$/m);
});
