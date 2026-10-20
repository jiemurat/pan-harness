# Panoramic Harness standard

## Contents
- Glossary
- Layout
- Profile
- Root files
- Standard part (`pan-harness/`)
- Project part (`pan-harness/project/`)
- Journals
- Writing
- Git, size limits, history and archive, extensions and settings, version: `settings.md`

## Glossary

The skills and the harness are written in English; the chat with the owner is in the language the owner chose (S7). The terms below are used in this meaning.

| Term | Meaning |
|---|---|
| pan-harness | Short name of Panoramic Harness: the project's system of knowledge and rules for agents, `AGENTS.md`, `PAN-HARNESS.md` and `pan-harness/` |
| pan-harness package | The `@jiemurat/pan-harness` npm package: the `ph-*` skills, the CLI that installs them into a project, the templates and the scripts. The skills are installed and updated from it (`npx @jiemurat/pan-harness@latest init`, `ph-update`). Both the owner and the agent call it by this name |
| project | The project itself: the work the owner and the agent do together |
| owner | The project owner: the person who installs the pan-harness package into the project-folder and runs it with an agent, answers the questions and makes the decisions |
| project-folder | The folder the pan-harness package is installed into, where the owner and the agent work: the harness, the tool folders and the artifact-folder are in it |
| artifact | A work product of the project, an input or an output: code, a document, data. Not only a build output, and not a page of the Claude Artifact feature |
| artifact-folder | The one folder of the project-folder that holds the artifacts, apart from the harness, the tool folders and the files the tools look for in the root (manifests, lock files, `Dockerfile`, CI settings, `README.md`), for example `src/` or `documents/`; agreed with the owner (`style-questions.md` → `Asked`, S31) |
| fast check | A check of the artifact-folder that runs in seconds to a minute (a test subset, a type check, a lint). With `code=yes` the agent runs it before a task and after each change (`PAN-HARNESS.md` → `Project checks` → `Fast check`); the full check runs at the end of a task |
| see the result | Start the program (or open the output) and look at it working, in place of reading a check's output (`PAN-HARNESS.md` → `Project checks` → `See the result`) |
| lesson question | A question of the harness test that puts the agent into the situation of a past mistake; one per lesson that became a rule (`playbooks/pan-harness.md` → `Lesson questions`) |
| start set | The four files read at session start: `AGENTS.md`, `PAN-HARNESS.md`, `state.md`, `plan.md` |
| always-loaded layer | The file an agent tool loads by itself at session start (`AGENTS.md`) |
| progressive disclosure | The other files are read when needed: the map says which file to read when |
| standard part | The standard files in `pan-harness/`: the same in every project |
| project part | `pan-harness/project/`: only what is specific to this project |
| profile | The project's 3 flags (`live-system`, `code`, `sensitive-data`): they set which part of the standard is needed |
| live system | Something that runs all the time: a server, a bot, a site, a cron job |
| journal | Append-only entries, the new one at the end: `decisions.md`, `feedback.md`, `lessons.md`, `history/` |
| superseded | A decision whose place a new decision took. It moves to the archive |
| extension | The project's own check script: `project/scripts/check-*`, `project/scripts/secret-check-*` |
| status check | Checking the state of a live system by reading only. A status script does this |
| conformance | How well the project's harness matches the standard and the principles (`audit.md`) |
| smell | A sign of a defect in the harness (the `Smell` column of `audit.md`) |
| skill limitation | A defect in the skill itself (for example, a false warning of a standard script). The procedure: `doctor.md` → "6. Fix" |
| mechanical fix | A fix the rules define that does not change the meaning. Done at once |
| structural fix | A fix that changes a rule, the structure or the meaning. Done with a plan and the owner's approval |
| migration | Moving the harness to a new version of the standard (`changelog.md`) |
| migration table | In `ph-init`, where each section of the existing agent files moves |
| fresh-agent test | Testing the harness with a new agent that has seen only the repo (`testing.md`) |
| handoff | The state file of the active large task (`pan-harness/handoff.md`): steps, changed files, checks, decisions, the next step. When the session changes, the work goes on from this file (P24) |
| SNR | A rule's useful share: in how many of the usual task types it is needed. A rule unneeded in many task types moves to a domain playbook (P9, A5) |
| anchor | The verification that ties a numeric criterion to the real goal: the owner's spot check, real use or ground truth (P21) |
| strong model / small model | A strong and a small model. A test can use either |
| verified / unverified | In a report: a checked fact / a fact not checked yet |
| provisional | A decision taken by the recommendation, not yet approved by the owner. A D entry carries it with the mark `(provisional: owner to confirm)` |
| approval | The owner's explicit approval, given with the word the owner chose in the project (for example, "start") |
| task types | The kinds of task: `question` (a question or a diagnosis), `small change` (a small change the owner named exactly), `large task` (big or unclear work) |
| goal / outcome | Goal — why the work is done; outcome — what the owner has at the end of the work |
| acceptance criteria | Criteria: signs the owner sees and that can be measured, which confirm the outcome is reached. Agreed in the plan of a large task (P21) |
| Never / Ask first / Always | The three kinds of the `Boundaries` block in `AGENTS.md` |
| external side effect | An action that has an effect outside: a message, a post, a mail, a payment |
| irreversible action | An action that cannot be undone: deleting, rewriting history, a push |
| tokens per task | All tokens of a task. This is the measure, not the tokens of one request (tokens per request) |
| topic tag | The topic mark in a journal entry's heading, for example `[docs]` |
| context pointer | A line in the context that leads to other material: a file line in the map, a section link, a skill description. It says what is there and when to read it (P26) |
| co-location | A concept's definition, rule and exception standing under one heading (P26) |
| completion criterion | A condition one can check that shows a step is done; acceptance criteria belong to the whole task (P26) |
| positive form | The form of a rule that says what to do (P26) |
| leading word | A term the model knows, repeated in the same form everywhere (P26) |
| threshold | The pass line of a criterion: a number or yes/no (P21) |
| unknown standard | `PAN-HARNESS.md` has no `Standard:` line, or its version is not in `changelog.md`. Such a harness is migrated by comparing it with `structure.md` and `templates/` (`doctor.md` → "3. Migration"); only these two conditions are used to find it |
| single source | The one place where a fact or a rule is kept: other places link to it (P4) |
| no-op | A sentence that says what the model does anyway. It is deleted (P26) |

