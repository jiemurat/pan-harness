// ph-humanize on Office files: `extract` writes a .docx file's text one paragraph per line with
// its ID, `apply` writes the edited lines back into the same file. The test files are built here
// from XML strings. Checked: the text taken out again equals the edited text; the XML outside the
// text nodes and every other part of the file stay the same; the refusals leave the file as it was.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { tmpDir } from './tmp.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SCRIPTS = path.join(ROOT, 'skills', 'ph-humanize', 'scripts');
const SCRIPT = path.join(SCRIPTS, 'humanize.mjs');
const { readZip, writeZip } = await import(pathToFileURL(path.join(SCRIPTS, 'office.mjs')).href);
const c = (...codes) => String.fromCodePoint(...codes);
const DASH = c(0x2014);
const RU = c(0x41f, 0x440, 0x438, 0x432, 0x435, 0x442); // a Russian word

function run(args) {
  const r = spawnSync(process.execPath, [SCRIPT, ...args], { encoding: 'utf8' });
  return { code: r.status, out: r.stdout + r.stderr };
}

// --- a .docx built from XML strings

const W = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" '
  + 'xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006"';
const HEAD = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
const t = (text) => `<w:t xml:space="preserve">${text}</w:t>`;
const r = (text, rpr = '') => `<w:r>${rpr ? `<w:rPr>${rpr}</w:rPr>` : ''}${t(text)}</w:r>`;
const p = (inner, ppr = '') => `<w:p>${ppr ? `<w:pPr>${ppr}</w:pPr>` : ''}${inner}</w:p>`;
const B = '<w:b/>';
const I = '<w:i/>';

const BODY = [
  p(r('About the charter'), '<w:pStyle w:val="1"/>'),
  p(r('This project is a ') + r('very important', B) + r(` and innovative step ${DASH} until 2027.`)
    + '<w:r><w:footnoteReference w:id="1"/></w:r>'),
  p(r(`A ${DASH} b`, B) + r(` ${DASH} c`, I) + r(` ${DASH} d`) + r(` ${DASH} e`, B) + r(` ${DASH} f.`, I)),
  p(r(`First item ${DASH} main.`), '<w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr>'),
  `<w:tbl><w:tr><w:tc>${p(r(`Cell text ${DASH} one`))}</w:tc></w:tr></w:tbl>`,
  p(r('See ') + '<w:r><w:fldChar w:fldCharType="begin"/></w:r><w:r><w:instrText> PAGE </w:instrText></w:r>'
    + '<w:r><w:fldChar w:fldCharType="separate"/></w:r>' + r('7') + '<w:r><w:fldChar w:fldCharType="end"/></w:r>'
    + r(' page.')),
  p('<w:r><w:t>Line one</w:t><w:br/><w:t>line two</w:t><w:tab/><w:t>end</w:t>'
    + '<w:sym w:font="Wingdings" w:char="F0E0"/></w:r>', '<w:tabs><w:tab w:val="left" w:pos="720"/></w:tabs>'),
  '<w:p/>',
  p('<w:r><mc:AlternateContent><mc:Choice Requires="wps"><w:drawing><w:txbxContent>'
    + p(r('Box text')) + '</w:txbxContent></w:drawing></mc:Choice><mc:Fallback><w:pict><w:txbxContent>'
    + p(r('Box text')) + '</w:txbxContent></w:pict></mc:Fallback></mc:AlternateContent></w:r>'
    + r('Next to the picture.')),
  p(r('A &amp; B &lt; C')),
  p(r('This paragraph is extra.')),
  p(r(`${RU} ${DASH} ${RU}`)),
].join('');

