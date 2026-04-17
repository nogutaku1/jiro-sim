#!/usr/bin/env python3
"""Extract base64 ASSETS from index.html to /assets/scenes/ and rewrite HTML."""
import re, base64, pathlib, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
HTML = ROOT / "index.html"
OUT = ROOT / "assets" / "scenes"
OUT.mkdir(parents=True, exist_ok=True)

text = HTML.read_text(encoding="utf-8")

# Match: key: "data:image/jpeg;base64,..." or data:video/mp4;base64,...
pat = re.compile(r'^(\s*)(\w+):\s*"data:(image/(?:jpeg|jpg|png|webp)|video/mp4);base64,([A-Za-z0-9+/=]+)"(,?)\s*$', re.M)

replacements = []
for m in pat.finditer(text):
    indent, key, mime, b64, comma = m.group(1), m.group(2), m.group(3), m.group(4), m.group(5)
    ext = {"image/jpeg":"jpg","image/jpg":"jpg","image/png":"png","image/webp":"webp","video/mp4":"mp4"}[mime]
    fname = f"{key}.{ext}"
    (OUT / fname).write_bytes(base64.b64decode(b64))
    new_line = f'{indent}{key}: "/assets/scenes/{fname}"{comma}'
    replacements.append((m.group(0), new_line, fname, len(b64)))
    print(f"extracted {fname} ({len(b64)//1024}KB b64)")

new_text = text
for old, new, *_ in replacements:
    new_text = new_text.replace(old, new)

HTML.write_text(new_text, encoding="utf-8")
print(f"\ndone. {len(replacements)} assets. html: {len(text)//1024}KB -> {len(new_text)//1024}KB")
