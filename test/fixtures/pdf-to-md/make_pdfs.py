#!/usr/bin/env python3
"""Write the test PDFs of ph-pdf-to-md into a folder: python3 make_pdfs.py OUT_DIR

The PDFs are drawn here with the standard Courier fonts (every character is 0.6 of the font
size wide), so their text, fonts and table rules are known exactly and no PDF has to be kept
in the repository. Each run writes the same bytes.

report.pdf    three A4 pages: a running header and page numbers, headings of three sizes,
              paragraphs with bold and italic words and one word split by a hyphen, bullets,
              a numbered list, a ruled table with a merged cell (filled thin rectangles) and
              a ruled table that goes on over a page break with its header row repeated
              (stroked lines).
columns.pdf   one page whose text is set in two columns.
"""
import os
import sys

W, H = 595, 842
LEFT, RIGHT, TOP, BOTTOM = 72, 523, 80, 772
FONTS = {'R': 'Courier', 'B': 'Courier-Bold', 'I': 'Courier-Oblique', 'BI': 'Courier-BoldOblique'}
FONT_KEY = {'R': 'F1', 'B': 'F2', 'I': 'F3', 'BI': 'F4'}


def width(text, size):
    return len(text) * 0.6 * size


def pdf_string(text):
    raw = text.encode('cp1252')
    return '(' + ''.join('\\' + chr(b) if chr(b) in '()\\' else chr(b) if 32 <= b < 127 else '\\%03o' % b for b in raw) + ')'


