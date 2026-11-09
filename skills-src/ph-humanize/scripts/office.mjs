// Office files for ph-humanize: a zip reader and writer on zlib, the text of a file one paragraph
// per line with its ID, and the edited lines written back into the runs they came from, so the
// formatting stays. No dependencies; Node 18 or newer.
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

export class OfficeError extends Error {}

// --- zip

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

export function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

/** The entries of a zip file: {name, data, and the stored form for an unchanged copy}. */
export function readZip(buf) {
  let eocd = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65557); i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new OfficeError('not a zip file');
  const count = buf.readUInt16LE(eocd + 10);
  let off = buf.readUInt32LE(eocd + 16);
  if (count === 0xffff || off === 0xffffffff) throw new OfficeError('a ZIP64 file is not supported');
  const entries = [];
  for (let n = 0; n < count; n++) {
    if (buf.readUInt32LE(off) !== 0x02014b50) throw new OfficeError('a broken zip directory');
    const flags = buf.readUInt16LE(off + 8);
    const method = buf.readUInt16LE(off + 10);
    const crc = buf.readUInt32LE(off + 16);
    const csize = buf.readUInt32LE(off + 20);
    const nameLen = buf.readUInt16LE(off + 28);
    const extraLen = buf.readUInt16LE(off + 30);
    const commentLen = buf.readUInt16LE(off + 32);
    const local = buf.readUInt32LE(off + 42);
    const nameBuf = Buffer.from(buf.subarray(off + 46, off + 46 + nameLen));
    const name = nameBuf.toString('utf8');
    if (flags & 1) throw new OfficeError(`${name}: an encrypted zip entry`);
    const start = local + 30 + buf.readUInt16LE(local + 26) + buf.readUInt16LE(local + 28);
    const raw = Buffer.from(buf.subarray(start, start + csize));
    let data;
    if (method === 0) data = raw;
    else if (method === 8) data = zlib.inflateRawSync(raw);
    else throw new OfficeError(`${name}: zip method ${method} is not supported`);
    if (crc32(data) !== crc) throw new OfficeError(`${name}: the zip check sum does not match`);
    entries.push({
      name, nameBuf, data, raw, method, crc, flags,
      time: buf.readUInt16LE(off + 12), date: buf.readUInt16LE(off + 14),
    });
    off += 46 + nameLen + extraLen + commentLen;
  }
  return entries;
}

/** A zip file of the entries; an entry read by readZip and not marked `changed` keeps its stored bytes. */
export function writeZip(entries) {
  const locals = [];
  const central = [];
  let offset = 0;
  for (const e of entries) {
    const nameBuf = e.nameBuf || Buffer.from(e.name, 'utf8');
    const keep = e.raw && !e.changed;
    const raw = keep ? e.raw : zlib.deflateRawSync(e.data);
    const method = keep ? e.method : 8;
    const crc = keep ? e.crc : crc32(e.data);
    const flags = (e.flags || 0) & 0x0800; // only the UTF-8 name flag: the sizes stand in the header
    const time = e.time ?? 0;
    const date = e.date ?? 0x21; // the first day of the zip calendar
    const head = Buffer.alloc(30);
    head.writeUInt32LE(0x04034b50, 0);
    head.writeUInt16LE(20, 4);
    head.writeUInt16LE(flags, 6);
    head.writeUInt16LE(method, 8);
    head.writeUInt16LE(time, 10);
    head.writeUInt16LE(date, 12);
    head.writeUInt32LE(crc, 14);
    head.writeUInt32LE(raw.length, 18);
    head.writeUInt32LE(e.data.length, 22);
    head.writeUInt16LE(nameBuf.length, 26);
    const dir = Buffer.alloc(46);
    dir.writeUInt32LE(0x02014b50, 0);
    dir.writeUInt16LE(20, 4);
    dir.writeUInt16LE(20, 6);
    dir.writeUInt16LE(flags, 8);
    dir.writeUInt16LE(method, 10);
    dir.writeUInt16LE(time, 12);
    dir.writeUInt16LE(date, 14);
    dir.writeUInt32LE(crc, 16);
    dir.writeUInt32LE(raw.length, 20);
    dir.writeUInt32LE(e.data.length, 24);
    dir.writeUInt16LE(nameBuf.length, 28);
    dir.writeUInt32LE(offset, 42);
    locals.push(head, nameBuf, raw);
    central.push(dir, nameBuf);
    offset += 30 + nameBuf.length + raw.length;
  }
  const dirBuf = Buffer.concat(central);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(dirBuf.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, dirBuf, end]);
}

