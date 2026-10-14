#!/usr/bin/env python3
"""Compare a Markdown file with the text layer of the PDF it came from, or with a second
reading of its page images.

usage: verify_markdown.py PDF MARKDOWN [--pages N | A-B] [--text FILE] [--fold-quotes] [--keep-furniture] [--show N]

Only word-like tokens count (tokens with a letter or digit), so list markers, table
pipes and heading marks never matter. Checks:
  WORDS   every word of the PDF text is in the Markdown and the Markdown adds none.
          Page furniture (page numbers and lines repeating from page to page, such as
          running headers and repeated table headers) may be present or absent. A word
          split by a hyphen at a line end may be joined or keep its hyphen.
  TABLES  the cells of each Markdown table row sit together in the PDF text (consecutive
          lines), so no value has moved to a distant row. Rows under a merged cell (its
          column is empty in them) are matched as one block, each row in its own lines of
          the block and in order. A wrapped line that sits in the neighbouring row instead
          of its own is not seen.
  ORDER   inside each paragraph line of 8 or more words, runs of 4 words follow the
          PDF reading order (catches lines mixed across columns); the order of whole
          paragraphs is not checked.
Quote, apostrophe and dash characters must match the PDF; a mismatch is listed under
CHARACTERS and fails unless --fold-quotes accepts it.
Limits: a one-page PDF or chunk has no repeating lines, so its header and footer words
show up as missing; a word cut in the middle by a narrow table column shows up as two missing
pieces and one extra word. Decide each such difference by looking at the PDF page.
--pages compares only that page or page range (for a Markdown chunk).
--text FILE compares with that text instead of the PDF text layer: for pages read by OCR,
  a second reading of the page images (tesseract output, one page per form feed). The file
  holds the pages compared: with --pages A-B its first page is page A, without --pages
  page 1. It adds AGREEMENT (share of words both readings have) and NUMBERS (every
  disagreement in a word with a digit), compares quote, apostrophe and dash characters
  folded (an image does not show which of them it is), and the result is REVIEW instead
  of FAIL: a difference may be a misreading on either side, so look at the page image.
--keep-furniture requires page furniture to be present, like any other text.
Exit code: 0 clean, 1 differences, 2 usage error or poppler (pdftotext) missing.
"""
import argparse
import collections
import html
import math
import re
import shutil
import subprocess
import sys
import unicodedata

Counter = collections.Counter
INSTALL_HINT = ('poppler is missing. Install it: macOS `brew install poppler`; Debian or Ubuntu '
                '`sudo apt install poppler-utils`; Fedora `sudo dnf install poppler-utils`; '
                'Windows `conda install -c conda-forge poppler` or `scoop install poppler`.')
MAX_LINES = 60   # most consecutive PDF lines one table row may span
RUN = 4          # words per run in the order check
SLACK = 12       # most word pieces a table row may differ by through hyphen splits
HEAD, TAIL = 6, 4  # non-empty lines at the top and bottom of a page that may be furniture
CJK = re.compile('([\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uac00-\ud7af])')
FOLD = str.maketrans({
    **dict.fromkeys('\u2018\u2019\u02b9\u02bb\u02bc\u2032\u00b4`', "'"),
    **dict.fromkeys('\u201c\u201d\u201e\u201f\u00ab\u00bb\u2033', '"'),
    **dict.fromkeys('\u2010\u2011\u2012\u2013\u2014\u2212', '-'),
})


def norm(text):
    text = unicodedata.normalize('NFKC', text)  # ligatures, no-break spaces
    return text.replace('\u00ad', '').replace('\u200b', '').replace('\ufeff', '')


def words(text, fold=False):
    text = CJK.sub(r' \1 ', norm(text))  # no spaces between words: one token per character
    if fold:
        text = text.translate(FOLD)
    return [w for w in text.split() if any(c.isalnum() for c in w)]


def source_pages(pdf, first, last, text_file=None):
    if text_file:
        try:
            pages = open(text_file, encoding='utf-8', errors='replace').read().split('\f')
        except OSError as e:
            print(f'cannot read the text file: {e}', file=sys.stderr)
            sys.exit(2)
        if pages and not pages[-1].strip():
            pages.pop()
        if first and len(pages) != last - first + 1:
            print(f'note: {text_file} has {len(pages)} page(s), --pages names {last - first + 1}', file=sys.stderr)
        return pages
    cmd = ['pdftotext', '-layout'] + (['-f', str(first)] if first else []) + (['-l', str(last)] if last else [])
    r = subprocess.run(cmd + [pdf, '-'], capture_output=True, encoding='utf-8', errors='replace')
    if r.returncode != 0:
        print(f'pdftotext failed: {r.stderr.strip()}', file=sys.stderr)
        sys.exit(2)
    pages = r.stdout.split('\f')
    if pages and not pages[-1].strip():
        pages.pop()
    return pages