Each concept is written with one term, with no gloss in brackets and no synonym (leading word, P26); `pan-harness-check.mjs` points out a gloss in new lines (`terms`). In the chat with the owner, a word that has several meanings in the owner's language gives way to the English term itself: structure, copy, move, migration, state, status, check, verification, test, limit, boundary, estimate, assumption, project, artifact, project-folder, artifact-folder, explained once at its first use (the chat rule, template R12). The term keeps its form in a sentence; an ending of the owner's language attaches to it by that language's rule.

## Layout

```
<project-folder>/
├── AGENTS.md                  entry point (agent tools load it by themselves)
├── PAN-HARNESS.md             profile, map, project checks
├── CLAUDE.md                  optional, only the `@AGENTS.md` import
└── pan-harness/
    ├── state.md               current state
    ├── plan.md                all open work and dates
    ├── handoff.md             state of the active large task (if none: Status none)
    ├── system-map.md          components, outside services, secret names, repo map
    ├── runbook.md             commands, scripts, writing harness text, topic tags
    ├── decisions.md           D… current decisions
    ├── feedback.md            F… the owner's words about the way of working
    ├── lessons.md             L… mistakes and lessons
    ├── history/YYYY-MM.md     history of the work, month by month
    ├── archive/               superseded decisions, old parts of the journals, originals of old agent files
    ├── playbooks/
    │   ├── large-task.md      planning and carrying out a large task
    │   ├── end-of-task.md     the end-of-task checklist, journal rules
    │   ├── delegation.md      sub-agent work
    │   └── pan-harness.md     `ph-doctor`, growth limits and the project steps
    ├── scripts/               copies from the skill only, not edited in the project
    │   ├── pan-harness-check.mjs   mandatory
    │   └── secret-check.mjs        when the profile lists `secrets`
    └── project/               everything specific to the project
        ├── check.json         optional settings (`settings.md`)
        ├── <domain-file>.md
        ├── playbooks/         the project's playbooks by kind of task
        ├── scripts/           the project's scripts and extensions
        └── references/        reference material
```

