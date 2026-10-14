#!/usr/bin/env python3
"""Check that a Markdown file holds every cell of an Excel .xlsx workbook, in its sheet, row and column.

usage: verify_excel_md.py FILE.xlsx FILE.md [--sheet NAME ...] [--no-libreoffice]

Reads the workbook on its own, without the converter's code, and compares it with the Markdown written by the
conventions of excel_to_md.py: the sheets and their order, every paragraph and table row in order, every cell's
text, links, and for numbers and dates that the Markdown text matches the stored value (percent, scaling,
decimals, the date's year, month, day and time). LibreOffice reads the displayed numbers and dates a second time;
its English notation is brought to the neutral one (no thousands separator, yyyy-mm-dd for the short date, any
form of a month's name) for number and date cells only. Formulas that change by themselves (TODAY, NOW, RAND...)
are compared with their stored value only: LibreOffice recalculates them. So are the system date and time formats
and dates before 1 March 1900, which LibreOffice counts without Excel's 29 February 1900.

Output: SHEETS, MISSING, EXTRA, CELLS, VALUES, DISPLAY and LINKS list the differences with the Markdown line;
RESULT: PASS or FAIL. Exit code: 0 PASS, 1 FAIL, 2 the files could not be read.
"""
import argparse
import csv
import datetime as dt
import difflib
import math
import os
import posixpath
import re
import shutil
import subprocess
import sys
import tempfile
import zipfile
import xml.etree.ElementTree as ET
from decimal import Decimal, ROUND_HALF_UP
from pathlib import Path

NS = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'
RNS = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'
DML = 'http://schemas.openxmlformats.org/drawingml/2006/main'
STRICT = {b'http://purl.oclc.org/ooxml/spreadsheetml/main': NS.encode(),
          b'http://purl.oclc.org/ooxml/officeDocument/relationships': RNS.encode(),
          b'http://purl.oclc.org/ooxml/drawingml/main': DML.encode()}
EAST_ASIAN = set(range(27, 37)) | set(range(50, 59))
DATE_IDS = set(range(14, 23)) | {45, 46, 47} | EAST_ASIAN
BUILTIN_CODES = {1: '0', 2: '0.00', 3: '#,##0', 4: '#,##0.00', 9: '0%', 10: '0.00%', 11: '0.00E+00', 12: '# ?/?', 13: '# ??/??',
                 15: 'd-mmm-yy', 16: 'd-mmm', 17: 'mmm-yy', 18: 'h:mm AM/PM', 19: 'h:mm:ss AM/PM', 20: 'h:mm', 21: 'h:mm:ss',
                 37: '#,##0 ;(#,##0)', 38: '#,##0 ;(#,##0)', 39: '#,##0.00;(#,##0.00)', 40: '#,##0.00;(#,##0.00)',
                 41: '_(* #,##0_);_(* \\(#,##0\\);_(* "-"_);_(@_)', 43: '_(* #,##0.00_);_(* \\(#,##0.00\\);_(* "-"??_);_(@_)',
                 45: 'mm:ss', 46: '[h]:mm:ss', 47: 'mm:ss.0', 48: '##0.0E+0', 49: '@'}
