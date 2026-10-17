// Temporary folders and files of the tests: each one is recorded and deleted when the test
// process exits (node --test runs each test file in a process of its own).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const made = [];
process.on('exit', () => {
  for (const p of made) {
    try {
      fs.rmSync(p, { recursive: true, force: true, maxRetries: 3 });
    } catch {
      // a file still in use (Windows) stays behind; the test result does not depend on it
    }
  }
});

/** A new folder in the system's temporary folder, deleted at exit. */
export function tmpDir(prefix) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  made.push(dir);
  return dir;
}

/** A path outside such a folder (a file next to it), deleted at exit. */
export function removeAtExit(p) {
  made.push(p);
  return p;
}
