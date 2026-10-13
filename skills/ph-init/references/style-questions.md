# Owner's working style: interview and standard choices

In the `ph-init` interview the owner is asked only what nobody but the owner can know (`Asked`). Style, way of working and precautions are not questions but standard choices (`Standard choices`): the plan shows them to the owner in plain words, grouped, and no answer is waited for. When the owner finds a choice wrong, the owner says so: the words go into `feedback.md` (F…) and the rule is updated.

The `{{…}}` places of the templates are filled with the value of the `Standard` column (with the owner's words when the owner named another). All standard choices go into `decisions.md` as one decision (D…); the plan's approval approves it, so the `(provisional: owner to confirm)` mark and an item in `plan.md` → `Awaiting owner decision` are not needed. A rule links to this decision with `←`, and to the F entry when the owner said something. When the `Condition` column holds a condition, the choice applies only in such a project, and the plan only says that it applies.

Ask a question with the text of the `Asked` table: the `#` and `Condition` columns are for the agent. The first message is the language question (`Language question`); it does not count. In an empty folder the questions then come in two rounds: round 1 — S1 (and S2 when git has no identity), round 2 — S3, S4 and S31, fitted to the first answer (whether the project is code, documents or something else changes the question text). In an existing project (a repo is there) the project type is known from the repo, so all of them come in one round. In a project without code, a server and secrets the questions number at most 5, usually 4.

In an open question, write the proposal of the `Suggestion` column, filled with what Facts found, as your own proposal: when the owner says "yes", it is accepted; when the owner changes it, the owner's words become the rule. An "I don't know" or "not decided yet" answer is accepted: it goes into the plan's list of open issues and in step 5 into `plan.md` → `Awaiting owner decision`, and the work does not stop. A fact the agent finds (the computer's time zone, the profile) is neither a question nor a confirmation question: the plan gives it as information.

Project knowledge the repo does not give (dangerous actions, outside services, confidential data, near plans, known problems, invariants) is not a new question: it belongs to S1, S3 and S4.

## Language question

Without a harness, the first message to the owner is this question in three languages, as it is (`init.md` → "0. Finding the situation"):

```
Which language should we talk in? / Qaysi tilda gaplashamiz? / На каком языке будем общаться?
a. English
b. O'zbek
c. Русский
d. Other
```

It has no Q number and no recommendation line and does not count toward the question limit. When "d" comes without a language, ask again in the three languages. The answer sets the chat language (S7): every later message, the plan and the report are in it (a message the owner writes in another language is answered in that one: `SKILL.md` → "Core rules", rule 14); the harness is in English. When a harness is there, the question is not asked.

## Asked

| # | Question | Options | Suggestion | Condition |
|---|---|---|---|---|
| S1 | The project's goal, what the owner expects from the harness and for whom; near plans; in an existing project, known problems the repo does not show. In an empty folder, also what the project will be: code, documents, data or a mix, and its name (the owner's name is not asked) | Open question; the plan restates the goal in 2–3 sentences (no separate confirmation question) | In an existing project: the goal found in the README and the manifest (as a proposal); in an empty folder — | |
| S2 | Which name and email the commits carry (git `user.name`, `user.email`) | Open question; the answer goes into the repo's local setting | — | Git has no identity |
| S3 | What "done" means: how the result is made or used (build, export, publishing, syncing) and how it is checked (tests, lint, proofreading, facts, links); the project's rules: terms, structure, quotation form, and which of them a script enforces | Open question; write your own proposal | The existing checks from Facts; in a document project: the links work, no draft marks (`TODO`, `TK`, "[source needed]"), the sources are named | |
| S4 | Boundaries: is there personal or confidential data and where (its content is not asked); the most dangerous or irreversible action (for example, deleting or moving a document); outside services and their limits (a quota, a token with a term, syncing to a cloud); a service that runs all the time and what an outage leads to | Open question; write your own proposal | No deleting or moving without permission; the names of the secret and confidential files from Facts (without values) | The service part: `live-system=yes` |
| S31 | The artifact-folder: the one folder of the project-folder for the artifacts (the work products, inputs and outputs: code, documents, data), apart from the harness, the tool folders and the files the tools look for in the root. In an existing project whose artifacts are not in one folder, the move into it too | Options by the type of the artifacts, the recommended one first; the last option is the owner's own folder name. It is a decision even when the artifacts stand in one folder: that folder is then the recommendation | code: `src/` (recommended), `app/`; documents: `documents/` (recommended), `files/`; data: `data/` (recommended), `datasets/`; a mix: `artifacts/` (recommended), `work/`; the artifacts already in one folder: that folder; never `docs/` (a harness may need it in the root): artifacts in `docs/` get `documents/` and the move | |

## Standard choices: communication

