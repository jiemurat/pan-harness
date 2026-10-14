#!/usr/bin/env python3
"""Convert an Excel .xlsx workbook into Markdown that keeps every cell Excel shows, in its sheet, row and column.

usage: excel_to_md.py FILE.xlsx OUT.md [--sheet NAME ...] [--title TEXT]

Writes OUT.md and prints a summary. The .xlsx is only read.

What the Markdown holds:
  `# TITLE` (the file name without its extension, or --title), then each worksheet in workbook order as
  `## NAME` (`## NAME (hidden)` for a hidden sheet); hidden rows and columns are kept;
  the rows above the first and below the last row with two or more filled cells (each of them holds one
  filled cell: a title, a note, a signature) as paragraphs, and everything between those rows as one pipe
  table whose first row is its header: columns without a filled cell in those rows are left out, a run of
  empty rows becomes one empty row, a merged cell's text stands once in its first cell and the cells it
  covers stay empty;
  each cell as Excel shows it, in a neutral notation that does not depend on the computer's settings: no
  thousands separator, a period as the decimal mark, the computer's own date and time formats (the short date,
  the system's long date and time) as yyyy-mm-dd and 13:30:00, month and day names in English unless the format names Russian or Uzbek, a General number with
  up to 15 significant digits whatever the column width; everything else as the format code says (percent,
  currency text, brackets for negatives, dd.mm.yyyy, the separators written in the code);
  a formula as the value Excel saved for it (a comparison such as B2>5 as TRUE or FALSE, also when the file
  keeps its value as 1 or 0); TRUE and FALSE; error values (#N/A) as shown;
  links as [text](url) (a link to a place inside the workbook as its text); a line break inside a cell as
  <br> in a table and as a line ending in a backslash in a paragraph; tabs and no-break spaces as spaces;
  the text of text boxes and shapes as paragraphs after the sheet's table;
  characters Markdown reads as syntax escaped with a backslash: \\*, \\_, \\`, \\<, \\\\, \\| in a table, and #,
  >, + or - with a space, or a number with a period or bracket opening a paragraph.
Left out: cell notes and comments, pictures, charts and chart sheets, shapes without text, fonts, colours,
borders, conditional formats and drop-down lists (counted in the summary). Empty sheets are listed, not
written. FORMATS TO CHECK names cells whose format the script writes by approximation (month names of
another language, East Asian or locale currency built-in formats, calendar codes): compare those cells
with the second reading.
"""
import argparse
import datetime as dt
import math
import os
import posixpath
import re
import sys
import zipfile
import xml.etree.ElementTree as ET
from decimal import Decimal, ROUND_HALF_UP
from fractions import Fraction

S = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'
R = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'
A = 'http://schemas.openxmlformats.org/drawingml/2006/main'
XDR = 'http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing'
MC = 'http://schemas.openxmlformats.org/markup-compatibility/2006'
STRICT = {b'http://purl.oclc.org/ooxml/spreadsheetml/main': S.encode(),
          b'http://purl.oclc.org/ooxml/officeDocument/relationships': R.encode(),
          b'http://purl.oclc.org/ooxml/drawingml/main': A.encode(),
          b'http://purl.oclc.org/ooxml/drawingml/spreadsheetDrawing': XDR.encode()}
SPACES = {**dict.fromkeys(map(ord, '\t\u00a0\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000'), ' '),
          **dict.fromkeys(map(ord, '\u200b\ufeff\u00ad\r'), '')}

BUILTIN = {0: 'General', 1: '0', 2: '0.00', 3: '#,##0', 4: '#,##0.00',
           5: '"$"#,##0_);\\("$"#,##0\\)', 6: '"$"#,##0_);[Red]\\("$"#,##0\\)', 7: '"$"#,##0.00_);\\("$"#,##0.00\\)',
           8: '"$"#,##0.00_);[Red]\\("$"#,##0.00\\)', 9: '0%', 10: '0.00%', 11: '0.00E+00', 12: '# ?/?', 13: '# ??/??',
           14: 'yyyy-mm-dd', 15: 'd-mmm-yy', 16: 'd-mmm', 17: 'mmm-yy', 18: 'h:mm AM/PM', 19: 'h:mm:ss AM/PM', 20: 'h:mm',
           21: 'h:mm:ss', 22: 'yyyy-mm-dd h:mm', 37: '#,##0 ;(#,##0)', 38: '#,##0 ;[Red](#,##0)', 39: '#,##0.00;(#,##0.00)',
           40: '#,##0.00;[Red](#,##0.00)', 41: '_(* #,##0_);_(* \\(#,##0\\);_(* "-"_);_(@_)',
           42: '_("$"* #,##0_);_("$"* \\(#,##0\\);_("$"* "-"_);_(@_)', 43: '_(* #,##0.00_);_(* \\(#,##0.00\\);_(* "-"??_);_(@_)',
           44: '_("$"* #,##0.00_);_("$"* \\(#,##0.00\\);_("$"* "-"??_);_(@_)', 45: 'mm:ss', 46: '[h]:mm:ss', 47: 'mm:ss.0',
           48: '##0.0E+0', 49: '@'}
APPROXIMATE_IDS = {5, 6, 7, 8, 42, 44}
EAST_ASIAN_DATES = set(range(27, 37)) | set(range(50, 59))

