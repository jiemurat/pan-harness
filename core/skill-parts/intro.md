Panoramic Harness (pan-harness for short) is a project's system of knowledge and rules for agents. Any agent and model can read it: everything is plain Markdown, nothing relies on a file or memory of one tool. The agent of each session is new and does not remember the chat before, so everything needed to go on with the project is written in the repo.

The pan-harness works with these five skills of ph-paket (`@jiemurat/pan-harness`):

| Skill | When | Result |
|---|---|---|
| `ph-init` | The project has no pan-harness: the folder is empty or a project is there (an `AGENTS.md`, `CLAUDE.md` or `CONTEXT.md` of another shape may be there) | The profile, the standard structure, rules agreed with the owner, a harness that passed the check |
| `ph-doctor` | A pan-harness is there. Regularly (for example, once a month) or when the owner asks | The conformance table, mechanical fixes, migration to a new standard version, structural proposals |
| `ph-update` | A new version of ph-paket is out | The skills updated, the harness migrated to the new version, a full `ph-doctor` run |
| `ph-grilling` | The planning talk of a large task | Questions round by round, agreed decisions |
| `ph-writing-for-agents` | Writing or editing a skill, `AGENTS.md`, `CLAUDE.md` or another text an agent reads | A text strong and small models follow the same way |

The skills are installed into the project-folder with `npx @jiemurat/pan-harness@latest init` and stay out of git: they are tools, while the project knowledge is in the harness. The owner calls a skill in the agent: `/ph-init` in Claude Code, Antigravity, Cursor, GitHub Copilot, Gemini CLI and OpenCode, `$ph-init` in Codex. The agent works in the project-folder. When a term is unclear, read `references/structure.md` → "Glossary".
