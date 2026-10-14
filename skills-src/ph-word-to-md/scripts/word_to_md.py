#!/usr/bin/env python3
"""Convert a Word .docx file into Markdown that keeps every word in the document's order.

usage: word_to_md.py FILE.docx OUT.md

Writes OUT.md and prints a summary. The .docx is only read.

What the Markdown holds:
  headings from Word's heading styles (`#` for a Title paragraph, the heading levels below it);
  list numbers as Word shows them ("1.1.", "a)"), written as text; bullets as `- item`;
  tables as pipe tables: a merged cell's text once, the cells it covers empty; a 1 x 1 table as plain paragraphs;
  footnotes as [^1] and endnotes as [^e1], their text at the end of the file;
  links as [text](url); the text of a text box after the paragraph that holds it;
  formulas as linear text in backticks; check boxes as the box character Word shows;
  paragraphs of a table cell joined with <br>, a line break inside a paragraph as a line ending in a backslash;
  characters Markdown reads as syntax escaped with a backslash: \\*, \\_, \\`, \\<, \\\\, and # or > opening a line.
Tracked changes are accepted (insertions kept, deletions left out). Left out: comments, hidden text, headers
and footers, the automatic table of contents, pictures, charts, SmartArt and embedded objects (counted in
the summary). Paragraphs without a heading style that may be headings (bold, centred, in capitals, or opening
with section numbering) are listed under HEADING CANDIDATES with their Markdown line.
"""
import posixpath
import re
import sys
import zipfile
import xml.etree.ElementTree as ET

W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'
R = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'
MC = 'http://schemas.openxmlformats.org/markup-compatibility/2006'
M = 'http://schemas.openxmlformats.org/officeDocument/2006/math'
STRICT = {b'http://purl.oclc.org/ooxml/wordprocessingml/main': W.encode(),
          b'http://purl.oclc.org/ooxml/officeDocument/relationships': R.encode(),
          b'http://purl.oclc.org/ooxml/officeDocument/math': M.encode()}
LINEBREAK, NOTE = '\x00br', '\x00note'
SPACES = {**dict.fromkeys(map(ord, '\u00a0\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\t'), ' '),
          **dict.fromkeys(map(ord, '\u200b\ufeff\u00ad'), '')}
SYMBOLS = {0xF0B7: '\u2022', 0xF0A7: '\u25aa', 0xF076: '\u2756', 0xF0D8: '\u27a2', 0xF0FC: '\u2713', 0xF0FB: '\u2717',
           0xF0FD: '\u2612', 0xF0FE: '\u2611', 0xF06F: '\u25a1', 0xF0A8: '\u25a1', 0xF0E0: '\u2192', 0xF0E8: '\u2192', 0xF02D: '-'}
SECTION = re.compile(r'^(?:[IVXLCDM]{1,7}|\d{1,3}(?:\.\d{1,3})*|[A-Za-z])[.)](?:\s|$)|^\d{1,3}-\w+\.?(?:\s|$)|^\u00a7\s?\d'
                     r'|^(?:chapter|section|article|part|annex|appendix)\s+\S+', re.I)
RUSSIAN = '\u0430\u0431\u0432\u0433\u0434\u0435\u0436\u0437\u0438\u043a\u043b\u043c\u043d\u043e\u043f\u0440\u0441\u0442\u0443\u0444\u0445\u0446\u0447\u0448\u0449\u044d\u044e\u044f'


def w(tag):
    return f'{{{W}}}{tag}'


def val(el, attr='val'):
    return None if el is None else el.get(w(attr))


def flag(props, name):
    """True, False or None (not set) for an on/off property such as w:b."""
    el = None if props is None else props.find(w(name))
    if el is None:
        return None
    return val(el) not in ('0', 'false', 'off', 'none')


def parse(z, name):
    data = z.read(name)
    for strict, transitional in STRICT.items():
        data = data.replace(strict, transitional)
    return ET.fromstring(data)


class Package:
    def __init__(self, path):
        self.z = zipfile.ZipFile(path)
        names = set(self.z.namelist())
        main = 'word/document.xml'
        if '_rels/.rels' in names:
            for rel in parse(self.z, '_rels/.rels'):
                if rel.get('Type', '').endswith('/officeDocument'):
                    main = (rel.get('Target') or main).lstrip('/')
        self.main = main
        base = posixpath.dirname(main)
        rels_name = posixpath.join(base, '_rels', posixpath.basename(main) + '.rels')
        self.rels, self.parts = {}, {}
        if rels_name in names:
            for rel in parse(self.z, rels_name):
                kind = rel.get('Type', '').rsplit('/', 1)[-1]
                target = rel.get('Target', '')
                if rel.get('TargetMode') == 'External':
                    self.rels[rel.get('Id')] = target
                    continue
                part = posixpath.normpath(posixpath.join(base, target)) if not target.startswith('/') else target.lstrip('/')
                self.rels[rel.get('Id')] = part
                self.parts.setdefault(kind, []).append(part)
        self.names = names

    def root(self, kind):
        for part in self.parts.get(kind, []):
            if part in self.names:
                return parse(self.z, part)
        return None


