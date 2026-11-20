---
name: ph-update
description: Updates the pan-harness package (@jiemurat/pan-harness), migrates the harness to the new standard and runs ph-doctor after a new version. Use it when asked to update the pan-harness package or its ph-* skills, when a new version is out, or when PAN-HARNESS.md names an older standard.
license: MIT
metadata:
  version: "{{version}}"
  package: "@jiemurat/pan-harness"
---

# ph-update

<!-- include: skill-parts/intro.md -->

<!-- include: skill-parts/core-rules.md -->

## Steps

Updating the pan-harness package and migrating the harness are one task: after a new version a full `ph-doctor` runs at the end. The migration rules are in `references/doctor.md` → "3. Migration" and "6. Fix", the steps of the versions in the newly installed `references/changelog.md`. Go to the next step once a step's "Done when" condition holds:

1. **Harnesses below.** Run `node <skill>/scripts/pan-harness-check.mjs --root . --harnesses`. A `ph-update due` line is not a folder. When it lists folders, ask the owner once whether to update them too; on a yes, run steps 2–7 in each of them first (a commit by its own rule, its own report), then go on here. Where you can open sessions, each one runs as a part session (the own-harness rule of `AGENTS.md`): open it with the brief lines (`pan-harness/playbooks/large-task.md` → `New session` → "Brief lines"; a harness before step 4 may lack them: `<skill>/templates/pan-harness/playbooks/large-task.md.tmpl`); on its "Done" act as `A part's "Done"` says there (check its commit, archive its session); your step 7 report names the delete card as its next step, and the card follows it (`The opener, on "Done"`). Done when: the list is empty, the owner said no, or each one is reported and its session archived.
2. **Versions.** Compare three versions:
   - the installed skills: `.agents/skills/.pan-harness.json` or `.claude/skills/.pan-harness.json` → `version` (when installed without the CLI, that skill's `SKILL.md` → `metadata.version`);
   - the newest on npm: `npm view @jiemurat/pan-harness version`;
   - the harness standard: `PAN-HARNESS.md` → `Standard:`; an unknown standard (`references/structure.md` → "Glossary") is found here too.

   When the three are the same: write the date (step 7), tell the owner there is no new version, commit and stop. Without the network: installed = `Standard:` → step 6; installed newer than `Standard:` → step 4 (the migration needs no network); otherwise tell the owner the update needs the network and stop. Done when: the three versions are known, or the stop is reported.
3. **Updating the pan-harness package.** Run `npx @jiemurat/pan-harness@latest update`. When the CLI stops with code 3, skill files were changed by hand: show the list to the owner and, when the owner agrees, run it again with `--yes`. Take the list of changes the CLI prints (`CHANGELOG.md`) into the report. When the skills were installed without the CLI (a plugin or `npx skills`), update them by that route. Done when: the skills are on the new version (`.pan-harness.json` → `version`).
4. **Migration.** From the newly installed skill folder, run `node <skill>/scripts/migrate.mjs --root .`: it carries out the `mechanical` steps of `references/changelog.md`, replaces the scripts and updates the `Standard:` line. Do each item it prints as `by hand` by hand, by that changelog step; the `structural` steps with the owner's approval (with a plan and criteria). When the script stops on an unknown standard (code 3), follow the procedure of `references/doctor.md` → "3. Migration". Done when: each `by hand` item of the first run of `migrate.mjs` is done or in the report, the remaining structural steps are waiting for the owner's approval.
5. **Check.** Run `node pan-harness/scripts/pan-harness-check.mjs` (with `--live` when the project names it) and `node pan-harness/scripts/secret-check.mjs` when the profile lists `secrets`. Done when: 0 errors, `RESULT: clean` with `secrets`.
6. **Full `ph-doctor`.** Run a full `ph-doctor` by `references/doctor.md`: the conformance table, the mechanical fixes at once, the structural proposals with a plan. Done when: the conformance table is ready.
7. **Date, commit and report.** Make the `Updated:` line under `Standard:` in `PAN-HARNESS.md` `Updated: ` plus the output of `date +%F` (no `checked`). Tag the update's history entry `[upgrade]`: it needs no new `state.md` date. Commit by the project's commit rule (`AGENTS.md` → `Rules`) and give the report: the versions (old → new), the steps done, the structural steps waiting for the owner's approval, the `ph-doctor` conformance count. Add the marker legend once, in the owner's language (`references/closing-legend.md`). Done when: `grep '^Updated:' PAN-HARNESS.md` prints today, the report is with the owner, the commit is made by that rule.

The agent reads the updated skills at session start: start the next work in a new session.

<!-- include: skill-parts/files.md -->

<!-- include: skill-parts/fresh-agent-test.md -->

<!-- include: skill-parts/report.md -->
