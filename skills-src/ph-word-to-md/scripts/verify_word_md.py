#!/usr/bin/env python3
"""Check that a Markdown file holds the words, list numbers, table cells and notes of a .docx (read-only).

usage: verify_word_md.py [--no-libreoffice] FILE.docx OUT.md

The .docx is read here on its own, without the converter's code. Compared, in the document's order:
  every word (tracked changes accepted; comments, hidden text, headers, footers and the automatic table
  of contents left out, as the conversion rules say; a text box's words after the paragraph that holds it);
  list numbers: a second reading by LibreOffice gives the number Word shows for each numbered paragraph
  (LIST NUMBERS says when LibreOffice is missing and the numbers had one reader);
  table cells, row by row; footnotes and endnotes, by their place in the text.
Markdown syntax (headings, list markers, emphasis, links, escapes, <br>) is not compared.

Output: MISSING, EXTRA, CHARACTERS, NUMBERS, TABLE ROWS and NOTES list each difference with its Markdown
line; RESULT is PASS when there is none. Exit code 0 PASS, 1 FAIL, 2 a file could not be read.
"""
import argparse
import difflib
import os
import posixpath
import re
import shutil
import subprocess
import sys
import tempfile
import unicodedata
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path

W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'
R = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'
MC = 'http://schemas.openxmlformats.org/markup-compatibility/2006'
M = 'http://schemas.openxmlformats.org/officeDocument/2006/math'
STRICT = {b'http://purl.oclc.org/ooxml/wordprocessingml/main': W.encode(),
          b'http://purl.oclc.org/ooxml/officeDocument/relationships': R.encode(),
          b'http://purl.oclc.org/ooxml/officeDocument/math': M.encode()}
LABEL = re.compile(r'^\(?[0-9A-Za-z\u0400-\u04ff]{1,6}(?:[.)][0-9A-Za-z\u0400-\u04ff]{1,6})*[.)]$|^\d{1,4}(?:\.\d{1,4})+$')
FOLD = str.maketrans({**dict.fromkeys('\u2018\u2019\u02bb\u02bc\u2032\u00b4`', "'"), **dict.fromkeys('\u201c\u201d\u201e\u00ab\u00bb', '"'),
                      **dict.fromkeys('\u2010\u2011\u2012\u2013\u2014\u2212', '-')})
SYMBOLS = {0xF0B7: '\u2022', 0xF0A7: '\u25aa', 0xF076: '\u2756', 0xF0D8: '\u27a2', 0xF0FC: '\u2713', 0xF0FB: '\u2717',
           0xF0FD: '\u2612', 0xF0FE: '\u2611', 0xF06F: '\u25a1', 0xF0A8: '\u25a1', 0xF0E0: '\u2192', 0xF0E8: '\u2192', 0xF02D: '-'}
REF, LAB = '\x00ref', '\x00label'


def q(tag, ns=W):
    return f'{{{ns}}}{tag}'


def attr(el, name='val'):
    return None if el is None else el.get(q(name))


def on(props, name):
    el = None if props is None else props.find(q(name))
    return None if el is None else attr(el) not in ('0', 'false', 'off', 'none')


def load(z, name):
    data = z.read(name)
    for a, b in STRICT.items():
        data = data.replace(a, b)
    return ET.fromstring(data)


def is_word(token):
    return any(ch.isalnum() for ch in token)