const PARTS = {
  '[Content_Types].xml': `${HEAD}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">`
    + '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
    + '<Default Extension="xml" ContentType="application/xml"/>'
    + '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>'
    + '<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>'
    + '<Override PartName="/word/footnotes.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footnotes+xml"/>'
    + '</Types>',
  '_rels/.rels': `${HEAD}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">`
    + '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>'
    + '</Relationships>',
  'word/_rels/document.xml.rels': `${HEAD}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">`
    + '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>'
    + '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footnotes" Target="footnotes.xml"/>'
    + '</Relationships>',
  'word/styles.xml': `${HEAD}<w:styles ${W}><w:style w:type="paragraph" w:styleId="1"><w:name w:val="heading 1"/></w:style></w:styles>`,
  'word/footnotes.xml': `${HEAD}<w:footnotes ${W}>`
    + '<w:footnote w:type="separator" w:id="-1"><w:p><w:r><w:separator/></w:r></w:p></w:footnote>'
    + `<w:footnote w:id="1">${p(r(`A note ${DASH} with a dash.`))}</w:footnote></w:footnotes>`,
  'word/document.xml': `${HEAD}<w:document ${W}><w:body>${BODY}<w:sectPr/></w:body></w:document>`,
};

function docx(parts = PARTS) {
  const dir = tmpDir('ph-humanize-office-');
  const file = path.join(dir, 'test.docx');
  fs.writeFileSync(file, writeZip(Object.entries(parts).map(([name, xml]) => ({ name, data: Buffer.from(xml) }))));
  return { dir, file, text: path.join(dir, 'test.txt') };
}

const EXPECTED = [
  '[p1 h1] About the charter',
  `[p2] This project is a very important and innovative step ${DASH} until 2027.`,
  `[p3] A ${DASH} b ${DASH} c ${DASH} d ${DASH} e ${DASH} f.`,
  `[p4 li] First item ${DASH} main.`,
  `[p5 td] Cell text ${DASH} one`,
  '[p6] See 7 page.',
  '[p7] Line one<br>line two\tend<sym>',
  '[p8] Next to the picture.',
  '[p9] A & B < C',
  '[p10] This paragraph is extra.',
  `[p11] ${RU} ${DASH} ${RU}`,
  `[fn1] A note ${DASH} with a dash.`,
];

const lines = (file) => fs.readFileSync(file, 'utf8').split('\n').filter((l) => l.trim());
const part = (file, name) => readZip(fs.readFileSync(file)).find((e) => e.name === name).data.toString('utf8');
// the XML with the text of the text nodes and their xml:space attribute taken out
const shape = (xml) => xml.replace(/<w:t(?: xml:space="preserve")?>[^<]*<\/w:t>|<w:t(?: xml:space="preserve")?\/>/g, '<w:t/>');
const runTexts = (xml) => [...xml.matchAll(/<w:t(?: [^>]*)?>([^<]*)<\/w:t>/g)].map((m) => m[1]);

function edit(text, changes) {
  const out = lines(text).map((l) => {
    const id = l.slice(0, l.indexOf(']') + 1);
    return id in changes ? (changes[id] === null ? id : `${id} ${changes[id]}`) : l;
  });
  fs.writeFileSync(text, `${out.join('\n')}\n`);
}

test('extract writes one paragraph per line with its ID and kind; field codes and text boxes stay out', () => {
  const d = docx();
  const res = run(['extract', d.file, d.text]);
  assert.equal(res.code, 0, res.out);
  assert.deepEqual(lines(d.text), EXPECTED);
});

test('apply with no edit leaves the file byte for byte', () => {
  const d = docx();
  const before = fs.readFileSync(d.file);
  run(['extract', d.file, d.text]);
  const res = run(['apply', d.file, d.text]);
  assert.equal(res.code, 0, res.out);
  assert.match(res.out, /changed: 0/);
  assert.deepEqual(fs.readFileSync(d.file), before);
});

test('apply writes the edits into the runs and keeps the formatting', () => {
  const d = docx();
  const before = fs.readFileSync(d.file);
  run(['extract', d.file, d.text]);
  edit(d.text, {
    '[p2]': 'This project is an important step - until 2027.',
    '[p3]': 'A - b - c - d - e - f.',
    '[p9]': 'A & B < D',
    '[fn1]': 'A note - with a dash.',
  });
  const res = run(['apply', d.file, d.text]);
  assert.equal(res.code, 0, res.out);
  assert.match(res.out, /changed: 4/);

  const again = path.join(d.dir, 'again.txt');
  run(['extract', d.file, again]);
  assert.deepEqual(lines(again), lines(d.text));

  const doc = part(d.file, 'word/document.xml');
  const old = readZip(before).find((e) => e.name === 'word/document.xml').data.toString('utf8');
  assert.equal(shape(doc), shape(old), 'the XML outside the text nodes changed');
  const texts = runTexts(doc);
  assert.ok(doc.includes(`<w:rPr>${B}</w:rPr><w:t xml:space="preserve">important</w:t>`), 'the bold run lost its word');
  for (const s of ['A - b', ' - c', ' - d', ' - e', ' - f.']) assert.ok(texts.includes(s), `run "${s}" missing`);
  assert.ok(doc.includes('A &amp; B &lt; D'));
  assert.ok(part(d.file, 'word/footnotes.xml').includes('A note - with a dash.'));

  const oldParts = new Map(readZip(before).map((e) => [e.name, e.data]));
  for (const e of readZip(fs.readFileSync(d.file))) {
    if (!['word/document.xml', 'word/footnotes.xml'].includes(e.name)) assert.deepEqual(e.data, oldParts.get(e.name), e.name);
  }
});

