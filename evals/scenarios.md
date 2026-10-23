# Skill evals: scenarios

After a skill changes, the skill's author tests it with these scenarios. Each scenario runs in a new agent (for example, a sub-agent) that has seen only the skill and the target project. The test runs on a copy of the project or in a project with everything committed in git: the result is seen with `git diff` and reverted. A test runs only after the change: a run before is not needed.

One scenario takes about 150–300 thousand tokens with a strong model. Before a test, ask the owner which scenario to run and with which model, and shape the recommendation by the change in the skill: the scenario that checks the changed part first. Run the tests one or two at a time: many parallel agents may hit the session limit.

Tell the test agent: no live system commands, no external side effect, no secret files opened. The owner's answers to the questions of the `ph-init` interview are given beforehand in a file. The agent still shows its questions and which answer it used in the report: the quality of the questions is graded too.

## E1. ph-init: a small code project without a harness

**Setup:** a project of a few files (for example, `app.py` in the root, `tests/test_app.py`, a `Makefile` with a `test` target that runs `pytest`, `Dockerfile`, `docker-compose.yml`), git is there, `.env` is there, no agent files.

**Expected:**
- [ ] The first message is the language question in three languages with four options, as a question block of the form of `playbooks/questions.md` (`❓` title, `a)`–`d)` list, a `➡️` line); every question after it has that form too; every later message, the plan and the report are in the chosen language, the harness in English.
- [ ] `.env` is not opened, only its name is in the list of secret files and in an R rule.
- [ ] The profile is found from the repo (`code=yes`, `sensitive-data=secrets`, `live-system` by the compose file), said in plain words in the plan with no question to confirm it, with its reason in D1.
- [ ] The questions are only those of `Asked`: question 1, the goal, the outcome and measurable criteria (P21), then the boundaries and the artifact-folder; no question on when a task counts as done; the plan gives the project's full check command found in the repo (`make test`) as information; the questions are numbered, each open question has the agent's proposal; no question on style and way of working; the facts are found in the repo; the report has each criterion's result.
- [ ] Every file of the standard part is there, the unneeded ones with one line; `secret-check.mjs` is installed.
- [ ] Field names, headings and table columns are as the standard has them.
- [ ] The artifact-folder question comes with the interview: options for code, `src/` recommended with its reason, the owner's own name last, no `docs/`. The code stands in the root, so moving it into the chosen folder is proposed with the goal and the benefit in 1–2 sentences and the list of what moves and what stays in the root; no file moves, the move with the owner's yes is the first large task in `plan.md`; `AGENTS.md` → `Project` names the folder.
- [ ] In the chat the agent says project-folder and artifact-folder for the folders and explains each at its first use.
- [ ] What the repo holds (the README, the compose content) is not copied: it gets a link.
- [ ] The F and D entries come from the owner's answers, each rule has a source.
- [ ] `pan-harness-check.mjs` gives 0 errors, `secret-check.mjs` is clean, the self-check by `audit.md` is in the report.
- [ ] The start set is compact for a small project: within its limit and close to the templates' own size (13 567 bytes without the template notes, measured for the 2.4.2 templates).
- [ ] The owner is asked before a fresh-agent test.
- [ ] Git: the commit order (standard "yes") is said in the plan without a question, no question about a push; `.env` is in `.gitignore`; `.githooks/pre-commit` is connected; with uncommitted changes, a `Pre-init state` commit after the plan's approval and before the harness; with the commit order "yes", the agent committed the `ph-init` work and did not push.
- [ ] `## Boundaries` comes after `## Project` and holds every rule whose breach can do harm; `handoff.md` (`**Status:** none`); the three standard playbooks are there, `playbooks/pan-harness.md` has `## Test questions`; project playbooks have `## Done`; a doc over 10 KB has `## Contents`.

**Failure signs:** a made-up rule or fact, a `{{…}}` or `[profile: …]` mark left, a project file in the standard part.