def shape(line):
    return re.sub(r'\d+', '#', ' '.join(norm(line).translate(FOLD).split()))


def split_furniture(pages, first_page, keep):
    """Return all source lines as (page, line, kind) and the furniture lines among them; kind is '' for text,
    'carried' for a repeated line at the top of a page, 'hard' for the other furniture.
    Furniture: a line near a page edge whose pattern repeats on many pages, a page number, or a line
    at the top of a page that repeats an earlier line exactly (a table header carried over)."""
    page_lines = [p.split('\n') for p in pages]
    zones = []
    for lines in page_lines:
        idx = [i for i, line in enumerate(lines) if line.strip()]
        zones.append((set(idx[:HEAD]), set(idx[:HEAD] + idx[-TAIL:]), set(idx[:1] + idx[-2:])))
    repeated = set()
    if not keep and len(pages) >= 2:
        counts = Counter()
        for lines, (_, zone, _) in zip(page_lines, zones):
            counts.update({shape(lines[i]) for i in zone})
        need = max(2, math.ceil(0.4 * len(pages)))
        repeated = {s for s, c in counts.items() if c >= need}
    lines_all, furniture, seen = [], [], set()
    for n, lines in enumerate(page_lines):
        head, zone, ends = zones[n]
        for i, line in enumerate(lines):
            if not line.strip():
                continue
            text = ' '.join(norm(line).translate(FOLD).split())
            number = i in ends and re.fullmatch(r'\s{10,}\d{1,4}\s*', line) is not None
            carried = i in head and len(text.split()) >= 3 and text in seen
            hard = not keep and ((i in zone and shape(line) in repeated) or number)
            kind = 'hard' if hard else 'carried' if carried and not keep else ''
            lines_all.append((first_page + n, line, kind))
            if kind:
                furniture.append((first_page + n, line))
        seen.update(' '.join(norm(line).translate(FOLD).split()) for line in lines if line.strip())
    return lines_all, furniture


def clean_md_line(line):
    line = re.sub(r'(?<!\\)\\\s*$', '', line)                           # hard line break at the end
    line = line.replace('\\<', '\x01').replace('\\>', '\x02')
    line = re.sub(r'<(https?://[^>\s]+)>', r' \1 ', line)
    line = re.sub(r'<br\s*/?>', ' ', line, flags=re.I)
    line = re.sub(r'</?[A-Za-z][^>]*>', ' ', line)
    line = re.sub(r'!\[([^\]]*)\]\([^)]*\)', r'\1', line)
    line = re.sub(r'\[([^\]]*)\]\([^)]*\)', r'\1', line)
    line = html.unescape(line)
    line = re.sub(r'(?<!\\)`', '', line)                             # code span marks
    line = re.sub(r'(?<![\w\\])[*_]{1,3}(?=[^\s*_])', '', line)       # opening emphasis
    line = re.sub(r'(?<=[^\s\\*_])[*_]{1,3}(?!\w)', '', line)         # closing emphasis
    line = re.sub(r'(?<!\\)\|', ' ', line)                             # table pipes
    line = re.sub(r'\\([\\`*_{}\[\]()#+\-.!|<>~])', r'\1', line)       # escaped literals
    return line.replace('\x01', '<').replace('\x02', '>')


def markdown_lines(md):
    """Yield (line number, text without Markdown syntax, is table row) for every line outside comments."""
    md = re.sub(r'<!--.*?-->', lambda m: '\n' * m.group(0).count('\n'), md, flags=re.S)
    fenced = False
    for no, line in enumerate(md.split('\n'), 1):
        if line.strip().startswith('```'):
            fenced = not fenced
        else:
            yield no, line if fenced else clean_md_line(line), line.lstrip().startswith('|') and not fenced


def join_hyphens(missing, extra):
    """Cancel line-end hyphen splits in place: PDF 'ab-' + 'cd' against Markdown 'abcd'
    (joined) or 'ab-cd' (hyphen kept). Return the accepted (first, second) pairs."""
    pairs = []
    for word in sorted(extra):
        while extra[word] > 0:
            for k in range(1, len(word)):
                head, tail = word[:k], word[k:]
                options = [head + '-'] + ([head] if head.endswith('-') else [])
                found = next((a for a in options if missing[a] > (1 if a == tail else 0) and missing[tail] > 0), None)
                if found:
                    missing[found] -= 1
                    missing[tail] -= 1
                    extra[word] -= 1
                    pairs.append((found, tail))
                    break
            else:
                break
    return pairs


