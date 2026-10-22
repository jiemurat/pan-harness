---
name: ph-init
description: Builds a pan-harness (Panoramic Harness) in a project without one: AGENTS.md, PAN-HARNESS.md and pan-harness/, with the owner's goal and rules. Use it when asked to set up agent rules, an AGENTS.md or a harness, also when AGENTS.md, CLAUDE.md or .cursor/rules of another shape are there.
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
2. **Facts.** Study the README and the manifests (the list: `references/init.md` → "2. Facts"): language, stack, how it runs, deploy, live system, confidential data, existing docs; once the profile draft shows `code=yes`, also the fast check, the way to see the result, the dependency file, the runtime pin and the log place. Done when: each fact is written with a `verified` or `unverified` mark, the profile draft is made; with `code=yes`, each of those five is found or marked missing.
3. **Interview.** Ask only the questions of `references/style-questions.md` → `Asked`, after the language question (`references/init.md` → "3. Interview"):
   - round 1: the goal, the outcome and the criteria (P21), near plans; when git has no identity, that too; before asking, read `templates/pan-harness/playbooks/large-task.md.tmpl` → `Planning`;
   - round 2: the boundaries and the artifact-folder, the one folder for the artifacts (the work products, inputs and outputs): options by their type, the owner's own folder name last, never `docs/`;
   - an existing project whose artifacts are not in one folder: their move into it is proposed, and `ph-init` moves no artifact;
   - an existing project: both rounds in one;
   - an empty folder: round 1 also asks what the project will be;
   - each open question: write your proposal; "I don't know" becomes an open issue;
   - style, way of working and precautions are not questions but standard choices (`Standard choices`): the plan shows them, no answer is waited for.

   Done when: each question asked has an answer ("yes" too) or an "I don't know" written as an open issue, the artifact-folder is agreed, the questions are counted (at most 5 in a project without code, a server and secrets; the language question does not count); in an empty folder `README.md` and `.gitignore` are there.
4. **Plan and approval.** Give the owner a short plan (`references/init.md` → "4. Plan"): the goal and the outcome, the final list of criteria, the changes outside the harness, the migration table (only when old content moves), the standard choices grouped, with `code=yes` the checks the agent runs once after the approval, the owner's hand, the risk and the way back. The file list is not in the plan. Write the plan into a temporary file outside the project-folder (`mktemp`), run `LC_ALL=C.UTF-8 wc -lm`, the `grep` commands of `Report` and the harness terms `grep` (`references/init.md` → "4. Plan") on it, then delete the file. Done when: the plan is within 15 lines (up to 3 000 characters), the `grep` results are clean, the temporary file is deleted, the owner approved the plan.
5. **Create.** (`references/init.md` → "5. Create"):
   - when the commit order (S6) is a and the owner has uncommitted changes, put them into the `Pre-init state` commit;
   - run `node <skill>/scripts/scaffold.mjs --root .` (with `--secrets` when the profile lists `secrets`): it copies the standard part, the scripts and the hook, and connects git to the hook;
   - fill the `{{…}}` places, apply the `[profile: …]` marks and delete the template note at the top; the template text stays as it is;
   - write the project's own knowledge into `pan-harness/project/` and the agreed artifact-folder into `AGENTS.md` → `Project`; in an empty folder the artifact-folder stays empty; an agreed move of the artifacts goes into `plan.md` as the first large task; when there is a `CLAUDE.md`, it keeps only the `@AGENTS.md` import;
   - with `code=yes` (items 9 and 10): fill the `Fast check:`, `See the result:` and `Logs:` lines, a missing one with a proposal in `plan.md`; run the fast and the full check once and write the dated result, a failure as a proposal in `plan.md`; turn on `markers`.

   Done when: each standard file is made from its template, `pan-harness-check.mjs` gives no error about `{{…}}`, `[profile: …]` or a template note, the hook is there and git uses it (`core.hooksPath`), the `project/` files are there, `AGENTS.md` names the artifact-folder, each migration table row shows its new place, the owner's uncommitted changes are in the `Pre-init state` commit (with S6 b, the owner said they commit them); with `code=yes`, `Project checks` holds the `Fast check:`, `See the result:` and `Logs:` lines (or a proposal in `plan.md`) and a dated result or the reason it was not run for each check, and `markers` is on.
6. **Check.** Run `node pan-harness/scripts/pan-harness-check.mjs` and, when the profile lists `secrets`, `node pan-harness/scripts/secret-check.mjs`, then check the harness by `references/audit.md` (A58 costs no tokens). When the check gives an error, first compare the file you made with its template. Ask the owner about the fresh-agent test (`references/testing.md`). Done when: 0 errors, `RESULT: clean` with `secrets`, each `fail` row of the audit fixed or in the report, the owner's answer on the test written.
7. **Report.** Give the owner the report: each criterion's result, what was made, which decisions were written, what is `unverified`, the commit numbers (with S6 a, the agent commits the `ph-init` work) and what `git show` shows. Done when: the report is with the owner, each criterion's result with evidence.

<!-- include: skill-parts/files.md -->

<!-- include: skill-parts/fresh-agent-test.md -->

<!-- include: skill-parts/report.md -->
