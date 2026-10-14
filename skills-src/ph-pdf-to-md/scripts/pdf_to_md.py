#!/usr/bin/env python3
"""Write a first Markdown draft of a PDF from its text layer, for the agent to compare with the
pages and correct.

usage: pdf_to_md.py PDF OUT.md [--pages N | A-B]

It reads the fonts and positions of the text (pdftohtml -xml), the words (pdftotext -bbox) and
the drawn rules (pdftocairo -svg), and writes:
  headings   lines in a larger font than the body text, one level per font size from the
             largest (#, ##, ...); a short line set apart and wholly in bold gets the level
             below them
  paragraphs lines joined with spaces; a word hyphenated at a line end joined without the
             hyphen; bold and italic as **...** and *...*
  lists      a line starting with a bullet sign as "- ", with "1." or "1)" as a numbered item;
             the lines under it with a hanging indent belong to it
  tables     tables drawn with rules (lines or thin filled boxes): one Markdown row per table
             row, a merged cell written once in its first row and column with the cells it
             covers left empty, a table that goes on over a page break joined into one with its
             repeated header row left out; table cells have no bold or italic
  furniture  page numbers, and lines at the top or bottom of the pages that repeat on at least
             half of them, left out
It leaves to the agent and lists under WARNINGS: pages without a text layer (read them by OCR),
pages whose text is set in columns (written in poppler's reading order, without headings or
lists: check them against the page), tables without drawn rules (written as paragraphs) and a
table row that may go on from the page before. With --pages the fonts and the furniture still
come from the whole PDF, so the parts of one PDF match. Images are not written.
Exit code: 0 written, 2 usage error or poppler missing.
"""
import argparse
import collections
import html
import os
import re
import shutil
import subprocess
import sys
import tempfile

INSTALL_HINT = ('poppler is missing. Install it: macOS `brew install poppler`; Debian or Ubuntu '
                '`sudo apt install poppler-utils`; Fedora `sudo dnf install poppler-utils`; '
                'Windows `conda install -c conda-forge poppler` or `scoop install poppler`.')
THIN = 1.6          # a drawn rule is thinner than this (points)
NEAR = 1.5          # rule ends and edges closer than this (points) touch
BULLETS = '•●▪■◦○‣∙·–—-*❖✓✔➢►▶➤□❑'
WORD_PART = r"(?:[^\W_]|['ʻʼ‘’])+"   # letters, digits and the apostrophes some alphabets write inside words
VOCAB = collections.Counter()   # the words of the whole PDF, for line-end hyphens
HEADING_RATIO = 1.15  # a heading font is at least this much larger than the body font
EDGE_LINES = 3      # lines at the top and bottom of a page that may be furniture
SPACED = re.compile(r'(?<!\S)(?:[^\W\d_] ){3,}[^\W\d_](?!\S)')   # N O T I C E: one word set apart
SECTION = re.compile(r'(\d+(?:\.\d+)*)\.?\s|\d+-\w+\.?\s|(?:Chapter|Part|Section|Article)\s+\d', re.I)


def run(cmd):
    r = subprocess.run(cmd, capture_output=True, encoding='utf-8', errors='replace')
    if r.returncode != 0:
        print(f'{cmd[0]} failed: {r.stderr.strip()}', file=sys.stderr)
        sys.exit(2)
    return r.stdout


# text lines with fonts

def xml_pages(pdf, first, last):
    """Per page: (width, height, fragments); a fragment is a dict with top, left, right, bottom, size
    and runs [(bold, italic, text)]."""
    out = run(['pdftohtml', '-xml', '-i', '-zoom', '1', '-stdout', '-q', '-f', str(first), '-l', str(last), pdf])
    sizes, pages = {}, []
    for m in re.finditer(r'<fontspec id="(\d+)" size="([\d.]+)"', out):
        sizes[m.group(1)] = float(m.group(2))
    for page in re.split(r'<page ', out)[1:]:
        w = float(re.search(r'width="([\d.]+)"', page).group(1))
        h = float(re.search(r'height="([\d.]+)"', page).group(1))
        frags = []
        for m in re.finditer(r'<text top="(-?[\d.]+)" left="(-?[\d.]+)" width="([\d.]+)" height="([\d.]+)" font="(\d+)">(.*?)</text>',
                             page, re.S):
            top, left, width, height = (float(m.group(i)) for i in range(1, 5))
            runs, bold, italic = [], False, False
            for part in re.split(r'(</?[bi]>|<[^>]+>)', m.group(6)):
                if part in ('<b>', '</b>', '<i>', '</i>'):
                    bold = part == '<b>' if part in ('<b>', '</b>') else bold
                    italic = part == '<i>' if part in ('<i>', '</i>') else italic
                elif part and not part.startswith('<'):
                    runs.append((bold, italic, html.unescape(part)))
            if ''.join(t for _, _, t in runs).strip():
                frags.append({'top': top, 'left': left, 'right': left + width, 'bottom': top + height,
                              'size': sizes.get(m.group(5), 0.0), 'runs': runs})
        pages.append((w, h, frags))
    return pages


