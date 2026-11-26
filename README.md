# Ceramind Calculators

Free pottery calculators for [ceramindtools.com](https://www.ceramindtools.com). Each one is a single script you can embed on any page:

```html
<div class="ceramind-kiln-cost-calculator"></div>
<script src="https://cdn.jsdelivr.net/gh/ceramindtools/ceramind-calculators@main/ceramind-kiln-cost-calculator-embed.js" async></script>
```

| Calculator | Embed file | Source |
|---|---|---|
| Clay shrinkage | `ceramind-shrinkage-calculator-embed.js` | the original hand-made file (its look is the shared look) |
| Cone & kiln temperature converter | `ceramind-cone-converter-embed.js` | `src/cone-converter.js` (rebuilt on the shared look, Nov 2026; same file name and class as the July original) |
| Pottery pricing | `ceramind-pricing-calculator-embed.js` | `src/pricing.js` (rebuilt on the shared look, Nov 2026) |
| Kiln firing cost | `ceramind-kiln-cost-calculator-embed.js` | `src/kiln-cost.js` |

## How it's built
- `src/base.css` is the shared look. It copies the clay shrinkage calculator, so every calculator looks the same. Change the look there, never per calculator.
- `src/<name>.js` is each calculator. `python3 build.py` inlines the shared look and writes the embed file in the repo root. The pages load that embed file.
- `tests/<name>.json` holds click-through cases with hand-worked answers.
  - `node tools/check.cjs <url> tests/<name>.json <out dir>` runs them.
  - It also takes desktop and phone screenshots.
  - `tools/preview.html` shows the calculator next to the shrinkage one locally.

## Prefill (opening on a page's own example)
- A page can open a calculator on its own worked example with data attributes on the div, e.g.
  `<div class="ceramind-shrinkage-calculator" data-mode="finished" data-shrinkage="12" data-width="7"></div>`.
- Each calculator lists the attributes it accepts in its `PREFILL` map; `applyPrefill()` in `src/shared.js` puts the values in through the same events a person makes. No attributes means it opens exactly as before.
  - **Shrinkage:** mode (finished or current), units (cm or in), shrinkage, height, width, depth.
  - **Plaster mix:** units (l or ml), plaster (a key such as pc-potters, or custom), ratio, volume, extra.
  - **Glaze mixing:** mode (batch, water or pots), batch, powder, sg, pots, per.
- `node tools/check-prefill.cjs file://$PWD/tools/preview-prefill.html <out dir>` checks the blog examples.
- Learn Pottery posts use this (26 Nov 2026): the theme snippet `ceramind-calc-embeds` loads the script for any calculator div in a post.

## Draft first
- **The `main` branch is live:** the store pages load it through jsDelivr.
- **New work goes on the `draft` branch.** It's tested through a hidden store template that loads the draft by commit, and only reaches `main` once it's approved.
- **After a merge:** purge the jsDelivr cache for the changed files, e.g. `https://purge.jsdelivr.net/gh/ceramindtools/ceramind-calculators@main/<file>`.
