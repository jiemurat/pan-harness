---
name: ph-archived-claude-sessions
description: Lists archived Claude Desktop sessions as a tree, each sub-session under the session that started it. Use it when the user asks for archived sessions of this folder, of every folder (`all`), or of a named project, folder or sidebar group.
compatibility: Claude Desktop (its session tools); in another agent the skill says so and stops
license: MIT
metadata:
  version: "{{version}}"
  package: "@jiemurat/pan-harness"
  agents: "claude"
---

# Archived sessions

Show archived sessions as a tree: a sub-session sits under the session that started it. The argument sets the **scope**:

| Argument | Scope |
|---|---|
| none | the current working directory: rows whose `cwd` is that folder or a folder inside it |
| `all` | every folder |
| any other text | rows whose `cwd` or `group.name` contains the text, ignoring case |

## Steps

1. **Load the tool.** Run ToolSearch with `select:mcp__ccd_session_mgmt__list_sessions`. When it returns nothing, the session runs outside Claude Desktop: say the list is unavailable here and stop.
2. **Fetch** with `list_sessions`, `include_archived: true`, `limit: 200`. When 200 rows come back, say the list may be cut off.
3. **Pick the seeds**: the rows with `isArchived: true` that fall in the scope. For the default scope, take the folder from `pwd` and expand a leading `~/` in `cwd` to the home folder before comparing. Done when every archived row is sorted in or out. With no seeds, say in one line that the scope has no archived sessions, name the folder or filter, mention `/ph-archived-claude-sessions all`, and stop.
4. **Build the families.** A row's parent is the row whose `sessionId` equals its `startedBy`. A seed's family is every row linked to it through parent and child links, at any depth, in any folder: a sub-session often runs in another folder, and the user wants it beside its parent. Of each family, show:
   - every archived row;
   - every non-archived row that is the parent or a child of an archived row: a **context row**, marked "not archived", so the user sees the relative is still active.

   A shown row whose parent is not shown becomes a root. Done when every archived row and every context row of each family is placed.
5. **Order** roots, and the children under each parent, by `lastActivityAt`, newest first.
6. **Write the list** in the format below, in the user's language: the header, the marker and the month names too. The list is the whole answer.

## Format

A header line, then one line per session; a sub-session is indented two spaces under its parent and starts with `↳`:

```markdown
my-app has 4 archived sessions: 2 main sessions and 2 sub-sessions. 1 session that is not archived is shown beside its relative.

- [Payment form](#local_15f13b4b-…) · my-app · Oct 22 · not archived
  - ↳ [Payment form tests](#local_78349776-…) · my-app · Oct 21
- [Login error fix](#local_12d11863-…) · my-app/api · Oct 20
  - ↳ [TARS: release notes](#local_af7fd38f-…) · notes/TARS · Oct 20
- [CRM task sync to Markdown](#local_3c9e0a17-…) · my-app · Oct 18
```

- **Header**: the scope (the folder name, "all folders", or the filter), the archived count split into roots and sub-sessions, and the count of context rows when there are any. Counts cover archived rows only.
- **Link**: `[title](#sessionId)` with the full `sessionId`, so the user can open it with a click.
- **Folder**: the last segment of `cwd`. Prefix it with the segment before it when that one names a project rather than a generic container, such as the home folder, `projects`, `work`, `code`, `src`, `Documents`, `Dropbox` or `pan-workers`: `~/projects/my-app` → `my-app`, `~/projects/my-app/api` → `my-app/api`, `~/pan-workers/notes/TARS` → `notes/TARS`.
- **Date**: the day of `lastActivityAt` in local time, with the month's short name in the user's language.
