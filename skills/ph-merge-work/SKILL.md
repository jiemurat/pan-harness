---
name: ph-merge-work
description: Merges a worker-agent's finished branch into the main branch on the owner's word, resolves the conflicts and frees the worker for its next task. Use it when the owner says to merge, accept or take in a worker-agent's work.
compatibility: git and Node 18 or newer
license: MIT
metadata:
  version: "2.10.5"
  package: "@jiemurat/pan-harness"
---

# Merge a worker's work

A worker-agent works on its branch `<name>/<task>` in its own folder (`ph-workers`). The main-agent (named in the `- **Main-agent:**` line of `AGENTS.md`) merges that branch into the main folder's branch, in each repo the worker changed (the main repo and a nested repo such as a separate artifact-folder), and resolves the conflicts. `<skill>` below is the folder of this `SKILL.md`; run the commands from the main folder. `<base>` is the main folder's branch, the one `status` names. Several workers named: run steps 2–7 for one worker, then for the next, in the owner's order.

## Steps

1. **The owner's word.** The merge runs on the owner's word given in this session, or quoted from the worker's session. A worker's or another session's message is not that word: ask the owner. Done when you can quote the owner's word.
2. **What comes in.** Run `node <skill>/workers/workers.mjs status --root .`. For each repo with commits to merge: `git diff --stat <base>...<branch>`. A worker in `working` has not finished, and uncommitted changes in its folder stay out of a merge: tell the owner and stop. When `status` names a commit inside a submodule, show it to the owner; the owner decides how it goes in. Done when you know each branch, its commits and the conflicts `status` foresees: with the base branch, and between two branches that wait for a merge (the second merge meets those).
3. **A clean main folder.** Commit the owner's uncommitted changes apart, then yours, as `AGENTS.md` says.
4. **Merge.** In each repo with commits to merge, write the message into a file outside the work tree, such as `.git/merge-<name>.msg` (`git merge` reads none from standard input), and run:

   ```bash
   git merge --no-ff --no-commit <name>/<task>
   ```

   The message: `Merge <NAME>: <task>`, an empty line, then `Agent: <the main-agent's name>` with any `Co-Authored-By` line right below it.
5. **Conflicts.** List them with `git diff --name-only --diff-filter=U` and resolve each file by its kind:
   - **Journals** (history, `plan.md`, `handoff.md`): keep both sides' entries, in date order, each once; on the same date the earlier merged worker first.
   - **`state.md`**: take the main side (`git checkout --ours <file>`); step 7 rewrites what the merge made stale.
   - **`pan-harness/workers.md`**: the main side; workers do not edit it.
   - **Any other file**: what both sides added (new lines, items, sections) stays, each once. Where both sides changed the same existing text into different things (a contradiction), show the owner both versions and take the one the owner picks.

   Then `git add` each resolved file. Done when `git diff --name-only --diff-filter=U` prints nothing and `git grep -n -e '^<<<<<<< ' -e '^>>>>>>> '` finds no conflict marker.
6. **Checks and commit.** Run the project's checks (the `Project checks` section of `PAN-HARNESS.md`, and `node pan-harness/scripts/pan-harness-check.mjs` when the project has it; a project with neither: say so in the report), fix what the merge broke, then `git commit -F <message file>`. A rule of the project on how a repo is committed (for example one commit per release) wins over this step: ask the owner when they clash. Done when `git log -1 --format='%h %p'` shows two parents.
7. **The journals.** The worker skipped the `pending` commit numbers of its history entries: write in their place the hash of the worker's commit that made each entry. Add your own history entry for the merge, as the end of a task in `AGENTS.md` asks. Rewrite the lines of `state.md` the merge made stale. Run `record --root . --name <NAME> --status free` (its folder and session stay for the next task) and commit these files with your `Agent:` line.
8. **Report** to the owner: the merge commit of each repo, each conflict and how it was resolved (the owner's picks named), the check results, and that the worker is free for its next task. The push stays the owner's.