EN = (['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
      ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'])
RU = (['\u044f\u043d\u0432\u0430\u0440\u044c', '\u0444\u0435\u0432\u0440\u0430\u043b\u044c', '\u043c\u0430\u0440\u0442', '\u0430\u043f\u0440\u0435\u043b\u044c', '\u043c\u0430\u0439', '\u0438\u044e\u043d\u044c', '\u0438\u044e\u043b\u044c', '\u0430\u0432\u0433\u0443\u0441\u0442', '\u0441\u0435\u043d\u0442\u044f\u0431\u0440\u044c', '\u043e\u043a\u0442\u044f\u0431\u0440\u044c', '\u043d\u043e\u044f\u0431\u0440\u044c', '\u0434\u0435\u043a\u0430\u0431\u0440\u044c'],
      ['\u044f\u043d\u0432.', '\u0444\u0435\u0432\u0440.', '\u043c\u0430\u0440\u0442', '\u0430\u043f\u0440.', '\u043c\u0430\u0439', '\u0438\u044e\u043d\u044c', '\u0438\u044e\u043b\u044c', '\u0430\u0432\u0433.', '\u0441\u0435\u043d\u0442.', '\u043e\u043a\u0442.', '\u043d\u043e\u044f\u0431.', '\u0434\u0435\u043a.'],
      ['\u0432\u043e\u0441\u043a\u0440\u0435\u0441\u0435\u043d\u044c\u0435', '\u043f\u043e\u043d\u0435\u0434\u0435\u043b\u044c\u043d\u0438\u043a', '\u0432\u0442\u043e\u0440\u043d\u0438\u043a', '\u0441\u0440\u0435\u0434\u0430', '\u0447\u0435\u0442\u0432\u0435\u0440\u0433', '\u043f\u044f\u0442\u043d\u0438\u0446\u0430', '\u0441\u0443\u0431\u0431\u043e\u0442\u0430'],
      ['\u0432\u0441', '\u043f\u043d', '\u0432\u0442', '\u0441\u0440', '\u0447\u0442', '\u043f\u0442', '\u0441\u0431'])
RU_GENITIVE = (['\u044f\u043d\u0432\u0430\u0440\u044f', '\u0444\u0435\u0432\u0440\u0430\u043b\u044f', '\u043c\u0430\u0440\u0442\u0430', '\u0430\u043f\u0440\u0435\u043b\u044f', '\u043c\u0430\u044f', '\u0438\u044e\u043d\u044f', '\u0438\u044e\u043b\u044f', '\u0430\u0432\u0433\u0443\u0441\u0442\u0430', '\u0441\u0435\u043d\u0442\u044f\u0431\u0440\u044f', '\u043e\u043a\u0442\u044f\u0431\u0440\u044f', '\u043d\u043e\u044f\u0431\u0440\u044f', '\u0434\u0435\u043a\u0430\u0431\u0440\u044f'],) + RU[1:]
UZ = (['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'],
      ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyn', 'Iyl', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek'],
      ['yakshanba', 'dushanba', 'seshanba', 'chorshanba', 'payshanba', 'juma', 'shanba'],
      ['Yak', 'Dush', 'Sesh', 'Chor', 'Pay', 'Jum', 'Shan'])
UZ_CYRL = (['\u044f\u043d\u0432\u0430\u0440', '\u0444\u0435\u0432\u0440\u0430\u043b', '\u043c\u0430\u0440\u0442', '\u0430\u043f\u0440\u0435\u043b', '\u043c\u0430\u0439', '\u0438\u044e\u043d', '\u0438\u044e\u043b', '\u0430\u0432\u0433\u0443\u0441\u0442', '\u0441\u0435\u043d\u0442\u044f\u0431\u0440', '\u043e\u043a\u0442\u044f\u0431\u0440', '\u043d\u043e\u044f\u0431\u0440', '\u0434\u0435\u043a\u0430\u0431\u0440'],
           ['\u044f\u043d\u0432', '\u0444\u0435\u0432', '\u043c\u0430\u0440', '\u0430\u043f\u0440', '\u043c\u0430\u0439', '\u0438\u044e\u043d', '\u0438\u044e\u043b', '\u0430\u0432\u0433', '\u0441\u0435\u043d', '\u043e\u043a\u0442', '\u043d\u043e\u044f', '\u0434\u0435\u043a'],
           ['\u044f\u043a\u0448\u0430\u043d\u0431\u0430', '\u0434\u0443\u0448\u0430\u043d\u0431\u0430', '\u0441\u0435\u0448\u0430\u043d\u0431\u0430', '\u0447\u043e\u0440\u0448\u0430\u043d\u0431\u0430', '\u043f\u0430\u0439\u0448\u0430\u043d\u0431\u0430', '\u0436\u0443\u043c\u0430', '\u0448\u0430\u043d\u0431\u0430'],
           ['\u044f\u043a\u0448', '\u0434\u0443\u0448', '\u0441\u0435\u0448', '\u0447\u043e\u0440', '\u043f\u0430\u0439', '\u0436\u0443\u043c', '\u0448\u0430\u043d'])
LANGUAGES = {0x0000: EN, 0x0409: EN, 0x0809: EN, 0x0c09: EN, 0x1009: EN, 0x0419: RU, 0x0819: RU, 0xfc19: RU_GENITIVE,
             0x0443: UZ, 0x0843: UZ_CYRL}
VOLATILE = re.compile(r'\b(TODAY|NOW|RAND|RANDBETWEEN|RANDARRAY|OFFSET|INDIRECT|CELL|INFO)\s*\(', re.I)


def q(tag, ns=S):
    return f'{{{ns}}}{tag}'


def local(tag):
    return tag.rsplit('}', 1)[-1]


def col_index(letters):
    n = 0
    for ch in letters.upper():
        n = n * 26 + ord(ch) - 64
    return n


def col_letters(n):
    s = ''
    while n:
        n, r = divmod(n - 1, 26)
        s = chr(65 + r) + s
    return s


def split_ref(ref):
    m = re.match(r'\$?([A-Za-z]{1,3})\$?(\d+)', ref or '')
    return (int(m.group(2)), col_index(m.group(1))) if m else None


def unescape_x(s):
    return re.sub(r'_x([0-9A-Fa-f]{4})_', lambda m: chr(int(m.group(1), 16)), s)


class Package:
    def __init__(self, path):
        self.z = zipfile.ZipFile(path)
        self.names = set(self.z.namelist())

    def read(self, part):
        data = self.z.read(part)
        for a, b in STRICT.items():
            data = data.replace(a, b)
        return ET.fromstring(data)

    def rels(self, part):
        folder, name = posixpath.split(part)
        rp = posixpath.join(folder, '_rels', name + '.rels')
        out = {}
        if rp in self.names:
            for rel in self.read(rp):
                target, mode = rel.get('Target', ''), rel.get('TargetMode')
                if mode != 'External':
                    target = target.lstrip('/') if target.startswith('/') else posixpath.normpath(posixpath.join(folder, target))
                out[rel.get('Id')] = (rel.get('Type', '').rsplit('/', 1)[-1], target, mode)
        return out


def si_text(si):
    parts = []
    for child in si:
        tag = local(child.tag)
        if tag == 't':
            parts.append(child.text or '')
        elif tag == 'r':
            parts.extend(t.text or '' for t in child.iter(q('t')))
    return unescape_x(''.join(parts)).replace('\r\n', '\n')


# ---------------------------------------------------------------- number formats

def split_sections(code):
    sections, cur, i, quoted = [], [], 0, False
    while i < len(code):
        ch = code[i]
        if ch == '"':
            quoted = not quoted
            cur.append(ch)
        elif quoted:
            cur.append(ch)
        elif ch in '\\_*' and i + 1 < len(code):
            cur.append(code[i:i + 2])
            i += 1
        elif ch == '[':
            j = code.find(']', i)
            j = len(code) - 1 if j < 0 else j
            cur.append(code[i:j + 1])
            i = j
        elif ch == ';':
            sections.append(''.join(cur))
            cur = []
        else:
            cur.append(ch)
        i += 1
    sections.append(''.join(cur))
    return sections


def tokens(section):
    """('lit', text), ('fill', ch), ('br', inside brackets), ('ch', ch)."""
    out, i = [], 0
    while i < len(section):
        ch = section[i]
        if ch == '"':
            j = section.find('"', i + 1)
            j = len(section) if j < 0 else j
            out.append(('lit', section[i + 1:j]))
            i = j + 1
            continue
        if ch == '\\' and i + 1 < len(section):
            out.append(('lit', section[i + 1]))
            i += 2
            continue
        if ch == '_' and i + 1 < len(section):
            out.append(('lit', ' '))
            i += 2
            continue
        if ch == '*' and i + 1 < len(section):
            out.append(('fill', section[i + 1]))
            i += 2
            continue
        if ch == '[':
            j = section.find(']', i)
            j = len(section) - 1 if j < 0 else j
            out.append(('br', section[i + 1:j]))
            i = j + 1
            continue
        out.append(('ch', ch))
        i += 1
    return out


CONDITION = re.compile(r'^(<=|>=|<>|<|>|=)\s*(-?\d+(?:\.\d+)?(?:[Ee][+-]?\d+)?)$')
COLORS = {'black', 'blue', 'cyan', 'green', 'magenta', 'red', 'white', 'yellow'}


class Section:
    def __init__(self, text):
        self.text, self.cond, self.lang, self.flags = text, None, None, set()
        self.toks = []
        for kind, val in tokens(text):
            if kind == 'br':
                low = val.lower()
                m = CONDITION.match(val)
                if m:
                    self.cond = (m.group(1), float(m.group(2)))
                elif low in COLORS or re.fullmatch(r'color\s*\d+', low):
                    pass
                elif val.startswith('$'):
                    sym, _, code = val[1:].partition('-')
                    if code:
                        try:
                            n = int(code, 16)
                        except ValueError:
                            n = None
                        if n is not None:
                            n &= 0xffff
                            if n in (0xf800, 0xf400):
                                self.flags.add('system-date' if n == 0xf800 else 'system-time')
                            else:
                                self.lang = n
                    if sym:
                        self.toks.append(('lit', sym))
                elif re.fullmatch(r'[hH]+|[mM]+|[sS]+', val):
                    self.toks.append(('elapsed', low[0] * len(val)))
                else:
                    self.flags.add('approximate')
            else:
                self.toks.append((kind, val))
        letters = ''.join(v for k, v in self.toks if k == 'ch').lower()
        self.is_text = any(k == 'ch' and v == '@' for k, v in self.toks)
        self.is_general = 'general' in letters
        letters = letters.replace('general', '')
        self.is_date = (bool(re.search(r'[ymdhs]', letters)) or any(k == 'elapsed' for k, _ in self.toks)
                        or bool(self.flags & {'system-date', 'system-time'}))
        if self.is_date and self.lang is not None and self.lang not in LANGUAGES and re.search(r'mmm|ddd', letters):
            self.flags.add('approximate')
        if self.is_date and re.search(r'[bg]', letters):
            self.flags.add('approximate')


class Format:
    def __init__(self, code):
        self.code = code
        self.sections = [Section(s) for s in split_sections(code)]
        self.flags = set().union(*(s.flags for s in self.sections))
        self.is_date = any(s.is_date for s in self.sections[:1])


def dec15(v):
    return Decimal('%.15g' % v)


def general(v):
    if v == 0:
        return '0'
    d = dec15(v)
    exp = d.adjusted()
    if -10 < exp < 15:
        s = format(d, 'f')
        if '.' in s:
            s = s.rstrip('0').rstrip('.')
        return s
    mant = format(d.scaleb(-exp), 'f')
    if '.' in mant:
        mant = mant.rstrip('0').rstrip('.')
    return f"{mant}E{'+' if exp >= 0 else '-'}{abs(exp):02d}"


def place_digits(toks, int_ph, digits):
    """Fill the integer placeholders from the right; extra digits go before the first one."""
    out = {}
    rest = list(digits)
    for i in reversed(int_ph):
        ch = toks[i][1]
        out[i] = rest.pop() if rest else ('0' if ch == '0' else (' ' if ch == '?' else ''))
    if rest and int_ph:
        out[int_ph[0]] = ''.join(rest) + out[int_ph[0]]
    return out


def render(toks, filled, skip=()):
    parts = []
    for i, (kind, val) in enumerate(toks):
        if i in filled:
            parts.append(filled[i])
        elif i in skip or kind == 'fill':
            continue
        elif kind == 'lit':
            parts.append(val)
        elif kind == 'ch':
            if val != ',':
                parts.append(val)
    return ''.join(parts)


def number_section(v, sec):
    toks = sec.toks
    pct = sum(1 for k, x in toks if k == 'ch' and x == '%')
    v = v * (100 ** pct)
    ph = [i for i, (k, x) in enumerate(toks) if k == 'ch' and x in '0#?']
    if not ph:
        return render(toks, {})
    e = next((i for i in range(len(toks) - 1) if toks[i] in (('ch', 'E'), ('ch', 'e')) and toks[i + 1] in (('ch', '+'), ('ch', '-'))
              and any(p < i for p in ph)), None)
    slash = next((i for i, t in enumerate(toks) if t == ('ch', '/') and any(p < i for p in ph)), None) if e is None else None
    if slash is not None:
        return fraction_section(v, toks, ph, slash)
    end = e if e is not None else len(toks)
    mph = [p for p in ph if p < end]
    dot = next((i for i in range(mph[0], end) if toks[i] == ('ch', '.')), None)
    int_ph = [p for p in mph if dot is None or p < dot]
    dec_ph = [p for p in mph if dot is not None and p > dot]
    scale = 0
    for start in {int_ph[-1] + 1 if int_ph else mph[0], mph[-1] + 1}:
        k, n = start, 0
        while k < end and toks[k] == ('ch', ','):
            n += 1
            k += 1
        if k >= end or toks[k] == ('ch', '.') or toks[k][0] != 'ch' or toks[k][1] not in '0#?':
            scale = max(scale, n)
    v = v / (1000 ** scale)
    filled = {}
    if e is not None:
        exp_ph = [p for p in ph if p > e]
        n_int = max(1, len(int_ph))
        hashes = any(toks[p][1] == '#' for p in int_ph)
        if v == 0:
            exp = 0
        else:
            exp = math.floor(math.log10(abs(v)))
            exp = n_int * math.floor(exp / n_int) if hashes and n_int > 1 else exp - (n_int - 1)
        mant = dec15(v / (10 ** exp)).quantize(Decimal(1).scaleb(-len(dec_ph)), rounding=ROUND_HALF_UP)
        limit = 10 ** n_int
        if abs(mant) >= limit:
            exp += 1 if not (hashes and n_int > 1) else n_int
            mant = dec15(v / (10 ** exp)).quantize(Decimal(1).scaleb(-len(dec_ph)), rounding=ROUND_HALF_UP)
        ip, _, fp = format(abs(mant), 'f').partition('.')
        sign_tok = toks[e + 1][1]
        exp_text = str(abs(exp)).rjust(len(exp_ph), '0')
        filled.update(place_digits(toks, int_ph, ip.lstrip('0') if len(int_ph) else ip))
        fill_decimals(toks, dec_ph, fp, filled)
        filled[e] = 'E' + ('-' if exp < 0 else ('+' if sign_tok == '+' else ''))
        filled[e + 1] = ''
        for p in exp_ph:
            filled[p] = ''
        if exp_ph:
            filled[exp_ph[-1]] = exp_text
        return render(toks, filled)
    d = dec15(v).quantize(Decimal(1).scaleb(-len(dec_ph)), rounding=ROUND_HALF_UP)
    ip, _, fp = format(abs(d), 'f').partition('.')
    digits = ip.lstrip('0')
    if int_ph:
        filled.update(place_digits(toks, int_ph, digits))
    elif digits:
        filled[dot] = digits + '.'
    fill_decimals(toks, dec_ph, fp, filled)
    if dot is not None and dot not in filled:
        filled[dot] = '.'
    return render(toks, filled)


def fill_decimals(toks, dec_ph, fp, filled):
    fp = fp.ljust(len(dec_ph), '0')
    vals = list(fp[:len(dec_ph)])
    for j in range(len(dec_ph) - 1, -1, -1):
        ch = toks[dec_ph[j]][1]
        if vals[j] != '0' or ch == '0':
            break
        vals[j] = '' if ch == '#' else ' '
    for p, digit in zip(dec_ph, vals):
        filled[p] = digit


def fraction_section(v, toks, ph, slash):
    num_ph = []
    i = slash - 1
    while i >= 0 and toks[i][0] == 'ch' and toks[i][1] in '0#?':
        num_ph.insert(0, i)
        i -= 1
    int_ph = [p for p in ph if p < (num_ph[0] if num_ph else slash)]
    after = []
    i = slash + 1
    while i < len(toks) and toks[i][0] == 'ch' and (toks[i][1] in '#?' or '0' <= toks[i][1] <= '9'):
        after.append(i)
        i += 1
    av = abs(v)
    whole = math.floor(av) if int_ph else 0
    frac = av - whole
    fixed = ''.join(toks[p][1] for p in after)
    if fixed.isdigit() and fixed.lstrip('0'):
        den = int(fixed)
        num = int(Decimal(frac * den).quantize(Decimal(1), rounding=ROUND_HALF_UP))
    else:
        f = Fraction(frac).limit_denominator(max(1, 10 ** max(1, len(after)) - 1))
        num, den = f.numerator, f.denominator
    if num == den and den:
        whole, num = whole + 1, 0
    filled = {}
    if int_ph:
        filled.update(place_digits(toks, int_ph, str(whole) if whole else ''))
    if num == 0:
        for p in num_ph + after + [slash]:
            filled[p] = ''
        for k in range(int_ph[-1] + 1 if int_ph else 0, slash):
            if k not in filled:
                filled[k] = ''
        if not int_ph or not whole:
            filled[int_ph[-1] if int_ph else slash] = '0'
        return render(toks, filled)
    filled.update(place_digits(toks, num_ph, str(num)))
    filled[slash] = '/'
    den_s = str(den)
    for k, p in enumerate(after):
        filled[p] = den_s[k] if k < len(den_s) else ''
    if len(den_s) > len(after) and after:
        filled[after[-1]] += den_s[len(after):]
    return render(toks, filled)


def excel_date(v, date1904):
    days = math.floor(v)
    if date1904:
        return (dt.date(1904, 1, 1) + dt.timedelta(days=days)).timetuple()[:3], (days + 5) % 7
    if days == 0:
        return (1900, 1, 0), 6
    if days == 60:
        return (1900, 2, 29), 3
    base = dt.date(1899, 12, 31) if days < 60 else dt.date(1899, 12, 30)
    d = base + dt.timedelta(days=days)
    return (d.year, d.month, d.day), (days + 6) % 7


def date_section(v, sec, date1904):
    if v < 0:
        return '#' * 8
    if 'system-date' in sec.flags:
        toks = tokens('yyyy-mm-dd')
    elif 'system-time' in sec.flags:
        toks = tokens('h:mm:ss')
    else:
        toks = sec.toks
    names = LANGUAGES.get(sec.lang or 0, EN)
    items, i = [], 0
    while i < len(toks):
        kind, val = toks[i]
        if kind == 'ch' and val.lower() in 'ymdhse':
            j = i
            while j < len(toks) and toks[j][0] == 'ch' and toks[j][1].lower() == val.lower():
                j += 1
            items.append(['date', val.lower() * (j - i)])
            i = j
            continue
        if kind == 'ch' and val.lower() == 'a':
            rest = ''.join(t[1] for t in toks[i:i + 5] if t[0] == 'ch')
            if rest.lower().startswith('am/pm'):
                items.append(['ampm', rest[:5]])
                i += 5
                continue
            rest = ''.join(t[1] for t in toks[i:i + 3] if t[0] == 'ch')
            if rest.lower().startswith('a/p'):
                items.append(['ampm', rest[:3]])
                i += 3
                continue
        if kind == 'ch' and val == '.' and i + 1 < len(toks) and toks[i + 1] == ('ch', '0'):
            j = i + 1
            while j < len(toks) and toks[j] == ('ch', '0'):
                j += 1
            items.append(['subsec', j - i - 1])
            i = j
            continue
        if kind == 'elapsed':
            items.append(['elapsed', val])
        elif kind == 'lit':
            items.append(['lit', val])
        elif kind == 'ch':
            items.append(['lit', '.' if val == '.' else val])
        i += 1
    dates = [k for k, it in enumerate(items) if it[0] in ('date', 'elapsed')]
    for pos, k in enumerate(dates):
        it = items[k]
        if it[0] == 'date' and it[1][0] == 'm' and len(it[1]) <= 2:
            prev = items[dates[pos - 1]][1] if pos else ''
            nxt = items[dates[pos + 1]][1] if pos + 1 < len(dates) else ''
            if prev[:1] == 'h' or nxt[:1] == 's':
                it[1] = 'M' * len(it[1])
    subsec = max([it[1] for it in items if it[0] == 'subsec'] or [0])
    ampm = any(it[0] == 'ampm' for it in items)
    unit = Decimal(1).scaleb(-subsec)
    total = (Decimal(repr(v)) * 86400).quantize(unit, rounding=ROUND_HALF_UP)
    days = int(total // 86400)
    secs = total - days * 86400
    (y, mo, d), wd = excel_date(days, date1904)
    hh, rem = divmod(int(secs), 3600)
    mi, ss = divmod(rem, 60)
    frac = secs - int(secs)
    out = []
    for kind, val in items:
        if kind == 'lit':
            out.append(val)
        elif kind == 'ampm':
            word = ('AM' if hh < 12 else 'PM') if len(val) == 5 else ('A' if hh < 12 else 'P')
            out.append(word if val[0].isupper() else word.lower())
        elif kind == 'subsec':
            out.append('.' + format(frac, 'f').split('.')[-1].ljust(val, '0')[:val] if val else '')
        elif kind == 'elapsed':
            n = {'h': int(total // 3600), 'm': int(total // 60), 's': int(total)}[val[0]]
            out.append(str(n).rjust(len(val), '0'))
        else:
            t = val
            if t[0] in 'ye':
                out.append(str(y)[-2:].rjust(2, '0') if len(t) <= 2 and t[0] == 'y' else str(y))
            elif t[0] == 'm':
                n = len(t)
                out.append(str(mo) if n == 1 else str(mo).rjust(2, '0') if n == 2 else names[1][mo - 1] if n == 3
                           else names[0][mo - 1][0] if n == 5 else names[0][mo - 1])
            elif t[0] == 'M':
                out.append(str(mi).rjust(len(t), '0'))
            elif t[0] == 'd':
                n = len(t)
                out.append(str(d) if n == 1 else str(d).rjust(2, '0') if n == 2 else names[3][wd] if n == 3 else names[2][wd])
            elif t[0] == 'h':
                h = (hh % 12 or 12) if ampm else hh
                out.append(str(h).rjust(min(len(t), 2), '0'))
            elif t[0] == 's':
                out.append(str(ss).rjust(min(len(t), 2), '0'))
    return ''.join(out)


def pick_section(fmt, v):
    secs = fmt.sections
    if any(s.cond for s in secs[:2]):
        for s in secs[:2]:
            if s.cond and condition(v, s.cond):
                return s, s.cond[0] in ('<', '<=') and s.cond[1] <= 0
        rest = [s for s in secs if not s.cond and not (s.is_text and len(secs) == 4 and s is secs[-1])]
        return (rest[0] if rest else secs[-1]), False
    if len(secs) == 1:
        return secs[0], False
    if v > 0 or (v == 0 and len(secs) < 3):
        return secs[0], False
    if v < 0:
        return secs[1], True
    return secs[2], False


def condition(v, cond):
    op, x = cond
    return {'<': v < x, '<=': v <= x, '>': v > x, '>=': v >= x, '=': v == x, '<>': v != x}[op]


def format_number(v, fmt, date1904):
    sec, absolute = pick_section(fmt, v)
    if sec.text == '':
        return ''
    if sec.is_general or (sec.is_text and not sec.is_date):
        text = general(abs(v) if absolute else v)
        if sec.is_text:
            return text
        return render_general(sec, text)
    if sec.is_date:
        return re.sub(r'\s+', ' ', date_section(v, sec, date1904)).strip()
    text = number_section(abs(v), sec)
    text = re.sub(r'\s+', ' ', text).strip()
    if v < 0 and not absolute and len(fmt.sections) == 1 or (v < 0 and not absolute and any(s.cond for s in fmt.sections[:2])):
        if re.search(r'[1-9]', text):
            text = '-' + text
    return text


def render_general(sec, text):
    out = []
    for kind, val in sec.toks:
        if kind == 'lit':
            out.append(val)
        elif kind == 'ch':
            out.append(val)
    joined = ''.join(out)
    return re.sub(r'\s+', ' ', re.sub('general', text, joined, flags=re.I)).strip()


def format_text(text, fmt):
    secs = fmt.sections
    sec = secs[3] if len(secs) >= 4 else next((s for s in secs if s.is_text), None)
    if sec is None:
        return text
    parts = []
    for kind, val in sec.toks:
        if kind == 'lit':
            parts.append(val)
        elif kind == 'ch':
            parts.append(text if val == '@' else val)
    return ''.join(parts).strip(' ')


# ---------------------------------------------------------------- workbook reading

class Cell:
    __slots__ = ('kind', 'value', 'style', 'formula', 'text')

    def __init__(self, kind, value, style, formula):
        self.kind, self.value, self.style, self.formula, self.text = kind, value, style, formula, ''


class Workbook:
    def __init__(self, path):
        self.pkg = Package(path)
        root = self.pkg.rels('')
        self.part = next((t for typ, t, _ in root.values() if typ == 'officeDocument'), 'xl/workbook.xml')
        wb = self.pkg.read(self.part)
        pr = wb.find(q('workbookPr'))
        self.date1904 = pr is not None and pr.get('date1904', '0').lower() in ('1', 'true')
        rels = self.pkg.rels(self.part)
        self.sheets = []
        for sh in wb.iter(q('sheet')):
            typ, target, _ = rels.get(sh.get(q('id', R)), ('', '', None))
            self.sheets.append({'name': sh.get('name'), 'state': sh.get('state', 'visible'), 'type': typ, 'part': target})
        self.strings = []
        self.formats = []
        for typ, target, _ in rels.values():
            if typ == 'sharedStrings' and target in self.pkg.names:
                self.strings = [si_text(si) for si in self.pkg.read(target).iter(q('si'))]
            elif typ == 'styles' and target in self.pkg.names:
                self.formats = self.read_styles(target)
        self.cache = {}

    def read_styles(self, part):
        st = self.pkg.read(part)
        custom = {int(n.get('numFmtId')): n.get('formatCode', '') for n in st.iter(q('numFmt'))}
        xfs = st.find(q('cellXfs'))
        out = []
        for xf in (xfs if xfs is not None else []):
            fid = int(xf.get('numFmtId', 0))
            out.append((fid, custom.get(fid, BUILTIN.get(fid, 'yyyy-mm-dd' if fid in EAST_ASIAN_DATES else 'General'))))
        return out

    def fmt(self, style):
        fid, code = self.formats[style] if style < len(self.formats) else (0, 'General')
        if code not in self.cache:
            self.cache[code] = Format(code)
        return fid, self.cache[code]

    def read_sheet(self, info):
        part = info['part']
        root = self.pkg.read(part)
        rels = self.pkg.rels(part)
        cells, hidden_rows, hidden_cols, merges, links = {}, set(), set(), [], {}
        for col in root.iter(q('col')):
            if col.get('hidden') in ('1', 'true'):
                hidden_cols.update(range(int(col.get('min', 1)), int(col.get('max', 1)) + 1))
        r = 0
        for row in root.iter(q('row')):
            r = int(row.get('r', r + 1))
            if row.get('hidden') in ('1', 'true'):
                hidden_rows.add(r)
            c = 0
            for el in row.iter(q('c')):
                pos = split_ref(el.get('r'))
                c = pos[1] if pos else c + 1
                cells[(r, c)] = self.cell(el)
        for m in root.iter(q('mergeCell')):
            a, _, b = (m.get('ref') or '').partition(':')
            pa, pb = split_ref(a), split_ref(b or a)
            if pa and pb:
                merges.append((pa[0], pa[1], pb[0], pb[1]))
        internal = 0
        for h in root.iter(q('hyperlink')):
            a, _, b = (h.get('ref') or '').partition(':')
            pa, pb = split_ref(a), split_ref(b or a)
            if not pa:
                continue
            rid = h.get(q('id', R))
            url = rels[rid][1] if rid in rels and rels[rid][2] == 'External' else None
            if url and h.get('location'):
                url += '#' + h.get('location')
            if url is None:
                internal += 1
            for rr in range(pa[0], pb[0] + 1):
                for cc in range(pa[1], pb[1] + 1):
                    links[(rr, cc)] = url
        objects = {'notes': 0, 'pictures': 0, 'charts': 0, 'shapes': 0, 'textboxes': []}
        for typ, target, mode in rels.values():
            if mode == 'External' or target not in self.pkg.names:
                continue
            if typ == 'comments':
                objects['notes'] += sum(1 for _ in self.pkg.read(target).iter(q('comment')))
            elif typ == 'drawing':
                self.read_drawing(target, objects)
        return cells, hidden_rows, hidden_cols, merges, links, internal, objects

    def cell(self, el):
        t = el.get('t', 'n')
        style = int(el.get('s', 0) or 0)
        v = el.find(q('v'))
        f = el.find(q('f'))
        formula = f.text if f is not None and f.text else ('' if f is not None else None)
        raw = v.text if v is not None else None
        if t == 'inlineStr':
            is_ = el.find(q('is'))
            return Cell('text', si_text(is_) if is_ is not None else '', style, formula)
        if raw is None:
            return Cell('empty', None, style, formula)
        if t == 's':
            k = int(raw)
            return Cell('text', self.strings[k] if k < len(self.strings) else '', style, formula)
        if t == 'str':
            return Cell('text', unescape_x(raw), style, formula)
        if t == 'b':
            return Cell('bool', raw.strip() in ('1', 'true'), style, formula)
        if t == 'e':
            return Cell('error', raw, style, formula)
        if t == 'd':
            try:
                d = dt.datetime.fromisoformat(raw.replace('Z', ''))
            except ValueError:
                return Cell('text', raw, style, formula)
            base = dt.datetime(1904, 1, 1) if self.date1904 else dt.datetime(1899, 12, 30)
            return Cell('number', (d - base).total_seconds() / 86400, style, formula)
        try:
            return Cell('number', float(raw), style, formula)
        except ValueError:
            return Cell('text', raw, style, formula)

    def read_drawing(self, part, objects):
        root = self.pkg.read(part)

        def walk(el):
            for child in el:
                tag = local(child.tag)
                if child.tag == q('Fallback', MC):
                    continue
                if tag == 'sp':
                    paras = []
                    for p in child.iter(q('p', A)):
                        paras.append(''.join(t.text or '' for t in p.iter(q('t', A))))
                    text = '\n'.join(paras).strip()
                    if text:
                        objects['textboxes'].append(text)
                    else:
                        objects['shapes'] += 1
                elif tag == 'pic':
                    objects['pictures'] += 1
                elif tag == 'graphicFrame':
                    objects['charts'] += 1
                elif tag == 'cxnSp':
                    objects['shapes'] += 1
                else:
                    walk(child)
        walk(root)

    def display(self, cell, approx, where):
        fid, fmt = self.fmt(cell.style)
        if cell.kind == 'text':
            return format_text(cell.value, fmt)
        if cell.kind == 'bool':
            return 'TRUE' if cell.value else 'FALSE'
        if cell.kind == 'error':
            return cell.value
        if cell.kind == 'number':
            if cell.formula and cell.value in (0.0, 1.0) and compares(cell.formula):
                return 'TRUE' if cell.value else 'FALSE'
            if fid in APPROXIMATE_IDS or fid in EAST_ASIAN_DATES or 'approximate' in fmt.flags:
                approx.append(f'{where} ({fmt.code})')
            return format_number(cell.value, fmt, self.date1904)
        return ''


def compares(formula):
    """True when the formula's outermost operation is a comparison (=, <>, <, >, <=, >=): its result is TRUE or FALSE."""
    depth, quoted = 0, False
    for ch in formula:
        if ch == '"':
            quoted = not quoted
        elif not quoted:
            if ch in '({':
                depth += 1
            elif ch in ')}':
                depth -= 1
            elif depth == 0 and ch in '<>=':
                return True
    return False


# ---------------------------------------------------------------- Markdown

def esc(s):
    s = s.translate(SPACES).replace('\\', '\\\\')
    for ch in '*_`<':
        s = s.replace(ch, '\\' + ch)
    return s


def url_escape(url):
    return url.replace(' ', '%20').replace('(', '%28').replace(')', '%29').replace('<', '%3C').replace('>', '%3E').replace('|', '%7C')


def cell_md(text, url):
    s = esc(text.strip()).replace('|', '\\|')
    s = '<br>'.join(part.strip() for part in s.split('\n'))
    return f'[{s}]({url_escape(url)})' if url and s else s


LINE_START = re.compile(r'^(#|>|[-+](?=\s|$)|\d+(?=[.)](?:\s|$))|=+$|-+$)')


def para_md(text, url=None):
    lines = []
    for line in text.strip().split('\n'):
        line = esc(line.strip())
        m = LINE_START.match(line)
        if m:
            g = m.group(0)
            line = '\\' + line if not g[0].isdigit() else g + '\\' + line[len(g):]
        lines.append(line)
    s = '\\\n'.join(lines)
    return f'[{s}]({url_escape(url)})' if url and s else s


def link_formula(formula):
    m = re.match(r'\s*_?(?:xlfn\.)?HYPERLINK\(\s*"((?:[^"]|"")*)"', formula or '', re.I)
    return m.group(1).replace('""', '"') if m else None


def sheet_markdown(wb, info, stats):
    cells, hidden_rows, hidden_cols, merges, links, internal, objects = wb.read_sheet(info)
    name = info['name']
    covered = set()
    for r1, c1, r2, c2 in merges:
        for rr in range(r1, r2 + 1):
            for cc in range(c1, c2 + 1):
                if (rr, cc) != (r1, c1):
                    covered.add((rr, cc))
    grid = {}
    for (r, c), cell in cells.items():
        if (r, c) in covered:
            continue
        where = f"'{name}'!{col_letters(c)}{r}"
        if cell.kind == 'empty' and cell.formula is not None:
            stats['no_value'].append(where)
        text = wb.display(cell, stats['approx'], where)
        if cell.formula and VOLATILE.search(cell.formula):
            stats['volatile'].append(where)
        if cell.kind in ('number', 'text') and cell.value not in (None, '') and not text.translate(SPACES).strip():
            stats['format_hidden'].append(f'{where} ({wb.fmt(cell.style)[1].code})')
        if text.translate(SPACES).strip():
            url = links.get((r, c)) or link_formula(cell.formula)
            grid[(r, c)] = (text, url)
            stats['cells'] += 1
            if url:
                stats['links'] += 1
    stats['internal'] += internal
    stats['notes'] += objects['notes']
    stats['pictures'] += objects['pictures']
    stats['charts'] += objects['charts']
    stats['shapes'] += objects['shapes']
    rows = sorted({r for r, _ in grid})
    if not rows and not objects['textboxes']:
        stats['empty'].append(name)
        return None
    hr, hc = sorted(hidden_rows & set(rows)), sorted(hidden_cols & {c for _, c in grid})
    if hr or hc:
        stats['hidden'].append(f"{name}: " + '; '.join(part for part in (
            f"rows {', '.join(map(str, hr))}" if hr else '', f"columns {', '.join(map(col_letters, hc))}" if hc else '') if part))
    per_row = {r: sorted(c for rr, c in grid if rr == r) for r in rows}
    wide = [r for r in rows if len(per_row[r]) >= 2]
    first, last = (wide[0], wide[-1]) if wide else (None, None)
    title = esc(name) + (' (hidden)' if info['state'] != 'visible' else '')
    out = [f'## {title}', '']
    above = [r for r in rows if first is None or r < first]
    below = [r for r in rows if first is not None and r > last]
    for r in above:
        text, url = grid[(r, per_row[r][0])]
        out += [para_md(text, url), '']
        stats['lines'] += 1
    if first is not None:
        table_rows = [r for r in rows if first <= r <= last]
        cols = sorted({c for r in table_rows for c in per_row[r]})
        lines, prev = [], None
        for r in table_rows:
            if prev is not None and r > prev + 1:
                lines.append('| ' + ' | '.join('' for _ in cols) + ' |')
            lines.append('| ' + ' | '.join(cell_md(*grid[(r, c)]) if (r, c) in grid else '' for c in cols) + ' |')
            prev = r
        lines = [re.sub(r' {2,}\|', ' |', ln) for ln in lines]
        out.append(lines[0])
        out.append('|' + '|'.join('---' for _ in cols) + '|')
        out += lines[1:]
        out.append('')
        stats['tables'].append(f'{name} {len(table_rows)}x{len(cols)}')
    for r in below:
        text, url = grid[(r, per_row[r][0])]
        out += [para_md(text, url), '']
        stats['lines'] += 1
    for text in objects['textboxes']:
        out += [para_md(text), '']
        stats['textboxes'] += 1
    return out


def main():
    ap = argparse.ArgumentParser(description='Convert an .xlsx workbook into Markdown.')
    ap.add_argument('xlsx')
    ap.add_argument('out')
    ap.add_argument('--sheet', action='append', help='convert only this sheet (repeat for more)')
    ap.add_argument('--title', help='the # title (default: the file name without its extension)')
    args = ap.parse_args()
    try:
        wb = Workbook(args.xlsx)
    except (zipfile.BadZipFile, KeyError, ET.ParseError, OSError) as e:
        print(f'ERROR: {args.xlsx} is not a readable .xlsx: {e}', file=sys.stderr)
        sys.exit(1)
    names = [s['name'] for s in wb.sheets]
    if args.sheet:
        unknown = [n for n in args.sheet if n not in names]
        if unknown:
            print(f"ERROR: no sheet named {', '.join(unknown)}; the sheets are: {', '.join(names)}", file=sys.stderr)
            sys.exit(2)
    stats = {'cells': 0, 'links': 0, 'internal': 0, 'notes': 0, 'pictures': 0, 'charts': 0, 'shapes': 0, 'textboxes': 0, 'lines': 0,
             'hidden': [], 'format_hidden': [], 'tables': [], 'empty': [], 'approx': [], 'no_value': [], 'volatile': []}
    title = args.title or os.path.splitext(os.path.basename(args.xlsx))[0]
    out = [f'# {esc(title)}', '']
    written, hidden, chartsheets = [], [], []
    for info in wb.sheets:
        if args.sheet and info['name'] not in args.sheet:
            continue
        if info['type'] != 'worksheet' or info['part'] not in wb.pkg.names:
            chartsheets.append(info['name'])
            continue
        lines = sheet_markdown(wb, info, stats)
        if lines is None:
            continue
        written.append(info['name'])
        if info['state'] != 'visible':
            hidden.append(f"{info['name']} ({'very hidden' if info['state'] == 'veryHidden' else 'hidden'})")
        out += lines
    text = '\n'.join(out).rstrip('\n') + '\n'
    with open(args.out, 'w', encoding='utf-8', newline='\n') as f:
        f.write(text)
    print(f"SHEETS: {len(written)} written ({', '.join(written) or 'none'})" + (f"; hidden among them: {', '.join(hidden)}" if hidden else ''))
    if stats['empty']:
        print(f"EMPTY SHEETS (not written): {', '.join(stats['empty'])}")
    if chartsheets:
        print(f"CHART SHEETS (not converted): {', '.join(chartsheets)}")
    print(f"CELLS: {stats['cells']} written; TABLES: {', '.join(stats['tables']) or 'none'}; PARAGRAPHS: {stats['lines']}")
    if stats['hidden']:
        print(f"HIDDEN ROWS AND COLUMNS (kept, without a mark in the table): {' | '.join(stats['hidden'])}")
    if stats['format_hidden']:
        print(f"VALUES THEIR FORMAT HIDES (left empty, as Excel shows them): {'; '.join(stats['format_hidden'])}")
    print(f"LINKS: {stats['links']} written as [text](url)" + (f", {stats['internal']} to places inside the workbook kept as text" if stats['internal'] else ''))
    print(f"TEXT BOXES: {stats['textboxes']} written after their sheet's table")
    print(f"LEFT OUT: notes {stats['notes']}, pictures {stats['pictures']}, charts {stats['charts']}, shapes without text {stats['shapes']}")
    if stats['no_value']:
        print(f"FORMULAS WITHOUT A SAVED VALUE (written empty): {', '.join(stats['no_value'])}")
    if stats['volatile']:
        print(f"FORMULAS THAT CHANGE BY THEMSELVES (the saved value is written): {', '.join(stats['volatile'])}")
    if stats['approx']:
        print(f"FORMATS TO CHECK: {'; '.join(stats['approx'])}")
    print(f"OUTPUT: {args.out}, {text.count(chr(10))} lines, {len(text.encode('utf-8'))} bytes")


if __name__ == '__main__':
    main()
