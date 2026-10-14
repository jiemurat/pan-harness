# Structure rules

How to write the Markdown for a PDF, whether its pages are copied from the text layer or read by OCR. The aim: a reader (or a program) gets every word of the PDF, in the PDF's order, with the structure the PDF shows. On a text-layer page `pdftotext` gives text only, so structure comes from what the text shows: numbering, capital letters, blank lines, column alignment. On an OCR page you see the structure in the image.

## Contents

- Words
- Page furniture
- Headings, paragraphs, lists
- Columns
- Tables
- Special characters
- Images

## Words

Copy each word and character as the PDF has it. Keep the PDF's own quotes, apostrophes and dashes: in some languages an apostrophe is a letter, so changing it changes the word. Keep the spelling, wording, order and language, including typos and old spelling.

Mechanical changes that keep the text intact are allowed:
- Runs of spaces and line breaks inside a paragraph become one space.
- Ligature characters become their letters; no-break spaces become spaces.
- A word split by a hyphen at a line end is joined (`assess-` + `ment` becomes `assessment`). Keep the hyphen when it belongs to the word (`well-` + `known` becomes `well-known`).

## Page furniture

Page furniture is text that belongs to the page, not to the document: page numbers, running headers and footers, and a table header that repeats at the top of every page. Leave it out, except for the first copy of a repeated table header, which stays as the header of that table. Keep a line when it is unclear whether it is furniture, and keep a line that `verify_markdown.py` lists as furniture when it is real text.

## Headings, paragraphs, lists

- Mark a line as a heading (`#` for the title, then `##`, `###`) when the PDF sets it apart as a heading: larger or capitalised text on its own, or section numbering such as `1.`, `1.1`, `Chapter 2`. Let the numbering depth set the level. Keep the number in the heading text.
- A paragraph is one line of Markdown: join its lines with single spaces. Separate paragraphs with a blank line.
- Write bullets as `- item`. Write plain `1.`, `2.` lists as they are. Numbering of another kind (`1.1`, `a)`, `(iii)`, `Article 5`) stays as the first words of the paragraph or list item, because Markdown would renumber it.
- A footnote or end note stays a paragraph, in the place where the extracted text puts it.
- Keep bold and italic where the PDF's fonts show them (`pdftohtml -xml` marks bold and italic runs); the extracted text does not show them and the check ignores the marks.

## Columns

Text set in two or more columns is read column by column: the whole left column, then the right one. `pdftotext` without `-layout` follows this order; `-layout` places the columns side by side on each line, so read each column on its own and join only lines of the same column.

## Tables

- Write a table as a GitHub-style pipe table. The first row of the PDF table is the header row. A table that continues on the next page is one table.
- Put the whole row on one Markdown line. A cell with several lines becomes one line: join the lines with a space, or with `<br>` when the line breaks carry meaning (a list inside the cell).
- Write the text of a merged cell once, in the first row it covers, and leave the cells below it empty. Repeating the text would add words the PDF does not have.
- Escape a pipe inside a cell as `\|`.
- Keep a layout of `label: value` lines as lines of text, unless the PDF draws it as a table.
- In a table with wrapped cells, give each continuation line to the cell and row it belongs to by its column position in the `-layout` text, and re-read those rows against the page: the check cannot see a wrapped line that went to the neighbouring row.

## Special characters

Write a character that Markdown would read as syntax with a backslash, so it shows as in the PDF: `\*` for a footnote star, `\_` for blanks to fill in (`\_\_\_\_`), `\|`, `\<`, `\>`, `\#` at the start of a line, `\-` or `1\.` at the start of a line that only looks like a list. Keep formulas and symbols as extracted; when extracted symbols look wrong (boxes, question marks, shifted letters), report the page.

## Images

Figures, photos, logos and drawings are not converted; their captions are text and stay.