// --- formats

const OLE = Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);
const ZIP = Buffer.from([0x50, 0x4b, 0x03, 0x04]);

/** True for a zip-based or an old binary Office file: `fix` and `scan` read only text files. */
export function isOfficeFile(file) {
  const fd = fs.openSync(file, 'r');
  const head = Buffer.alloc(8);
  const n = fs.readSync(fd, head, 0, 8, 0);
  fs.closeSync(fd);
  return (n >= 4 && head.subarray(0, 4).equals(ZIP)) || (n === 8 && head.equals(OLE));
}

// An element inside a run shows in the line as written here; its characters are fixed: the line
// keeps them as they are, and the same characters typed in a line are plain text.
const MARKS = { 'w:br': '<br>', 'w:cr': '<br>', 'w:tab': '\t', 'w:sym': '<sym>', 'w:noBreakHyphen': '<nbh>' };
const hasText = (p) => p.map.some((m, k) => !m.mark && p.S[k].trim() !== '');

// The relationships of one part: id -> {type, name}, with the target as a zip entry name.
function relations(entries, relsName, baseDir) {
  const rels = entries.find((e) => e.name === relsName);
  const out = new Map();
  if (!rels) return out;
  for (const m of rels.data.toString('utf8').matchAll(/<Relationship\b[^>]*>/g)) {
    const [id, type, target] = ['Id', 'Type', 'Target'].map((a) => attr(m[0], a));
    if (!id || !target || attr(m[0], 'TargetMode') === 'External') continue;
    const name = target.startsWith('/') ? target.slice(1) : path.posix.normalize(path.posix.join(baseDir, target));
    out.set(id, { type: type || '', name });
  }
  return out;
}

const DOCX = {
  name: 'Word',
  partsOf: () => [['word/document.xml', 'p'], ['word/footnotes.xml', 'fn'], ['word/endnotes.xml', 'en']],
  paras: new Set(['w:p']), text: 'w:t', cell: 'w:tc', preserve: true,
  ns: 'w:', marks: MARKS, markParent: 'w:r', fields: new Set(['w:fldSimple']),
  // text boxes (written twice, under mc:AlternateContent) and field codes are not part of the lines
  skip: new Set(['mc:AlternateContent', 'w:txbxContent', 'w:instrText', 'w:delInstrText']),
  // a paragraph holding one of these, or an element of another namespace (an equation), is
  // emptied, never removed
  keep: new Set(['w:sectPr', 'w:drawing', 'w:pict', 'w:object', 'w:bookmarkStart', 'w:bookmarkEnd',
    'w:footnoteReference', 'w:endnoteReference', 'w:footnoteRef', 'w:endnoteRef', 'w:commentRangeStart',
    'w:commentRangeEnd', 'w:commentReference', 'w:fldChar', 'w:fldSimple', 'w:ruby', 'w:ptab']),
  tracked: /<w:(?:ins|del|moveFrom|moveTo)[\s>/]/,
  leftOut: [[/^word\/charts\/chart\d+\.xml$/, 'charts'], [/^word\/diagrams\/data\d+\.xml$/, 'SmartArt graphics']],
};

