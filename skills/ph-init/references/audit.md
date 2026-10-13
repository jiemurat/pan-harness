# Conformance audit

Whether the project's harness matches the standard (`structure.md`) and the principles (`principles.md`) is checked by this list. `ph-doctor` goes through it item by item; at the end of `ph-init` the agent checks the harness with it by itself.

The columns:
- `Requirement` — what the standard requires. When the profile condition in brackets does not match, the row is `n/a`.
- `Smell` — the sign of a defect seen when the requirement is broken. Six of them come from research (configuration smells, `principles.md` [8]): Lint Leakage, Context Bloat, Skill Leakage, Conflicting Instructions, Init Fossilization, Blind References.
- `How to check` — `script` (an `ERROR` or `WARN` line of `pan-harness-check.mjs`), `manual` (the agent checks by itself) or `test` (fresh-agent test).
- `Fix` — `mechanical` (at once) or `structural` (with a plan and the owner's approval), `doctor.md` → "6. Fix".

The result of each row is `ok`, `fail` (what was found and file:line), `not checked` (the reason) or `n/a`.

## Contents
- Root files: A1–A9
- Profile: A10–A12
- Standard part: A13–A19
- Project part: A20–A22
- Journals: A23–A30
- History and archive: A31–A34
- Size: A35
- Extensions and settings: A36–A37
- Version: A38
- Writing: A39–A50
- Principles: A51–A57
- Continuity and checks: A58–A67

## Root files

| ID | Requirement | Smell | How to check | Fix |
|---|---|---|---|---|
| A1 | `AGENTS.md` and `PAN-HARNESS.md` are in the root | Missing file | script | structural: from the template, with the owner's answers |
| A2 | `AGENTS.md` has the sections `## Project`, `## Boundaries`, `## Session start`, `## Workflow`, `## Working style`, `## Rules` in this order | Missing section | script | structural when a section is missing or the order differs |
| A3 | `## Boundaries` has the `**Never:**`, `**Ask first:**` and `**Always:**` lines, each with `(R…)` links to the rules; every rule whose breach can do harm (an outage, lost data, a secret, an effect outside, an action that cannot be undone) is in the block (P7) | Buried constraint | script (the lines), manual (the links; for each rule "if it is broken, is there harm?") | mechanical (the name), structural (the content and coverage) |
| A4 | `AGENTS.md` is about 100–150 lines, each line passes the "would the agent make a mistake if I removed it?" test (P1, P2) | Context Bloat | manual, script (start set size) | structural |
| A5 | Rarely used domain knowledge is not in an always-loaded file but in a domain playbook (P9) | Skill Leakage | manual: the SNR table — 5 usual task types (from the past work and tags in the history) × each rule: needed or not; a rule not needed in many task types and not in `Boundaries` is a candidate | structural: show the list to the owner and move the rule with its number to a playbook |
| A6 | No rule is written that a linter, formatter or test already checks (`code=yes`) | Lint Leakage | manual: compare with the project's linter and CI settings | structural: remove it, leave a link such as "run `make lint`" if needed |
| A7 | `PAN-HARNESS.md` has the sections `## Profile`, `## Map`, `## Project checks` and the `Standard:` line at the end | Missing section | script | structural when a section is missing |
| A8 | `CLAUDE.md`, `.claude/CLAUDE.md` and `CLAUDE.local.md` (when there) import `@AGENTS.md` and keep no project knowledge (P17) | Tool lock-in | script (the import), manual (the content) | mechanical (the import); structural: move the content into the harness |
| A9 | When there are `AGENTS.md` files other than the root one, a rule in `AGENTS.md` says they are not instructions for the agent | — | manual: `find . -name AGENTS.md -not -path ./AGENTS.md` | structural |

## Profile

| ID | Requirement | Smell | How to check | Fix |
|---|---|---|---|---|
| A10 | `## Profile` has the full `Profile:` line: `live-system`, `code`, `sensitive-data`, with allowed values | Missing profile | script | structural: the owner approves the profile |
| A11 | The profile matches reality: a live system, code, the kind of confidential data | Stale profile | manual | structural |
| A12 | The rules and sections match the profile: with `live-system=no` there is no restart rule and no `Downtime:`, every kind in `sensitive-data` has its rule: with `pii` and `confidential`, a path, an ID and a neutral description are written in place of the content | Profile mismatch | manual | structural: an unneeded rule moves with its number to a playbook |

## Standard part

| ID | Requirement | Smell | How to check | Fix |
|---|---|---|---|---|
| A13 | All standard files are there (`handoff.md` and the three playbooks too; `secret-check.mjs` mandatory only with `secrets`). When the project has nothing for a file, it stands with one line | Missing standard file | script | mechanical: a one-line file from the template |
| A14 | The standard part holds no file or folder the standard lacks: what is specific to the project is in `project/` | Standard boundary violation | script | structural: move it into `project/`, update every link |
| A15 | The scripts in `scripts/` are the same as the skill's | Edited standard script | manual: `diff` | mechanical: replace with the skill's |
| A16 | `state.md` holds only the current state; the `Last updated:` date is not older than the last history entry | Stale fact | script (the date), status check (the facts) | mechanical: update from the checked state |
| A17 | `plan.md` holds no done work, `Scheduled` no row whose date has passed; dated task rows (`| YYYY-MM-DD`) only in `plan.md` | Duplication, Stale plan | script | mechanical |
| A18 | `runbook.md` has the `Topic tags` line and each tag of the journals is on that list | Unknown tag | script | mechanical: add the tag to the list or fix it |
| A19 | `playbooks/pan-harness.md` gives the command that installs the skills and a link to `ph-doctor`, and has the project steps and the `## Growth limits`, `## Test questions` (the fixed question set and the last result) and `## Fresh-agent test` sections; `playbooks/large-task.md` has `## Planning` and `## Execution`, `playbooks/end-of-task.md` has `## Journals` and `## End of task` | — | manual | mechanical |

## Project part

| ID | Requirement | Smell | How to check | Fix |
|---|---|---|---|---|
| A20 | Each file and folder in `project/` and each project playbook stands in `PAN-HARNESS.md` → `Map` with a context pointer: first what is there (keywords at the start), then when it is read, one trigger per situation; the standard files are on the map too (P3, P26) | Unmapped file, Keyword-less map entry | script (present or not; the `A20` flag in `REVIEW`), manual (keywords, trigger) | mechanical |
| A21 | Each path in a doc leads to an existing file, each `` `file.md` → "Section" `` link to an existing heading or bold label; each link says when it is read | Broken path, Broken section link, Blind References | script (paths, section links), manual ("when it is read") | mechanical |
| A22 | File and folder names are in English, lowercase, with hyphens (except the three files in the root) | Naming | manual | structural: when a name changes, every link is updated (`doctor.md` → "6. Fix") |

## Journals

| ID | Requirement | Smell | How to check | Fix |
|---|---|---|---|---|
| A23 | F, L, D numbers run from 1 with their archive; R numbers are one sequence; each `← F/L/D` source exists | Unsourced rule | script | mechanical (the link), structural (for a rule without a source, ask the owner and write an F) |
| A24 | Each D numbered from `check.json` → `fields_from` on has `Why:` and `Where:`, and `Rejected:` where possible; the place in `Where:` is really so (P6) | Stale fact | script (the fields), manual (the place) | mechanical (the path), structural (the decision does not match reality) |
| A25 | Each F has `Quote:`, `Context:`, `Result:`; a standing instruction became a rule in `AGENTS.md` | — | script (the fields), manual | structural: add the rule |
| A26 | Each L has `Rule:` and `Check:`; a lesson repeated twice became a rule or a playbook step (P16) | Unpromoted lesson | script (the fields), manual: read `lessons.md` by tag | structural |
| A27 | `decisions.md` holds only current decisions; superseded and done one-off decisions are in the archive with the `Archived …` mark | Journal growth | manual | mechanical |
| A28 | Journal entries are append-only: an old entry changed only in paths, links and field names | — | manual: `git log -p` | structural: show the changed content to the owner |
| A29 | Field names, marks and headings are as the standard has them (`structure.md` → "Layout") | Non-standard labels | script (section and field names), manual | mechanical |
| A30 | Provisional decisions (`provisional: owner to confirm`) are in `plan.md` → `Awaiting owner decision` | — | manual | mechanical |

## History and archive

| ID | Requirement | Smell | How to check | Fix |
|---|---|---|---|---|
| A31 | Each history file holds only its month's entries, in date order; each entry has `What and why:`, `Checks:`, `Files:` (with `live-system=yes`, `Downtime:` too) | — | script | mechanical |
| A32 | No entry but the last has `(commit: pending)` left | — | script | mechanical: take the number from `git log` |
| A33 | The docs outside `history/` and `archive/` are under 40 KB; when `feedback.md` and `lessons.md` grow, the old entries that became rules are in the archive | Journal growth | script | mechanical |
| A34 | The originals of migrated old agent files are in `archive/`; the migration decision of `ph-init` moved to the archive at the first `ph-doctor` | — | manual | mechanical |

## Size

| ID | Requirement | Smell | How to check | Fix |
|---|---|---|---|---|
| A35 | The start set is within its limit (`project/check.json` or the standard 24 KB) | Start set over limit | script | structural when trimming touches the meaning: the P2 test, a domain rule to a playbook, done work out of `plan.md` |

## Extensions and settings

| ID | Requirement | Smell | How to check | Fix |
|---|---|---|---|---|
| A36 | Extension names are `check-*` (`.mjs`, `.js`, `.py`) and `secret-check-*`; they run and give a correct result | Faulty check script | script, manual: check the result by hand | mechanical (the name); an error in a project script is structural; an error in a skill script is a skill limitation (`doctor.md` → "6. Fix") |
| A37 | `project/check.json` (when there) is valid JSON, its settings match reality | — | script | mechanical |

## Version

| ID | Requirement | Smell | How to check | Fix |
|---|---|---|---|---|
| A38 | The `Standard:` line is there and its version equals the skill version: the `changelog.md` steps are done, a harness on an unknown standard is migrated by comparing it with the templates (`doctor.md` → "3. Migration") | Old or unknown standard | script | by the type of each step in `changelog.md`; on an unknown standard, the procedure of `doctor.md` → "6. Fix" |

## Writing

The P26 items (the keyword order and trigger in A20, A43, A44–A48) and the text boundary (A50) are checked in new text: in `ph-init` the whole harness, in `ph-doctor` the lines changed since the last migration or `ph-doctor`. The start commit is the last `(commit: …)` number in the history entry of the last finished audit (a `ph-doctor` run or the `ph-doctor` stage of a `ph-update`; an entry of the running work is not one); when it is `pending`, take that work's commit from `git log` (A32); without such an entry, the commit that last changed the `Standard:` line: `git log -1 --format=%h -G 'Standard: pan-harness' -- PAN-HARNESS.md`. New text — the `+` lines and the new files in `git diff <commit> -- AGENTS.md PAN-HARNESS.md pan-harness/ ':!pan-harness/archive'`. `pan-harness-check.mjs --since <commit>` prints them as `REVIEW` lines and puts on a matching line the flag of the item it may break (for example, `A44 negation "never"`). A flag is only a candidate: for each flagged line, write `ok` or `fail` with the reason in the conformance table, and read the lines without a flag for A46–A48. Old text is fitted when it is touched (`structure.md` → "Writing").

| ID | Requirement | Smell | How to check | Fix |
|---|---|---|---|---|
| A39 | Instructions are in command form, the doer and the condition are clear, no short forms (`structure.md` → "Writing", P26) | Ambiguous text | test (the "what was unclear?" question), manual | mechanical (when the meaning does not change), otherwise structural |
| A40 | The commands in the docs are portable | Non-portable command | manual, a test run | mechanical |
| A41 | The rules hold no time-bound sentence ("next week", "for now"); a workaround rule has a `Remove when: …` condition, watched in `plan.md` → `Later and watch` | Time-bound statement, Expired workaround | manual: grep for dates, "for now" and `Remove when`, is the condition met | mechanical: the date into `plan.md`; when the condition is met, structural: remove the rule |
| A42 | The harness does not rely on one agent tool only (a slash command, the tool's own setting) | Tool lock-in | manual | structural |
| A43 | Each concept is written with one term everywhere: by the Glossary, with no gloss in brackets and no synonym (leading word, P26) | Glossed term, Synonym drift | script (`terms`: a gloss in new lines, in `ph-doctor` with `--since <commit>`), manual (synonyms) | mechanical |
| A44 | A rule, a `Rule:` and a step say what to do (positive form); a ban only for a hard rule (`AGENTS.md` → `Boundaries` → `Never` and its R rule), with what to do next to it (P26) | Negation-only rule | script (the `A44` flag in `REVIEW`), manual: search new text for ban verbs ("do not", "never", "must not", "avoid") and see that each has its positive form | mechanical when the meaning does not change; otherwise structural |
| A45 | A playbook step, a `handoff.md` step and a ⏳ item in `plan.md` end with a full condition one can check (completion criterion, P26) | Vague bound | script (the `A45` flag in `REVIEW`), manual: can each step's "when is it done?" be answered from the text; search for vague words such as "the main ones", "enough" | mechanical: `handoff.md`, `plan.md`; structural: a playbook |
| A46 | A concept's definition, rule, reason and exception stand in one place; a file's entry format at the top of that file; text that concerns one domain is in that domain's file (co-location, P9, P26) | Scattered rule | script (the `A46` flag in `REVIEW` and a new file), manual: grep for the topic and see in how many places it shows | structural |
| A47 | Each sentence changes the agent's behaviour: no sentence says what the model does anyway (no-op, P2, P26) | No-op | script (the `A47` flag in `REVIEW`), manual: "would the agent work differently if I removed it?"; when in doubt, `testing.md` → "Simplification experiment" | structural |
| A48 | Each fact has its source: the owner's message, the repo or the result of a command that ran; each result in `Checks:` has the command or evidence that gave it next to it (P26) | Invented fact | manual: compare each reason, criterion, role, date and number of new text with the owner's message, the repo and command results | structural: show the sentence without a source to the owner |
| A49 | `AGENTS.md` has the text boundary rule (template R23, in the `**Writing**` group) that points to `runbook.md` → `Writing the harness`; the chat rule (template R12) starts with "In the chat with the owner", points to R23 and has under it the item against internal labels (such as A1, P1, S2, K4) in messages to the owner and the item on English terms, backticks and short sentences; the intro sentence of `runbook.md` → `Writing the harness` names the agent texts and the rules for them one by one, and the section has `Language of other texts` | Rule leak | script (WARN without the `**Writing**` group; WARN without the internal-labels item under the chat rule), manual (R12, the intro sentence, `Language of other texts`) | mechanical (from the template) |
| A50 | The text written since the start commit is written for its reader: a text an agent reads by the `Writing the harness` rules and in the language set there; a text people read has its language and style chosen by `Language of other texts`, the choice told to the owner, and holds no harness term, ID or source line | Rule leak | manual: for each text file in `git diff --stat <commit> -- . ':!pan-harness'` (README, `docs/`, a prompt, a skill), find its reader and compare with this requirement | structural: show the owner a text for people that the harness rules leaked into |

## Principles

| ID | Requirement | Smell | How to check | Fix |
|---|---|---|---|---|
| A51 | Each fact is in one place: no fact is written in two places or with two values, the rules do not contradict each other or the decisions (P4) | Duplication, Conflicting Instructions | manual: grep, read the rules on one topic side by side, compare with the D entries | structural: keep one place, show the conflict to the owner |
| A52 | The current state and the history are apart: the current files hold no details of past work (P5) | — | manual | mechanical: when the details are in the history, remove them from the current file |
| A53 | What the repo has gets a link, not a copy: the code and folder structure, the README content, the list of commands (P13) | Context Bloat | manual: compare with the README and manifests | structural |
| A54 | No stale instruction: an old command, a missing file, an old version (P15) | Init Fossilization, Stale fact | script (paths), manual (with the live system and the docs) | mechanical (a checked fact), structural (a rule) |
| A55 | A kind of task done a second time has a playbook (P8) | — | manual: look at the history by tag | structural |
| A56 | The harness passes the fresh-agent test (`testing.md`): correct answers to the fixed question set, no serious gap on the "what was unclear?" question (P18) | Ambiguous text | test (with the owner's consent) | by the kind of each finding |
| A57 | The plan of a large task starts with the goal, the outcome and the criteria: `playbooks/large-task.md` → `Planning` and `Execution` hold this rule; in the history entries of the last large tasks `Checks:` starts with the results of the criteria (✅, ❌, ⏳), the ⏳ criteria are in `plan.md` → `Later and watch` (P21) | Unverified done | script (a ✅ without evidence in the last history entry and a ⏳ without its pair in `plan.md`), manual: the history entries of the last 3 large tasks and `plan.md` | structural when the rule is missing; when the result is not written, say so in the report |

## Continuity and checks

| ID | Requirement | Smell | How to check | Fix |
|---|---|---|---|---|
| A58 | The start set answers the 5 main questions or leads to the answer with one link: what the project is; how it is built; how the result is made or run; how it is checked; the current state (P22) | Blank map | manual (no tokens): the place of the answer for each question (file → section) | structural: write the gap into the matching file or the map |
| A59 | `handoff.md` says `**Status:** none` without an active task; in an active task all sections are there, each step has a status, no more than one `active`, `done` with evidence (P24) | Lost thread | script | mechanical |
| A60 | Each project playbook ends with `## Done`: the check levels in order and the safe form of the whole flow (`structure.md` → "Project part") | Unverified done | manual | structural |
| A61 | A rule with a big harm that can be checked mechanically is enforced by a check (a script, a test, a git hook) whose message says what, why and how to fix (P23) | Paper rule | manual: for each `Boundaries` rule, "can a script or a hook check it?", the list of candidates | structural |
| A62 | A doc over 10 KB that is read on demand starts with `## Contents` | Hidden section | script | mechanical |
| A63 | `check.json` → `co_change` ties each code and document folder of the project to the doc that describes it; a project where unfinished-work marks occur has `markers` set (P23) | Stale doc | manual (the setting), script (the warning) | structural: the map is agreed with the owner |
| A64 | A complex workflow (several steps, a verifier and a way back) is a table in a domain file: step, verifier, where to go on failure, where the state is; with `live-system=yes` a silent fallback is watched | Hidden fallback | manual | structural |
| A65 | The project is in git (`structure.md` → "Git"): `.githooks/pre-commit` is there and `core.hooksPath` points to it, `.gitignore` is there, no `never_track` warnings; `AGENTS.md` → R4 and the commit item of `playbooks/end-of-task.md` match the S6 answer | No git setup | script (the repo, `never_track`), manual (the hook, R4) | mechanical: the hook and `.gitignore`; structural: installing git, R4 |
| A66 | `playbooks/large-task.md` → `Execution` has the limit rule: the template's three bullets, or a rule of the same content the project wrote in its own words and the owner chose (when the agent can see the limit, it compares the budget with the share left before a stage; when the budget is over, the scope stays and the rest goes into `plan.md` → `Scheduled`; when it cannot see the limit, the work goes on without asking the owner) | Interrupted work | manual: `grep -n 'limit' pan-harness/playbooks/large-task.md` | mechanical (from the template) |
| A67 | `AGENTS.md` → `Project` names the artifact-folder (`style-questions.md` S31) or the open issue of its choice; the artifacts stand in it, apart from the harness, the tool folders and the root files the tools need, or their agreed move waits in `plan.md` → `Queue`, or the owner declined the move (a decision); a new project's folder may be empty or not made yet | Mixed artifacts | manual | structural: ask the owner the artifact-folder question (S31) |
