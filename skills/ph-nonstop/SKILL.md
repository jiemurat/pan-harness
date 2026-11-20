---
name: ph-nonstop
description: Runs one approved goal as a long run of work cycles without stopping for the owner, each cycle with its tests, commit and journal line. Use it when the owner asks for a nonstop or autonomous run, or adds a request to one, changes, pauses or stops it, or asks its state.
compatibility: git, Node 18 or newer and a pan-harness; Claude Desktop runs the cycles in a cycle session (its session tools), another agent runs them itself one by one
license: MIT
metadata:
  version: "3.21.12"
  package: "@jiemurat/pan-harness"
---

# Nonstop run

A **run** is one goal the owner approves once, in a **charter** (`pan-harness/project/run-<name>.md`), and then a chain of **cycles** with no stop for the owner. A cycle is one unit of work with its tests, its commit and one journal line. You are the **opener**: you hold the charter, pick and brief each cycle, check its result and keep the journal. In Claude Desktop one **cycle session** does the cycles, one at a time, cleared between them; it is never called a worker (worker-agents are `ph-workers`). Without session tools you do each cycle yourself (`## Without session tools`).

The charter is a harness file: the project's rules (`AGENTS.md`) bind every cycle, and the charter adds the run's own. `<skill>` is the folder of this `SKILL.md`.

| The situation | The part |
|---|---|
| the owner asks for a run and no `pan-harness/project/run-*.md` charter has `**Status:** running` or `paused` | `## Start` |
| a cycle session's message (`Done`, `Waiting`, `Limit`), a timer, or a turn after a cycle | `## The loop` |
| the owner's words while a run is on | `## The owner's words` |
| the owner asks the state | `## Status` |

## Start

1. **The harness.** Read `AGENTS.md`, `pan-harness/state.md` and `pan-harness/plan.md`. No `AGENTS.md`: tell the owner a run needs a pan-harness (`/ph-init`) and stop. Done when the start set is read.
2. **The intake.** Go through every item of [`references/intake.md`](references/intake.md). For each, the answer comes from one of three sources, in this order: the harness (the file and section that say it), the item's safe default, the owner. An item with a harness answer or a safe default goes into one "accept as recommended" list with its source. Ask every other item, round by round, in the form of the project's `playbooks/questions.md`, and write each round's answers into the charter draft at once. The number of questions has no cap: the rounds go on until no item is open, and no item gets a guessed answer. Done when every item has its answer and source.
3. **The charter.** Copy [`templates/charter.md`](templates/charter.md) to `pan-harness/project/run-<name>.md` (`<name>`: a short slug of the goal) and fill it from the intake. Add one line to `PAN-HARNESS.md`, the Map's `project/` list: ``- `project/run-<name>.md` — the charter and journal of the nonstop run `<name>` (`ph-nonstop`; moved to `archive/` when the run ends)``; without it the harness check warns "not on the map". Show the owner the goal, the never-list, the current outward rules, the limits and the "accept as recommended" list, and ask for one approval. Write the owner's words of the approval on the `**Approved:**` line. Done when that line quotes the owner and `node pan-harness/scripts/pan-harness-check.mjs` prints no warning naming the charter.
4. **The cycle session.** Claude Desktop (`mcp__ccd_session__start_session`): start it on this turn, the owner's own, since the app refuses a start on a turn another session's message began: `initiation: "user_asked"`, `context: "fresh"`, `use_worktree: false`, `title` = the charter's cycle title for cycle 1, `prompt` = the cycle 1 brief (`## The loop`, steps 1–2), the model and effort of the `## Model and effort` section of the project's `playbooks/delegation.md`. Write its id on the charter's `**Cycle session:**` line. A refused start (the approval came relayed from another session): call `start_session` with `initiation: "own_initiative"` and the same brief, and tell the owner in one line that the run starts when they click the card; or ask the owner to approve again in this session's own window. Without session tools, write `none` there. Done when the line holds an id or `none`.
5. **Commit** the charter and the map line alone and tell the owner in one line: the run's name, the first cycle, the words that pause and stop it. The cycle 1 brief went with the start: end the turn with the `⏳` line of `## The loop`, step 3. Without session tools, go on with `## Without session tools`.

## The loop

One pass is one cycle. Run it again until a pause or stop word, or the goal is reached.

1. **Pick.** Before a new cycle, read the 5-hour limit (`mcp__ccd_session_mgmt__get_usage`); under the charter's floor, go to `### The usage limit`. Take the next cycle by the charter's `## Cycle sources`, in order: the owner's requests in `## Queue`, the agreed queue, the backlog files it names, a fresh review of one of its review kinds (take the kinds in turn). A parked cycle waits until the owner answers it. Every 10th cycle, and at any size warning of the harness check, the cycle is a hygiene cycle ([`references/hygiene.md`](references/hygiene.md)). Done when the cycle's goal and its done criteria are written in one sentence each.
2. **Brief.** Copy [`templates/cycle-brief.md`](templates/cycle-brief.md) to `pan-harness/brief-cycle.md` and fill its fields: the cycle's number and goal, its done criteria (the charter's `## Done bar` for its risk), the files other running work touches, the brief lines with your values. Then run `node <skill>/scripts/never-list.mjs pan-harness/project/run-<name>.md pan-harness/brief-cycle.md`: it copies the charter's never-list into the brief word for word. Done when it exits 0.
3. **Send.**
   - Claude Desktop: the cycle session must be idle (`get_session`: `isRunning` false). For cycle 2 and later: `clear_session` with its id, `set_session_title` with the cycle's title, then `SendMessage` with the brief; the result must say `delivered`. A refused clear for live work (a background task, a timer): send the cycle session "Stop your background work and timers, then reply 'Ready'", and clear on its reply. A refused clear for any other reason (the session is on the owner's screen, pinned): send the brief without the clear, its first line "New cycle: the previous cycle is closed, work only on this brief", and tell the owner in one line why it was not cleared. Done when the brief is delivered.
   - Without session tools: `## Without session tools`.

   End the turn with a `⏳` line naming the cycle: only the cycle session's message wakes you.
