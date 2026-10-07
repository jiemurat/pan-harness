// Checks every skills/<name>/SKILL.md against the Agent Skills specification
// (https://agentskills.io/specification): frontmatter fields and their limits, the name
// matching its folder, and the body size the spec recommends.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseFrontmatter } from '../lib/frontmatter.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ALLOWED = new Set(['name', 'description', 'license', 'compatibility', 'metadata', 'allowed-tools']);
const NAME = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export function validateSkill(dir) {
  const errors = [];
  const warnings = [];
  const name = path.basename(dir);
  const file = path.join(dir, 'SKILL.md');
  if (!fs.existsSync(file)) return { errors: [`${name}: no SKILL.md`], warnings };
  const { data, body, error } = parseFrontmatter(fs.readFileSync(file, 'utf8'));
  if (error) return { errors: [`${name}: ${error}`], warnings };
  for (const key of Object.keys(data)) if (!ALLOWED.has(key)) errors.push(`${name}: frontmatter field '${key}' is not in the specification`);
  if (typeof data.name !== 'string' || !data.name) errors.push(`${name}: name is missing`);
  else {
    if (data.name.length > 64 || !NAME.test(data.name)) errors.push(`${name}: name '${data.name}' - 1-64 lowercase letters, digits and single hyphens`);
    if (data.name !== name) errors.push(`${name}: name '${data.name}' does not match the folder name`);
  }
  if (typeof data.description !== 'string' || !data.description.trim()) errors.push(`${name}: description is missing`);
  else if (data.description.length > 1024) errors.push(`${name}: description is ${data.description.length} characters (max 1024)`);
  if (data.compatibility !== undefined && (typeof data.compatibility !== 'string' || data.compatibility.length > 500)) errors.push(`${name}: compatibility must be 1-500 characters`);
  if (data.metadata !== undefined) {
    if (typeof data.metadata !== 'object') errors.push(`${name}: metadata must be a map`);
    else for (const [k, v] of Object.entries(data.metadata)) if (typeof v !== 'string') errors.push(`${name}: metadata.${k} must be a string`);
  }
  const lines = body.split('\n').length;
  if (lines > 500) warnings.push(`${name}: SKILL.md body has ${lines} lines (the specification recommends under 500)`);
  return { errors, warnings };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const base = path.join(ROOT, 'skills');
  let errors = 0;
  for (const name of fs.readdirSync(base).sort()) {
    const r = validateSkill(path.join(base, name));
    r.errors.forEach((e) => console.log(`ERROR ${e}`));
    r.warnings.forEach((w) => console.log(`WARN  ${w}`));
    errors += r.errors.length;
    if (!r.errors.length) console.log(`ok    ${name}`);
  }
  process.exitCode = errors ? 1 : 0;
}
