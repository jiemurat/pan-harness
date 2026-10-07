// The block of .gitignore lines for the installed tool files: skills are tools, not
// project knowledge, so git does not keep them (they are installed again with npx).
import fs from 'node:fs';
import path from 'node:path';

const BEGIN = '# >>> pan-harness tools (npx @jiemurat/pan-harness) >>>';
const END = '# <<< pan-harness tools <<<';

// the line ending the file already uses (CRLF files stay CRLF)
const eolOf = (text) => (text.includes('\r\n') ? '\r\n' : '\n');

function strip(text) {
  const start = text.indexOf(BEGIN);
  if (start < 0) return text;
  const stop = text.indexOf(END, start);
  const after = stop < 0 ? '' : text.slice(stop + END.length).replace(/^\r?\n/, '');
  const before = text.slice(0, start).replace(/(?:\r?\n)+$/, eolOf(text));
  return (before + after).replace(/^(?:\r?\n)+$/, '');
}

export function setBlock(root, lines) {
  const file = path.join(root, '.gitignore');
  const old = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
  const eol = eolOf(old);
  let text = strip(old);
  if (text && !text.endsWith('\n')) text += eol;
  text += `${text ? eol : ''}${[BEGIN, ...lines, END].join(eol)}${eol}`;
  if (text !== old) fs.writeFileSync(file, text);
}

export function removeBlock(root) {
  const file = path.join(root, '.gitignore');
  if (!fs.existsSync(file)) return;
  const old = fs.readFileSync(file, 'utf8');
  const text = strip(old);
  if (text === old) return;
  if (text.trim()) fs.writeFileSync(file, text);
  else fs.rmSync(file);
}
