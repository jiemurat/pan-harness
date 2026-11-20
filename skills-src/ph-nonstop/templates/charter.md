# Run: <name>

The charter of a nonstop run (`ph-nonstop`): the goal the owner approved once and the rules every cycle of the run follows, beside `AGENTS.md`. The owner's later words change it only as `## Current outward rules` and `## Queue` say.

**Status:** running
**Goal:** <what the cycles improve, in one or two sentences>
**Approved:** <date> — "<the owner's words>"
**Opener:** <session id or agent>
**Cycle session:** <session id, or none>
**Cycles done:** 0

## Scope

- **In:** <the folders or parts the cycles change>
- **Out:** <what the cycles leave alone>
- **Where the work goes:** <the environment or branch the run changes, for example a dev environment or a branch>

## Never-list

These bind every cycle, every cycle session and every sub-agent a cycle starts, word for word.

<!-- never-list -->
- Never print, read or copy a secret: no `env`, `printenv`, config dumps that resolve variables (for example `docker compose config`), or inspecting a container's environment; not even by a script that prints nothing.
- Never touch <production data, live services, other repositories: from the intake>.
- Never take an irreversible action (deleting, rewriting history, a force push, moving a tag) or publish without the owner's word for that action.
- <more from the intake>
<!-- /never-list -->

## Current outward rules

What the run may do outside the scope's environment (deploy, push, a restart of a live service, a message to real people, a paid call, a new dependency). Newest first; a newer line overrides an older one; each line quotes the owner.

- <date> — "<the owner's words>": <the rule>

## Done bar

- **Tests:** <tests first; which test level for which risk>
- **Reviews:** <fresh reviewers, the review kinds, the severity a cycle fixes; where the rest goes>
- **Test time:** <for example: the slowest suite only before a deploy>
- **The Done message:** the commit, the changed files, `Tests run:`, `Not run:` and `Not seen:` lines.

## Cycle sources

In this order: the owner's requests in `## Queue`; the agreed queue below; the backlog files <names>; a fresh review, the kinds taken in turn: <review kinds>.

## Limits

- **5-hour floor:** 10% left (at it: save the state, a one-shot timer for the reset plus 5 minutes, go on)
- **Weekly floor:** 95% used (at it: stop and ask the owner)
- **Machine floor:** <for example free memory or disk, or none>
- **Time windows:** <an action that waits for a window, or none>
- **Pause words:** "<words>" (after the running cycle nothing new starts)
- **Resume words:** "<words>"
- **Stop words:** "<words>" (after the running cycle the run ends with the final report)

## Reporting

- **Language:** <the owner's chat language and register>
- **Cycle title:** "<prefix> <N>: <topic>" (the cycle session is renamed before each cycle)
- **Journal line:** `- <local date and time> — Cycle <N>: <what changed for the owner>. <What needs the owner, or nothing>. Next: <the next cycle>.` The time is the output of `date '+%Y-%m-%d %H:%M'`, run for that line.

## Queue

1. <the agreed first cycles; the owner's new requests go on top>

## For you

The questions only the owner can answer, each with its parked cycle and state file. Empty: nothing waits for the owner.

## Journal

Newest first, local time, one line per cycle (`## Reporting` → `Journal line`).
