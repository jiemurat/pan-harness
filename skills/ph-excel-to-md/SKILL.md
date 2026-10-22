---
name: ph-excel-to-md
description: Converts Excel workbooks (.xlsx, .xlsm, .xls, .xlsb, web-page exports) into checked Markdown, every cell as Excel shows it. Use it whenever the user wants an Excel file or some of its sheets as Markdown (.md) or searchable text, even one named by its title. Not for .csv, .ods, analysis or editing.
compatibility: python3 (3.8 or newer); LibreOffice for .xls and .xlsb files (installed when missing) and for the second reading of numbers and dates
license: MIT
metadata:
  version: "2.10.6"
  package: "@jiemurat/pan-harness"
---

# Excel to Markdown

Turn each Excel workbook into a Markdown file that holds every cell Excel shows, in its sheet, row and column, and prove it with `verify_excel_md.py`. `excel_to_md.py` reads an .xlsx itself; the other formats are first turned into an .xlsx by `check_excel_file.py`.

**Done when** every Excel file of the request is either written as a Markdown file whose check shows PASS or only explained differences, or listed as not converted with the reason, and the user has the report from step 5.

`scripts/` is in the folder that holds this SKILL.md. Run the scripts as `python3 <that folder>/scripts/NAME.py` (`python` on Windows). They read the Excel files and write only into the paths you give them. Keep their output in a scratch folder outside the user's folder until step 4 passes.

## 1. Check the files

Run `check_excel_file.py --xlsx-dir <scratch> FILE [FILE ...]` once for all files of the request. It finds each file's real format from its content and writes the .xlsx to convert. Act on each FORMAT:

| FORMAT | Action |
|---|---|
| `xlsx` | Convert the file named on the XLSX line. |
| `xls`, `xlsb` | Convert the .xlsx that LibreOffice made (the XLSX line). |
| `excel-xml`, `web-page`, `text` | Convert the .xlsx the script wrote (the XLSX line): a page's or text file's cells hold the text the file holds, so "007" stays "007"; a page becomes one sheet with its text and tables in page order. |
| `encrypted` | Skip it: tell the user it needs a password, and that a copy saved without one can be converted. |
| `not-excel` | Tell the user what the file is (the note): an .ods saved as .xlsx can be converted; a Word file or a PDF goes to a converter for those. |
| `error` | Tell the user the note and skip the file. |

When an .xls or .xlsb file needs LibreOffice and LIBREOFFICE says `not found`, install it with the command the script prints for this system, and tell the user first that it takes several hundred MB. When the command needs a password (`sudo`) or the package manager is missing, give the command to the user and wait. Then run the check again. An .xlsx needs no LibreOffice: without it, step 4 reads the numbers and dates once.

Done when every file has a FORMAT and each file to convert has an XLSX path.

## 2. Settle where the Markdown goes

Ask the user once, in one message, where the Markdown goes: the folder, and a file name for each Excel file, proposing its name with `.md` in place of the extension (`budget.xlsx` becomes `budget.md`; the names must differ). Skip what the request already says; when it names only a folder, use the proposed names without asking. One set of answers covers every file of the request. The folder is always the user's choice: a folder picked for them puts the files where they will not look.

When a target path is known, look whether a file is already there, and ask about overwriting it (or using another name) only when one is. Convert every sheet unless the request names some.

Done when each file to convert has a target path that is free, or whose overwrite the user has confirmed.

## 3. Convert

Run `excel_to_md.py XLSX <scratch>/NAME.md --title TITLE` for each file, with the original file's name without its extension as TITLE, and `--sheet NAME` for each sheet the user named. It writes every sheet as a heading, its title and note lines as paragraphs and the rest as one table, and prints a summary. The docstring at the top of `scripts/excel_to_md.py` lists the Markdown conventions, the neutral notation of numbers and dates among them; the check compares cell positions by the same layout rule, so keep that rule and change only what the check lists in step 4.

A workbook can produce a long file: read the summary and the check's output rather than the whole Markdown. The summary names what the report needs: EMPTY SHEETS and CHART SHEETS (not written), HIDDEN ROWS AND COLUMNS (kept, and named there because the tables do not mark them), VALUES THEIR FORMAT HIDES (left empty), LEFT OUT (notes, pictures, charts), FORMULAS WITHOUT A SAVED VALUE (written empty), FORMULAS THAT CHANGE BY THEMSELVES (their saved value, which may be out of date), and FORMATS TO CHECK (cells written by approximation, compared in step 4).

Done when every file has its scratch Markdown and you have its summary.

## 4. Verify

Run `verify_excel_md.py XLSX <scratch>/NAME.md`, with the same `--sheet` options as the conversion. It reads the .xlsx on its own, without the converter's code, and compares every sheet, row and cell; it checks each number and date against the stored value, and LibreOffice reads them a second time. Act on each output:

| Output | Meaning | Fix |
|---|---|---|
| SHEETS | a sheet missing, extra, out of order, or with a wrong (hidden) mark | correct the `##` section |
| MISSING | a row, paragraph or text box of the workbook absent from the Markdown | add it where the workbook has it |
| EXTRA | Markdown text the workbook does not have, or text in a cell that is empty there | remove it |
| CELLS | a cell whose text differs, or a row with another number of cells | correct the cell |
| VALUES | a number or date that its format does not give from the stored value | write the value as its format shows it, in the neutral notation |
| DISPLAY | LibreOffice shows the number or date differently | for a cell under FORMATS TO CHECK, take LibreOffice's text in the neutral notation; otherwise keep the script's text and name the cell in the report |
| LINKS | a link address that differs from the workbook's | restore the workbook's address |

Fix, run again, and repeat until PASS. LIBREOFFICE says when the numbers and dates had one reader, which the report says. A difference you cannot fix goes in the report as it is. Then copy the scratch file to the target path.

Done when every file shows `RESULT: PASS` or only differences explained in the report, and sits at its target path.

## 5. Report

For each file give:
- the Markdown path and the check result (PASS, or the explained differences with their lines);
- what was left out on purpose and what was kept: the LEFT OUT, EMPTY SHEETS, CHART SHEETS, HIDDEN and VALUES THEIR FORMAT HIDES lines of the summary;
- formulas written empty or with a saved value that may be out of date, and cells that LibreOffice showed differently;
- for a file not converted: the reason and the next step (a password, a copy saved as .xlsx, a converter for Word files or PDFs).

Say how numbers and dates are written: in a notation that does not depend on the computer (1234567.50, yyyy-mm-dd), with percents, currency text and the date formats the workbook sets; a web page or text file keeps each cell as the text it holds. Say what the check covers (every cell's text in its sheet, row and column, numbers and dates against their stored values with a second reading; for an .xls or .xlsb the comparison is with LibreOffice's .xlsx copy of it, and for a web page, text file or Excel 2003 XML with the .xlsx the check wrote from it) and what it leaves to the reader (whether a table's first row is really its header, the meaning of colours and of the notes left out).

Done when every file of the request has an entry in the report.