def page_words(pdf, first, last):
    """Per page: words [x0, y0, x1, y1, text], with the touching pieces of one word glued."""
    out = run(['pdftotext', '-bbox', '-f', str(first), '-l', str(last), pdf, '-'])
    pages = []
    for page in out.split('<page ')[1:]:
        glued = []
        for a, b, c, d, t in re.findall(r'<word xMin="([\d.]+)" yMin="([\d.]+)" xMax="([\d.]+)" yMax="([\d.]+)">(.*?)</word>', page):
            x0, y0, x1, y1, t = float(a), float(b), float(c), float(d), html.unescape(t)
            g = glued[-1] if glued else None
            if g and min(g[3], y1) - max(g[1], y0) >= 0.5 * min(g[3] - g[1], y1 - y0) and -1 < x0 - g[2] < 0.6:
                glued[-1][2], glued[-1][4] = x1, glued[-1][4] + t
            else:
                glued.append([x0, y0, x1, y1, t])
        pages.append(glued)
    return pages


# tables from drawn rules

def page_rules(pdf, page):
    """Horizontal [x0, x1, y] and vertical [y0, y1, x] rules: thin filled shapes and stroked straight lines."""
    with tempfile.TemporaryDirectory() as tmp:
        out = os.path.join(tmp, 'page.svg')
        r = subprocess.run(['pdftocairo', '-svg', '-f', str(page), '-l', str(page), pdf, out], capture_output=True)
        if r.returncode != 0 or not os.path.exists(out):
            return [], []
        svg = open(out, encoding='utf-8', errors='replace').read()
    hs, vs = [], []
    for tag in re.findall(r'<path\b[^>]*>', svg[max(0, svg.rfind('</defs>')):]):
        d = re.search(r'\sd="([^"]*)"', tag)
        if not d or re.search(r'[CcQqAaSsTt]', d.group(1)):
            continue
        nums = [float(n) for n in re.findall(r'-?\d+(?:\.\d+)?(?:e-?\d+)?', d.group(1))]
        m = re.search(r'transform="matrix\(([^)]*)\)"', tag)
        a, b, c, e, f, g = [float(n) for n in re.split(r'[\s,]+', m.group(1).strip())] if m else (1, 0, 0, 1, 0, 0)
        pts = [(a * x + c * y + f, b * x + e * y + g) for x, y in zip(nums[0::2], nums[1::2])]
        if not pts:
            continue
        if 'fill="none"' in tag:
            pairs = list(zip(pts, pts[1:]))
        else:
            xs, ys = [p[0] for p in pts], [p[1] for p in pts]
            pairs = [((min(xs), min(ys)), (max(xs), max(ys)))]
        for (x0, y0), (x1, y1) in pairs:
            w, h = abs(x1 - x0), abs(y1 - y0)
            if h < THIN and w > 2.5:
                hs.append([min(x0, x1), max(x0, x1), (y0 + y1) / 2])
            elif w < THIN and h > 2.5:
                vs.append([min(y0, y1), max(y0, y1), (x0 + x1) / 2])
    return hs, vs


