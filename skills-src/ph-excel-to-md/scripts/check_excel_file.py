#!/usr/bin/env python3
"""Find out what each Excel file really is, and turn the ones that are not .xlsx into .xlsx (read-only for the inputs).

usage: check_excel_file.py [--xlsx-dir DIR] FILE [FILE ...]

Prints one block per file. FORMAT is found from the file's content, not its name:
  xlsx       an Excel 2007+ workbook (.xlsx, .xlsm, .xltx, .xltm, also one saved with another name)
  xls        an Excel 97-2003 workbook
  xlsb       an Excel binary workbook
  excel-xml  an Excel 2003 XML workbook
  web-page   an HTML or MHTML page saved with an Excel name (many sites export "Excel" this way)
  text       text whose columns are split by tabs, semicolons or commas, saved with an Excel name
  encrypted  a password-protected workbook
  not-excel  another kind of file (a Word file, an OpenDocument spreadsheet, a PDF, ...)
  error      the file could not be read
With --xlsx-dir, LibreOffice converts an xls or xlsb file into an .xlsx in DIR, and this script itself writes the
others into an .xlsx in DIR: a web-page or text file with every cell as the text the file holds (LibreOffice
would read "007" as the number 7), a page as one sheet with its text and tables in page order and a merged cell
for each colspan or rowspan;
an excel-xml file with its cell types, number formats, merges, hidden parts and links (LibreOffice drops its
empty rows).
The XLSX line names the file to convert. CONTENT counts the sheets and filled cells of that .xlsx.

Exit code: 0 every file can be converted, 1 at least one cannot (encrypted, not-excel, error, failed
conversion), 2 LibreOffice is needed and missing.
"""
import argparse
import csv
import datetime as dt
import email
import io
import os
import re
import shutil
import subprocess
import sys
import tempfile
import zipfile
import xml.etree.ElementTree as ET
from html.parser import HTMLParser
from pathlib import Path
from xml.sax.saxutils import escape, quoteattr

INSTALL_HINT = ('LibreOffice is missing; it converts .xls and .xlsb files. Install it: macOS '
                '`brew install --cask libreoffice`; Debian or Ubuntu `sudo apt install libreoffice-calc`; Fedora '
                '`sudo dnf install libreoffice-calc`; Windows `winget install --id TheDocumentFoundation.LibreOffice`.')
NEEDS_LIBREOFFICE = ('xls', 'xlsb')
BIFF8_BOF = b'\x09\x08\x10\x00\x00\x06\x05\x00'


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


def soffice_version(soffice):
    try:
        r = subprocess.run([soffice, '--version'], capture_output=True, encoding='utf-8', errors='replace', timeout=60)
        return (r.stdout.strip().splitlines() or ['LibreOffice'])[0]
    except (OSError, subprocess.SubprocessError):
        return 'LibreOffice (version unknown)'


def decode(data):
    for bom, enc in ((b'\xef\xbb\xbf', 'utf-8'), (b'\xff\xfe', 'utf-16-le'), (b'\xfe\xff', 'utf-16-be')):
        if data.startswith(bom):
            return data[len(bom):].decode(enc, errors='replace')
    if len(data) > 3 and data[1:4:2] == b'\x00\x00' and data[0] != 0:
        return data.decode('utf-16-le', errors='replace')
    try:
        return data.decode('utf-8')
    except UnicodeDecodeError:
        return data.decode('cp1251', errors='replace')


def delimiter(text):
    lines = [ln for ln in text.splitlines()[:50] if ln.strip()]
    if not lines:
        return None
    for d in ('\t', ';', ','):
        counts = [ln.count(d) for ln in lines]
        if counts[0] and (len(lines) == 1 or sum(1 for c in counts if c) >= 0.8 * len(lines)):
            return d
    return None