BUILTIN_CODES.update({14: 'yyyy-mm-dd', 22: 'yyyy-mm-dd h:mm', **{k: 'yyyy-mm-dd' for k in DATE_IDS if k > 22 and k not in (45, 46, 47)}})
VOLATILE = re.compile(r'\b(TODAY|NOW|RAND|RANDBETWEEN|RANDARRAY|OFFSET|INDIRECT|CELL|INFO)\s*\(', re.I)
MONTHS = [
    'january february march april may june july august september october november december',
    'jan feb mar apr may jun jul aug sep oct nov dec',
    '\u044f\u043d\u0432\u0430\u0440\u044c \u0444\u0435\u0432\u0440\u0430\u043b\u044c \u043c\u0430\u0440\u0442 \u0430\u043f\u0440\u0435\u043b\u044c \u043c\u0430\u0439 \u0438\u044e\u043d\u044c '
    '\u0438\u044e\u043b\u044c \u0430\u0432\u0433\u0443\u0441\u0442 \u0441\u0435\u043d\u0442\u044f\u0431\u0440\u044c \u043e\u043a\u0442\u044f\u0431\u0440\u044c \u043d\u043e\u044f\u0431\u0440\u044c \u0434\u0435\u043a\u0430\u0431\u0440\u044c',
    '\u044f\u043d\u0432\u0430\u0440\u044f \u0444\u0435\u0432\u0440\u0430\u043b\u044f \u043c\u0430\u0440\u0442\u0430 \u0430\u043f\u0440\u0435\u043b\u044f \u043c\u0430\u044f \u0438\u044e\u043d\u044f '
    '\u0438\u044e\u043b\u044f \u0430\u0432\u0433\u0443\u0441\u0442\u0430 \u0441\u0435\u043d\u0442\u044f\u0431\u0440\u044f \u043e\u043a\u0442\u044f\u0431\u0440\u044f \u043d\u043e\u044f\u0431\u0440\u044f \u0434\u0435\u043a\u0430\u0431\u0440\u044f',
    '\u044f\u043d\u0432. \u0444\u0435\u0432\u0440. \u043c\u0430\u0440\u0442 \u0430\u043f\u0440. \u043c\u0430\u0439 \u0438\u044e\u043d\u044c \u0438\u044e\u043b\u044c \u0430\u0432\u0433. \u0441\u0435\u043d\u0442. \u043e\u043a\u0442. \u043d\u043e\u044f\u0431. \u0434\u0435\u043a.',
    '\u044f\u043d\u0432 \u0444\u0435\u0432 \u043c\u0430\u0440 \u0430\u043f\u0440 \u043c\u0430\u044f \u0438\u044e\u043d \u0438\u044e\u043b \u0430\u0432\u0433 \u0441\u0435\u043d \u043e\u043a\u0442 \u043d\u043e\u044f \u0434\u0435\u043a',
    'yanvar fevral mart aprel may iyun iyul avgust sentabr oktabr noyabr dekabr',
    'yan fev mar apr may iyn iyl avg sen okt noy dek',
    '\u044f\u043d\u0432\u0430\u0440 \u0444\u0435\u0432\u0440\u0430\u043b \u043c\u0430\u0440\u0442 \u0430\u043f\u0440\u0435\u043b \u043c\u0430\u0439 \u0438\u044e\u043d \u0438\u044e\u043b '
    '\u0430\u0432\u0433\u0443\u0441\u0442 \u0441\u0435\u043d\u0442\u044f\u0431\u0440 \u043e\u043a\u0442\u044f\u0431\u0440 \u043d\u043e\u044f\u0431\u0440 \u0434\u0435\u043a\u0430\u0431\u0440',
]
DAYS = [
    'sunday monday tuesday wednesday thursday friday saturday', 'sun mon tue wed thu fri sat',
    '\u0432\u043e\u0441\u043a\u0440\u0435\u0441\u0435\u043d\u044c\u0435 \u043f\u043e\u043d\u0435\u0434\u0435\u043b\u044c\u043d\u0438\u043a \u0432\u0442\u043e\u0440\u043d\u0438\u043a '
    '\u0441\u0440\u0435\u0434\u0430 \u0447\u0435\u0442\u0432\u0435\u0440\u0433 \u043f\u044f\u0442\u043d\u0438\u0446\u0430 \u0441\u0443\u0431\u0431\u043e\u0442\u0430',
    '\u0432\u0441 \u043f\u043d \u0432\u0442 \u0441\u0440 \u0447\u0442 \u043f\u0442 \u0441\u0431',
    'yakshanba dushanba seshanba chorshanba payshanba juma shanba', 'yak dush sesh chor pay jum shan',
    '\u044f\u043a\u0448\u0430\u043d\u0431\u0430 \u0434\u0443\u0448\u0430\u043d\u0431\u0430 \u0441\u0435\u0448\u0430\u043d\u0431\u0430 \u0447\u043e\u0440\u0448\u0430\u043d\u0431\u0430 '
    '\u043f\u0430\u0439\u0448\u0430\u043d\u0431\u0430 \u0436\u0443\u043c\u0430 \u0448\u0430\u043d\u0431\u0430',
    '\u044f\u043a\u0448 \u0434\u0443\u0448 \u0441\u0435\u0448 \u0447\u043e\u0440 \u043f\u0430\u0439 \u0436\u0443\u043c \u0448\u0430\u043d',
]
MONTH_NAMES = [[names.split()[k] for names in MONTHS] for k in range(12)]
DAY_NAMES = [[names.split()[k] for names in DAYS] for k in range(7)]


def tag(name, ns=NS):
    return f'{{{ns}}}{name}'


def letters(n):
    s = ''
    while n:
        n, r = divmod(n - 1, 26)
        s = chr(65 + r) + s
    return s


def position(ref):
    m = re.match(r'\$?([A-Za-z]{1,3})\$?(\d+)', ref or '')
    if not m:
        return None
    c = 0
    for ch in m.group(1).upper():
        c = c * 26 + ord(ch) - 64
    return int(m.group(2)), c


def squeeze(s):
    return re.sub(r'\s+', ' ', s.replace('\u00a0', ' ')).strip()


# ---------------------------------------------------------------- the workbook, read on its own

