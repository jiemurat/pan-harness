---
name: ph-grilling
description: Grill the user relentlessly about a plan, decision, or idea. Use when the user wants to stress-test their thinking, or uses any 'grill' trigger phrases.
license: MIT (Copyright (c) 2026 Matt Pocock), see LICENSE
metadata:
  version: "2.10.5"
  package: "@jiemurat/pan-harness"
  source: "https://github.com/mattpocock/skills/blob/95249b0b49782349740fd9b8c6ce32b4e59e497a/skills/productivity/grilling/SKILL.md"
  changes: "renamed to ph-grilling; facts are looked up by the agent itself, a sub-agent for a wide lookup by the project's rules; the question form: a number before the title, an a)/b) option list, one recommendation with its reason"
---

Interview the user relentlessly until you reach a shared understanding. Map this as a **design tree**: every decision branches into the decisions that hang off it.

Work the tree in **rounds**. The **frontier** is every decision whose prerequisites are already settled: the questions you can ask _now_ without guessing at answers you haven't heard yet. Ask the whole frontier in one round: number each question and give your recommended answer. Then wait for the user's answers before the next round.

Format a round like so:

```
❓ **1. <question title>**: <question body, might be multiple paragraphs>
- a) <option>
- b) <option>

➡️ <letter and option> — <why, in a few words>

❓ **2. <question title>**: <question body, might be multiple paragraphs>
- a) <option>
- b) <option>

➡️ <letter and option> — <why, in a few words>
```

Each question is a full block: the question, its option list, its `➡️` line. Questions, options and recommendations are never joined into one line or one block. Two or more options are always an `a)`, `b)`, `c)` list, never inline with "or". A question with no possible recommendation says after `➡️` what you do without an answer. A question of one sentence, up to 120 characters, whose options need no context, drops only its title and keeps its number, options and `➡️` line.

Word each question so "yes" accepts your recommended answer.

Each round the user answers reshapes the tree: settled decisions push the frontier outward and unblock questions that depended on them. Recompute the frontier and ask the next round. A question whose answer depends on another question still open in this round belongs to a _later_ round, not this one.

Finding _facts_ is your job, never the user's. When a frontier question needs a fact from the environment (filesystem, tools, etc.), look it up yourself; don't ask the user for anything you could look up yourself. Hand a lookup that reads widely to a sub-agent when the project's rules call for it; do a quick one yourself. Don't block on a lookup that runs in the background: a running exploration is an unsettled prerequisite, so only the questions downstream of it wait for it; ask the rest of the frontier now. The _decisions_ are the user's: put each to them and wait.

The session is done when the frontier is empty: every branch of the design tree visited, nothing left silently assumed. Do not act on it until the user confirms you have reached a shared understanding.