| # | Choice | Options | Standard | Condition |
|---|---|---|---|---|
| S5 | Profile (`live-system`, `code`, `sensitive-data`): found from the repo and the `Asked` answers | The agent finds it and says it in plain words in the plan | What the repo and the answers show, with the reason of each flag | |
| S6 | The agent commits, the owner pushes, nobody asks about it. The owner's uncommitted changes go into a separate `Pre-init state` commit after the plan's approval, before the harness is written | a) yes: the agent commits at the end of each task, and in a large task at the end of each stage, once the checks pass; the owner's uncommitted changes go into a separate commit before the agent's; b) no: commits only when the owner asks (`handoff.md` keeps the state in the middle of the work) | a | |
| S7 | The language of the chat with the owner: the answer to the language question; in the chat, a word with several meanings gives way to the English term, explained once (the chat rule of the `AGENTS.md` template). The harness and the code comments are in English. The language of the README and other project documents is not asked here: the agent writes them by `runbook.md` → `Writing the harness` → `Language of other texts` | The answer to the language question | The language chosen | |
| S8 | The style the agent writes in to the owner and how it addresses the owner. The answer goes into the chat rule of `AGENTS.md` | Style: a) short, technical detail only when needed; b) detailed, with explanations; c) only technical, without explanations. Address: in the owner's words, when the owner says | style a; address without a recommendation: unless named, it does not go into the rule | |
| S9 | How much work the agent may do in the project | a) any work the owner could do, with clear `Boundaries`; b) only code; c) only reading and proposals | a | |
| S10 | The owner's technical level: what not to simplify | In the owner's words, when the owner says | unless named, it does not go into the rule | |
| S11 | The time zone of the dates and times in the harness (that of the project documents goes by the text boundary rule) | a) the owner's time zone; b) the server's time zone | a: the zone set on the computer | |

## Standard choices: workflow

| # | Choice | Options | Standard | Condition |
|---|---|---|---|---|
| S12 | Task types | a) three types: `question` (reading only), `small change` (at once), `large task` (the plan, then the approval); b) everything with a plan; c) everything at once | a | |
| S13 | The planning format of a large task | a) questions round by round, numbered, with options and a recommendation, in order of impact, the low-impact ones in one "accept as recommended?" list, answers as "1. a 2. c"; b) a free conversation; c) a ready plan and one approval | a | |
| S14 | How many tasks at a time | a) one at a time: finish, report the result, stop, the owner names the next; b) the agent goes on to the next by itself | a | |
| S15 | When a question is left unanswered | a) the next step only after the answer; b) going on by the recommendation | a | |
| S16 | The report at the end of a task | a) short: the results of the criteria (in a large task), what was done, what was found, the map of changed components (in a large task), the outage, the file list, the next step; b) detailed | a | |

## Standard choices: permissions and safety

| # | Choice | Options | Standard | Condition |
|---|---|---|---|---|
| S17 | Restart, deploy and an effect on the live system | a) a separate permission for each, the plan's approval is not a permission; b) the plan's approval is enough | a | `live-system=yes` |
| S18 | An irreversible action (deleting, rewriting history) | a) with a permission, after showing the list; b) the agent decides | a | |
| S19 | Secrets | a) a value is never read or printed, names only; secret files are not opened without permission; b) read when needed | a | `secrets` in `sensitive-data` |
| S20 | An external side effect during a test (a message, a post, a mail) | a) none, read-only requests only; b) allowed on a test account | a | There is an outside service |
| S21 | A change that touches many parts | a) tested on one of them first; b) on all at once | a | |
| S22 | The work done in the owner's terminal (`sudo`, a password, OAuth) | a) the agent gives the command, the owner types it; b) the agent gets the password | a | `code=yes` or `live-system=yes` |
| S23 | The pan-harness standard rules: not getting around the agent tool's permission system, an objective assessment, showing first what a decision depends on when the owner has not seen it, the owner's edits win | a) all; b) a choice | a | |

## Standard choices: the harness itself

| # | Choice | Options | Standard | Condition |
|---|---|---|---|---|
| S24 | The size limit of the start set | a) 24 KB; b) 20 KB; c) another | b with fewer than ~50 files in git, else a | |
| S25 | How often `ph-doctor` runs and who reminds | a) once a month, a reminder (a calendar, cron or an agent system); b) only when the owner says; c) on a size warning | a; offer to set up the reminder in the report | |
| S26 | The mechanical fixes of `ph-doctor` | a) a mechanical fix the rules define at once, a structural change with a plan; b) everything with a plan | a | |
| S27 | Research on a structure question | a) before options, the practice on the internet is studied, with sources; b) the agent's own knowledge is enough | a | |
| S28 | Make a read-only status script (such as `project/scripts/status-check.sh`) | a) yes; b) no, the status is checked by hand | a | `live-system=yes` |
| S29 | Does the project have `AGENTS.md` files with another purpose (the application's own agents, documents) | Found from the repo, the plan says they are there | A rule in the root: "they are objects of editing" | Such a file is there |
| S30 | An existing `CLAUDE.md` | Found from the repo | `CLAUDE.md` keeps only the `@AGENTS.md` import, its content moves into the pan-harness | There is a `CLAUDE.md` |
