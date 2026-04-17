import re

path = r"d:\Kiran\GIT\Ekta Bharat Verband\index.html"

with open(path, encoding="utf-8") as f:
    content = f.read()

# Each corrupted sequence is a UTF-8 multi-byte char read as latin-1.
# Fix: encode the mojibake chars back to latin-1 bytes, then decode as UTF-8.
# We replace the known corrupted sequences with safe HTML entities.

replacements = [
    # footer star ✦ (U+2726)
    ("\u00e2\u009c\u00a6", "&#x2726;"),
    # em-dash — (U+2014)  in meta description
    ("\u00e2\u0080\u0094", "&#x2014;"),
    # left double quote " (U+201C)
    ("\u00e2\u0080\u009c", "&#x201C;"),
    # right double quote " (U+201D)
    ("\u00e2\u0080\u009d", "&#x201D;"),
    # right single quote / apostrophe ' (U+2019)
    ("\u00e2\u0080\u0099", "&#x2019;"),
    # left single quote ' (U+2018)
    ("\u00e2\u0080\u0098", "&#x2018;"),
    # ellipsis … (U+2026)
    ("\u00e2\u0080\u00a6", "&#x2026;"),
    # bullet • (U+2022)
    ("\u00e2\u0080\u00a2", "&#x2022;"),
    # en dash – (U+2013)
    ("\u00e2\u0080\u0093", "&#x2013;"),
    # Devanagari ह (U+0939)
    ("\u00e0\u00a4\u00b9", "\u0939"),
    # Devanagari ि (U+093F)
    ("\u00e0\u00a4\u00bf", "\u093f"),
]

for bad, good in replacements:
    if bad in content:
        count = content.count(bad)
        content = content.replace(bad, good)
        print(f"Fixed {count}x: {repr(bad)} -> {repr(good)}")

with open(path, "w", encoding="utf-8") as f:
    f.write(content)

print("Done.")
