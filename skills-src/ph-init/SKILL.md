---
name: ph-init
description: Builds a pan-harness (Panoramic Harness) in a project: AGENTS.md, PAN-HARNESS.md and pan-harness/, with the owner's goal and rules. Use it in a project without a harness: an empty folder, a code or document project, a project with AGENTS.md, CLAUDE.md or .cursor/rules of another shape.
license: MIT
metadata:
  version: "{{version}}"
  package: "@jiemurat/pan-harness"
---

# ph-init

<!-- include: skill-parts/intro.md -->

<!-- include: skill-parts/core-rules.md -->

## Steps

The detailed steps and the checklist: `references/init.md`. Go to the next step once a step's "Done when" condition holds:

0. **Situation.** When a harness is there, offer `ph-doctor` or (when the version in `Standard:` differs from the skill's or the harness is on an unknown standard) `ph-update` and stop here. Without a harness, the first message is the language question in three languages (`references/style-questions.md` → `Language question`): from the answer on, the chat, the plan and the report are in the chosen language, the harness in English. When the folder is empty, also ask in the first round of questions (step 3) what the project will be, and after the answer make the minimal structure with `README.md`, `.gitignore` and git. Done when: one of the three situations is found; with a harness, the offer is with the owner; without one, the language is chosen.
1. **Preparation.** Prepare git (`references/init.md` → "1. Preparation"): install, `git init -b main`, `.gitignore`, the first commit; this is part of the command and is done before the plan. Find the existing agent files, the secret files (names only) and the Node version. Done when: `git status` works, `.gitignore` and the first commit are there, the agent and secret files are listed, whether Node is there is known.
2. **Facts.** Study the README and the manifests (the list: `references/init.md` → "2. Facts"): language, stack, how it runs, deploy, live system, confidential data, existing docs. Done when: each fact is written with a `verified` or `unverified` mark, the profile draft is made.
3. **Interview.** Ask only the questions of `references/style-questions.md` → `Asked`, after the language question, in two rounds: round 1 — Q1 the goal, the outcome and the criteria (P21), near plans; when git has no identity, that too. Before writing Q1, read `templates/pan-harness/playbooks/large-task.md.tmpl` → `Planning`. Round 2 — what "done" means, the boundaries and the artifact-folder, the one folder for the artifacts (the work products, inputs and outputs): options by their type, the owner's own folder name last, never `docs/`; in an existing project whose artifacts are not in one folder, their move into it is proposed, and `ph-init` moves no artifact (`references/init.md` → "3. Interview"). In an existing project (a repo is there), all in one round. In each open question write your proposal; "I don't know" becomes an open issue. Style, way of working and precautions are not questions but standard choices (`Standard choices`): the plan shows them, no answer is waited for. Done when: each question asked has an answer, the questions are counted (at most 5 in a project without code, a server and secrets; the language question does not count); in an empty folder `README.md` and `.gitignore` are there.
4. **Plan and approval.** Give the owner a short plan (`references/init.md` → "4. Plan"): the goal and the outcome, the final list of criteria, the changes outside the harness, the migration table (only when old content moves), the standard choices grouped, the owner's hand, the risk and the way back. The file list is not in the plan. Write the plan into a temporary file outside the project-folder (`mktemp`), run `LC_ALL=C.UTF-8 wc -lm`, the `grep` commands of `Report` and the harness terms `grep` (`references/init.md` → "4. Plan") on it, then delete the file. Done when: the plan is within 15 lines (up to 3 000 characters), the `grep` results are clean, the temporary file is deleted, the owner approved the plan.
5. **Create.** First, when the commit order (S6) is a and the owner has uncommitted changes, put them into the `Pre-init state` commit (`references/init.md` → "1. Preparation"). Then run `node <skill>/scripts/scaffold.mjs --root .` (with `--secrets` when the profile lists `secrets`): it copies the standard part, the scripts and the hook from the templates. Then fill the `{{…}}` places of each file made, apply the `[profile: …]` marks and delete the template note at the top; the template text stays as it is. Write the project's own knowledge into `pan-harness/project/` and the agreed artifact-folder into `AGENTS.md` → `Project`; in an empty folder, make the artifact-folder empty, and an agreed move of the artifacts goes into `plan.md` as the first large task. When there is a `CLAUDE.md`, it keeps only the `@AGENTS.md` import. Done when: `pan-harness-check.mjs` gives no error about `{{…}}`, `[profile: …]` or a template note, the `project/` files are there, `AGENTS.md` names the artifact-folder, each row of the migration table shows its new place, the owner's uncommitted changes (when there were some) are in the `Pre-init state` commit; with S6 b, the owner said they commit it.
6. **Check.** Run `node pan-harness/scripts/pan-harness-check.mjs` and, when the profile lists `secrets`, `node pan-harness/scripts/secret-check.mjs`, then check the harness by `references/audit.md` (A58 costs no tokens). When the check gives an error, first compare the file you made with its template. Ask the owner about the fresh-agent test (`references/testing.md`). Done when: 0 errors, `RESULT: clean` with `secrets`, each `fail` row of the audit fixed or in the report, the owner's answer on the test written.
7. **Report.** Give the owner the report: each criterion's result, what was made, which decisions were written, what is `unverified`, the commit numbers (with S6 a, the agent commits the `ph-init` work) and what `git show` shows. Done when: the report is with the owner, each criterion's result with evidence.

<!-- include: skill-parts/files.md -->

<!-- include: skill-parts/fresh-agent-test.md -->

<!-- include: skill-parts/report.md -->
