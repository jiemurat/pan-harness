#!/usr/bin/env python3
"""Find out what each Word file really is, and turn the ones that are not .docx into .docx (read-only for the inputs).

usage: check_word_file.py [--docx-dir DIR] FILE [FILE ...]

Prints one block per file. FORMAT is found from the file's content, not its name:
  docx      a Word 2007+ document (also a .docx with another name)
  doc       a Word 97-2003 document
  web-page  an HTML or MHTML page saved with a Word name (many sites export "Word" this way)
  rtf       a Rich Text Format file saved with a Word name
  word-xml  a Word 2003 XML document
  encrypted a password-protected Word file
  not-word  another kind of file (a spreadsheet, an OpenDocument file, a PDF, ...)
  error     the file could not be read
With --docx-dir, a doc, web-page, rtf or word-xml file is converted by LibreOffice into a .docx in DIR, and
the DOCX line names it; without it, the DOCX line names the file only for a docx. CONTENT counts the words
and pictures of the .docx; IMAGE ONLY means the file holds pictures and almost no text (pasted scans).

Exit code: 0 every file can be converted, 1 at least one cannot (encrypted, not-word, error, failed
conversion), 2 LibreOffice is needed and missing.
"""
import argparse
import os
import re
import shutil
import subprocess
import sys
import tempfile
import zipfile
from pathlib import Path

INSTALL_HINT = ('LibreOffice is missing; it converts .doc files. Install it: macOS `brew install --cask libreoffice`; '
                'Debian or Ubuntu `sudo apt install libreoffice-writer`; Fedora `sudo dnf install libreoffice-writer`; '
                'Windows `winget install --id TheDocumentFoundation.LibreOffice`.')
NEEDS_LIBREOFFICE = ('doc', 'web-page', 'rtf', 'word-xml')


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


def sniff(path):
    """Return (format, note)."""
    try:
        with open(path, 'rb') as f:
            head = f.read(4096)
            f.seek(0)
            data = f.read() if head.startswith(b'\xd0\xcf\x11\xe0') else b''
    except OSError as e:
        return 'error', str(e)
    if head.startswith(b'PK\x03\x04'):
        try:
            with zipfile.ZipFile(path) as z:
                names = set(z.namelist())
        except zipfile.BadZipFile as e:
            return 'error', f'damaged zip container: {e}'
        if 'word/document.xml' in names or any(n.endswith('document.xml') and n.startswith('word/') for n in names):
            return 'docx', ''
        if 'content.xml' in names:
            return 'not-word', 'an OpenDocument file (.odt or similar)'
        if 'xl/workbook.xml' in names or 'ppt/presentation.xml' in names:
            return 'not-word', 'an Excel or PowerPoint file'
        return 'not-word', 'a zip archive without a Word document'
    if head.startswith(b'\xd0\xcf\x11\xe0\xa1\xb1\x1a\xe1'):
        utf16 = lambda s: s.encode('utf-16-le')
        if utf16('EncryptedPackage') in data or utf16('EncryptionInfo') in data:
            return 'encrypted', 'a password-protected Word file'
        if utf16('WordDocument') in data:
            return 'doc', ''
        if utf16('Workbook') in data or utf16('PowerPoint Document') in data:
            return 'not-word', 'an Excel or PowerPoint 97-2003 file'
        return 'not-word', 'an OLE container without a Word document'
    text = head.lstrip(b'\xef\xbb\xbf\xff\xfe\xfe\xff \t\r\n').lower()
    if text.startswith(b'{\\rtf'):
        return 'rtf', ''
    if text.startswith(b'mime-version') or b'\nmime-version' in text[:1024]:
        return 'web-page', 'an MHTML page'
    if text.startswith(b'<!doctype html') or b'<html' in text[:2048]:
        return 'web-page', 'an HTML page'
    if b'<w:worddocument' in text or b'schemas.microsoft.com/office/word/2003/wordml' in text:
        return 'word-xml', ''
    if text.startswith(b'%pdf'):
        return 'not-word', 'a PDF file'
    return 'not-word', 'unknown content'


