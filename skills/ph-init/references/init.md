# ph-init: making a pan-harness

The project has no pan-harness: the folder is empty or a project is there. Agent files of another shape (`AGENTS.md`, `CLAUDE.md`, `CONTEXT.md`, `.cursor/rules`, `GEMINI.md`, `.github/copilot-instructions.md`) may be there: their knowledge is migrated in full.

Copy this checklist into your answer and tick it as you go:

```
ph-init:
- [ ] 0. Situation: a harness, an empty folder or an existing project; without a harness, the language question
- [ ] 1. Preparation: git (install, `git init`, `.gitignore`, first commit), agent files, secret files (names only), Node
- [ ] 2. Facts: stack, how it runs, live system, docs, the profile draft
- [ ] 3. Interview: goal (S1), boundaries (S4), the artifact-folder (S31), the git identity when empty; the rest are standard choices
- [ ] 4. Plan: a short plan (criteria, changes outside the harness, standard choices), the owner's approval
- [ ] 5. Create: the standard part, project/, journals, migration, hook
- [ ] 6. Check: pan-harness-check, secret-check, size, audit.md, fresh-agent test (asked)
- [ ] 7. Report and commit (S6 = a)
```

## Contents

- 0. Finding the situation
- 1. Preparation
- 2. Facts
- 3. Interview
- 4. Plan
- 5. Create
- 6. Check
- 7. Report
- Common cases

## 0. Finding the situation

Look at what the folder holds (`ls -A`, `git status`):
- **A harness is there** (`PAN-HARNESS.md` or `pan-harness/`): `ph-init` ends here, with no language question. When the version in `PAN-HARNESS.md` → `Standard:` equals the skill's, offer the owner `ph-doctor` (checking and fixing the harness). When the version differs or the harness is on an unknown standard, offer `ph-update`: it migrates the harness and runs `ph-doctor` at the end too.
- **An empty folder** (only `.git`, `.gitignore` and the agent tool folders: `.agents/`, `.claude/skills/`, `.opencode/commands/`): in the first round of questions, together with question 1, ask what the project will be: code (language, what it does) or documents (which documents, for whom). The project's name is not asked and the questions leave it out: it is the folder's name, and the plan shows it ("4. Plan"); the owner's name is not asked either. Installing git and `git init` (step 1) do not wait for the answer. After the answer, make the minimal structure: `README.md` (the goal in 2–3 sentences, in the chat language), a `.gitignore` that fits the project type and the first commit (step 1), then the rest of `ph-init`. The facts come from the owner's answer; the repo holds nothing yet, so `Facts` is short.
- **An existing project** (code or documents): start from step 1.

**The language question.** Without a harness, the first message to the owner is the language question of `style-questions.md` → `Language question`, as it is there; it also says how its answer sets the chat language. The rounds: in an existing project 2 (the language question, then the interview), in an empty folder 3.

Done when: as step 0 of the `ph-init` skill says (its `SKILL.md`).

## 1. Preparation

