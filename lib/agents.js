// Where agents read project-level skills, and command files for agents whose slash
// menu does not list skills by itself. From each vendor's docs: Codex, Gemini CLI,
// Antigravity, Cursor and VS Code read .agents/skills/; Claude Code reads .claude/skills/;
// Antigravity, Cursor and VS Code also list skills under "/" on their own.

export const TARGETS = {
  agents: { dir: '.agents/skills', label: 'Codex, Gemini CLI, Antigravity, GitHub Copilot, Cursor, OpenCode, Amp, Cline' },
  claude: { dir: '.claude/skills', label: 'Claude Code' },
  windsurf: { dir: '.windsurf/skills', label: 'Windsurf' },
  kiro: { dir: '.kiro/skills', label: 'Kiro' },
  qwen: { dir: '.qwen/skills', label: 'Qwen Code' },
  goose: { dir: '.goose/skills', label: 'Goose' },
};

export const DEFAULT_TARGETS = ['agents', 'claude'];

// agent names people type -> target key
export const ALIASES = {
  codex: 'agents', gemini: 'agents', 'gemini-cli': 'agents', antigravity: 'agents', copilot: 'agents', cursor: 'agents',
  opencode: 'agents', amp: 'agents', cline: 'agents', 'claude-code': 'claude',
};

const tomlString = (s) => `"""\n${s.replace(/\\/g, '\\\\').replace(/"""/g, '\\"""')}\n"""`;
const tomlLine = (s) => JSON.stringify(s);

// Written only together with the .agents/skills target, which these agents read.
export const COMMANDS = {
  gemini: {
    dir: '.gemini/commands',
    file: (skill) => `${skill}.toml`,
    ignore: '.gemini/commands/ph-*.toml',
    render: (skill, description, skillDir) =>
      `description = ${tomlLine(short(description))}\nprompt = ${tomlString(prompt(skill, skillDir, '{{args}}'))}\n`,
  },
  opencode: {
    dir: '.opencode/commands',
    file: (skill) => `${skill}.md`,
    ignore: '.opencode/commands/ph-*.md',
    render: (skill, description, skillDir) =>
      `---\ndescription: ${tomlLine(short(description))}\n---\n${prompt(skill, skillDir, '$ARGUMENTS')}\n`,
  },
};

export const DEFAULT_COMMANDS = ['gemini', 'opencode'];

// the first sentence of the skill description, for one-line command menus
const short = (description) => {
  const first = description.split(/(?<=\.)\s/)[0];
  return first.length <= 160 ? first : `${first.slice(0, 157)}...`;
};

function prompt(skill, skillDir, args) {
  return `\`${skillDir}/${skill}/SKILL.md\` faylini o'qi va undagi ko'rsatmalar bo'yicha ish qil (${skill} skill'i).\n` +
    `Foydalanuvchining qo'shimcha so'zlari: ${args}`;
}

/** Target keys from a --agents value ("claude,codex" or "all"). */
export function parseAgents(value) {
  if (!value) return [...DEFAULT_TARGETS];
  const keys = new Set();
  for (const raw of value.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean)) {
    if (raw === 'all') Object.keys(TARGETS).forEach((k) => keys.add(k));
    else if (TARGETS[raw]) keys.add(raw);
    else if (ALIASES[raw]) keys.add(ALIASES[raw]);
    else throw new Error(`unknown agent '${raw}' - use: ${[...Object.keys(TARGETS), ...Object.keys(ALIASES), 'all'].join(', ')}`);
  }
  return Object.keys(TARGETS).filter((k) => keys.has(k));
}