def sniff(path):
    """Return (format, note)."""
    try:
        data = Path(path).read_bytes()
    except OSError as e:
        return 'error', str(e)
    if data.startswith(b'PK\x03\x04'):
        try:
            with zipfile.ZipFile(path) as z:
                names = set(z.namelist())
                mime = z.read('mimetype').decode('ascii', 'replace').strip() if 'mimetype' in names else ''
        except zipfile.BadZipFile as e:
            return 'error', f'damaged zip container: {e}'
        if 'xl/workbook.xml' in names:
            return 'xlsx', ''
        if 'xl/workbook.bin' in names:
            return 'xlsb', ''
        if 'spreadsheet' in mime:
            return 'not-excel', 'an OpenDocument spreadsheet (.ods): save it as .xlsx to convert it'
        if 'word/document.xml' in names:
            return 'not-excel', 'a Word document'
        if 'ppt/presentation.xml' in names:
            return 'not-excel', 'a PowerPoint presentation'
        return 'not-excel', 'a zip archive without an Excel workbook'
    if data.startswith(b'\xd0\xcf\x11\xe0\xa1\xb1\x1a\xe1'):
        utf16 = lambda s: s.encode('utf-16-le')
        if utf16('EncryptedPackage') in data or utf16('EncryptionInfo') in data:
            return 'encrypted', 'a password-protected workbook'
        if utf16('Workbook') in data or utf16('Book') in data:
            at = data.find(BIFF8_BOF)
            if at >= 0 and data[at + 20:at + 22] == b'\x2f\x00':
                return 'encrypted', 'a password-protected Excel 97-2003 workbook'
            return 'xls', ''
        if utf16('WordDocument') in data:
            return 'not-excel', 'a Word 97-2003 document'
        if utf16('PowerPoint Document') in data:
            return 'not-excel', 'a PowerPoint 97-2003 presentation'
        return 'not-excel', 'an OLE container without an Excel workbook'
    head = data[:4096].lstrip(b'\xef\xbb\xbf\xff\xfe\xfe\xff \t\r\n')
    text = decode(data[:65536]) if b'\x00' in head[:200] else head.decode('utf-8', 'replace')
    low = text.lstrip('\ufeff \t\r\n').lower()
    if low.startswith('%pdf'):
        return 'not-excel', 'a PDF file'
    if low.startswith('{\\rtf'):
        return 'not-excel', 'an RTF document'
    if low.startswith('mime-version') or '\nmime-version' in low[:1024]:
        return 'web-page', 'an MHTML page'
    if low.startswith('<!doctype html') or '<html' in low[:2048] or low.startswith('<table'):
        return 'web-page', 'an HTML page'
    if 'urn:schemas-microsoft-com:office:spreadsheet' in low or 'progid="excel.sheet"' in low:
        return 'excel-xml', ''
    if low.startswith('<?xml') or low.startswith('<'):
        return 'not-excel', 'an XML file that is not an Excel workbook'
    full = decode(data)
    if '\x00' not in full and delimiter(full):
        return 'text', {'\t': 'tab', ';': 'semicolon', ',': 'comma'}[delimiter(full)] + '-separated text'
    return 'not-excel', 'unknown content'


BLOCKS = {'p', 'div', 'br', 'li', 'ul', 'ol', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'section', 'article', 'header', 'footer',
          'blockquote', 'pre', 'hr', 'dl', 'dt', 'dd', 'caption', 'form', 'center', 'body', 'nav', 'main', 'figure'}