test('an emptied line removes its paragraph; the only paragraph of a table cell stays, empty', () => {
  const d = docx();
  run(['extract', d.file, d.text]);
  edit(d.text, { '[p10]': null, '[p5 td]': null });
  const res = run(['apply', d.file, d.text]);
  assert.equal(res.code, 0, res.out);
  const doc = part(d.file, 'word/document.xml');
  assert.ok(!doc.includes('This paragraph is extra.'));
  assert.match(doc, /<w:tc><w:p>(?:(?!<\/w:p>).)*<\/w:p><\/w:tc>/);
  assert.equal((doc.match(/<w:p[ >]/g) || []).length + (doc.match(/<w:p\/>/g) || []).length, 13);
  const again = path.join(d.dir, 'again.txt');
  run(['extract', d.file, again]);
  assert.deepEqual(lines(again).map((l) => l.replace(/^\[[^\]]*\] ?/, '')),
    EXPECTED.filter((l) => !l.startsWith('[p10]') && !l.startsWith('[p5 td]')).map((l) => l.replace(/^\[[^\]]*\] ?/, '')));
});

test('apply refuses a joined, split, added or changed protected line and leaves the file', () => {
  const cases = [
    ['a field result changed', (f) => edit(f, { '[p6]': 'See 8 page.' }), /p6/],
    ['a line break removed', (f) => edit(f, { '[p7]': 'Line one line two\tend<sym>' }), /p7/],
    ['two lines joined', (f) => fs.writeFileSync(f, lines(f).filter((l) => !l.startsWith('[p3]')).join('\n')), /p3/],
    ['a line without an ID', (f) => fs.writeFileSync(f, `${lines(f).join('\n')}\nA new sentence.\n`), /ID/],
  ];
  for (const [name, change, message] of cases) {
    const d = docx();
    const before = fs.readFileSync(d.file);
    run(['extract', d.file, d.text]);
    change(d.text);
    const res = run(['apply', d.file, d.text]);
    assert.notEqual(res.code, 0, name);
    assert.match(res.out, message, name);
    assert.deepEqual(fs.readFileSync(d.file), before, name);
  }
});

test('extract refuses tracked changes, an old or encrypted file, and fix and scan refuse an Office file', () => {
  const tracked = docx({ ...PARTS, 'word/document.xml': PARTS['word/document.xml'].replace(
    '<w:p/>', `<w:p><w:ins w:id="9" w:author="A">${r('new')}</w:ins></w:p>`) });
  let res = run(['extract', tracked.file, tracked.text]);
  assert.notEqual(res.code, 0);
  assert.match(res.out, /tracked changes/);

  const old = docx();
  fs.writeFileSync(old.file, Buffer.concat([Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]), Buffer.alloc(504)]));
  res = run(['extract', old.file, old.text]);
  assert.notEqual(res.code, 0);
  assert.match(res.out, /save it as \.docx/);

  const d = docx();
  const before = fs.readFileSync(d.file);
  for (const cmd of ['fix', 'scan']) {
    res = run([cmd, d.file]);
    assert.notEqual(res.code, 0, cmd);
    assert.match(res.out, /extract/, cmd);
  }
  assert.deepEqual(fs.readFileSync(d.file), before);
});

