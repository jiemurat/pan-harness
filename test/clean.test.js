// The repository is the package as it is: no development history (date-shaped
// versions, dates, script names that are not part of the package) and no private details
// (e-mail addresses other than example ones, home folders, long numbers, IP addresses).
// The patterns are built at run time so that this file itself holds none of them.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** Tracked and new (not ignored) files of the checkout, or null outside git. */
function repoFiles() {
  const r = spawnSync('git', ['ls-files', '-z', '--cached', '--others', '--exclude-standard'], { cwd: ROOT, encoding: 'utf8' });
  if (r.status !== 0) return null;
  return [...new Set(r.stdout.split('\0').filter(Boolean))].filter((f) => fs.existsSync(path.join(ROOT, f)));
}

const year = '(?:19|20)\\d\\d';
const RULES = [
  ['date-shaped version', new RegExp(`\\b${year}\\.\\d\\d\\.\\d\\d\\b`)],
  ['date', new RegExp(`\\b${year}-\\d\\d-\\d\\d\\b`)],
  ['private project name', new RegExp(['oc', 'srv'].join('-'), 'i')],
  ['old script name', new RegExp(`\\b(?:pan-harness-check|secret-check)\\.${'py'}\\b`)],
  ['old Standard spelling', new RegExp(`${'Standar'}t: pan-harness`)],
  ['home folder', new RegExp(`(?:/${'home'}/|/${'Users'}/|[A-Z]:\\\\${'Users'}\\\\)`)],
  ['long number', /\d{9,}/],
  ['IP address', /\b\d{1,3}(?:\.\d{1,3}){3}\b/],
];
const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+/g;
const EXAMPLE_DOMAINS = /@(?:example\.(?:com|org|net)|users\.noreply\.github\.com)$/;

test('the repository holds no history markers and no private details', (t) => {
  const files = repoFiles();
  if (!files) {
    t.skip('not a git checkout');
    return;
  }
  const found = [];
  for (const f of files) {
    const text = fs.readFileSync(path.join(ROOT, f), 'utf8');
    text.split('\n').forEach((line, i) => {
      for (const [name, rule] of RULES) if (rule.test(line)) found.push(`${f}:${i + 1}: ${name}: ${line.trim().slice(0, 100)}`);
      for (const m of line.match(EMAIL) || []) {
        if (!EXAMPLE_DOMAINS.test(m)) found.push(`${f}:${i + 1}: e-mail address: ${m}`);
      }
    });
  }
  assert.deepEqual(found.slice(0, 30), [], `${found.length} finding(s)`);
});