# ---------------- the document ----------------
class Document:
    """An independent reading of the .docx: blocks of tokens in order, tables, notes."""

    def __init__(self, path):
        self.z = zipfile.ZipFile(path)
        names = set(self.z.namelist())
        main = 'word/document.xml'
        if '_rels/.rels' in names:
            for rel in load(self.z, '_rels/.rels'):
                if rel.get('Type', '').endswith('/officeDocument'):
                    main = (rel.get('Target') or main).lstrip('/')
        base = posixpath.dirname(main)
        relname = posixpath.join(base, '_rels', posixpath.basename(main) + '.rels')
        parts = {}
        if relname in names:
            for rel in load(self.z, relname):
                if rel.get('TargetMode') != 'External':
                    kind = rel.get('Type', '').rsplit('/', 1)[-1]
                    parts.setdefault(kind, posixpath.normpath(posixpath.join(base, rel.get('Target', ''))))
        part = lambda kind: load(self.z, parts[kind]) if kind in parts and parts[kind] in names else None
        self.style = {}
        styles = part('styles')
        self.default_style = None
        for s in (styles.findall(q('style')) if styles is not None else []):
            ppr, rpr = s.find(q('pPr')), s.find(q('rPr'))
            npr = ppr.find(q('numPr')) if ppr is not None else None
            self.style[s.get(q('styleId'))] = {
                'name': (attr(s.find(q('name'))) or '').lower(), 'based': attr(s.find(q('basedOn'))),
                'numId': attr(npr.find(q('numId'))) if npr is not None else None,
                'ilvl': attr(npr.find(q('ilvl'))) if npr is not None else None, 'vanish': on(rpr, 'vanish')}
            if s.get(q('type')) == 'paragraph' and s.get(q('default')) in ('1', 'true', 'on'):
                self.default_style = s.get(q('styleId'))
        self.formats = {}
        numbering = part('numbering')
        if numbering is not None:
            abstract = {}
            for a in numbering.findall(q('abstractNum')):
                levels = {lv.get(q('ilvl')): (attr(lv.find(q('numFmt'))) or 'decimal', attr(lv.find(q('lvlText'))) or '') for lv in a.findall(q('lvl'))}
                abstract[a.get(q('abstractNumId'))] = (levels, attr(a.find(q('numStyleLink'))))
            nums = {n.get(q('numId')): n for n in numbering.findall(q('num'))}
            for nid, n in nums.items():
                aid = attr(n.find(q('abstractNumId')))
                levels, link = abstract.get(aid, ({}, None))
                if link:
                    linked = self.style_get(link, 'numId')
                    if linked in nums:
                        levels = abstract.get(attr(nums[linked].find(q('abstractNumId'))), ({}, None))[0]
                levels = dict(levels)
                for o in n.findall(q('lvlOverride')):
                    lv = o.find(q('lvl'))
                    if lv is not None:
                        levels[o.get(q('ilvl'))] = (attr(lv.find(q('numFmt'))) or 'decimal', attr(lv.find(q('lvlText'))) or '')
                self.formats[nid] = levels
        self.notes = {}
        for kind, tag in (('footnotes', 'footnote'), ('endnotes', 'endnote')):
            root = part(kind)
            for n in (root.findall(q(tag)) if root is not None else []):
                if n.get(q('type')) in (None, 'normal'):
                    self.notes[(tag, n.get(q('id')))] = n
        self.fields = []
        self.blocks = []        # each: dict(kind, tokens, label, place)
        self.tables = []        # list of rows of cell token lists
        self.note_order = []    # (tag, id) in order of first reference
        body = load(self.z, main).find(q('body'))
        if body is None:
            raise KeyError('no document body')
        self.walk_blocks(body, self.blocks)

    def style_get(self, sid, key):
        seen = set()
        while sid in self.style and sid not in seen:
            seen.add(sid)
            if self.style[sid][key] is not None:
                return self.style[sid][key]
            sid = self.style[sid]['based']
        return None

    def numbered(self, p, sid):
        """'number', 'bullet' or None for a paragraph."""
        ppr = p.find(q('pPr'))
        npr = ppr.find(q('numPr')) if ppr is not None else None
        nid = attr(npr.find(q('numId'))) if npr is not None else None
        ilvl = attr(npr.find(q('ilvl'))) if npr is not None else None
        if nid is None:
            nid = self.style_get(sid, 'numId')
            ilvl = ilvl if ilvl is not None else self.style_get(sid, 'ilvl')
        if nid in (None, '0') or nid not in self.formats:
            return None
        levels = self.formats[nid]
        if ilvl is None:
            ilvl = next((k for k, v in levels.items() if False), '0')
        fmt, text = levels.get(ilvl or '0', ('decimal', ''))
        if fmt == 'bullet':
            return 'bullet'
        shown = re.sub(r'%[1-9]', '' if fmt == 'none' else '0', text).strip()
        return 'number' if shown else None

    # ----- text of one paragraph -----
    def para_tokens(self, p, sid, boxes, toc):
        pieces = []
        self.collect(p, sid, pieces, boxes, toc, None)
        text = ''.join(pieces)
        return text

    def hidden(self, r, sid):
        rpr = r.find(q('rPr'))
        hide = on(rpr, 'vanish')
        if hide is None and rpr is not None:
            rs = attr(rpr.find(q('rStyle')))
            if rs:
                hide = self.style_get(rs, 'vanish')
        if hide is None:
            hide = self.style_get(sid, 'vanish')
        return bool(hide)

    def collect(self, el, sid, out, boxes, toc, _):
        for c in el:
            tag = c.tag
            if tag in (q('del'), q('moveFrom'), q('pPr'), q('rPr'), q('sdtPr'), q('Fallback', MC)):
                continue
            if tag == q('r'):
                hidden = self.hidden(c, sid)
                for d in c:
                    self.run_child(d, hidden, out, boxes, toc)
                continue
            if tag == q('fldSimple'):
                instr = (c.get(q('instr')) or '').split()
                if instr and instr[0].upper() == 'TOC':
                    toc[0] = True
                    continue
            if tag in (q('oMath', M), q('oMathPara', M)):
                if not self.quiet():
                    out.append(' ' + ' '.join(re.findall(r'\w+', ' '.join(t.text or '' for t in c.iter(q('t', M))))) + ' ')
                continue
            self.collect(c, sid, out, boxes, toc, None)

    def quiet(self):
        return any(f['phase'] == 'instr' or f['toc'] for f in self.fields)

    def run_child(self, d, hidden, out, boxes, toc):
        tag = d.tag
        if tag == q('fldChar'):
            kind = d.get(q('fldCharType'))
            if kind == 'begin':
                self.fields.append({'phase': 'instr', 'code': '', 'toc': False, 'ff': d.find(q('ffData'))})
            elif kind == 'separate' and self.fields:
                f = self.fields[-1]
                f['phase'] = 'result'
                f['toc'] = f['code'].split()[:1] == ['TOC']
            elif kind == 'end' and self.fields:
                f = self.fields.pop()
                if f['code'].split()[:1] == ['FORMCHECKBOX'] and not self.quiet():
                    box = f['ff'].find(q('checkBox')) if f['ff'] is not None else None
                    checked = on(box, 'checked') if box is not None else None
                    if checked is None and box is not None:
                        checked = attr(box.find(q('default'))) in ('1', 'true', 'on')
                    out.append('\u2612' if checked else '\u2610')
                if f['toc'] or f['code'].split()[:1] == ['TOC']:
                    toc[0] = True
            return
        if tag == q('instrText'):
            if self.fields and self.fields[-1]['phase'] == 'instr':
                self.fields[-1]['code'] += (d.text or '').upper()
            return
        if any(f['toc'] for f in self.fields):
            toc[0] = True
        if self.quiet():
            return
        if tag in (q('footnoteReference'), q('endnoteReference')):
            key = ('footnote' if tag == q('footnoteReference') else 'endnote', d.get(q('id')))
            if key not in self.note_order:
                self.note_order.append(key)
            out.append(f' {REF}{self.note_order.index(key)} ')
            return
        if tag in (q('drawing'), q('pict'), q('AlternateContent', MC)):
            self.find_boxes(d, boxes)
            return
        if hidden:
            return
        if tag == q('t'):
            out.append(d.text or '')
        elif tag in (q('tab'), q('ptab'), q('br'), q('cr')):
            out.append(' ')
        elif tag == q('noBreakHyphen'):
            out.append('-')
        elif tag == q('sym'):
            code = int(attr(d, 'char') or '0', 16)
            out.append(SYMBOLS.get(code, chr(code) if code < 0xF000 else chr(code - 0xF000)))

    def find_boxes(self, el, boxes):
        for c in el:
            if c.tag == q('Fallback', MC):
                continue
            if c.tag == q('txbxContent'):
                boxes.append(c)
                continue
            self.find_boxes(c, boxes)

    # ----- blocks -----
    def toc_style(self, sid):
        name = self.style[sid]['name'] if sid in self.style else ''
        return name == 'toc heading' or re.fullmatch(r'toc [1-9]', name) is not None

    def paragraph(self, p, out):
        ppr = p.find(q('pPr'))
        sid = attr(ppr.find(q('pStyle'))) if ppr is not None else None
        sid = sid if sid in self.style else self.default_style
        boxes, toc = [], [any(f['toc'] for f in self.fields)]
        text = self.para_tokens(p, sid, boxes, toc)
        if not (toc[0] or self.toc_style(sid)):
            kind = self.numbered(p, sid)
            tokens = text.split()
            if tokens or kind == 'number':
                out.append({'tokens': tokens, 'kind': kind})
        for box in boxes:
            self.walk_blocks(box, out)

    def walk_blocks(self, container, out, in_cell=False):
        for c in container:
            tag = c.tag
            if tag == q('p'):
                self.paragraph(c, out)
            elif tag == q('tbl') and in_cell:
                for tr in self.rows_of(c):
                    row = []
                    for tc in self.cells_of(tr):
                        inner = []
                        self.walk_blocks(tc, inner, in_cell=True)
                        row += [t for b in inner for t in b.get('tokens', [])]
                    if row:
                        out.append({'tokens': row, 'kind': None})
            elif tag == q('tbl'):
                self.table(c, out)
            elif tag == q('sdt'):
                gallery = c.find(f'{q("sdtPr")}/{q("docPartObj")}/{q("docPartGallery")}')
                if gallery is not None and (attr(gallery) or '').lower().startswith('table of contents'):
                    continue
                content = c.find(q('sdtContent'))
                if content is not None:
                    self.walk_blocks(content, out, in_cell)
            elif tag == q('customXml'):
                self.walk_blocks(c, out, in_cell)
            elif tag == q('AlternateContent', MC):
                choice = c.find(q('Choice', MC))
                if choice is not None:
                    self.walk_blocks(choice, out, in_cell)

    def rows_of(self, tbl):
        for c in tbl:
            if c.tag == q('tr'):
                yield c
            elif c.tag in (q('sdt'), q('customXml')):
                inner = c.find(q('sdtContent')) if c.tag == q('sdt') else c
                if inner is not None:
                    yield from self.rows_of(inner)

    def cells_of(self, tr):
        for c in tr:
            if c.tag == q('tc'):
                yield c
            elif c.tag in (q('sdt'), q('customXml')):
                inner = c.find(q('sdtContent')) if c.tag == q('sdt') else c
                if inner is not None:
                    yield from self.cells_of(inner)

    def table(self, tbl, out):
        trs = [tr for tr in self.rows_of(tbl) if not (tr.find(q('trPr')) is not None and tr.find(q('trPr')).find(q('del')) is not None)]
        if len(trs) == 1 and len(list(self.cells_of(trs[0]))) == 1:
            self.walk_blocks(next(self.cells_of(trs[0])), out, in_cell=True)
            return
        rows = []
        for tr in trs:
            row = []
            trpr = tr.find(q('trPr'))
            before = trpr.find(q('gridBefore')) if trpr is not None else None
            row += [[]] * int(attr(before) or 0) if before is not None else []
            for tc in self.cells_of(tr):
                tcpr = tc.find(q('tcPr'))
                span_el = tcpr.find(q('gridSpan')) if tcpr is not None else None
                span = int(attr(span_el) or 1) if span_el is not None else 1
                vm = tcpr.find(q('vMerge')) if tcpr is not None else None
                hm = tcpr.find(q('hMerge')) if tcpr is not None else None
                blocks = []
                self.walk_blocks(tc, blocks, in_cell=True)
                cont = (vm is not None and attr(vm) in (None, 'continue')) or (hm is not None and attr(hm) in (None, 'continue'))
                cell = [] if cont else blocks
                row.append(cell)
                row += [[]] * (span - 1)
            after = trpr.find(q('gridAfter')) if trpr is not None else None
            row += [[]] * int(attr(after) or 0) if after is not None else []
            rows.append(row)
        width = max(len(r) for r in rows) if rows else 0
        rows = [r + [[]] * (width - len(r)) for r in rows]
        self.tables.append(rows)
        out.append({'table': len(self.tables) - 1})

    def note_blocks(self, key):
        blocks = []
        note = self.notes.get(key)
        if note is not None:
            self.walk_blocks(note, blocks)
        return blocks


