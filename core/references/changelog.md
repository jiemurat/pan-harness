# Changelog: pan-harness standard

`ph-update` and `ph-doctor` compare the project's version (`PAN-HARNESS.md` → `Standard:`) with this list and carry out the entries after it one by one, from the oldest to the newest. Each step names its type: a `mechanical` step is done at once, a `structural` step with a plan and the owner's approval (`doctor.md` → "6. Fix"). `node <skill>/scripts/migrate.mjs --root .` carries out the `mechanical` steps; do an item it prints as `by hand` by that step. When the harness is on an unknown standard, the procedure in `doctor.md` → "3. Migration" is followed (definition: `structure.md` → "Glossary").

Entry format: `## <version>`, what changed in a sentence or two, then the numbered steps (`mechanical` or `structural` — what is done).

## 2.5.2

Three skills that convert documents into Markdown join ph-paket: `ph-pdf-to-md`, `ph-word-to-md` and `ph-excel-to-md`. The harness standard is the same. There are no migration steps.

## 2.4.2

The first version. There are no migration steps: `ph-init` makes the harness in this standard.