These steps are part of the `ph-init` command: do them at once, before the plan's approval (the read-only rule until approval covers the harness itself, `SKILL.md` → "Core rules", rule 5).
1. Find the project-folder. The skills are installed into it with `npx @jiemurat/pan-harness@latest init` and stand in `.gitignore` (they are tools, not project knowledge). This command goes into `playbooks/pan-harness.md`.
2. **Git.** The pan-harness works in git (`settings.md` → "Git"):
   - `git --version`. If git is not installed, install it: macOS — `xcode-select --install`, Windows — `winget install --id Git.Git -e`, Linux — the package manager (`sudo apt install git`, `sudo dnf install git`). When `sudo` or a password is needed: if the agent has a terminal the owner can see, run the command there, the owner types the password, then check with `git --version` and go on. Without such a terminal, give the command to the owner and wait.
   - If the folder is not a git repo (`git rev-parse --is-inside-work-tree` gives an error), run `git init -b main`.
   - Identity: first look at `git config user.name` and `git config user.email` (the global and the local setting come out together). When both are set, the commits are made with that name and the setting stays as it is. When they are empty, ask in the first round of questions (S2), write the answer into the repo's local setting and commit after the answer; take the name and the email only from the owner's answer: the commit author is the owner.
   - `.gitignore`: make it when there is none, complete it when there is one (`settings.md` → "Git"). Write only what this project has or what the work makes:
     - secrets: the exact names of the secret files found in item 4 below, `.env` and `.env.*` (with `!.env.example`), `*.pem`, `*.key`. The search patterns of item 4 (`*secret*`, `*token*`, `credentials*`) only serve to find files: `.gitignore` gets the exact names found, because a broad pattern hides ordinary files too;
     - the project's build or export folder (the README, a script or a manifest says where it is written), the cache and dependencies of the project's language, logs;
     - OS and editor files, office lock files in a document project (`~$*`, `.~lock.*#`).

     Common folder names (`lib/`, `parts/`, `var/`, `build/`) are written only when they are a build output in this project: otherwise they hide the project's files. After writing, look at `git status --short --ignored`: each ignored path must be one of the kinds above: secrets, cache and dependencies, logs, build, OS, editor and lock files.
   - When the repo has no commit yet, make the first commit. First check the files that go into it with the skill's script: `git ls-files -z --others --exclude-standard | xargs -0 node <skill>/scripts/secret-check.mjs --root .`. When a secret is found, the file goes into `.gitignore` or the owner is asked. Then `git add -A` and `git commit -m "Initial commit"`. This commit holds only the owner's files; the harness is not there yet.
   - When the repo has uncommitted changes, they are the owner's work. The `.gitignore` change you made is not the owner's uncommitted change: it does not go into `Pre-init state` but is committed with the harness. The commit order (S6) is a standard choice: the plan shows it, no question is asked. After the plan's approval, before the harness is written (step 5, item 1): with (a), commit them separately (`Pre-init state`), checking the changed files with the same command (`git ls-files -z --modified --others --exclude-standard`). With (b), ask the owner.
3. Find the existing agent files in the root and in subfolders: `AGENTS.md`, `CLAUDE.md`, `CLAUDE.local.md`, `.claude/` (apart from `.claude/skills/`), `GEMINI.md`, `.cursor/rules/`, `.github/copilot-instructions.md`, `CONTEXT.md`, `docs/`. The tool folders (`.agents/`, `.claude/skills/`, `.opencode/commands/`) hold installed skills and commands: they are tools, not agent files of the project. An `AGENTS.md` in a subfolder is the instruction for the work in its folder (the agents.md standard), and the agent tools load it there by themselves: leave it in its place, put it into the map and the rule of step 5, item 7.
4. Make the list of secret files by names only: `.env*` (except `.env.example`), `*secret*`, `*.pem`, `*.key`, `credentials*`, `*token*`, outside the tool folders of item 3 (their scripts have such names). Write only the name and which ones are in git. When a secret file is in git, tell the owner at once.
5. Skip these folders when scanning: `.git`, `node_modules`, `venv`, `.venv`, `__pycache__`, `dist`, `build`, `volumes`, data folders.
6. Check `node --version` (18 or newer). Without Node, work by the procedure in `structure.md` → "Profile".

Done when: as step 1 of the `ph-init` skill says (its `SKILL.md`).

## 2. Facts

Study these in the repo: the README and the manifests (`package.json`, `pyproject.toml`, `requirements.txt`, `Dockerfile`, `docker-compose*.yml`, `Makefile`, CI files). In a document project, count the folders of the root and the first level and the file types (pdf, docx, xlsx, md). Find:
- the language and the stack, the commands to run, test and deploy (where they are written);
- the existing checks and how they run: tests, linters, CI, document linters (markdownlint, Vale, a link checker), whether the project has a full check command;
- with `code=yes`, the fast check and the way to see the result: a check of the artifact-folder that runs in seconds to a minute (a test subset, a type check, a lint) and the command that starts the program, with what to open or look at (`package.json` scripts, `Makefile`, the CI file, the README); the agent runs the fast check before a task and after each change, so a missing one costs every task;
- with `code=yes`, the environment and the logs: the file that declares the dependencies (`package.json` with its lock file, `requirements.txt`, `pyproject.toml`), the pinned runtime version (`.nvmrc`, `.python-version`, `engines`, `.tool-versions`), and where the program writes its log and errors (a log file, the terminal, `docker compose logs`);
- the project's invariants written in the repo: in code the architecture layers and the dependency rules, in documents the terms, the structure, the quotation form;
- whether there is a live system (compose, systemd, cron, a server), where it runs;
- the outside services and the secret names (the names of environment variables, without values);
- whether there is personal data or confidential documents: find it from the file names and the folder structure, look only at the names;
- the existing docs and their state;
- where the artifacts stand: in one folder (which), in several, in the root;
- the computer's time zone: `date '+%Z %z'` (for example, `+05 +0500` — UTC+5); it is a standard choice (S11) and goes into the plan as information.

