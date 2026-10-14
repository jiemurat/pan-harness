# Changelog: pan-harness standard

`ph-update` and `ph-doctor` compare the project's version (`PAN-HARNESS.md` → `Standard:`) with this list and carry out the entries after it one by one, from the oldest to the newest. Each step names its type: a `mechanical` step is done at once, a `structural` step with a plan and the owner's approval (`doctor.md` → "6. Fix"). `node <skill>/scripts/migrate.mjs --root .` carries out the `mechanical` steps; do an item it prints as `by hand` by that step. When the harness is on an unknown standard, the procedure in `doctor.md` → "3. Migration" is followed (definition: `structure.md` → "Glossary").

Entry format: `## <version>`, what changed in a sentence or two, then the numbered steps (`mechanical` or `structural` — what is done).

## 2.6.2

The end-of-task list runs the project's full check (`PAN-HARNESS.md` → `Project checks`) after a task that changed a file outside the harness. `ph-init` no longer asks when the work counts as done: each task's plan agrees it, and the plan of `ph-init` shows the full check command found in the repo.

1. `mechanical` — `playbooks/end-of-task.md` gets the template's item "If this task changed a file outside the harness" before the item that runs `pan-harness-check.mjs` (`scripts/migrate.mjs`). When the project reworded the harness check item, or has an item of its own that names `Project checks`, the script prints "by hand": add the template's item before the harness check item, or show the difference to the owner and keep one of them.

## 2.5.2

Three skills that convert documents into Markdown join ph-paket: `ph-pdf-to-md`, `ph-word-to-md` and `ph-excel-to-md`. The harness standard is the same. There are no migration steps.

## 2.4.2

The first version. There are no migration steps: `ph-init` makes the harness in this standard.