4. **On 'Waiting'.** A question whose answer stays inside the goal, the scope and the never-list: answer it yourself as 'Opener: <answer>' and log it in the journal line of the cycle. A question only the owner can answer (outside the goal, the never-list or the current outward rules, an irreversible action, a publish, the owner's taste): **park** the cycle. Ask the cycle session to save its state into `pan-harness/handoff-cycle-<N>.md` and reply 'Parked'; write the question into the charter's `## For you`, with the cycle and its state file; go on with the next cycle from step 1. When the owner answers it, the parked cycle goes to the top of `## Queue` with the answer. Done when the question is answered or parked.
5. **Check the Done.** A cycle's 'Done' is the cycle session's word: check it yourself before the journal.
   - `git show --stat <commit>`: the commit exists and its files belong to the cycle's goal.
   - `git status --short`: none of the cycle's files is left uncommitted.
   - Run the project's fast check (the `Project checks` section of its `PAN-HARNESS.md`) and see it pass.
   - The 'Done' has its `Not run:` and `Not seen:` lines.
   - In the cycle's history entry, write the commit number in place of `pending`.

   A failed item: send the cycle session the item and the output; the cycle goes on until it passes. Done when every item passed.
6. **Journal.** Add one line at the top of the charter's `## Journal`, by its format; take its time from `date '+%Y-%m-%d %H:%M'`, run for that line (every journal line of the run, the pause and limit lines too). Commit the charter with the history fix (`git commit -- <files>`). Done when the commit is made.
7. **Next.** Paused or stopped: `## The owner's words`. Otherwise go back to step 1.

### The usage limit

The floor is the charter's value (default: 10% of the 5-hour limit left). The cycle session stops at it by its brief line, saves its state and sends 'Limit: <reset time>'. At the floor, by that message or by your own read in step 1:
- Claude Desktop with `CronCreate`: set one one-shot timer (`recurring: false`) for the reset time plus 5 minutes. `get_usage` gives the reset time in UTC (`resetsAt`), the timer takes local time; this prints the cron fields: `node -e 'const d=new Date(Math.ceil((Date.parse(process.argv[1])+5*60e3)/60e3)*60e3);console.log([d.getMinutes(),d.getHours(),d.getDate(),d.getMonth()+1,"*"].join(" "))' <resetsAt>`. Its prompt: "ph-nonstop: the usage limit reset, go on with the run `<name>`". Write one journal line ("paused for the usage limit until <local time>") and end the turn: the timer fires while this session is idle, and the run goes on by itself. When it fires: send the cycle session "Go on from `pan-harness/handoff-cycle-<N>.md`" for a stopped cycle, else step 1. While the timer waits, this session cannot be cleared: before your own context refresh, delete it (`CronDelete`).
- No timer tool: write the journal line, stop and tell the owner the reset time and that "go on" resumes the run (`⚠️` line).

The weekly limit: at the charter's weekly floor (default: 95% used), stop the same way and ask the owner whether to go on; a timer does not wait out a weekly reset.

## The owner's words

While a run is on, read every owner message as one of these, and act on it as the run's next event:

| The words | The action |
|---|---|
| a correction of the running cycle | send it to the cycle session as 'Owner: "<words>"' (`queued` is fine: it reaches the session at its next tool round); it adjusts that cycle |
| a new request | the top of `## Queue`: it is the next cycle, ahead of the rest |
| a change of what the run may do outside | a new dated line at the top of `## Current outward rules`, the owner's words quoted; the line overrides the older ones; tell the cycle session when it touches the running cycle |
| the charter's pause words | after the running cycle, nothing new starts, not even a hygiene cycle: `**Status:** paused`, one journal line, a `💤` line naming the resume words |
| the charter's resume words | `**Status:** running`, then `## The loop`, step 1 |
| the charter's stop words | after the running cycle: `## The end` |
| unclear which | ask the owner one short question |

An irreversible action (deleting, rewriting history, a force push, moving a tag) and a publish need the owner's word each time, also when the run is on: they never stand in the charter or its outward rules.

### The end

After the running cycle: `**Status:** stopped`, the final report to the owner (the cycles done, what changed for the owner, what waits in `## For you`, what was not run or not seen), archive the cycle session (`archive_session`). In the owner's own session, end with the card that deletes it (`delete_session`); an opener another session opened sends its own 'Done' up instead. Remove `pan-harness/brief-cycle.md` and every `handoff-cycle-*.md`. Run `git mv pan-harness/project/run-<name>.md pan-harness/archive/run-<name>.md` and delete the map line of the charter from `PAN-HARNESS.md`: the charter stays as the run's record, and the check no longer asks for a map line. Commit. Done when `node pan-harness/scripts/pan-harness-check.mjs` prints no warning naming the charter.

## Status

Read the charter, `git log --oneline -10` and, in Claude Desktop, the cycle session (`get_session`, the last rows of `list_events`) in this turn. Tell the owner in a few lines: the run's status, the running cycle and its state, the cycles done, what waits in `## For you`, the usage limit. A state taken only from an old note says `unverified`.

## Without session tools

Do each cycle yourself in this session, by its brief file as if it came to you: steps 1 and 2 as written, then the brief's work, then steps 5 and 6. Where your agent has sub-agents, give a side task one, its brief carrying the never-list word for word. Keep the run's state in the charter and `pan-harness/brief-cycle.md`, so a new session goes on from them. A question only the owner can answer parks the cycle as step 4 says.