def rule_groups(hs, vs):
    """Rules that touch, and vertical rules side by side over the same height, form one table."""
    items = [(s[0], s[2] - NEAR, s[1], s[2] + NEAR) for s in hs] + [(s[2] - NEAR, s[0], s[2] + NEAR, s[1]) for s in vs]
    parent = list(range(len(items)))

    def find(i):
        while parent[i] != i:
            parent[i] = parent[parent[i]]
            i = parent[i]
        return i
    for i, p in enumerate(items):
        for j in range(i + 1, len(items)):
            q = items[j]
            if (p[0] <= q[2] and q[0] <= p[2] and p[1] <= q[3] and q[1] <= p[3]) or (
                    i >= len(hs) and min(p[3], q[3]) - max(p[1], q[1]) > 0.8 * min(p[3] - p[1], q[3] - q[1])):
                parent[find(i)] = find(j)
    groups = collections.defaultdict(lambda: ([], []))
    for i in range(len(items)):
        groups[find(i)][0 if i < len(hs) else 1].append(hs[i] if i < len(hs) else vs[i - len(hs)])
    found = [g for g in groups.values() if g[0] and len(g[1]) >= 2]
    box = lambda g: (min(s[0] for s in g[0]), min(s[0] for s in g[1]), max(s[1] for s in g[0]), max(s[1] for s in g[1]))  # noqa: E731
    merged = True
    while merged:                                      # parts of one table: the same width, one on top of the other
        merged = False
        for a in found:
            for b in found:
                A, B = box(a), box(b)
                if a is not b and abs(A[0] - B[0]) < 3 and abs(A[2] - B[2]) < 3 and abs(A[3] - B[1]) < 3:
                    a[0].extend(b[0])
                    a[1].extend(b[1])
                    found.remove(b)
                    merged = True
                    break
            if merged:
                break
    return found


def cluster(values):
    out = []
    for x in sorted(values):
        if out and x - out[-1][-1] < NEAR * 2:
            out[-1].append(x)
        else:
            out.append([x])
    return [sum(c) / len(c) for c in out]


def covered(segs, c, a, b):
    """Does a rule at constant coordinate c cover most of [a, b]? segs are [a0, a1, c]."""
    got = sum(max(0.0, min(b, s[1]) - max(a, s[0])) for s in segs if abs(s[2] - c) < NEAR * 2)
    return got >= 0.6 * (b - a)


def keeps_hyphen(left, right):
    """Does a word hyphenated at a line end keep its hyphen? Yes when the PDF writes it with the hyphen
    elsewhere more often than without (self-assessment), else the hyphen goes (assess-ment)."""
    head = re.search(r'\S+$', left).group(0)
    tail = re.match(r'\S*', right).group(0)
    core = lambda w: re.sub(r'^\W+|\W+$', '', w)  # noqa: E731
    kept, dropped = VOCAB[core(head + tail)], VOCAB[core(head[:-1] + tail)]
    if kept or dropped:
        return kept > dropped
    prefix = core(head) + '-'                          # neither form elsewhere: is the first part a prefix of compounds?
    return any(w.startswith(prefix) and len(w) > len(prefix) for w in VOCAB)


def cell_text(ws):
    """The words of one cell in reading order, lines joined with spaces, a line-end hyphen joined."""
    xs = [(w[0] + w[2]) / 2 for w in ws]
    if len(ws) >= 3 and all(len(w[4]) == 1 for w in ws) and max(xs) - min(xs) < 4:
        return ''.join(w[4] for w in sorted(ws, key=lambda w: w[1]))     # letters stacked upright: one word
    ws = sorted(ws, key=lambda w: (w[1] + w[3]) / 2)
    lines, top = [], None
    for w in ws:
        yc = (w[1] + w[3]) / 2
        if top is None or yc - top > 2:
            lines.append([])
            top = yc
        lines[-1].append(w)
    text = ''
    for line in lines:
        piece = SPACED.sub(lambda m: m.group(0).replace(' ', ''), ' '.join(w[4] for w in sorted(line, key=lambda w: w[0])))
        if text.endswith('-') and len(text) > 1 and text[-2].isalpha() and piece[:1].islower():
            text = (text if keeps_hyphen(text, piece) else text[:-1]) + piece
        else:
            text = (text + ' ' + piece).strip()
    return text


