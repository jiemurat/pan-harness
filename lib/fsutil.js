// Small file helpers: listing, copying, hashing and pruning empty folders.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

/** Relative paths ('/' separated) of the files under dir, sorted. */
export function walk(dir) {
  const out = [];
  const rec = (rel) => {
    for (const entry of fs.readdirSync(path.join(dir, rel), { withFileTypes: true })) {
      const r = rel ? `${rel}/${entry.name}` : entry.name;
      if (entry.isDirectory()) rec(r);
      else if (entry.isFile()) out.push(r);
    }
  };
  rec('');
  return out.sort();
}

export function sha256(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

export function writeFile(dst, data) {
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  try {
    if (fs.lstatSync(dst).isSymbolicLink()) fs.unlinkSync(dst); // replace a link, never write through it
  } catch {
    // no file there yet
  }
  fs.writeFileSync(dst, data);
}

/** Remove dir and then its parents while they are empty, never root itself or anything above it. */
export function pruneEmpty(dir, root) {
  let d = path.resolve(dir);
  const stop = path.resolve(root);
  while (d !== stop && d.startsWith(stop + path.sep)) {
    try {
      fs.rmdirSync(d);
    } catch {
      return;
    }
    d = path.dirname(d);
  }
}