// PowerPoint: the slides in the order of presentation.xml, each followed by its speaker notes.
const PPTX = {
  name: 'PowerPoint',
  partsOf(entries) {
    const pres = entries.find((e) => e.name === 'ppt/presentation.xml');
    const rels = relations(entries, 'ppt/_rels/presentation.xml.rels', 'ppt');
    let slides = [];
    if (pres) {
      for (const m of pres.data.toString('utf8').matchAll(/<p:sldId\b[^>]*>/g)) {
        const rel = rels.get(attr(m[0], 'r:id'));
        if (rel) slides.push(rel.name);
      }
    }
    if (!slides.length) {
      const num = (n) => Number(/(\d+)\.xml$/.exec(n)[1]);
      slides = entries.map((e) => e.name).filter((n) => /^ppt\/slides\/slide\d+\.xml$/.test(n)).sort((a, b) => num(a) - num(b));
    }
    return slides.flatMap((name, k) => {
      const dir = path.posix.dirname(name);
      const notes = [...relations(entries, `${dir}/_rels/${path.posix.basename(name)}.rels`, dir).values()]
        .find((r) => r.type.endsWith('/notesSlide'));
      return notes ? [[name, `s${k + 1}p`], [notes.name, `n${k + 1}p`]] : [[name, `s${k + 1}p`]];
    });
  },
  paras: new Set(['a:p']), text: 'a:t', cell: 'a:tc', preserve: false,
  ns: 'a:', marks: { 'a:br': '<br>' }, markParent: 'a:p', fields: new Set(['a:fld']),
  // mc:Choice may hold the only editable shape; mc:Fallback repeats it as a picture or a copy
  skip: new Set(['mc:Fallback']),
  keep: new Set(['a:fld']),
  // a paragraph of these placeholders that holds only field text (a slide number, a date) is no line
  dropPlaceholders: new Set(['sldNum', 'dt', 'sldImg']),
  // parts whose text the lines leave out; extract names them
  leftOut: [[/^ppt\/charts\/chart\d+\.xml$/, 'charts'], [/^ppt\/diagrams\/data\d+\.xml$/, 'SmartArt graphics']],
  tracked: /(?!)/,
};

// Excel: each shared text once (a text used in several cells is one line), then the inline texts
// of each sheet. Numbers, formulas and their results, and sheet names are not text cells.
const XLSX = {
  name: 'Excel',
  partsOf(entries) {
    const out = entries.some((e) => e.name === 'xl/sharedStrings.xml') ? [['xl/sharedStrings.xml', 'c']] : [];
    const book = entries.find((e) => e.name === 'xl/workbook.xml');
    const rels = relations(entries, 'xl/_rels/workbook.xml.rels', 'xl');
    const sheets = [];
    if (book) {
      for (const m of book.data.toString('utf8').matchAll(/<(?:\w+:)?sheet\b[^>]*>/g)) {
        const rel = rels.get(attr(m[0], 'r:id'));
        if (rel && entries.some((e) => e.name === rel.name)) sheets.push(rel.name);
      }
    }
    return out.concat(sheets.map((name, k) => [name, `i${k + 1}c`]));
  },
  paras: new Set(['si', 'is']), text: 't', cell: null, preserve: true,
  ns: '', marks: {}, markParent: null, fields: new Set(),
  // a shared text is found by its place in the list: it is emptied, never removed
  neverRemove: true,
  // some writers put a prefix on every SpreadsheetML name (x:si, x:t)
  localNames: true,
  // a sheet part is read only when it holds an inline text; most hold only numbers and shared-text indexes
  needs: /<(?:[\w.-]+:)?is[\s>]/,
  // a line break inside a cell is a character of the text; the line shows it as <br>
  newline: true,
  skip: new Set(['rPh', 'phoneticPr']),
  keep: new Set(),
  tracked: /(?!)/,
  trackedPart: /^xl\/revisions\//,
  // a table or pivot column name must equal its header cell: such a text is not changed
  lockedTexts(entries) {
    const names = new Set();
    for (const e of entries) {
      if (!/^xl\/(?:tables\/table|pivotCache\/pivotCacheDefinition)\d+\.xml$/.test(e.name)) continue;
      for (const m of e.data.toString('utf8').matchAll(/<(?:[\w.-]+:)?(?:tableColumn|cacheField)\b[^>]*>/g)) {
        const name = attr(m[0], 'name');
        if (name !== null) names.add(decode(name));
      }
    }
    return names;
  },
  leftOut: [[/^xl\/charts\/chart\d+\.xml$/, 'charts'], [/^xl\/comments\d*\.xml$/, 'comment parts'],
    [/^xl\/diagrams\/data\d+\.xml$/, 'SmartArt graphics'], [/^xl\/drawings\/drawing\d+\.xml$/, 'drawings with text', /<(?:a:)?t>/]],
};

