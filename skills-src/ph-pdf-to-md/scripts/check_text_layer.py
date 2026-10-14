#!/usr/bin/env python3
"""Classify PDFs by their text layer before converting them (read-only).

usage: check_text_layer.py [--min-chars N] PDF [PDF ...]

Prints one block per PDF. VERDICT is one of:
  text           every page has a usable text layer: copy it
  mixed          some pages need OCR (OCR PAGES), the others have a usable text layer
  no-text        no page has a usable text layer, e.g. a scan: OCR every page
  unusable-text  the text layer is broken characters: OCR every page
  encrypted      a password is needed
  error          the file could not be read

A page needs OCR when it is "image-only" (fewer than --min-chars non-space characters,
default 100, and an image of at least 400 x 200 pixels) or "broken" (2% or more of its
characters are replacement or control characters, or 10% or more are private-use ones:
a few symbol-font bullets are not damage). A page with little text and no image
is "sparse" (cover, divider, blank page) and is not a problem. A page with a usable text
layer over an image that covers at least 80% of the page is listed under TEXT OVER IMAGE
PAGES: usually a scan with an earlier OCR layer, whose quality is unknown.
When a page needs OCR, the TESSERACT line tells whether tesseract is installed and which
language files it sees: in its own folder and in the user folder for language files
(~/.local/share/tessdata, on Windows %LOCALAPPDATA%\\tessdata).

Exit code: 0 every PDF can be converted, 1 at least one is encrypted or unreadable,
2 poppler (pdftotext, pdfinfo, pdfimages) is missing.
"""
import argparse
import os
import re
import shutil
import statistics
import subprocess
import sys
import unicodedata

TOOLS = ('pdftotext', 'pdfinfo', 'pdfimages')
INSTALL_HINT = ('poppler is missing. Install it: macOS `brew install poppler`; Debian or Ubuntu '
                '`sudo apt install poppler-utils`; Fedora `sudo dnf install poppler-utils`; '
                'Windows `conda install -c conda-forge poppler` or `scoop install poppler`.')
BROKEN_LIMIT = 0.02   # share of replacement and control characters that makes a page's text layer unusable
PRIVATE_LIMIT = 0.10  # share of private-use characters that does the same (fonts without a Unicode map)
MIN_IMAGE = (400, 200)  # pixels: smaller images are decoration, not a scanned page
SCAN_COVER = 0.8      # share of the page an image must cover to count as a scan under a text layer


def run(cmd):
    return subprocess.run(cmd, capture_output=True, encoding='utf-8', errors='replace')


def broken_share(text, private=False):
    chars = [c for c in text if not c.isspace()]
    if not chars:
        return 0.0
    kinds = ('Co',) if private else ('Cc', 'Cs', 'Cn')
    bad = sum(1 for c in chars if (c == '\ufffd' and not private) or unicodedata.category(c) in kinds)
    return bad / len(chars)


def is_broken(text):
    return broken_share(text) >= BROKEN_LIMIT or broken_share(text, private=True) >= PRIVATE_LIMIT


def page_sizes(pdf, n):
    """Page sizes in inches, from pdfinfo."""
    out = run(['pdfinfo', '-f', '1', '-l', str(n), pdf]).stdout
    return {int(p): (float(w) / 72, float(h) / 72) for p, w, h in re.findall(r'^Page\s+(\d+) size:\s+([\d.]+) x ([\d.]+)', out, re.M)}


def image_pages(pdf, sizes):
    """Pages with an image of at least MIN_IMAGE pixels, and pages an image covers almost entirely."""
    big, covering = set(), set()
    for line in run(['pdfimages', '-list', pdf]).stdout.splitlines()[2:]:
        f = line.split()
        if len(f) < 14 or not f[0].isdigit() or f[2] != 'image':
            continue
        page, w, h, xppi, yppi = int(f[0]), int(f[3]), int(f[4]), int(f[12]), int(f[13])
        if w >= MIN_IMAGE[0] and h >= MIN_IMAGE[1]:
            big.add(page)
        if xppi and yppi and page in sizes and (w / xppi) * (h / yppi) >= SCAN_COVER * sizes[page][0] * sizes[page][1]:
            covering.add(page)
    return big, covering


def user_tessdata():
    base = os.environ.get('LOCALAPPDATA')
    return os.path.join(base, 'tessdata') if base else os.path.expanduser('~/.local/share/tessdata')


