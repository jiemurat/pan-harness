# OCR pages

How to turn pages without a usable text layer (the OCR PAGES of `check_text_layer.py`) into Markdown: you read each page image, tesseract reads it a second time, and `verify_markdown.py --text` shows where the two readings differ. Two independent readers rarely make the same mistake, so a word both agree on is almost certainly right, and the places where they disagree are the places to look at.

## Contents

- Set up tesseract and the language files
- Render the pages
- Read each page
- Second reading and comparison
- Resolve the differences
- An earlier OCR layer
- Mixed PDF and the finished file

## Set up tesseract and the language files

The TESSERACT line of `check_text_layer.py` says whether tesseract is installed and which language files it sees. Install what is missing yourself:

| System | Command |
|---|---|
| macOS | `brew install tesseract` |
| Debian, Ubuntu | `sudo apt install tesseract-ocr` |
| Fedora | `sudo dnf install tesseract` |
| Windows | `winget install --id UB-Mannheim.TesseractOCR` |

When a command asks for a password (`sudo`), or the package manager itself (Homebrew, winget) is missing, give the command to the user and wait for them to run it.

Language files: look at the page images, name every language and script on them, and use one tesseract code per language, with `_cyrl` or `_latn` for a second script (for example `eng`, `rus`, `deu`, `srp_latn`). Keep all language files in one user folder, which needs no administrator rights: `~/.local/share/tessdata` (on Windows `%LOCALAPPDATA%\tessdata`). Download each missing file into it:

```
curl -fL -o <folder>/<code>.traineddata https://github.com/tesseract-ocr/tessdata/raw/main/<code>.traineddata
```

Put `eng.traineddata` and `osd.traineddata` there too: copy them from the folder tesseract was installed with, or download them the same way. Pass the folder to every call with `--tessdata-dir <folder>`. Run `check_text_layer.py` again: its TESSERACT line lists the languages in the folder.

## Render the pages

Work on the OCR pages in chunks of about 5 pages: images take far more of your context than text. Render a chunk at 300 dpi into a scratch folder outside the user's folder; both readers use these images:

```
pdftoppm -r 300 -png -f A -l B FILE.pdf <scratch>/page
```

Each page becomes `<scratch>/page-<N>.png` (the number may have leading zeros).

## Read each page

Write your reading before you run tesseract on the page or look at an earlier text layer of it: a second reader only catches mistakes when the first reading is independent. Open the page image and write its Markdown with `references/structure-rules.md`: every word as printed, in reading order, with the page's headings, lists and tables. Write a word you cannot read as the letters you can see, and list it in the report with its page: a guessed word looks right and is wrong. Leave out what is not text: stamps, signatures, logos, icons and the lines of a table. An image does not show which apostrophe, quote or dash character a word uses: write the ones the language's spelling prescribes, the same way throughout the file.

## Second reading and comparison

Let tesseract read the same images:

```
tesseract <scratch>/page-<N>.png - -l <codes joined by +> --tessdata-dir <folder> --psm 4
```

`--psm 4` reads the page as one column of lines, which keeps table rows together; for a page of running text in two or more columns use `--psm 3`, which finds the columns. Write the pages of a chunk into one scratch file in page order, with `printf '\f'` after each page, so that its first page is page A of the chunk. Then compare the chunk with your Markdown:

```
verify_markdown.py FILE.pdf <chunk>.md --text <chunk-ocr>.txt --pages A-B
```

It prints AGREEMENT (the share of words both readings have), NUMBERS (every difference in a word with a digit) and the lists you know from text-layer pages (MISSING, EXTRA, TABLE ROWS, PARAGRAPH LINES). Quotes, apostrophes and dashes are compared folded. `RESULT: REVIEW` means the readings differ somewhere; either reader can be the wrong one.

## Resolve the differences

- Check every difference on the NUMBERS line: numbers, dates, codes and amounts are where a misreading does the most harm.
- On a page whose AGREEMENT is below 95%, check every difference of that page as well.

To check a difference, look at that spot in a zoomed crop:

```
pdftoppm -r 600 -f N -l N -x X -y Y -W W -H H -png FILE.pdf <scratch>/zoom
```

X, Y, W and H are pixels at 600 dpi, so twice the position in the 300-dpi page image. Correct your Markdown where the crop shows that tesseract was right; keep your reading where the crop confirms it. Tesseract's own misreadings (icons and table lines read as letters, a dropped row, a wrong letter) stay in its text and in the comparison: count them for the report.

Done with a page when every NUMBERS difference is resolved and, on a page below 95% AGREEMENT, every listed difference is resolved.

When tesseract or a language file cannot be installed (the user declines, or the command fails), you are the only reader: read every number, date, code and amount a second time in a zoomed crop, and mark these pages as read by one reader in the report.

## An earlier OCR layer

TEXT OVER IMAGE PAGES are usually scans that someone ran through OCR before; that earlier layer may be good or garbled. Test one such page before copying it: save its layer with `pdftotext -layout -f N -l N FILE.pdf <scratch>/layer.md`, read the rendered page with tesseract as above into `<scratch>/page-ocr.txt`, and run `verify_markdown.py FILE.pdf <scratch>/layer.md --text <scratch>/page-ocr.txt --pages N | grep AGREEMENT`, reading only that line so that your own reading of the page stays independent. At 90% AGREEMENT or more, copy these pages from the text layer; below it, read them by OCR like the other OCR pages.

## Mixed PDF and the finished file

Keep each chunk all text-layer pages or all OCR pages, and check each against its own source: text-layer chunks against the PDF, OCR chunks with `--text`. For the finished file, build one text with every page of the PDF in order, `pdftotext -layout -f N -l N FILE.pdf -` for a text-layer page and its tesseract reading for an OCR page, `printf '\f'` after each, and run `verify_markdown.py FILE.pdf OUT.md --text <all>.txt`. A text-layer page must show no difference there; an OCR page may only show the tesseract misreadings you already counted.

For the report, per OCR page: the AGREEMENT, how many differences you checked and how many were tesseract's misreadings, the words you could not read, and the tesseract version and languages (or that no second reading was possible, and why).