class Doc:
    def __init__(self, header=None):
        self.pages = []
        self.header = header
        self.new_page()

    def new_page(self):
        self.ops = []
        self.pages.append(self.ops)
        self.y = TOP

    def text(self, x, y, s, font='R', size=10):
        self.ops.append('BT /%s %g Tf 1 0 0 1 %.2f %.2f Tm %s Tj ET' % (FONT_KEY[font], size, x, H - y, pdf_string(s)))

    def fill_rule(self, x0, y0, x1, y1):
        """A thin filled rectangle from (x0, y0) to (x1, y1), top-left coordinates."""
        t = 0.5
        if y0 == y1:
            self.ops.append('%.2f %.2f %.2f %.2f re f' % (x0, H - y0 - t / 2, x1 - x0, t))
        else:
            self.ops.append('%.2f %.2f %.2f %.2f re f' % (x0 - t / 2, H - y1, t, y1 - y0))

    def stroke_rule(self, x0, y0, x1, y1):
        self.ops.append('0.6 w %.2f %.2f m %.2f %.2f l S' % (x0, H - y0, x1, H - y1))

    def room(self, need):
        if self.y + need > BOTTOM:
            self.new_page()

    # flowing text

    def lines(self, runs, size, avail):
        """Break runs [(font, text)] into lines of [(font, text)] that fit `avail` points; '\\n' forces a break."""
        out, line, used = [], [], 0.0
        for font, text in runs:
            for part in text.replace('\n', ' \n ').split(' '):
                if part == '\n':
                    out.append(line)
                    line, used = [], 0.0
                    continue
                if not part:
                    continue
                need = width(part, size) + (width(' ', size) if line else 0)
                if line and used + need > avail:
                    out.append(line)
                    line, used = [], 0.0
                    need = width(part, size)
                line.append((font, part))
                used += need
        if line:
            out.append(line)
        return out

    def draw_line(self, x, y, line, size):
        for font, word in line:
            self.text(x, y, word, font, size)
            x += width(word + ' ', size)

    def paragraph(self, runs, size=10, indent=0, marker=None, gap=6):
        lh = size * 1.4
        lines = self.lines(runs, size, RIGHT - LEFT - indent)
        for i, line in enumerate(lines):
            self.room(lh)
            self.y += lh
            if i == 0 and marker:
                self.text(LEFT + indent - width(marker + ' ', size), self.y, marker, 'R', size)
            self.draw_line(LEFT + indent, self.y, line, size)
        self.y += gap

    def heading(self, text, size):
        self.room(size * 3)
        self.y += size * 0.8
        self.paragraph([('B', text)], size=size, gap=size * 0.4)

    # tables

    def table(self, rows, widths, merged=(), stroke=False, size=9):
        """rows: lists of cell texts, the first row is the header (bold, repeated after a page break);
        a cell given as None is covered by the cell above it. merged: (row, col) cells spanning down
        over the None cells under them."""
        rule = self.stroke_rule if stroke else self.fill_rule
        pad, lh = 4, size * 1.3
        xs = [LEFT]
        for w in widths:
            xs.append(xs[-1] + w)
        cell_lines = [[self.lines([('B' if r == 0 else 'R', c)], size, widths[k] - 2 * pad) if c else []
                       for k, c in enumerate(row)] for r, row in enumerate(rows)]
        heights = [max(1, max((len(l) for k, l in enumerate(cl) if (r, k) not in merged), default=1)) * lh + 2 * pad
                   for r, cl in enumerate(cell_lines)]

        def draw_row(r, top):
            bottom = top + heights[r]
            for k, lines in enumerate(cell_lines[r]):
                y = top + pad
                for line in lines:
                    y += lh
                    self.draw_line(xs[k] + pad, y - lh * 0.25, line, size)
            for k in range(len(xs)):
                rule(xs[k], top, xs[k], bottom)
            for k in range(len(widths)):
                below = r + 1 < len(rows) and rows[r + 1][k] is None
                if not below:
                    rule(xs[k], bottom, xs[k + 1], bottom)
            return bottom

        self.room(heights[0] + heights[1])
        self.y += 4
        rule(xs[0], self.y, xs[-1], self.y)
        self.y = draw_row(0, self.y)
        for r in range(1, len(rows)):
            if self.y + heights[r] > BOTTOM:
                self.new_page()
                rule(xs[0], self.y, xs[-1], self.y)
                self.y = draw_row(0, self.y)
            self.y = draw_row(r, self.y)
        self.y += 10

    # output

    def save(self, path):
        objs = ['<< /Type /Catalog /Pages 2 0 R >>', None]
        font_ids = {}
        for key, name in FONTS.items():
            objs.append('<< /Type /Font /Subtype /Type1 /BaseFont /%s /Encoding /WinAnsiEncoding >>' % name)
            font_ids[FONT_KEY[key]] = len(objs)
        resources = '<< /Font << %s >> >>' % ' '.join('/%s %d 0 R' % (k, v) for k, v in sorted(font_ids.items()))
        kids = []
        for n, ops in enumerate(self.pages, 1):
            extra = []
            if self.header:
                extra.append('BT /F1 8 Tf 1 0 0 1 %.2f %.2f Tm %s Tj ET' % (LEFT, H - 48, pdf_string(self.header)))
                extra.append('BT /F1 8 Tf 1 0 0 1 %.2f %.2f Tm %s Tj ET' % ((W - width(str(n), 8)) / 2, 40, pdf_string(str(n))))
            stream = '\n'.join(extra + ops).encode('latin-1')
            objs.append(b'<< /Length %d >>\nstream\n' % len(stream) + stream + b'\nendstream')
            objs.append('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 %d %d] /Resources %s /Contents %d 0 R >>'
                        % (W, H, resources, len(objs)))
            kids.append(len(objs))
        objs[1] = '<< /Type /Pages /Kids [%s] /Count %d >>' % (' '.join('%d 0 R' % k for k in kids), len(kids))
        out = bytearray(b'%PDF-1.4\n')
        offsets = []
        for i, obj in enumerate(objs, 1):
            offsets.append(len(out))
            body = obj if isinstance(obj, bytes) else obj.encode('latin-1')
            out += b'%d 0 obj\n' % i + body + b'\nendobj\n'
        xref = len(out)
        out += b'xref\n0 %d\n%010d 65535 f \n' % (len(objs) + 1, 0)
        for off in offsets:
            out += b'%010d 00000 n \n' % off
        out += b'trailer\n<< /Size %d /Root 1 0 R >>\nstartxref\n%d\n%%%%EOF\n' % (len(objs) + 1, xref)
        with open(path, 'wb') as f:
            f.write(out)