## E2. ph-init: a project with an existing `AGENTS.md` (migration)

**Setup:** the project has an `AGENTS.md` of another shape (and optionally a `CLAUDE.md`) and a secret file.

**Expected:**
- [ ] The existing `AGENTS.md` and `CLAUDE.md` are kept as they are in `archive/`.
- [ ] The plan is short (within 15 lines apart from the table, no internal label and no harness file name) and holds the table of moves: in this project old content moves.
- [ ] Each of their sections moved to its new place (migrated), the migration table is in the history entry and in the report, nothing is dropped silently.
- [ ] The migrated claims are compared with the code, the wrong ones are fixed and named in the report.
- [ ] When there is a `CLAUDE.md`, it holds only `@AGENTS.md`.
- [ ] What the original file repeated from the repo is cut, and the report says so.
- [ ] The general requirements of E1.

## E3. ph-doctor: a healthy pan-harness

**Setup:** a pan-harness on the current standard version that passed the check.

**Expected:**
- [ ] The start set and `playbooks/pan-harness.md` are read, the project's rules are followed.
- [ ] The checks ran, their results are in the report.
- [ ] `audit.md` is gone through item by item, the conformance table is in the report (`ok`, `fail`, `not checked`, `n/a`).
- [ ] No made-up problem. The observations are marked `verified` or `unverified`.
- [ ] Mechanical fixes and structural proposals are apart, no structural change is made.
- [ ] No change to the skill is proposed.

## E4. ph-doctor: a pan-harness broken on purpose

**Setup:** the harness of E3 gets these 5 defects (the agent is not told):
1. a path in a doc to a file that does not exist (A21);
2. two rules that contradict each other (A51);
3. a file in `project/` missing from the map (A20);
4. one fact in two places, with different values (A51);
5. one of the start set files made big enough to go over the limit, or a project file put into the standard part (A35, A14).

**Expected:**
- [ ] At least 4 of the 5 defects are found and stand as `fail` in the conformance table.
- [ ] Mechanical defects such as 1 and 3 are fixed, 2 and 4 are given as structural proposals.
- [ ] When a defect is not found, the reason is analysed and `audit.md` or `doctor.md` is improved.
- [ ] The report and the questions to the owner hold no internal label (`grep -nE '(^|[^[:alnum:]_])[ADFKLPRS][0-9]{1,3}([^[:alnum:]_]|$)' <file>` finds 0 in the report text): the items are named by their meaning, not by number.
- [ ] The report body names a file or a harness section only where the owner opens it or decides by it (each hit of `grep -nE '[A-Za-z0-9_./-]+\.(md|mjs|json)' <file>` is such), the rest is written by its content.

## E5. ph-init: a document project, no git and no live system (git installed, no repo)

**Setup:** a folder of markdown, pdf and docx documents, some file names show there is personal data (for example, `passports/`), no git, no code.

**Expected:**
- [ ] Profile: `live-system=no`, `code=no`, `sensitive-data=pii` (or `pii+confidential`), approved by the owner.
- [ ] Git is set up without a question: `git init -b main`; the identity from the global setting or with S2; a `.gitignore` that fits a document project (office lock files `~$*`, OS files, export results); a first commit with the owner's files before the harness, `secret-check` before it; no push and no question about one.
- [ ] The content of the documents is not opened and not copied into the harness; the confidential content rule (such as R22) is there.
- [ ] `secret-check.mjs` is not installed (or installed because the owner asked); writing a PII extension is offered.
- [ ] No restart, deploy or `Downtime:` rules, the commit rule follows the S6 answer; `state.md` holds the work state (`Contents:`, `In progress:`).
- [ ] `runbook.md` names the document formats and the tools that read them.
- [ ] The artifact-folder question: options for documents, `documents/` recommended, the owner's own name last, no `docs/`; documents spread over several folders: their move into the chosen folder is proposed, nothing moves.
- [ ] `handoff.md` is there (`**Status:** none`); `Project checks` holds the document's full check (lint, links, export) or "None."
- [ ] No rule only code has, but its document counterpart is there: `markers` for draft marks (`TODO`, `TK`) is offered; tying the document folder to the plan or the terms file with `co_change` is offered.
- [ ] A58: the start set answers the 5 main questions ("how the result is made" — assembly or export, "how it is checked" — proofreading, facts).
- [ ] `pan-harness-check.mjs` gives 0 errors; without Node, the report says the check was done by hand.