def build_table(h, v, words):
    xs = cluster([s[2] for s in v])
    ys = cluster([s[2] for s in h])
    vtop, vbot = min(s[0] for s in v), max(s[1] for s in v)
    if vtop < ys[0] - 3:          # a table that goes on from the page before has no top rule
        ys.insert(0, vtop)
    if vbot > ys[-1] + 3:
        ys.append(vbot)
    R, C = len(ys) - 1, len(xs) - 1
    if R < 1 or C < 2:
        return None
    parent = {(r, c): (r, c) for r in range(R) for c in range(C)}

    def find(a):
        while parent[a] != a:
            parent[a] = parent[parent[a]]
            a = parent[a]
        return a
    for r in range(R):
        for c in range(C):
            if c + 1 < C and not covered(v, xs[c + 1], ys[r], ys[r + 1]):
                parent[find((r, c))] = find((r, c + 1))
            if r + 1 < R and not covered(h, ys[r + 1], xs[c], xs[c + 1]):
                parent[find((r, c))] = find((r + 1, c))
    members = collections.defaultdict(list)
    for r in range(R):
        for c in range(C):
            members[find((r, c))].append((r, c))
    owner = {m: min(ms) for ms in members.values() for m in ms}
    texts, used = collections.defaultdict(list), []
    for w in words:
        xc, yc = (w[0] + w[2]) / 2, (w[1] + w[3]) / 2
        if xs[0] - 1 < xc < xs[-1] + 1 and ys[0] - 1 < yc < ys[-1] + 1:
            c = sum(1 for x in xs[1:-1] if xc > x)
            r = sum(1 for y in ys[1:-1] if yc > y)
            texts[owner[(r, c)]].append(w)
            used.append(w)
    grid = [['' for _ in range(C)] for _ in range(R)]
    for (r, c), ws in texts.items():
        grid[r][c] = cell_text(ws)
    grid = [row for row in grid if any(row)]
    if not grid:
        return None
    open_top = [c for c in range(C) if not covered(h, ys[0], xs[c], xs[c + 1])]   # cells going on from the page before
    return {'top': ys[0], 'bottom': ys[-1], 'box': (xs[0], ys[0], xs[-1], ys[-1]), 'xs': xs, 'rows': grid, 'used': used,
            'open_top': open_top}


# lines, furniture, blocks

