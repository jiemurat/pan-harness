---
name: ph-delete-worker
description: Removes a worker-agent after showing the owner its folder, branches, session and name in pan-harness/workers.md; the main-agent always stays. Use it when the owner asks to delete or remove a worker-agent (TARS, CASE, PLEX, KIPP, WALLE or another name in the list) or to clean its folder.
compatibility: git and Node 18 or newer; Claude Desktop archives the session itself (its session tools)
license: MIT
metadata:
  version: "2.10.5"
  package: "@jiemurat/pan-harness"
---

# Remove a worker-agent

A worker-agent has a row in `pan-harness/workers.md` and, once it had a task, a folder, branches `<name>/<task>` and a session. The main-agent (named in the `- **Main-agent:**` line of `AGENTS.md`) is never removed. Removing a folder or a branch cannot be undone for work that is not merged, so the owner sees the list first. `<skill>` below is the folder of this `SKILL.md`; run the commands from the main folder.

## Steps

1. **What is there.** Run `node <skill>/workers/workers.mjs status --root .` and `git branch --list '<name>/*'` (in a nested repo of the main folder too). Done when you know the worker's folder, its session, its branches and whether each is merged. The name is the main-agent's: tell the owner the main-agent stays, and stop.
2. **The scope.** The owner asked to remove the worker: the folder, the branches, the session and the name go. The owner asked only to clean its folder: the name stays (no `--forget` below).
3. **The list for the owner.** Show what goes: the folder path, each branch with "merged" or "not merged", the session, the name. Work that is not merged is lost on removal: offer `ph-merge-work` first. Wait for the owner's word. Done when the owner said yes to this list; "remove the unmerged work too" is a separate word.
4. **Remove.** Run `remove --root . --name <NAME> --forget` (without `--forget` when the name stays; with `--force` only when the owner's word covers the unmerged work). Done when it printed the removed folder and branches. On exit 3 it found unmerged work the owner did not cover: go back to step 3.
5. **The session.** A session id in the row (`local_…`), in Claude Desktop: load `mcp__ccd_session_mgmt__archive_session` (ToolSearch `select:mcp__ccd_session_mgmt__archive_session`) and archive it; the app may ask the owner to approve. A session the owner opened (`owner`): ask the owner to close it.
6. **Commit** `pan-harness/workers.md` as `AGENTS.md` says, the message ending with the line `Agent: <the main-agent's name>`, and report what was removed and what stays.