class Page(HTMLParser):
    """An HTML page in reading order: the text outside tables in blocks, and each top-level table as rows of
    [text parts, colspan, rowspan]; a table inside a table becomes text of its cell."""

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.blocks, self.depth, self.skip, self.text = [], 0, 0, []
        self.row, self.cell = None, None

    def flush(self):
        text = re.sub(r'\s+', ' ', ''.join(self.text).replace('\u00a0', ' ')).strip()
        if text:
            self.blocks.append(('text', text))
        self.text = []

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag in ('script', 'style', 'head', 'title'):
            self.skip += 1
        elif tag == 'table':
            if self.depth == 0:
                self.flush()
                self.blocks.append(('table', []))
            self.depth += 1
        elif self.depth == 0:
            if tag in BLOCKS:
                self.flush()
        elif self.depth == 1 and tag == 'tr':
            self.row = []
            self.blocks[-1][1].append(self.row)
        elif self.depth == 1 and tag in ('td', 'th') and self.row is not None:
            span = lambda k: max(1, int(re.sub(r'\D', '', a.get(k) or '1') or 1))
            self.cell = [[], span('colspan'), span('rowspan')]
            self.row.append(self.cell)
        elif self.cell is not None and tag in ('br', 'p', 'div', 'tr', 'li'):
            self.cell[0].append('\n')

    def handle_endtag(self, tag):
        if tag in ('script', 'style', 'head', 'title'):
            self.skip = max(0, self.skip - 1)
        elif tag == 'table':
            self.depth = max(0, self.depth - 1)
            if self.depth == 0:
                self.row = self.cell = None
        elif self.depth == 0:
            if tag in BLOCKS:
                self.flush()
        elif self.depth == 1 and tag in ('td', 'th'):
            self.cell = None
        elif self.cell is not None and tag in ('p', 'div', 'td', 'th'):
            self.cell[0].append('\n')

    def handle_data(self, data):
        if self.skip:
            return
        if self.depth == 0:
            self.text.append(data)
        elif self.cell is not None:
            self.cell[0].append(data)

    def close(self):
        super().close()
        self.flush()

    def cells(self):
        """One sheet: each text block in a row of its own, each table below it, an empty row around a table."""
        cells, merges, r, prev = {}, [], 0, None
        for kind, data in self.blocks:
            if kind == 'text':
                r += 2 if prev == 'table' else 1
                cells[(r, 1)] = ('text', data, None)
                prev = kind
                continue
            if not data:
                continue
            top = r + (1 if prev is not None else 0)
            taken = set()
            for i, row in enumerate(data, 1):
                rr, c = top + i, 1
                for parts, cs, rs in row:
                    while (rr, c) in taken:
                        c += 1
                    text = '\n'.join(re.sub(r'[ \t\r\n]+', ' ', ln).strip() for ln in ''.join(parts).split('\n'))
                    text = re.sub(r'\n{2,}', '\n', text).strip('\n').replace('\u00a0', ' ').strip()
                    if text:
                        cells[(rr, c)] = ('text', text, None)
                    if cs > 1 or rs > 1:
                        merges.append((rr, c, rr + rs - 1, c + cs - 1))
                    for y in range(rr, rr + rs):
                        for x in range(c, c + cs):
                            taken.add((y, x))
                    c += cs
            r, prev = top + len(data), kind
        return cells, merges


def html_text(data):
    head = data[:4096].decode('ascii', 'replace').lower()
    m = re.search(r'charset=["\']?([\w-]+)', head)
    if m and not data.startswith((b'\xef\xbb\xbf', b'\xff\xfe', b'\xfe\xff')):
        try:
            return data.decode(m.group(1), errors='replace')
        except LookupError:
            pass
    return decode(data)


def read_web_page(path):
    data = Path(path).read_bytes()
    pages = []
    if re.match(rb'\s*mime-version', data[:1024].lower()) or b'\nmime-version' in data[:1024].lower():
        msg = email.message_from_bytes(data)
        for part in msg.walk():
            if part.get_content_type() == 'text/html':
                payload = part.get_payload(decode=True) or b''
                charset = part.get_content_charset()
                pages.append(payload.decode(charset, errors='replace') if charset else html_text(payload))
    else:
        pages.append(html_text(data))
    sheets = []
    for k, page in enumerate(pages, 1):
        p = Page()
        p.feed(page)
        p.close()
        cells, merges = p.cells()
        if cells:
            name = (Path(path).stem[:31] or 'Sheet1') if len(pages) == 1 else f'Page {k}'
            sheets.append(sheet(name, cells, merges))
    return sheets


def sheet(name, cells, merges=(), state='visible', hidden_rows=(), hidden_cols=(), links=None):
    return {'name': name, 'cells': cells, 'merges': list(merges), 'state': state, 'hidden_rows': set(hidden_rows),
            'hidden_cols': set(hidden_cols), 'links': links or {}}


def read_text(path):
    text = decode(Path(path).read_bytes())
    d = delimiter(text) or '\t'
    cells = {}
    for r, row in enumerate(csv.reader(io.StringIO(text), delimiter=d), 1):
        for c, value in enumerate(row, 1):
            if value.strip():
                cells[(r, c)] = ('text', value, None)
    return [sheet(Path(path).stem[:31] or 'Sheet1', cells)]


