## Files and when to read them

| File | Contents | When to read |
|---|---|---|
| `references/structure.md` | The pan-harness standard: glossary, profile, files, journals, writing rules (P26) | At the start of every skill |
| `references/settings.md` | The settings of the standard: git, size limits, history and archive, extensions and `project/check.json`, version | When a step links to it; when writing or checking `project/check.json` or a check extension (`ph-doctor` step 4: A35–A38); on a size warning; before a commit and its history entry |
| `references/audit.md` | The conformance list (A1…): each requirement, its smell, how to check it and the kind of fix | In step 4 of `ph-doctor` and at the end of `ph-init` |
| `references/changelog.md` | The standard versions and the migration steps of each | In `ph-doctor` and `ph-update`, when the project's version differs from the skill's |
| `references/principles.md` | The principles (P1…) and their sources | Before a decision on the structure or a rule |
| `references/style-questions.md` | The language question, the questions for the owner (`Asked`) and the standard choices (S1…) | In the `ph-init` interview and plan |
| `references/init.md` | The `ph-init` steps and checklist | In `ph-init`; in `ph-doctor` when the migration decision and the migration table are needed |
| `references/doctor.md` | The `ph-doctor` steps, migration, the boundary of mechanical and structural fixes, skill limitation | In `ph-doctor` and `ph-update` |
| `references/testing.md` | The test procedures: the fixed question set, the "resume" test, the independent checker and skeptic mode, the simplification experiment, A58 | Before offering a test to the owner (at the end of `ph-init` and `ph-doctor`, after a structural change) |
| `templates/` | The templates of the standard part (`*.tmpl`): the root files, the three playbooks, the git hook (`githooks/pre-commit.tmpl`) | When making files and when `ph-doctor` compares with the templates |
| `scripts/pan-harness-check.mjs` | The structure, profile, section, field, ID, tag, path, size and term check; with `--since` the list of new lines (`REVIEW`, in step 2 of `ph-doctor`); `ph-init` puts its copy into the project | After each harness entry |
| `scripts/secret-check.mjs` | A search for lines that look like secrets (no value is printed). The standard paths: `AGENTS.md`, `PAN-HARNESS.md`, `CLAUDE.md`, `pan-harness/` | Before a commit, when the profile lists `secrets` |
| `scripts/scaffold.mjs` | Copies the standard part and the hook from `templates/` and the scripts from `scripts/` into the project, without touching an existing file | In step 5 of `ph-init` |
| `scripts/migrate.mjs` | Carries out the `mechanical` steps of `changelog.md`, replaces the scripts, updates `Standard:` | In `ph-update` and `ph-doctor`, when the project's version is older |

Run the scripts in place of reading them: `node <skill>/scripts/pan-harness-check.mjs --root <project-folder>`.
