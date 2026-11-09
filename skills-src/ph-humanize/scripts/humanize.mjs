#!/usr/bin/env node
// The mechanical part of ph-humanize. No dependencies; Node 18 or newer.
//   node humanize.mjs fix <file>   copy the original when git cannot restore it, replace the
//                                  characters an ordinary keyboard cannot type, list the rest
//   node humanize.mjs scan <file>  count the signs that are counts in any language
//   node humanize.mjs extract <office file> <text file>  write the text, one paragraph per line
//                                  with its ID
//   node humanize.mjs apply <office file> <text file>    write the edited lines back into the
//                                  office file, check it and replace it (office.mjs)
// Code blocks, inline code and URLs are never changed. The output is a list for the agent to
// judge, never a score.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { OfficeError, isOfficeFile, extract, apply } from './office.mjs';

const USAGE = 'usage: humanize.mjs fix <file> | scan <file> | extract <office file> <text file> '
  + '| apply <office file> <text file>';

// character -> [replacement, name]
const TABLE = new Map([
  ['—', ['-', 'long dash']],
  ['–', ['-', 'short dash']],
  ['‒', ['-', 'figure dash']],
  ['―', ['-', 'horizontal bar']],
  ['−', ['-', 'minus sign']],
  ['‑', ['-', 'non-breaking hyphen']],
  ['‐', ['-', 'hyphen character']],
  ['“', ['"', 'curly double quote']],
  ['”', ['"', 'curly double quote']],
  ['„', ['"', 'low double quote']],
  ['‟', ['"', 'curly double quote']],
  ['«', ['"', 'angle quote']],
  ['»', ['"', 'angle quote']],
  ['″', ['"', 'double prime']],
  ['‘', ["'", 'curly apostrophe']],
  ['’', ["'", 'curly apostrophe']],
  ['‚', ["'", 'low single quote']],
  ['‛', ["'", 'curly apostrophe']],
  ['‹', ["'", 'single angle quote']],
  ['›', ["'", 'single angle quote']],
  ['′', ["'", 'prime']],
  ['ʻ', ["'", 'turned comma apostrophe']],
  ['ʼ', ["'", 'modifier apostrophe']],
  ['…', ['...', 'ellipsis character']],
  ['•', ['-', 'bullet']],
  ['‣', ['-', 'bullet']],
  ['▪', ['-', 'bullet']],
  ['●', ['-', 'bullet']],
  ['◦', ['-', 'bullet']],
  ['∙', ['-', 'bullet']],
  ['→', ['->', 'arrow']],
  ['⟶', ['->', 'arrow']],
  ['⇒', ['->', 'arrow']],
  ['➔', ['->', 'arrow']],
  ['➜', ['->', 'arrow']],
  ['←', ['<-', 'arrow']],
  ['⟵', ['<-', 'arrow']],
  ['⇐', ['<-', 'arrow']],
  ['↔', ['<->', 'arrow']],
  ['⇔', ['<->', 'arrow']],
  ['×', ['x', 'multiplication sign']],
  ['≈', ['~', 'approximately sign']],
  ['≤', ['<=', 'less-or-equal sign']],
  ['≥', ['>=', 'greater-or-equal sign']],
  ['≠', ['!=', 'not-equal sign']],
]);
const SPACES = new Set([' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ',
  ' ', ' ', ' ', '　']);