test('scan reads the extracted text: IDs and markers are not counted as words or Markdown marks', () => {
  const d = docx();
  run(['extract', d.file, d.text]);
  const res = run(['scan', d.text]);
  assert.equal(res.code, 0, res.out);
  assert.match(res.out, /list items: 1,/);
  assert.match(res.out, /markdown marks: 0/);
  assert.doesNotMatch(res.out, /"p\d|"br|"sym/);
});

// --- cases found by a review

function withBody(body, extra = {}) {
  return docx({ ...PARTS, ...extra, 'word/document.xml': `${HEAD}<w:document ${W}><w:body>${body}<w:sectPr/></w:body></w:document>` });
}
function applyEdit(d, changes) {
  run(['extract', d.file, d.text]);
  edit(d.text, changes);
  return run(['apply', d.file, d.text]);
}

test('an emptied paragraph is removed only when a paragraph follows it; others are emptied', () => {
  const nested = `<w:tbl><w:tr><w:tc>${p(r('Inner'))}</w:tc></w:tr></w:tbl>`;
  const d = withBody(`<w:tbl><w:tr><w:tc>${p(r('A'))}${nested}${p(r('B'))}</w:tc></w:tr></w:tbl>`
    + p(r('Eq: ') + '<m:oMath xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math"><m:r><m:t>x</m:t></m:r></m:oMath>')
    + p(r('Last')));
  const res = applyEdit(d, { '[p3 td]': null, '[p4]': null });
  assert.equal(res.code, 0, res.out);
  const doc = part(d.file, 'word/document.xml');
  assert.match(doc, /<\/w:tbl><w:p>(?:(?!<\/w:p>).)*<\/w:p><\/w:tc>/, 'the cell must still end with a paragraph');
  assert.ok(doc.includes('<m:oMath'), 'the equation was removed');
});

test('a footnote paragraph that holds the note mark is emptied, not removed', () => {
  const d = docx({ ...PARTS, 'word/footnotes.xml': `${HEAD}<w:footnotes ${W}><w:footnote w:id="1">`
    + p('<w:r><w:footnoteRef/></w:r>' + r(' First note.')) + p(r('Second.')) + '</w:footnote></w:footnotes>' });
  const res = applyEdit(d, { '[fn1]': null });
  assert.equal(res.code, 0, res.out);
  assert.ok(part(d.file, 'word/footnotes.xml').includes('<w:footnoteRef/>'));
});

test('typed <br> text is plain text; new text next to a field result is refused with a clear message', () => {
  let d = withBody(p(r('Use &lt;br&gt; tags here.')) + p(r('Other.')));
  let res = applyEdit(d, { '[p2]': 'Another.' });
  assert.equal(res.code, 0, res.out);
  assert.ok(part(d.file, 'word/document.xml').includes('Use &lt;br&gt; tags here.'));

  d = withBody(p(r('See page ') + '<w:r><w:fldChar w:fldCharType="begin"/></w:r><w:r><w:instrText> PAGE </w:instrText></w:r>'
    + '<w:r><w:fldChar w:fldCharType="separate"/></w:r>' + r('3') + '<w:r><w:fldChar w:fldCharType="end"/></w:r>'));
  const before = fs.readFileSync(d.file);
  res = applyEdit(d, { '[p1]': 'See page 3 now' });
  assert.notEqual(res.code, 0);
  assert.match(res.out, /no run to go into/);
  assert.deepEqual(fs.readFileSync(d.file), before);
});

test('a text file with a byte order mark applies; extract never writes over an existing file', () => {
  const d = docx();
  run(['extract', d.file, d.text]);
  fs.writeFileSync(d.text, `﻿${fs.readFileSync(d.text, 'utf8')}`);
  let res = run(['apply', d.file, d.text]);
  assert.equal(res.code, 0, res.out);
  const before = fs.readFileSync(d.file);
  res = run(['extract', d.file, d.file]);
  assert.notEqual(res.code, 0);
  assert.deepEqual(fs.readFileSync(d.file), before);
});

test('a ">" inside an attribute value does not break the paragraphs', () => {
  const d = withBody(p(r('Alpha')) + p('<w:bookmarkStart w:id="0" w:name="a>b"/>' + r('Beta') + '<w:bookmarkEnd w:id="0"/>'));
  run(['extract', d.file, d.text]);
  assert.deepEqual(lines(d.text).slice(0, 2), ['[p1] Alpha', '[p2] Beta']);
});

// --- PowerPoint

const PA = 'xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" '
  + 'xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" '
  + 'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"';
const REL = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
const ar = (text, rpr = '') => `<a:r><a:rPr lang="en-US"${rpr}/><a:t>${text}</a:t></a:r>`;
const ap = (inner) => `<a:p>${inner}<a:endParaRPr lang="en-US"/></a:p>`;
const sp = (ph, paras) => `<p:sp><p:nvSpPr><p:cNvPr id="2" name="S"/><p:cNvSpPr/><p:nvPr>${ph}</p:nvPr></p:nvSpPr>`
  + `<p:spPr/><p:txBody><a:bodyPr/>${paras}</p:txBody></p:sp>`;
const slide = (shapes) => `${HEAD}<p:sld ${PA}><p:cSld><p:spTree>${shapes}</p:spTree></p:cSld></p:sld>`;
const rels = (list) => `${HEAD}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">`
  + list.map(([id, type, target]) => `<Relationship Id="${id}" Type="${REL}/${type}" Target="${target}"/>`).join('')
  + '</Relationships>';

const PPTX = {
  '[Content_Types].xml': `${HEAD}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">`
    + '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
    + '<Default Extension="xml" ContentType="application/xml"/>'
    + '<Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>'
    + '</Types>',
  '_rels/.rels': rels([['rId1', 'officeDocument', 'ppt/presentation.xml']]),
  // slide2.xml is listed first: the slide order comes from presentation.xml, not the file names
  'ppt/presentation.xml': `${HEAD}<p:presentation ${PA}><p:sldIdLst><p:sldId id="256" r:id="rId3"/>`
    + '<p:sldId id="257" r:id="rId2"/></p:sldIdLst></p:presentation>',
  'ppt/_rels/presentation.xml.rels': rels([['rId2', 'slide', 'slides/slide1.xml'], ['rId3', 'slide', 'slides/slide2.xml']]),
  'ppt/slides/slide2.xml': slide(sp('<p:ph type="ctrTitle"/>', ap(ar(`Results ${DASH} 2026`)))
    + sp('<p:ph idx="1"/>', ap(ar('The team ') + ar('truly excelled', ' b="1"') + ar(` ${DASH} 12 modules.`))
      + ap(ar('Line one') + '<a:br><a:rPr lang="en-US"/></a:br>' + ar('line two'))
      + ap(ar('Slide ') + `<a:fld id="{1}" type="slidenum"><a:rPr lang="en-US"/><a:t>1</a:t></a:fld>`)
      + ap(ar('An extra point.')) + '<a:p><a:endParaRPr lang="en-US"/></a:p>')),
  'ppt/slides/_rels/slide2.xml.rels': rels([['rId1', 'notesSlide', '../notesSlides/notesSlide1.xml']]),
  'ppt/notesSlides/notesSlide1.xml': `${HEAD}<p:notes ${PA}><p:cSld><p:spTree>`
    + sp('<p:ph type="sldImg"/>', '') + sp('<p:ph type="body" idx="1"/>', ap(ar(`Say it ${DASH} slowly.`)))
    + sp('<p:ph type="sldNum" idx="5"/>', ap(`<a:fld id="{2}" type="slidenum"><a:t>1</a:t></a:fld>`))
    + '</p:spTree></p:cSld></p:notes>',
  'ppt/slides/slide1.xml': slide(sp('<p:ph type="title"/>', ap(ar('Second slide')))
    + '<p:graphicFrame><a:graphic><a:graphicData><a:tbl><a:tr><a:tc><a:txBody><a:bodyPr/>'
    + `${ap(ar(`Cell ${DASH} one`))}</a:txBody></a:tc></a:tr></a:tbl></a:graphicData></a:graphic></p:graphicFrame>`),
};

function pptx(parts = PPTX) {
  const dir = tmpDir('ph-humanize-pptx-');
  const file = path.join(dir, 'deck.pptx');
  fs.writeFileSync(file, writeZip(Object.entries(parts).map(([name, xml]) => ({ name, data: Buffer.from(xml) }))));
  return { dir, file, text: path.join(dir, 'deck.txt') };
}

const PPTX_LINES = [
  `[s1p1 h1] Results ${DASH} 2026`,
  `[s1p2] The team truly excelled ${DASH} 12 modules.`,
  '[s1p3] Line one<br>line two',
  '[s1p4] Slide 1',
  '[s1p5] An extra point.',
  `[n1p1] Say it ${DASH} slowly.`,
  '[s2p1 h1] Second slide',
  `[s2p2 td] Cell ${DASH} one`,
];

test('pptx: extract follows the slide order, puts the notes after their slide, and marks titles and cells', () => {
  const d = pptx();
  const res = run(['extract', d.file, d.text]);
  assert.equal(res.code, 0, res.out);
  assert.deepEqual(lines(d.text), PPTX_LINES);
});

test('pptx: apply keeps the runs, removes an emptied paragraph, refuses a changed slide number', () => {
  const d = pptx();
  const before = fs.readFileSync(d.file);
  run(['extract', d.file, d.text]);
  edit(d.text, {
    '[s1p1 h1]': 'Results - 2026',
    '[s1p2]': 'The team excelled - 12 modules.',
    '[s1p5]': null,
    '[n1p1]': 'Say it - slowly.',
    '[s2p2 td]': 'Cell - one',
  });
  let res = run(['apply', d.file, d.text]);
  assert.equal(res.code, 0, res.out);
  const again = path.join(d.dir, 'again.txt');
  run(['extract', d.file, again]);
  assert.deepEqual(lines(again).map((l) => l.replace(/^\[[^\]]*\] ?/, '')),
    ['Results - 2026', 'The team excelled - 12 modules.', 'Line one<br>line two', 'Slide 1', 'Say it - slowly.',
      'Second slide', 'Cell - one']);
  const s = part(d.file, 'ppt/slides/slide2.xml');
  assert.ok(s.includes('<a:rPr lang="en-US" b="1"/><a:t>excelled</a:t>'), 'the bold run lost its word');
  assert.ok(!s.includes('An extra point.'));
  const oldParts = new Map(readZip(before).map((e) => [e.name, e.data]));
  for (const e of readZip(fs.readFileSync(d.file))) {
    if (!['ppt/slides/slide1.xml', 'ppt/slides/slide2.xml', 'ppt/notesSlides/notesSlide1.xml'].includes(e.name)) {
      assert.deepEqual(e.data, oldParts.get(e.name), e.name);
    }
  }

  const d2 = pptx();
  const before2 = fs.readFileSync(d2.file);
  run(['extract', d2.file, d2.text]);
  edit(d2.text, { '[s1p4]': 'Slide 2' });
  res = run(['apply', d2.file, d2.text]);
  assert.notEqual(res.code, 0);
  assert.match(res.out, /s1p4/);
  assert.deepEqual(fs.readFileSync(d2.file), before2);
});