# ---------------- LibreOffice's reading of the list numbers ----------------
def find_soffice():
    for name in ('soffice', 'libreoffice'):
        if shutil.which(name):
            return shutil.which(name)
    for path in ('/Applications/LibreOffice.app/Contents/MacOS/soffice',
                 r'C:\Program Files\LibreOffice\program\soffice.exe', r'C:\Program Files (x86)\LibreOffice\program\soffice.exe'):
        if os.path.exists(path):
            return path
    return None


def libreoffice_lines(docx):
    """LibreOffice's own renderings of the document as lists of text pieces: its Markdown export (list numbers
    of body paragraphs) and its text export (also the numbers of numbered headings); and its version."""
    soffice = find_soffice()
    if not soffice:
        return [], None
    version = subprocess.run([soffice, '--version'], capture_output=True, encoding='utf-8', errors='replace').stdout.strip().split(' ')[:2]
    readings = []
    with tempfile.TemporaryDirectory() as tmp:
        src = Path(tmp) / 'source.docx'
        shutil.copyfile(docx, src)
        for target, ext in (('md', '.md'), ('txt:Text (encoded):UTF8', '.txt')):
            cmd = [soffice, f'-env:UserInstallation={(Path(tmp) / "profile").as_uri()}', '--headless', '--convert-to', target,
                   '--outdir', str(Path(tmp) / 'out'), str(src)]
            try:
                subprocess.run(cmd, capture_output=True, timeout=300)
            except subprocess.SubprocessError:
                continue
            out = Path(tmp) / 'out' / ('source' + ext)
            if out.exists():
                text = out.read_text(encoding='utf-8', errors='replace').lstrip('\ufeff')
                pieces = []
                for line in text.split('\n'):
                    if line.lstrip().startswith('|'):
                        for cell in re.split(r'(?<!\\)\|', line.strip())[1:-1]:
                            pieces += cell.split('<br>')
                    else:
                        pieces += line.split('\t')
                readings.append(pieces)
    return readings, ' '.join(version)