SS = 'urn:schemas-microsoft-com:office:spreadsheet'
XL = 'urn:schemas-microsoft-com:office:excel'
NAMED_FORMATS = {'general': 'General', 'general number': 'General', 'general date': 'yyyy-mm-dd h:mm', 'short date': 'yyyy-mm-dd',
                 'long date': 'yyyy-mm-dd', 'medium date': 'dd-mmm-yy', 'long time': 'h:mm:ss', 'medium time': 'h:mm AM/PM',
                 'short time': 'h:mm', 'fixed': '0.00', 'standard': '#,##0.00', 'percent': '0.00%', 'scientific': '0.00E+00',
                 'currency': '"$"#,##0.00_);\\("$"#,##0.00\\)', 'euro currency': '[$\u20ac-2]\\ #,##0.00',
                 'yes/no': '"Yes";"Yes";"No"', 'true/false': '"True";"True";"False"', 'on/off': '"On";"On";"Off"'}


def read_excel_xml(path):
    """The worksheets of an Excel 2003 XML workbook with cell types, formats, merges, hidden parts and links."""
    root = ET.fromstring(Path(path).read_bytes())

    def a(el, key):
        return None if el is None else el.get(f'{{{SS}}}{key}')
    styles = {}
    for st in root.iter(f'{{{SS}}}Style'):
        styles[a(st, 'ID')] = (a(st, 'Parent'), a(st.find(f'{{{SS}}}NumberFormat'), 'Format'))

    def code(sid):
        seen = set()
        while sid and sid not in seen:
            seen.add(sid)
            parent, fmt = styles.get(sid, (None, None))
            if fmt:
                fmt = re.sub(r'^\[[A-Z]{3}\]', '', fmt)  # Excel 2003 XML marks some codes with a language, e.g. [ENG]
                return NAMED_FORMATS.get(fmt.lower(), fmt)
            sid = parent
        return None
    d1904 = root.find(f'.//{{{XL}}}Date1904') is not None
    base = dt.datetime(1904, 1, 1) if d1904 else dt.datetime(1899, 12, 30)
    default = code('Default')
    sheets = []
    for ws in root.iter(f'{{{SS}}}Worksheet'):
        vis = ws.find(f'{{{XL}}}WorksheetOptions/{{{XL}}}Visible')
        state = {'SheetHidden': 'hidden', 'SheetVeryHidden': 'veryHidden'}.get((vis.text or '').strip() if vis is not None else '', 'visible')
        cells, merges, hidden_rows, hidden_cols, links = {}, [], set(), set(), {}
        table = ws.find(f'{{{SS}}}Table')
        rows = [] if table is None else table
        c = 0
        for col in (table.iter(f'{{{SS}}}Column') if table is not None else []):
            c = int(a(col, 'Index') or c + 1)
            span = int(a(col, 'Span') or 0)
            if a(col, 'Hidden') in ('1', 'true'):
                hidden_cols.update(range(c, c + span + 1))
            c += span
        r = 0
        for row in rows:
            if row.tag != f'{{{SS}}}Row':
                continue
            r = int(a(row, 'Index') or r + 1)
            if a(row, 'Hidden') in ('1', 'true'):
                hidden_rows.add(r)
            c = 0
            for cell in row.iter(f'{{{SS}}}Cell'):
                c = int(a(cell, 'Index') or c + 1)
                across, down = int(a(cell, 'MergeAcross') or 0), int(a(cell, 'MergeDown') or 0)
                if across or down:
                    merges.append((r, c, r + down, c + across))
                fmt = code(a(cell, 'StyleID')) or default
                url = a(cell, 'HRef')
                m = re.match(r'=\s*HYPERLINK\(\s*"((?:[^"]|"")*)"', a(cell, 'Formula') or '', re.I)
                if m:
                    url = m.group(1).replace('""', '"')
                if url and not url.startswith('#'):
                    links[(r, c)] = url
                data = cell.find(f'{{{SS}}}Data')
                if data is not None:
                    cells[(r, c)] = excel_xml_value(a(data, 'Type') or 'String', ''.join(data.itertext()), fmt, base, d1904)
                c += across
        sheets.append(sheet(a(ws, 'Name') or f'Sheet{len(sheets) + 1}', cells, merges, state, hidden_rows, hidden_cols, links))
    return sheets, d1904