test('pptx: scan reads the slide lines', () => {
  const d = pptx();
  run(['extract', d.file, d.text]);
  const res = run(['scan', d.text]);
  assert.equal(res.code, 0, res.out);
  assert.doesNotMatch(res.out, /"s\d|"n\d/);
});

test('pptx: an embedded macro file type is not the deck type; mc:Choice text, static date text and left-out parts', () => {
  const ctEmbedded = PPTX['[Content_Types].xml'].replace('<Default Extension="xml"',
    '<Default Extension="docm" ContentType="application/vnd.ms-word.document.macroEnabled.12"/><Default Extension="xml"');
  const slide2 = slide(sp('<p:ph type="title"/>', ap(ar('Title')))
    + '<mc:AlternateContent xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006"><mc:Choice Requires="a14">'
    + sp('', ap(ar('Text in the choice shape'))) + '</mc:Choice><mc:Fallback><p:pic/></mc:Fallback></mc:AlternateContent>'
    + sp('<p:ph type="dt" idx="10"/>', ap(ar('Spring term'))) + sp('<p:ph type="sldNum" idx="12"/>', ap('<a:fld id="{3}" type="slidenum"><a:t>2</a:t></a:fld>')));
  const d = pptx({ ...PPTX, '[Content_Types].xml': ctEmbedded, 'ppt/slides/slide2.xml': slide2,
    'ppt/charts/chart1.xml': `${HEAD}<c:chartSpace xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart"/>` });
  const res = run(['extract', d.file, d.text]);
  assert.equal(res.code, 0, res.out);
  assert.deepEqual(lines(d.text).slice(0, 3), ['[s1p1 h1] Title', '[s1p2] Text in the choice shape', '[s1p3] Spring term']);
  assert.match(res.out, /not in the lines.*1 charts/);
});

