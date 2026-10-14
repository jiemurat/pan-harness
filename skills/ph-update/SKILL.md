---
name: ph-update
description: Updates ph-paket (Panoramic Harness, @jiemurat/pan-harness), migrates the harness to the new standard version and ends with a full ph-doctor run. Use it when asked to update the pan-harness.
license: MIT
metadata:
  version: "2.7.2"
  package: "@jiemurat/pan-harness"
---

# ph-update

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

## Core rules

While working with a skill, these rules apply even before the target project's rules:

1. **Find the facts yourself, the owner makes the decisions.** Find yourself what the repo, the docs and the live system hold; ask the owner only for decisions and for knowledge the repo lacks. A standard choice with a clear and safe recommendation is taken without a question, shown in the plan, and the owner changes it (P20).
2. **Write only knowledge the repo lacks** (P13): the owner's decisions, the way of working, dangerous places, checked facts. For the README, code, config, `--help`, the folder structure and commands, give a link: a copy goes stale and raises the cost.
3. **Check every claim.** A fact from a doc, a README or an old report is `unverified` until checked. In the report, write `verified` and `unverified` apart.
4. **Never read or print a secret value.** From `.env`, `secrets.*`, key and token files, write only the file and variable names. In place of personal data and confidential documents too, the harness gets a path, an ID and a neutral description.
5. **A big change goes with a plan.** Give work that changes the structure, a rule or the meaning as a plan first and only read until the owner's explicit approval; the preparation of `ph-init` (git, `.gitignore`, the first commit, `README.md` in an empty folder) is part of the command and is done before it. The plan starts with the goal, the outcome and the criteria, the final plan has the exceptions, the budget and (when it does not fit one session) the stages. After the approval the state of the work is kept in `pan-harness/handoff.md`, and at the end each criterion is checked with evidence (P21, P24). A mechanical fix the rules define is done at once (`references/doctor.md`).
6. **Base an option on a principle.** Before giving options on the structure, read `references/principles.md` and say which principle each option rests on. Study a new practice from the internet by the project's rule or at the owner's request.
7. **Measure the size.** Count with `wc -c`; the start set limit is in `references/structure.md` → "Size limits".
8. **Write so that a small model understands it too.** Write the harness text by `references/structure.md` → "Writing" (P26): command form, positive form, completion criterion, one term.
9. **Ask only what only the owner can know.** The goal, the boundaries and the artifact-folder are asked by `references/style-questions.md` → `Asked`; when a task counts as done is agreed in each task's plan, not in the interview; the chat language by the language question (`references/style-questions.md` → `Language question`). The form of address, permissions, the way of working and the commit order (S6, the agent commits) are standard choices: the plan shows them, no answer is waited for; when the owner names one, it goes into `feedback.md` and the rule is updated.
10. **The owner's edits win.** Keep the text the owner changed and build your work on top of it. When it shows a new instruction, write it into the project's `feedback.md`.
11. **An irreversible action only with permission.** Deleting files and rewriting history only on the owner's explicit instruction. The owner pushes: the agent runs a push only when the owner asks for it explicitly, and does not ask about it itself. A commit goes by the project's commit rule (`AGENTS.md` → `Rules`), in `ph-init` by the standard choice of the commit order (S6). When the hook fails, fix the cause: `--no-verify` needs the owner's separate permission for that commit.
12. **Git is always there.** The pan-harness works in git: the history, the checkpoints and telling the owner's changes from the agent's rely on it. Without git, `ph-init` installs and sets it up (`references/structure.md` → "Git"). At the end of each task the agent looks after `.gitignore`.
13. **The skill files are only read:** the skill's author improves the skill. When a defect is found in a skill, follow the skill limitation procedure in `references/doctor.md` → "6. Fix".
14. **Write so that the owner understands.** The owner does not read the harness files: in a question, report, proposal and status, say the meaning. In place of an internal label (a numbered name such as A1, P1, S2, K4; rule, decision, feedback and lesson numbers too) and of a step or section number inside a document, write its content in plain words; explain a term at its first use; a harness section and file name (Working style, Awaiting owner decision, handoff) is a term too: write its content. The numbers of questions and items (1, 2, 3) stay: they make answering easier. Name a file, with a link, when the owner needs to open it or decide by it. The labels stay in the harness files (history entries, `plan.md`, journals). When the owner asks about a label or names it, say its meaning and the label too if needed. Ask a question of `references/style-questions.md` → `Asked` with the text of that table; the number in the `#` column is for the agent. Say a standard choice in the plan in plain words. Write in the chat language; when the owner writes in another language, answer in that one, and for a message that is only a command, take the language from the context. Where a word has several meanings, use the English term, one per concept, explained once: structure, copy, move, migration, state, status, check, verification, test, limit, boundary, estimate, assumption, project, artifact, project-folder, artifact-folder. The project-folder, the artifacts and the artifact-folder are always called by these terms. Write commands, paths, IDs and keys in backticks; short sentences, one idea per item.