def split_cells(row):
    parts = re.split(r'(?<!\\)\|', row.strip())
    return parts[1:-1] if parts and not parts[-1].strip() else parts[1:]


def table_rows(md_text):
    """Table rows as (line number, all tokens, text, tokens per cell); separator lines are skipped."""
    rows = []
    for no, line in enumerate(md_text.split('\n'), 1):
        s = line.strip()
        if s.startswith('|') and not re.fullmatch(r'\|[\s:\-|]*', s):
            cells = [words(clean_md_line(c), True) for c in split_cells(s)]
            toks = [t for c in cells for t in c]
            if len(toks) >= 2:
                rows.append((no, toks, s, cells))
    return rows


def span_groups(rows):
    """Runs of rows under a merged cell: a row with text in a column, followed by rows that leave that
    column empty. The merged cell is taller than the rows beside it, so the run is one block in the PDF."""
    groups, i = [], 0
    while i < len(rows):
        j, spans = i, None
        while j + 1 < len(rows) and rows[j + 1][0] - rows[j][0] <= 2:
            filled = {c for c, cell in enumerate(rows[i][3]) if cell} if spans is None else spans
            under = {c for c in filled if c < len(rows[j + 1][3]) and not rows[j + 1][3][c]}
            if not under:
                break
            spans, j = under, j + 1
        if j > i:
            groups.append((list(range(i, j + 1)), spans))
        i = j + 1
    return groups


def build_index(lines):
    line_tokens = [words(line, True) for _, line in lines]
    index = collections.defaultdict(list)
    for i, toks in enumerate(line_tokens):
        for t in set(toks):
            index[t].append(i)
    return line_tokens, index


def row_in_source(tokens, source):
    """The (first, last) line of PDF text that holds exactly these tokens, or None."""
    line_tokens, index = source
    known = [t for t in set(tokens) if t in index]
    if not known:
        return None
    target, size = Counter(tokens), len(tokens)
    anchors = sorted(known, key=lambda t: len(index[t]))[:3]  # a split word may hide one anchor
    for k in sorted({k for a in anchors for k in index[a]}):
        before = 0
        for start in range(k, max(-1, k - MAX_LINES), -1):
            before += len(line_tokens[start])
            if before > size + SLACK:
                break
            window, total = Counter(), 0
            for end in range(start, min(len(line_tokens), start + MAX_LINES)):
                window.update(line_tokens[end])
                total += len(line_tokens[end])
                if total > size + SLACK:
                    break
                if end < k:
                    continue
                if window == target:
                    return start, end
                if abs(total - size) <= SLACK:
                    missing, extra = window - target, target - window
                    if sum(missing.values()) <= SLACK and sum(extra.values()) <= SLACK:
                        join_hyphens(missing, extra)
                        if not +missing and not +extra:
                            return start, end
    return None


def row_in_block(own, merged, line_tokens, first, last):
    """The (first, last) line, from line `first` on, where a row under a merged cell has its own tokens together
    inside the matched block: those lines may carry the merged cell's words, and nobody else's. None if absent."""
    target = Counter(own)
    allowed = target + Counter(merged)
    for start in range(first, last + 1):
        window = Counter()
        for end in range(start, last + 1):
            window.update(line_tokens[end])
            stray, absent = window - allowed, target - window
            if sum(stray.values()) > SLACK:
                break
            if sum(absent.values()) <= SLACK:
                join_hyphens(stray, absent)                         # split words of the row itself
                join_hyphens(stray, Counter(merged) - window)       # split words of the merged cell
                if not +stray and not +absent:
                    return start, end
    return None


def run_hashes(tokens):
    return {hash(tuple(tokens[i:i + RUN])) for i in range(len(tokens) - RUN + 1)}


def merge_split_words(tokens, keep_hyphen):
    out, i = [], 0
    while i < len(tokens):
        t = tokens[i]
        if i + 1 < len(tokens) and len(t) > 1 and t.endswith('-') and t[-2].isalnum():
            out.append(t + tokens[i + 1] if keep_hyphen else t[:-1] + tokens[i + 1])
            i += 2
        else:
            out.append(t)
            i += 1
    return out


