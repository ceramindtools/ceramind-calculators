# Ceramind Calculators

Free pottery calculators for [ceramindtools.com](https://www.ceramindtools.com). Each one is a single script you can embed on any page:

```html
<div class="ceramind-kiln-cost-calculator"></div>
<script src="https://cdn.jsdelivr.net/gh/ceramindtools/ceramind-calculators@main/ceramind-kiln-cost-calculator-embed.js" async></script>
```

| Calculator | Embed file | Source |
|---|---|---|
| Clay shrinkage | `ceramind-shrinkage-calculator-embed.js` | the original hand-made file (its look is the shared look) |
| Cone & kiln temperature converter | `ceramind-cone-converter-embed.js` | hand-made, own look |
| Pottery pricing | `ceramind-pricing-calculator-embed.js` | hand-made, own look |
| Kiln firing cost | `ceramind-kiln-cost-calculator-embed.js` | `src/kiln-cost.js` |

## How it's built
- `src/base.css` is the shared look. It copies the clay shrinkage calculator, so every calculator looks the same. Change the look there, never per calculator.
- `src/<name>.js` is each calculator. `python3 build.py` inlines the shared look and writes the embed file in the repo root. The pages load that embed file.
- `tests/<name>.json` holds click-through cases with hand-worked answers.
  - `node tools/check.cjs <url> tests/<name>.json <out dir>` runs them.
  - It also takes desktop and phone screenshots.
  - `tools/preview.html` shows the calculator next to the shrinkage one locally.

## Draft first
- **The `main` branch is live:** the store pages load it through jsDelivr.
- **New work goes on the `draft` branch.** It's tested through a hidden store template that loads the draft by commit, and only reaches `main` once it's approved.
- **After a merge:** purge the jsDelivr cache for the changed files, e.g. `https://purge.jsdelivr.net/gh/ceramindtools/ceramind-calculators@main/<file>`.