class Book:
    def __init__(self, path):
        self.z = zipfile.ZipFile(path)
        self.names = set(self.z.namelist())
        main = next((t for t, typ in self.rels('').values() if typ == 'officeDocument'), 'xl/workbook.xml')
        wb = self.xml(main)
        pr = wb.find(tag('workbookPr'))
        self.date1904 = pr is not None and pr.get('date1904', '0').lower() in ('1', 'true')
        rels = self.rels(main)
        self.sheets = [{'name': s.get('name'), 'state': s.get('state', 'visible'), 'target': rels.get(s.get(tag('id', RNS)), ('', ''))[0],
                        'type': rels.get(s.get(tag('id', RNS)), ('', ''))[1]} for s in wb.iter(tag('sheet'))]
        self.strings, self.styles = [], []
        for target, typ in rels.values():
            if typ == 'sharedStrings' and target in self.names:
                self.strings = [self.si(si) for si in self.xml(target).iter(tag('si'))]
            if typ == 'styles' and target in self.names:
                st = self.xml(target)
                codes = {int(n.get('numFmtId')): n.get('formatCode', '') for n in st.iter(tag('numFmt'))}
                xfs = st.find(tag('cellXfs'))
                for xf in (xfs if xfs is not None else []):
                    fid = int(xf.get('numFmtId', 0))
                    self.styles.append((fid, codes.get(fid, BUILTIN_CODES.get(fid, 'General'))))

    def xml(self, part):
        data = self.z.read(part)
        for a, b in STRICT.items():
            data = data.replace(a, b)
        return ET.fromstring(data)

    def rels(self, part):
        folder, name = posixpath.split(part)
        path = posixpath.join(folder, '_rels', name + '.rels')
        out = {}
        if path in self.names:
            for r in self.xml(path):
                target = r.get('Target', '')
                if r.get('TargetMode') != 'External':
                    target = target.lstrip('/') if target.startswith('/') else posixpath.normpath(posixpath.join(folder, target))
                out[r.get('Id')] = (target, r.get('Type', '').rsplit('/', 1)[-1])
        return out

    @staticmethod
    def si(el):
        text = ''.join((t.text or '') for t in el.iter(tag('t')) if not any(t in rph.iter() for rph in el.iter(tag('rPh'))))
        return re.sub(r'_x([0-9A-Fa-f]{4})_', lambda m: chr(int(m.group(1), 16)), text).replace('\r\n', '\n')

    def sheet(self, info):
        root = self.xml(info['target'])
        rels = self.rels(info['target'])
        cells, merges, links = {}, [], {}
        r = 0
        for row in root.iter(tag('row')):
            r = int(row.get('r', r + 1))
            c = 0
            for el in row.iter(tag('c')):
                pos = position(el.get('r'))
                c = pos[1] if pos else c + 1
                cells[(r, c)] = self.cell(el)
        for m in root.iter(tag('mergeCell')):
            a, _, b = (m.get('ref') or '').partition(':')
            pa, pb = position(a), position(b or a)
            if pa and pb:
                merges.append((pa, pb))
        for h in root.iter(tag('hyperlink')):
            a, _, b = (h.get('ref') or '').partition(':')
            pa, pb = position(a), position(b or a)
            target = rels.get(h.get(tag('id', RNS)))
            if pa and target:
                url = target[0] + ('#' + h.get('location') if h.get('location') else '')
                for rr in range(pa[0], pb[0] + 1):
                    for cc in range(pa[1], pb[1] + 1):
                        links[(rr, cc)] = url
        boxes = []
        for target, typ in rels.values():
            if typ == 'drawing' and target in self.names:
                for sp in self.xml(target).iter(tag('sp', 'http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing')):
                    text = '\n'.join(''.join(t.text or '' for t in p.iter(tag('t', DML))) for p in sp.iter(tag('p', DML))).strip()
                    if text:
                        boxes.append(text)
        return cells, merges, links, boxes

    def cell(self, el):
        t, s = el.get('t', 'n'), int(el.get('s', 0) or 0)
        f = el.find(tag('f'))
        formula = (f.text or '') if f is not None else None
        v = el.find(tag('v'))
        if t == 'inlineStr':
            is_ = el.find(tag('is'))
            return ('text', self.si(is_) if is_ is not None else '', s, formula)
        if v is None or v.text is None:
            return ('empty', None, s, formula)
        if t == 's':
            k = int(v.text)
            return ('text', self.strings[k] if k < len(self.strings) else '', s, formula)
        if t == 'str':
            return ('text', v.text, s, formula)
        if t == 'b':
            return ('bool', v.text.strip() in ('1', 'true'), s, formula)
        if t == 'e':
            return ('error', v.text, s, formula)
        if t == 'd':
            try:
                d = dt.datetime.fromisoformat(v.text.replace('Z', ''))
            except ValueError:
                return ('text', v.text, s, formula)
            base = dt.datetime(1904, 1, 1) if self.date1904 else dt.datetime(1899, 12, 30)
            return ('number', (d - base).total_seconds() / 86400, s, formula)
        try:
            return ('number', float(v.text), s, formula)
        except ValueError:
            return ('text', v.text, s, formula)

    def fmt(self, style):
        return self.styles[style] if style < len(self.styles) else (0, 'General')


# ---------------------------------------------------------------- format knowledge of the checker

def sections(code):
    out, cur, quoted, i = [], '', False, 0
    while i < len(code):
        ch = code[i]
        if ch == '"':
            quoted = not quoted
        if not quoted and ch in '\\_*' and i + 1 < len(code):
            cur += code[i:i + 2]
            i += 2
            continue
        if not quoted and ch == '[':
            j = code.find(']', i)
            j = len(code) - 1 if j < 0 else j
            cur += code[i:j + 1]
            i = j + 1
            continue
        if not quoted and ch == ';':
            out.append(cur)
            cur = ''
        else:
            cur += ch
        i += 1
    return out + [cur]


def scan(section):
    """('q', literal) | ('br', inside) | ('c', char), with escapes, padding and fill taken apart."""
    out, i = [], 0
    while i < len(section):
        ch = section[i]
        if ch == '"':
            j = section.find('"', i + 1)
            j = len(section) if j < 0 else j
            out.append(('q', section[i + 1:j]))
            i = j + 1
        elif ch == '\\' and i + 1 < len(section):
            out.append(('q', section[i + 1]))
            i += 2
        elif ch == '_' and i + 1 < len(section):
            out.append(('q', ' '))
            i += 2
        elif ch == '*' and i + 1 < len(section):
            i += 2
        elif ch == '[':
            j = section.find(']', i)
            j = len(section) - 1 if j < 0 else j
            out.append(('br', section[i + 1:j]))
            i = j + 1
        else:
            out.append(('c', ch))
            i += 1
    return out


def condition(v, br):
    m = re.match(r'^(<=|>=|<>|<|>|=)\s*(-?[\d.]+(?:[Ee][+-]?\d+)?)$', br)
    if not m:
        return None
    x = float(m.group(2))
    return {'<': v < x, '<=': v <= x, '>': v > x, '>=': v >= x, '=': v == x, '<>': v != x}[m.group(1)]


def choose(code, v):
    """(section text, value shown without its sign)."""
    secs = sections(code)
    conds = [next((b for k, b in scan(s) if k == 'br' and condition(0, b) is not None), None) for s in secs]
    if any(conds[:2]):
        for s, b in zip(secs[:2], conds[:2]):
            if b and condition(v, b):
                return s, b.startswith('<') and float(re.sub(r'^[<>=]+', '', b)) <= 0
        rest = [s for s, b in zip(secs, conds) if not b]
        return (rest[0] if rest else secs[-1]), False
    if len(secs) == 1 or v > 0 or (v == 0 and len(secs) < 3):
        return secs[0], False
    return (secs[1], True) if v < 0 else (secs[2], False)


