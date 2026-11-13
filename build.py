"""Build the Ceramind calculator embeds: src/<name>.js + src/base.css -> <embed file> in the repo root.

    python3 build.py            # build every calculator listed in CALCS
    python3 build.py kiln-cost  # build one

Every calculator shares one look (src/base.css) and the shared helpers in src/shared.js (the copy-code box).
The shrinkage embed itself is the original hand-made file and is not built from here.
"""
import json, re, sys
from pathlib import Path

HERE = Path(__file__).parent
CALCS = {
    "kiln-cost": "ceramind-kiln-cost-calculator-embed.js",
}
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
    out = HERE / CALCS[name]
    assert src.count(JS_MARK) == 1, f"{name}: expected one {JS_MARK} marker"
    shared = (HERE / "src" / "shared.js").read_text()
    out.write_text(src.replace(MARK, json.dumps(base_css())).replace(JS_MARK, shared))
    print(f"built {out.name} ({out.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    for n in sys.argv[1:] or CALCS:
        build(n)
