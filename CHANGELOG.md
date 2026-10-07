# Changelog

Versions follow semver. MAJOR: the harness needs migration steps (`ph-update` runs them); MINOR: new features or checks; PATCH: fixes. The steps for each version are in the skills' `references/changelog.md`.

## 1.0.0

First release:

- four agent skills: `ph-init` (an empty folder, an existing project or an existing harness), `ph-doctor`, `ph-update` (updates the package, migrates the harness, then runs a full `ph-doctor`) and `ph-grilling`;
- the CLI: `init`, `update`, `remove`, `status`; skills for Claude Code and for the agents that read `.agents/skills/`, `/ph-*` command files for Gemini CLI and OpenCode, a `.gitignore` block for the tool files;
- the harness checks in Node (`pan-harness-check.mjs`, `secret-check.mjs`) and the pre-commit hook that runs them.