def tesseract_info():
    if shutil.which('tesseract') is None:
        return 'not installed'
    r = run(['tesseract', '--version'])
    version = ((r.stdout or r.stderr).strip().splitlines() or ['tesseract'])[0]
    langs = lambda extra: ' '.join(l.strip() for l in run(['tesseract'] + extra + ['--list-langs']).stdout.splitlines()[1:] if l.strip())
    folder = user_tessdata()
    found = langs(['--tessdata-dir', folder]) if os.path.isdir(folder) else ''
    return (f"{version}; languages: {langs([]) or 'none'}; "
            + (f'in {folder}: {found}' if found else f'no language files in {folder}'))


def check(pdf, min_chars):
    info = run(['pdfinfo', pdf])
    if info.returncode != 0:
        why = (info.stderr or '').strip().splitlines()[-1:] or ['unreadable']
        return {'file': pdf, 'verdict': 'encrypted' if 'assword' in info.stderr else 'error', 'note': why[0]}
    m = re.search(r'^Pages:\s+(\d+)', info.stdout, re.M)
    text = run(['pdftotext', '-layout', pdf, '-'])
    if text.returncode != 0:
        why = (text.stderr or '').strip().splitlines()[-1:] or ['pdftotext failed']
        return {'file': pdf, 'verdict': 'encrypted' if 'assword' in text.stderr else 'error', 'note': why[0]}
    pages = text.stdout.split('\f')
    if pages and not pages[-1].strip():
        pages.pop()
    n = int(m.group(1)) if m else len(pages)
    chars = [len(re.sub(r'\s', '', p)) for p in pages]
    images, covering = image_pages(pdf, page_sizes(pdf, n))
    image_only = [i + 1 for i, c in enumerate(chars) if c < min_chars and (i + 1) in images]
    sparse = [i + 1 for i, c in enumerate(chars) if c < min_chars and (i + 1) not in images]
    broken_pages = [i + 1 for i, p in enumerate(pages) if chars[i] >= min_chars and is_broken(p)]
    usable = [i for i, c in enumerate(chars) if c >= min_chars and (i + 1) not in broken_pages]
    ocr = sorted(set(image_only) | set(broken_pages))
    over_image = [i + 1 for i in usable if (i + 1) in covering]
    if not usable and broken_pages:
        verdict = 'unusable-text'
    elif not usable:
        verdict = 'no-text'
    elif ocr:
        verdict = 'mixed'
    else:
        verdict = 'text'
    samples = [(i + 1, ' '.join(pages[i].split())[:200]) for i in sorted({usable[0], usable[len(usable) // 2]})] if usable else []
    return {'file': pdf, 'verdict': verdict, 'pages': n, 'usable': len(usable), 'image_only': image_only,
            'broken_pages': broken_pages, 'sparse': sparse, 'ocr': ocr if usable else list(range(1, n + 1)), 'over_image': over_image,
            'chars': chars, 'broken': broken_share(text.stdout), 'samples': samples}


def show(r, tesseract):
    print(f"FILE: {r['file']}")
    print(f"VERDICT: {r['verdict']}")
    if 'note' in r:
        print(f"NOTE: {r['note']}")
        return
    print(f"PAGES: {r['pages']} (with text {r['usable']}, image-only {len(r['image_only'])}, "
          f"broken {len(r['broken_pages'])}, sparse {len(r['sparse'])})")
    for label, key in (('IMAGE-ONLY PAGES', 'image_only'), ('BROKEN PAGES', 'broken_pages'), ('SPARSE PAGES', 'sparse'),
                       ('TEXT OVER IMAGE PAGES', 'over_image'), ('OCR PAGES', 'ocr')):
        if r[key]:
            print(f'{label}: ' + ', '.join(map(str, r[key])))
    if r['ocr'] or r['over_image']:
        print(f'TESSERACT: {tesseract}')
    if r['chars']:
        print(f"NON-SPACE CHARACTERS PER PAGE: median {int(statistics.median(r['chars']))}, "
              f"min {min(r['chars'])}, max {max(r['chars'])}")
    print(f"BROKEN CHARACTERS: {r['broken']:.1%}")
    for page, sample in r['samples']:
        print(f'SAMPLE (page {page}): {sample}')


def main():
    ap = argparse.ArgumentParser(description='Classify PDFs by their text layer.')
    ap.add_argument('pdfs', nargs='+')
    ap.add_argument('--min-chars', type=int, default=100)
    args = ap.parse_args()
    if any(shutil.which(t) is None for t in TOOLS):
        print(INSTALL_HINT, file=sys.stderr)
        sys.exit(2)
    results = [check(p, args.min_chars) for p in args.pdfs]
    tesseract = tesseract_info() if any(r.get('ocr') or r.get('over_image') for r in results) else ''
    for i, r in enumerate(results):
        if i:
            print()
        show(r, tesseract)
    sys.exit(0 if all('note' not in r for r in results) else 1)


if __name__ == '__main__':
    main()