Make the profile draft from the facts (`structure.md` → "Profile"): `live-system`, `code`, `sensitive-data`. Note the facts for yourself, each marked `verified` or `unverified`.

Done when: as step 2 of the `ph-init` skill says (its `SKILL.md`).

## 3. Interview

The owner is asked only the questions of `style-questions.md` → `Asked`: what nobody but the owner can know. Style, way of working and precautions are not questions but standard choices (`style-questions.md` → `Standard choices`): the plan shows them, no answer is waited for. The owner's time is the one sequential resource, so in a project without code, a server and secrets the questions number at most 5, usually 3 (neither the language question nor the plan's approval counts); when there are more, the report says why.

Ask the questions in the `ph-grilling` format in two rounds, after the language question, in the chosen language:
1. Round 1: question 1 — the draft of the goal, the outcome and the criteria (S1). Before writing question 1, read `templates/pan-harness/playbooks/large-task.md.tmpl` → `Planning`: the criteria form is there (P21). An example criterion: "a new agent answers 4–6 usual questions of the project correctly from the harness". In an empty folder, this question asks what the project will be; do not ask the owner for the criteria: propose them yourself after the goal's answer and have them approved in the plan. When git has no identity, ask it in this round too (S2).
2. Round 2: the boundaries (S4) and the artifact-folder (S31), fitted to the first answer. In an existing project (a repo is there) the project type is known from the repo, so the two rounds merge: S1, S4 and S31 in one message.

When a task counts as done is not asked: it is agreed in each task's plan (the goal, the outcome and the criteria, P21). The project's full check command found in the repo goes into the plan as information (step 4), and the project's rules (terms, structure, quotation form) go into `feedback.md` when the owner names them.

**The artifact-folder (S31).** The artifacts are the project's work products, its inputs and outputs: code, documents, data. The artifact-folder is the one folder of the project-folder that holds them, apart from the harness and the tool folders. Ask with the options of S31 for the artifacts' type, the recommended one first and the owner's own folder name last. Ask it with the term artifact-folder, explained in one sentence at its first use; the plan and the report say project-folder and artifact-folder too. When the artifacts of an existing project are not in one folder, propose moving them there: say the goal and the expected benefit in 1–2 sentences (the work and the harness stay apart, an agent finds the work in one place) and list what moves (source code, tests, documents, data) and what stays in the root (manifests and lock files such as `package.json` and `requirements.txt`, `Dockerfile` and compose files, CI settings, `README.md`, `LICENSE`, `.gitignore`, `.env*`, the harness and the tool folders: the tools look for them there). `src/` beside `tests/` counts as more than one folder: the owner decides. `ph-init` moves no artifact: when the owner agrees, the move goes into `plan.md` → `Queue` as the first large task, with its own plan and checks; when the owner declines, the artifact-folder holds the new artifacts and the old ones stay where they are (a decision).

Write each question in the form of `templates/pan-harness/playbooks/questions.md.tmpl` (read it before the first question). In each open question, write your proposal on its `➡️` line (`➡️ <letter and option> — <why>`; an open question with no options: `➡️ <your proposal> — <why>`), filling the `Suggestion` column with what Facts found, with a reason of 1–2 sentences: when the owner says "yes", it is accepted. When `Suggestion` holds "—" (the git name; the goal in an empty folder), no proposal is written: it cannot be proposed without the owner's answer. In an existing project, find the goal in the README and write it as a proposal. When a question with options remains (for example, a file over 50 MB), the recommendation comes on its own line, with the reason. "I don't know" or "not decided yet" counts as an answer (the question is not left open): it goes into the plan's list of open issues and in step 5 into `plan.md` → `Awaiting owner decision`, and the work does not stop. When a part of a question has no answer, that part becomes an open issue. When the owner gives a task in place of an answer (for example, "decide yourself" or "study it on the internet"), do it and ask the question again with a new proposal.