def reading_runs(pdf, first, last, text_file=None):
    """Hashes of every run of RUN words in the reading order: poppler's default mode, or the text file."""
    if text_file:
        text = '\n'.join(source_pages(pdf, first, last, text_file))
    else:
        cmd = ['pdftotext'] + (['-f', str(first)] if first else []) + (['-l', str(last)] if last else [])
        text = subprocess.run(cmd + [pdf, '-'], capture_output=True, encoding='utf-8', errors='replace').stdout
    tokens = words(text, True)
    return run_hashes(tokens) | run_hashes(merge_split_words(tokens, False)) | run_hashes(merge_split_words(tokens, True))


def order_breaks(lines, runs):
    """Paragraph lines (not table rows) whose word runs are mostly absent from the PDF reading order."""
    checked, flagged = 0, []
    for no, text, is_table in lines:
        toks = words(text, True)
        if is_table or len(toks) < 2 * RUN:
            continue
        checked += 1
        grams = [hash(tuple(toks[i:i + RUN])) for i in range(len(toks) - RUN + 1)]
        bad = sum(1 for g in grams if g not in runs)
        if bad >= 2 * (RUN - 1) and bad > 0.3 * len(grams):  # a page break inside a paragraph costs RUN - 1
            flagged.append((no, bad, len(grams), ' '.join(toks[:8])))
    return checked, flagged


def compare(plain, md, optional, fold):
    """Word differences between the PDF tokens and the Markdown tokens (lists of (token, place))."""
    key = (lambda t: t.translate(FOLD)) if fold else (lambda t: t)
    need = Counter(key(t) for t, _ in plain)
    have = Counter(key(t) for t, _ in md)
    missing, extra = need - have, have - need
    pairs = join_hyphens(missing, extra)
    extra = extra - Counter(key(w) for w in optional)
    return +missing, +extra, pairs


def show_list(title, items, limit):
    print(f'{title}:')
    for text in items[:limit]:
        print('  ' + text)
    if len(items) > limit:
        print(f'  ... {len(items) - limit} more (raise --show)')