class Styles:
    def __init__(self, root):
        self.info, self.default = {}, None
        for s in (root.findall(w('style')) if root is not None else []):
            sid = s.get(w('styleId'))
            ppr, rpr = s.find(w('pPr')), s.find(w('rPr'))
            numpr = ppr.find(w('numPr')) if ppr is not None else None
            outline = val(ppr.find(w('outlineLvl'))) if ppr is not None else None
            self.info[sid] = {'name': (val(s.find(w('name'))) or sid or '').lower(), 'based': val(s.find(w('basedOn'))),
                              'numId': val(numpr.find(w('numId'))) if numpr is not None else None,
                              'ilvl': val(numpr.find(w('ilvl'))) if numpr is not None else None,
                              'outline': outline, 'b': flag(rpr, 'b'), 'i': flag(rpr, 'i'), 'vanish': flag(rpr, 'vanish'),
                              'jc': val(ppr.find(w('jc'))) if ppr is not None else None}
            if s.get(w('type')) == 'paragraph' and s.get(w('default')) in ('1', 'true', 'on'):
                self.default = sid

    def chain(self, sid):
        seen = set()
        while sid in self.info and sid not in seen:
            seen.add(sid)
            yield self.info[sid]
            sid = self.info[sid]['based']

    def get(self, sid, key):
        for s in self.chain(sid):
            if s[key] is not None:
                return s[key]
        return None

    def name(self, sid):
        return self.info[sid]['name'] if sid in self.info else ''


def roman(n):
    out = ''
    for value, letters in ((1000, 'm'), (900, 'cm'), (500, 'd'), (400, 'cd'), (100, 'c'), (90, 'xc'), (50, 'l'), (40, 'xl'),
                           (10, 'x'), (9, 'ix'), (5, 'v'), (4, 'iv'), (1, 'i')):
        while n >= value:
            out, n = out + letters, n - value
    return out