A fact the agent finds (the computer's time zone, the profile) is neither a question nor a confirmation question: the plan gives it as information, and the owner says so when it is wrong. Other knowledge the repo does not give is not a new question either: it belongs to S1 and S4.

The questions of a message that holds several are numbered 1, 2 …, and the numbers run on to the end of the work; a message with one question has no number. The S numbers in `style-questions.md` are table IDs, not question numbers.

Done when: as step 3 of the `ph-init` skill says (its `SKILL.md`).

## 4. Plan

Give a short plan: up to 15 lines (up to 3 000 characters; the migration table counts neither in the lines nor in the characters). It holds what the owner decides, because the owner does not read the harness files (the rule in `Core rules` on writing clearly for the owner): a harness file name, an internal label and a detail only the agent uses stay out of the plan.
- the goal and the outcome: what the owner has at the end, 2–3 sentences, plain words;
- the project's name on one line: from the repo in an existing project (the README title or the name in the manifest), the folder's name in an empty one; the owner may change it here;
- the final list of criteria (1–5): each an outcome the owner sees, that is what is observed, the threshold, how and when it is checked. The constant checks (a file exists, the script gives 0 errors, the size) are not criteria. A rule or a list inside the harness is not a criterion (the owner does not read the harness files): a criterion is a behaviour a new agent or the owner sees. The owner's approval covers the criteria too;
- what changes in the owner's project outside the harness: git (init, the check before a commit, `.gitignore`), in an empty folder `README.md` and its language (the chat language, another when the owner says so) and the empty artifact-folder, in an existing project the agreed move of the artifacts as the first large task, the owner's existing files when they move;
- the migration table: where each existing file or section goes (a rule → `AGENTS.md`, a fact → `system-map.md` or `state.md`, a playbook → `project/playbooks/`, a decision → `decisions.md`; the originals are kept as they are in `archive/` too). It is given only when old content moves, together with what happens to `CLAUDE.md`;
- the profile in plain words (is there code, a service that runs all the time, secrets or personal data) and the facts the agent found as information: the time zone, the project's full check command found in the repo (or "no check found: each task's plan agrees it"); with `code=yes` the fast check and the way to see the result, or that one is missing and goes to the work plan as a proposal, and the checks the agent runs once after the approval;
- the standard choices (`style-questions.md` → `Standard choices`) in four lines, each with these words: chat language, time zone and style; task types, one at a time and the report; irreversible actions, secrets and push; commit order and upkeep. Leave out the form of address and the technical level: unless named, they do not go into a rule. No answer is waited for; when the owner wants a change, the owner says so;
- the open issues (what the owner said "I don't know" to, when there are some): they do not stop the work and go into `plan.md` in step 5;
- where the owner's hand is needed (a password, `sudo`, a sign-in), the risk and the way back.

The plan ends with the approval question of `templates/pan-harness/playbooks/questions.md.tmpl`. The file list is not in the plan: it goes into the report as "changed files". The plan calls the folders the project-folder and the artifact-folder, by these English terms. Leave the harness terms (start set, profile, playbook, handoff, migration table) out of the plan: write their meaning in plain words (the files read at session start, the project type, the table of moves). Before sending, write the plan into a temporary file outside the project-folder (`mktemp`), run `LC_ALL=C.UTF-8 wc -lm` (characters, not bytes), the three `grep` commands of `Report` and `grep -niE 'start set|profile|playbook|handoff|migration' <file>` on it, then delete the file: it is your file, not the owner's. Until the owner's approval, write no harness file. Done when: the plan is within 15 lines and 3 000 characters, the four `grep` results are clean (file names only of the owner's own files, for example the old files to move), the temporary file is deleted, the owner approved the plan.

Done when: as step 4 of the `ph-init` skill says (its `SKILL.md`).

## 5. Create

1. When the commit order (S6) is a and the owner has uncommitted changes, first put them into the `Pre-init state` commit (step 1, item 2). When there are agent files of another shape (`AGENTS.md`, `CLAUDE.md`, `CONTEXT.md`), move the old root `AGENTS.md` to `pan-harness/archive/AGENTS-<date>.md` and copy the originals of the others into that folder: the script does not touch an existing file, and the content goes to its place in item 6. Then run `node <skill>/scripts/scaffold.mjs --root .`, with `--secrets` when the profile lists `secrets`. It copies each standard file, `pan-harness-check.mjs` (and `secret-check.mjs`) and `.githooks/pre-commit` from the templates, puts in the `Standard:` line and the history month, and connects git to the hook; it does not touch an existing file and reports it as `kept`.
2. Fill each file made: the template text stays as it is, fill the `{{…}}` places with the owner's answers and checked facts (`{{owner}}` gets the name the owner gave, otherwise the word "owner"), apply the `[profile: …]` marks by the rule in `structure.md` → "Profile", delete the template note at the top. A mandatory file left empty stays with one line. Compare the `kept` files with the templates by hand.
3. Start the journals:
   - `feedback.md`: the owner's answers and each word about the way of working (F1…, verbatim where possible; for a "yes", with the text of the accepted proposal) and which rule it became;
   - `decisions.md`: the structure choices (D1…). For example: the pan-harness standard, its version and the profile (D1, R5 and R16 link to it), the standard choices (D2: their list and values from `style-questions.md` → `Standard choices`, approved with the plan; the style and way-of-working rules link to it with `← D2`), the size limit, the upkeep order, the migrated files. The migration D stays in `decisions.md` until the first `ph-doctor`, then moves to the archive as a done one-off;
   - `lessons.md`: only the heading and the format (or past mistakes the owner named);
   - `handoff.md`: `**Status:** none` (`active` with its steps when `ph-init` itself is a large task that does not fit one session);
   - `history/<current month>.md`: the first entry, the `ph-init` work. The migration table (old file section → new place) goes into this entry, and the `Where:` field of the migration decision points to it.
4. The rules of `AGENTS.md` link to F and D (`← F2, D1`). Each rule comes from the owner's answer, the standard choices decision or a checked fact; none is made up.
5. Write the project's own knowledge into `project/`: domain files, the project's playbooks and scripts. Each stands in `PAN-HARNESS.md` → `Map` with "what is there, when it is read" and keywords (`structure.md` → "Writing").
6. Migration: move the content of the originals in `archive/` (item 1) to its places by the table. Compare each claim with the code and the configuration: old files hold stale or wrong sentences; fix them as you move them and say so in the report. When there is a `CLAUDE.md`, only `@AGENTS.md` stays in it.
7. When the project has `AGENTS.md` files in subfolders, add the template's R17 to `AGENTS.md` with their paths: each is the instruction for the work in its folder, and the file nearest to the edited file wins.
8. The hook: `scaffold.mjs` makes it and connects git to it. When the project has another hook (`.git/hooks/pre-commit`, the pre-commit framework or another `core.hooksPath`), the script does not connect it and says so: keep that hook, ask the owner and merge both into one hook, then `git config core.hooksPath .githooks`. When the project is a subfolder of another git repository, the script does not connect it either (the setting holds for the whole repository) and prints the command with the path from the repository's top: show it to the owner and run it on the owner's yes.
9. Write the project's full check command into `PAN-HARNESS.md` → `Project checks` (when found). With `code=yes`, fill its `Fast check:` and `See the result:` lines with the fast check and the way to see the result found in step 2; for a missing one, write the template's "none yet" text and add a proposal to `plan.md` → `Awaiting owner decision`: create it as a task of its own (`ph-init` does not create it: it changes the artifacts). In `project/check.json` → `co_change`, agreeing with the owner, tie each code and document folder (for example, `src/`, `docs/`) to the doc that describes it; with `code=no`, in a project where unfinished-work marks occur, `markers` too (`settings.md` → "Extensions and settings"); with `code=yes`, item 10 sets it.
10. With `code=yes`, run the fast check and the full check once, each a command that installs nothing, uses no network and reads no secret file (a command that breaks one of these three is not run: write the reason in its place), and write the result after its command in `Project checks`: `(YYYY-MM-DD: <result>, <time>)`. A failure or a missing tool is written as it is and goes to `plan.md` → `Awaiting owner decision` as a proposal: `ph-init` changes no code and installs no tool. A missing dependency file or runtime pin goes there too. Fill the `Logs:` line from step 2. Turn on `check.json` → `markers` with `"scope": "changed"`, globs of the code files in `paths` (`src/**/*.js`, `app/**/*.py`: a folder name alone matches no file) and the patterns of the project's languages as JSON strings (`console\\.log\\(`, `\\bdebugger\\b`, `\\bprint\\(`, `breakpoint\\(\\)`, `\\bTODO\\b`, `\\bFIXME\\b`): the end of a task then finds the debug leftovers this task added (`settings.md` → "Extensions and settings").
11. When there is a live system and the owner agrees (S28), write a read-only status script into `project/scripts/` (without `sudo`, network and secret files) and add it to `PAN-HARNESS.md` → `Project checks`. A `project/scripts/check-*.mjs --live` extension only compares the harness facts with the live system.
12. When the profile lists `pii` or `confidential`, offer the owner to write a `project/scripts/secret-check-pii.mjs` extension. Agree on the patterns with the owner (for example, a passport or phone number format). The main protection is still the rule: the harness gets a path, an ID and a neutral description in place of the content.

13. Write the agreed artifact-folder into `AGENTS.md` → `Project`; when the move waits in `plan.md`, the line says where the artifacts stand now; when the owner has not chosen, the line says so and points to the open issue. In an empty folder, make the artifact-folder empty: no file in it and no commit (git takes it with its first file). When the owner agreed to move the artifacts, write the move into `plan.md` → `Queue` as the first large task.

Done when: as step 5 of the `ph-init` skill says (its `SKILL.md`).

## 6. Check

1. Run `node pan-harness/scripts/pan-harness-check.mjs`: 0 errors and 0 `never_track` warnings. On an error, first compare the file you made with its template: most errors are where the template was left. Name the other warnings in the report.
2. When the profile lists `secrets`, run `node pan-harness/scripts/secret-check.mjs`: it must give `RESULT: clean`.
3. Measure the start set size with `wc -c`.
4. Check the harness by `audit.md` item by item and fix what is found. A58 (does the start set answer the 5 main questions) costs no tokens: always do it.
5. Ask the owner whether to run the fresh-agent test (`testing.md`). When it runs, fix the gaps found and write the result into `playbooks/pan-harness.md` → `## Test questions`.

Done when: as step 6 of the `ph-init` skill says (its `SKILL.md`).

## 7. Report

- Each criterion: ✅ (with evidence), ❌ or ⏳ (when it is checked, `plan.md` → `Later and watch`).
- The files made and migrated, `git diff --stat`, the commit numbers (the first one, `Pre-init state`, `ph-init`).
- The profile, the number of F, D and R written and the content of each R in one line.
- The facts marked `unverified`: the owner has to confirm them.
- The questions waiting for the owner's decision.
- The next step: offer to set up the `ph-doctor` reminder (S25).

When the commit order (S6) is a, commit the `ph-init` work before the report (the commit item of `playbooks/end-of-task.md`). With (b), give the file list; the owner commits.

Done when: as step 7 of the `ph-init` skill says (its `SKILL.md`).

## Common cases

| Case | What to do |
|---|---|
| Git is not installed or there is no repo | Step 1, item 2 (Git) |
| No identity (`user.name`, `user.email`: global and local both empty) | Step 1, item 2 (Identity) |
| Files over 50 MB | Ask the owner: into `.gitignore` or kept in git (`check.json` → `large_file_mb`, `track_ok`) |
| No `CLAUDE.md` | `structure.md` → "Root files" → `CLAUDE.md` |
| `CLAUDE.md` is there, `AGENTS.md` is not | The content moves into the pan-harness, the original into `archive/`, `CLAUDE.md` keeps only `@AGENTS.md` |
| An `AGENTS.md` in a subfolder | It stays in its folder as the instruction for the work there (step 5, item 7) |
| An `AGENTS.md` in the root, but for the application's own agents | Ask the owner |
| A small project (fewer than ~50 files in git) | The standard part is still full, the files are short. The size limit may be 21 KB (S24) |
| A document project (no code) | `code=no` in the profile: `runbook.md` gets the document formats and the tools that read them, the code rules go. The full check — lint, links, assembly or export; `co_change` ties the document folders to the plan or the terms file; `markers` searches for draft marks (`TODO`, `TK`, "[source needed]"). `.gitignore` gets the office lock files (`~$*`, `.~lock.*#`) and the export results |
| A monorepo | One pan-harness stands in the root with the knowledge common to all parts. The packages' own rules (their commands, their code rules) stay in an `AGENTS.md` in each package folder (the agents.md standard); the map lists these files |
| A secret file in git | Go on with the work and tell the owner at once: the secret stays in the history and has to be replaced. Add the file to `.gitignore` and run `git rm --cached` (the file stays on disk). The history is rewritten only with the owner's permission. Never read the value |
| A project in a folder a cloud service syncs | `settings.md` → "Git": tell the owner, offer to move the repo or keep `.git` out of syncing |