The files of the standard part are mandatory, `secret-check.mjs` depends on the profile. When the project has nothing for a file, the file stays with one line (for example, `state.md`: "No live system"). This way the agent knows in every project where to look for what. The standard part holds no file or folder outside this list: what is specific to the project goes into `project/`. `pan-harness-check.mjs` checks this.

**Names.** File and folder names are in English, lowercase, with hyphens (`status-check.sh`, `check-backup.mjs`). `AGENTS.md`, `PAN-HARNESS.md` and `CLAUDE.md` in the root are the exception: agent tools and convention set these names.

**Language.** The harness is in English; the chat with the owner is in the language the owner chose (S7). Field names, status marks (`todo`, `done`, ✅, ⏳), headings and table columns stay as the standard has them: the check script reads them, and other files refer to them by name.

**Conflict.** When the skill files contradict each other, this file (`structure.md`) wins, then `audit.md`, then the templates.

## Profile

The `## Profile` section of `PAN-HARNESS.md` holds one line:

```
Profile: live-system=yes, code=yes, sensitive-data=secrets+pii
```

| Flag | Values | When `yes` | When `no` |
|---|---|---|---|
| `live-system` | `yes` / `no` | Restart and deploy rules (S17), a status script (S28), the live system state in `state.md`, `Downtime:` in a history entry | `state.md` holds the work state (for example, the number of documents, open drafts). These rules and fields are not there |
| `code` | `yes` / `no` | Test and linter rules, trying a new script with `--dry-run` or on a copy | The document formats and the tools that read them (pdf, docx, xlsx) go into `runbook.md` → `Environment and access` |
| `sensitive-data` | `secrets`, `pii`, `confidential` (joined with `+`) or `none` | `secrets`: the rules on secret values and secret files, `scripts/secret-check.mjs` is installed. `pii` (personal data) and `confidential` (confidential documents): the harness gets only a path, an ID and a neutral description in place of the content | `none`: only the general "confidential content" rule |

- **The `[profile: …]` mark in templates** applies to:
  - the whole line, when it stands at the start of a line or an item;
  - the block up to the next empty line, when it stands on a line of its own;
  - that sentence (up to its full stop), when it stands at the start of a sentence after a full stop;
  - that item of a list (up to the next comma), when it stands inside a list after a comma or a colon;
  - the whole row, in a table row.

  When the condition does not match, that part is removed; when it matches, only the mark is removed. A condition joined with `or` holds when one of its parts matches. After removing, renumber the lists and the rules and update the `(R…)` links.
