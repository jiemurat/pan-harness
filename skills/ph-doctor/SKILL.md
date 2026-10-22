---
name: ph-doctor
description: Checks and fixes the pan-harness (Panoramic Harness) of a project against the standard: a conformance table, mechanical fixes, structural proposals, migration. Use it when asked to check the harness, AGENTS.md or the agent rules, and for the monthly upkeep.
license: MIT
metadata:
  version: "2.10.6"
  package: "@jiemurat/pan-harness"
---

# ph-doctor

Panoramic Harness (pan-harness for short) is a project's system of knowledge and rules for agents. Any agent and model can read it: everything is plain Markdown, nothing relies on a file or memory of one tool. The agent of each session is new and does not remember the chat before, so everything needed to go on with the project is written in the repo.

The pan-harness works with these five skills of the pan-harness package (`@jiemurat/pan-harness`):

| Skill | When | Result |
|---|---|---|
| `ph-init` | The project has no pan-harness: the folder is empty or a project is there (an `AGENTS.md`, `CLAUDE.md` or `CONTEXT.md` of another shape may be there) | The profile, the standard structure, rules agreed with the owner, a harness that passed the check |
| `ph-doctor` | A pan-harness is there. Regularly (for example, once a month) or when the owner asks | The conformance table, mechanical fixes, migration to a new standard version, structural proposals |
| `ph-update` | A new version of the pan-harness package is out | The skills updated, the harness migrated to the new version, a full `ph-doctor` run |
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
7. **Measure the size.** Count with `wc -c`; the start set limit is in `references/settings.md` → "Size limits".
8. **Write so that a small model understands it too.** Write the harness text by `references/structure.md` → "Writing" (P26): command form, positive form, completion criterion, one term.
9. **Ask only what only the owner can know.** The goal, the boundaries and the artifact-folder are asked by `references/style-questions.md` → `Asked`; when a task counts as done is agreed in each task's plan, not in the interview; the chat language by the language question (`references/style-questions.md` → `Language question`). The form of address, permissions, the way of working and the commit order (S6, the agent commits) are standard choices: the plan shows them, no answer is waited for; when the owner names one, it goes into `feedback.md` and the rule is updated.
10. **The owner's edits win.** Keep the text the owner changed and build your work on top of it. When it shows a new instruction, write it into the project's `feedback.md`.
11. **An irreversible action only with permission.** Deleting files and rewriting history only on the owner's explicit instruction. The owner pushes: the agent runs a push only when the owner asks for it explicitly, and does not ask about it itself. A commit goes by the project's commit rule (`AGENTS.md` → `Rules`), in `ph-init` by the standard choice of the commit order (S6). When the hook fails, fix the cause: `--no-verify` needs the owner's separate permission for that commit.
12. **Git is always there.** The pan-harness works in git: the history, the checkpoints and telling the owner's changes from the agent's rely on it. Without git, `ph-init` installs and sets it up (`references/settings.md` → "Git"). At the end of each task the agent looks after `.gitignore`.
13. **The skill files are only read:** the skill's author improves the skill. When a defect is found in a skill, follow the skill limitation procedure in `references/doctor.md` → "6. Fix".
14. **Write so that the owner understands.** The owner does not read the harness files: in a question, report, proposal and status, say the meaning. In place of an internal label (a numbered name such as A1, P1, S2, K4; rule, decision, feedback and lesson numbers too) and of a step or section number inside a document, write its content in plain words; explain a term at its first use; a harness section and file name (Working style, Awaiting owner decision, handoff) is a term too: write its content. The numbers of questions and items (1, 2, 3) stay: they make answering easier. Name a file, with a link, when the owner needs to open it or decide by it. The labels stay in the harness files (history entries, `plan.md`, journals). When the owner asks about a label or names it, say its meaning and the label too if needed. Ask a question of `references/style-questions.md` → `Asked` with the text of that table; the number in the `#` column is for the agent. Say a standard choice in the plan in plain words. Write in the chat language; when the owner writes in another language, answer in that one, and for a message that is only a command, take the language from the context. Where a word has several meanings, use the English term, one per concept, explained once: structure, copy, move, migration, state, status, check, verification, test, limit, boundary, estimate, assumption, project, artifact, project-folder, artifact-folder. The project-folder, the artifacts and the artifact-folder are always called by these terms. Write commands, paths, IDs and keys in backticks; short sentences, one idea per item.

## Steps

The detailed steps: `references/doctor.md`. The goal — the project harness matching the standard and the principles. Go to the next step once a step's "Done when" condition holds:

1. **Preparation.** Read the project's start set (`AGENTS.md`, `PAN-HARNESS.md`, `state.md`, `plan.md`), look at `git status`, compare the versions, find the project steps in `playbooks/pan-harness.md` and `node --version`. Done when: the start set is read, the versions are compared, the playbook steps and the Node version are known.
2. **Scripts.** Run `node pan-harness/scripts/pan-harness-check.mjs --since <commit>` (with the start commit of the new text: `references/audit.md` → "Writing"; when the project script is of an older version, give `--since` to the skill's script: `references/doctor.md` → "2. Scripts"), `node pan-harness/scripts/secret-check.mjs` when the profile lists `secrets`, and the project's status checks (`PAN-HARNESS.md` → `Project checks`). Done when: the result of each script and status check is written in numbers.
3. **Migration.** When the project's version is older than the skill's, run `node <skill>/scripts/migrate.mjs --root .` and do each item it prints as `by hand` by `references/changelog.md`; when the harness is on an unknown standard, follow the procedure of `references/doctor.md` → "3. Migration". Done when: each `by hand` item of the first run is done or in `plan.md`, the `Standard:` line equals the skill version.
4. **Conformance audit.** Check each item of `references/audit.md`, the P26 items by the `REVIEW` list of step 2. Done when: each item is in the conformance table with `ok`, `fail`, `not checked` or `n/a`, each flagged `REVIEW` line in the table with `ok` or `fail` and the reason, the new lines read for A46–A48.
5. **Facts.** Compare the facts and decisions of `references/doctor.md` → "5. Facts" with reality. Done when: each fact in `state.md`, `system-map.md` and `project/` is `verified` or `unverified`, each chosen D is `ok`, `fail` or `not checked` with the reason, the items of `plan.md`, `Remove when` and `handoff.md` are looked at, with the result in the report.
6. **Fix.** A mechanical fix at once, a structural fix with a plan (goal, outcome, criteria) and approval. Done when: each `fail` row is fixed, stands as a proposal in `plan.md` → `Awaiting owner decision` or is in the report as a skill limitation.
7. **Re-check and test.** Run the checks again and ask the owner about the fresh-agent test (`references/testing.md`). Done when: 0 errors, `RESULT: clean` with `secrets`, the owner's answer on the test written.
8. **History entry and report.** Add an entry to the current month's history file and give the report, with each criterion's result when there is a structural fix. Done when: the history entry is there, a D for a structural fix and an F for the owner's new words are written, the report is with the owner.

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
