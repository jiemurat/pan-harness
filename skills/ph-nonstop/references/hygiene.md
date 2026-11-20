# The hygiene cycle

Every 10th cycle, and at any size warning of the harness check, the cycle keeps the harness and the checks honest instead of changing the artifact. Its brief's goal is this list; its done criteria are the list's checks.

1. **Sizes.** Run `node pan-harness/scripts/pan-harness-check.mjs`. Trim each file over its limit by the project's `playbooks/pan-harness.md` → growth limits (old journal entries into `archive/`). Done when the check prints no size warning.
2. **Each gate can fail.** For every check the charter's `## Done bar` names, make it fail once on purpose in a throwaway copy or a scratch edit (a failing assertion, a type error, a broken link), see it turn red, then undo the edit. A check that stays green checks nothing: fix it, as this cycle's work. Done when each gate was seen red and is green again, and `git status --short` shows no scratch edit.
3. **The journal.** When the charter's `## Journal` holds more than 100 lines, move the lines older than the last 50 into `pan-harness/archive/run-<name>-journal.md`. Done when the charter holds at most 50 journal lines.
4. **The state files.** `pan-harness/state.md` and `plan.md` say the run's current state; a parked cycle's `handoff-cycle-<N>.md` is still in `## For you`. Done when each file matches `git log` and the charter.

The 'Done' of a hygiene cycle lists each gate with "seen red" or "could not make it fail: <why>".