def excel_xml_value(kind, text, fmt, base, d1904):
    if kind == 'Number':
        try:
            return 'number', float(text), fmt
        except ValueError:
            return 'text', text, None
    if kind == 'DateTime':
        m = re.match(r'(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}):(\d{2})(\.\d+)?)?', text.strip())
        if not m:
            return 'text', text, None
        y, mo, d, hh, mi, ss = (int(g or 0) for g in m.groups()[:6])
        seconds = hh * 3600 + mi * 60 + ss + float(m.group(7) or 0)
        if (y, mo, d) == (1900, 2, 29) and not d1904:
            return 'number', 60 + seconds / 86400, fmt
        try:
            day = dt.datetime(y, mo, d)
        except ValueError:
            return 'text', text, None
        days = (day - base).days + seconds / 86400
        if not d1904 and day < dt.datetime(1900, 3, 1):
            days -= 1
        return 'number', days, fmt
    if kind == 'Boolean':
        return 'bool', text.strip() in ('1', 'true'), None
    if kind == 'Error':
        return 'error', text, None
    return 'text', text, fmt if fmt and '@' in fmt else None


def col_letters(n):
    s = ''
    while n:
        n, r = divmod(n - 1, 26)
        s = chr(65 + r) + s
    return s


def write_xlsx(sheets, target, date1904=False):
    """A minimal .xlsx: text as inline strings, numbers with their format codes, merges, hidden parts and links."""
    ns = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'
    rel = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'
    pkg = 'http://schemas.openxmlformats.org/package/2006/relationships'
    used, parts, entries, rels, ct, fmts = set(), {}, [], [], [], {}
    for i, sh in enumerate(sheets, 1):
        name = re.sub(r'[\[\]:*?/\\]', ' ', sh['name'])[:31] or f'Sheet{i}'
        while name in used:
            name = f'{name[:28]} {i}'
        used.add(name)
        rows = {}
        for (r, c), (kind, value, fmt) in sorted(sh['cells'].items()):
            ref = f'{col_letters(c)}{r}'
            s = f' s="{fmts.setdefault(fmt, len(fmts) + 1)}"' if fmt and fmt != 'General' else ''
            if kind == 'number':
                xml = f'<c r="{ref}"{s}><v>{repr(value)}</v></c>'
            elif kind == 'bool':
                xml = f'<c r="{ref}"{s} t="b"><v>{int(value)}</v></c>'
            elif kind == 'error':
                xml = f'<c r="{ref}"{s} t="e"><v>{escape(value)}</v></c>'
            else:
                space = ' xml:space="preserve"' if value != value.strip() or '\n' in value else ''
                xml = f'<c r="{ref}"{s} t="inlineStr"><is><t{space}>{escape(value)}</t></is></c>'
            rows.setdefault(r, []).append(xml)
        for r in sh['hidden_rows']:
            rows.setdefault(r, [])
        body = ''.join(f'<row r="{r}"' + (' hidden="1"' if r in sh['hidden_rows'] else '') + '>' + ''.join(cells) + '</row>' for r, cells in sorted(rows.items()))
        cols = ''.join(f'<col min="{c}" max="{c}" width="9" hidden="1" customWidth="1"/>' for c in sorted(sh['hidden_cols']))
        merge = ''.join(f'<mergeCell ref="{col_letters(c1)}{r1}:{col_letters(c2)}{r2}"/>' for r1, c1, r2, c2 in sh['merges'])
        links, link_rels = '', []
        for k, ((r, c), url) in enumerate(sorted(sh['links'].items()), 1):
            links += f'<hyperlink ref="{col_letters(c)}{r}" r:id="rIdL{k}"/>'
            link_rels.append(f'<Relationship Id="rIdL{k}" Type="{rel}/hyperlink" Target={quoteattr(url)} TargetMode="External"/>')
        parts[f'xl/worksheets/sheet{i}.xml'] = (f'<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<worksheet xmlns="{ns}" xmlns:r="{rel}">'
                                                + (f'<cols>{cols}</cols>' if cols else '') + f'<sheetData>{body}</sheetData>'
                                                + (f'<mergeCells count="{len(sh["merges"])}">{merge}</mergeCells>' if merge else '')
                                                + (f'<hyperlinks>{links}</hyperlinks>' if links else '') + '</worksheet>')
        if link_rels:
            parts[f'xl/worksheets/_rels/sheet{i}.xml.rels'] = (f'<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="{pkg}">'
                                                               + ''.join(link_rels) + '</Relationships>')
        state = '' if sh['state'] == 'visible' else f' state="{sh["state"]}"'
        entries.append(f'<sheet name={quoteattr(name)} sheetId="{i}"{state} r:id="rId{i}"/>')
        rels.append(f'<Relationship Id="rId{i}" Type="{rel}/worksheet" Target="worksheets/sheet{i}.xml"/>')
        ct.append(f'<Override PartName="/xl/worksheets/sheet{i}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>')
    rels.append(f'<Relationship Id="rId{len(sheets) + 1}" Type="{rel}/styles" Target="styles.xml"/>')
    numfmts = ''.join(f'<numFmt numFmtId="{163 + k}" formatCode={quoteattr(code)}/>' for code, k in fmts.items())
    xfs = '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>' + ''.join(
        f'<xf numFmtId="{163 + k}" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>' for k in fmts.values())
    parts['xl/styles.xml'] = (f'<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<styleSheet xmlns="{ns}">'
                              + (f'<numFmts count="{len(fmts)}">{numfmts}</numFmts>' if fmts else '')
                              + '<fonts count="1"><font><sz val="11"/><name val="Calibri"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/>'
                              '</fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/>'
                              '</border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>'
                              f'<cellXfs count="{len(fmts) + 1}">{xfs}</cellXfs></styleSheet>')
    pr = '<workbookPr date1904="1"/>' if date1904 else ''
    parts['xl/workbook.xml'] = f'<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<workbook xmlns="{ns}" xmlns:r="{rel}">{pr}<sheets>{"".join(entries)}</sheets></workbook>'
    parts['xl/_rels/workbook.xml.rels'] = f'<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="{pkg}">' + ''.join(rels) + '</Relationships>'
    parts['_rels/.rels'] = (f'<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="{pkg}">'
                            f'<Relationship Id="rId1" Type="{rel}/officeDocument" Target="xl/workbook.xml"/></Relationships>')
    parts['[Content_Types].xml'] = ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
                                    '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
                                    '<Default Extension="xml" ContentType="application/xml"/>'
                                    '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'
                                    '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>'
                                    + ''.join(ct) + '</Types>')
    with zipfile.ZipFile(target, 'w', zipfile.ZIP_DEFLATED) as z:
        for name in ['[Content_Types].xml', '_rels/.rels'] + sorted(k for k in parts if k not in ('[Content_Types].xml', '_rels/.rels')):
            z.writestr(name, parts[name].encode('utf-8'))