## Steps

Updating ph-paket and migrating the harness are one task: at the end a full `ph-doctor` runs every time. The migration rules are in `references/doctor.md` → "3. Migration" and "6. Fix", the steps of the versions in the newly installed `references/changelog.md`. Go to the next step once a step's "Done when" condition holds:

1. **Versions.** Compare three versions:
   - the installed skills: `.agents/skills/.pan-harness.json` or `.claude/skills/.pan-harness.json` → `version` (when installed without the CLI, that skill's `SKILL.md` → `metadata.version`);
   - the newest on npm: `npm view @jiemurat/pan-harness version` (without internet, tell the owner and go on from step 3);
   - the harness standard: `PAN-HARNESS.md` → `Standard:`; an unknown standard (`references/structure.md` → "Glossary") is found here too.

   When the three are the same, go to step 5. Done when: the three versions are known.
2. **Updating ph-paket.** Run `npx @jiemurat/pan-harness@latest update`. When the CLI stops with code 3, skill files were changed by hand: show the list to the owner and, when the owner agrees, run it again with `--yes`. Take the list of changes the CLI prints (`CHANGELOG.md`) into the report. When the skills were installed without the CLI (a plugin or `npx skills`), update them by that route. Done when: the skills are on the new version (`.pan-harness.json` → `version`).
3. **Migration.** From the newly installed skill folder, run `node <skill>/scripts/migrate.mjs --root .`: it carries out the `mechanical` steps of `references/changelog.md`, replaces the scripts and updates the `Standard:` line. Do each item it prints as `by hand` by hand, by that changelog step; the `structural` steps with the owner's approval (with a plan and criteria). When the script stops on an unknown standard (code 3), follow the procedure of `references/doctor.md` → "3. Migration". Done when: each `by hand` item of the first run of `migrate.mjs` is done or in the report, the remaining structural steps are waiting for the owner's approval.
4. **Check.** Run `node pan-harness/scripts/pan-harness-check.mjs` (with `--live` when the project names it) and `node pan-harness/scripts/secret-check.mjs` when the profile lists `secrets`. Done when: 0 errors, `RESULT: clean` with `secrets`.
5. **Full `ph-doctor`.** Run a full `ph-doctor` by `references/doctor.md`: the conformance table, the mechanical fixes at once, the structural proposals with a plan. Done when: the conformance table is ready.
6. **Commit and report.** Commit by the project's commit rule (`AGENTS.md` → `Rules`) and give the report: the versions (old → new), the steps done, the structural steps waiting for the owner's approval, the `ph-doctor` conformance count. Done when: the report is with the owner, the commit is made by that rule.

The agent reads the updated skills at session start: start the next work in a new session.

## Files and when to read them

| File | Contents | When to read |
|---|---|---|
| `references/structure.md` | The pan-harness standard: glossary, profile, files, journals, size limits, writing rules (P26) | At the start of every skill |
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

## Fresh-agent test

Ask the owner about a test every time: which test, which model and the token estimate. Which test to offer when: `references/testing.md` → "When to test"; the owner's standing answer is in the project's `playbooks/pan-harness.md` → `Fresh-agent test`.

## Report

In the owner's language, short and clear: the items are named by their meaning, not by number (the rule in `Core rules` on writing clearly for the owner):
- in work done with a plan, each criterion: ✅ (with evidence), ❌ or ⏳ (when it is checked);
- in work done with a plan, the map of changed components: for each, what changed, whom it affects, the expected cost and quality, how it is turned off or reverted;
- what was done and what was found (with numbers);
- in `ph-doctor`: the count of `ok`, `fail`, `not checked` per section and the defects found in plain language; the full table (with numbers) stays in the history entry;
- `verified` and `unverified` apart;
- the skill limitations (when there are some);
- the questions that need the owner's decision (numbered, with options and a recommendation; the question itself clear, without internal labels);
- the list of changed files, the next step.

Before sending, write the report draft into a temporary file and run three commands:
- `grep -nE '(^|[^[:alnum:]_])[ADFKLPRS][0-9]{1,3}([^[:alnum:]_]|$)' <file>`: replace each label found with its meaning. Done when: the command finds nothing.
- `grep -nE '[A-Za-z0-9_./-]+\.(md|mjs|json)' <file>`: when the owner does not need to open the file or decide by it, write its content in place of the name (for example, "the work plan", "the session state"). Done when: the body keeps only the file names the owner opens or decides by; the other names are in the "changed files" list.
- `grep -nE 'Awaiting owner decision|Later and watch|Working style|Session start|End of task|Changed files|Next step|Accepted warnings' <file>`: replace each harness section name with its content. Done when: the command finds nothing.