// --- Excel

const SS = 'xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"';
const XLSX = {
  '[Content_Types].xml': `${HEAD}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">`
    + '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
    + '<Default Extension="xml" ContentType="application/xml"/>'
    + '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'
    + '</Types>',
  '_rels/.rels': rels([['rId1', 'officeDocument', 'xl/workbook.xml']]),
  'xl/workbook.xml': `${HEAD}<workbook ${SS} xmlns:r="${REL}"><sheets><sheet name="Report ${DASH} 2026" sheetId="1" r:id="rId1"/></sheets></workbook>`,
  'xl/_rels/workbook.xml.rels': rels([['rId1', 'worksheet', 'worksheets/sheet1.xml'], ['rId2', 'sharedStrings', 'sharedStrings.xml']]),
  'xl/sharedStrings.xml': `${HEAD}<sst ${SS} count="5" uniqueCount="5">`
    + `<si><t>Revenue ${DASH} total</t></si>`
    + '<si><r><t xml:space="preserve">This is a </t></r><r><rPr><b/></rPr><t>very important</t></r><r><t xml:space="preserve"> result.</t></r></si>'
    + '<si><t>Line one\nline two</t></si>'
    + '<si><t>2026</t></si>'
    + '<si><t>Kanji</t><rPh sb="0" eb="1"><t>reading</t></rPh></si></sst>',
  'xl/worksheets/sheet1.xml': `${HEAD}<worksheet ${SS}><sheetData><row r="1">`
    + '<c r="A1" t="s"><v>0</v></c><c r="B1" t="s"><v>1</v></c><c r="C1" t="s"><v>2</v></c><c r="D1" t="s"><v>3</v></c>'
    + '<c r="E1" t="s"><v>4</v></c><c r="F1"><v>42</v></c>'
    + `<c r="G1" t="str"><f>A1&amp;"x"</f><v>Computed ${DASH} text</v></c>`
    + `<c r="H1" t="inlineStr"><is><t>Inline ${DASH} note</t></is></c></row></sheetData></worksheet>`,
};

