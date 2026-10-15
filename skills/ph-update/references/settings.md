# Panoramic Harness standard: settings

The settings part of the standard. Read it when a step links to it, when you write or check `project/check.json` or a check extension, on a size warning, before a commit (the commit order, the commit number of a history entry) and when you compare the `Standard:` version. The rest of the standard: `structure.md`.

## Contents
- History and archive
- Git
- Size limits
- Extensions and settings
- Version

## History and archive

- **The history** goes month by month: `history/YYYY-MM.md`. An entry goes at the end of the current month's file; at the start of a month a new file opens with the heading of the month before. Each entry stays whole in its month's file. The last tasks: `cat pan-harness/history/*.md | grep '^### 20' | tail -5`.
- **The archive** is not read whole, but what a journal lacks is searched for in the archive with grep (P10). `grep -rn` over `pan-harness/` covers the archive too.
- **Commit number.** Once the work is committed, the number takes the place of `pending` in the history entry. This edit goes into the next commit; when the session makes no commit of its own, it is committed alone after the check. When a commit is amended, the number changes: compare it with `git log` at the next session start.

## Git

The pan-harness works in git in every project: the history, the checkpoints and telling the owner's changes from the agent's rely on it.
- **Installing and setting up** is a part of `ph-init`: git, `git init -b main`, the identity, `.gitignore` and the first commit — `init.md` → "1. Preparation", the hook — `init.md` → "5. Create".
- **`.gitignore`** only for what this project has: secret files (`.env*` except `.env.example`; `*.pem`, `*.key`, the exact names of secret files found), the cache and dependencies of the project's language (for example, `__pycache__/`, `node_modules/`, `.venv/`), the project's build and export folder, logs, OS and editor files (`.DS_Store`, `Thumbs.db`, `*.swp`), office lock files in a document project (`~$*`, `.~lock.*#`). The skills are tools, not project knowledge: the CLI ignores them with its own block (`# >>> pan-harness tools` … `# <<< pan-harness tools <<<`) and rewrites the block on every `npx … init` and `update`: only the CLI writes the block. A pattern is exact: a broad pattern such as `*secret*`, `*token*` and the ready templates of other ecosystems hide the project's files too. After each change, check with `git status --short --ignored`. Tracking a file over 50 MB or not is the owner's decision. Updated at the end of every task (`playbooks/end-of-task.md`), `pan-harness-check` → `never_track` watches it.
- **A folder a cloud service syncs** (OneDrive, Dropbox, iCloud Drive, Google Drive): the service can write into `.git` while git works and corrupt the repository. Tell the owner and offer to move the project out of the synced folder or to keep `.git` out of syncing; the owner decides.
- **Commit order** (S6 → `AGENTS.md` R4):
  - (a), the standard answer: the agent commits at the end of each task, and in a large task at the end of each stage, once the end-of-task checks pass. A commit only in work that changed files;
  - the commit takes only the files the agent changed in this task (`git add <file>`, not `-A`). The owner's uncommitted changes (in `git status`, not on the `Changed files` list of the active task) go into a commit of their own before the agent's (`Owner's changes: <files>`). When one file holds changes of both, the file goes into the agent's commit and the message says so;
  - in `ph-init`, when the repo has uncommitted changes, a `Pre-init state` commit is made before the harness is written (with the standard commit order; otherwise the owner is asked);
  - (b): a commit only when the owner asks; the agent gives the list of files;
  - in both: the hook must pass, `--no-verify` is the owner's decision only; the owner pushes: the agent runs a push only when a message of the owner asks for it explicitly, and does not ask about it itself; rewriting history (amend, rebase, force push) only on the owner's explicit instruction; with `secrets` in `sensitive-data`, `secret-check` before the commit.
- **Commit message:** the first line says what changed in up to 72 characters, after an empty line a short list and the D and L IDs; the language is that of the code comments (`runbook.md` → `Writing the harness`). The signature of the agent's tool (for example, `Co-Authored-By`) is in the tool's own rule, the standard does not write it.

## Size limits

| What | Limit | How to trim |
|---|---|---|
| Start set (`AGENTS.md`, `PAN-HARNESS.md`, `state.md`, `plan.md`) | Standard 24 KB (24 576 bytes), in a small project 20 KB (S24). The project's own limit is in `project/check.json` → `start_limit_bytes`; `PAN-HARNESS.md` does not repeat the number, or one of them goes stale | The "would the agent make a mistake if I removed it?" test (P2), moving a domain rule to a playbook |
| Any other doc | 40 KB (`doc_limit_bytes`). A doc over 10 KB is not read whole, so it starts with a `## Contents` list | Closed parts to the archive; splitting by topic |
| `history/`, `archive/` | No limit | Searched with grep |
| `decisions.md` | Only current decisions, size as any other doc (`doc_limit_bytes`) | Superseded and done ones to the archive |
| `handoff.md` | About 8 KB: in an active task it is read at session start with the start set | The details of finished stages to the history entry |
| `feedback.md`, `lessons.md` | 40 KB | Old entries that became rules go to the archive with their number; lessons are kept in full |