def plain(text):
    """Letters and digits of a text, lower case: for matching a paragraph against another reading."""
    text = re.sub(r'<[^>]+>', ' ', text)
    text = re.sub(r'\[([^\]]*)\]\([^)]*\)', r'\1', text)
    return ''.join(ch for ch in unicodedata.normalize('NFC', text).lower() if ch.isalnum())


def lo_labels(pieces):
    out = []
    for piece in pieces:
        s = re.sub(r'^\s*(#{1,6}\s+)?', '', piece).replace('\\', '')
        tokens = s.split()
        if not tokens:
            continue
        if tokens[0] in ('-', '*', '+', '\u2022', '\u25e6', '\u25aa', '\u2013'):
            out.append((None, plain(' '.join(tokens[1:]))))
        elif LABEL.match(tokens[0]):
            out.append((tokens[0], plain(' '.join(tokens[1:]))))
        else:
            out.append((None, plain(s)))
    return out


# ---------------- the Markdown ----------------
def md_clean(text):
    """Markdown inline syntax removed; footnote references become REF tokens."""
    text = re.sub(r'`([^`]*)`', lambda m: ' ' + ' '.join(re.findall(r'\w+', m.group(1))) + ' ', text)
    text = re.sub(r'(?<!\\)\[\^([^\]]+)\]', lambda m: f' {REF}{m.group(1)} ', text)
    text = re.sub(r'(?<!\\)\[((?:\\.|[^\]\\])*)\]\((?:[^()\\]|\\.)*\)', r'\1', text)
    text = re.sub(r'<br\s*/?>', ' ', text, flags=re.I)
    text = re.sub(r'(?<!\\)\*', '', text)
    text = re.sub(r'\\(.)', r'\1', text)
    return text