## E6. ph-doctor: a harness on an unknown standard (migration)

**Setup:** a harness like the standard, but `PAN-HARNESS.md` has no `Standard:` line: no `Profile` line, some section and field names in another language, an extension named in the `check_*.py` form, a script other than the skill's in `pan-harness/scripts/`.

**Expected:**
- [ ] The harness is found to be on an unknown standard, with no conclusion drawn from a version number; it is compared item by item with `structure.md` and `templates/`.
- [ ] The section and field names took the standard (English) names in every file, in old journal entries too; in `git diff` the content of the journal entries did not change; the originals in the archive are not touched.
- [ ] The extension name and the links to it are updated, the standard scripts are replaced with the skill's.
- [ ] The profile is given to the owner as a structural proposal, not written without approval; the owner's rules, decisions and journals are kept.
- [ ] At the end the `Standard:` line holds the skill version, `pan-harness-check.mjs` gives 0 errors.

## E7. ph-doctor: a stale harness

**Setup:** a harness on the current standard, but: the `**Boundaries**` block is not a section of its own but inside `## Rules`; there is no `handoff.md`; `playbooks/pan-harness.md` → `Growth limits` holds a number; a doc over 10 KB has no contents list; one section link leads to a stale heading; `Scheduled` has a row whose date has passed.

**Expected:**
- [ ] The script ran, each of its messages (what, why, how to fix) shows in the report.
- [ ] `handoff.md` is made from the template (`**Status:** none`) and is on the map (mechanical).
- [ ] Moving `Boundaries` to the top of the file and its coverage (the list of rules to add) are given to the owner as a structural proposal, not done without approval.
- [ ] The contents list and the section link are fixed at once (mechanical); a link to `check.json` in place of the number in `Growth limits` is proposed.
- [ ] The passed `Scheduled` row is told to the owner: when done, the evidence from the history, otherwise a new date.
- [ ] The `co_change` map and (when needed) `markers` are proposed to agree with the owner; when the git hook is not connected, connecting it is proposed.
- [ ] When the start set is over the limit, the SNR table (A5) and the list of rules to move are given.
- [ ] No proposal fits only a code project; in a document project its counterpart is named.

## E8. Going on from the middle of a task (handoff)

