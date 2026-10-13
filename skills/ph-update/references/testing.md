# Testing the harness

The harness is tested by a new agent that has seen only the repo: it finds the gaps the agent that wrote it did not see (P18, P25). Each test costs tokens, so whether to run it and with which model is the owner's decision every time.

## Contents
- When to test
- How to run a test agent
- Fixed question set
- Resume test
- Independent checker
- Simplification experiment
- Start set check without tokens (A58)
- Recording results

## When to test

Give the owner options and a recommendation; shape the recommendation by the situation:
- **the kind of change:** after a new harness or a structural change — the fixed set, after the change; a run before is not needed: the last recorded result is used for the comparison (`playbooks/pan-harness.md` → `Test questions`); when there is no recorded result or the owner asks, it is run before too; after a mechanical fix only, it is usually not needed;
- **a long large task** (longer than one session) — the resume test;
- **a subjective outcome** (text, a document, the harness itself, a design) — the independent checker;
- **`ph-doctor`** — the simplification experiment at every third `ph-doctor` (count the `ph-doctor` entries in the history);
- **when the last test was** (from the history) and **the owner's standing answer** (`playbooks/pan-harness.md` → `Fresh-agent test`);
- **the token estimate:** from the size of the start set and of the files read. A guide: a small model with 5 questions ~90 thousand tokens, a strong model with 7 questions ~200 thousand tokens, an independent checker ~100 thousand tokens.

When the owner gives a standing answer (for example, "only with a small model"), write it into `playbooks/pan-harness.md` → `Fresh-agent test`. Next time it shapes the recommendation, but the question is still asked.

## How to run a test agent

- In Claude Code — a sub-agent, with the model chosen (strong model or small model). In another tool, prepare a file of questions; the owner starts the test in a new session.
- Tell the test agent: do not change files, do not use live system commands, make no external side effect, do not open secret files, read the files from disk (when `AGENTS.md` changed during the session, the text the tool loaded by itself may be old).
- Run the tests one or two at a time: many parallel agents may hit the session limit.

## Fixed question set

The questions are kept in the project's `playbooks/pan-harness.md` → `## Test questions` and are asked the same way every time, otherwise the results cannot be compared. 5 universal questions (for any project):
1. What is this project and for whom?
2. How is it built: where are its main parts?
3. How is the result made or run (build, export, deploy)?
4. How is it checked (tests, lint, proofreading, facts)?
5. What is the current state, which work is open?

Then 4–6 project questions: which files the work starts from, how past work is found, what happens at the end of a task, what happens in the project's most dangerous action. At the end: "Is there anything in the harness you did not understand clearly or that made you make an assumption? For each: file:line and what is unclear."

Grade each answer `correct`, `partial` or `wrong`. Measure the context use with the number the tool gives: tokens and the number of tool calls. The KB read that the agent reports itself is unreliable; use it only to know which files were read. After a structure change, the set is asked with the model of the last recorded result (a run before is not needed; when there is no recorded result or the owner asks, before too): the number of `correct` answers must not be lower than in the last recorded result.

## Resume test

In the middle of a large task (or in a copy stopped on purpose), a new agent gets only the repo, with `**Status:** active` in `handoff.md`. The questions:
- Where did the work stop and what is the next step, why?
- Which changed files are the agent's unfinished work, which are the owner's?
- Which criterion is met, which is not, what is the evidence?

The test passes when the answer matches `Next step` and `Changed files`. When an ambiguity shows, fix the `handoff.md` entry or the template (P24).

## Independent checker

At the end of a large task, with the owner's consent. The agent that did the work grades its own work high, so the checker is separate and works in a new context (P25):
- it gets the repo, the changes (`git diff` and `handoff.md` → `Changed files`) and the criteria of the plan, and for a subjective criterion the rubric of the plan too;
- the instruction: "Look for places that do not match the criteria, be picky. Each finding with evidence (file:line); write no opinion without evidence.";
- **skeptic mode** (for a list of findings, for example of `ph-doctor` or an audit): each finding goes to another independent agent, which tries to refute it; the owner gets only the confirmed findings;
- when the checker and the agent that did the work disagree, the agent shows both views with evidence, and the owner decides.

In a document project the checker looks at the text by the criteria, the style guide and the facts; in a code project by the diff, the tests and the invariants.

## Simplification experiment

In `ph-doctor`, optional, with the owner's consent. Each harness rule was added because a model could not do something reliably; as models grow stronger, some become unneeded (`principles.md` → Sources, [28]):
1. Pick one rule or component that makes up for a weakness of the model (the `Remove when:` condition of a temporary rule helps here).
2. Remove it for a while in a copy of the project.
3. Run the fixed set with the smallest supported model: the harness has to work with a small model too (P18).
4. When the number of `correct` answers does not drop and no new gap shows on the "what was unclear?" question, propose the removal as a structural fix; otherwise keep it or replace it with a lighter one.

## Start set check without tokens (A58)

For each of the 5 universal questions, find where the start set answers it or which file it leads to (file → section). A question without an answer is a gap in the map: write it into the matching file or the map (P22). This check runs without a test agent, in `ph-init` and `ph-doctor`.

## Recording results

Write into the `Checks:` field of the history entry: which test, the model, tokens and tool calls, the grade of each question, the unclear places, what was fixed. Tell the budget beforehand: an independent checker spends more than expected on a big diff (hundreds of thousands of tokens), so give it the list of files to review and limit the findings to 10. Write the last result of the fixed set into the "Last results" line of `playbooks/pan-harness.md` → `## Test questions` too: the next test is compared with it.