function open(file) {
  const buf = fs.readFileSync(file);
  const base = path.basename(file);
  if (buf.length >= 8 && buf.subarray(0, 8).equals(OLE)) {
    throw new OfficeError(`${base}: an old Office file (.doc, .ppt, .xls) or one with a password; `
      + 'save it as .docx, .pptx or .xlsx without a password and run again');
  }
  if (buf.length < 4 || !buf.subarray(0, 4).equals(ZIP)) throw new OfficeError(`${base}: not an Office file`);
  const entries = readZip(buf);
  const types = entries.find((e) => e.name === '[Content_Types].xml');
  const ct = types ? types.data.toString('utf8') : '';
  let fmt = null;
  if (/wordprocessingml\.(?:document|template)\.main|ms-word\.(?:document|template)\.macroEnabled\.main/.test(ct)) fmt = DOCX;
  else if (/spreadsheetml\.(?:sheet|template)\.main|ms-excel\.(?:sheet|template)\.macroEnabled\.main/.test(ct)) fmt = XLSX;
  else if (/presentationml\.(?:presentation|slideshow|template)\.main|ms-powerpoint\.(?:presentation|slideshow|template)\.macroEnabled\.main/.test(ct)) fmt = PPTX;
  if (!fmt) throw new OfficeError(`${base}: not a Word, PowerPoint or Excel file (.docx, .pptx, .xlsx)`);
  return { entries, fmt };
}

// --- XML

const TOKEN = /<(?:[^>"']|"[^"]*"|'[^']*')*>|[^<]+/g;
const attr = (tag, name) => {
  const m = new RegExp(`\\s${name}="([^"]*)"`).exec(tag);
  return m ? m[1] : null;
};
const decode = (s) => s.replace(/&(?:#x([0-9a-fA-F]+)|#(\d+)|(lt|gt|amp|quot|apos));/g, (_, h, d, n) => {
  if (h) return String.fromCodePoint(parseInt(h, 16));
  if (d) return String.fromCodePoint(Number(d));
  return { lt: '<', gt: '>', amp: '&', quot: '"', apos: "'" }[n];
});
const encode = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function styleNames(entries) {
  const styles = entries.find((e) => e.name === 'word/styles.xml');
  const names = new Map();
  if (!styles) return names;
  for (const m of styles.data.toString('utf8').matchAll(/<w:style\b[^>]*>[\s\S]*?<\/w:style>/g)) {
    const id = attr(m[0].slice(0, m[0].indexOf('>') + 1), 'w:styleId');
    const name = /<w:name\s+w:val="([^"]*)"/.exec(m[0]);
    if (id) names.set(id, (name ? name[1] : id).toLowerCase());
  }
  return names;
}

function kindOf(para, styles) {
  const style = para.style === null ? '' : (styles.get(para.style) || para.style.toLowerCase());
  const h = /^heading ?(\d)$/.exec(style);
  if (h) return `h${h[1]}`;
  if (style === 'title' || ['title', 'ctrTitle'].includes(para.ph)) return 'h1';
  if (para.ph === 'subTitle') return 'h2';
  if (para.outline !== null && para.outline < 9) return `h${para.outline + 1}`;
  if (para.list) return 'li';
  return para.cell ? 'td' : '';
}

/**
 * The paragraphs of one XML part. Each has its line text S, one entry of `map` per UTF-16 unit of
 * S ({slot} for text a line may change; {fixed: true} for a field result, with `mark: true` for an
 * element mark), the token range, and whether it may be removed.
 */