def convert(soffice, path, fmt, out_dir):
    """Convert one file into DIR/<name>.docx with LibreOffice; return (docx path or None, note)."""
    out_dir.mkdir(parents=True, exist_ok=True)
    target = out_dir / (Path(path).stem + '.docx')
    k = 2
    while target.exists():
        target = out_dir / f'{Path(path).stem}-{k}.docx'
        k += 1
    with tempfile.TemporaryDirectory() as tmp:
        work = Path(tmp) / 'in'
        work.mkdir()
        ext = {'web-page': '.html', 'rtf': '.rtf', 'word-xml': '.xml'}.get(fmt, '.doc')
        copy = work / ('source' + ext)
        shutil.copyfile(path, copy)
        cmd = [soffice, f'-env:UserInstallation={(Path(tmp) / "profile").as_uri()}', '--headless']
        if fmt == 'web-page':
            cmd.append('--infilter=HTML (StarWriter)')
        cmd += ['--convert-to', 'docx:MS Word 2007 XML', '--outdir', str(Path(tmp) / 'out'), str(copy)]
        try:
            r = subprocess.run(cmd, capture_output=True, encoding='utf-8', errors='replace', timeout=300)
        except subprocess.TimeoutExpired:
            return None, 'LibreOffice did not finish within 5 minutes'
        produced = Path(tmp) / 'out' / 'source.docx'
        if not produced.exists():
            why = (r.stderr or r.stdout or '').strip().splitlines()
            return None, 'LibreOffice could not convert it (encrypted or damaged?): ' + (why[-1] if why else 'no output')
        shutil.move(str(produced), target)
    return target, ''


def content(docx):
    """Words, paragraphs, tables and pictures of a .docx, counted from its XML."""
    with zipfile.ZipFile(docx) as z:
        name = 'word/document.xml' if 'word/document.xml' in z.namelist() else next(n for n in z.namelist() if n.endswith('document.xml'))
        xml = z.read(name).decode('utf-8', errors='replace')
    xml = re.sub(r'<mc:Fallback>.*?</mc:Fallback>|<w:del\b.*?</w:del>', '', xml, flags=re.S)
    text = ' '.join(re.findall(r'<w:t(?:\s[^>]*)?>([^<]*)</w:t>', xml))
    words = sum(1 for t in text.split() if any(ch.isalnum() for ch in t))
    pictures = len(re.findall(r'<pic:pic\b', xml)) + len(re.findall(r'<v:imagedata\b', xml))
    return {'words': words, 'paragraphs': len(re.findall(r'<w:p[ >/]', xml)), 'tables': len(re.findall(r'<w:tbl>', xml)),
            'pictures': pictures, 'changes': len(re.findall(r'<w:(?:ins|del) ', xml)), 'comments': len(re.findall(r'<w:commentReference ', xml))}


def main():
    ap = argparse.ArgumentParser(description='Find out what each Word file really is.')
    ap.add_argument('files', nargs='+')
    ap.add_argument('--docx-dir', help='folder for the .docx files LibreOffice makes from the other formats')
    args = ap.parse_args()
    soffice = find_soffice()
    found = [(f, *sniff(f)) for f in args.files]
    needs = any(fmt in NEEDS_LIBREOFFICE for _, fmt, _ in found)
    print(f'LIBREOFFICE: {soffice_version(soffice)} ({soffice})' if soffice else 'LIBREOFFICE: not found')
    status = 0
    for path, fmt, note in found:
        print(f'\nFILE: {path}')
        print(f'FORMAT: {fmt}' + (f' ({note})' if note else ''))
        docx = path if fmt == 'docx' else None
        if fmt in NEEDS_LIBREOFFICE:
            if not soffice:
                print('NEXT: install LibreOffice, then run this again with --docx-dir')
                status = max(status, 2)
                continue
            if not args.docx_dir:
                print('NEXT: run this again with --docx-dir DIR to convert it into a .docx')
                continue
            docx, why = convert(soffice, path, fmt, Path(args.docx_dir))
            if docx is None:
                print(f'NOTE: {why}')
                status = max(status, 1)
                continue
        if fmt in ('encrypted', 'not-word', 'error'):
            status = max(status, 1)
            continue
        print(f'DOCX: {docx}')
        try:
            c = content(docx)
        except (zipfile.BadZipFile, StopIteration, KeyError) as e:
            print(f'NOTE: the .docx could not be read: {e}')
            status = max(status, 1)
            continue
        print(f"CONTENT: about {c['words']} words (before the conversion rules), paragraphs {c['paragraphs']}, tables {c['tables']}, pictures {c['pictures']}, "
              f"tracked changes {c['changes']}, comment marks {c['comments']}")
        if c['pictures'] and c['words'] < 20:
            print('IMAGE ONLY: pictures and almost no text; the pages are probably scans')
    if needs and not soffice:
        print('\n' + INSTALL_HINT, file=sys.stderr)
    sys.exit(status)


if __name__ == '__main__':
    main()