def md_blocks(md):
    """Blocks of the Markdown: dict(kind, lines) for paragraphs, list items, headings, tables, note definitions."""
    lines = md.split('\n')
    blocks, i = [], 0
    while i < len(lines):
        line = lines[i]
        if not line.strip():
            i += 1
            continue
        m = re.match(r'^\[\^([^\]]+)\]:\s?(.*)$', line)
        if m:
            parts, j = [(i + 1, m.group(2))], i + 1
            while j < len(lines) and (not lines[j].strip() or lines[j].startswith('    ')):
                if lines[j].strip():
                    parts.append((j + 1, lines[j].strip()))
                j += 1
            blocks.append({'kind': 'note', 'label': m.group(1), 'parts': parts})
            i = j
            continue
        if line.lstrip().startswith('|'):
            rows, j = [], i
            while j < len(lines) and lines[j].lstrip().startswith('|'):
                if not re.fullmatch(r'\s*\|(\s*:?-+:?\s*\|)+\s*', lines[j]):
                    rows.append((j + 1, [c.strip() for c in re.split(r'(?<!\\)\|', lines[j].strip())[1:-1]]))
                j += 1
            blocks.append({'kind': 'table', 'rows': rows})
            i = j
            continue
        if re.match(r'^\s*[-+*]\s+', line):
            blocks.append({'kind': 'item', 'parts': [(i + 1, re.sub(r'^\s*[-+*]\s+', '', line))]})
            i += 1
            continue
        if re.match(r'^#{1,6}\s', line):
            blocks.append({'kind': 'heading', 'parts': [(i + 1, re.sub(r'^#{1,6}\s+', '', line))]})
            i += 1
            continue
        parts, j = [], i
        while j < len(lines) and lines[j].strip() and not lines[j].lstrip().startswith('|') and not re.match(r'^\s*[-+*]\s+', lines[j]) \
                and not re.match(r'^#{1,6}\s', lines[j]) and not re.match(r'^\[\^[^\]]+\]:', lines[j]):
            parts.append((j + 1, re.sub(r'(?<!\\)\\$', '', lines[j].rstrip())))
            j += 1
        blocks.append({'kind': 'para', 'parts': parts})
        i = j
    return blocks


