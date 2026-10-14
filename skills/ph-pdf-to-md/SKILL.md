---
name: ph-pdf-to-md
description: Converts PDFs and scans into Markdown, reading scanned or garbled pages from the page image and checking them with a second reading. Use it whenever the user wants a PDF, a scan or a document named by its title as Markdown (.md), before looking for the file. Not for Word files or summaries.
compatibility: python3 (3.8 or newer), poppler (pdftotext, pdfinfo, pdfimages, pdftoppm); tesseract for scanned pages, installed when missing
license: MIT
metadata:
  version: "2.6.2"
  package: "@jiemurat/pan-harness"
---

# PDF to Markdown

Turn each PDF into a Markdown file that holds the same words in the same order, and prove it with `verify_markdown.py`. A page with a text layer (the selectable text inside a PDF) is copied from that layer and checked against it. A page without one (a scan) or with a broken one is read from its image (OCR): you read the image, tesseract reads it again, and the two readings are compared.

**Done when** every PDF of the request is either written as a Markdown file whose check leaves no unexplained difference, or listed as not converted with the reason, and the user has the report from step 5.

`scripts/` and `references/` are in the folder that holds this SKILL.md. Run the scripts as `python3 <that folder>/scripts/NAME.py` (`python` on Windows). They only read files and print. When poppler is missing they print how to install it: run that command yourself, or give it to the user when it needs a password (`sudo`).

## 1. Check the text layer

Run `check_text_layer.py FILE.pdf [FILE.pdf ...]` once for all PDFs of the request. Act on each VERDICT:

| VERDICT | Action |
|---|---|
| `text` | Copy every page from the text layer once the SAMPLE lines read as real text; gibberish there means a broken text layer, so read those pages by OCR. |
| `mixed` | Copy the pages that have text; read the OCR PAGES by OCR. |
| `no-text`, `unusable-text` | Read every page by OCR: it is a scan, or its text layer is broken characters. |
| `encrypted` | Stop for this PDF and tell the user it needs a password. |
| `error` | Tell the user the NOTE line and skip this PDF. |

A TEXT OVER IMAGE PAGES line means a text layer lies over a scanned page, usually an earlier OCR of unknown quality: test it as `references/ocr.md` says before you copy those pages.

Done when every PDF has a verdict and you know which of its pages are copied and which are read by OCR.

## 2. Settle where the Markdown goes

Ask the user once, in one message, where the Markdown goes: the folder, and a file name for each PDF with the PDF's name plus `.md` as your proposal (the names must differ). Skip what the request already says; when it names only a folder, use the proposed names without asking. One set of answers covers every PDF of the request. The folder is always the user's choice: a folder picked for them puts the files where they will not look.

When a target path is known, look whether a file is already there, and ask about overwriting it (or using another name) only when one is.

You decide headers, footers, tables and images yourself and report the decisions (steps 3 and 5).

Done when each PDF to convert has a target path that is free, or whose overwrite the user has confirmed.

## 3. Convert

Before writing the first file, read `references/structure-rules.md` (words, page furniture, headings, columns, tables, special characters, images). Before the first OCR page, read `references/ocr.md`: it sets up tesseract and its language files, installing what is missing, and gives the commands for reading the pages.

For text-layer pages, get the text with `pdftotext -layout FILE.pdf -`, which keeps table rows and forms intact; add `-f A -l B` for pages A to B. For running text in columns use `pdftotext` without `-layout`, which follows the columns. Work in chunks of about 10 pages, and of about 5 pages for OCR pages: write a chunk to a scratch file outside the user's folder, check it as step 4 says, then append it to the target file. A paragraph or table that carries on from the previous chunk's last page continues the previous text. A mistake is caught while its page is fresh, and a long PDF does not outgrow one reply.

Done when the Markdown file of each PDF is written at its target path.

## 4. Verify

Run `verify_markdown.py FILE.pdf OUT.md` on each scratch chunk with `--pages A-B` (the chunk's PDF pages) and on the finished file. For OCR pages add `--text` with tesseract's reading, as `references/ocr.md` says; the output then also shows AGREEMENT and NUMBERS, and ends in `RESULT: REVIEW` instead of FAIL. It lists every difference by PDF page or Markdown line. Act on each:

| Output | Meaning | Fix |
|---|---|---|
| MISSING | words of the source absent from the Markdown | add them where the page has them |
| EXTRA | Markdown words the source does not have | remove them, or correct the typo |
| CHARACTERS | other quotes, apostrophes or dashes than the PDF | restore the PDF's characters; use `--fold-quotes` only when the user asked for plain quotes, and say so |
| TABLE ROWS | a row whose cells are not together in the source | look at the page: a value sits in the wrong row or cell |
| PARAGRAPH LINES | lines of different columns mixed | rewrite in reading order |

On text-layer pages, fix, run again, and repeat until PASS. Two differences are not errors: the header and footer words of a one-page PDF or chunk (one page has no repetition to recognise them), and a word cut in the middle by a narrow table column. Name each such difference in the report with its page and reason. FURNITURE lines are optional for the check, so it cannot see a real line dropped from that list: look at each FURNITURE pattern that appears once (`x1`) and keep it in the Markdown when it is real text. On OCR pages, resolve the differences as `references/ocr.md` says. A difference you cannot fix goes in the report as it is; the check stays as it is.

Done when every text-layer page shows `RESULT: PASS` or only explained differences, and every OCR page meets the rule in `references/ocr.md`.

## 5. Report

For each PDF give:
- the Markdown path and the verification result (PASS, or the explained differences with their pages);
- what was left out or changed on purpose: page furniture (the FURNITURE line), joined hyphenated words (the HYPHEN-SPLIT WORDS count), images not converted (`pdfimages -list FILE.pdf` gives their pages);
- for OCR pages: which pages, the tesseract version and languages, and per page the AGREEMENT, the differences checked, tesseract's misreadings and the words you could not read;
- for a PDF not converted: the reason and the next step (a password for an encrypted file, a readable copy for an unreadable one).

Say what the check covers (words, table rows, word order inside paragraphs; on OCR pages, the agreement of two readings) and what it leaves to the reader (heading levels, list nesting, the order of whole paragraphs, which of two neighbouring table rows holds a wrapped line).

Done when every PDF of the request has an entry in the report.
