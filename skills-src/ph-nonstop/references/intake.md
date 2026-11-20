# The intake items

Each item fills a part of the charter. For each, look for the answer in this order: the harness (the file and section named), the safe default, the owner. "Ask" means the item has no safe default: with no harness answer, it is a question to the owner.

| # | Item | Charter part | Where the harness may answer | Safe default |
|---|---|---|---|---|
| 1 | The goal: what the cycles improve; when the goal counts as reached | `**Goal:**` | the owner's request; `plan.md` | ask |
| 2 | The scope: the folders or parts the cycles change, and what is out | `## Scope` | `AGENTS.md` → `Project` (the artifact-folder) | ask |
| 3 | Where the work goes: the environment or branch the run may change | `## Scope` | `AGENTS.md` → `Boundaries`; `system-map.md` | the work tree and commits of this repository only |
| 4 | What is never touched: production data, live services, other repositories, secrets | `## Never-list` | `AGENTS.md` → `Boundaries` → `Never`; the secret rules | the template's never-list lines plus the harness's `Never` items |
| 5 | Each outward action: allowed or not, how often, on what condition (deploy, push, a restart of a live service, a message to real people, a paid call, a new dependency) | `## Current outward rules` | `AGENTS.md` → `Boundaries` (`Ask first`, push rule) | none allowed: each waits for the owner |
| 6 | Time windows: does an action wait for a window | `## Limits` | `runbook.md` | no window; tests, backup and rollback stay |
| 7 | An owner-only question while the owner is away | `## For you` | — | park the cycle, go on with the next |
| 8 | Where cycles come from, in priority; the backlog files and the review kinds | `## Cycle sources` | `plan.md`; the project's backlog files | the owner's requests, `plan.md` → `Queue`, then the reviews the project's playbooks name |
| 9 | The done bar: test levels by risk, reviewers, the severity a cycle fixes | `## Done bar` | `PAN-HARNESS.md` → `Project checks`; `playbooks/end-of-task.md` | the fast check passes; a new test for each fix |
| 10 | Test time: which slow test runs when | `## Done bar` | `PAN-HARNESS.md` → `Project checks` | the fast check in each cycle; the full check every hygiene cycle |
| 11 | Reporting: the language and register, the cycle title | `## Reporting` | `AGENTS.md` (the chat rule) | the chat language; the title "Cycle <N>: <topic>" in it |
| 12 | Limits: the usage-limit floors; a machine floor | `## Limits` | `AGENTS.md` → `Working style` → "Usage limit" | 10% of the 5-hour limit left; 95% of the weekly limit used; no machine floor |
| 13 | Pause, resume and stop words; what "after" means | `## Limits` | — | ask (the owner's own words) |
| 14 | The first cycles: the agreed queue | `## Queue` | `plan.md` | ask |

Item 1, item 2 and item 13 are always the owner's: the harness can name a candidate, the owner confirms it.
