"""Build the Ceramind calculator embeds: src/<name>.js + src/base.css + src/shared.js -> <embed file> in the repo root.

    python3 build.py            # build every calculator in src/ (each declares var EMBED_FILE = '...')
    python3 build.py kiln-cost  # build one

Every calculator shares one look (src/base.css) and the shared helpers in src/shared.js (the copy-code box).
The shrinkage calculator was moved onto the shared look on 13 Nov 2026 (same maths as the July original).
Calculators are found automatically, so parallel builds never need to edit this file.
"""
import json, re, sys
from pathlib import Path

HERE = Path(__file__).parent


def calcs():
    out = {}
    for f in sorted((HERE / "src").glob("*.js")):
        if f.name == "shared.js":
            continue
        m = re.search(r"var EMBED_FILE = '([\w.-]+-embed\.js)'", f.read_text())
        assert m, f"{f.name}: no var EMBED_FILE = '...-embed.js'"
        out[f.stem] = m.group(1)
    return out


MARK = "/*@BASE_CSS@*/''"
JS_MARK = "/*@SHARED_JS@*/"


def base_css():
    css = (HERE / "src" / "base.css").read_text()
    css = re.sub(r"/\*.*?\*/", "", css, flags=re.S)
    css = re.sub(r"\s+", " ", css)
    css = re.sub(r"\s*([{};,>])\s*", r"\1", css)
    return css.strip()


def build(name):
    src = (HERE / "src" / f"{name}.js").read_text()
    assert src.count(MARK) == 1, f"{name}: expected one {MARK} marker"
    out = HERE / calcs()[name]
    assert src.count(JS_MARK) == 1, f"{name}: expected one {JS_MARK} marker"
    shared = (HERE / "src" / "shared.js").read_text()
    out.write_text(src.replace(MARK, json.dumps(base_css())).replace(JS_MARK, shared))
    print(f"built {out.name} ({out.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    for n in sys.argv[1:] or calcs():
        build(n)
