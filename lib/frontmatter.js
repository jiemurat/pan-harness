// The YAML subset SKILL.md frontmatter uses: "key: value" lines and one level of
// nested map ("metadata:" followed by indented "key: value" lines).

const unquote = (v) => {
  const s = v.trim();
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    return s.startsWith('"') ? JSON.parse(s) : s.slice(1, -1).replace(/''/g, "'");
  }
  return s;
};

export function parseFrontmatter(text) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(text);
  if (!m) return { data: null, body: text, error: 'no frontmatter (--- block) at the top' };
  const data = {};
  let map = null;
  for (const line of m[1].split(/\r?\n/)) {
    if (!line.trim() || line.trim().startsWith('#')) continue;
    const nested = /^\s+([A-Za-z0-9_.-]+):\s*(.*)$/.exec(line);
    if (nested && map) {
      map[nested[1]] = unquote(nested[2]);
      continue;
    }
    const top = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(line);
    if (!top) return { data: null, body: text, error: `cannot read frontmatter line: ${line}` };
    if (top[2] === '') {
      map = {};
      data[top[1]] = map;
    } else {
      map = null;
      data[top[1]] = unquote(top[2]);
    }
  }
  return { data, body: text.slice(m[0].length), error: null };
}
