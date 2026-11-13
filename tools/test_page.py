"""Put a calculator draft on the real store theme behind a private link, for testing before anything goes live.

    python3 tools/test_page.py "<page folder>" "<page title>" [commit]

<page folder>/page-body.html is the proposed page text (it becomes the real page body when approved).
This writes <page folder>/theme/templates/page.calc-draft.json: the theme's own page layout (title + page text)
with the script pointed at the draft commit instead of @main, pushes only that file to the live theme,
and prints the private test link (/pages/partner?view=calc-draft). Nothing a customer can reach changes.
"""
import json, re, subprocess, sys
from pathlib import Path

STORE = "zc0r0u-hm.myshopify.com"
THEME_ID = "194581692682"          # Concept (live)
REPO = Path(__file__).resolve().parent.parent
SUFFIX = "calc-draft"


def main(folder, title, commit=None):
    folder = Path(folder)
    commit = commit or subprocess.run(["git", "-C", str(REPO), "rev-parse", "HEAD"], capture_output=True, text=True, check=True).stdout.strip()
    body = (folder / "page-body.html").read_text()
    body = re.sub(r'(<script src="https://cdn\.jsdelivr\.net/gh/ceramindtools/ceramind-calculators)@main/',
                  rf"\1@{commit}/", body)
    assert f"@{commit}/" in body, "no calculator script found in page-body.html"
    liquid = (
        '<div class="title-wrapper leading-none text-left">'
        f'<h1 class="heading title-lg tracking-heading">{title}</h1></div>'
        f'<div class="page rte text-base">{body}</div>')
    tpl = {"sections": {"main": {"type": "custom-liquid", "settings": {
        "liquid": liquid, "padding_top": 72, "padding_bottom": 120,
        "divider": False, "narrow": True, "rounded": False}}}, "order": ["main"]}
    out = folder / "theme" / "templates" / f"page.{SUFFIX}.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(tpl, indent=2) + "\n")
    r = subprocess.run(["shopify", "theme", "push", "--store", STORE, "--theme", THEME_ID, "--path", str(folder / "theme"),
                        "--only", f"templates/page.{SUFFIX}.json", "--allow-live", "--nodelete"], capture_output=True, text=True)
    if r.returncode:
        raise SystemExit(r.stdout[-1500:] + r.stderr[-1500:])
    print(f"pushed draft {commit[:7]} -> https://ceramindtools.com/pages/partner?view={SUFFIX}")


if __name__ == "__main__":
    main(*sys.argv[1:])
