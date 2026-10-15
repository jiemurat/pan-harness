# ph-doctor: matching the harness to the standard

The goal: match the project's pan-harness to the skill's standard (`structure.md`) and principles (`principles.md`). For this, `ph-doctor` checks it, fixes it and migrates it to the new version of the standard. As a result, a new agent can use the harness correctly with few tokens. It usually runs once a month or when the owner asks.

Copy this checklist into your answer and tick it as you go:

```
ph-doctor:
- [ ] 1. Preparation: start set, git, versions, playbook, Node
- [ ] 2. Scripts: pan-harness-check, secret-check, project checks
- [ ] 3. Migration: by changelog.md or (on an unknown standard) by comparing with the templates
- [ ] 4. Conformance audit: audit.md item by item
- [ ] 5. Facts: the current files and the Where field of decisions against reality
- [ ] 6. Fix: mechanical at once, structural with a plan (goal, outcome, criteria) and approval
- [ ] 7. Re-check and fresh-agent test (asked of the owner)
- [ ] 8. History entry and report
```

## 1. Preparation

1. Read the project's `AGENTS.md`, `PAN-HARNESS.md`, `pan-harness/state.md` and `pan-harness/plan.md` and follow their rules.
2. Look at `git status` and `git log --oneline -5`. When the folder is not a git repo, this is a structural fix: do the git steps of `init.md` → "1. Preparation" with the owner's approval. An uncommitted change is the owner's: by the project's commit rule (S6 a) it gets its own commit at the end of the work; with S6 b, tell the owner before the work. When work marked `pending` in the history is committed, write its number; when the session makes no commit of its own, commit this fix alone after the check.
3. Compare the `Standard:` version in `PAN-HARNESS.md` with the skill's `metadata.version`. When the harness is on an unknown standard (`structure.md` → "Glossary"), work by the procedure of step 3.
4. Read the project steps and the owner's standing answer on the fresh-agent test in `playbooks/pan-harness.md`.
5. Check `node --version` (18 or newer). Without Node, work by the procedure in `structure.md` → "Profile".

Done when: as step 1 of the `ph-doctor` skill says (its `SKILL.md`).

## 2. Scripts

1. Run `node pan-harness/scripts/pan-harness-check.mjs --since <commit>`: `<commit>` — the start commit of the new text (`audit.md` → "Writing"); `terms` sees the lines changed since that commit. When `PAN-HARNESS.md` → `Project checks` names `--live`, add it too: the extensions only read the live system. When the versions differ, run the project's script without `--since` (an older script may not know it) and the skill's new script with `node <skill>/scripts/pan-harness-check.mjs --root . --since <commit>`: the new one shows what the standard requires. With `--since` the script prints the new lines as `REVIEW`: step 4 uses this list.
2. When the profile lists `secrets`, run `node pan-harness/scripts/secret-check.mjs`.
3. Run the status checks of `PAN-HARNESS.md` → `Project checks`. Touch the live system with read-only commands only.

Done when: as step 2 of the `ph-doctor` skill says (its `SKILL.md`).

## 3. Migration

When the project's version is older than the skill's, run `node <skill>/scripts/migrate.mjs --root .`: it carries out the `mechanical` steps of `changelog.md` after the project's version, from the oldest to the newest, replaces the scripts and updates the `Standard:` line. Do each item it prints as `by hand` by that changelog step, and the `structural` steps in the order of step 6. `ph-update` does this step too, after updating the pan-harness package. The script updates the `Standard:` line, so write the `by hand` and `structural` items not yet done into `plan.md`: when the work stops midway, the next session takes them from there. Compare the scripts with the skill's whatever the version (`diff`): the copy in the project is the same as the skill's, and when it differs, replace it with the skill's. Compare the hook (`.githooks/pre-commit`) with `templates/githooks/pre-commit.tmpl`: the project may have added its own hook to it (`init.md` → "5. Create"), so show the difference to the owner and, after the approval, update the hook from the template, keeping the project's addition.

When the harness is on an unknown standard (step 1), compare it item by item with `structure.md` and `templates/` in place of the changelog steps: the files, sections, field names, profile, scripts and hook. Fix the differences in the order of step 6 (mechanical at once, structural with a plan); the owner's knowledge (rules, decisions, journals) is kept. At the end, write the skill version into the `Standard:` line.

Done when: as step 3 of the `ph-doctor` skill says (its `SKILL.md`).

## 4. Conformance audit

