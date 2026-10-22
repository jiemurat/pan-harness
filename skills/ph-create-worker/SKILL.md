---
name: ph-create-worker
description: Adds a new worker-agent name to the project's list (pan-harness/workers.md), next to the preset TARS, CASE, PLEX, KIPP and WALLE. Use it when the owner asks to create or add a worker-agent, or names a worker that is not in the list.
compatibility: git and Node 18 or newer
license: MIT
metadata:
  version: "2.10.5"
  package: "@jiemurat/pan-harness"
---

# New worker-agent

A worker-agent is a name in `pan-harness/workers.md`; the main-agent (named in the `- **Main-agent:**` line of `AGENTS.md`) gives it tasks with the `ph-workers` skill, and only then does it get a folder and a session. Five names come preset: TARS, CASE, PLEX, KIPP and WALLE. `<skill>` below is the folder of this `SKILL.md`; run the commands from the main folder.

## Steps

1. **The list.** Run `node <skill>/workers/workers.mjs status --root .`. When it says the list is not found, run `init --root .`. Done when `status` prints the list.
2. **The name.** Take the name the owner gave: a letter, then letters, digits or `-`, up to 24. Without a name, ask the owner for one. For each name run `add --root . --name <NAME>`. Done when each `add` printed `added`. On exit 1 tell the owner why (the name is taken, or it is the main-agent's) and ask for another.
3. **Commit** `pan-harness/workers.md` as `AGENTS.md` says, the message ending with the line `Agent: <the main-agent's name>`.
4. **Report** in one line: the new worker is free, and a task goes to it in the owner's own words ("<NAME>, prepare …"), through `ph-workers`.