function xlsx(parts = XLSX) {
  const dir = tmpDir('ph-humanize-xlsx-');
  const file = path.join(dir, 'book.xlsx');
  fs.writeFileSync(file, writeZip(Object.entries(parts).map(([name, xml]) => ({ name, data: Buffer.from(xml) }))));
  return { dir, file, text: path.join(dir, 'book.txt') };
}

test('xlsx: extract writes each shared text once and the inline texts; numbers, formulas, sheet names stay out', () => {
  const d = xlsx();
  const res = run(['extract', d.file, d.text]);
  assert.equal(res.code, 0, res.out);
  assert.deepEqual(lines(d.text), [
    `[c1] Revenue ${DASH} total`, '[c2] This is a very important result.', '[c3] Line one<br>line two', '[c4] 2026',
    '[c5] Kanji', `[i1c1] Inline ${DASH} note`]);
});

test('xlsx: apply keeps the rich-text runs and the line break; an emptied text stays as an empty entry', () => {
  const d = xlsx();
  const before = fs.readFileSync(d.file);
  run(['extract', d.file, d.text]);
  edit(d.text, {
    '[c1]': 'Revenue - total',
    '[c2]': 'This is an important result.',
    '[c3]': 'Line one<br>line two.',
    '[c5]': null,
    '[i1c1]': 'Inline - note',
  });
  let res = run(['apply', d.file, d.text]);
  assert.equal(res.code, 0, res.out);
  const ss = part(d.file, 'xl/sharedStrings.xml');
  assert.equal((ss.match(/<si>/g) || []).length, 5, 'a shared text entry was removed');
  assert.ok(ss.includes('<rPr><b/></rPr><t>important</t>'), 'the bold run lost its word');
  assert.ok(ss.includes('<t>Line one\nline two.</t>'));
  assert.ok(ss.includes('<rPh sb="0" eb="1"><t>reading</t></rPh>'));
  const sheet = part(d.file, 'xl/worksheets/sheet1.xml');
  assert.ok(sheet.includes(`<v>Computed ${DASH} text</v>`) && sheet.includes('<t>Inline - note</t>'));
  assert.deepEqual(readZip(fs.readFileSync(d.file)).find((e) => e.name === 'xl/workbook.xml').data,
    readZip(before).find((e) => e.name === 'xl/workbook.xml').data);
  const again = path.join(d.dir, 'again.txt');
  run(['extract', d.file, again]);
  assert.deepEqual(lines(again).map((l) => l.replace(/^\[[^\]]*\] ?/, '')),
    ['Revenue - total', 'This is an important result.', 'Line one<br>line two.', '2026', 'Inline - note']);

  const d2 = xlsx();
  const before2 = fs.readFileSync(d2.file);
  run(['extract', d2.file, d2.text]);
  edit(d2.text, { '[c3]': 'Line one line two' });
  res = run(['apply', d2.file, d2.text]);
  assert.notEqual(res.code, 0);
  assert.match(res.out, /c3/);
  assert.deepEqual(fs.readFileSync(d2.file), before2);
});

