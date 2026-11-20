#!/usr/bin/env node
// Copies the never-list of a ph-nonstop charter into a cycle brief, word for word, and checks it.
//   node never-list.mjs <charter> <brief>
// The never-list is the lines between "<!-- never-list -->" and "<!-- /never-list -->" in the charter.
// A "{{never-list}}" line in the brief is replaced by that block (with its markers). Exit 0 when the
// brief then holds the charter's block unchanged, 1 otherwise (the message says why).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const OPEN = '<!-- never-list -->';
const CLOSE = '<!-- /never-list -->';
const SLOT = '{{never-list}}';

function block(lines, file) {
  const start = lines.indexOf(OPEN);
  const end = lines.indexOf(CLOSE, start + 1);
  if (start < 0 || end < 0) throw new Error(`${file}: no ${OPEN} ... ${CLOSE} block`);
  return lines.slice(start, end + 1);
}

export function fill(charterText, briefText) {
  const charter = block(charterText.replace(/\r\n/g, '\n').split('\n'), 'charter');
  if (!charter.slice(1, -1).some((l) => l.trim())) throw new Error('charter: the never-list is empty');
  let lines = briefText.replace(/\r\n/g, '\n').split('\n');
  const slot = lines.indexOf(SLOT);
  if (slot >= 0) lines = [...lines.slice(0, slot), ...charter, ...lines.slice(slot + 1)];
  const brief = block(lines, 'brief');
  if (brief.join('\n') !== charter.join('\n')) throw new Error('brief: the never-list differs from the charter; put the {{never-list}} line back in its place and run again');
  return { text: lines.join('\n'), count: charter.length - 2 };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const [charterFile, briefFile] = process.argv.slice(2);
  if (!charterFile || !briefFile) {
    console.error('usage: node never-list.mjs <charter> <brief>');
    process.exit(2);
  }
  try {
    const { text, count } = fill(fs.readFileSync(charterFile, 'utf8'), fs.readFileSync(briefFile, 'utf8'));
    fs.writeFileSync(briefFile, text);
    console.log(`never-list: ${count} lines, word for word as in ${charterFile}`);
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}