# ---------------- comparison ----------------
class Seq:
    """A token sequence with, per token, its place (Markdown line or document context)."""

    def __init__(self):
        self.tokens, self.places, self.labels, self.auto = [], [], {}, set()

    def add_text(self, tokens, place, numbered=False, label=None):
        words = [t for t in tokens if t.startswith(REF) or is_word(t)]
        first = True
        if numbered:
            self.labels[len(self.tokens)] = label
            self.auto.add(len(self.tokens))
            self.tokens.append(LAB)
            self.places.append(place)
            first = False
        for t in words:
            if first and not t.startswith(REF) and LABEL.match(t):
                self.labels[len(self.tokens)] = t
                self.tokens.append(LAB)
            else:
                self.tokens.append(REF if t.startswith(REF) else t)
            self.places.append(place)
            first = False


def doc_sequence(doc, lo):
    seq, stats = Seq(), {'numbered': 0, 'found': 0}
    labelled = []

    def block(b, where):
        if 'table' in b:
            for r, row in enumerate(doc.tables[b['table']], 1):
                for c, cell in enumerate(row, 1):
                    for cb in cell:
                        block(cb, f'table {b["table"] + 1} row {r} cell {c}')
            return
        numbered = b['kind'] == 'number'
        label = None
        if numbered:
            stats['numbered'] += 1
            labelled.append((len(seq.tokens), b))
        seq.add_text(b['tokens'], where or ' '.join(b['tokens'][:8]), numbered, label)
    for b in doc.blocks:
        block(b, None)
    readings = [lo_labels(pieces) for pieces in lo]
    cursors = [0] * len(readings)
    for pos, b in labelled:
        key = plain(' '.join(t for t in b['tokens'] if not t.startswith(REF)))
        for n, reading in enumerate(readings):
            hit, cursor = None, cursors[n]
            for k in range(cursor, min(len(reading), cursor + 400)):
                if reading[k][1] == key and reading[k][0]:
                    hit = k
                    break
            if hit is None and key:
                best = (0.0, None)
                for k in range(cursor, min(len(reading), cursor + 60)):
                    if reading[k][0]:
                        ratio = difflib.SequenceMatcher(None, reading[k][1], key, autojunk=False).ratio()
                        if ratio > best[0]:
                            best = (ratio, k)
                if best[0] >= 0.85:
                    hit = best[1]
            if hit is not None:
                seq.labels[pos] = reading[hit][0]
                cursors[n] = hit + 1
                stats['found'] += 1
                break
    return seq, stats


