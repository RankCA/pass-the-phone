#!/usr/bin/env python3
"""Add a version tag to every local script and stylesheet link.

GitHub Pages lets browsers keep files for 10 minutes. Without a tag, a browser
can pair a new page with an old copy of shared/party.js, and the game never
starts. Run this before every push:

    python3 tools/stamp.py

It rewrites src="x.js" and href="x.css" in each .html file to
src="x.js?v=<hash>". The hash comes from the file's contents, so a link only
changes when its file does. It also fails on links that only work on a
case-insensitive disk, because GitHub Pages is case-sensitive.
"""
import hashlib
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LINK = re.compile(r'\b(src|href)="([^"?#:]+\.(?:js|css))(?:\?v=[0-9a-f]*)?"')


def exact(path):
    """True when the file exists with this exact spelling, case included."""
    rel = os.path.relpath(path, ROOT)
    if rel.startswith(".."):
        return False
    here = ROOT
    for part in rel.split(os.sep):
        if part not in os.listdir(here):
            return False
        here = os.path.join(here, part)
    return os.path.isfile(here)


def stamp(page, problems):
    with open(page, encoding="utf-8", newline="") as f:
        text = f.read()

    def swap(m):
        attr, ref = m.group(1), m.group(2)
        if ref.startswith("/"):
            return m.group(0)
        target = os.path.normpath(os.path.join(os.path.dirname(page), ref))
        if not exact(target):
            problems.append("%s: %s" % (os.path.relpath(page, ROOT), ref))
            return m.group(0)
        with open(target, "rb") as f:
            tag = hashlib.sha1(f.read()).hexdigest()[:8]
        return '%s="%s?v=%s"' % (attr, ref, tag)

    new = LINK.sub(swap, text)
    if new != text:
        with open(page, "w", encoding="utf-8", newline="") as f:
            f.write(new)
    return new != text


if __name__ == "__main__":
    problems, changed, pages = [], [], 0
    for folder, dirs, files in os.walk(ROOT):
        dirs[:] = sorted(d for d in dirs if not d.startswith(".") and d != "tools")
        for name in sorted(files):
            if name.endswith(".html"):
                pages += 1
                page = os.path.join(folder, name)
                if stamp(page, problems):
                    changed.append(os.path.relpath(page, ROOT))
    for c in changed:
        print("stamped", c)
    print("%d pages checked, %d updated" % (pages, len(changed)))
    if problems:
        print("Missing or wrongly cased files:")
        for p in problems:
            print("  " + p)
        sys.exit(1)
