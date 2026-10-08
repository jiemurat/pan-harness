# Changelog

Versions follow semver. MAJOR: an older harness fails the new checks until it is migrated; MINOR: new features, checks or added mechanical migration steps (an older harness keeps working); PATCH: fixes. `ph-update` runs the migration steps. The steps for each version are in the skills' `references/changelog.md`.

## 1.2.0

Agent text and human text are kept apart:

- the harness is written by all the writing rules of `runbook.md` → `Writing the harness`; every other text an agent reads (other agents' context files such as `CLAUDE.local.md`, `GEMINI.md`, `.github/copilot-instructions.md`, `.cursor/rules/` and nested `AGENTS.md`, skills, commands, subagents, prompts in the product) by its nine P26 rules, in the language the owner asks for, else in the file's own language, and a new file in the language of the conversation; the harness language and its English terms stay in the harness;
- texts for people (README, project docs, letters, guides, report files) get their language and style from the owner's instruction, else from the document itself or similar documents, else the language of the conversation and a style that fits the kind of document, which the agent tells the owner; no source, file path or ID line unless the owner asks; the chat rule (language, brevity, form of address) covers only the conversation: new rule R23 in the `AGENTS.md` template, R12 limited to the chat;
- `ph-init` asks the form of address as an open question instead of suggesting one, writes the README of an empty folder in the language of the conversation and says so in its plan; the time zone question is about the harness only;
- `ph-doctor` checks the boundary (A64, A65); `pan-harness-check` warns when a 1.2.0 harness has no `**Writing**` rule group;
- `ph-update` adds R23 to a 1.1.0 harness, limits its chat rule to the conversation and updates the `Writing the harness` intro, the runbook map line and the End of task writing item; a chat rule that also sets file text is left for the agent;
- a fifth skill, `ph-writing-for-agents`: Matt Pocock's writing-for-agents skill (MIT, renamed only), the method behind these writing rules; the runbook's writing section points to it, and the project's rules come first; `ph-grilling` takes the newest upstream line, "Word each question so "yes" accepts your recommended answer";
- fixes: the `pan-harness.md` playbook names the skill's `testing.md` without a project path (the check reported it as a missing file), and a ⏳ in the header text of `plan.md` no longer counts as an open item;
- known limitation: in our tests (Claude Haiku 4.5 and Sonnet, a letter, a guide and a prompt each) no harness rule reached a text for people, but the small model's prompt did not follow the writing rules and its letter and guide carried invented facts; review such texts or write them with a strong model.

## 1.1.0

Writing rules for the harness itself (principle P26, after Matt Pocock's [writing-for-agents](https://github.com/mattpocock/skills/tree/main/skills/productivity/writing-for-agents)):

- harness text (`AGENTS.md`, `PAN-HARNESS.md`, `pan-harness/`) is written with context pointers, progressive disclosure and co-location, completion criteria, positive form, leading words, a single source, a source for every fact and no no-ops; the rules apply to new and changed text, older text is adapted when it is touched;
- `handoff.md` keeps the format of an active task at its top, also when no task is active;
- one English term per concept (`structure`, `migration`, `check`, `limit` ...) instead of a word with a glossed term in brackets;
- `pan-harness-check` warns about a glossed term in a new or changed line (`terms`); with `--since COMMIT` it reads the lines changed since that commit and lists each as `REVIEW` with flags for the audit items it may break, and `ph-doctor` gives every flagged line ok or fail (A20, A43, A59–A62);
- the skills, their references and the templates follow the same rules: shorter skill descriptions (1 480 → 832 bytes together), rules that say what to do, a checkable end for every skill step;
- `runbook.md` → `Writing docs` is now `Writing the harness`; `ph-update` migrates a 1.0.0 harness with mechanical steps;
- two skill scripts take the template work off the model: `scaffold.mjs` copies the standard files for `ph-init` (the agent fills the placeholders), `migrate.mjs` applies the mechanical changelog steps for `ph-update` and `ph-doctor` without touching journal entries;
- `pan-harness-check` reports an unapplied `[profile: …]` marker or a template note left at the top of a file;
- known limitation: a small model writes harness text that follows the rules better than with 1.0.0, but it can still add an invented fact (tested with Claude Haiku 4.5); write important entries with a strong model or review them.

## 1.0.0

First release:

- four agent skills: `ph-init` (an empty folder, an existing project or an existing harness), `ph-doctor`, `ph-update` (updates the package, migrates the harness, then runs a full `ph-doctor`) and `ph-grilling`;
- the CLI: `init`, `update`, `remove`, `status`; skills for Claude Code and for the agents that read `.agents/skills/`, `/ph-*` command files for Gemini CLI and OpenCode, a `.gitignore` block for the tool files;
- the harness checks in Node (`pan-harness-check.mjs`, `secret-check.mjs`) and the pre-commit hook that runs them.