function parsePart(xml, fmt, styles) {
  const toks = xml.match(TOKEN) || [];
  const paras = [];
  const stack = [];
  let skipAt = -1;
  let fields = [];
  let simple = 0;
  let ph = null; // the placeholder type of the PowerPoint shape around the paragraph
  let cur = null;
  for (let i = 0; i < toks.length; i++) {
    const tok = toks[i];
    if (tok[0] !== '<' || tok[1] === '?' || tok[1] === '!') continue;
    const m = /^<(\/?)([^\s/>]+)/.exec(tok);
    const name = fmt.localNames ? m[2].replace(/^[\w.-]+:/, '') : m[2];
    if (m[1]) {
      stack.pop();
      if (skipAt >= 0) {
        if (stack.length === skipAt) skipAt = -1;
        continue;
      }
      if (fmt.fields.has(name)) simple -= 1;
      if (fmt.paras.has(name) && cur && stack.length === cur.depth) {
        cur.end = i;
        paras.push(cur);
        cur = null;
      }
      continue;
    }
    const self = tok.endsWith('/>');
    if (cur && (fmt.keep.has(name) || !name.startsWith(fmt.ns))) cur.removable = false;
    if (skipAt >= 0 || fmt.skip.has(name)) {
      if (!self) {
        if (skipAt < 0) skipAt = stack.length;
        stack.push(name);
      }
      continue;
    }
    if (['p:sp', 'p:graphicFrame', 'p:pic', 'p:cxnSp'].includes(name)) ph = null;
    else if (name === 'p:ph') ph = attr(tok, 'type') || 'body';
    if (fmt.paras.has(name) && !cur) {
      if (self) continue;
      cur = {
        start: i, depth: stack.length, S: '', map: [], slots: [], removable: !fmt.neverRemove, ph,
        style: null, outline: null, list: false, cell: fmt.cell !== null && stack.includes(fmt.cell),
      };
    }
    if (!self) stack.push(name);
    if (!cur) continue;
    if (name === 'w:pStyle') cur.style = attr(tok, 'w:val');
    else if (name === 'w:outlineLvl') cur.outline = Number(attr(tok, 'w:val'));
    else if (name === 'w:numPr') cur.list = true;
    else if (name === 'w:fldChar') {
      const type = attr(tok, 'w:fldCharType');
      if (type === 'begin') fields.push('code');
      else if (type === 'separate' && fields.length) fields[fields.length - 1] = 'result';
      else if (type === 'end') fields.pop();
    } else if (fmt.fields.has(name) && !self) simple += 1;
    else if (name === fmt.text && !self && toks[i + 1] && toks[i + 1][0] !== '<') {
      const real = decode(toks[i + 1]);
      const fixed = simple > 0 || fields.length > 0;
      const slot = { tag: i, tok: i + 1, real, from: cur.S.length };
      let text = '';
      for (const ch of real.split('')) {
        if (fmt.newline && ch === '\n') {
          for (let q = 0; q < 4; q++) cur.map.push({ fixed: true, mark: true, nl: q });
          text += '<br>';
        } else {
          cur.map.push(fixed ? { fixed: true } : { slot });
          text += ch;
        }
      }
      slot.text = text;
      cur.slots.push(slot);
      cur.S += text;
    } else if (fmt.marks[name] && stack[stack.length - (self ? 1 : 2)] === fmt.markParent) {
      for (let k = 0; k < fmt.marks[name].length; k++) cur.map.push({ fixed: true, mark: true });
      cur.S += fmt.marks[name];
    }
  }
  for (const p of paras) {
    p.kind = kindOf(p, styles);
    // removed only when a paragraph follows it in the same parent, so a table cell, a note or the
    // body still ends with a paragraph
    let k = p.end + 1;
    while (k < toks.length && toks[k][0] !== '<') k++;
    const next = k < toks.length ? /^<([^\s/>]+)/.exec(toks[k]) : null;
    const nextName = next && (fmt.localNames ? next[1].replace(/^[\w.-]+:/, '') : next[1]);
    p.removable = p.removable && next !== null && fmt.paras.has(nextName);
  }
  const drop = fmt.dropPlaceholders || new Set();
  const onlyFixed = (p) => p.map.every((m) => m.fixed);
  return { toks, paras: paras.filter((p) => hasText(p) && !(drop.has(p.ph) && onlyFixed(p))) };
}