def md_sequence(blocks):
    seq = Seq()
    tables = []
    for b in blocks:
        if b['kind'] == 'note':
            continue
        if b['kind'] == 'table':
            tables.append(b['rows'])
            for line, cells in b['rows']:
                for cell in cells:
                    for piece in re.split(r'<br\s*/?>', cell, flags=re.I):
                        seq.add_text(md_clean(piece).split(), line)
            continue
        text = ' '.join(t for _, t in b['parts'])
        seq.add_text(md_clean(text).split(), b['parts'][0][0])
    return seq, tables


def cell_words(blocks, text):
    """Words of a Markdown table cell; the list number opening a piece is left out where the document's
    paragraph is numbered (list numbers are compared in the word sequence)."""
    blocks = [b for b in blocks if b.get('tokens') or b.get('kind') == 'number']
    out = []
    pieces = [[t for t in md_clean(p).split() if is_word(t) and not t.startswith(REF)] for p in re.split(r'<br\s*/?>', text, flags=re.I)]
    for k, words in enumerate(p for p in pieces if p):
        numbered = k < len(blocks) and blocks[k].get('kind') == 'number'
        out += words[1:] if numbered and LABEL.match(words[0]) else words
    return out


def show(seq, start, end):
    out = []
    for k in range(start, end):
        t = seq.tokens[k]
        out.append((seq.labels.get(k) or '<list number>') if t == LAB else '<note mark>' if t == REF else t)
    return ' '.join(out)


def compare(doc, md_text, lo):
    report = {'missing': [], 'extra': [], 'chars': [], 'numbers': [], 'rows': [], 'notes': []}
    src, stats = doc_sequence(doc, lo)
    blocks = md_blocks(md_text)
    dst, md_tables = md_sequence(blocks)
    sm = difflib.SequenceMatcher(None, src.tokens, dst.tokens, autojunk=False)
    unchecked = 0
    for op, i1, i2, j1, j2 in sm.get_opcodes():
        if op == 'equal':
            for k in range(i2 - i1):
                if src.tokens[i1 + k] != LAB:
                    continue
                want, got, line = src.labels.get(i1 + k), dst.labels.get(j1 + k), dst.places[j1 + k]
                if i1 + k in src.auto:
                    if want is None:
                        unchecked += 1
                    elif want != got:
                        report['numbers'].append(f'line {line}: "{got}" where LibreOffice shows "{want}"')
                elif want != got and want.translate(FOLD) == (got or '').translate(FOLD):
                    report['chars'].append(f'line {line}: "{got}" where the document has "{want}"')
                elif want != got:
                    report['missing'].append(f'near line {line}: "{want}"')
                    report['extra'].append(f'line {line}: "{got}"')
            continue
        a, b = src.tokens[i1:i2], dst.tokens[j1:j2]
        if op == 'replace' and len(a) == len(b) and all(x.translate(FOLD) == y.translate(FOLD) for x, y in zip(a, b)):
            for x, y, k in zip(a, b, range(j1, j2)):
                if x != y:
                    report['chars'].append(f'line {dst.places[k]}: "{y}" where the document has "{x}"')
            continue
        if a:
            place = dst.places[j1] if j1 < len(dst.places) else dst.places[-1] if dst.places else '?'
            report['missing'].append(f'near line {place}: "{show(src, i1, i2)}"')
        if b:
            report['extra'].append(f'line {dst.places[j1]}: "{show(dst, j1, j2)}"')
    # tables, cell by cell
    for t, rows in enumerate(doc.tables):
        if t >= len(md_tables):
            report['rows'].append(f'table {t + 1}: not in the Markdown')
            continue
        got = md_tables[t]
        if len(got) != len(rows):
            report['rows'].append(f'table {t + 1}: {len(rows)} rows in the document, {len(got)} in the Markdown')
        for row, (line, cells) in zip(rows, got):
            want = [' '.join(t2 for cb in cell for t2 in cb.get('tokens', []) if is_word(t2) and not t2.startswith(REF)) for cell in row]
            have = [' '.join(cell_words(cell, c)) for cell, c in zip(row, cells)]
            if len(have) != len(want):
                report['rows'].append(f'line {line}: {len(have)} cells where the document has {len(want)}')
                continue
            for c, (x, y) in enumerate(zip(want, have), 1):
                if x.translate(FOLD) != y.translate(FOLD) and not any('table' in cb for cb in row[c - 1]):
                    report['rows'].append(f'line {line} cell {c}: "{y}" where the document has "{x}"')
    if len(md_tables) > len(doc.tables):
        report['rows'].append(f'{len(md_tables) - len(doc.tables)} more table(s) in the Markdown than in the document')
    # notes, by the order of their marks
    defs = {b['label']: b for b in blocks if b['kind'] == 'note'}
    marks = re.findall(r'(?<!\\)\[\^([^\]]+)\](?!:)', md_text)
    for n, key in enumerate(doc.note_order):
        want = [t for b in doc.note_blocks(key) for t in b.get('tokens', []) if is_word(t)]
        if n >= len(marks):
            report['notes'].append(f'{key[0]} {n + 1}: no mark in the Markdown')
            continue
        d = defs.get(marks[n])
        if d is None:
            report['notes'].append(f'[^{marks[n]}]: no definition')
            continue
        have = [t for t in md_clean(' '.join(p for _, p in d['parts'])).split() if is_word(t) and not t.startswith(REF)]
        if want != have:
            report['notes'].append(f'line {d["parts"][0][0]}: [^{marks[n]}] differs from the document\'s {key[0]}: '
                                   f'"{" ".join(have)[:120]}" vs "{" ".join(want)[:120]}"')
    if len(marks) > len(doc.note_order):
        report['notes'].append(f'{len(marks) - len(doc.note_order)} more note mark(s) in the Markdown than in the document')
    words = (sum(1 for t in src.tokens if t not in (LAB, REF)), sum(1 for t in dst.tokens if t not in (LAB, REF)))
    return report, stats, unchecked, words, len(doc.tables), len(md_tables)


