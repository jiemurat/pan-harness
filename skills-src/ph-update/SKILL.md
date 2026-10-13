---
name: ph-update
description: Updates ph-paket (Panoramic Harness, @jiemurat/pan-harness), migrates the harness to the new standard version and ends with a full ph-doctor run. Use it when asked to update the pan-harness.
license: MIT
metadata:
  version: "{{version}}"
  package: "@jiemurat/pan-harness"
---

# ph-update

<!-- include: skill-parts/intro.md -->

<!-- include: skill-parts/core-rules.md -->

## Steps

Updating ph-paket and migrating the harness are one task: at the end a full `ph-doctor` runs every time. The migration rules are in `references/doctor.md` → "3. Migration" and "6. Fix", the steps of the versions in the newly installed `references/changelog.md`. Go to the next step once a step's "Done when" condition holds:

1. **Versions.** Compare three versions:
   - the installed skills: `.agents/skills/.pan-harness.json` or `.claude/skills/.pan-harness.json` → `version` (when installed without the CLI, that skill's `SKILL.md` → `metadata.version`);
   - the newest on npm: `npm view @jiemurat/pan-harness version` (without internet, tell the owner and go on from step 3);
   - the harness standard: `PAN-HARNESS.md` → `Standard:`; an unknown standard (`references/structure.md` → "Glossary") is found here too.

   When the three are the same, go to step 5. Done when: the three versions are known.
2. **Updating ph-paket.** Run `npx @jiemurat/pan-harness@latest update`. When the CLI stops with code 3, skill files were changed by hand: show the list to the owner and, when the owner agrees, run it again with `--yes`. Take the list of changes the CLI prints (`CHANGELOG.md`) into the report. When the skills were installed without the CLI (a plugin or `npx skills`), update them by that route. Done when: the skills are on the new version (`.pan-harness.json` → `version`).
3. **Migration.** From the newly installed skill folder, run `node <skill>/scripts/migrate.mjs --root .`: it carries out the `mechanical` steps of `references/changelog.md`, replaces the scripts and updates the `Standard:` line. Do each item it prints as `by hand` by hand, by that changelog step; the `structural` steps with the owner's approval (with a plan and criteria). When the script stops on an unknown standard (code 3), follow the procedure of `references/doctor.md` → "3. Migration". Done when: each `by hand` item of the first run of `migrate.mjs` is done or in the report, the remaining structural steps are waiting for the owner's approval.
4. **Check.** Run `node pan-harness/scripts/pan-harness-check.mjs` (with `--live` when the project names it) and `node pan-harness/scripts/secret-check.mjs` when the profile lists `secrets`. Done when: 0 errors, `RESULT: clean` with `secrets`.
5. **Full `ph-doctor`.** Run a full `ph-doctor` by `references/doctor.md`: the conformance table, the mechanical fixes at once, the structural proposals with a plan. Done when: the conformance table is ready.
6. **Commit and report.** Commit by the project's commit rule (`AGENTS.md` → `Rules`) and give the report: the versions (old → new), the steps done, the structural steps waiting for the owner's approval, the `ph-doctor` conformance count. Done when: the report is with the owner, the commit is made by that rule.

The agent reads the updated skills at session start: start the next work in a new session.

<!-- include: skill-parts/files.md -->

<!-- include: skill-parts/fresh-agent-test.md -->

<!-- include: skill-parts/report.md -->