function load(file) {
  const { entries, fmt } = open(file);
  if (fmt.trackedPart && entries.some((e) => fmt.trackedPart.test(e.name))) {
    throw new OfficeError(`${path.basename(file)}: the file has tracked changes; accept or reject them, save, and run again`);
  }
  const styles = styleNames(entries);
  const parts = [];
  for (const [name, prefix] of fmt.partsOf(entries)) {
    const entry = entries.find((e) => e.name === name);
    if (!entry) continue;
    const xml = entry.data.toString('utf8');
    if (fmt.needs && prefix.startsWith('i') && !fmt.needs.test(xml)) continue;
    if (fmt.tracked.test(xml)) {
      throw new OfficeError(`${path.basename(file)}: the file has tracked changes; accept or reject them `
        + 'in Word (Review), save, and run again');
    }
    const parsed = parsePart(xml, fmt, styles);
    if (fmt.lockedTexts) {
      const locked = fmt.lockedTexts(entries);
      for (const p of parsed.paras) if (locked.has(p.S)) p.locked = true;
    }
    parsed.paras.forEach((p, n) => { p.id = `${prefix}${n + 1}`; });
    parts.push({ entry, prefix, ...parsed });
  }
  const leftOut = (fmt.leftOut || []).map(([re, what, has]) => [entries.filter((e) => re.test(e.name)
    && (!has || has.test(e.data.toString('utf8')))).length, what])
    .filter(([n]) => n).map(([n, what]) => `${n} ${what}`);
  return { entries, fmt, parts, leftOut };
}

const line = (p) => `[${p.id}${p.kind ? ` ${p.kind}` : ''}] ${p.S}`;

/** Writes the file's text to `textFile`, one paragraph per line with its ID. */
export function extract(file, textFile) {
  if (fs.existsSync(textFile)) {
    throw new OfficeError(`${textFile} exists already: give a new path for the text file (an existing one may `
      + 'hold edits or be the Office file itself)');
  }
  const { parts, leftOut } = load(file);
  const lines = parts.flatMap((part) => part.paras.map(line));
  fs.writeFileSync(textFile, `${lines.join('\n')}\n`);
  const note = leftOut.length ? `\nnot in the lines (their text stays as it is; tell the user): ${leftOut.join(', ')}` : '';
  return `lines: ${lines.length}, written to ${textFile}${note}`;
}

// --- writing back

// a word or a sign with the spaces after it: a removed word takes its space along and leaves the
// next run's formatting alone
const WORDS = /[\p{L}\p{M}\p{N}]+\s*|\S\s*|\s+/gu;

/** The changes from a to b as hunks {from, to, insert} over a's UTF-16 positions, by word. */
function diff(a, b) {
  const ta = a.match(WORDS) || [];
  const tb = b.match(WORDS) || [];
  let pre = 0;
  while (pre < ta.length && pre < tb.length && ta[pre] === tb[pre]) pre++;
  let suf = 0;
  while (suf < ta.length - pre && suf < tb.length - pre
    && ta[ta.length - 1 - suf] === tb[tb.length - 1 - suf]) suf++;
  const A = ta.slice(pre, ta.length - suf);
  const Bt = tb.slice(pre, tb.length - suf);
  const n = A.length;
  const m = Bt.length;
  let pos = ta.slice(0, pre).join('').length;
  if (n * m > 20000000) return [{ from: pos, to: pos + A.join('').length, insert: Bt.join('') }];
  const lcs = new Int32Array((n + 1) * (m + 1));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      lcs[i * (m + 1) + j] = A[i] === Bt[j] ? lcs[(i + 1) * (m + 1) + j + 1] + 1
        : Math.max(lcs[(i + 1) * (m + 1) + j], lcs[i * (m + 1) + j + 1]);
    }
  }
  const hunks = [];
  let hunk = null;
  const flush = () => { if (hunk) hunks.push(hunk); hunk = null; };
  let i = 0;
  let j = 0;
  while (i < n || j < m) {
    if (i < n && j < m && A[i] === Bt[j]) {
      flush();
      pos += A[i].length;
      i++;
      j++;
    } else if (j < m && (i === n || lcs[i * (m + 1) + j + 1] >= lcs[(i + 1) * (m + 1) + j])) {
      hunk = hunk || { from: pos, to: pos, insert: '' };
      hunk.insert += Bt[j];
      j++;
    } else {
      hunk = hunk || { from: pos, to: pos, insert: '' };
      hunk.to += A[i].length;
      pos += A[i].length;
      i++;
    }
  }
  flush();
  // a replaced word keeps the letters it starts with ("3" -> "3 now" only adds " now"); only the
  // start: trimming the end too would move a removed space into the next run
  for (const h of hunks) {
    while (h.to > h.from && h.insert && a[h.from] === h.insert[0]) { h.from++; h.insert = h.insert.slice(1); }
    // a replaced word ("Hello " -> "Hi ") keeps the space after it where it was; a removal that
    // starts with a space already takes one space along
    if (h.to > h.from && !/\s/.test(a[h.from])) {
      while (h.to > h.from && h.insert && /\s/.test(a[h.to - 1]) && a[h.to - 1] === h.insert[h.insert.length - 1]) {
        h.to--; h.insert = h.insert.slice(0, -1);
      }
    }
  }
  return hunks;
}

