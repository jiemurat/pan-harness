# Changelog

Versions follow semver. MAJOR: an older harness fails the new checks until it is migrated; MINOR: new features, checks or added mechanical migration steps (an older harness keeps working); PATCH: fixes. `ph-update` runs the migration steps. The steps for each version are in the skills' `references/changelog.md`.

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
