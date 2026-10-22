---
name: ph-init
description: Builds a pan-harness (Panoramic Harness) in a project without one: AGENTS.md, PAN-HARNESS.md and pan-harness/, with the owner's goal and rules. Use it when asked to set up agent rules, an AGENTS.md or a harness, also when AGENTS.md, CLAUDE.md or .cursor/rules of another shape are there.
license: MIT
metadata:
  version: "2.10.5"
  package: "@jiemurat/pan-harness"
---

# ph-init

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

The detailed steps and the checklist: `references/init.md`. Go to the next step once a step's "Done when" condition holds:

0. **Situation.** When a harness is there, offer `ph-doctor` or (when the version in `Standard:` differs from the skill's or the harness is on an unknown standard) `ph-update` and stop here. Without a harness, the first message is the language question in three languages (`references/style-questions.md` → `Language question`): from the answer on, the chat, the plan and the report are in the chosen language, the harness in English. When the folder is empty, also ask in the first round of questions (step 3) what the project will be, and after the answer make the minimal structure with `README.md`, `.gitignore` and git. Done when: one of the three situations is found; with a harness, the offer is with the owner; without one, the language is chosen.
1. **Preparation.** Prepare git (`references/init.md` → "1. Preparation"): install, `git init -b main`, `.gitignore`, the first commit; this is part of the command and is done before the plan. Find the existing agent files, the secret files (names only) and the Node version. Done when: `git status` works, `.gitignore` and the first commit are there, the agent and secret files are listed, whether Node is there is known.
2. **Facts.** Study the README and the manifests (the list: `references/init.md` → "2. Facts"): language, stack, how it runs, deploy, live system, confidential data, existing docs; once the profile draft shows `code=yes`, also the fast check, the way to see the result, the dependency file, the runtime pin and the log place. Done when: each fact is written with a `verified` or `unverified` mark, the profile draft is made; with `code=yes`, each of those five is found or marked missing.
3. **Interview.** Ask only the questions of `references/style-questions.md` → `Asked`, after the language question (`references/init.md` → "3. Interview"):
   - round 1: the goal, the outcome and the criteria (P21), near plans; when git has no identity, that too; before asking, read `templates/pan-harness/playbooks/large-task.md.tmpl` → `Planning`;
   - round 2: the boundaries and the artifact-folder, the one folder for the artifacts (the work products, inputs and outputs): options by their type, the owner's own folder name last, never `docs/`;
   - an existing project whose artifacts are not in one folder: their move into it is proposed, and `ph-init` moves no artifact;
   - an existing project: both rounds in one;
   - an empty folder: round 1 also asks what the project will be;
   - each open question: write your proposal; "I don't know" becomes an open issue;
   - style, way of working and precautions are not questions but standard choices (`Standard choices`): the plan shows them, no answer is waited for.

   Done when: each question asked has an answer ("yes" too) or an "I don't know" written as an open issue, the artifact-folder is agreed, the questions are counted (at most 5 in a project without code, a server and secrets; the language question does not count); in an empty folder `README.md` and `.gitignore` are there.
4. **Plan and approval.** Give the owner a short plan (`references/init.md` → "4. Plan"): the goal and the outcome, the final list of criteria, the changes outside the harness, the migration table (only when old content moves), the standard choices grouped, with `code=yes` the checks the agent runs once after the approval, the owner's hand, the risk and the way back. The file list is not in the plan. Write the plan into a temporary file outside the project-folder (`mktemp`), run `LC_ALL=C.UTF-8 wc -lm`, the `grep` commands of `Report` and the harness terms `grep` (`references/init.md` → "4. Plan") on it, then delete the file. Done when: the plan is within 15 lines (up to 3 000 characters), the `grep` results are clean, the temporary file is deleted, the owner approved the plan.
5. **Create.** (`references/init.md` → "5. Create"):
   - when the commit order (S6) is a and the owner has uncommitted changes, put them into the `Pre-init state` commit;
   - run `node <skill>/scripts/scaffold.mjs --root .` (with `--secrets` when the profile lists `secrets`): it copies the standard part, the scripts and the hook, and connects git to the hook;
   - fill the `{{…}}` places, apply the `[profile: …]` marks and delete the template note at the top; the template text stays as it is;
   - write the project's own knowledge into `pan-harness/project/` and the agreed artifact-folder into `AGENTS.md` → `Project`; in an empty folder the artifact-folder stays empty; an agreed move of the artifacts goes into `plan.md` as the first large task; when there is a `CLAUDE.md`, it keeps only the `@AGENTS.md` import;
   - with `code=yes` (items 9 and 10): fill the `Fast check:`, `See the result:` and `Logs:` lines, a missing one with a proposal in `plan.md`; run the fast and the full check once and write the dated result, a failure as a proposal in `plan.md`; turn on `markers`.

   Done when: each standard file is made from its template, `pan-harness-check.mjs` gives no error about `{{…}}`, `[profile: …]` or a template note, the hook is there and git uses it (`core.hooksPath`), the `project/` files are there, `AGENTS.md` names the artifact-folder, each migration table row shows its new place, the owner's uncommitted changes are in the `Pre-init state` commit (with S6 b, the owner said they commit them); with `code=yes`, `Project checks` holds the `Fast check:`, `See the result:` and `Logs:` lines (or a proposal in `plan.md`) and a dated result or the reason it was not run for each check, and `markers` is on.
6. **Check.** Run `node pan-harness/scripts/pan-harness-check.mjs` and, when the profile lists `secrets`, `node pan-harness/scripts/secret-check.mjs`, then check the harness by `references/audit.md` (A58 costs no tokens). When the check gives an error, first compare the file you made with its template. Ask the owner about the fresh-agent test (`references/testing.md`). Done when: 0 errors, `RESULT: clean` with `secrets`, each `fail` row of the audit fixed or in the report, the owner's answer on the test written.
7. **Report.** Give the owner the report: each criterion's result, what was made, which decisions were written, what is `unverified`, the commit numbers (with S6 a, the agent commits the `ph-init` work) and what `git show` shows. Done when: the report is with the owner, each criterion's result with evidence.

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