/** The new text of each slot of paragraph p for its new text S2; throws a message for the line. */
function rewrite(p, S2) {
  const before = new Map();
  const after = new Map();
  const deleted = new Set();
  const writable = (k) => k >= 0 && k < p.map.length && !p.map[k].fixed;
  for (const h of diff(p.S, S2)) {
    for (let k = h.from; k < h.to; k++) {
      if (!writable(k)) throw new Error('a field result (such as a page number) or a <br>, <sym>, <nbh> or tab mark changed; keep them as they are');
      deleted.add(k);
    }
    if (!h.insert) continue;
    let at = null;
    if (h.to > h.from) at = [before, h.from];
    else if (writable(h.from - 1)) at = [after, h.from - 1];
    else if (writable(h.from)) at = [before, h.from];
    if (!at) throw new Error('new text right next to a field result or a <br>, <sym>, <nbh> or tab mark has no run to go into; change only the words around it');
    at[0].set(at[1], (at[0].get(at[1]) || '') + h.insert);
  }
  return p.slots.map((slot) => {
    let out = '';
    for (let k = slot.from; k < slot.from + slot.text.length; k++) {
      const m = p.map[k];
      const ch = m.nl === undefined ? p.S[k] : (m.nl === 0 ? '\n' : '');
      out += (before.get(k) || '') + (deleted.has(k) ? '' : ch) + (after.get(k) || '');
    }
    return out;
  });
}

function setSlot(toks, slot, text, fmt) {
  toks[slot.tok] = encode(text);
  if (fmt.preserve && /^\s|\s$|\s\s/.test(text) && !/\sxml:space=/.test(toks[slot.tag])) {
    toks[slot.tag] = toks[slot.tag].replace(/^<([^\s/>]+)/, '<$1 xml:space="preserve"');
  }
}

function readLines(textFile) {
  const out = [];
  const lines = fs.readFileSync(textFile, 'utf8').replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').split('\n');
  lines.forEach((l, n) => {
    if (!l.trim()) return;
    const m = /^\[([a-z]+\d+(?:[a-z]+\d+)?)[^\]]*\] ?(.*)$/s.exec(l);
    if (!m) {
      throw new OfficeError(`line ${n + 1} has no ID: "${l.slice(0, 60)}". Keep each paragraph on its own `
        + 'line with its ID: never split or add a line');
    }
    out.push({ id: m[1], text: m[2] });
  });
  return out;
}