def free_target(out_dir, stem):
    out_dir.mkdir(parents=True, exist_ok=True)
    target, k = out_dir / (stem + '.xlsx'), 2
    while target.exists():
        target = out_dir / f'{stem}-{k}.xlsx'
        k += 1
    return target


def convert(soffice, path, fmt, out_dir):
    """Convert one file into DIR/<name>.xlsx with LibreOffice; return (xlsx path or None, note)."""
    target = free_target(out_dir, Path(path).stem)
    with tempfile.TemporaryDirectory() as tmp:
        work = Path(tmp) / 'in'
        work.mkdir()
        copy = work / ('source' + ('.xlsb' if fmt == 'xlsb' else '.xls'))
        shutil.copyfile(path, copy)
        cmd = [soffice, f'-env:UserInstallation={(Path(tmp) / "profile").as_uri()}', '--headless']
        cmd += ['--convert-to', 'xlsx:Calc MS Excel 2007 XML', '--outdir', str(Path(tmp) / 'out'), str(copy)]
        try:
            r = subprocess.run(cmd, capture_output=True, encoding='utf-8', errors='replace', timeout=300)
        except subprocess.TimeoutExpired:
            return None, 'LibreOffice did not finish within 5 minutes'
        produced = Path(tmp) / 'out' / 'source.xlsx'
        if not produced.exists():
            why = (r.stderr or r.stdout or '').strip().splitlines()
            return None, 'LibreOffice could not convert it (encrypted or damaged?): ' + (why[-1] if why else 'no output')
        shutil.move(str(produced), target)
    if fmt == 'xls':
        neutral_short_dates(target)
    return target, ''