def number_text(n, fmt):
    """The text Word shows for counter value n in format fmt, and whether the format is a rare one."""
    if fmt in ('decimal', None):
        return str(n), False
    if fmt == 'decimalZero':
        return f'{n:02d}', False
    if fmt in ('upperRoman', 'lowerRoman'):
        r = roman(n) if n > 0 else str(n)
        return (r.upper() if fmt == 'upperRoman' else r), False
    if fmt in ('upperLetter', 'lowerLetter'):
        if n < 1:
            return str(n), True
        letter = chr(ord('a') + (n - 1) % 26) * ((n - 1) // 26 + 1)
        return (letter.upper() if fmt == 'upperLetter' else letter), False
    if fmt in ('russianLower', 'russianUpper'):
        if n < 1:
            return str(n), True
        letter = RUSSIAN[(n - 1) % len(RUSSIAN)] * ((n - 1) // len(RUSSIAN) + 1)
        return (letter.upper() if fmt == 'russianUpper' else letter), True
    if fmt == 'decimalEnclosedCircle' and 1 <= n <= 20:
        return chr(0x2460 + n - 1), False
    if fmt == 'none':
        return '', False
    return str(n), True


class Numbering:
    def __init__(self, root, styles):
        self.styles, self.abstract, self.nums = styles, {}, {}
        self.counters, self.started, self.rare = {}, set(), set()
        if root is None:
            return
        for a in root.findall(w('abstractNum')):
            self.abstract[a.get(w('abstractNumId'))] = {
                'levels': {int(l.get(w('ilvl'))): self.level(l) for l in a.findall(w('lvl'))},
                'numStyleLink': val(a.find(w('numStyleLink')))}
        for n in root.findall(w('num')):
            overrides = {}
            for o in n.findall(w('lvlOverride')):
                lvl = o.find(w('lvl'))
                overrides[int(o.get(w('ilvl')))] = {'start': val(o.find(w('startOverride'))), 'lvl': self.level(lvl) if lvl is not None else None}
            self.nums[n.get(w('numId'))] = {'abstract': val(n.find(w('abstractNumId'))), 'overrides': overrides}

    @staticmethod
    def level(l):
        restart = val(l.find(w('lvlRestart')))
        return {'start': int(val(l.find(w('start'))) or 0) if val(l.find(w('start'))) not in (None, '') else 0,
                'fmt': val(l.find(w('numFmt'))) or 'decimal', 'text': val(l.find(w('lvlText'))),
                'isLgl': flag(l, 'isLgl') or False, 'restart': int(restart) if restart not in (None, '') else None,
                'pStyle': val(l.find(w('pStyle')))}

    def abstract_id(self, num_id, depth=0):
        num = self.nums.get(num_id)
        if num is None:
            return None
        aid = num['abstract']
        link = self.abstract.get(aid, {}).get('numStyleLink')
        if link and depth < 5:
            linked = self.styles.get(link, 'numId')
            if linked and linked != num_id:
                return self.abstract_id(linked, depth + 1)
        return aid

    def levels(self, num_id):
        aid = self.abstract_id(num_id)
        levels = dict(self.abstract.get(aid, {}).get('levels', {}))
        for ilvl, o in self.nums.get(num_id, {}).get('overrides', {}).items():
            if o['lvl']:
                levels[ilvl] = o['lvl']
        return aid, levels

    def level_for_style(self, num_id, style_id):
        for ilvl, l in self.levels(num_id)[1].items():
            if l['pStyle'] == style_id:
                return ilvl
        return 0

    def label(self, num_id, ilvl):
        """Advance the counters for one paragraph; return (label text, 'number' | 'bullet' | 'none')."""
        aid, levels = self.levels(num_id)
        if aid is None or ilvl not in levels:
            return '', 'none'
        lv = levels[ilvl]
        counters = self.counters.setdefault(aid, {})
        override = self.nums.get(num_id, {}).get('overrides', {}).get(ilvl, {}).get('start')
        if override is not None and (num_id, ilvl) not in self.started:
            self.started.add((num_id, ilvl))
            counters[ilvl] = int(override) - 1
        if counters.get(ilvl) is None:
            counters[ilvl] = lv['start'] - 1
        counters[ilvl] += 1
        for deeper, dl in levels.items():
            if deeper > ilvl:
                limit = deeper if dl['restart'] is None else dl['restart']
                if limit and ilvl + 1 <= limit:
                    counters[deeper] = None
        if lv['fmt'] == 'bullet':
            return lv['text'] or '', 'bullet'
        text = lv['text'] or ''

        def place(m):
            k = int(m.group(1)) - 1
            other = levels.get(k, lv)
            value = counters.get(k)
            if value is None:
                value = other['start']
            fmt = 'decimal' if lv['isLgl'] and other['fmt'] not in ('none',) else other['fmt']
            shown, rare = number_text(value, fmt)
            if rare:
                self.rare.add(other['fmt'])
            return shown
        label = re.sub(r'%([1-9])', place, text).strip()
        return (label, 'number') if label else ('', 'none')


class Converter:
    def __init__(self, path):
        self.pkg = Package(path)
        self.styles = Styles(self.pkg.root('styles'))
        self.numbering = Numbering(self.pkg.root('numbering'), self.styles)
        self.notes = {'footnote': self.load_notes('footnotes', 'footnote'), 'endnote': self.load_notes('endnotes', 'endnote')}
        self.note_order = {'footnote': [], 'endnote': []}
        self.fields = []
        self.count = dict.fromkeys(('headings', 'paragraphs', 'numbered', 'bullets', 'tables', 'rows', 'textboxes', 'links', 'formulas',
                                    'insertions', 'deletions', 'hidden', 'toc', 'pictures', 'charts', 'smartart', 'objects', 'comments_refs'), 0)
        self.candidates, self.warnings, self.body_out = [], [], None
        self.title_shift = 0
        self.prev_bullet = None

    def load_notes(self, kind, tag):
        root = self.pkg.root(kind)
        notes = {}
        if root is not None:
            for n in root.findall(w(tag)):
                if n.get(w('type')) in (None, 'normal'):
                    notes[n.get(w('id'))] = n
        return notes

    # ---------- inline content ----------
    def inline(self, el, ctx, out):
        """Append (text, bold, italic, url) items and markers for the children of el."""
        for child in el:
            tag = child.tag
            if tag == w('r'):
                self.run(child, ctx, out)
            elif tag == w('hyperlink'):
                rid = child.get(f'{{{R}}}id')
                url = self.pkg.rels.get(rid) if rid else None
                if url and not re.match(r'[a-zA-Z][\w+.-]*:', url):
                    url = None
                if url and child.get(w('anchor')) and '#' not in url:
                    url += '#' + child.get(w('anchor'))
                if url:
                    self.count['links'] += 1
                self.inline(child, dict(ctx, url=url or ctx.get('url')), out)
            elif tag in (w('ins'), w('moveTo')):
                self.count['insertions'] += 1 if tag == w('ins') else 0
                self.inline(child, ctx, out)
            elif tag in (w('del'), w('moveFrom')):
                self.count['deletions'] += 1 if tag == w('del') else 0
            elif tag in (w('smartTag'), w('customXml'), w('dir'), w('bdo')):
                self.inline(child, ctx, out)
            elif tag == w('sdt'):
                content = child.find(w('sdtContent'))
                if content is not None:
                    self.inline(content, ctx, out)
            elif tag == w('fldSimple'):
                instr = (child.get(w('instr')) or '').strip()
                word = instr.split()[0].upper() if instr.split() else ''
                if word == 'TOC':
                    ctx['toc'] = True
                    continue
                url = ctx.get('url')
                if word == 'HYPERLINK':
                    url = self.field_link(instr) or url
                    if self.field_link(instr):
                        self.count['links'] += 1
                self.inline(child, dict(ctx, url=url), out)
            elif tag == f'{{{MC}}}AlternateContent':
                choice = child.find(f'{{{MC}}}Choice')
                self.inline(choice if choice is not None else child.find(f'{{{MC}}}Fallback') or child, ctx, out)
            elif tag in (f'{{{M}}}oMath', f'{{{M}}}oMathPara'):
                if not self.suppressed():
                    out.append(('`' + self.math(child) + '`', False, False, None, 'code'))
                    self.count['formulas'] += 1

    def suppressed(self):
        return any(f['phase'] == 'instr' or f['kind'] == 'toc' for f in self.fields)

    def field_url(self):
        for f in reversed(self.fields):
            if f['kind'] == 'link' and f['phase'] == 'result':
                return f['url']
        return None

    def run(self, r, ctx, out):
        rpr = r.find(w('rPr'))
        rstyle = val(rpr.find(w('rStyle'))) if rpr is not None else None

        def prop(name):
            v = flag(rpr, name)
            if v is None and rstyle:
                v = self.styles.get(rstyle, name)
            if v is None:
                v = self.styles.get(ctx['pstyle'], name)
            return bool(v)
        hidden = prop('vanish')
        bold, italic = prop('b'), prop('i')
        if hidden and any(c.tag == w('t') and c.text for c in r):
            self.count['hidden'] += 1
        for c in r:
            tag = c.tag
            if tag == w('fldChar'):
                kind = c.get(w('fldCharType'))
                if kind == 'begin':
                    self.fields.append({'phase': 'instr', 'instr': '', 'kind': 'other', 'url': None, 'ff': c.find(w('ffData'))})
                elif kind == 'separate' and self.fields:
                    f = self.fields[-1]
                    f['phase'] = 'result'
                    self.classify(f)
                elif kind == 'end' and self.fields:
                    f = self.fields.pop()
                    if f['phase'] == 'instr':
                        self.classify(f)
                    if f['kind'] == 'checkbox' and not self.suppressed():
                        box = f['ff'].find(w('checkBox')) if f['ff'] is not None else None
                        checked = flag(box, 'checked') if box is not None else None
                        if checked is None and box is not None:
                            checked = val(box.find(w('default'))) in ('1', 'true', 'on')
                        out.append(('\u2612' if checked else '\u2610', False, False, None, 'text'))
                    if f['kind'] == 'toc':
                        ctx['toc'] = True
                continue
            if tag == w('instrText'):
                if self.fields and self.fields[-1]['phase'] == 'instr':
                    self.fields[-1]['instr'] += c.text or ''
                continue
            if self.fields and any(f['kind'] == 'toc' for f in self.fields):
                ctx['toc'] = True
            if self.suppressed():
                continue
            url = self.field_url() or ctx.get('url')
            if tag in (w('t'), w('delText')) and tag == w('t'):
                if not hidden and c.text:
                    out.append((c.text, bold, italic, url, 'text'))
            elif tag in (w('tab'), w('ptab')):
                if not hidden:
                    out.append((' ', bold, italic, url, 'text'))
            elif tag in (w('br'), w('cr')):
                if not hidden:
                    out.append((LINEBREAK if val(c, 'type') in (None, 'textWrapping') else ' ', False, False, None, 'text'))
            elif tag == w('noBreakHyphen'):
                if not hidden:
                    out.append(('-', bold, italic, url, 'text'))
            elif tag == w('sym'):
                if not hidden:
                    code = int(val(c, 'char') or '0', 16)
                    out.append((SYMBOLS.get(code, chr(code) if code < 0xF000 else chr(code - 0xF000)), bold, italic, url, 'text'))
            elif tag in (w('footnoteReference'), w('endnoteReference')):
                kind = 'footnote' if tag == w('footnoteReference') else 'endnote'
                nid = c.get(w('id'))
                if nid not in self.note_order[kind]:
                    self.note_order[kind].append(nid)
                n = self.note_order[kind].index(nid) + 1
                out.append((f'[^{n}]' if kind == 'footnote' else f'[^e{n}]', False, False, None, 'note'))
            elif tag == w('commentReference'):
                self.count['comments_refs'] += 1
            elif tag in (w('drawing'), w('pict'), w('object')):
                self.objects(c, ctx)
            elif tag == f'{{{MC}}}AlternateContent':
                choice = c.find(f'{{{MC}}}Choice')
                for d in (choice if choice is not None else c.find(f'{{{MC}}}Fallback') or []):
                    if d.tag in (w('drawing'), w('pict'), w('object')):
                        self.objects(d, ctx)

    @staticmethod
    def field_link(instr):
        """The address of a HYPERLINK field: its URL, with the \\l bookmark as #fragment; None for a link inside the document."""
        m = re.match(r'\s*HYPERLINK\s+"([^"]+)"', instr, re.I)
        if not m:
            return None
        anchor = re.search(r'\\l\s+"([^"]+)"', instr[m.end():])
        return m.group(1) + ('#' + anchor.group(1) if anchor else '')

    def classify(self, f):
        words = f['instr'].split()
        word = words[0].upper() if words else ''
        if word == 'TOC':
            f['kind'] = 'toc'
        elif word == 'HYPERLINK':
            url = self.field_link(f['instr'])
            if url:
                f['kind'], f['url'] = 'link', url
                self.count['links'] += 1
        elif word == 'FORMCHECKBOX':
            f['kind'] = 'checkbox'

    def objects(self, el, ctx):
        """Count pictures and other objects; collect text boxes for after the paragraph."""
        if el.tag == w('object'):
            self.count['objects'] += 1
            return
        for d in el.iter():
            tag = d.tag
            if tag == f'{{{MC}}}Fallback':
                continue
            if tag.endswith('}graphicData'):
                uri = d.get('uri', '')
                if uri.endswith('/picture'):
                    self.count['pictures'] += 1
                elif uri.endswith('/chart'):
                    self.count['charts'] += 1
                elif uri.endswith('/diagram'):
                    self.count['smartart'] += 1
            elif tag.endswith('}imagedata') and el.tag == w('pict'):
                self.count['pictures'] += 1
        for box in self.textbox_contents(el):
            ctx['boxes'].append(box)

    def textbox_contents(self, el):
        found = []

        def walk(node):
            for child in node:
                if child.tag == f'{{{MC}}}Fallback':
                    continue
                if child.tag == w('txbxContent'):
                    found.append(child)
                    continue
                walk(child)
        walk(el)
        return found

    def math(self, el):
        def part(node, name):
            found = node.find(f'{{{M}}}{name}')
            return [] if found is None else found

        def lin(node):
            parts = []
            for c in node:
                local = c.tag.rsplit('}', 1)[-1]
                if local == 't':
                    parts.append(c.text or '')
                elif local == 'f':
                    num, den = lin(part(c, 'num')), lin(part(c, 'den'))
                    wrap = lambda s: s if re.fullmatch(r'\w+', s) else f'({s})'
                    parts.append(f'{wrap(num)}/{wrap(den)}')
                elif local in ('sSup', 'sSub', 'sSubSup'):
                    base = lin(part(c, 'e'))
                    sub, sup = c.find(f'{{{M}}}sub'), c.find(f'{{{M}}}sup')
                    parts.append(base + (f'_({lin(sub)})' if sub is not None else '') + (f'^({lin(sup)})' if sup is not None else ''))
                elif local == 'rad':
                    parts.append(f'\u221a({lin(part(c, "e"))})')
                elif local in ('ctrlPr', 'rPr', 'fPr', 'sSupPr', 'sSubPr', 'radPr', 'deg', 'degHide', 'naryPr', 'dPr'):
                    continue
                else:
                    parts.append(lin(c))
            return ''.join(parts)
        return lin(el).replace('`', "'")

    # ---------- paragraphs ----------
    def para_style(self, p):
        ppr = p.find(w('pPr'))
        sid = val(ppr.find(w('pStyle'))) if ppr is not None else None
        return sid if sid in self.styles.info else self.styles.default

    def heading_level(self, p, sid):
        ppr = p.find(w('pPr'))
        direct = val(ppr.find(w('outlineLvl'))) if ppr is not None else None
        if direct is not None:
            return int(direct) + 1 if direct.isdigit() and int(direct) < 9 else None
        for s in self.styles.chain(sid):
            m = re.fullmatch(r'heading ([1-9])', s['name'])
            if m:
                return int(m.group(1))
            if s['name'] == 'title':
                return 0
            if s['outline'] is not None:
                return int(s['outline']) + 1 if s['outline'].isdigit() and int(s['outline']) < 9 else None
        return None

    def numbering_of(self, p, sid):
        ppr = p.find(w('pPr'))
        numpr = ppr.find(w('numPr')) if ppr is not None else None
        num_id = val(numpr.find(w('numId'))) if numpr is not None else None
        ilvl = val(numpr.find(w('ilvl'))) if numpr is not None else None
        if num_id is None:
            num_id = self.styles.get(sid, 'numId')
            if ilvl is None:
                ilvl = self.styles.get(sid, 'ilvl')
        if num_id in (None, '0') or num_id not in self.numbering.nums:
            return None
        ilvl = int(ilvl) if ilvl not in (None, '') else self.numbering.level_for_style(num_id, sid)
        return num_id, ilvl

    def is_toc_style(self, sid):
        name = self.styles.name(sid)
        return name == 'toc heading' or re.fullmatch(r'toc [1-9]', name) is not None

    def paragraph(self, p):
        """Return (kind, data) for one w:p: kind is heading, numbered, bullet, para or None; data has the text."""
        sid = self.para_style(p)
        ctx = {'pstyle': sid, 'url': None, 'boxes': [], 'toc': False}
        items = []
        toc_before = any(f['kind'] == 'toc' for f in self.fields)
        self.inline(p, ctx, items)
        boxes = ctx['boxes']
        if toc_before or ctx['toc'] or self.is_toc_style(sid):
            self.count['toc'] += 1
            return None, {'boxes': boxes}
        ppr = p.find(w('pPr'))
        mark = ppr.find(w('rPr')) if ppr is not None else None
        if mark is not None and mark.find(w('del')) is not None and not any(i[0].strip() for i in items):
            return None, {'boxes': boxes}
        level = self.heading_level(p, sid)
        num = self.numbering_of(p, sid)
        label, lkind = self.numbering.label(*num) if num else ('', 'none')
        has_text = any(i[4] in ('text', 'code', 'note') and i[0] not in (LINEBREAK,) and i[0].strip() for i in items)
        if not has_text and lkind != 'number':
            return None, {'boxes': boxes}
        return 'p', {'items': items, 'level': level, 'label': label if lkind == 'number' else '', 'bullet': lkind == 'bullet',
                     'ilvl': num[1] if num else 0, 'boxes': boxes, 'sid': sid,
                     'centered': ((val(ppr.find(w('jc'))) if ppr is not None else None) or self.styles.get(sid, 'jc')) == 'center'}

    # ---------- rendering ----------
    @staticmethod
    def escape(text, in_table=False):
        text = text.replace('\\', '\\\\').replace('*', '\\*').replace('_', '\\_').replace('`', '\\`').replace('<', '\\<')
        text = text.replace('[^', '\\[^').replace('](', '\\](')
        return text.replace('|', '\\|') if in_table else text

    def render_items(self, items, plain=False, in_table=False):
        """Markdown for inline items; plain drops emphasis (headings)."""
        merged = []
        for text, b, i, url, kind in items:
            if kind == 'text':
                text = text.translate(SPACES) if text != LINEBREAK else text
            if merged and kind == 'text' and merged[-1][4] == 'text' and merged[-1][1:4] == (b, i, url) and LINEBREAK not in (text, merged[-1][0]):
                merged[-1] = (merged[-1][0] + text, b, i, url, kind)
            else:
                merged.append((text, b, i, url, kind))
        out, link = [], None
        for text, b, i, url, kind in merged:
            if text == LINEBREAK:
                out.append(LINEBREAK)
                continue
            if kind in ('note', 'code'):
                piece = text
            else:
                piece = self.escape(text, in_table)
                if (b or i) and not plain and re.search(r'\w', text):
                    lead = piece[:len(piece) - len(piece.lstrip())]
                    trail = piece[len(piece.rstrip()):]
                    mark = '***' if b and i else '**' if b else '*'
                    piece = f'{lead}{mark}{piece.strip()}{mark}{trail}'
            if url and not plain:
                if link and link[0] == url:
                    link[1].append(piece)
                    continue
                link = [url, [piece]]
                out.append(link)
            else:
                link = None
                out.append(piece)
        text = ''
        for part in out:
            if isinstance(part, list):
                inner = ''.join(part[1])
                lead = inner[:len(inner) - len(inner.lstrip())]
                trail = inner[len(inner.rstrip()):]
                target = part[0].replace(' ', '%20').replace('(', '%28').replace(')', '%29')
                text += f'{lead}[{inner.strip()}]({target}){trail}' if inner.strip() else inner
            else:
                text += part
        text = re.sub(r' {2,}', ' ', text)
        lines = [re.sub(r' {2,}', ' ', line).strip() for line in text.split(LINEBREAK)]
        lines = [line for line in lines if line]
        return lines

    def bold_only(self, items):
        texts = [i for i in items if i[4] == 'text' and i[0] != LINEBREAK and i[0].strip()]
        return bool(texts) and all(i[1] for i in texts) and not any(i[4] == 'code' for i in items)

    def block_lines(self, d, out):
        """Render one paragraph into out (list of blocks: (block kind, text))."""
        level, label = d['level'], d['label']
        if level is not None:
            text = ' '.join(self.render_items(d['items'], plain=True))
            if label:
                text = f'{label} {text}'.strip()
            depth = 1 if level == 0 else min(6, level + self.title_shift)
            out.append(('heading', '#' * depth + ' ' + self.line_start(text)))
            self.count['headings'] += 1
            self.prev_bullet = None
            return
        lines = self.render_items(d['items'])
        self.candidate(d, lines, out)
        if d['bullet']:
            depth = 0 if self.prev_bullet is None else min(d['ilvl'], self.prev_bullet + 1)
            self.prev_bullet = depth
            out.append(('bullet', '  ' * depth + '- ' + ' \\\n'.join(lines)))
            self.count['bullets'] += 1
            return
        self.prev_bullet = None
        if label:
            lines = [f'{label} {lines[0]}' if lines else label] + lines[1:]
            out.append(('para', ' \\\n'.join(lines).replace(' \\\n', '\\\n')))
            self.count['numbered'] += 1
            return
        if not lines:
            return
        joined = '\\\n'.join(lines)
        out.append(('para', self.line_start(joined)))
        self.count['paragraphs'] += 1

    def candidate(self, d, lines, out):
        """Note a paragraph without a heading style that looks like a heading, with the cues it shows."""
        text = ' '.join(lines).replace('**', '').replace('\\', '').strip('* ')
        if d['bullet'] or not text or len(lines) > 3 or len(text) > 300 or text[-1] in '.;,:' and not self.bold_only(d['items']):
            return
        cues = []
        if self.bold_only(d['items']):
            cues.append('bold')
        if d.get('centered'):
            cues.append('centered')
        letters = [ch for ch in text if ch.isalpha() and ch.lower() != ch.upper()]
        if len(letters) >= 3 and all(ch.isupper() for ch in letters):
            cues.append('capitals')
        if (d['label'] and cues) or (not d['label'] and SECTION.match(text)):
            cues.append('numbered')
        if cues and out is self.body_out and (cues != ['numbered'] or text[-1] not in '.;,:'):
            self.candidates.append((len(out), f"{d['label']} {text}".strip() if d['label'] else text, cues))

    @staticmethod
    def line_start(text):
        return '\\' + text if text[:1] in ('#', '>') else text

    def cell_text(self, tc):
        parts = []
        for child in tc:
            if child.tag == w('p'):
                kind, d = self.paragraph(child)
                if kind:
                    lines = self.render_items(d['items'], in_table=True)
                    text = '<br>'.join(lines)
                    if d['label']:
                        text = f"{d['label']} {text}".strip()
                    elif d['bullet']:
                        text = f'- {text}'
                    if text:
                        parts.append(text)
                for box in d['boxes']:
                    parts += self.box_texts(box, in_table=True)
            elif child.tag == w('tbl'):
                for row in self.table_grid(child):
                    joined = ' '.join(c for c in row if c)
                    if joined:
                        parts.append(joined)
                self.warnings.append('a table inside a table cell was written as lines of that cell')
            elif child.tag in (w('sdt'), w('customXml')):
                content = child.find(w('sdtContent')) if child.tag == w('sdt') else child
                if content is not None:
                    parts.append(self.cell_text(content))
        return '<br>'.join(p for p in parts if p)

    def box_texts(self, box, in_table=False):
        self.count['textboxes'] += 1
        blocks = []
        self.blocks(box, blocks)
        return [text.replace('\n', ' ') if in_table else text for _, text in blocks]

    def table_grid(self, tbl):
        grid = tbl.find(w('tblGrid'))
        ncols = len(grid.findall(w('gridCol'))) if grid is not None else 0
        rows = []

        def row_elements(node):
            for child in node:
                if child.tag == w('tr'):
                    yield child
                elif child.tag in (w('sdt'), w('customXml')):
                    content = child.find(w('sdtContent')) if child.tag == w('sdt') else child
                    if content is not None:
                        yield from row_elements(content)

        def cell_elements(node):
            for child in node:
                if child.tag == w('tc'):
                    yield child
                elif child.tag in (w('sdt'), w('customXml')):
                    content = child.find(w('sdtContent')) if child.tag == w('sdt') else child
                    if content is not None:
                        yield from cell_elements(content)
        for tr in row_elements(tbl):
            trpr = tr.find(w('trPr'))
            if trpr is not None and trpr.find(w('del')) is not None:
                continue
            cells = [''] * int(val(trpr.find(w('gridBefore'))) or 0) if trpr is not None and trpr.find(w('gridBefore')) is not None else []
            for tc in cell_elements(tr):
                tcpr = tc.find(w('tcPr'))
                span = int(val(tcpr.find(w('gridSpan'))) or 1) if tcpr is not None and tcpr.find(w('gridSpan')) is not None else 1
                vm = tcpr.find(w('vMerge')) if tcpr is not None else None
                hm = tcpr.find(w('hMerge')) if tcpr is not None else None
                cont = (vm is not None and val(vm) in (None, 'continue')) or (hm is not None and val(hm) in (None, 'continue'))
                text = self.cell_text(tc)
                cells.append('' if cont else text)
                cells += [''] * (span - 1)
            if trpr is not None and trpr.find(w('gridAfter')) is not None:
                cells += [''] * int(val(trpr.find(w('gridAfter'))) or 0)
            rows.append(cells)
        width = max([ncols] + [len(r) for r in rows]) if rows else 0
        return [r + [''] * (width - len(r)) for r in rows]

    def table(self, tbl, out):
        rows = self.table_grid(tbl)
        if not rows:
            return
        trs = tbl.findall(w('tr'))
        only = trs[0].findall(w('tc')) if len(trs) == 1 else []
        if len(only) == 1:
            self.blocks(only[0], out)
            return
        self.count['tables'] += 1
        self.count['rows'] += len(rows)
        lines = ['| ' + ' | '.join(rows[0]) + ' |', '| ' + ' | '.join(['---'] * len(rows[0])) + ' |']
        lines += ['| ' + ' | '.join(r) + ' |' for r in rows[1:]]
        out.append(('table', '\n'.join(lines)))
        self.prev_bullet = None

    def blocks(self, container, out):
        for child in container:
            tag = child.tag
            if tag == w('p'):
                kind, d = self.paragraph(child)
                if kind:
                    self.block_lines(d, out)
                for box in d['boxes']:
                    self.count['textboxes'] += 1
                    self.blocks(box, out)
            elif tag == w('tbl'):
                self.table(child, out)
            elif tag == w('sdt'):
                pr = child.find(w('sdtPr'))
                gallery = pr.find(f'{w("docPartObj")}/{w("docPartGallery")}') if pr is not None else None
                content = child.find(w('sdtContent'))
                if gallery is not None and (val(gallery) or '').lower().startswith('table of contents'):
                    self.count['toc'] += len(content.findall(w('p'))) if content is not None else 0
                    continue
                if content is not None:
                    self.blocks(content, out)
            elif tag in (w('customXml'), f'{{{MC}}}AlternateContent'):
                inner = child.find(f'{{{MC}}}Choice') if tag != w('customXml') else child
                if inner is not None:
                    self.blocks(inner, out)
            elif tag == w('altChunk'):
                self.warnings.append('an embedded document part (altChunk) was not converted')

    def note_blocks(self, kind):
        defs = []
        for n, nid in enumerate(self.note_order[kind], 1):
            note = self.notes[kind].get(nid)
            if note is None:
                self.warnings.append(f'{kind} {nid} is referenced but missing')
                continue
            blocks = []
            self.prev_bullet = None
            self.blocks(note, blocks)
            texts = [t for _, t in blocks]
            label = f'[^{n}]' if kind == 'footnote' else f'[^e{n}]'
            first = texts[0] if texts else ''
            rest = ''.join('\n\n' + '\n'.join('    ' + line for line in t.split('\n')) for t in texts[1:])
            defs.append(f'{label}: {first}{rest}')
        return defs

    def convert(self):
        body = parse(self.pkg.z, self.pkg.main).find(w('body'))
        if body is None:
            raise KeyError('no document body')
        self.title_shift = 1 if any(self.styles.name(self.para_style(p)) == 'title' for p in body.iter(w('p'))) else 0
        out = []
        self.body_out = out
        self.blocks(body, out)
        md, prev, line, starts = [], None, 1, []
        for kind, text in out:
            if md:
                sep = '\n' if kind == 'bullet' and prev == 'bullet' else '\n\n'
                md.append(sep)
                line += len(sep)
            starts.append(line)
            md.append(text)
            line += text.count('\n')
            prev = kind
        self.candidates = [(starts[k] if k < len(starts) else 0, text, cues) for k, text, cues in self.candidates]
        notes = []
        # notes may reference further notes; render until no new reference appears
        done = {'footnote': 0, 'endnote': 0}
        while any(len(self.note_order[k]) > done[k] for k in done):
            for k in ('footnote', 'endnote'):
                if len(self.note_order[k]) > done[k]:
                    done[k] = len(self.note_order[k])
            notes = self.note_blocks('footnote') + self.note_blocks('endnote')
            if all(len(self.note_order[k]) == done[k] for k in done):
                break
        text = ''.join(md)
        if notes:
            text += '\n\n' + '\n\n'.join(notes)
        return text.strip() + '\n'


def summary(c, out_path, text):
    k = c.count
    comments = 0
    root = c.pkg.root('comments')
    if root is not None:
        comments = len(root.findall(w('comment')))
    headers = len(c.pkg.parts.get('header', [])) + len(c.pkg.parts.get('footer', []))
    print(f'MARKDOWN: {out_path} ({text.count(chr(10))} lines)')
    print(f"CONVERTED: headings {k['headings']}, paragraphs {k['paragraphs']}, numbered paragraphs {k['numbered']}, bullets {k['bullets']}, "
          f"tables {k['tables']} ({k['rows']} rows), footnotes {len(c.note_order['footnote'])}, endnotes {len(c.note_order['endnote'])}, "
          f"text boxes {k['textboxes']}, links {k['links']}, formulas {k['formulas']}")
    print(f"TRACKED CHANGES: insertions accepted {k['insertions']}, deletions left out {k['deletions']}")
    print(f"LEFT OUT: comments {comments}, hidden text runs {k['hidden']}, header and footer parts {headers}, table of contents paragraphs {k['toc']}")
    print(f"NOT CONVERTED: pictures {k['pictures']}, charts {k['charts']}, SmartArt {k['smartart']}, embedded objects {k['objects']}")
    words = len(re.findall(r'\w+', text))
    if words < 20 and k['pictures']:
        print('IMAGE ONLY: the document holds pictures and almost no text; its pages are probably scans')
    if c.candidates:
        print(f'HEADING CANDIDATES ({len(c.candidates)} paragraphs without a heading style that may be headings; decide each):')
        for line, text, cues in c.candidates:
            print(f"  line {line} [{', '.join(cues)}]: {text}")
    if c.numbering.rare:
        print('LIST FORMATS TO CHECK (shown by approximation): ' + ', '.join(sorted(c.numbering.rare)))
    for warning in dict.fromkeys(c.warnings):
        print(f'WARNING: {warning}')


def main():
    if len(sys.argv) != 3:
        print((__doc__ or '').strip().split('\n\n')[1], file=sys.stderr)
        sys.exit(2)
    src, out_path = sys.argv[1], sys.argv[2]
    try:
        c = Converter(src)
        text = c.convert()
    except (zipfile.BadZipFile, KeyError, ET.ParseError) as e:
        print(f'ERROR: {src} is not a readable .docx file ({e.__class__.__name__}: {e})', file=sys.stderr)
        sys.exit(1)
    with open(out_path, 'w', encoding='utf-8') as f:
        f.write(text)
    print(f'FILE: {src}')
    summary(c, out_path, text)


if __name__ == '__main__':
    main()