/** Writes the edited lines of `textFile` back into `file`, checks the result, then replaces the file. */
export function apply(file, textFile) {
  const { entries, fmt, parts } = load(file);
  const paras = parts.flatMap((part) => part.paras.map((p) => ({ p, part })));
  const lines = readLines(textFile);
  const known = new Map(paras.map((x, n) => [x.p.id, n]));
  const seen = new Set();
  let last = -1;
  for (const l of lines) {
    if (!known.has(l.id)) throw new OfficeError(`[${l.id}] is not a line of this file: keep the IDs as extract wrote them`);
    if (seen.has(l.id)) throw new OfficeError(`[${l.id}] stands twice: never split or copy a line`);
    if (known.get(l.id) < last) throw new OfficeError(`[${l.id}] moved: keep the lines in their order`);
    seen.add(l.id);
    last = known.get(l.id);
  }
  const missing = paras.filter((x) => !seen.has(x.p.id)).map((x) => x.p.id);
  if (missing.length) {
    throw new OfficeError(`missing lines: ${missing.map((id) => `[${id}]`).join(', ')}. Never join or `
      + 'remove a line; empty a line (keep its ID) to remove its paragraph');
  }

  const byId = new Map(lines.map((l) => [l.id, l.text]));
  const errors = [];
  const keeps = new Map(); // paragraph -> whether it still has text after the edit
  let changed = 0;
  let removed = 0;
  for (const { p, part } of paras) {
    const S2 = byId.get(p.id);
    if (S2 === p.S) continue;
    changed += 1;
    try {
      if (p.locked) throw new Error('this text is a table or pivot column name: change it in Excel, or leave the line as it was');
      if (!S2.trim() && fmt.neverRemove && !p.map.some((m) => m.fixed && !m.mark)) {
        p.slots.forEach((slot) => { if (slot.real !== '') setSlot(part.toks, slot, '', fmt); });
        keeps.set(p, false);
        continue;
      }
      if (!S2.trim() && !p.removable && p.map.some((m) => m.fixed)) {
        throw new Error('this paragraph cannot be removed (the last one in its box or cell, or one with a field or a mark); keep its field text and marks');
      }
      if (!S2.trim() && p.removable) {
        for (let k = p.start; k <= p.end; k++) part.toks[k] = '';
        keeps.set(p, false);
        removed += 1;
        continue;
      }
      const texts = rewrite(p, S2);
      p.slots.forEach((slot, n) => { if (texts[n] !== slot.real) setSlot(part.toks, slot, texts[n], fmt); });
      const fixedText = p.map.some((m, k) => m.fixed && !m.mark && p.S[k].trim());
      keeps.set(p, fixedText || texts.some((t) => t.trim()));
    } catch (e) {
      errors.push(`[${p.id}]: ${e.message}`);
    }
  }
  if (errors.length) throw new OfficeError(`nothing written; fix these lines and run again:\n${errors.join('\n')}`);
  if (!changed) return 'changed: 0 (the file is left as it was)';

  for (const part of parts) {
    const xml = part.toks.join('');
    if (xml !== part.entry.data.toString('utf8')) {
      part.entry.data = Buffer.from(xml, 'utf8');
      part.entry.changed = true;
    }
  }
  const target = fs.realpathSync(file);
  const tmp = path.join(path.dirname(target), `.${path.basename(target)}.humanize-tmp`);
  fs.writeFileSync(tmp, writeZip(entries), { mode: fs.statSync(target).mode });
  try {
    const expected = paras.filter(({ p }) => keeps.get(p) ?? true).map(({ p }) => byId.get(p.id));
    const saved = load(tmp).parts;
    const got = saved.flatMap((part) => part.paras.map((p) => p.S));
    const bad = expected.findIndex((s, n) => s !== got[n]);
    if (bad >= 0 || got.length !== expected.length) {
      throw new OfficeError(`the check after writing failed at line ${bad + 1}; the file is left as it was`);
    }
    fs.renameSync(tmp, target);
    // the IDs after a removed or emptied line move up: the text file follows the saved file, so a
    // later edit and apply (the answers of the questions) find their lines
    fs.writeFileSync(textFile, `${saved.flatMap((part) => part.paras.map(line)).join('\n')}\n`);
  } finally {
    if (fs.existsSync(tmp)) fs.rmSync(tmp);
  }
  return `changed: ${changed} (paragraphs removed: ${removed}); the file is checked and saved; `
    + `${textFile} now holds its lines with their new IDs`;
}
