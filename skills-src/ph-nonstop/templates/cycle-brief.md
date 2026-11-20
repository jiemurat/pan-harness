# Cycle <cycle>: <topic>

You are the cycle session of the nonstop run `pan-harness/project/run-<name>.md`. Read `AGENTS.md` and the charter and follow them; skip the journal fixes of Session start.

- **Goal:** <the cycle's goal, one sentence>
- **Done when:** <the done criteria, from the charter's `## Done bar` for this cycle's risk>
- **Files other work touches now:** <files, or none>
- **Approval:** the owner approved the run's charter; it covers this cycle's plan, so the cycle needs no plan approval. Ask the opener, not the owner: the opener answers inside the goal and the never-list and passes the rest to the owner.
- **History tag:** <one tag of the runbook's Topic tags line>; write the cycle's history entry in the newest file of pan-harness/history/ with it, the commit number `pending` (the opener writes the number).
- **Never-list:** it binds you and every sub-agent you start; put it word for word into each sub-agent's brief.

{{never-list}}

- Usage limit: before each bigger step read the 5-hour limit with `mcp__ccd_session_mgmt__get_usage` (a deferred tool: load its schema with ToolSearch first; when no such tool exists, write 'the usage limit was not read' in `Not seen:`); at the charter's floor (<floor> left), save the cycle's state in pan-harness/handoff-cycle-<cycle>.md (the sections of `handoff.md`, `**Status:** active`), leave no timer or background task running, end the turn and message your opener, session <opener session id>: 'Limit: Cycle <cycle>, resets <reset time>'.
- Context refresh: brief in `pan-harness/brief-cycle.md`. Before each bigger step read your context size; past 500 thousand tokens, check that pan-harness/handoff-cycle-<cycle>.md is current, leave no timer or background task running, and end the turn with a message whose first line is 'Context refresh: <N>K, state in pan-harness/handoff-cycle-<cycle>.md, brief in pan-harness/brief-cycle.md, ready to clear.' On 'Cleared for a context refresh', read the brief and state files and go on.
- Level: <opener's level + 1>
- When done: message your opener, session <opener session id>: 'Done: Cycle <cycle>, <commit>', with the lines `Changed:`, `Tests run:`, `Not run:` and `Not seen:` (what you did not run or did not see working). Send it also after a checkpoint and for a repeated report.
- When waiting: before you end a turn with a question, message your opener, session <opener session id>: 'Waiting: Cycle <cycle> — <the question, unchanged>'. An answer comes as 'Opener: <answer>' or 'Owner: "<the owner's words>"'.
