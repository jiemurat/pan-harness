---
name: ph-doctor
description: Checks and fixes the pan-harness (Panoramic Harness) of a project against the standard: a conformance table, mechanical fixes, structural proposals, migration. Use it when asked to check the harness, AGENTS.md or the agent rules, and for the monthly upkeep.
license: MIT
metadata:
  version: "{{version}}"
  package: "@jiemurat/pan-harness"
---

# ph-doctor

<!-- include: skill-parts/intro.md -->

<!-- include: skill-parts/core-rules.md -->

## Steps

The detailed steps: `references/doctor.md`. The goal — the project harness matching the standard and the principles. Go to the next step once a step's "Done when" condition holds:

1. **Preparation.** Read the project's start set (`AGENTS.md`, `PAN-HARNESS.md`, `state.md`, `plan.md`), look at `git status`, compare the versions, find the project steps in `playbooks/pan-harness.md` and `node --version`. Done when: the start set is read, the versions are compared, the playbook steps and the Node version are known.
2. **Scripts.** Run `node pan-harness/scripts/pan-harness-check.mjs --since <commit>` (with the start commit of the new text: `references/audit.md` → "Writing"; when the project script is of an older version, give `--since` to the skill's script: `references/doctor.md` → "2. Scripts"), `node pan-harness/scripts/secret-check.mjs` when the profile lists `secrets`, and the project's status checks (`PAN-HARNESS.md` → `Project checks`). Done when: the result of each script and status check is written in numbers.
3. **Migration.** When the project's version is older than the skill's, run `node <skill>/scripts/migrate.mjs --root .` and do each item it prints as `by hand` by `references/changelog.md`; when the harness is on an unknown standard, follow the procedure of `references/doctor.md` → "3. Migration". Done when: each `by hand` item of the first run is done or in `plan.md`, the `Standard:` line equals the skill version.
4. **Conformance audit.** Check each item of `references/audit.md`, the P26 items by the `REVIEW` list of step 2. Done when: each item is in the conformance table with `ok`, `fail`, `not checked` or `n/a`, each flagged `REVIEW` line in the table with `ok` or `fail` and the reason, the new lines read for A46–A48.
5. **Facts.** Compare the facts and decisions of `references/doctor.md` → "5. Facts" with reality. Done when: each fact in `state.md`, `system-map.md` and `project/` is `verified` or `unverified`, each chosen D is `ok`, `fail` or `not checked` with the reason, the items of `plan.md`, `Remove when` and `handoff.md` are looked at, with the result in the report.
6. **Fix.** A mechanical fix at once, a structural fix with a plan (goal, outcome, criteria) and approval. Done when: each `fail` row is fixed, stands as a proposal in `plan.md` → `Awaiting owner decision` or is in the report as a skill limitation.
7. **Re-check and test.** Run the checks again and ask the owner about the fresh-agent test (`references/testing.md`). Done when: 0 errors, `RESULT: clean` with `secrets`, the owner's answer on the test written.
8. **History entry and report.** Add an entry to the current month's history file and give the report, with each criterion's result when there is a structural fix. Done when: the history entry is there, a D for a structural fix and an F for the owner's new words are written, the report is with the owner.

<!-- include: skill-parts/files.md -->

<!-- include: skill-parts/fresh-agent-test.md -->

<!-- include: skill-parts/report.md -->