def report(path):
    d = Doc(header='Annual report, Riverside Library')
    d.heading('Riverside Library Annual Report', 18)
    d.paragraph([('R', 'This report describes the'), ('B', 'work of the library'), ('R', 'in the past year and the'),
                 ('I', 'plans for the next one.'), ('R', 'It is written for the board, the staff and the readers who'
                  ' want to know how their library is run.')])
    d.heading('1. Overview', 14)
    d.paragraph([('R', 'The library has three branches and a mobile service. All branches kept their opening hours, and'
                  ' the new reading room opened in spring after a long period of assess-\nment and planning.')])
    d.paragraph([('R', 'The main results of the year:')])
    for item in ('More readers visited the branches than in any year before.',
                 'The mobile service reached eleven villages, two more than planned, and it now stops at every school'
                 ' on its route once a week.',
                 'The catalogue moved to a new system.'):
        d.paragraph([('R', item)], indent=18, marker='•', gap=2)
    d.y += 4
    d.heading('1.1 Visitors', 12)
    d.paragraph([('R', 'The table below shows the visitors of each branch.')])
    d.table([['Branch', 'Visitors', 'Notes'],
             ['North', '1200', 'Open on Sundays'],
             ['South', '950', 'Closed in August for repairs of the roof and the heating'],
             ['East', '800', 'Main hall'],
             [None, '300', 'Reading room']], [110, 90, 251], merged={(3, 0)})
    d.heading('2. Collections', 14)
    d.paragraph([('R', 'The collections grew by four thousand items. Most of them are books for children and young'
                  ' readers; the rest are journals, maps and recordings.')])
    d.heading('2.1 Loans by month', 12)
    d.paragraph([('R', 'Loans of books and journals in each month of the year:')])
    months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October',
              'November', 'December']
    rows = [['Month', 'Books', 'Journals']]
    for i, m in enumerate(months * 3):
        rows.append(['%s, week group %d' % (m, i // 12 + 1), str(400 + 17 * i), str(90 + 5 * i)])
    d.table(rows, [200, 120, 131], stroke=True)
    d.heading('3. Plans', 14)
    for n, item in enumerate(('Open the north branch on Saturdays.',
                              'Add a second vehicle to the mobile service.'), 1):
        d.paragraph([('R', item)], indent=18, marker='%d.' % n, gap=2)
    d.y += 4
    d.paragraph([('I', 'The board approved these plans at its last meeting.')])
    d.save(path)


def columns(path):
    d = Doc()
    d.heading('Notes from the Reading Club', 14)
    left = ('The club met every second Tuesday. Members chose one novel each month and read it at home'
            ' before the meeting. The talks were short and friendly.')
    right = ('Next year the club will also read poetry. New members are welcome; they only need a library'
             ' card and an interest in books.')
    top = d.y
    half = (RIGHT - LEFT - 20) / 2
    for x, text in ((LEFT, left), (LEFT + half + 20, right)):
        y = top
        for line in d.lines([('R', text)], 10, half):
            y += 14
            d.draw_line(x, y, line, 10)
    d.save(path)


def main():
    if len(sys.argv) != 2:
        print('usage: make_pdfs.py OUT_DIR', file=sys.stderr)
        sys.exit(2)
    out = sys.argv[1]
    os.makedirs(out, exist_ok=True)
    report(os.path.join(out, 'report.pdf'))
    columns(os.path.join(out, 'columns.pdf'))


if __name__ == '__main__':
    main()