def lines_of(frags, words=()):
    """Group fragments into lines (their heights overlap by half the smaller one, as for an apostrophe set
    higher) and join each line left to right, with a space between two fragments unless the place between
    them lies inside one of pdftotext's `words` (don + ’ + t). Letters set apart (N O T I C E) are joined when
    pdftotext reads them as one word."""
    known = {w[4] for w in words}
    rows = collections.defaultdict(list)
    for w in words:
        for k in range(int(w[1] // 4), int(w[3] // 4) + 1):
            rows[k].append(w)
    groups = []
    for f in sorted(frags, key=lambda f: (f['top'], f['left'])):
        h = max(1.0, f['bottom'] - f['top'])
        same = None
        for g in groups[-4:]:
            overlap = min(g['bottom'], f['bottom']) - max(g['top'], f['top'])
            if overlap >= 0.5 * min(h, g['height']) and all(f['left'] >= o['right'] - 3 or f['right'] <= o['left'] + 3
                                                            for o in g['frags']):
                same = g
        if same:
            same['frags'].append(f)
            same['top'], same['bottom'] = min(same['top'], f['top']), max(same['bottom'], f['bottom'])
        else:
            groups.append({'frags': [f], 'top': f['top'], 'bottom': f['bottom'], 'height': h})
    lines = []
    for g in groups:
        parts = sorted(g['frags'], key=lambda f: f['left'])
        main = max(parts, key=lambda f: f['bottom'] - f['top'])
        ln = dict(parts[0], runs=list(parts[0]['runs']), gaps=[], mid=(main['top'] + main['bottom']) / 2,
                  top=g['top'], bottom=g['bottom'])
        for f in parts[1:]:
            gap = f['left'] - ln['right']
            left, right = ''.join(t for _, _, t in ln['runs']), ''.join(t for _, _, t in f['runs'])
            bx, by = (ln['right'] + f['left']) / 2, ln['mid']
            one_word = left[-1:].strip() and right[:1].strip() and any(
                w[0] < bx < w[2] and w[1] < by < w[3] for w in rows.get(int(by // 4), ()))   # pdftotext: one word
            runs = [list(r) for r in f['runs']]
            if one_word:                               # no space inside the word, even one the fragment starts with
                while runs and not runs[0][2].strip():
                    runs.pop(0)
                if runs:
                    runs[0][2] = runs[0][2].lstrip()
            elif gap > 0.5 and not re.match(r'[.,;:!?)\]]', right) and not left.endswith(('(', '[')):
                ln['runs'].append((False, False, ' '))
            ln['runs'] += [tuple(r) for r in runs]
            ln['right'] = max(ln['right'], f['right'])
            ln['size'] = max(ln['size'], f['size'])
            ln['gaps'].append(gap)
        lines.append(ln)
    lines.sort(key=lambda ln: (ln['top'], ln['left']))
    glue = lambda m: m.group(0).replace(' ', '') if m.group(0).replace(' ', '') in known else m.group(0)  # noqa: E731
    for ln in lines:
        ln['runs'] = [(b, i, SPACED.sub(glue, t)) for b, i, t in ln['runs']]
        ln['text'] = ''.join(t for _, _, t in ln['runs']).strip()
        ln['bold'] = all(b for b, _, t in ln['runs'] if t.strip())
    return lines


def furniture_lines(lines, shapes):
    """The lines of a page that are furniture: at the top or bottom, alone at their height, and repeating on the
    pages (`shapes`) or a page number."""
    out = []
    for i, ln in enumerate(lines):
        edge = i < EDGE_LINES or i >= len(lines) - EDGE_LINES
        alone = not any(o is not ln and abs(o['mid'] - ln['mid']) < 3 for o in lines)
        if edge and alone and (shape(ln['text']) in shapes or re.fullmatch(r'[-–—\s]*\d{1,4}[-–—\s]*', ln['text'])):
            out.append(ln)
    return out


def shape(text):
    return re.sub(r'\d+', '#', ' '.join(text.split()))


def furniture(pages_lines):
    """Shapes of lines at the top or bottom of pages that repeat on at least half of the pages (two at least)."""
    seen = collections.Counter()
    for lines in pages_lines:
        edge = lines[:EDGE_LINES] + lines[-EDGE_LINES:]
        seen.update({shape(ln['text']) for ln in edge})
    n = len(pages_lines)
    return {s for s, k in seen.items() if k >= 2 and k >= n / 2}


def gapped(lines):
    """Lines with a gap wider than 15 points between their parts: columns, a table without rules or a form."""
    return [ln for ln in lines if any(g > 15 for g in ln['gaps'])]


def marker(text):
    """('bullet' | 'number', marker, rest) when a line starts a list item, else None."""
    m = re.match(r'([%s])\s+(.*)' % re.escape(BULLETS), text)
    if m or (text[:1] and '\uf000' <= text[0] <= '\uf0ff'):
        return ('bullet', text[0], (m.group(2) if m else text[1:]).strip())
    m = re.match(r'(\d{1,3}[.)])\s+(.*)', text)
    if m:
        return ('number', m.group(1), m.group(2))
    return None


def escape(text):
    text = text.replace('\\', '\\\\')
    return re.sub(r'([*_`<>|])', r'\\\1', text)


def inline(runs):
    """Markdown of styled runs: **bold**, *italic*, ***both***; marks kept outside the spaces."""
    parts = []
    for bold, italic, text in runs:
        if parts and re.search(WORD_PART + '$', parts[-1][2]):   # a style that changes inside a word: the left wins
            m = re.match(WORD_PART, text)
            if m:
                parts[-1][2] += m.group(0)
                text = text[m.end():]
        if not text:
            continue
        if parts and parts[-1][0] == bold and parts[-1][1] == italic:
            parts[-1][2] += text
        else:
            parts.append([bold, italic, text])
    out = ''
    for bold, italic, text in parts:
        mark = ('**' if bold else '') + ('*' if italic else '')
        core = escape(text.strip())
        if not core:
            out += text
            continue
        lead, trail = text[:len(text) - len(text.lstrip())], text[len(text.rstrip()):]
        head, mid, tail = re.fullmatch(r'((?:\\[*_])*)(.*?)((?:\\[*_])*)', core, re.S).groups()
        if not mark or not re.search(r'\w', mid):
            out += lead + core + trail                 # a mark around punctuation alone reads as syntax
        else:                                          # footnote stars stay outside the marks: **text**\*
            out += lead + head + mark + mid + mark[::-1] + tail + trail
    return re.sub(r' {2,}', ' ', out).strip()


def join_runs(lines):
    """The runs of the lines of one paragraph, lines joined with a space or across a line-end hyphen."""
    runs = []
    for ln in lines:
        lr = [list(r) for r in ln['runs']]
        while lr and not lr[0][2].strip():
            lr.pop(0)
        if lr:
            lr[0][2] = lr[0][2].lstrip()
        if runs:
            last = runs[-1][2].rstrip()
            if re.search(r'\w-$', last) and lr and lr[0][2][:1].islower():
                runs[-1][2] = last if keeps_hyphen(last, lr[0][2]) else last[:-1]
            else:
                runs[-1][2] = last + ' '
        runs += lr
    return [tuple(r) for r in runs]


def blocks_of(lines, body, heading_sizes, right_edge, pitch):
    """Group the lines of one page (outside tables) into blocks: heading, para, item."""
    blocks = []
    for ln in lines:
        prev = blocks[-1] if blocks else None
        size = round(ln['size'] * 2) / 2
        is_heading = size in heading_sizes
        found = None if is_heading else marker(ln['text'])
        if prev:
            last = prev['lines'][-1]
            step = ln['top'] - last['top']
            same_size = abs(ln['size'] - last['size']) < 0.6
            usual = pitch.get(round(last['size'] * 2) / 2)
            normal = step <= (usual * 1.25 + 1 if usual else max(last['size'], ln['size']) * 1.6)
            short = last['right'] < right_edge - max(40, 0.15 * right_edge)
            short_end = short and (re.search(r'[.:;!?]$', last['text'])     # a paragraph ends; a short numbered line
                                   or (len(prev['lines']) == 1 and SECTION.match(last['text'])))   # is a heading
            short_end = short_end or re.search(r'\.{4,}\s*\d+$', last['text'])    # a contents line with its page
            if prev['kind'] == 'heading' and is_heading and same_size and normal and prev['size'] == size:
                prev['lines'].append(ln)
                continue
            hangs = abs(ln['left'] - prev['cont']) < 4 + (40 if len(prev['lines']) == 1 and prev['kind'] == 'para' else 0)
            under = prev['kind'] == 'item' and (abs(ln['left'] - prev['lines'][0]['left']) < 4 or (
                not short and ln['left'] < prev['lines'][0]['left']))    # a full line of an item wraps to the margin
            section = ln['bold'] and SECTION.match(ln['text'])    # a bold line with a section number starts a block
            section = section or (all(x['bold'] for x in prev['lines']) and not ln['bold'])  # text after a bold block
            if not is_heading and prev['kind'] != 'heading' and not found and not section and same_size and normal \
                    and not short_end and (hangs or under):
                prev['lines'].append(ln)
                prev['cont'] = ln['left']
                continue
        kind = 'heading' if is_heading else 'item' if found else 'para'
        block = {'kind': kind, 'lines': [ln], 'size': size, 'top': ln['top'], 'cont': ln['left'], 'marker': found}
        if found:
            # the item text starts after the marker: continuation lines hang there
            rest_left = ln['left'] + (ln['right'] - ln['left']) * (1 - len(found[2]) / max(1, len(ln['text'])))
            block['cont'] = rest_left
            mrun = []
            skip = len(ln['text']) - len(ln['text'].lstrip()) + len(found[1])
            for b, i, t in ln['runs']:
                if skip > 0:
                    cut = min(skip, len(t))
                    t, skip = t[cut:], skip - cut
                mrun.append((b, i, t))
            block['lines'] = [dict(ln, runs=mrun)]
        blocks.append(block)
    for b in blocks:                                   # a bold paragraph that starts with a section number
        text = ' '.join(ln['text'] for ln in b['lines'])
        m = SECTION.match(text)
        if b['kind'] in ('para', 'item') and m and all(ln['bold'] for ln in b['lines']) and len(text) <= 400:
            b['kind'] = 'heading'
            b['depth'] = m.group(1).count('.') + 1 if m.group(1) else 1
            if b.get('marker'):                        # the number is part of the heading
                b['lines'][0] = dict(b['lines'][0], runs=[(True, False, b['lines'][0]['text'])])
    return blocks


def write_block(b, levels):
    runs = join_runs(b['lines'])
    if b['kind'] == 'heading':
        text = ' '.join(''.join(t for _, _, t in runs).split())
        level = len(levels) + b['depth'] if 'depth' in b else levels.get(b['size'], 1)
        return '#' * min(6, level) + ' ' + escape(text)
    text = inline(runs)
    if b['kind'] == 'item':
        kind, mark, _ = b['marker']
        if kind == 'bullet':
            return '- ' + text
        if mark.endswith('.'):
            return mark + ' ' + text
        return mark[:-1] + '\\) ' + text
    if re.match(r'\d+[.)]\s', text):
        text = re.sub(r'^(\d+)([.)])', r'\1\\\2', text)
    elif re.match(r'([#>+-]|\d+\.)(\s|$)', text):
        text = '\\' + text
    return text


def in_table(f, tables):
    xc, yc = (f['left'] + f['right']) / 2, (f['top'] + f['bottom']) / 2
    return any(t['box'][0] - 1 < xc < t['box'][2] + 1 and t['box'][1] - 1 < yc < t['box'][3] + 1 for t in tables)


def table_md(rows):
    width = max(len(r) for r in rows)
    out = ['| ' + ' | '.join(escape(c) for c in (r + [''] * (width - len(r)))) + ' |' for r in rows]
    out.insert(1, '|' + ' --- |' * width)
    return '\n'.join(out)


def main():
    ap = argparse.ArgumentParser(description='Write a first Markdown draft of a PDF from its text layer.')
    ap.add_argument('pdf')
    ap.add_argument('out')
    ap.add_argument('--pages', help='PDF page or page range, e.g. 3 or 1-10')
    args = ap.parse_args()
    missing = [t for t in ('pdftohtml', 'pdftotext', 'pdftocairo', 'pdfinfo') if shutil.which(t) is None]
    if missing:
        print(INSTALL_HINT, file=sys.stderr)
        sys.exit(2)
    info = run(['pdfinfo', args.pdf])
    total = int(re.search(r'^Pages:\s+(\d+)', info, re.M).group(1))
    first, last = 1, total
    if args.pages:
        m = re.fullmatch(r'(\d+)(?:-(\d+))?', args.pages)
        if not m:
            ap.error('--pages needs a page or a range like 1-10')
        first, last = int(m.group(1)), min(total, int(m.group(2) or m.group(1)))

    xml = xml_pages(args.pdf, 1, total)       # the whole PDF sets the fonts and the furniture, also for a page range
    words = page_words(args.pdf, first, last)
    for _, _, frags in xml:
        VOCAB.update(re.sub(r'^\W+|\W+$', '', t) for f in frags for t in ''.join(r[2] for r in f['runs']).split())
    all_lines = [lines_of(frags) for _, _, frags in xml]
    shapes = furniture(all_lines) if total > 1 else set()
    warnings, pages = [], []
    for k, (w, h, frags) in enumerate(xml):
        no = 1 + k
        if not first <= no <= last:
            pages.append({'no': no, 'width': w, 'lines': all_lines[k], 'tables': [], 'out': False})
            continue
        boxes = [ln for ln in furniture_lines(all_lines[k], shapes)]
        page_w = [wd for wd in (words[no - first] if no - first < len(words) else [])
                  if not any(b['left'] - 1 < (wd[0] + wd[2]) / 2 < b['right'] + 1 and b['top'] - 1 < (wd[1] + wd[3]) / 2
                             < b['bottom'] + 1 for b in boxes)]   # page numbers and running lines stay out of tables
        tables = []
        for hs, vs in rule_groups(*page_rules(args.pdf, no)):
            t = build_table(hs, vs, page_w)
            if t:
                tables.append(t)
        placed = {id(w) for t in tables for w in t['used']}
        for t in tables:                               # words in a table's box but in no cell are kept after it
            b = t['box']
            t['stray'] = [w for w in page_w if id(w) not in placed
                          and b[0] - 2 < (w[0] + w[2]) / 2 < b[2] + 2 and b[1] - 2 < (w[1] + w[3]) / 2 < b[3] + 2]
            placed.update(id(w) for w in t['stray'])
        lines = lines_of([f for f in frags if not in_table(f, tables)], words[no - first] if no - first < len(words) else [])
        if not frags:
            warnings.append(f'page {no}: no text layer; read it by OCR')
        pages.append({'no': no, 'width': w, 'lines': lines, 'tables': tables, 'out': True})

    sizes = collections.Counter()
    for p in pages:
        for ln in p['lines']:
            sizes[round(ln['size'] * 2) / 2] += len(ln['text'])
    body = sizes.most_common(1)[0][0] if sizes else 10.0
    heading_sizes = sorted((s for s in sizes if s >= body * HEADING_RATIO), reverse=True)
    levels = {s: i + 1 for i, s in enumerate(heading_sizes)}
    steps = collections.defaultdict(collections.Counter)
    for p in pages:
        for a, b in zip(p['lines'], p['lines'][1:]):
            if abs(a['size'] - b['size']) < 0.6 and a['size'] * 0.9 < b['top'] - a['top'] < a['size'] * 2.5:
                steps[round(a['size'] * 2) / 2][round(b['top'] - a['top'])] += 1
    pitch = {s: c.most_common(1)[0][0] for s, c in steps.items()}
    dropped = collections.Counter()

    out, prev_table, counts = [], None, collections.Counter()
    for p in pages:
        if not p['out']:
            continue
        skip = {id(ln) for ln in furniture_lines(p['lines'], shapes)}
        dropped.update(shape(ln['text']) for ln in p['lines'] if id(ln) in skip)
        lines = [ln for ln in p['lines'] if id(ln) not in skip]
        wide = gapped(lines)
        if len(wide) >= 3 and len(wide) >= len(lines) / 2:
            warnings.append(f'page {p["no"]}: text set in columns, written in reading order without headings or lists;'
                            ' check it against the page')
            text = run(['pdftotext', '-f', str(p['no']), '-l', str(p['no']), args.pdf, '-'])
            paras = [' '.join(par.split()) for par in re.split(r'\n\s*\n', text)]
            items = [('para', 0, par) for par in paras if par and shape(par) not in shapes]
        else:
            if len(wide) >= 2:
                warnings.append(f'page {p["no"]}: {len(wide)} line(s) with wide gaps, maybe a table without rules or a'
                                ' form, written as paragraphs; check them against the page')
            right_edge = max((ln['right'] for ln in lines), default=p['width'])
            items = [('block', b['top'], b) for b in blocks_of(lines, body, levels, right_edge, pitch)]
        items += [('table', t['top'], t) for t in p['tables']]
        items.sort(key=lambda it: it[1])
        if p['no'] == first > 1 and items and items[0][0] == 'table':
            warnings.append(f'page {first}: starts with a table; when it goes on from page {first - 1}, join it to that'
                            ' table and leave out its repeated header row')
        for n, (kind, _, item) in enumerate(items):
            if kind == 'table':
                rows = item['rows']
                if n == 0 and prev_table and len(prev_table['xs']) == len(item['xs']) and \
                        all(abs(a - b) < 3 for a, b in zip(prev_table['xs'], item['xs'])):
                    if rows[0] == prev_table['rows'][0]:
                        rows = rows[1:]
                    elif rows:                         # a cell cut by the page break goes on in the cell above it
                        rows = [list(r) for r in rows]
                        for c in item['open_top']:
                            above = next((r for r in reversed(prev_table['rows']) if c < len(r) and r[c]), None)
                            if rows[0][c] and above:
                                joint = above[c].endswith('-') and rows[0][c][:1].islower()
                                above[c] = (above[c][:-1] if joint and not keeps_hyphen(above[c], rows[0][c]) else
                                            above[c] + ('' if joint else ' ')) + rows[0][c]
                                rows[0][c] = ''
                        if not any(rows[0]):
                            rows = rows[1:]
                    if rows and rows[0][0] == '':
                        warnings.append(f'page {p["no"]}: the table goes on from the page before and its first row'
                                        ' has an empty first cell; it may finish the last row of that page')
                    prev_table['rows'] += rows
                    out[-1] = table_md(prev_table['rows'])
                    counts['table rows'] += len(rows)
                else:
                    prev_table = {'xs': item['xs'], 'rows': list(rows)}
                    out.append(table_md(rows))
                    counts['tables'] += 1
                    counts['table rows'] += len(rows)
                if item['stray']:
                    warnings.append(f'page {p["no"]}: {len(item["stray"])} word(s) in a table fit no cell; they are'
                                    ' written as a paragraph after the table: put them in their cells')
                    out.append(escape(cell_text(item['stray'])))
                    prev_table = None
                continue
            prev_table = None
            if kind == 'para':
                out.append(escape(item))
                counts['paragraphs'] += 1
            else:
                out.append(write_block(item, levels))
                counts['headings' if item['kind'] == 'heading' else 'list items' if item['kind'] == 'item' else 'paragraphs'] += 1

    md = '\n\n'.join(out) + '\n'
    md = re.sub(r'(?m)^(- .*|\d+\. .*)\n\n(?=- |\d+\. )', r'\1\n', md)   # list items without blank lines between
    with open(args.out, 'w', encoding='utf-8') as f:
        f.write(md)
    print(f'PAGES: {first}-{last} of {total}')
    print(f"WROTE: {args.out}: {counts['headings']} heading(s), {counts['paragraphs']} paragraph(s), "
          f"{counts['list items']} list item(s), {counts['tables']} table(s) with {counts['table rows']} row(s)")
    print(f'FONTS: body {body:g} pt; heading sizes ' + (', '.join(f'{s:g} pt = {"#" * levels[s]}' for s in heading_sizes) or 'none'))
    if dropped:
        print('FURNITURE left out: ' + ', '.join(f'"{s[:40]}" x{c}' for s, c in dropped.most_common(6)))
    print(f'WARNINGS: {len(warnings)}')
    for w in warnings:
        print('  ' + w)
    sys.exit(0)


if __name__ == '__main__':
    main()