def neutral_short_dates(xlsx):
    """LibreOffice writes Excel's short date (the computer's date format) as [$-409]m/d/yyyy: make it yyyy-mm-dd."""
    with zipfile.ZipFile(xlsx) as z:
        items = [(info, z.read(info.filename)) for info in z.infolist()]
    with zipfile.ZipFile(xlsx, 'w', zipfile.ZIP_DEFLATED) as z:
        for info, data in items:
            if info.filename == 'xl/styles.xml':
                data = re.sub(rb'formatCode="(?:\[\$-409\])?(?:m/d/yyyy|MM/DD/YYYY)"', b'formatCode="yyyy-mm-dd"', data)
                data = re.sub(rb'formatCode="(?:\[\$-409\])?(?:m/d/yyyy|MM/DD/YYYY)(?:\\| )+(?:h:mm|HH:MM)"', b'formatCode="yyyy-mm-dd h:mm"', data)
            z.writestr(info, data)


def content(xlsx):
    with zipfile.ZipFile(xlsx) as z:
        sheets = [n for n in z.namelist() if re.match(r'xl/worksheets/[^/]+\.xml$', n)]
        filled = sum(len(re.findall(rb'<c\b[^>]*>(?:(?!</c>).)*?<(?:v|is)\b', z.read(n), re.S)) for n in sheets)
        charts = sum(1 for n in z.namelist() if re.match(r'xl/charts/chart\d+\.xml$', n))
        pictures = sum(1 for n in z.namelist() if n.startswith('xl/media/'))
    return len(sheets), filled, charts, pictures


def main():
    ap = argparse.ArgumentParser(description='Find out what each Excel file really is.')
    ap.add_argument('files', nargs='+')
    ap.add_argument('--xlsx-dir', help='folder for the .xlsx files made from the other formats')
    args = ap.parse_args()
    soffice = find_soffice()
    found = [(f, *sniff(f)) for f in args.files]
    needs = any(fmt in NEEDS_LIBREOFFICE for _, fmt, _ in found)
    print(f'LIBREOFFICE: {soffice_version(soffice)} ({soffice})' if soffice else 'LIBREOFFICE: not found')
    status = 0
    for path, fmt, note in found:
        print(f'\nFILE: {path}')
        print(f'FORMAT: {fmt}' + (f' ({note})' if note else ''))
        xlsx = path if fmt == 'xlsx' else None
        if fmt in ('web-page', 'text', 'excel-xml'):
            if not args.xlsx_dir:
                print('NEXT: run this again with --xlsx-dir DIR to write it into an .xlsx')
                continue
            try:
                if fmt == 'excel-xml':
                    sheets, d1904 = read_excel_xml(path)
                else:
                    sheets, d1904 = (read_web_page(path) if fmt == 'web-page' else read_text(path)), False
            except (OSError, ValueError, csv.Error, ET.ParseError) as e:
                print(f'NOTE: the file could not be read: {e}')
                status = max(status, 1)
                continue
            if not sheets:
                print('NOTE: the file holds no table with text')
                status = max(status, 1)
                continue
            xlsx = free_target(Path(args.xlsx_dir), Path(path).stem)
            write_xlsx(sheets, xlsx, d1904)
        elif fmt in NEEDS_LIBREOFFICE:
            if not soffice:
                print('NEXT: install LibreOffice, then run this again with --xlsx-dir')
                status = max(status, 2)
                continue
            if not args.xlsx_dir:
                print('NEXT: run this again with --xlsx-dir DIR to convert it into an .xlsx')
                continue
            xlsx, why = convert(soffice, path, fmt, Path(args.xlsx_dir))
            if xlsx is None:
                print(f'NOTE: {why}')
                status = max(status, 1)
                continue
        if fmt in ('encrypted', 'not-excel', 'error'):
            status = max(status, 1)
            continue
        print(f'XLSX: {xlsx}')
        try:
            n, filled, charts, pictures = content(xlsx)
        except (zipfile.BadZipFile, KeyError) as e:
            print(f'NOTE: the .xlsx could not be read: {e}')
            status = max(status, 1)
            continue
        print(f'CONTENT: {n} sheets, {filled} cells with a value, {charts} charts, {pictures} pictures')
    if needs and not soffice:
        print('\n' + INSTALL_HINT, file=sys.stderr)
    sys.exit(status)


if __name__ == '__main__':
    main()