const REMOVED = new Set(['​', '‌', '‍', '⁠', '﻿', '­', '️', '︎']);
const KEPT = new Set(['№', '°']); // the numero sign (Russian keyboard), the degree sign
const NOT_EMOJI = new Set(['©', '®', '™']); // copyright, registered, trade mark: listed
const PROTECTED = /```[\s\S]*?(?:```|$)|`[^`\n]*`|https?:\/\/[^\s<>()"']+/g;
const APOSTROPHES = "'’ʻʼ";
const WORD = new RegExp(`[\\p{L}\\p{M}][\\p{L}\\p{M}\\p{N}${APOSTROPHES}-]*`, 'gu');
const LONG_DASHES = /[—–‒―]/g;

const hex = (ch) => `U+${ch.codePointAt(0).toString(16).toUpperCase().padStart(4, '0')}`;
const isStyled = (cp) => (cp >= 0x1d400 && cp <= 0x1d7ff) || (cp >= 0xff01 && cp <= 0xff5e);
const isEmoji = (ch, cp) => (/\p{Extended_Pictographic}/u.test(ch) && !NOT_EMOJI.has(ch))
  || (cp >= 0x1f3fb && cp <= 0x1f3ff) || (cp >= 0x1f1e6 && cp <= 0x1f1ff);
// a combining mark is kept only when it joins the letter before it into one letter (a decomposed
// letter); a free-standing one, such as a stress mark, is listed
const isKept = (ch, cp, prev) => (cp >= 0x20 && cp <= 0x7e) || ch === '\n' || ch === '\t' || ch === '\r'
  || /[\p{L}\p{Sc}]/u.test(ch) || KEPT.has(ch)
  || (/\p{M}/u.test(ch) && [...`${prev}${ch}`.normalize('NFC')].length === 1);

/** The text cut into [text, isProtected] pieces. */
function pieces(text) {
  const out = [];
  let last = 0;
  for (const m of text.matchAll(PROTECTED)) {
    if (m.index > last) out.push([text.slice(last, m.index), false]);
    out.push([m[0], true]);
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push([text.slice(last), false]);
  return out;
}

const lineAt = (text, index) => text.slice(0, index).split('\n').length;

function replaceCharacters(text) {
  const counts = new Map();
  const unknown = new Map();
  let total = 0;
  let offset = 0;
  const count = (name, ch) => {
    const key = `${name} ${hex(ch)}`;
    counts.set(key, (counts.get(key) || 0) + 1);
    total += 1;
  };
  const out = pieces(text).map(([piece, isProtected]) => {
    const start = offset;
    offset += piece.length;
    if (isProtected) return piece;
    let result = '';
    let i = 0;
    let prev = '';
    for (const ch of piece) {
      const cp = ch.codePointAt(0);
      if (TABLE.has(ch)) {
        const [to, name] = TABLE.get(ch);
        result += to;
        count(name, ch);
      } else if (SPACES.has(ch)) {
        result += ' ';
        count('special space', ch);
      } else if (REMOVED.has(ch)) {
        count('invisible character', ch);
      } else if (isStyled(cp)) {
        result += ch.normalize('NFKC');
        count('styled letter', ch);
      } else if (isEmoji(ch, cp)) {
        count('emoji', ch);
      } else {
        if (!isKept(ch, cp, prev)) {
          const key = `${hex(ch)} ${ch}`;
          const entry = unknown.get(key) || { n: 0, lines: new Set() };
          entry.n += 1;
          entry.lines.add(lineAt(text, start + i));
          unknown.set(key, entry);
        }
        result += ch;
      }
      i += ch.length;
      prev = ch;
    }
    return result;
  }).join('');
  return { out, counts, unknown, total };
}

function mixedScriptWords(text) {
  const found = [];
  let offset = 0;
  for (const [piece, isProtected] of pieces(text)) {
    if (!isProtected) {
      for (const m of piece.matchAll(/[\p{L}\p{M}]+/gu)) {
        if (/\p{Script=Latin}/u.test(m[0]) && /\p{Script=Cyrillic}/u.test(m[0])) {
          found.push(`${m[0]} (line ${lineAt(text, offset + m.index)})`);
        }
      }
    }
    offset += piece.length;
  }
  return found;
}

function gitCanRestore(file) {
  const dir = path.dirname(file);
  const base = path.basename(file);
  try {
    execFileSync('git', ['ls-files', '--error-unmatch', '--', base], { cwd: dir, stdio: 'ignore' });
    execFileSync('git', ['diff', '--quiet', 'HEAD', '--', base], { cwd: dir, stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function backup(file) {
  if (gitCanRestore(file)) return 'backup: not needed (the file is in git with no uncommitted change)';
  const ext = path.extname(file);
  const copy = path.join(path.dirname(file), `${path.basename(file, ext)}.before-humanize${ext}`);
  if (fs.existsSync(copy)) return `backup: ${copy} exists from an earlier run, kept`;
  fs.copyFileSync(file, copy);
  return `backup: ${copy}`;
}

function fix(file) {
  const text = fs.readFileSync(file, 'utf8');
  const lines = [backup(file)];
  const { out, counts, unknown, total } = replaceCharacters(text);
  if (out !== text) fs.writeFileSync(file, out);
  lines.push(`characters replaced: ${total}`);
  for (const [key, n] of [...counts].sort((a, b) => b[1] - a[1])) lines.push(`  ${key}: ${n}`);
  if (unknown.size) {
    lines.push('unknown characters (not replaced; decide each):');
    for (const [key, e] of unknown) lines.push(`  ${key} x${e.n} (line ${[...e.lines].join(', ')})`);
  }
  const mixed = mixedScriptWords(out);
  if (mixed.length) {
    lines.push('mixed-script words (replace the odd letters with the word\'s main script):');
    for (const w of mixed) lines.push(`  ${w}`);
  }
  return lines.join('\n');
}

// --- scan

const words = (s) => (s.toLowerCase().match(WORD) || []);
const stats = (xs) => {
  if (!xs.length) return 'none';
  const mean = xs.reduce((a, b) => a + b, 0) / xs.length;
  const sd = Math.sqrt(xs.reduce((a, b) => a + (b - mean) ** 2, 0) / xs.length);
  return `mean ${mean.toFixed(1)}, sd ${sd.toFixed(1)}, cv ${(mean ? sd / mean : 0).toFixed(2)}`;
};
const HEADING = /^\s{0,3}#{1,6}\s/;
const LIST = /^\s*(?:[-*+•]|\d+[.)])\s+/;
const BOLD_LABEL = /^\s*(?:[-*+•]|\d+[.)])\s+\*\*[^*]+\*\*/;
const STRONG = [
  /contentReference/g, /oaicite/g, /turn\d+(?:search|view|news|file)\d*/g, /utm_source=chatgpt\.com/g,
  /【[^】]*†[^】]*】/g, /\[cite:[^\]]*\]/gi,
  /\[\p{Lu}[\p{L} ]{1,30}\](?!\()/gu, /\bX{2,}\b/g, /\bexample\.com\b/g,
];

// A line of `extract` output: "[p12 li] text". Each line is a paragraph of its own; a heading
// line is left out of the counts like a Markdown heading, a list line counts as a list item.
const OFFICE_LINE = /^\[[a-z]+\d+(?:[a-z]+\d+)?(?: ([a-z]+\d*))?\] ?/;
const fromOffice = (raw) => raw.split('\n').map((l) => {
  const m = OFFICE_LINE.exec(l);
  if (!m) return l;
  const text = l.slice(m[0].length).replace(/<br>|<sym>|<nbh>/g, ' ');
  if (/^h\d$/.test(m[1] || '')) return '';
  return `${m[1] === 'li' ? '- ' : ''}${text}\n`;
}).join('\n');

function scan(file) {
  let raw = fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '');
  if (OFFICE_LINE.test(raw.trimStart())) raw = fromOffice(raw);
  const noFences = raw.replace(/```[\s\S]*?(?:```|$)/g, (m) => m.replace(/[^\n]/g, ''));
  const text = noFences.replace(/`[^`\n]*`|https?:\/\/[^\s<>()"']+/g, '');
  const lines = text.split('\n');
  const units = []; // sentences and list items
  const sentences = [];
  const paragraphs = [];
  let para = [];
  const endPara = () => {
    if (para.length) paragraphs.push(para.join(' '));
    para = [];
  };
  let nonBlank = 0;
  let listLines = 0;
  let boldLabels = 0;
  let markdown = (text.match(/\*\*/g) || []).length / 2;
  for (const line of lines) {
    if (!line.trim()) { endPara(); continue; }
    nonBlank += 1;
    if (HEADING.test(line)) { markdown += 1; endPara(); continue; }
    if (/^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/.test(line)) { markdown += 1; endPara(); continue; }
    if (LIST.test(line)) {
      listLines += 1;
      if (BOLD_LABEL.test(line)) boldLabels += 1;
      endPara();
      units.push(line.replace(LIST, ''));
      continue;
    }
    para.push(line.trim());
  }
  endPara();
  for (const p of paragraphs) {
    for (const s of p.split(/(?<=[.!?…])\s+/)) {
      if (words(s).length) { sentences.push(s); units.push(s); }
    }
  }

  const grams = new Map();
  for (const u of units) {
    const w = words(u);
    const seen = new Set();
    for (let n = 2; n <= 4; n++) {
      for (let i = 0; i + n <= w.length; i++) {
        const slice = w.slice(i, i + n);
        if (!slice.some((x) => x.length >= 4)) continue;
        seen.add(slice.join(' '));
      }
    }
    for (const g of seen) grams.set(g, (grams.get(g) || 0) + 1);
  }
  const repeated = [...grams].filter(([, n]) => n >= 3);
  const maximal = repeated.filter(([g, n]) => !repeated.some(([h, m]) => h !== g && m >= n
    && ` ${h} `.includes(` ${g} `)));
  maximal.sort((a, b) => b[1] - a[1] || b[0].split(' ').length - a[0].split(' ').length);

  const edge = (pick) => {
    const m = new Map();
    for (const u of units) {
      const w = words(u);
      if (w.length >= 2) {
        const k = pick(w).join(' ');
        m.set(k, (m.get(k) || 0) + 1);
      }
    }
    return [...m].filter(([, n]) => n >= 3).sort((a, b) => b[1] - a[1]);
  };
  const openings = edge((w) => w.slice(0, 2));
  const endings = edge((w) => w.slice(-2));

  const allWords = units.reduce((a, u) => a + words(u).length, 0);
  const dashes = (text.match(LONG_DASHES) || []).length;
  const strong = [];
  for (const re of STRONG) {
    for (const m of noFences.matchAll(re)) strong.push(`${m[0]} (line ${lineAt(noFences, m.index)})`);
  }

  const out = [`words: ${allWords}, sentences: ${sentences.length}, list items: ${listLines}, `
    + `paragraphs: ${paragraphs.length}`];
  const list = (title, rows) => {
    out.push(`${title}: ${rows.length ? '' : 'none'}`);
    for (const [k, n] of rows.slice(0, 20)) out.push(`  "${k}" x${n}`);
  };
  list('repeated phrases (in 3 or more sentences or items)', maximal);
  list('same openings (first two words, 3 or more)', openings);
  list('same endings (last two words, 3 or more)', endings);
  out.push(`sentence length: ${stats(sentences.map((s) => words(s).length))}`);
  out.push(`paragraph length: ${stats(paragraphs.map((p) => words(p).length))}`);
  out.push(`long dashes per 1000 words: ${allWords ? ((dashes * 1000) / allWords).toFixed(1) : '0.0'}`);
  out.push(`strong signs: ${strong.length ? strong.join('; ') : 'none'}`);
  out.push(`markdown marks: ${Math.floor(markdown)} (a sign only in a text that is not Markdown)`);
  out.push(`list lines: ${listLines} of ${nonBlank} (${nonBlank ? Math.round((listLines * 100) / nonBlank) : 0}%)`);
  out.push(`bold-label items: ${boldLabels}`);
  return out.join('\n');
}

const [cmd, file, textFile] = process.argv.slice(2);
const office = ['extract', 'apply'].includes(cmd);
if (!['fix', 'scan', 'extract', 'apply'].includes(cmd) || !file || (office && !textFile)) {
  console.error(USAGE);
  process.exit(2);
}
if (!fs.existsSync(file) || (cmd === 'apply' && !fs.existsSync(textFile))) {
  console.error(`no such file: ${fs.existsSync(file) ? textFile : file}`);
  process.exit(2);
}
if (!office && isOfficeFile(file)) {
  console.error(`${file} is an Office file: run "humanize.mjs extract ${file} <text file>" first, `
    + 'work on the text file, then "humanize.mjs apply"');
  process.exit(2);
}
try {
  if (cmd === 'extract') console.log(extract(file, textFile));
  else if (cmd === 'apply') console.log(apply(file, textFile));
  else console.log(cmd === 'fix' ? fix(file) : scan(file));
} catch (e) {
  if (!(e instanceof OfficeError)) throw e;
  console.error(e.message);
  process.exit(1);
}