Go through `audit.md` item by item. Write the result of each row: `ok`, `fail` (what was found, file:line), `not checked` (the reason) or `n/a` when it does not concern the profile. In rows with a script result, rely on the script, but the script checks only its own part: when `How to check` has a `manual` part too (for example, the coverage in A3), still check it by hand. Check the other rows yourself. Check the P26 items (the trigger in A20, A43, A44–A48) only in new text, by the `REVIEW` list of step 2 (`audit.md` → "Writing"): each flagged line `ok` or `fail` in the table with the reason, a `fail` with file:line; read the lines without a flag for A46–A48 too. Add the conformance table to the report: the number of `ok`, `fail` and `not checked` per section, then the list of `fail` rows.

Done when: as step 4 of the `ph-doctor` skill says (its `SKILL.md`).

## 5. Facts

- Compare the facts in `state.md`, `system-map.md` and the domain files of `project/` with the live system, the configuration and the docs of the installed version. Mark each `verified` or `unverified`.
- Check the `Where:` field of the decisions: is the named file or setting still so. When there are more than 30 D, check each D added in the last 30 days and each D that is the source (`← D…`) of a rule; each gets `ok`, `fail` or `not checked` in the conformance table.
- Look at the items in `plan.md` whose term passed or which are done. Check that work written in `history/` is not left in `plan.md`. For each ⏳: has its event or date passed (the script shows a passed dated `Scheduled` row and the list of open ⏳); when it passed, find the evidence and close it, or tell the owner.
- Check the `Remove when:` condition of the temporary rules (A41): when it is met, propose the removal.
- When `handoff.md` says `**Status:** active` and the last commit that touched the files of its `Changed files` is older than 14 days (the history and `git log`), tell the owner: the work may be abandoned.

Done when: as step 5 of the `ph-doctor` skill says (its `SKILL.md`).

## 6. Fix

| Type | Examples | How |
|---|---|---|
| `mechanical` (at once) | A broken path or link; a stale fact checked on the live system (updating `state.md` from a status check result); archiving the rules define (a superseded or done decision, a journal over 40 KB); the current month's history file; a commit number; adding an existing file to the map; replacing the standard scripts; the `mechanical` steps of `changelog.md` | Fix at once, give the list in the report |
| `structural` (with a plan) | Adding, changing or moving a rule; moving or renaming a file or section between the standard part and `project/`; a new playbook or file; trimming that touches the meaning; changing the size limit; a profile change; fixing an error in a project script (it is project code); the `structural` steps of `changelog.md` | Give numbered questions and a plan, the first question the goal, the outcome and the criteria (P21). Do it after the owner's approval. Until the owner answers, each proposal stands as one line in `plan.md` → `Awaiting owner decision`, its details in the history entry |

When in doubt, treat the fix as structural. An unneeded rule moves to a playbook with its number; the numbers do not change.

**When a name or a place changes**, find every link with grep: docs, scripts, other skills, comments, cron descriptions. A relative path inside a script (`../..`) breaks when the folder depth changes: check it separately.

**Skill limitation.** A defect may be found in the skill itself: for example, a standard script gives a false warning or a template contradicts `structure.md`. Then work around the defect inside the project:
- write the warning with its reason into `runbook.md` → `Accepted warnings`, or change a setting of `project/check.json`, and note it in the history entry;
- the standard script in the project stays the same as the skill's: the next `ph-doctor` replaces it anyway;
- when skill files contradict each other, `structure.md` wins.

Say it openly in the report as a skill limitation.

Done when: as step 6 of the `ph-doctor` skill says (its `SKILL.md`).

## 7. Re-check and test

1. Run `pan-harness-check.mjs` and (when the profile lists `secrets`) `secret-check.mjs` again: 0 errors and `RESULT: clean`.
2. Ask the owner whether to run the fresh-agent test (`testing.md`): after a structural change the fixed set (a run before is not needed, it is compared with the last recorded result); with more than 5 findings, checking them in skeptic mode; at every third `ph-doctor` (count the `ph-doctor` entries in the history) the simplification experiment.

Done when: as step 7 of the `ph-doctor` skill says (its `SKILL.md`).

## 8. History entry and report

- Add an entry to the current month's history file: what was checked (the conformance table in short), what was fixed, what was proposed, the test result. With a structural fix, `Checks:` starts with the results of the criteria.
- Write a D entry for a structural change and an F entry for the owner's new words. An L entry only for a lesson drawn from a mistake (of the agent or of the harness); an ordinary finding stays in the report.
- The report (`SKILL.md` → "Report"): the results of the criteria of the structural fixes, the map of changed components, the conformance count (numbers per section and the findings in plain words, the full table in the history entry), the list of mechanical fixes, the structural proposals (numbered, with options and a recommendation), the skill limitations, the changed files, the next step.

Done when: as step 8 of the `ph-doctor` skill says (its `SKILL.md`).