def is_date_section(section):
    chars = ''.join(x for k, x in scan(section) if k == 'c').lower().replace('general', '')
    return bool(re.search(r'[ymdhs]', chars)) or any(k == 'br' and re.fullmatch(r'[hms]+', x.lower()) for k, x in scan(section)) \
        or any(k == 'br' and x.upper().startswith(('$-F800', '$-F400')) for k, x in scan(section))


def excel_date(serial, date1904):
    whole = math.floor(serial)
    if date1904:
        d = dt.date(1904, 1, 1) + dt.timedelta(days=whole)
        return (d.year, d.month, d.day), (whole + 5) % 7
    if whole == 0:
        return (1900, 1, 0), 6
    if whole == 60:
        return (1900, 2, 29), 3
    d = (dt.date(1899, 12, 31) if whole < 60 else dt.date(1899, 12, 30)) + dt.timedelta(days=whole)
    return (d.year, d.month, d.day), (whole + 6) % 7


def date_pattern(section, serial, date1904, fid):
    """A regular expression that the date text of this serial number must match."""
    toks = scan(section)
    if fid in (14, 22) or any(k == 'br' and x.upper().startswith('$-F800') for k, x in toks):
        toks = scan('yyyy-mm-dd h:mm' if fid == 22 else 'yyyy-mm-dd')
    elif any(k == 'br' and x.upper().startswith('$-F400') for k, x in toks):
        toks = scan('h:mm:ss')
    items, i = [], 0
    while i < len(toks):
        k, x = toks[i]
        if k == 'c' and x.lower() in 'ymdhse':
            j = i
            while j < len(toks) and toks[j][0] == 'c' and toks[j][1].lower() == x.lower():
                j += 1
            items.append(['tok', x.lower() * (j - i)])
            i = j
            continue
        if k == 'c' and x.lower() == 'a':
            word = ''.join(t[1] for t in toks[i:i + 5] if t[0] == 'c').lower()
            n = 5 if word.startswith('am/pm') else (3 if word.startswith('a/p') else 0)
            if n:
                items.append(['ampm', n])
                i += n
                continue
        if k == 'c' and x == '.' and i + 1 < len(toks) and toks[i + 1] == ('c', '0'):
            j = i + 1
            while j < len(toks) and toks[j] == ('c', '0'):
                j += 1
            items.append(['sub', j - i - 1])
            i = j
            continue
        if k == 'br' and re.fullmatch(r'[hHmMsS]+', x):
            items.append(['elapsed', x.lower()])
        elif k in ('q', 'c'):
            items.append(['lit', x])
        i += 1
    toks_only = [it for it in items if it[0] in ('tok', 'elapsed')]
    for n, it in enumerate(toks_only):
        if it[0] == 'tok' and it[1][0] == 'm' and len(it[1]) <= 2:
            before = toks_only[n - 1][1] if n else ''
            after = toks_only[n + 1][1] if n + 1 < len(toks_only) else ''
            if before[:1] == 'h' or after[:1] == 's':
                it[1] = 'n' * len(it[1])
    sub = max([it[1] for it in items if it[0] == 'sub'] or [0])
    total = round(serial * 86400, sub)
    whole_days = math.floor(total / 86400)
    secs = total - whole_days * 86400
    (y, mo, d), wd = excel_date(whole_days, date1904)
    hh, rest = divmod(int(secs), 3600)
    mi, ss = divmod(rest, 60)
    twelve = any(it[0] == 'ampm' for it in items)
    lang = section_language(toks)
    word = r'[^\W\d_]+\.?' if lang is not None and lang not in TABLED else None
    out = []
    for kind, x in items:
        if kind == 'lit':
            out.append(re.escape(x) if x.strip() else r'\s*')
        elif kind == 'ampm':
            out.append('(?:AM|PM|A|P)')
        elif kind == 'sub':
            out.append(r'[.,]\d{%d}' % x if x else '')
        elif kind == 'elapsed':
            out.append(str({'h': int(total // 3600), 'm': int(total // 60), 's': int(total)}[x[0]]).rjust(len(x), '0'))
        else:
            c, n = x[0], len(x)
            if c in 'ye':
                out.append(str(y)[-2:] if c == 'y' and n <= 2 else str(y))
            elif c == 'm':
                names = MONTH_NAMES[mo - 1]
                if n > 2 and word:
                    out.append(r'[^\W\d_]' if n == 5 else word)
                else:
                    out.append(str(mo) if n == 1 else f'{mo:02d}' if n == 2 else '(?:' + '|'.join(
                        re.escape(w[0] if n == 5 else w) for w in names) + ')')
            elif c == 'n':
                out.append(f'{mi:0{min(n, 2)}d}')
            elif c == 'd':
                out.append(str(d) if n == 1 else f'{d:02d}' if n == 2 else (word or '(?:' + '|'.join(re.escape(w) for w in DAY_NAMES[wd]) + ')'))
            elif c == 'h':
                h = (hh % 12 or 12) if twelve else hh
                out.append(f'{h:0{min(n, 2)}d}')
            elif c == 's':
                out.append(f'{ss:0{min(n, 2)}d}')
    return ''.join(out)


def number_ok(v, section, negative_section, md):
    """None when the Markdown text shows v by this number section, else the reason."""
    toks = scan(section)
    chars = [x for k, x in toks if k == 'c']
    if 'general' in ''.join(chars).lower() or ('@' in chars and not any(x in '0#?' for x in chars)):
        return general_ok(v, md)
    if not any(x in '0#?' for x in chars):
        want = squeeze(''.join(x for k, x in toks if k in ('q', 'c')))
        return None if squeeze(md) == want else f'expected the text {want!r}'
    text = squeeze(md)
    if re.search(r'\d,\d', text):
        return 'a thousands separator: the Markdown writes numbers without one'
    pct = chars.count('%')
    lits = [x for k, x in toks if k == 'q' and x.strip()]
    if pct and '%' not in text:
        return 'the percent sign is missing'
    for lit in lits:
        if lit.strip() not in text:
            return f'the format text {lit.strip()!r} is missing'
    expected = abs(v) * (100 ** pct)
    code = ''.join(x if k == 'c' else '' for k, x in toks)
    m = re.search(r'[0#?](,+)(?:[^0#?]|$)', code)
    if m:
        expected /= 1000 ** len(m.group(1))
    sci = re.search(r'(\d+(?:\.\d+)?)E([+-]?\d+)', text)
    frac = re.search(r'(?:(\d+)\s+)?(\d+)/(\d+)', text)
    if sci and re.search(r'[Ee][+-]', code):
        got = float(sci.group(1)) * 10 ** int(sci.group(2))
        digits = len(sci.group(1).partition('.')[2])
        tol = 0.5 * 10 ** (int(sci.group(2)) - digits) * 1.0000001
    elif frac and '/' in code:
        got = int(frac.group(1) or 0) + int(frac.group(2)) / int(frac.group(3))
        tol = 1 / int(frac.group(3)) if '?' in code or '#' in code.split('/')[-1] else 0.5 / int(frac.group(3))
    else:
        nums = re.findall(r'\d+(?:\.\d+)?', text)
        if not nums:
            zero = Decimal(repr(expected)).quantize(Decimal(1).scaleb(-code.count('0')), rounding=ROUND_HALF_UP) == 0
            return None if zero and '0' not in code else 'no number in the text'
        num = max(nums, key=len)
        got = float(num)
        digits = len(num.partition('.')[2])
        dec = code.partition('.')[2] if '.' in code else ''
        zeros = len(re.match(r'[0#?]*', dec.replace(',', '')).group(0)) if dec else 0
        required = len(re.match(r'0*', dec).group(0)) if dec else 0
        if digits < required or digits > max(zeros, required):
            return f'{digits} decimals, the format shows {required if required == zeros else f"{required} to {zeros}"}'
        q = Decimal(repr(expected)).quantize(Decimal(1).scaleb(-digits), rounding=ROUND_HALF_UP)
        if Decimal(num) != q:
            return f'the stored value {v!r} shows as {q}'
        got = expected
        tol = 0
    if abs(got - expected) > tol + 1e-12 * max(1, abs(expected)):
        return f'the stored value {v!r} does not give {text!r}'
    shown_negative = '-' in text or ('(' in text and ')' in text)
    if v < 0 and not negative_section and not shown_negative and re.search(r'[1-9]', text):
        return 'the minus sign is missing'
    return None


def general_ok(v, md):
    try:
        got = float(squeeze(md))
    except ValueError:
        return 'not a number'
    return None if got == float('%.15g' % v) else f'the stored value {v!r} is written {md!r}'


def outer_comparison(formula):
    """A formula whose result is TRUE or FALSE: a comparison operator outside strings and brackets."""
    rest = re.sub(r'"[^"]*"', '', formula)
    while re.search(r'[({][^(){}]*[)}]', rest):
        rest = re.sub(r'[({][^(){}]*[)}]', '', rest)
    return bool(re.search(r'[<>=]', rest))


TABLED = {0, 0x409, 0x809, 0xc09, 0x1009, 0x419, 0x819, 0xfc19, 0x443, 0x843}


def section_language(toks):
    for k, x in toks:
        m = re.match(r'\$[^-]*-([0-9A-Fa-f]+)$', x) if k == 'br' else None
        if m:
            return int(m.group(1), 16) & 0xffff
    return None


def expected_text(book, cell):
    """(kind, text or None, check) for a cell; check(md) gives None or a reason (numbers and dates)."""
    kind, value, style, formula = cell
    fid, code = book.fmt(style)
    if kind == 'text':
        secs = sections(code)
        sec = secs[3] if len(secs) >= 4 else next((s for s in secs if any(k == 'c' and x == '@' for k, x in scan(s))), None)
        if sec is not None:
            value = ''.join(value if (k, x) == ('c', '@') else x for k, x in scan(sec) if k in ('q', 'c'))
        return 'text', value, None
    if kind == 'bool':
        return 'text', 'TRUE' if value else 'FALSE', None
    if kind == 'error':
        return 'text', value, None
    if kind != 'number':
        return 'empty', '', None
    if formula and value in (0.0, 1.0) and outer_comparison(formula):
        return 'text', 'TRUE' if value else 'FALSE', None
    if fid == 0 or code.lower() == 'general':
        return 'number', 'number', lambda md: general_ok(value, md)
    section, negative = choose(code, value)
    if section == '':
        return 'empty', '', None
    if fid in EAST_ASIAN:
        y, m, d = excel_date(value, book.date1904)[0]
        def east(md):
            nums = [int(n) for n in re.findall(r'\d+', md)]
            return None if (y in nums or y % 100 in nums) and m in nums and d in nums else f'the stored date {value!r} ({y}-{m:02d}-{d:02d}) is not in {squeeze(md)!r}'
        return 'date', 'date', east
    if is_date_section(section) or fid in DATE_IDS:
        if value < 0:
            return 'number', 'date', lambda md: None if set(squeeze(md)) == {'#'} else 'a negative date shows as ####'
        pattern = date_pattern(section, value, book.date1904, fid)
        return 'date', 'date', lambda md: None if re.fullmatch(pattern, squeeze(md), re.I) else f'the stored date {value!r} does not give {squeeze(md)!r}'
    return 'number', 'number', lambda md: number_ok(value, section, negative, md)


# ---------------------------------------------------------------- the Markdown

def unescape(s):
    return re.sub(r'\\(.)', r'\1', s)


def split_row(line):
    cells, cur, i = [], '', 0
    body = line.strip()
    body = body[1:] if body.startswith('|') else body
    while i < len(body):
        ch = body[i]
        if ch == '\\' and i + 1 < len(body):
            cur += body[i:i + 2]
            i += 2
            continue
        if ch == '|':
            cells.append(cur)
            cur = ''
        else:
            cur += ch
        i += 1
    if cur.strip():
        cells.append(cur)
    return cells


LINK = re.compile(r'^\[((?:[^\]\\]|\\.)*)\]\(([^)]*)\)$')


def md_cell(raw):
    raw = raw.strip()
    url = None
    m = LINK.match(raw)
    if m:
        raw, url = m.group(1), m.group(2)
    text = unescape(raw.replace('<br>', '\n'))
    if url:
        for a, b in (('%20', ' '), ('%28', '('), ('%29', ')'), ('%3C', '<'), ('%3E', '>'), ('%7C', '|')):
            url = url.replace(a, b)
    return text, url


def read_markdown(path):
    """{sheet: {'hidden': bool, 'line': n, 'items': [(kind, line, payload)]}} in file order."""
    lines = Path(path).read_text(encoding='utf-8').split('\n')
    sheets, order, cur, para, para_line = {}, [], None, [], 0

    def flush():
        nonlocal para
        if para and cur is not None:
            text = '\n'.join(p[:-1] if p.endswith('\\') and not p.endswith('\\\\') else p for p in para)
            cur['items'].append(('para', para_line, md_cell(text) if LINK.match(text.strip()) else (unescape(text), None)))
        para = []
    for n, line in enumerate(lines, 1):
        m = re.match(r'^## (.*?)( \(hidden\))?\s*$', line)
        if m:
            flush()
            name = unescape(m.group(1))
            cur = sheets.setdefault(name, {'hidden': bool(m.group(2)), 'line': n, 'items': []})
            order.append(name)
            continue
        if cur is None or line.startswith('# '):
            continue
        if line.lstrip().startswith('|'):
            flush()
            cells = split_row(line)
            if cells and all(re.fullmatch(r'\s*:?-{3,}:?\s*', c) for c in cells):
                continue
            cur['items'].append(('row', n, [md_cell(c) for c in cells]))
        elif line.strip():
            if not para:
                para_line = n
            para.append(line)
        else:
            flush()
    flush()
    return sheets, order


# ---------------------------------------------------------------- LibreOffice

def find_soffice():
    for name in ('soffice', 'libreoffice'):
        path = shutil.which(name)
        if path:
            return path
    for path in ('/Applications/LibreOffice.app/Contents/MacOS/soffice',
                 r'C:\Program Files\LibreOffice\program\soffice.exe', r'C:\Program Files (x86)\LibreOffice\program\soffice.exe'):
        if os.path.exists(path):
            return path
    return None


def libreoffice_reading(soffice, xlsx):
    """{sheet name: rows of displayed text from A1}, version; None when LibreOffice fails."""
    try:
        version = subprocess.run([soffice, '--version'], capture_output=True, encoding='utf-8', errors='replace', timeout=60).stdout.strip().splitlines()[0]
    except (OSError, subprocess.SubprocessError, IndexError):
        version = 'LibreOffice'
    with tempfile.TemporaryDirectory() as tmp:
        user = Path(tmp) / 'profile' / 'user'
        user.mkdir(parents=True)
        (user / 'registrymodifications.xcu').write_text(
            '<?xml version="1.0" encoding="UTF-8"?><oor:items xmlns:oor="http://openoffice.org/2001/registry" xmlns:xs="http://www.w3.org/2001/XMLSchema">'
            '<item oor:path="/org.openoffice.Setup/L10N"><prop oor:name="ooSetupSystemLocale" oor:op="fuse"><value>en-US</value></prop></item></oor:items>',
            encoding='utf-8')
        work = Path(tmp) / 'in'
        work.mkdir()
        shutil.copyfile(xlsx, work / 'book.xlsx')
        out = Path(tmp) / 'out'
        cmd = [soffice, f'-env:UserInstallation={(Path(tmp) / "profile").as_uri()}', '--headless', '--convert-to',
               'csv:Text - txt - csv (StarCalc):44,34,76,1,,0,false,true,true,false,false,-1', '--outdir', str(out), str(work / 'book.xlsx')]
        try:
            r = subprocess.run(cmd, capture_output=True, encoding='utf-8', errors='replace', timeout=600)
        except subprocess.TimeoutExpired:
            return None, version
        sheets = {}
        for name, path in re.findall(r'Writing sheet (.*?) -> (.*\.csv)', r.stdout + r.stderr):
            if os.path.exists(path):
                with open(path, encoding='utf-8', newline='') as f:
                    sheets[name] = list(csv.reader(f))
        return (sheets or None), version


def lo_neutral(text, fid, is_date):
    s = squeeze(text)
    if is_date:
        if fid in (14, 22) or fid in EAST_ASIAN:
            m = re.match(r'(\d{1,2})/(\d{1,2})/(\d{4})(.*)', s)
            if m:
                s = f'{m.group(3)}-{int(m.group(1)):02d}-{int(m.group(2)):02d}{m.group(4)}'
        return s
    for _ in range(4):
        s = re.sub(r'(?<=\d),(?=\d{3}(?!\d))', '', s)
    return s


def same_display(a, b, is_date):
    if not is_date:
        return squeeze(a) == squeeze(b)
    norm = lambda s: re.sub(r'[./-]', '-', month_numbers(squeeze(s).lower()))
    return norm(a) == norm(b)


def month_numbers(s):
    words = {w.lower(): k + 1 for k, names in enumerate(MONTH_NAMES) for w in names if len(w) > 2}
    return re.sub(r'[^\W\d_]+\.?', lambda m: f'<{words[m.group(0).lower()]}>' if m.group(0).lower() in words else m.group(0), s)


# ---------------------------------------------------------------- comparison

def expected_sheet(book, info, problems):
    cells, merges, links, boxes = book.sheet(info)
    covered = {(r, c) for (r1, c1), (r2, c2) in merges for r in range(r1, r2 + 1) for c in range(c1, c2 + 1) if (r, c) != (r1, c1)}
    grid = {}
    for pos, cell in cells.items():
        if pos in covered:
            continue
        kind, text, check = expected_text(book, cell)
        if kind == 'empty' or (kind == 'text' and not squeeze(text)):
            continue
        url = links.get(pos)
        if url is None and cell[3]:
            m = re.match(r'\s*_?(?:xlfn\.)?HYPERLINK\(\s*"((?:[^"]|"")*)"', cell[3], re.I)
            url = m.group(1).replace('""', '"') if m else None
        grid[pos] = {'kind': kind, 'text': text, 'check': check, 'url': url, 'cell': cell}
    rows = sorted({r for r, _ in grid})
    per = {r: sorted(c for rr, c in grid if rr == r) for r in rows}
    wide = [r for r in rows if len(per[r]) >= 2]
    items = []
    if wide:
        first, last = wide[0], wide[-1]
        cols = sorted({c for r in rows if first <= r <= last for c in per[r]})
        prev = None
        for r in rows:
            if r < first or r > last:
                items.append(('para', r, [(r, per[r][0])]))
                continue
            if prev is not None and r > prev + 1:
                items.append(('row', None, [None] * len(cols)))
            items.append(('row', r, [(r, c) if (r, c) in grid else None for c in cols]))
            prev = r
        first_para = [it for it in items if it[0] == 'para' and it[1] < first]
        rest = [it for it in items if not (it[0] == 'para' and it[1] < first)]
        items = first_para + rest
    else:
        items = [('para', r, [(r, per[r][0])]) for r in rows]
    items += [('box', None, text) for text in boxes]
    return grid, items


def mask(text):
    """A cell's part of a row key: numbers and texts with digits match as '#', so that alignment never reads values."""
    text = squeeze(text)
    return '#' if re.search(r'\d', text) else text


def key_of(item, grid):
    kind, _, payload = item
    if kind == 'box':
        return 'p:' + mask(payload)
    if kind == 'para':
        cell = grid[payload[0]]
        return 'p:' + (mask(cell['text']) if cell['kind'] == 'text' else '#')
    return 'r:' + '|'.join((mask(grid[p]['text']) if grid[p]['kind'] == 'text' else '#') if p else '' for p in payload)


def md_key(item):
    kind, _, payload = item
    if kind == 'para':
        return 'p:' + mask(payload[0])
    return 'r:' + '|'.join(mask(t) for t, _ in payload)


def compare(book, md_sheets, md_order, wanted, lo):
    out = {k: [] for k in ('SHEETS', 'MISSING', 'EXTRA', 'CELLS', 'VALUES', 'DISPLAY', 'LINKS')}
    stats = {'cells': 0, 'numbers': 0, 'lo': 0, 'recalculated': []}
    expected_order = []
    for info in book.sheets:
        if wanted and info['name'] not in wanted:
            continue
        if info['type'] != 'worksheet' or info['target'] not in book.names:
            continue
        grid, items = expected_sheet(book, info, out)
        if not items:
            continue
        expected_order.append(info['name'])
        name = info['name']
        sheet = md_sheets.get(name)
        if sheet is None:
            out['SHEETS'].append(f"sheet {name!r} ({len(grid)} filled cells) has no `## {name}` section")
            continue
        if sheet['hidden'] != (info['state'] != 'visible'):
            out['SHEETS'].append(f"sheet {name!r}: the heading (line {sheet['line']}) " + ("lacks" if info['state'] != 'visible' else "has") + " the (hidden) mark")
        exp_keys = [key_of(it, grid) for it in items]
        got = sheet['items']
        got_keys = [md_key(it) for it in got]
        sm = difflib.SequenceMatcher(None, exp_keys, got_keys, autojunk=False)
        for op, i1, i2, j1, j2 in sm.get_opcodes():
            if op in ('equal', 'replace') and (i2 - i1) == (j2 - j1):
                for e, g in zip(items[i1:i2], got[j1:j2]):
                    compare_item(name, e, g, grid, out, stats, lo.get(name) if lo else None, book)
                continue
            for e in items[i1:i2]:
                out['MISSING'].append(f"{name}: {describe(e, grid)} is not in the Markdown")
            for g in got[j1:j2]:
                text = squeeze(g[2][0]) if g[0] == 'para' else ' | '.join(squeeze(t) for t, _ in g[2])
                out['EXTRA'].append(f"{name}: line {g[1]} {'row' if g[0] == 'row' else 'paragraph'} {text[:80]!r} is not in the workbook")
    for name in md_order:
        if name not in expected_order:
            out['SHEETS'].append(f"section `## {name}` (line {md_sheets[name]['line']}) is not a sheet with content in the workbook" + (' (or not asked for)' if wanted else ''))
    present = [n for n in md_order if n in expected_order]
    if present != [n for n in expected_order if n in present]:
        out['SHEETS'].append('the sheets are not in the workbook order: ' + ', '.join(present))
    return out, stats


def describe(item, grid):
    kind, r, payload = item
    if kind == 'box':
        return f'text box {squeeze(payload)[:60]!r}'
    if r is None:
        return 'an empty table row'
    texts = [squeeze(grid[p]['text']) if p and grid[p]['kind'] == 'text' else (f"{letters(p[1])}{p[0]} number" if p else '') for p in payload]
    return f"row {r} ({' | '.join(t for t in texts if t)[:80]!r})"


def compare_item(name, e, g, grid, out, stats, lo_rows, book):
    ekind, r, payload = e
    gkind, line, gpay = g
    if ekind == 'box':
        if gkind != 'para' or squeeze(gpay[0]) != squeeze(payload):
            out['CELLS'].append(f"{name}: line {line}: text box {squeeze(payload)[:60]!r}, Markdown {squeeze(str(gpay[0]))[:60]!r}")
        return
    if (ekind == 'para') != (gkind == 'para'):
        out['CELLS'].append(f"{name}: line {line}: workbook row {r} should be a {'paragraph' if ekind == 'para' else 'table row'}")
        return
    if gkind == 'row' and len(gpay) != len(payload):
        out['CELLS'].append(f"{name}: line {line}: {len(gpay)} cells, the table has {len(payload)} columns (row {r})")
    cells = [payload[0]] if ekind == 'para' else payload
    gcells = [gpay] if ekind == 'para' else gpay
    for k, pos in enumerate(cells):
        text, url = gcells[k] if k < len(gcells) else ('', None)
        if pos is None:
            if squeeze(text):
                out['EXTRA'].append(f"{name}: line {line}: {squeeze(text)[:60]!r} stands in a cell that is empty in the workbook")
            continue
        info = grid[pos]
        where = f"{name}!{letters(pos[1])}{pos[0]}"
        stats['cells'] += 1
        if info['kind'] == 'text':
            if squeeze(text) != squeeze(info['text']):
                out['CELLS'].append(f"{where}: workbook {squeeze(info['text'])[:60]!r}, Markdown {squeeze(text)[:60]!r} (line {line})")
        else:
            stats['numbers'] += 1
            reason = info['check'](text)
            if reason:
                out['VALUES'].append(f"{where}: Markdown {squeeze(text)!r}: {reason} (line {line})")
            formula = info['cell'][3]
            if formula and VOLATILE.search(formula):
                stats['recalculated'].append(where)
            elif lo_rows is not None:
                shown = lo_rows[pos[0] - 1][pos[1] - 1] if pos[0] - 1 < len(lo_rows) and pos[1] - 1 < len(lo_rows[pos[0] - 1]) else ''
                fid, code = book.fmt(info['cell'][2])
                system = '[$-F800]' in code.upper() or '[$-F400]' in code.upper() or (info['kind'] == 'date' and not book.date1904 and info['cell'][1] < 61)
                is_date = info['kind'] == 'date'
                if fid == 0 or code.lower() == 'general':
                    try:
                        same = float(squeeze(shown)) == float(squeeze(text))
                    except ValueError:
                        same = False
                else:
                    same = system or same_display(lo_neutral(shown, fid, is_date), text, is_date)
                stats['lo'] += 1
                if not same:
                    out['DISPLAY'].append(f"{where}: Markdown {squeeze(text)!r}, LibreOffice {squeeze(shown)!r} (line {line})")
        if (info['url'] or None) != (url or None):
            out['LINKS'].append(f"{where}: workbook link {info['url']!r}, Markdown {url!r} (line {line})")


def main():
    ap = argparse.ArgumentParser(description='Check a Markdown file against its Excel workbook.')
    ap.add_argument('xlsx')
    ap.add_argument('md')
    ap.add_argument('--sheet', action='append', help='compare only this sheet (as given to the converter)')
    ap.add_argument('--no-libreoffice', action='store_true', help='skip the second reading of numbers and dates')
    args = ap.parse_args()
    try:
        book = Book(args.xlsx)
        md_sheets, md_order = read_markdown(args.md)
    except (OSError, zipfile.BadZipFile, KeyError, ET.ParseError, UnicodeDecodeError) as e:
        print(f'ERROR: {e}', file=sys.stderr)
        sys.exit(2)
    soffice = None if args.no_libreoffice else find_soffice()
    lo, version = (libreoffice_reading(soffice, args.xlsx) if soffice else (None, None))
    out, stats = compare(book, md_sheets, md_order, set(args.sheet or []), lo)
    if lo:
        print(f'LIBREOFFICE: {version}: second reading of {stats["lo"]} number and date cells')
    elif soffice:
        print('LIBREOFFICE: the second reading failed; numbers and dates had one reader (the stored value check)')
    else:
        print('LIBREOFFICE: ' + ('skipped' if args.no_libreoffice else 'not found') + '; numbers and dates had one reader (the stored value check)')
    print(f"CELLS: {stats['cells']} compared, {stats['numbers']} of them numbers and dates")
    if stats['recalculated']:
        print(f"RECALCULATED BY LIBREOFFICE (compared with the stored value only): {', '.join(stats['recalculated'])}")
    failed = False
    for label, items in out.items():
        if items:
            failed = True
            print(f'\n{label}: {len(items)}')
            for item in items[:40]:
                print(f'  {item}')
            if len(items) > 40:
                print(f'  ... and {len(items) - 40} more')
    print(f"\nRESULT: {'FAIL' if failed else 'PASS'}")
    sys.exit(1 if failed else 0)


if __name__ == '__main__':
    main()