- **Universality.** Every rule, template and check of the standard works in a code project and in a document project. What only code has is written with a profile condition (`[profile: code=yes]`) and together with its counterpart in a document project. Git is in every project (`settings.md` → "Git"), so every rule is written as if git is there.
- `ph-init` finds the profile from the repo, the owner approves it, the reason goes into a D entry. `ph-doctor` compares it with reality (for example, a live system was added or code appeared) and proposes a change as a structural fix.
- Node is not part of the profile, because the environment differs by agent (the owner's laptop, a server). The agent checks it with `node --version` (18 or newer). Without Node, in `ph-init` and `ph-doctor` the agent does the script checks by hand by `audit.md`, and in other work writes "the script did not run" in the report.

## Root files

**`AGENTS.md`** — many agent tools load it by themselves at session start (always-loaded layer). So the rules that concern every task stand here. Target size: 100–150 lines (P1). Its sections (`templates/AGENTS.md.tmpl`):
1. The first sentence: the entry point and a pointer to `PAN-HARNESS.md`.
2. `## Project`: the owner, the goal, the rule on talking with the owner.
3. `## Boundaries`: the `**Never:**`, `**Ask first:**` and `**Always:**` lines, with `(R…)` links to the rules. It stands at the top of the file, because a model weighs a sentence in the middle of a long text less (P7). Every rule whose breach can do harm (an outage, lost data, a secret, an effect outside, an action that cannot be undone) is here.
4. `## Session start`: which files are read in which order, going on from `handoff.md` when a task is active, checking the state.
5. `## Workflow`: the task types and a pointer to `pan-harness/playbooks/large-task.md` (`## Planning`: the first question is the goal, the outcome and the criteria, the final plan has the exceptions, the budget and the stages, P21; `## Execution`: updating `handoff.md`, checking the criteria with evidence, the limit rule: comparing the budget with the limit left before a big stage).
6. `## Working style`: check every claim, before and after, test first, small steps, speak in numbers, keep the scope, honest report.
7. `## Rules`: the domain rules pointer, then the numbered rules `R1…` with their source (`← F…`, `← L…`, `← D…`). A domain rule stands with its number at the top of its domain playbook; `AGENTS.md` keeps only the pointer line (P9).

**`PAN-HARNESS.md`** — the agent reads it first after `AGENTS.md` (`templates/PAN-HARNESS.md.tmpl`). Its sections: the definition of the pan-harness, `## Profile`, `## Map` (each file: what is there and when to read it), `## Project checks` (the full check and the status checks; with `code=yes` the `Fast check:`, `See the result:` and `Logs:` lines and the dated result of the first run). The last line holds the standard version.

**`CLAUDE.md`** — when the project already has one or the owner uses a setup in Claude Code that relies on `CLAUDE.md`, it holds only the `@AGENTS.md` import. Otherwise only `AGENTS.md` is written: Claude Code (v2.1.277+) reads it by itself. Project knowledge is not written into it (P17). Claude Code does not read `AGENTS.md` when there is a `CLAUDE.md`, `.claude/CLAUDE.md` or `CLAUDE.local.md`. It loads an `AGENTS.md` in a subfolder when a file there is read, so the skill templates are named `.tmpl`.

## Standard part (`pan-harness/`)

| File | Contents | When to read |
|---|---|---|
| `state.md` | Only the current state: versions, what runs, known issues. Without a live system, the state of the work. `Last updated:` at the top | At every session start |
| `plan.md` | All open work: `Queue` (the goal, criteria and exceptions of the active large task in short, without status marks: `✅` only in the history; a link to `handoff.md`), `Scheduled` (the table of dated work), `Awaiting owner decision`, `Later and watch` (⏳ criteria: the D number, a date or an event, how it is checked) | At every session start |
| `handoff.md` | The state of the active large task: `**Status:** active` or `none`; `## Task` (task, goal, not done, budget), `## Criteria`, `## Steps` (status `todo`, `active` — one at a time, `blocked` — with the reason, `done` — with evidence), `## Changed files`, `## Checks`, `## Decisions`, `## Open questions`, `## Next step`, `## Work files`. The intro names the sections and the status line in plain words, so each heading and the status line stand once (a script edit by the first match lands on them); with `none` the file keeps no section. A file that does not exist yet with the mark `(new)`, without backticks. Compact (about 8 KB): the details of a finished stage move to the history entry. A permission given for the task (for example, a restart) is limited to that task | At session start, when `**Status:** active` |
| `system-map.md` | Components, outside services, secret names (without values), repo map: the main folders and entry points, one line each. The folder and file structure gets only a link (P13) | On a "where?" or "how is it built?" question |
| `runbook.md` | Common commands, the list of scripts, the rules for writing text an agent reads (`Writing the harness`), `Topic tags`, `Accepted warnings` | When a command is needed and before writing text an agent reads |
| `decisions.md` | D… current decisions | On a "why is it so?" question |
| `feedback.md` | F… the owner's words and which rule they became | When the reason of a rule is needed |
| `lessons.md` | L… lessons: what happened, the layer, the rule, how it is checked | Before similar work |
| `history/` | History of the work, each month in its own file | When past work is needed, with grep |
| `archive/` | Superseded decisions, old parts of the journals, originals of migrated old agent files | When a journal lacks it, with grep |
| `playbooks/large-task.md` | Planning a large task (questions round by round, criteria, the plan) and carrying it out (`handoff.md`, evidence, budget, usage limit) | Before planning a large task and when one goes on |
| `playbooks/delegation.md` | Sub-agent work: when, model, brief, check | Before a sub-agent |
| `playbooks/end-of-task.md` | The journal rules and the end-of-task checklist: history entry, `plan.md`, feedback and lessons, `.gitignore`, checks, commit, report | At the end of every task |
| `playbooks/pan-harness.md` | The command that installs the skills, `ph-doctor`, the growth limits, the project's extra steps, the fixed question set and its last result (`## Test questions`), the lesson questions (`### Lesson questions`), the owner's standing answer on the fresh-agent test | In `ph-doctor`, on a size warning and before a test |
| `scripts/pan-harness-check.mjs` | Structure, ID, field, path, size and term check | At the end of every task |
| `scripts/secret-check.mjs` | Secret search (when the profile lists `secrets`) | Before a commit |

## Project part (`pan-harness/project/`)

Only what this project has: domain files (for example, a list of agents, cost measurements, a database schema), the project's playbooks, scripts and reference material. Each stands in `PAN-HARNESS.md` → `Map` with "what is there (keywords), when it is read".

**Playbook form.** At the top the domain rules (with their number and source), then the steps, at the end `## Done`: when work in this domain counts as done — the check levels: static (lint, schema, links) → working (tests, a run) → the whole flow (end to end in a real or a test environment). The next level starts when the one before passes; the work is done when every mandatory level passes. When the whole flow has an effect outside (a message, a post, a payment), its safe form is written: a dry run, read-only, or ⏳ until real use. In a document project: lint and links → facts and quotes → reading the assembled document or the owner's review.

**A complex workflow** (several steps, with a verifier and a way back) is written in a domain file as a table: step → who verifies → where to go on failure (retry, the previous step, a fallback, the owner) → where the state is. A silent fallback shows in the table too.

## Journals

| Journal | ID | Entry format (also at the top of the journal) |
|---|---|---|
| `decisions.md` | D1… | One paragraph: `- **D<n>** (YYYY-MM-DD) [tag] Decision. Why: … Rejected: … Where: …` |
| `feedback.md` | F1… | `### F<n> — YYYY-MM-DD — <title> [tag]`, then `- **Quote:**` (the owner's words, verbatim where possible), `- **Context:**`, `- **Result:**` (which rule it became: `→ R<n>`) |
| `lessons.md` | L1… | `- **L<n> (YYYY-MM-DD) — <title>.** [tag]`, then what happened, `Layer: …` (task, context, environment, verification or state), `Rule: …`, `Check: …` |
| `history/YYYY-MM.md` | date | `### YYYY-MM-DD — <task name> [tag]`, then `- **What and why:**`, `- **Checks:**` (in a large task it starts with the results of the criteria: ✅, ❌, ⏳), `- **Downtime:**` (only with `live-system=yes`), `- **Files:**` (ending with `(commit: <hash>)` or `(commit: pending)`: `settings.md` → "History and archive") |

- **`Where:`** — the file or setting where the decision is carried out. The agent checks that place before relying on the decision (P6).
- **Numbers** run from 1 in each journal together with its archive and never change. R — the rules in `AGENTS.md` and in the playbooks, one sequence. Q — planning questions: they stay in the chat, the result goes into a D or an F.
- **Topic tags.** Each entry has at least one `[tag]` in its heading. The list is in the `Topic tags` line of `runbook.md`; the check script reads it from there. The standard tags: `[docs]` (the harness and documents), `[workflow]` (the owner's way of working), `[config]`, `[security]`, `[upgrade]`. A project adds its own tags.
- **Append-only.** The content of an old entry does not change. Only paths, links and field names (when the standard version changes, by `changelog.md`) are fixed. When a decision changes, a new D is written; the old one gets `Archived (YYYY-MM-DD): superseded by D<n>.` at its end and moves to `archive/decisions.md`. A one-off decision that is done is archived too: `Archived (YYYY-MM-DD): done (one-off).`
- **A provisional decision.** An option taken by the recommendation on a question the owner did not answer goes into a D with the mark `(provisional: owner to confirm)` and into `plan.md` → `Awaiting owner decision`.
- **In a conflict** the current decision and `state.md` win: an old journal entry tells the state of its time.
- **A new standing instruction** is first written into `feedback.md`, then becomes the next numbered rule: into `AGENTS.md` when it concerns every task, at the top of that domain's playbook when it concerns one domain (P9). A short line of a rule whose breach can do harm also stands in `## Boundaries`, wherever the rule itself is (P7). A mistake repeated a second time turns from a lesson into a rule, and into a check when it can be checked mechanically (P16, P23).
- **A temporary rule** (needed until some defect is fixed or something changes) is written with the condition of its removal: `Remove when: …`. The condition is watched in `plan.md` → `Later and watch`; when it is met, the rule is removed or moves to a playbook (A41).

## Writing

Write the harness text (`AGENTS.md`, `PAN-HARNESS.md`, `CLAUDE.md`, `pan-harness/`) with all the rules below: a strong and a small model must read it the same way and follow it with the same process every time (P26). Write any other text an agent reads (the list is in the intro sentence of `templates/pan-harness/runbook.md.tmpl` → `Writing the harness`: the context files of other agents, skills, commands, subagents, the prompts in the product, the files of other systems' agents) with the first nine rules, from `Command form` to `No-op`; its language — the one the owner asked for, else the existing file's language, a new file in English. The harness language and the remaining rules concern only the harness. The language and the style of a text people read (the project's README and documents, a letter, a guide, a report file, a commit message) are chosen separately by the order in `runbook.md` → `Writing the harness` → `Language of other texts` (template R23 points there): the owner's instruction (given in the chat or written in the harness, for example `Commit message` in `runbook.md`), the document's own language and style, in a new document those of the project's documents with the same purpose, otherwise the chat language and a style that fits the document type, with the choice told to the owner. A source, file path or ID line goes into a text for people only when the owner asks; a `Quote:` in `feedback.md` keeps the owner's words. Checking every claim and the safety rules concern every text, the chat rules (language, style, form of address; template R12) only the chat with the owner. Apply the rules to new and changed text, and fit old text to them when someone touches it. The detailed method and examples are in the `ph-writing-for-agents` skill (when installed); the project's rules win over it. In a project the rules stand in `runbook.md` → `Writing the harness`, a file's entry format at the top of that file.
- **Command form, with a clear doer and condition.** Not "is updated" but "update `state.md`". A short form ("no commit") is misread: write the full sentence. One idea per item.
- **Context pointer.** A file line in the map, a section link and the `When to read` column say first what is there, then when it is read. The keywords of the questions the file answers stand at the start ("skills: report, daily, post"), one trigger per situation. A small model follows only the words it sees (P3).
- **Progressive disclosure and co-location.** What every task needs is in `AGENTS.md`, what one domain needs is in that domain's playbook or `project/` file, behind a link (P9). A concept's definition, rule, reason and exception stand under one heading, a file's entry format at the top of that file.
- **Completion criterion.** A playbook step, a `handoff.md` step and a ⏳ item in `plan.md` end with a full condition one can check: "the `Where:` field of each D is opened and checked, the result is in the table". In place of a vague word ("the main ones", "enough"), the exact set is written.
- **Positive form.** A rule, a `Rule:` and a step say what to do: "write only a path, an ID and a neutral description". A ban only for a hard rule (`AGENTS.md` → `Boundaries` → `Never` and its R rule), with what to do next to it.
- **Leading word.** Each concept is written with one term everywhere ("Glossary"). One term the model knows takes the place of a three-sentence explanation.
- **Single source.** Each fact and rule is kept in one place, other places link to it (P4); for what the repo, a config or `--help` has: `SKILL.md` → "Core rules", rule 2 (P13).
- **Source.** Each fact is written with its source: the owner's message, the repo or the result of a command that ran. A reason, criterion, role or date without a source is asked of the owner; each result in `Checks:` has the command or evidence that gave it next to it. A sentence the agent made up and left in the harness is taken as a fact by the next session.
- **No-op.** Each sentence changes the agent's behaviour: a sentence that says what the model does anyway is deleted whole. When in doubt, it is tested with `testing.md` → "Simplification experiment".
- **Portable commands.** A command in a doc must work the same in any shell and `grep` variant: write `grep -E 'a|b'`, because `grep 'a\|b'` works only in GNU. When the order of results matters, write `cat files | grep`: in some environments `grep` points to another program and prints the results of several files out of order.
- **One-way links.** The project's tools (skills, scripts) link to the harness. The harness names them in plain words, not by their internal numbers (an item, a stage): this way the harness is not tied to passing work.
- **The decision next to the result.** A value chosen by a measurement or by the owner's decision has the D number of the decision next to it: in code in a comment (`# D1: …`), in a doc in a hidden comment (`<!-- D1 -->`) or in metadata, outside the published text. This way an agent that wants to change the value sees the reason first.
- **A section link** is written in the form `` `file.md` → "Heading" `` and leads to an existing heading or bold label (the script checks it). When a heading is renamed, grep for the old name and update the links.
- **Time.** A rule holds the general form, the dates and terms go into `plan.md`: "next week" or "for now" in a rule goes stale.