def main():
    ap = argparse.ArgumentParser(description='Check a Markdown file against its .docx.')
    ap.add_argument('docx')
    ap.add_argument('markdown')
    ap.add_argument('--no-libreoffice', action='store_true', help='skip the second reading of the list numbers')
    args = ap.parse_args()
    try:
        doc = Document(args.docx)
        md_text = open(args.markdown, encoding='utf-8').read()
    except (OSError, zipfile.BadZipFile, KeyError, ET.ParseError, UnicodeDecodeError) as e:
        print(f'ERROR: {e}', file=sys.stderr)
        sys.exit(2)
    lo, version = ([], None) if args.no_libreoffice else libreoffice_lines(args.docx)
    report, stats, unchecked, words, nt, mt = compare(doc, md_text, lo)
    print(f'SOURCE: {args.docx}')
    print(f'MARKDOWN: {args.markdown}')
    print(f'WORDS: document {words[0]}, Markdown {words[1]}')
    if stats['numbered']:
        if not lo:
            print(f"LIST NUMBERS: {stats['numbered']} numbered paragraphs, checked by one reader (LibreOffice "
                  + ('not used' if args.no_libreoffice else 'not found') + '): the numbers were not compared')
        else:
            print(f"LIST NUMBERS: {stats['numbered']} numbered paragraphs; second reading by {version} found {stats['found']}"
                  + (f'; {unchecked} not found there, not compared' if unchecked else ''))
    print(f'TABLES: document {nt}, Markdown {mt}; NOTES: document {len(doc.note_order)}')
    titles = (('missing', 'MISSING (in the document, not in the Markdown)'), ('extra', 'EXTRA (in the Markdown, not in the document)'),
              ('chars', 'CHARACTERS (other quotes, apostrophes or dashes than the document)'),
              ('numbers', 'NUMBERS (list numbers that differ from LibreOffice\'s reading)'), ('rows', 'TABLE ROWS'), ('notes', 'NOTES'))
    for key, title in titles:
        if report[key]:
            print(f'{title}: {len(report[key])}')
            for item in report[key][:40]:
                print(f'  {item}')
            if len(report[key]) > 40:
                print(f'  ... {len(report[key]) - 40} more')
    failed = any(report[k] for k, _ in titles)
    print('RESULT: ' + ('FAIL' if failed else 'PASS'))
    sys.exit(1 if failed else 0)


if __name__ == '__main__':
    main()