test('xlsx: prefixed names, an emptied cell with a line break, a locked table header, a drawing note', () => {
  const sst = (body) => `${HEAD}<x:sst xmlns:x="http://schemas.openxmlformats.org/spreadsheetml/2006/main">${body}</x:sst>`;
  const d = xlsx({ ...XLSX,
    'xl/sharedStrings.xml': sst('<x:si><x:t>Hello world</x:t></x:si><x:si><x:t>one\ntwo</x:t></x:si><x:si><x:t>Amount</x:t></x:si>'),
    'xl/tables/table1.xml': `${HEAD}<table ${SS}><tableColumns count="1"><tableColumn id="1" name="Amount"/></tableColumns></table>`,
    'xl/drawings/drawing1.xml': `${HEAD}<xdr:wsDr xmlns:xdr="x" xmlns:a="y"><a:t>Box</a:t></xdr:wsDr>` });
  let res = run(['extract', d.file, d.text]);
  assert.equal(res.code, 0, res.out);
  assert.deepEqual(lines(d.text).slice(0, 3), ['[c1] Hello world', '[c2] one<br>two', '[c3] Amount']);
  assert.match(res.out, /1 drawings with text/);
  edit(d.text, { '[c2]': null });
  res = run(['apply', d.file, d.text]);
  assert.equal(res.code, 0, res.out);
  assert.ok(part(d.file, 'xl/sharedStrings.xml').includes('<x:si><x:t></x:t></x:si>'));

  const d2 = xlsx({ ...XLSX, 'xl/sharedStrings.xml': sst('<x:si><x:t>Amount</x:t></x:si>'),
    'xl/tables/table1.xml': `${HEAD}<table ${SS}><tableColumns count="1"><tableColumn id="1" name="Amount"/></tableColumns></table>` });
  run(['extract', d2.file, d2.text]);
  edit(d2.text, { '[c1]': 'Sum' });
  res = run(['apply', d2.file, d2.text]);
  assert.notEqual(res.code, 0);
  assert.match(res.out, /table or pivot column name/);
});

test('a replaced word keeps the space after it in the next run', () => {
  const d = withBody(p(r('Hello', B) + r(' world')));
  const res = applyEdit(d, { '[p1]': 'Hi world' });
  assert.equal(res.code, 0, res.out);
  assert.ok(part(d.file, 'word/document.xml').includes(`<w:rPr>${B}</w:rPr><w:t xml:space="preserve">Hi</w:t>`));
});

test('a second apply on the same text file works after a line was emptied', () => {
  const d = docx();
  run(['extract', d.file, d.text]);
  edit(d.text, { '[p2]': null });
  let res = run(['apply', d.file, d.text]);
  assert.equal(res.code, 0, res.out);
  edit(d.text, { '[p3 li]': 'First item - main.' });
  res = run(['apply', d.file, d.text]);
  assert.equal(res.code, 0, res.out);
  assert.ok(part(d.file, 'word/document.xml').includes('First item - main.'));
});
