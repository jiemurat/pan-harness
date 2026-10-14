# Changelog

Versions follow semver. MAJOR: an older harness fails the new checks until it is migrated; MINOR: new features, checks or added mechanical migration steps (an older harness keeps working); PATCH: fixes. `ph-update` runs the migration steps. The steps for each version are in the skills' `references/changelog.md`.

## 2.7.2

`ph-pdf-to-md` writes a first draft of the Markdown with a script, and its check sees table columns.

- `pdf_to_md.py` writes the draft from the text layer: headings from font sizes and from bold lines that start with a section number, paragraphs, lists, bold and italic, and the tables the PDF draws with rules, with merged cells and tables that go on over a page break; page numbers and running lines are left out. The agent corrects the draft against the pages instead of typing the text, and the script names the pages it leaves to the agent: no text layer, text in columns, a table without rules, a cell cut by a page break.
- `verify_markdown.py` adds TABLE COLUMNS: on a table drawn with rules, the words of each Markdown cell must sit in one column of the PDF, so a table whose cells were put into one column no longer passes.
- `ph-pdf-to-md` also runs `pdftohtml` and `pdftocairo`; both come with poppler.
- There are no migration steps for the harness.

## 2.6.2

The end of every task now runs the project's own checks, and `/ph-init` asks one question less.

- `/ph-init` no longer asks what counts as done for the whole project: each task's plan agrees it with you. The plan of `/ph-init` shows the check command it found in the repo (for example, `make test`), so the usual interview has three questions: the goal, the limits and the artifact-folder.
- The end-of-task checklist runs the project's full check (tests, lint, a build) after every task that changed a file outside the harness, small changes too. A failure the task caused is fixed before the commit; a failure that was there before goes into the report and the plan.
- `/ph-update` adds the new item to a 2.4.2 or 2.5.2 harness.

## 2.5.2

Three new skills turn documents into Markdown and check the result against the original file.

- `ph-pdf-to-md` converts PDFs and scans: the text layer is copied, scanned or garbled pages are read from the page image, and a second reading checks the words and numbers.
- `ph-word-to-md` converts Word documents (`.docx`, `.doc`) with list numbers as Word shows them, tables, footnotes and links, and checks every word and number.
- `ph-excel-to-md` converts Excel workbooks (`.xlsx`, `.xlsm`, `.xls`, `.xlsb`): each sheet becomes a heading and a table with every cell as Excel shows it, and the check compares every cell, number and date.
- The converters run Python 3.8 or newer; when a file needs poppler, tesseract or LibreOffice, the skills install them (README → Requirements).
- Each skill description has its own limit of 300 bytes, in place of 1000 bytes for all skills together: an agent reads the description of every installed skill in each session.
- There are no migration steps for the harness.

## 2.4.2

The skills and the harness are in English, and `ph-init` asks which language to talk in. This version starts the standard afresh: the earlier versions stay in the git history and on npm.

- `ph-init` first asks "Which language should we talk in?" in English, Uzbek and Russian, with a fourth option for any other language. From the answer on, its questions, plan and report are in that language; the harness is written in English, so any agent and model reads it the same way.
- In the chat the agent writes in the chosen language, answers in the owner's language when the owner writes in another one and, for a message that is only a command, takes the language from the context. Where a word has several meanings, it uses one English term (structure, state, check, test, limit and others), explained once.
- The skill instructions, references, templates and scripts are in English (they were in Uzbek), edited by the writing rules for agent readers; their meaning is the same.
- The harness template has two new playbooks: `playbooks/large-task.md` (planning and carrying out a large task, the usage limit) and `playbooks/end-of-task.md` (the end-of-task checklist and the journal rules). `AGENTS.md` keeps the task types with a link to the first; the growth limits moved to `playbooks/pan-harness.md` and the language of other texts to `runbook.md`.
- The audit items, standard choices, principles and test scenarios are numbered from 1.
- A harness of a 1.x version has no migration steps: `ph-update` and `ph-doctor` treat it as an unknown standard and compare it with the current templates item by item.
- The skill descriptions say what each skill does and when to use it; the package has five skills, `ph-writing-for-agents` included.
- The guide in Uzbek (`docs/uz.md`) is removed.
- The texts use five terms, the chat the first four with the owner: the project (the work itself), the artifacts (its work products, inputs and outputs: code, documents, data), the project-folder (where ph-paket is installed), the artifact-folder (the one folder for the artifacts, apart from the harness) and the owner (the project owner).
- `ph-init` agrees the artifact-folder with the owner: options by the type of the artifacts (`src/` for code, `documents/` for documents, `data/` for data, `artifacts/` for a mix; never `docs/`) and the owner's own name as the last option. In an existing project it proposes moving the artifacts into it, with the goal and the benefit; the move becomes the first large task, `ph-init` moves no artifact. `ph-doctor` checks the artifact-folder.
