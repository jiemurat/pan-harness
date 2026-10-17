---
name: ph-word-to-md
description: Converts Word documents (.docx and .doc) into Markdown, keeping list numbers, tables and footnotes, checking every word. Use it whenever the user wants a Word file, even one named by its title, as Markdown (.md) or plain text, before looking for the file. Not for PDFs, summaries or editing.
compatibility: python3 (3.8 or newer); LibreOffice for .doc files (installed when missing) and for the second reading of list numbers
license: MIT
metadata:
  version: "2.8.4"
  package: "@jiemurat/pan-harness"
---

# Word to Markdown

Turn each Word file into a Markdown file that holds the same words in the same order, with Word's list numbers written as text, its tables and its notes, and prove it with `verify_word_md.py`. `word_to_md.py` reads a .docx itself; LibreOffice first turns a .doc (and a "Word" file that is really a web page or RTF) into a .docx.

**Done when** every Word file of the request is either written as a Markdown file whose check shows PASS or only explained differences, or listed as not converted with the reason, and the user has the report from step 5.

`scripts/` is in the folder that holds this SKILL.md. Run the scripts as `python3 <that folder>/scripts/NAME.py` (`python` on Windows). They read the Word files and write only into the paths you give them. Keep their output in a scratch folder outside the user's folder until step 4 passes.

## 1. Check the files

Run `check_word_file.py --docx-dir <scratch> FILE [FILE ...]` once for all files of the request. It finds each file's real format from its content and has LibreOffice convert the formats that need it. Act on each FORMAT:

| FORMAT | Action |
|---|---|
| `docx` | Convert the file named on the DOCX line. |
| `doc`, `web-page`, `rtf`, `word-xml` | Convert the .docx that LibreOffice made (the DOCX line). |
| `encrypted` | Skip it: tell the user it needs a password, and that a copy saved without one can be converted. |
| `not-word` | Tell the user what the file is (the note): a PDF or a scan goes to a PDF converter. |
| `error` | Tell the user the note and skip the file. |

When a file needs LibreOffice and LIBREOFFICE says `not found`, install it with the command the script prints for this system, and tell the user first that it takes several hundred MB. When the command needs a password (`sudo`) or the package manager is missing, give the command to the user and wait. Then run the check again.

IMAGE ONLY means the file holds pictures of pages (pasted scans) and almost no text: tell the user, and offer to save it as PDF for a converter that reads scans, with the program on the LIBREOFFICE line: `<program> --headless --convert-to pdf --outdir <folder the user picks> FILE`.

Done when every file has a FORMAT and each file to convert has a DOCX path.

## 2. Settle where the Markdown goes

Ask the user once, in one message, where the Markdown goes: the folder, and a file name for each Word file, proposing its name with `.md` in place of the extension (`report.docx` becomes `report.md`; the names must differ). Skip what the request already says; when it names only a folder, use the proposed names without asking. One set of answers covers every file of the request. The folder is always the user's choice: a folder picked for them puts the files where they will not look.

When a target path is known, look whether a file is already there, and ask about overwriting it (or using another name) only when one is. You decide headings and the rest of the structure yourself and report the decisions (step 5).

Done when each file to convert has a target path that is free, or whose overwrite the user has confirmed.

## 3. Convert

Run `word_to_md.py DOCX <scratch>/NAME.md` for each file. It writes the words, list numbers, tables, notes and links, and prints a summary of what it converted and left out. The docstring at the top of `scripts/word_to_md.py` lists the Markdown conventions; the check relies on them, so keep them when you edit.

Word's heading styles become headings by themselves. Many documents set their headings apart by bold, centring or capitals instead: HEADING CANDIDATES lists such paragraphs with their line and cues. Decide each one:
- Make it a heading when it names a part of the document: the title, an annex, a chapter, a section, an article. `#` is the document's title (its type, number and subject), and the numbering hierarchy sets the levels below it: an annex or chapter above its sections, a section above its articles. Keep the number in the heading text, without bold marks; a candidate of several lines becomes one heading line.
- Keep it as it is when it is a signature or a name, a date or a place, a label inside a form or sample, a bold label that ends with a colon and opens the lines after it, or a bold sentence of the running text.

Look over the first lines of the file as well: a document's title often has no cue at all.

LIST FORMATS TO CHECK names number formats the script writes by approximation: compare those numbers with the second reading in step 4. A WARNING names a part the script wrote in a simpler form (a table inside a table cell becomes lines of that cell) or could not convert.

Done when every heading candidate is decided and the scratch file holds your edits.

## 4. Verify

Run `verify_word_md.py DOCX <scratch>/NAME.md`. It reads the .docx on its own, without the converter's code, and compares in order every word, the list numbers (LibreOffice reads them a second time), the table cells and the notes. Act on each output:

| Output | Meaning | Fix |
|---|---|---|
| MISSING | words of the document absent from the Markdown | add them where the document has them |
| EXTRA | Markdown words the document does not have | remove them |
| CHARACTERS | other quotes, apostrophes or dashes than the document | restore the document's characters |
| NUMBERS | a list number that differs from LibreOffice's reading | keep the number that continues its list (the numbers before and after it); when neither does, keep the script's number and name the paragraph in the report |
| TABLE ROWS | a cell whose words differ from the document's cell | correct the cell |
| NOTES | a note mark or note text that differs from the document | correct the mark or the text |

Fix, run again, and repeat until PASS. LIST NUMBERS says when LibreOffice is missing: the numbers then had one reader, which the report says. A difference you cannot fix goes in the report as it is. Then copy the scratch file to the target path.

Done when every file shows `RESULT: PASS` or only differences explained in the report, and sits at its target path.

## 5. Report

For each file give:
- the Markdown path and the check result (PASS, or the explained differences with their lines);
- what was left out on purpose: the TRACKED CHANGES, LEFT OUT and NOT CONVERTED lines of the converter's summary;
- the headings you made from candidates, and list numbers that had one reader or differed between the readers;
- for a file not converted: the reason and the next step (a password, a readable copy, a converter for scans).

Say what the check covers (words in order, list numbers with a second reading, table cells, notes; for a .doc, the comparison is with LibreOffice's .docx copy of it) and what it leaves to the reader (which lines are headings and their levels, list nesting, link addresses, the layout of forms aligned with tabs and spaces).

Done when every file of the request has an entry in the report.
