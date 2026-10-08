# Panoramic Harness

[![npm](https://img.shields.io/npm/v/@jiemurat/pan-harness)](https://www.npmjs.com/package/@jiemurat/pan-harness) [![ci](https://github.com/jiemurat/pan-harness/actions/workflows/ci.yml/badge.svg)](https://github.com/jiemurat/pan-harness/actions/workflows/ci.yml)

Panoramic Harness (pan-harness for short) is a set of plain-text rules and knowledge that let any AI coding agent run a project like its owner. The harness is three things in your repository: `AGENTS.md`, `PAN-HARNESS.md` and a `pan-harness/` folder. Any agent and any model can read them; nothing depends on one tool's memory or settings. This package installs four [agent skills](https://agentskills.io) that build and maintain the harness.

| Skill | What it does |
|---|---|
| `ph-init` | Creates the harness: in an empty folder, in an existing code or document project, or next to existing agent files (`AGENTS.md`, `CLAUDE.md`, `.cursor/rules`), which it migrates without losing knowledge |
| `ph-doctor` | Audits the harness against the standard, fixes mechanical issues at once and proposes structural ones |
| `ph-update` | Updates the skills to the newest version, migrates the harness to it and runs a full `ph-doctor` |
| `ph-grilling` | A planning interview in rounds (adapted from [mattpocock/skills](https://github.com/mattpocock/skills), MIT) |
| `ph-writing-for-agents` | How to write any text an agent reads: skills, `AGENTS.md`, prompts (the writing-for-agents skill of [mattpocock/skills](https://github.com/mattpocock/skills), MIT, renamed only) |

## Install

In the project folder:

```bash
npx @jiemurat/pan-harness@latest init
```

It copies the skills to `.agents/skills/` (Codex, Gemini CLI, Antigravity, GitHub Copilot, Cursor, OpenCode, Amp, Cline) and `.claude/skills/` (Claude Code), writes `/ph-*` command files for Gemini CLI and OpenCode, and adds these tool files to `.gitignore`: the skills are tools, the project's knowledge lives in the harness. Then open your agent in the folder and run:

| Agent | Command |
|---|---|
| Claude Code, Antigravity, Cursor, GitHub Copilot, Gemini CLI, OpenCode | `/ph-init` |
| Codex | `$ph-init` |

Other agents: `--agents windsurf,kiro,qwen,goose` (or `--agents all`).

The same skills install with `npx skills add jiemurat/pan-harness`, or as a Claude Code plugin: `/plugin marketplace add jiemurat/pan-harness`, then `/plugin install pan-harness@jiemurat` (the commands are then `/pan-harness:ph-init` and so on).

## What you get

`/ph-init` studies the project, asks its questions in rounds (each with options and a recommendation), shows a plan and builds the harness once you approve it:

```
your-project/
├── AGENTS.md              entry point: the project, boundaries, workflow, rules
├── PAN-HARNESS.md         profile, map of the harness, end-of-task checklist
├── .githooks/pre-commit   runs the harness checks before every commit
└── pan-harness/
    ├── state.md, plan.md, handoff.md         current state, open work, the active task
    ├── decisions.md, feedback.md, lessons.md append-only journals
    ├── history/, archive/                    past work by month, archived entries
    ├── playbooks/pan-harness.md              upkeep steps
    ├── scripts/                              the checks (Node)
    └── project/                              knowledge specific to this project
```

The harness is committed with the project, so every session and every agent starts from the same knowledge. Agents write it by rules made for agent readers (after Matt Pocock's [writing-for-agents](https://github.com/mattpocock/skills/tree/main/skills/productivity/writing-for-agents)): every pointer says what is there and when to read it, every step ends on a checkable condition, rules say what to do, and each concept has one term. `ph-doctor` checks new text against them. The same rules cover every other text an agent reads, such as agent context files, skills and prompts in your product, while texts for people (your README, letters, user guides) are written as you ask or in the document's own language and style, and when neither is clear, the agent uses the language of your conversation and tells you, so you can ask for another.

## Day to day

- `/ph-doctor`, about once a month: checks the harness against the standard, fixes mechanical issues and proposes structural ones.
- `/ph-update` when a new version is out: updates the skills, migrates the harness and runs a full `ph-doctor`. `npx @jiemurat/pan-harness@latest status` shows the installed and the newest version.
- Large tasks are planned with `ph-grilling`: questions in rounds, then a plan you approve.

## Teams and new clones

The skills stay out of git. After cloning, or on another computer, run `npx @jiemurat/pan-harness@latest init` once: the harness itself comes with the repository, and its `AGENTS.md` tells agents to install the skills when they are missing.

## Commands

```
npx @jiemurat/pan-harness@latest <command> [options]

init      install the ph-* skills into this project
update    replace the installed skills with this version (ph-update runs it);
          with --agents, install them for another set of agents
remove    delete the installed skills, command files and .gitignore lines
status    installed version, newest version on npm, files changed by hand

--dir <path>     project folder (default: the current folder)
--agents <list>  agents,claude (default), windsurf, kiro, qwen, goose, all
--no-commands    no /ph-* command files for Gemini CLI and OpenCode
--yes            overwrite or delete files changed by hand without asking
--dry-run        show what would change, write nothing
```

Exit status: 0 done, 1 error, 2 usage error, 3 files changed by hand (rerun with `--yes`).

The CLI writes only inside the skill and command folders it manages (and its block in `.gitignore`), keeps a manifest with a hash of every file, and does not overwrite or delete a file changed by hand without asking. `remove` leaves the harness untouched.

## Good to know

- A full `/ph-init` or `/ph-doctor` run reads the skill's references and your project: plan for roughly 150–300k tokens with a strong model. Small models follow the steps but are less precise in interviews, and the entries they write into the harness can carry an invented fact: in our tests with Claude Haiku 4.5, three of five writing tasks did. Write important entries, such as decisions and rules, with a strong model, or review them.
- Cursor and VS Code read both `.agents/skills/` and `.claude/skills/` and may list each skill twice; use `--agents agents` if you do not use Claude Code.
- No telemetry. The CLI goes online only for `status` (the npm registry); `PH_OFFLINE=1` skips it.
- The checks never print secret values: `secret-check` reports the file, line and pattern name only.

## Language

The skills' instructions are in Uzbek; `ph-grilling` and `ph-writing-for-agents` keep their English upstream text. The harness itself is written in the language the owner picks during `ph-init`. A full guide in Uzbek: [docs/uz.md](docs/uz.md).

## Requirements

Node.js 18 or newer, and git (`ph-init` installs git when it is missing).

## Development

`core/` (references, templates, scripts) and `skills-src/` are the sources. `npm run build` writes `skills/`, which is committed so that `npx skills add` and the Claude Code plugin can use it; `npm run check-build` fails when it is stale. `npm test` runs the CLI, check-script and repository tests; CI runs them on Linux, macOS and Windows with Node 18, 22 and 24.

## License

MIT. `ph-grilling` and `ph-writing-for-agents` come from mattpocock/skills (MIT): see [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