Measure the size with `wc -c`. In UTF-8, characters such as `—`, `…`, `→`, `ʻ` and non-Latin letters take 2–3 bytes, so the size comes out bigger than it looks. On a size warning, tidy up in the same task or tell the owner.

## Extensions and settings

- **`project/scripts/check-*`** (`.mjs` or `.js` — with `node`, `.py` — with `python3`) — the project's own checks. `pan-harness-check.mjs` runs them one by one: `node <file> --root <project-folder> [--live]` (`python3` for `.py`). Write a new extension in Node: Python is not on every computer. An extension prints `ERROR …` and `WARN …` lines and ends with 1 on an error.
- **`project/scripts/secret-check-*`** (`.mjs`, `.js`, `.py` or `.sh`) — the project's own checks for secrets or confidential data: for example, a comparison with the live secret values or PII patterns. `secret-check.mjs` gives them the paths it checks. They never print a value. The PII patterns are agreed with the owner (for example, a passport or phone number format): the skill gives no ready patterns, because they depend on the country.
- **`project/check.json`** (optional):

  ```json
  {
    "start_limit_bytes": 24576,
    "doc_limit_bytes": 40960,
    "path_bases": ["src", "services/*"],
    "path_prefixes": ["pan-harness", "project", "playbooks", "scripts", "docs", "src"],
    "secret_paths": ["docs"],
    "fields_from": {"D": 12, "F": 5, "L": 3, "Layer": 7, "history": "YYYY-MM-DD"},
    "co_change": {"src/api/": ["pan-harness/project/api.md"], "chapters/*.md": ["pan-harness/project/outline.md"]},
    "markers": {"scope": "changed", "paths": ["src/**/*.py", "chapters/*.md"], "patterns": ["\\bTODO\\b", "\\bFIXME\\b", "\\bTK\\b", "\\bprint\\("]},
    "never_track": ["dist/", "exports/*.pdf"],
    "track_ok": ["fixtures/sample.log"],
    "large_file_mb": 50
  }
  ```

  The keys:
  - `path_bases` — short paths in a doc are also looked up from these folders (globs allowed);
  - `path_prefixes` — the path starts that are checked (separate files in the root, for example `main.py`, are not among them). When given, it is used in place of the standard list (`pan-harness`, `project`, `playbooks`, `scripts`, `references`, `history`, `archive`, `tests`, `docs`, `src`);
  - `secret_paths` — folders `secret-check.mjs` checks on top of the standard paths;
  - `fields_from` — from which number or date the mandatory fields of journal entries (`Why:`, `Quote:`, `Rule:`, `Checks:` and others) are checked; older entries are append-only and keep their old form; `Layer` — from which lesson its `Layer:` field is checked;
  - `co_change` — a watched file or folder (a folder when it ends with `/`, otherwise a glob) → the doc or docs that describe it: when the watched file changes and its doc does not, the script warns. The changes come from `git status`; it works the same for code, configs, chapters and templates;
  - `markers` — the files (globs) and patterns (regex) searched for signs of unfinished work (`TODO`, `FIXME` and debug leftovers such as `console.log` in code; `TK`, "[source needed]" in a document); `scope` — `all` (the default) reads every line, `changed` only the lines changed since the last commit and the untracked files (the leftovers of this task; `ph-init` sets it with `code=yes`); without patterns, this check is off;
  - `never_track` — extra patterns git should not track: a folder at any depth when it ends with `/`, otherwise a file name or a path (glob). The script's own list (secrets, caches, logs, OS and editor files) always works; this key adds to it;
  - `track_ok` — paths tracked on purpose (exceptions);
  - `large_file_mb` — the size limit of a tracked file (standard 50).
- **Git hook** (mandatory). To make the checks mandatory before a commit, the project keeps `.githooks/pre-commit` (from `templates/githooks/pre-commit.tmpl`) in the repo and connects it with `git config core.hooksPath .githooks`. The hook runs `pan-harness-check.mjs` (without `--live`) and (when the profile lists `secrets`) `secret-check.mjs`; on an error the commit stops and the cause is fixed; without Node, the hook lets the commit pass and says to run the checks by hand; skipping the check (`git commit --no-verify`) is the owner's decision only.

## Version

The last line of `PAN-HARNESS.md` holds the standard version: `Standard: pan-harness <version>`. The version is that of the pan-harness package (`@jiemurat/pan-harness`, semver): `package.json`, `metadata.version` in each skill, `VERSION` in `pan-harness-check.mjs` and the last entry of `changelog.md` are the same. MAJOR — an old harness gives errors with the new script and does not work without a migration; MINOR — a new capability, check or added `mechanical` migration step (an old harness keeps working, the new items give only `WARN` and audit findings); PATCH — a fix. `ph-update` and `ph-doctor` carry out the `changelog.md` entries after the project's version: the `mechanical` steps by `scripts/migrate.mjs`, the rest by the agent; the scripts are also compared with `diff`, whatever the version. When the harness is on an unknown standard (`structure.md` → "Glossary"), the procedure in `doctor.md` → "3. Migration" is followed.