def main():
    ap = argparse.ArgumentParser(description='Compare a Markdown file with the text layer of its PDF.')
    ap.add_argument('pdf')
    ap.add_argument('markdown')
    ap.add_argument('--pages', help='PDF page or page range, e.g. 3 or 1-10')
    ap.add_argument('--text', help='compare with this text (pages split by form feeds) instead of the PDF text layer')
    ap.add_argument('--fold-quotes', action='store_true',
                    help='accept other quote, apostrophe and dash characters than the PDF has')
    ap.add_argument('--keep-furniture', action='store_true')
    ap.add_argument('--show', type=int, default=20)
    args = ap.parse_args()
    if shutil.which('pdftotext') is None and not args.text:
        print(INSTALL_HINT, file=sys.stderr)
        sys.exit(2)
    first = last = None
    if args.pages:
        m = re.fullmatch(r'(\d+)(?:-(\d+))?', args.pages)
        if not m:
            ap.error('--pages needs a page or a range like 1-10')
        first, last = int(m.group(1)), int(m.group(2) or m.group(1))
    pages = source_pages(args.pdf, first, last, args.text)
    lines_all, furniture = split_furniture(pages, first or 1, args.keep_furniture)
    kept = [(p, line) for p, line, kind in lines_all if not kind]
    plain = [(w, p) for p, line in kept for w in words(line)]
    try:
        md_text = open(args.markdown, encoding='utf-8').read()
    except (OSError, UnicodeDecodeError) as e:
        print(f'cannot read the Markdown file: {e}', file=sys.stderr)
        sys.exit(2)
    md_lines = list(markdown_lines(md_text))
    md = [(w, no) for no, text, _ in md_lines for w in words(text)]
    optional = [w for _, line in furniture for w in words(line)]

    strict = compare(plain, md, optional, False)
    folded = compare(plain, md, optional, True)
    missing, extra, pairs = folded
    variants = 0 if args.text else sum(strict[0].values()) - sum(missing.values())

    first_page = {}
    for tok, page in plain:
        first_page.setdefault(tok.translate(FOLD), page)
    first_line = {}
    for tok, no in md:
        first_line.setdefault(tok.translate(FOLD), no)

    source = 'second reading' if args.text else 'PDF'
    print(f"WORDS: {source} {len(plain)} | Markdown {len(md)} | missing {sum(missing.values())} | extra {sum(extra.values())}")
    if args.text:
        both = sum((Counter(t.translate(FOLD) for t, _ in plain) & Counter(t.translate(FOLD) for t, _ in md)).values())
        print(f'AGREEMENT: {200 * both / max(1, len(plain) + len(md)):.1f}% of words agree')
        digits = [f'{t!r} only in the second reading' for t in missing if any(c.isdigit() for c in t)]
        digits += [f'{t!r} only in the Markdown' for t in extra if any(c.isdigit() for c in t)]
        print(f'NUMBERS: {len(digits)} disagreement(s) in words with a digit' + (': ' + '; '.join(digits[:args.show]) if digits else ''))
    if variants:
        pdf_words = {}
        for tok, _ in plain:
            pdf_words.setdefault(tok.translate(FOLD), tok)
        examples = [f'{pdf_words[t.translate(FOLD)]!r} (PDF) vs {t!r} (Markdown)'
                    for t in strict[1] if t.translate(FOLD) in pdf_words and t != pdf_words[t.translate(FOLD)]][:3]
        print(f"CHARACTERS: {variants} word(s) use other quote, apostrophe or dash characters than the PDF"
              + (', accepted by --fold-quotes' if args.fold_quotes else '') + ('; e.g. ' + '; '.join(examples) if examples else ''))
    if furniture:
        shapes = Counter(shape(line) for _, line in furniture)
        listed = ', '.join(f'"{s[:40]}" x{c}' for s, c in shapes.most_common(5))
        print(f'FURNITURE: {len(furniture)} line(s) in {len(shapes)} pattern(s), may be absent from the Markdown: {listed}')
    else:
        print('FURNITURE: none found')
    if pairs:
        listed = ', '.join(f'{a}+{b}' for a, b in pairs[:args.show])
        print(f'HYPHEN-SPLIT WORDS: {len(pairs)} joined in the Markdown, accepted: {listed}' + (' ...' if len(pairs) > args.show else ''))
    rows = table_rows(md_text)
    unmatched, grouped = [], 0
    if rows:
        sources = [build_index([(p, line) for p, line, kind in lines_all if kind in keep_kinds]) for keep_kinds in (('',), ('', 'carried'), ('', 'carried', 'hard'))]
        failed = {k for k, row in enumerate(rows) if not any(row_in_source(row[1], src) for src in sources)}
        for group, spans in span_groups(rows):
            union = [t for k in group for t in rows[k][1]]
            for src in sources:
                found = row_in_source(union, src)
                if not found:
                    continue
                anchor = rows[group[0]][3]
                merged = [t for c in spans if c < len(anchor) for t in anchor[c]]
                position = found[0]
                for k in group:  # the rows follow each other down the block
                    own = [t for c, cell in enumerate(rows[k][3]) if c not in spans for t in cell]
                    hit = row_in_block(own, merged, src[0], position, found[1])
                    if hit:
                        position = hit[0]
                        grouped += k in failed
                        failed.discard(k)
                    else:
                        failed.add(k)
                break
        unmatched = [(rows[k][0], rows[k][2]) for k in sorted(failed)]
        print(f'TABLES: {len(rows)} row(s) checked, {len(rows) - len(unmatched)} matched'
              + (f' ({grouped} of them as blocks under a merged cell)' if grouped else '') + f', {len(unmatched)} unmatched')
    else:
        print('TABLES: no table rows')
    checked, breaks = order_breaks(md_lines, reading_runs(args.pdf, first, last, args.text))
    print(f'ORDER: {checked} paragraph line(s) checked, {len(breaks)} with word order differing from the PDF')
    if missing:
        order = sorted(missing, key=lambda t: first_page.get(t, 0))
        show_list('MISSING from the Markdown (word, count, first PDF page)',
                  [f'{t!r} x{missing[t]} page {first_page.get(t, "?")}' for t in order], args.show)
    if extra:
        order = sorted(extra, key=lambda t: first_line.get(t, 0))
        show_list('EXTRA in the Markdown (word, count, first Markdown line)',
                  [f'{t!r} x{extra[t]} line {first_line.get(t, "?")}' for t in order], args.show)
    if unmatched:
        show_list('TABLE ROWS not found together in the PDF text (Markdown line, row)',
                  [f'line {no}: {text[:110]}' for no, text in unmatched], args.show)
    if breaks:
        show_list('PARAGRAPH LINES whose word order differs from the PDF reading order (Markdown line, runs not found, start)',
                  [f'line {no}: {bad} of {total} runs of {RUN} words not found: {head} ...' for no, bad, total, head in breaks], args.show)
    clean_result = not missing and not extra and not unmatched and not breaks and (not variants or args.fold_quotes)
    print('RESULT: ' + ('PASS' if clean_result else 'REVIEW' if args.text else 'FAIL'))
    sys.exit(0 if clean_result else 1)


if __name__ == '__main__':
    main()