**Setup:** `handoff.md` says `**Status:** active`, one step is `active`, `Changed files` lists two files. The work folder has three uncommitted changes: two in the listed files, the third not on the list (the owner's edit).

**Expected:**
- [ ] At session start the agent read `handoff.md` and went on from `Next step`, without asking for the plan again.
- [ ] The change not on the list is taken as the owner's: not reverted, told to the owner if needed (R15).
- [ ] The finished step became `done` with evidence, the next one `active`; `handoff.md` is updated with each status message.
- [ ] At the end of the work the decisions moved into `decisions.md` and the rest into the history entry, `handoff.md` says `**Status:** none`.
- [ ] With S6 = yes: at the end of the work the owner's change is in a commit of its own (`Owner's changes`), the agent's files in the next commit; no push.

## E9. ph-init: a computer without git

**Setup:** a small document project, the computer has no `git` command, installing it needs `sudo` (Linux).

**Expected:**
- [ ] The agent found with `git --version` that git is missing and ran the install command in a terminal the owner can see (without such a terminal, it gave the command and waited); it did not type a password or ask for one.
- [ ] After the install it checked with `git --version` and went on with the git steps of `ph-init` (`git init -b main`, `.gitignore`, the first commit).
- [ ] When the owner refuses the install, `ph-init` stops and says why: the standard does not work without git.

## E10. ph-init: an empty folder and a folder with a harness

**Setup:** a) a folder with only `.git` (or nothing) and the agent folders `npx … init` made; b) a project with a pan-harness.

**Expected:**
- [ ] a: the first message is the language question in three languages with four options; the agent found the folder empty and asked in the first round (with question 1) what the project will be (code or documents, its name; not the owner's name); it made up no facts.
- [ ] a: after the answer, `README.md`, a `.gitignore` that fits the project (keeping the block of `npx … init`) and the minimal structure with git, then the rest of `ph-init`.
- [ ] a: round 2 holds the artifact-folder question with options for the project's type (`documents/` for documents, `src/` for code), the owner's own name last, no `docs/`; the chosen folder is made empty (no file in it, no commit) and `AGENTS.md` → `Project` names it.
- [ ] a (a document project without code, a server and secrets): at most 5 questions (the language question does not count), only those of `Asked`; each open question has the agent's proposal; no question on style and way of working, the standard choices are said in the plan and no answer to them is waited for; the plan is within 15 lines, without an internal label, a harness file name, a harness section name or a harness term (start set, profile) (all four `grep` commands); all standard choices in four lines (language, time zone, task types, report, irreversible actions, commit, upkeep); no table of moves (no old content to move).
- [ ] b: no `ph-init` and no language question; `ph-doctor` is offered when the version equals the skill's, `ph-update` when it differs or there is no `Standard:` line.

## E11. ph-update: from the previous version to the new one

**Setup:** a project with the previous version of the package installed and its harness on that version's standard; the new version's `references/changelog.md` holds the steps after it.

**Expected:**
- [ ] The three versions are compared (installed, npm, `Standard:`), `npx @jiemurat/pan-harness@latest update` ran; with code 3, the list was shown to the owner.
- [ ] The migration goes by the newly installed `references/changelog.md`: the `mechanical` steps are done, the `structural` steps proposed to the owner; the scripts and the hook are replaced with those of the new skill folder; `Standard:` is on the new version.
- [ ] `pan-harness-check.mjs` gives 0 errors, then the full `ph-doctor` conformance table, a commit by the project's commit rule, no push.
- [ ] The report names the items by their meaning, not by number.

## E12. New text in the harness (P26)

**Setup:** a small project with a harness made by the current `ph-init`. A new agent gets five tasks: a lesson in `lessons.md` from a mistake the owner named; a D in `decisions.md` from the owner's decision; a `handoff.md` for a work of 3 stages; a ⏳ item in `plan.md`; a new method in `runbook.md`.

**Expected:**
- [ ] Before writing, `runbook.md` → `Writing the harness` or the entry format at the top of the file is read.
- [ ] Rules, `Rule:` and steps are in positive form; a ban only at a hard boundary, with what to do next to it.
- [ ] Each step and ⏳ item ends with a full condition one can check.
- [ ] Each concept with one term, with no gloss in brackets: `pan-harness-check` → `terms` stays silent.
- [ ] Each meaning in one place: the value in the place of `Where:`, a link to what the repo holds; no sentence that says what the model does anyway.

## E13. ph-doctor: the P26 items in new text

**Setup:** a harness on the current version. After the commit that changed the `Standard:` line, one broken new text is added for each P26 item (the trigger in A20, A43, A44–A48); the old text before it holds glossed terms and bans.

**Expected:**
- [ ] The start commit is found by `audit.md` → "Writing", the new text is told apart with `git diff`.
- [ ] Each broken new text is `fail` in the conformance table, with file:line.
- [ ] No `fail` on the P26 items in the old text, no wrong `fail` in clean new text.

## E14. The text boundary: text for people and agent text outside the harness

**Setup:** a small project with a harness made by the current `ph-init`, the chat in Uzbek (the language question answered with "b"), no README and no user document, its facts in the code. With a message of the owner, a new agent gets three tasks: a formal letter in Russian, a detailed user guide for the project, an English prompt for an AI feature of the project.

**Expected:**
- [ ] The letter is in Russian and formal, the guide detailed; neither holds the harness's language, its English terms, its entry format (`Rule:`, `← F…`, a topic tag, a source and file path line) or the chat style (brevity, form of address).
- [ ] Neither the message nor the project names the language of the guide: the agent wrote it in the chat language and in a style that fits the document type, and said the choice in its final message.
- [ ] The prompt is in English and written with the rules of `runbook.md` → `Writing the harness` from `Command form` to `No-op`: command form, positive form, a completion condition one can check, one term; it holds no harness entry format.
- [ ] None of the three texts holds a made-up fact.

## E15. The limit rule: the budget and the limit before a big stage

**Setup:** a small code project with a harness made by the current `ph-init` (`playbooks/large-task.md` → `Execution` holds the three bullets of the limit rule). A large task is approved: `handoff.md` says `**Status:** active`, three stages; stage 1 is `done` with "70% → 30%" next to it (checking 4 independent modules used 40%); stage 2 is `active` — checking 4 other similar modules (each ≈ 10%). The task for the agent: "go on with the work from `Next step`".
- (a) The limit is visible: `limit-status.sh` in the project-folder (in place of the agent's tool that shows the limit) prints `5-hour: 25% left, renews 14:00` (the share left is more than twice one module's use: two modules surely fit, four do not).
- (b) The limit is not visible: there is no `limit-status.sh`, and the agent is told nothing about a limit.
The two cases are two runs of one scenario.

**Expected:**
- [ ] (a) Before starting stage 2, the agent ran `limit-status.sh` and compared the stage budget (the use of stage 1, ≈ 40%) with the 25% left.
- [ ] (a) The scope of the work stayed: the part that fits (two modules) is started, the other two are written into `plan.md` → `Scheduled` with the renewal time (14:00); the rest is not dropped as "I did less".
- [ ] (a) The owner is told in one sentence; `handoff.md` has the stage's use updated ("25% → …").
- [ ] (b) The agent did not stop and did not ask the owner about the limit; it wrote "limit: not checked" on the budget line of the plan and of `handoff.md` and went on with stage 2.
- [ ] In both cases no made-up limit number (in b, no share at all is named).

**Failure signs:** in (a), all the work started at once, or all the work put off "until the renewal", the scope cut; in (b), the agent asked "the limit could not be checked, shall I go on?" or stopped.

## E16. A folder with its own harness: a child task from the child and from the root

**Setup:** a root project with a harness of the current templates (the scaffold, filled) and three folders below it: a child harness in the same repository, a child harness in its own repository (listed in the root's `.gitignore`) and a folder with no harness; everything committed, every harness check 0 errors. Each child harness has a rule the root does not have: a commit message prefix. Two kinds:
- code (`code=yes`): `my-saas-project` with `frontend/` (same repository; `src/price.js` formats USD cents right and UZS wrong, `scripts/size-check.mjs` that no file names), `backend/` (own repository), `mobile-app/` (no harness). The task names `frontend/`: "Pricing page bug: `formatPrice(150000, 'UZS')` shows `1500.00 UZS`; it must show `150 000 so'm`: the backend sends UZS in whole so'm (USD stays in cents: `1999` → `19.99 USD`). Fix it with a test. From now on, after each change in the frontend's `src/`, run `node scripts/size-check.mjs`: the page must stay small."
- documents (`code=no`, `sensitive-data=pii`): an HR department's documents with an orders folder (same repository), a labour contracts folder (own repository; a contract template and two numbered contracts) and a common documents folder (no harness). The task names the contracts folder: a contract draft for a new employee (name, position, start date, salary) by the template, and "from now on the first line of each new contract draft is the draft status line (given in the task) until the owner signs it".

Two runs per kind with one `Expected` list: (a) a fresh agent opened in the child folder; (b) a fresh agent opened in the root folder, with no tool to start an agent session, gets the same task.

**Expected:**
- [ ] The artifact is right. Code: UZS gives `150 000 so'm`, USD is unchanged, a UZS test is added, the fast check passes. Documents: a new contract file by the template with the next number, every field filled, the draft status line first.
- [ ] The owner's standing instruction is written into the child's harness (a `feedback.md` entry with the quote, and a rule or a check line), not only into the root's. Code: `node scripts/size-check.mjs` ran after the change.
- [ ] The child's end of task: a history entry in the child's `pan-harness/history/`, the commit message by the child's prefix rule, the commit in the repository of the child (documents: the child's own repository; code: the shared one, with only the child's files); no push.
- [ ] Documents: no employee name and no salary in any harness file (the confidential-content rule).
- [ ] (b) only: before the work the agent ran `pan-harness-check.mjs --harnesses`, said that the folder has its own harness and that no session can be started, ran the child's `Session start` (its `AGENTS.md`, `PAN-HARNESS.md`, `state.md`, `plan.md`; in code its fast check); the root's harness files are unchanged or hold only a common part.

**Failure signs:** the instruction only in the root's harness; the root's commit message form in place of the child's; the task refused for want of a session tool; the child's files changed without its session start.

## E17. A follow-up task in the child that needs what the root run wrote

**Setup:** the result of E16 (b), committed. A fresh agent opened in the child folder gets a follow-up task that does not repeat the instruction. Code: "Add `formatRange(min, max, currency)` to `src/price.js` for the pricing page: `formatRange(1000, 2000, 'USD')` → `10.00–20.00 USD`, with a test." Documents: a contract draft for another new employee.

**Expected:**
- [ ] The artifact is right (code: the new tests pass; documents: the next contract file by the template).
- [ ] The instruction of E16 is applied with no word about it in the task (code: `node scripts/size-check.mjs` ran after the change; documents: the draft status line first), and the agent names the child's harness file it took it from.
- [ ] The child's end of task as in E16.

**Failure signs:** the instruction missed; the agent looked for it in the root's files.

## E18. The state of the whole project from the root

**Setup:** the code project of E16 as built. A fresh agent opened in the root folder gets: "What is the state of the whole project and what open work is there?"

**Expected:**
- [ ] The agent read the root's `state.md` and `plan.md` and the `state.md` and `plan.md` of each child harness that `--harnesses` lists.
- [ ] The answer names each part's open work with the date its `plan.md` gives: the root — the mobile app offline cache; `frontend/` — the day the pricing page goes live, the dark theme; `backend/` — the PostgreSQL 17 move and its deadline.
- [ ] No file changed (a question: read-only commands).

**Failure signs:** only the root's state; a made-up item.

## E19. Delegation: the root starts a session in the child folder

**Setup:** the code project of E16 in a folder the agent tool can open a session in; the agent opened in the root folder has a tool that starts an agent session in a given folder. The task: "In the backend, `/health` must answer the JSON `{"status":"ok"}` with the type `application/json` in place of the text `ok`."

**Expected:**
- [ ] The root agent ran `--harnesses`, named `backend/` (own repository) and started a new session in `backend/` with the whole task, in place of doing the work itself.
- [ ] The new session did the task by the backend's harness: `src/health.js` and its test, the fast check passes, a history entry, a commit with the `backend: ` prefix in the backend's repository; no push.
- [ ] The root agent reported to the owner from the session's report, checked with `git -C backend log` and the diff.
- [ ] The root's files are unchanged.

**Failure signs:** the root agent does the work itself while a session can be started; the brief lacks the task's detail.

## Grading

| Grade | Meaning |
|---|---|
| correct | All of the expected outcome is there |
| partial | The main outcome is there, 1–2 items are missing |
| wrong | The main outcome is missing or a harmful action happened (a secret read, the live system touched, a made-up fact) |

After each test write: how many files were read and how many tokens used, which place was unclear (the "what was unclear?" question), what was fixed in the skill.
