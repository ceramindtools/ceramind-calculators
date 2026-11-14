/*
 * Ceramind Tools — Glaze Mixing Calculator (embeddable version)
 *
 * Paste this wherever the calculator should appear:
 *
 *   <div class="ceramind-glaze-mixing-calculator"></div>
 *   <script src="https://cdn.jsdelivr.net/gh/ceramindtools/ceramind-calculators@main/ceramind-glaze-mixing-calculator-embed.js" async></script>
 *
 * Built by build.py from src/glaze-mixing.js + src/base.css. Edit those, then run build.py.
 *
 * Three jobs: batch a recipe into grams, work out the water for a target specific gravity (SG),
 * and estimate how much glaze to mix for a number of pots.
 *
 * Numbers used (quotes and links in Ceramind Tools/Website/Calculators/Glaze Mixing/sources.md):
 * - SG = weight of a volume of glaze ÷ weight of the same volume of water. 100 ml of glaze weighing 145 g is SG 1.45.
 *   Water is 1.00. Sources: Potclays, "Powdered Glazes, Colours & Frits"; Ceramic Arts Network, "Tips and Tools:
 *   Specific Gravity" (10 ml syringe: 14.7 g = SG 1.47).
 * - Dry glaze materials are taken as 2.6 times as dense as water (particle density 2.6 g/ml), the average used in
 *   Brongniart's formula. Digitalfire lists kaolin 2.62, potash feldspar 2.56 and calcium carbonate 2.80.
 *   Check: at 2.6, 1 kg of powder at SG 1.40 makes 1.54 L, matching Potclays' "1kg of glaze powder makes
 *   approximately 1.54 litres" (mixed for dipping to "an average specific-gravity of 1.4"). And Digitalfire's
 *   "2500 grams of dry material mix with 2500 grams of water produce a gallon of about 1.45" comes out at 1.44.
 * - The maths: powder of weight D fills D ÷ 2.6 ml. Water W adds W g and W ml. SG = (D + W) ÷ (D ÷ 2.6 + W),
 *   so W = D × (1 − SG ÷ 2.6) ÷ (SG − 1). Thinning a mixed bucket needs no density: volume = weight ÷ SG now,
 *   and water to add = volume × (SG now − target) ÷ (target − 1).
 * - Presets: dipping 1.45 (Digitalfire: "1.4 SG (for a 5-second dipping time) to 1.5 (for a 1-second time)", and
 *   home-made glazes "generally do best with them in the 1.45 range"). Brushing 1.50 (Spectrum via Sheffield Pottery:
 *   "brushing glazes usually have SG in the range of 1.45 to 1.60"). Spraying 1.35 (Roger Graham, "Glaze Spraying
 *   for the Craft Potter", published by Digitalfire: "mostly 1.35 or 1.4", and he sprays glazes at 1.35).
 * - Sanity: above 1.00 (water) and at most 2.0. Below 1.20 is thinner than any glaze quoted (brushing glazes go
 *   down to about 1.25, Digitalfire). Above 1.70 is past the top of Spectrum's dipping range ("1.50 to 1.70") and
 *   near casting slip, "1.80–1.85" (Wikipedia, Slip casting).
 * - Glaze per pot: a mug takes about 0.15 L (Potclays, "How much powder glaze"). The other pots are OUR estimates,
 *   scaled from that mug by the area glazed inside and out (mug 8.5 x 9.5 cm = about 564 cm², so about 0.27 ml per cm²).
 * - A base that doesn't add up to 100 (e.g. written in parts, 4/3/2/1) is read as parts and scaled to 100, so the
 *   grams are always right; the person is told. "Scale to 100%" only rewrites the base; additions stay as typed.
 * - Additions (colourants, opacifiers) are percentages of the base and go on top of its 100 (Ceramic Arts Daily
 *   forum; Ceramic School's worked example totals 107.3).
 * - Default recipe: Leach 4-3-2-1 (potash feldspar 40, silica 30, whiting 20, kaolin 10), as printed in Roger Graham's
 *   guide ("Leach Cone-8 glaze"), plus a 5% red iron oxide addition as an example.
 */
(function () {
  var TARGET_CLASS = 'ceramind-glaze-mixing-calculator';
  var BASE_ID = 'ceramind-calc-base-v1';
  var STYLE_ID = 'ceramind-glaze-mixing-style';
  var BASE_CSS = ".cm-calc,.cm-calc *{box-sizing: border-box;}.cm-calc{--cm-ink: #171717;--cm-brand: #473728;--cm-brand-soft: #4a4642;--cm-accent: #a4886e;--cm-sand: #d2c1b4;--cm-tint: #ffffff;--cm-bg: #e3e0df;--cm-card: #efedeb;--cm-border: #d9d4d0;--cm-field: #8f857c;font-family: inherit;color: var(--cm-ink);max-width: 480px;margin: 2rem auto;text-align: left;}.cm-calc [hidden]{display: none !important;}.cm-calc .cm-card{background: var(--cm-card);border: 1px solid var(--cm-border);border-radius: 14px;padding: 1.75rem;box-shadow: 0 1px 2px rgba(71,55,40,0.06),0 8px 24px rgba(71,55,40,0.06);}.cm-calc .cm-title{margin: 0 0 0.35rem;font-size: 1.35rem;font-weight: 700;color: var(--cm-brand);line-height: 1.2;}.cm-calc .cm-sub{margin: 0 0 1.25rem;font-size: 0.9rem;color: var(--cm-brand-soft);line-height: 1.45;}.cm-calc .cm-mode-toggle{display: flex;gap: 0.4rem;margin-bottom: 1.1rem;flex-wrap: wrap;}.cm-calc .cm-mode-btn{flex: 1 1 auto;min-width: 140px;padding: 0.55rem 0.7rem;font-size: 0.82rem;font-weight: 600;font-family: inherit;line-height: 1.3;border-radius: 999px;border: 1px solid var(--cm-field);background: transparent;color: var(--cm-brand-soft);cursor: pointer;transition: background 0.15s ease,color 0.15s ease,border-color 0.15s ease;}.cm-calc .cm-mode-btn.is-active{background: var(--cm-brand);border-color: var(--cm-brand);color: #fff;}.cm-calc a:focus-visible,.cm-calc .cm-mode-btn:focus-visible,.cm-calc .cm-unit-btn:focus-visible,.cm-calc select:focus-visible,.cm-calc input:focus-visible{outline: 2px solid var(--cm-brand);outline-offset: 2px;}.cm-calc .cm-row{display: flex;align-items: center;justify-content: space-between;gap: 1rem;margin-bottom: 0.85rem;}.cm-calc .cm-label{font-size: 0.85rem;font-weight: 600;color: var(--cm-brand);flex: 0 0 auto;}.cm-calc select,.cm-calc input[type=\"number\"]{font: inherit;font-size: 0.9rem;padding: 0.5rem 0.65rem;border-radius: 8px;border: 1px solid var(--cm-field);background: #fff;color: var(--cm-ink);max-width: 220px;width: 100%;margin: 0;min-height: 0;height: auto;}.cm-calc .cm-unit-toggle{display: flex;gap: 0.3rem;}.cm-calc .cm-unit-btn{padding: 0.4rem 0.85rem;font-size: 0.82rem;font-weight: 600;font-family: inherit;line-height: 1.3;border-radius: 8px;border: 1px solid var(--cm-field);background: transparent;color: var(--cm-brand-soft);cursor: pointer;}.cm-calc .cm-unit-btn.is-active{background: var(--cm-tint);border-color: var(--cm-brand);box-shadow: inset 0 0 0 1px var(--cm-brand);color: var(--cm-brand);}.cm-calc .cm-dims{display: grid;grid-template-columns: repeat(auto-fit,minmax(120px,1fr));gap: 0.75rem;margin: 1rem 0 1.25rem;}.cm-calc .cm-dim-label{display: block;font-size: 0.78rem;font-weight: 600;color: var(--cm-brand-soft);margin-bottom: 0.3rem;}.cm-calc .cm-dims input[type=\"number\"],.cm-calc .cm-dim-input{width: 100%;max-width: none;}.cm-calc .cm-visual{display: flex;align-items: center;gap: 1rem;background: var(--cm-bg);border-radius: 10px;padding: 0.9rem 1rem;margin-bottom: 1.1rem;}.cm-calc .cm-svg{width: 76px;height: 76px;flex: 0 0 auto;}.cm-calc .cm-visual-pct{margin: 0;font-size: 1.05rem;font-weight: 700;color: var(--cm-brand);line-height: 1.3;}.cm-calc .cm-visual-legend{margin: 0.3rem 0 0;font-size: 0.75rem;color: var(--cm-brand-soft);}.cm-calc .cm-visual-note{margin: 0.25rem 0 0;font-size: 0.68rem;font-style: italic;color: var(--cm-brand-soft);line-height: 1.4;}.cm-calc .cm-dot{display: inline-block;width: 9px;height: 9px;border-radius: 50%;margin-right: 0.3rem;vertical-align: middle;}.cm-calc .cm-dot-wet{border: 1.5px dashed var(--cm-brand-soft);}.cm-calc .cm-dot-fired{background: var(--cm-brand);}.cm-calc .cm-results{background: var(--cm-brand);color: #fff;border-radius: 10px;padding: 1rem 1.1rem;margin-bottom: 1.1rem;}.cm-calc .cm-results-title{margin: 0 0 0.5rem;font-size: 0.78rem;font-weight: 700;text-transform: uppercase;letter-spacing: 0.06em;opacity: 0.85;}.cm-calc .cm-results-list{margin: 0;padding: 0;list-style: none;display: flex;flex-direction: column;gap: 0.35rem;font-size: 1rem;font-weight: 600;}.cm-calc .cm-results-list li{margin: 0;padding: 0;color: #fff;}.cm-calc .cm-results-list li::before,.cm-calc .cm-results-list li::marker{content: none;}.cm-calc .cm-results-empty{font-size: 0.85rem;font-weight: 400;opacity: 0.75;}.cm-calc .cm-results-note{margin: 0.6rem 0 0;font-size: 0.75rem;font-weight: 400;opacity: 0.8;line-height: 1.4;color: #fff;}.cm-calc .cm-disclaimer{margin: 0 0 0.6rem;text-align: center;font-size: 0.7rem;line-height: 1.45;color: var(--cm-brand-soft);}.cm-calc .cm-credit{margin: 0;text-align: center;font-size: 0.72rem;color: var(--cm-brand-soft);}.cm-calc .cm-credit a{color: var(--cm-brand);font-weight: 600;text-decoration: none;}.cm-calc .cm-credit a:hover,.cm-calc .cm-credit a:focus-visible{text-decoration: underline;}@media (prefers-reduced-motion: reduce){.cm-calc *{transition: none !important;}}.cm-calc.cm-embed{max-width: none;margin: 0.75rem 0 1.5rem;}.cm-calc .cm-code-box{display: flex;align-items: center;gap: 0.9rem;background: var(--cm-card);border: 1px solid var(--cm-border);border-radius: 10px;padding: 0.9rem 1rem;}.cm-calc pre.cm-code{margin: 0;padding: 0;flex: 1 1 auto;min-width: 0;background: transparent;border: 0;font-family: ui-monospace,\"SF Mono\",Menlo,Consolas,monospace;font-size: 0.78rem;line-height: 1.55;color: var(--cm-ink);white-space: pre-wrap;word-break: normal;overflow-wrap: anywhere;}.cm-calc .cm-copy-btn{flex: 0 0 auto;padding: 0.55rem 1rem;font-family: inherit;font-size: 0.82rem;font-weight: 600;line-height: 1.3;border-radius: 999px;border: 1px solid var(--cm-brand);background: var(--cm-brand);color: #fff;cursor: pointer;transition: background 0.15s ease,color 0.15s ease;}.cm-calc .cm-copy-btn.is-done{background: #fff;color: var(--cm-brand);}.cm-calc .cm-copy-btn:focus-visible{outline: 2px solid var(--cm-brand);outline-offset: 2px;}.cm-calc .cm-hint{margin: -0.6rem 0 1.1rem;font-size: 0.75rem;line-height: 1.45;color: var(--cm-brand-soft);}.cm-calc .cm-sr{position: absolute !important;width: 1px;height: 1px;margin: -1px;padding: 0;overflow: hidden;clip: rect(0 0 0 0);white-space: nowrap;border: 0;}.cm-calc .cm-key{white-space: nowrap;margin-right: 0.6rem;}@media (max-width: 480px){.cm-calc .cm-card{padding: 1.4rem 1.25rem;}.cm-calc .cm-code-box{flex-direction: column;align-items: stretch;}.cm-calc .cm-row{display: grid;grid-template-columns: minmax(0,1fr);gap: 0.35rem;margin-bottom: 1rem;}.cm-calc .cm-row>select,.cm-calc .cm-row>input{max-width: none;}.cm-calc .cm-row>.cm-unit-toggle{justify-self: start;}}";
  var EMBED_FILE = 'ceramind-glaze-mixing-calculator-embed.js';

  // ---- Shared by every calculator (build.py inlines this from src/shared.js) ----
  // Turns <div class="ceramind-embed-code" data-for="<calculator class>"><pre>…</pre></div> on a Ceramind page
  // into a code box with a Copy button. The <pre> inside is the no-JavaScript fallback. Other sites never have
  // this div, so nothing extra appears where the calculator is embedded elsewhere.
  function embedCodeBoxes(targetClass, file) {
    var code = '<div class="' + targetClass + '"></div>\n'
      + '<script src="https://cdn.jsdelivr.net/gh/ceramindtools/ceramind-calculators@main/' + file + '" async></' + 'script>';
    var boxes = document.querySelectorAll('.ceramind-embed-code[data-for="' + targetClass + '"]');
    for (var i = 0; i < boxes.length; i++) {
      var box = boxes[i];
      if (box.dataset.ceramindInit === 'true') continue;
      box.dataset.ceramindInit = 'true';
      box.classList.add('cm-calc', 'cm-embed');
      box.innerHTML = '<div class="cm-code-box"><pre class="cm-code"></pre>'
        + '<button type="button" class="cm-copy-btn">Copy code</button></div>';
      wireCopy(box.querySelector('.cm-copy-btn'), box.querySelector('.cm-code'), code);
    }
  }

  function wireCopy(btn, pre, code) {
    // Show the code with line-break chances after each "/" so long URLs wrap at a slash, not mid-word.
    pre.innerHTML = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\//g, '/<wbr>');
    var timer;
    function done(ok) {
      btn.textContent = ok ? 'Copied' : 'Selected: press Ctrl/Cmd + C';
      btn.classList.toggle('is-done', ok);
      clearTimeout(timer);
      timer = setTimeout(function () { btn.textContent = 'Copy code'; btn.classList.remove('is-done'); }, 2500);
    }
    function fallback() {
      var range = document.createRange();
      range.selectNodeContents(pre);
      var sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      done(ok);
    }
    btn.addEventListener('click', function () {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(code).then(function () { done(true); }, fallback);
      } else {
        fallback();
      }
    });
  }
  // ---- end shared ----


  var DENSITY = 2.6;   // dry glaze materials, g per ml
  var PRESET_SG = { dipping: 1.45, brushing: 1.5, spraying: 1.35 };
  var PRESET_NOTES = {
    dipping: 'Dipping: Digitalfire gives 1.40 for a dip of 5 seconds and 1.50 for a dip of 1 second, and finds home-made glazes work best around 1.45.',
    brushing: 'Brushing glazes usually sit between 1.45 and 1.60 (Spectrum). Powdered glaze also needs a brushing medium to brush well (Potclays).',
    spraying: 'Spraying: Roger Graham\'s guide for craft potters sprays most glazes at 1.35 to 1.40.'
  };
  // ml of mixed glaze per pot. Mug: Potclays. The rest: scaled from the mug by glazed area (our estimate).
  var POTS = {
    mug: { ml: 150, one: 'mug', many: 'mugs' },
    espresso: { ml: 80, one: 'espresso cup', many: 'espresso cups' },
    cereal: { ml: 180, one: 'cereal bowl', many: 'cereal bowls' },
    serving: { ml: 400, one: 'serving bowl', many: 'serving bowls' },
    side: { ml: 150, one: 'side plate', many: 'side plates' },
    dinner: { ml: 270, one: 'dinner plate', many: 'dinner plates' },
    vase: { ml: 350, one: 'vase', many: 'vases' },
    own: { ml: 0, one: 'pot', many: 'pots' }
  };
  var DEFAULT_BASE = [['Potash feldspar', 40], ['Silica', 30], ['Whiting', 20], ['China clay', 10]];
  var DEFAULT_ADD = [['Red iron oxide', 5]];
  var COLOURANT = /iron|cobalt|copper|chrom|mangan|nickel|rutile|ilmenite|stain|tin oxide|zircopax|titan|vanad/i;

  var CSS = ''
    + '.cm-calc .cm-gm-modes .cm-mode-btn { flex: 1 1 0; min-width: 0; }'
    + '.cm-calc input[type="text"] { font: inherit; font-size: 0.9rem; padding: 0.5rem 0.65rem; border-radius: 8px;'
    + '  border: 1px solid var(--cm-field); background: #fff; color: var(--cm-ink); width: 100%; margin: 0; min-height: 0; height: auto; }'
    + '.cm-calc .cm-gm-list { margin: 0.3rem 0 1.1rem; }'
    + '.cm-calc .cm-gm-head, .cm-calc .cm-gm-row { display: grid; grid-template-columns: minmax(0, 1fr) 4.75rem 2.5rem; gap: 0.4rem; align-items: center; }'
    + '.cm-calc .cm-gm-head { margin-bottom: 0.35rem; align-items: end; }'
    + '.cm-calc .cm-gm-h { font-size: 0.85rem; font-weight: 600; color: var(--cm-brand); }'
    + '.cm-calc .cm-gm-col { font-size: 0.78rem; font-weight: 600; color: var(--cm-brand-soft); }'
    + '.cm-calc .cm-gm-row { margin-bottom: 0.4rem; }'
    + '.cm-calc .cm-gm-row input[type="number"] { max-width: none; }'
    + '.cm-calc .cm-gm-remove { width: 2.5rem; height: 2.3rem; padding: 0; border-radius: 8px; border: 1px solid var(--cm-field);'
    + '  background: transparent; color: var(--cm-brand); font-family: inherit; font-size: 1.15rem; line-height: 1; cursor: pointer; }'
    + '.cm-calc .cm-gm-remove:hover { background: #fff; }'
    + '.cm-calc .cm-gm-remove:focus-visible, .cm-calc .cm-gm-check button:focus-visible { outline: 2px solid var(--cm-brand); outline-offset: 2px; }'
    + '.cm-calc .cm-gm-foot { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 0.5rem; margin-top: 0.2rem; }'
    + '.cm-calc .cm-gm-sum { font-size: 0.8rem; font-weight: 600; color: var(--cm-brand-soft); }'
    + '.cm-calc .cm-gm-sum.is-off { color: var(--cm-brand); }'
    + '.cm-calc .cm-gm-note { margin: 0 0 0.5rem; font-size: 0.75rem; line-height: 1.45; color: var(--cm-brand-soft); }'
    + '.cm-calc .cm-gm-check { background: #fff; border: 1px solid var(--cm-border); border-left: 3px solid var(--cm-brand);'
    + '  border-radius: 8px; padding: 0.7rem 0.8rem; margin-top: 0.6rem; font-size: 0.8rem; line-height: 1.45; color: var(--cm-ink); }'
    + '.cm-calc .cm-gm-check p { margin: 0 0 0.5rem; }'
    + '.cm-calc .cm-gm-check .cm-gm-btns { display: flex; flex-wrap: wrap; gap: 0.4rem; }'
    + '.cm-calc .cm-gm-vis { background: var(--cm-bg); border-radius: 10px; padding: 0.9rem 1rem; margin-bottom: 1.1rem; }'
    + '.cm-calc .cm-gm-bar { position: relative; display: flex; height: 16px; margin: 0.35rem 0 0.65rem; }'
    + '.cm-calc .cm-gm-seg { height: 100%; flex: 0 0 auto; }'
    + '.cm-calc .cm-gm-seg + .cm-gm-seg { border-left: 2px solid var(--cm-bg); }'
    + '.cm-calc .cm-gm-seg-base { background: var(--cm-brand); }'
    + '.cm-calc .cm-gm-seg-add { background: var(--cm-accent); }'
    + '.cm-calc .cm-gm-seg-water { background: #fff; box-shadow: inset 0 0 0 1px var(--cm-field); }'
    + '.cm-calc .cm-gm-mark { position: absolute; top: -5px; bottom: -5px; width: 2px; margin-left: -1px; background: var(--cm-ink); }'
    + '.cm-calc .cm-dot-add { background: var(--cm-accent); }'
    + '.cm-calc .cm-dot-water { background: #fff; border: 1px solid var(--cm-field); }'
    + '.cm-calc .cm-dot-line { width: 2px; height: 11px; border-radius: 0; background: var(--cm-ink); }'
    + '.cm-calc .cm-gm-legend { margin: 0 0 0.35rem; font-size: 0.75rem; line-height: 1.6; color: var(--cm-brand-soft); }'
    + '.cm-calc .cm-gm-explain { margin: 0; font-size: 0.78rem; line-height: 1.45; color: var(--cm-ink); }'
    + '.cm-calc .cm-results-list li.cm-gm-sub { margin-top: 0.3rem; font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; opacity: 0.85; }'
    + '.cm-calc .cm-results-list li.cm-gm-total { margin-top: 0.15rem; padding-top: 0.45rem; border-top: 1px solid rgba(255,255,255,0.35); }'
    + '@media (max-width: 400px) {'
    + '  .cm-calc .cm-gm-modes { flex-direction: column; }'
    + '  .cm-calc .cm-gm-modes .cm-mode-btn { flex: 0 0 auto; width: 100%; padding: 0.45rem 0.7rem; }'
    + '  .cm-calc .cm-gm-head, .cm-calc .cm-gm-row { grid-template-columns: minmax(0, 1fr) 3.9rem 2.3rem; gap: 0.3rem; }'
    + '  .cm-calc .cm-gm-row input { padding-left: 0.5rem; padding-right: 0.4rem; }'
    + '  .cm-calc .cm-gm-remove { width: 2.3rem; }'
    + '}';

  var uid = 0;

  function template(id) {
    function f(name) { return id + '-' + name; }
    var pots = ''
      + '<option value="mug" selected>Mug</option>'
      + '<option value="espresso">Espresso cup</option>'
      + '<option value="cereal">Cereal bowl · 16 cm</option>'
      + '<option value="serving">Serving bowl · 25 cm</option>'
      + '<option value="side">Side plate · 20 cm</option>'
      + '<option value="dinner">Dinner plate · 27 cm</option>'
      + '<option value="vase">Vase · 20 cm tall</option>'
      + '<option value="own">My own pot</option>';
    return ''
      + '<div class="cm-card">'
      + '  <h3 class="cm-title">Glaze Mixing Calculator</h3>'
      + '  <p class="cm-sub">Turn a glaze recipe into grams, work out the water for the thickness you want, and see how much glaze to mix for your pots.</p>'
      + '  <div class="cm-mode-toggle cm-gm-modes" role="group" aria-label="What to work out">'
      + '    <button type="button" class="cm-mode-btn is-active" data-mode="batch" aria-pressed="true">Batch a recipe</button>'
      + '    <button type="button" class="cm-mode-btn" data-mode="water" aria-pressed="false">Water to add</button>'
      + '    <button type="button" class="cm-mode-btn" data-mode="pots" aria-pressed="false">Glaze for pots</button>'
      + '  </div>'
      // ---- batch a recipe
      + '  <div class="cm-row" data-show="batch">'
      + '    <label class="cm-label" for="' + f('batch') + '">Batch size (g)</label>'
      + '    <input type="number" id="' + f('batch') + '" data-role="batch" min="0" step="any" value="1000" inputmode="decimal">'
      + '  </div>'
      + '  <div class="cm-row" data-show="batch">'
      + '    <span class="cm-label" id="' + f('basis') + '">Batch size is</span>'
      + '    <div class="cm-unit-toggle" role="group" aria-labelledby="' + f('basis') + '">'
      + '      <button type="button" class="cm-unit-btn is-active" data-basis="base" aria-pressed="true">Base only</button>'
      + '      <button type="button" class="cm-unit-btn" data-basis="total" aria-pressed="false">Base + additions</button>'
      + '    </div>'
      + '  </div>'
      + '  <div class="cm-gm-list" data-show="batch">'
      + '    <div class="cm-gm-head" aria-hidden="true"><span class="cm-gm-h">Base recipe</span><span class="cm-gm-col">%</span><span></span></div>'
      + '    <div data-list="base"></div>'
      + '    <div class="cm-gm-foot">'
      + '      <button type="button" class="cm-unit-btn" data-add="base">+ Add ingredient</button>'
      + '      <span class="cm-gm-sum" data-role="base-sum"></span>'
      + '    </div>'
      + '    <div class="cm-gm-check" data-role="check" hidden>'
      + '      <p data-role="check-text"></p>'
      + '      <div class="cm-gm-btns">'
      + '        <button type="button" class="cm-unit-btn" data-role="scale">Scale to 100%</button>'
      + '        <button type="button" class="cm-unit-btn" data-role="move" hidden>Move it to additions</button>'
      + '      </div>'
      + '    </div>'
      + '  </div>'
      + '  <div class="cm-gm-list" data-show="batch">'
      + '    <div class="cm-gm-head" aria-hidden="true"><span class="cm-gm-h">Additions, on top of the base</span><span class="cm-gm-col">%</span><span></span></div>'
      + '    <p class="cm-gm-note">Colourants, opacifiers and anything else a recipe lists after its 100%.</p>'
      + '    <div data-list="add"></div>'
      + '    <div class="cm-gm-foot">'
      + '      <button type="button" class="cm-unit-btn" data-add="add">+ Add an addition</button>'
      + '      <span class="cm-gm-sum" data-role="add-sum"></span>'
      + '    </div>'
      + '  </div>'
      // ---- water to add
      + '  <div class="cm-row" data-show="water">'
      + '    <span class="cm-label" id="' + f('from') + '">Start from</span>'
      + '    <div class="cm-unit-toggle" role="group" aria-labelledby="' + f('from') + '">'
      + '      <button type="button" class="cm-unit-btn is-active" data-from="dry" aria-pressed="true">Dry powder</button>'
      + '      <button type="button" class="cm-unit-btn" data-from="bucket" aria-pressed="false">A mixed bucket</button>'
      + '    </div>'
      + '  </div>'
      + '  <div class="cm-row" data-show="dry">'
      + '    <label class="cm-label" for="' + f('dry') + '">Dry glaze (g)</label>'
      + '    <input type="number" id="' + f('dry') + '" data-role="dry" min="0" step="any" value="1000" inputmode="decimal">'
      + '  </div>'
      + '  <div class="cm-row" data-show="bucket">'
      + '    <label class="cm-label" for="' + f('wet') + '">Glaze weight (kg)</label>'
      + '    <input type="number" id="' + f('wet') + '" data-role="wet" min="0" step="any" inputmode="decimal" placeholder="e.g. 5">'
      + '  </div>'
      + '  <p class="cm-gm-note" data-show="bucket">Weigh the full bucket, then take off what the empty bucket weighs.</p>'
      + '  <div class="cm-row" data-show="bucket">'
      + '    <label class="cm-label" for="' + f('now') + '">SG now</label>'
      + '    <input type="number" id="' + f('now') + '" data-role="now" min="1" max="2" step="0.01" inputmode="decimal" placeholder="e.g. 1.55">'
      + '  </div>'
      // ---- glaze for pots
      + '  <div class="cm-row" data-show="pots">'
      + '    <label class="cm-label" for="' + f('pots') + '">Number of pots</label>'
      + '    <input type="number" id="' + f('pots') + '" data-role="pots" min="0" step="1" value="20" inputmode="numeric">'
      + '  </div>'
      + '  <div class="cm-row" data-show="pots">'
      + '    <label class="cm-label" for="' + f('kind') + '">Kind of pot</label>'
      + '    <select id="' + f('kind') + '" data-role="kind">' + pots + '</select>'
      + '  </div>'
      + '  <div class="cm-row" data-show="pots">'
      + '    <label class="cm-label" for="' + f('per') + '">Glaze per pot (ml)</label>'
      + '    <input type="number" id="' + f('per') + '" data-role="per" min="0" step="any" value="150" inputmode="decimal">'
      + '  </div>'
      // ---- shared by water and pots
      + '  <div class="cm-row" data-show="water pots">'
      + '    <label class="cm-label" for="' + f('use') + '">Applied by</label>'
      + '    <select id="' + f('use') + '" data-role="use">'
      + '      <option value="dipping" selected>Dipping · SG 1.45</option>'
      + '      <option value="brushing">Brushing · SG 1.50</option>'
      + '      <option value="spraying">Spraying · SG 1.35</option>'
      + '      <option value="own">My own SG</option>'
      + '    </select>'
      + '  </div>'
      + '  <div class="cm-row" data-show="water pots">'
      + '    <label class="cm-label" for="' + f('sg') + '">Target SG</label>'
      + '    <input type="number" id="' + f('sg') + '" data-role="sg" min="1" max="2" step="0.01" value="1.45" inputmode="decimal">'
      + '  </div>'
      + '  <p class="cm-gm-note" data-show="water pots">SG is how heavy the glaze is next to water: weigh 100 ml of glaze and divide the grams by 100. Water is 1.00.</p>'
      + '  <p class="cm-gm-note" data-show="pots">The other pots are scaled from the mug by the area glazed. Leave enough in the bucket to dip your tallest pot.</p>'
      // ---- picture and results
      + '  <div class="cm-gm-vis" data-role="vis">'
      + '    <div class="cm-gm-bar" data-role="bar" aria-hidden="true"></div>'
      + '    <p class="cm-gm-legend" data-role="legend"></p>'
      + '    <p class="cm-gm-explain" data-role="explain"></p>'
      + '  </div>'
      + '  <div class="cm-results">'
      + '    <p class="cm-results-title" data-role="title">Weigh out:</p>'
      + '    <ul class="cm-results-list"></ul>'
      + '    <p class="cm-results-note" data-role="note"></p>'
      + '  </div>'
      + '  <p class="cm-sr" aria-live="polite" aria-atomic="true" data-role="sr"></p>'
      + '  <p class="cm-disclaimer">These figures are a starting point, not a guarantee. Glaze powders differ, so check the SG of every batch yourself and test-fire a tile before glazing a full kiln. Ceramind Tools can\'t accept responsibility for results based on these figures.</p>'
      + '  <p class="cm-credit">Powered by <a href="https://www.ceramindtools.com" target="_blank" rel="noopener">Ceramind® Tools</a></p>'
      + '</div>';
  }

  function injectStyles() {
    if (!document.getElementById(BASE_ID)) {
      var base = document.createElement('style');
      base.id = BASE_ID;
      base.textContent = BASE_CSS;
      document.head.appendChild(base);
    }
    if (!document.getElementById(STYLE_ID)) {
      var own = document.createElement('style');
      own.id = STYLE_ID;
      own.textContent = CSS;
      document.head.appendChild(own);
    }
  }

  function initOne(root) {
    if (root.dataset.ceramindInit === 'true') return;
    root.dataset.ceramindInit = 'true';
    root.classList.add('cm-calc');
    uid += 1;
    var id = 'cmgm' + uid;
    root.innerHTML = template(id);

    var mode = 'batch';
    var basis = 'base';
    var from = 'dry';
    var rowSeq = 0;
    var moveRow = null;
    var srTimer;

    function q(sel) { return root.querySelector(sel); }
    function qa(sel) { return Array.prototype.slice.call(root.querySelectorAll(sel)); }
    var lists = { base: q('[data-list="base"]'), add: q('[data-list="add"]') };
    var batchIn = q('[data-role="batch"]');
    var dryIn = q('[data-role="dry"]');
    var wetIn = q('[data-role="wet"]');
    var nowIn = q('[data-role="now"]');
    var potsIn = q('[data-role="pots"]');
    var kind = q('[data-role="kind"]');
    var perIn = q('[data-role="per"]');
    var use = q('[data-role="use"]');
    var sgIn = q('[data-role="sg"]');
    var baseSumEl = q('[data-role="base-sum"]');
    var addSumEl = q('[data-role="add-sum"]');
    var check = q('[data-role="check"]');
    var checkText = q('[data-role="check-text"]');
    var scaleBtn = q('[data-role="scale"]');
    var moveBtn = q('[data-role="move"]');
    var vis = q('[data-role="vis"]');
    var bar = q('[data-role="bar"]');
    var legend = q('[data-role="legend"]');
    var explain = q('[data-role="explain"]');
    var title = q('[data-role="title"]');
    var list = q('.cm-results-list');
    var note = q('[data-role="note"]');
    var sr = q('[data-role="sr"]');

    function num(el) {
      var n = parseFloat(el.value);
      return isNaN(n) || n <= 0 ? NaN : n;
    }

    function fmt(n, dp) {
      // clear float noise first (1.4 - 1 = 0.3999…), so 97.5 shows as 98, not 97
      n = Math.round(n * 1e9) / 1e9;
      return n.toLocaleString('en-GB', { minimumFractionDigits: dp, maximumFractionDigits: dp });
    }

    function pctText(n) {
      return n.toLocaleString('en-GB', { maximumFractionDigits: 2 });
    }

    function typed(el) {
      // what the person typed, with thousands commas for big numbers
      var n = parseFloat(el.value);
      return Math.abs(n) >= 1000 ? n.toLocaleString('en-GB', { maximumFractionDigits: 3 }) : String(n);
    }

    var U = '\u00a0';   // keeps a number and its unit on one line

    function grams(g) {
      if (Math.round(g * 100) / 100 < 1) return fmt(g, 2) + U + 'g';
      if (Math.round(g * 10) / 10 < 100) return fmt(g, 1) + U + 'g';
      return fmt(g, 0) + U + 'g';
    }

    function weight(g) {
      // powder: grams under a kilogram, then kilograms
      if (Math.round(g) < 1000) return fmt(g, 0) + U + 'g';
      var kg = g / 1000;
      return fmt(kg, kg < 9.995 ? 2 : kg < 99.95 ? 1 : 0) + U + 'kg';
    }

    function litres(ml) {
      var l = ml / 1000;
      return fmt(l, l < 9.995 ? 2 : l < 99.95 ? 1 : 0) + U + 'L';
    }

    function water(ml) {
      // water for a jug or the scales: 1 ml weighs 1 g
      if (Math.round(ml) < 10000) return fmt(ml, 0) + U + 'ml (' + fmt(ml, 0) + U + 'g)';
      return litres(ml) + ' (' + litres(ml).replace('L', 'kg') + ')';
    }

    function sgText(s) { return fmt(s, 2); }

    function setPressed(btns, attr, value) {
      btns.forEach(function (b) {
        var on = b.getAttribute(attr) === value;
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
    }

    function line(text, cls) {
      var li = document.createElement('li');
      if (cls) li.className = cls;
      li.textContent = text;
      list.appendChild(li);
    }

    function announce(text) {
      clearTimeout(srTimer);
      srTimer = setTimeout(function () { sr.textContent = text; }, 700);
    }

    function joinAnd(items) {
      if (items.length < 2) return items.join('');
      return items.slice(0, -1).join(', ') + ' and ' + items[items.length - 1];
    }

    function askFor(missing) {
      var t = 'Enter ' + joinAnd(missing) + '.';
      line(t, 'cm-results-empty');
      note.textContent = '';
      vis.hidden = true;
      announce(t);
    }

    function fail(text) {
      line(text, 'cm-results-empty');
      note.textContent = '';
      vis.hidden = true;
      announce(text);
    }

    // ---------- ingredient rows ----------
    function relabel() {
      ['base', 'add'].forEach(function (k) {
        Array.prototype.forEach.call(lists[k].children, function (row, i) {
          var what = (k === 'base' ? 'Base ingredient ' : 'Addition ') + (i + 1);
          var name = row.querySelector('[data-role="name"]').value.trim();
          row.querySelector('[data-label="name"]').textContent = what + ' name';
          row.querySelector('[data-label="pct"]').textContent = what + ' %';
          row.querySelector('[data-role="remove"]').setAttribute('aria-label', 'Remove ' + (name || what.toLowerCase()));
        });
      });
    }

    function addRow(k, name, pct, focus) {
      rowSeq += 1;
      var rid = id + '-r' + rowSeq;
      var row = document.createElement('div');
      row.className = 'cm-gm-row';
      row.innerHTML = ''
        + '<label class="cm-sr" for="' + rid + 'n" data-label="name"></label>'
        + '<input type="text" id="' + rid + 'n" data-role="name" autocomplete="off" placeholder="' + (k === 'base' ? 'Ingredient' : 'e.g. cobalt oxide') + '">'
        + '<label class="cm-sr" for="' + rid + 'p" data-label="pct"></label>'
        + '<input type="number" id="' + rid + 'p" data-role="pct" min="0" step="any" inputmode="decimal" placeholder="%">'
        + '<button type="button" class="cm-gm-remove" data-role="remove">×</button>';
      row.querySelector('[data-role="name"]').value = name || '';
      row.querySelector('[data-role="pct"]').value = pct === undefined || pct === '' ? '' : pct;
      row.querySelector('[data-role="name"]').addEventListener('input', function () { relabel(); render(); });
      row.querySelector('[data-role="pct"]').addEventListener('input', render);
      row.querySelector('[data-role="remove"]').addEventListener('click', function () {
        var next = row.nextElementSibling || row.previousElementSibling;
        row.parentNode.removeChild(row);
        relabel();
        render();
        (next ? next.querySelector('[data-role="name"]') : q('[data-add="' + k + '"]')).focus();
      });
      lists[k].appendChild(row);
      relabel();
      if (focus) row.querySelector('[data-role="name"]').focus();
      return row;
    }

    function readRows(k) {
      var out = [];
      Array.prototype.forEach.call(lists[k].children, function (row, i) {
        var nameIn = row.querySelector('[data-role="name"]');
        var pctIn = row.querySelector('[data-role="pct"]');
        var name = nameIn.value.trim();
        var raw = pctIn.value.trim();
        if (!name && raw === '') return;   // an empty row is ignored
        var p = parseFloat(raw);
        out.push({
          row: row,
          name: name || (k === 'base' ? 'Ingredient ' : 'Addition ') + (i + 1),
          pct: isNaN(p) ? NaN : p,
          input: pctIn
        });
      });
      return out;
    }

    // ---------- SG input: catch grams per 100 ml, per litre and per 10 ml ----------
    function readSG(el, who) {
      var raw = parseFloat(el.value);
      if (isNaN(raw)) return { missing: true };
      var s = raw;
      var notes = [];
      if (raw >= 1000 && raw <= 2000) {
        s = raw / 1000;
        notes.push('Read ' + typed(el) + ' as grams per litre: SG ' + sgText(s) + '.');
      } else if (raw >= 100 && raw <= 200) {
        s = raw / 100;
        notes.push('Read ' + typed(el) + ' as grams per 100 ml: SG ' + sgText(s) + '.');
      } else if (raw >= 10 && raw <= 20) {
        s = raw / 10;
        notes.push('Read ' + typed(el) + ' as grams per 10 ml: SG ' + sgText(s) + '.');
      }
      if (s <= 1) return { error: who + ' must be above 1.00. Water on its own is 1.00, and glaze is water plus powder.' };
      if (s > 2) return { error: who + ' must be 2.0 or less. Glazes sit between about 1.25 and 1.70, and even casting slip is only about 1.8. Enter it like 1.45 (100 ml weighing 145 g).' };
      if (s < 1.2) notes.push('SG ' + sgText(s) + ' is very thin for a glaze: brushing glazes go down to about 1.25 (Digitalfire). Check that\'s what you meant.');
      if (s > 1.7) notes.push('SG ' + sgText(s) + ' is thicker than dipping glazes go (up to 1.70, Spectrum) and close to casting slip (about 1.8), which needs a deflocculant to stay runny.');
      return { sg: s, notes: notes };
    }

    function presetNote() {
      return use.value === 'own' ? 'At your own SG.' : PRESET_NOTES[use.value];
    }

    // ---------- the picture ----------
    function seg(cls, pct) {
      return '<span class="cm-gm-seg ' + cls + '" style="width:' + Math.max(pct, 0).toFixed(3) + '%"></span>';
    }

    function key(cls, text) {
      return '<span class="cm-key"><span class="cm-dot ' + cls + '"></span>' + text + '</span> ';
    }

    function showSplit(powderMl, waterMl, waterLabel, powderLabel) {
      var total = powderMl + waterMl;
      bar.innerHTML = seg('cm-gm-seg-base', powderMl / total * 100) + seg('cm-gm-seg-water', waterMl / total * 100);
      legend.innerHTML = key('cm-dot-fired', (powderLabel || 'Powder') + ' ' + fmt(powderMl, 0) + ' ml')
        + key('cm-dot-water', waterLabel + ' ' + fmt(waterMl, 0) + ' ml');
      bar.hidden = false;
      legend.hidden = false;
      vis.hidden = false;
    }

    // ---------- batch a recipe ----------
    function renderBatch(notes) {
      title.textContent = 'Weigh out:';
      var base = readRows('base');
      var adds = readRows('add');
      var size = num(batchIn);
      if (size < 10) {
        notes.push('Read ' + typed(batchIn) + ' as kilograms: ' + fmt(size * 1000, 0) + ' g.');
        size = size * 1000;
      }

      var baseSum = 0;
      var addSum = 0;
      var missing = [];
      var negative = [];
      base.concat(adds).forEach(function (r) {
        if (isNaN(r.pct)) missing.push('a % for ' + r.name);
        else if (r.pct < 0) negative.push(r.name);
      });
      base.forEach(function (r) { if (r.pct > 0) baseSum += r.pct; });
      adds.forEach(function (r) { if (r.pct > 0) addSum += r.pct; });

      var off = baseSum > 0 && Math.abs(baseSum - 100) >= 0.005;
      baseSumEl.textContent = 'Base total: ' + pctText(baseSum) + (off ? ' (not 100)' : '%');
      baseSumEl.classList.toggle('is-off', off);
      addSumEl.textContent = adds.length ? 'Additions: ' + pctText(addSum) + '%' : '';

      // Is a colourant sitting in the base and pushing it over 100?
      moveRow = null;
      if (baseSum > 100.005) {
        for (var i = 0; i < base.length; i++) {
          if (COLOURANT.test(base[i].name) && base[i].pct > 0) { moveRow = base[i]; break; }
        }
      }
      var checkMsg = '';
      if (off) {
        checkMsg = 'Your base adds up to ' + pctText(baseSum) + ', not 100, so we read it as parts out of ' + pctText(baseSum) + '.';
        if (moveRow) checkMsg += ' ' + moveRow.name + ' looks like a colourant. If your recipe lists it after the 100%, move it to the additions.';
        else checkMsg += ' The weights below are already right. Scaling only rewrites the base as percentages; additions stay as they are.';
      }
      check.hidden = !checkMsg;
      checkText.textContent = checkMsg;
      moveBtn.hidden = !moveRow;
      if (moveRow) moveBtn.setAttribute('aria-label', 'Move ' + moveRow.name + ' to additions');

      if (isNaN(size)) missing.unshift('your batch size');
      if (!base.length) missing.push('at least one base ingredient');
      if (negative.length) return fail('A percentage can\'t be negative: check ' + joinAnd(negative) + '.');
      if (missing.length) return askFor(missing);
      if (baseSum <= 0) return askFor(['a % for at least one base ingredient']);

      // Always work from the base scaled to 100: a base typed as parts (4/3/2/1) or one that is a little off
      // still gives the right glaze. Additions are a % of that base weight.
      var baseW = basis === 'base' ? size : size / (1 + addSum / 100);
      var per = baseW / baseSum;
      base.forEach(function (r) { line(r.name + ': ' + grams(r.pct * per)); });
      var used = adds.filter(function (r) { return r.pct > 0; });
      if (used.length) {
        line('Additions, on top of the base', 'cm-gm-sub');
        used.forEach(function (r) { line(r.name + ' (' + pctText(r.pct) + '%): ' + grams(r.pct / 100 * baseW)); });
      }
      var total = baseW * (1 + addSum / 100);
      line('Total to weigh: ' + grams(total), 'cm-gm-total');

      if (off) {
        notes.push('Your base adds up to ' + pctText(baseSum) + ', not 100, so we read it as parts out of ' + pctText(baseSum) + ' and scaled it to 100%.');
        if (moveRow) notes.push(moveRow.name + ' may belong in the additions.');
      }
      if (used.length && basis === 'base') {
        notes.push('The ' + pctText(addSum) + '% of additions goes on top of the ' + grams(baseW) + ' base, so the batch weighs ' + grams(total) + '.');
      } else if (used.length) {
        notes.push('The additions are counted inside your ' + grams(size) + ', so the base is ' + grams(baseW) + ' and the additions ' + grams(addSum / 100 * baseW) + '.');
      }

      // picture: the base (scaled to 100) up to the 100% line, additions past it
      var scale = 100 + addSum;
      var html = '';
      base.forEach(function (r) { if (r.pct > 0) html += seg('cm-gm-seg-base', r.pct / baseSum * 100 / scale * 100); });
      used.forEach(function (r) { html += seg('cm-gm-seg-add', r.pct / scale * 100); });
      html += '<span class="cm-gm-mark" style="left:' + (100 / scale * 100).toFixed(3) + '%"></span>';
      bar.innerHTML = html;
      legend.innerHTML = key('cm-dot-fired', 'Base 100%')
        + (used.length ? key('cm-dot-add', 'Additions ' + pctText(addSum) + '%') : '')
        + key('cm-dot-line', '100% line');
      explain.textContent = used.length
        ? 'A recipe\'s base adds up to 100. Colourants and other additions are a % of that base and sit on top of it, so the recipe adds up to ' + pctText(baseSum + addSum) + '%.'
        : 'A recipe\'s base adds up to 100. Add any colourants as additions: they sit on top of the 100.';
      vis.hidden = false;
      note.textContent = notes.join(' ');
      announce('Weigh out ' + grams(total) + ' in all.');
    }

    // ---------- water to add ----------
    function renderWater(notes) {
      var target = readSG(sgIn, 'The target SG');
      if (from === 'dry') {
        title.textContent = 'Mix with:';
        var dry = num(dryIn);
        if (dry < 10) {
          notes.push('Read ' + typed(dryIn) + ' as kilograms: ' + fmt(dry * 1000, 0) + ' g.');
          dry = dry * 1000;
        }
        var missing = [];
        if (isNaN(dry)) missing.push('your dry glaze weight');
        if (target.missing) missing.push('a target SG');
        if (missing.length) return askFor(missing);
        if (target.error) return fail(target.error);
        var s = target.sg;
        var powderMl = dry / DENSITY;
        var w = dry * (1 - s / DENSITY) / (s - 1);
        var vol = powderMl + w;
        line('Water: ' + water(w));
        line('Makes about: ' + litres(vol) + ' of glaze');
        line('Check: 100 ml should weigh ' + fmt(s * 100, Math.round(s * 1000) % 10 ? 1 : 0) + ' g');
        notes = notes.concat(target.notes);
        notes.push(presetNote());
        notes.push('Powders vary, so add most of the water, sieve, check the SG, then top up using "A mixed bucket".');
        showSplit(powderMl, w, 'Water');
        explain.textContent = 'Glaze powder is about 2.6 times as heavy as water, so ' + fmt(dry, 0) + ' g of it fills about '
          + fmt(powderMl, 0) + ' ml. SG ' + sgText(s) + ' means a litre of glaze weighs ' + fmt(s * 1000, 0) + ' g. With '
          + fmt(w, 0) + ' ml of water you have ' + fmt(dry + w, 0) + ' g in ' + fmt(vol, 0) + ' ml, and '
          + fmt(dry + w, 0) + ' ÷ ' + fmt(vol, 0) + ' = ' + sgText(s) + '.';
        note.textContent = notes.join(' ');
        announce('Add ' + fmt(w, 0) + ' ml of water.');
        return;
      }

      title.textContent = target.sg ? 'To reach SG ' + sgText(target.sg) + ':' : 'To reach your target:';
      var kg = num(wetIn);
      if (kg >= 100) {
        notes.push('Read ' + typed(wetIn) + ' as grams: ' + fmt(kg / 1000, kg % 1000 ? 2 : 0) + ' kg.');
        kg = kg / 1000;
      }
      var now = readSG(nowIn, 'The SG now');
      var miss = [];
      if (isNaN(kg)) miss.push('the weight of your glaze');
      if (now.missing) miss.push('its SG now');
      if (target.missing) miss.push('a target SG');
      if (miss.length) return askFor(miss);
      if (now.error) return fail(now.error);
      if (target.error) return fail(target.error);
      var m = kg * 1000;
      var s1 = now.sg;
      var s2 = target.sg;
      var v1 = m / s1;
      notes = notes.concat(now.notes, target.notes);
      var check100 = 'Check: 100 ml should weigh ' + fmt(s2 * 100, Math.round(s2 * 1000) % 10 ? 1 : 0) + ' g';
      if (Math.abs(s1 - s2) < 0.005) {
        line('No change: it\'s already at SG ' + sgText(s2) + '.');
        announce('No change: it\'s already at SG ' + sgText(s2) + '.');
        vis.hidden = true;
      } else if (s1 > s2) {
        var add = v1 * (s1 - s2) / (s2 - 1);
        line('Add water: ' + water(add));
        line('Makes about: ' + litres(v1 + add) + ' of glaze');
        line(check100);
        showSplit(v1, add, 'Water to add', 'Your glaze');
        explain.textContent = 'SG is weight ÷ volume, so your ' + fmt(m, 0) + ' g at SG ' + sgText(s1) + ' fills '
          + fmt(v1, 0) + ' ml. Each ml of water adds 1 g: ' + fmt(m + add, 0) + ' g in ' + fmt(v1 + add, 0) + ' ml is SG '
          + sgText(s2) + '. No guess about the powder is needed, so this one is exact.';
        announce('Add ' + fmt(add, 0) + ' ml of water.');
      } else {
        var pour = v1 * (s2 - s1) / (s2 - 1);
        var powder = v1 * (s2 - s1) / (1 - s2 / DENSITY);
        title.textContent = 'Too thin for SG ' + sgText(s2) + '. Either:';
        line('Pour off: ' + fmt(pour, 0) + ' ml of clear water');
        line('Or stir in: ' + weight(powder) + ' of dry glaze');
        notes.push('Leave the glaze to settle overnight first, so the water you pour off is clear (Potclays).');
        notes.push('The pour-off figure needs no guess about the powder. The stir-in figure assumes the powder is about 2.6 times as heavy as water, so check the SG after.');
        line(check100);
        bar.hidden = true;
        legend.hidden = true;
        vis.hidden = false;
        explain.textContent = 'Your ' + fmt(m, 0) + ' g at SG ' + sgText(s1) + ' fills ' + fmt(v1, 0) + ' ml. Pouring off '
          + fmt(pour, 0) + ' ml of clear water leaves ' + fmt(m - pour, 0) + ' g in ' + fmt(v1 - pour, 0) + ' ml, which is SG '
          + sgText(s2) + '.';
        announce('Pour off ' + fmt(pour, 0) + ' ml of water.');
      }
      notes.push(presetNote());
      note.textContent = notes.join(' ');
    }

    // ---------- glaze for pots ----------
    function renderPots(notes) {
      var target = readSG(sgIn, 'The target SG');
      var n = num(potsIn);
      if (n && Math.round(n) !== n) {
        notes.push('Rounded to ' + fmt(Math.max(Math.round(n), 1), 0) + ' pots.');
        n = Math.max(Math.round(n), 1);
      }
      var per = num(perIn);
      if (per < 2) {
        notes.push('Read ' + typed(perIn) + ' as litres: ' + fmt(per * 1000, 0) + ' ml.');
        per = per * 1000;
      }
      var pot = POTS[kind.value];
      title.textContent = isNaN(n) ? 'Mix about:' : 'For ' + fmt(n, 0) + ' ' + (n === 1 ? pot.one : pot.many) + ', mix about:';
      var missing = [];
      if (isNaN(n)) missing.push('your number of pots');
      if (isNaN(per)) missing.push('the glaze per pot');
      if (target.missing) missing.push('a target SG');
      if (missing.length) return askFor(missing);
      if (target.error) return fail(target.error);
      var s = target.sg;
      var vol = n * per;
      var dry = vol * (s - 1) * DENSITY / (DENSITY - 1);
      var w = vol * s - dry;
      line('Glaze: ' + litres(vol));
      line('Dry glaze powder: ' + weight(dry));
      line('Water: ' + litres(w));
      notes = notes.concat(target.notes);
      if (kind.value === 'mug' && Math.abs(per - 150) < 0.001) notes.push('Potclays\' rule of thumb is about 0.15 L of glaze per mug.');
      else if (kind.value !== 'own' && Math.abs(per - pot.ml) < 0.001) notes.push('Our estimate for this pot, scaled from Potclays\' 0.15 L per mug by the area glazed inside and out.');
      else notes.push('At your own figure per pot.');
      notes.push('At SG ' + sgText(s) + ', 1 kg of powder makes about ' + fmt(vol / dry, 2) + ' L of glaze.');
      showSplit(dry / DENSITY, w, 'Water');
      var perL = (s - 1) * DENSITY / (DENSITY - 1) * 1000;
      explain.textContent = 'Each litre of glaze at SG ' + sgText(s) + ' holds about ' + fmt(perL, 0) + ' g of powder and '
        + fmt(s * 1000 - perL, 0) + ' ml of water. Potclays\' figure of 1.54 L per kg of powder is for SG 1.4, and this maths gives the same.';
      note.textContent = notes.join(' ');
      announce('Mix about ' + litres(vol) + ' of glaze from ' + weight(dry) + ' of powder.');
    }

    function render() {
      var state = [mode];
      if (mode === 'water') state.push(from);
      qa('[data-show]').forEach(function (el) {
        el.hidden = !el.getAttribute('data-show').split(' ').some(function (t) { return state.indexOf(t) >= 0; });
      });
      list.innerHTML = '';
      note.textContent = '';
      bar.hidden = false;
      legend.hidden = false;
      var notes = [];
      if (mode === 'batch') renderBatch(notes);
      else if (mode === 'water') renderWater(notes);
      else renderPots(notes);
    }

    // ---------- wiring ----------
    qa('.cm-mode-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var next = btn.getAttribute('data-mode');
        if (next === mode) return;
        mode = next;
        setPressed(qa('.cm-mode-btn'), 'data-mode', mode);
        render();
      });
    });

    qa('[data-basis]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var next = btn.getAttribute('data-basis');
        if (next === basis) return;
        basis = next;
        setPressed(qa('[data-basis]'), 'data-basis', basis);
        render();
      });
    });

    qa('[data-from]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var next = btn.getAttribute('data-from');
        if (next === from) return;
        from = next;
        setPressed(qa('[data-from]'), 'data-from', from);
        render();
      });
    });

    qa('[data-add]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        addRow(btn.getAttribute('data-add'), '', '', true);
        render();
      });
    });

    scaleBtn.addEventListener('click', function () {
      var base = readRows('base').filter(function (r) { return r.pct > 0; });
      var sum = base.reduce(function (a, r) { return a + r.pct; }, 0);
      if (!sum) return;
      var k = 100 / sum;
      var biggest = null;
      var total = 0;
      base.forEach(function (r) {
        var v = Math.round(r.pct * k * 100) / 100;
        r.input.value = v;
        total += v;
        if (!biggest || r.pct > biggest.pct) biggest = r;
      });
      // rounding to 2 places can leave 99.99 or 100.01: settle it on the biggest ingredient
      var diff = Math.round((100 - total) * 100) / 100;
      if (diff) biggest.input.value = Math.round((parseFloat(biggest.input.value) + diff) * 100) / 100;
      render();
      // the check box hides once the base is 100, so put focus back on the recipe
      biggest.input.focus();
    });

    moveBtn.addEventListener('click', function () {
      if (!moveRow) return;
      var name = moveRow.row.querySelector('[data-role="name"]').value;
      var pct = moveRow.input.value;
      moveRow.row.parentNode.removeChild(moveRow.row);
      var row = addRow('add', name, pct, false);
      relabel();
      render();
      row.querySelector('[data-role="pct"]').focus();
    });

    use.addEventListener('change', function () {
      if (use.value !== 'own') sgIn.value = PRESET_SG[use.value].toFixed(2);
      render();
    });

    sgIn.addEventListener('input', function () {
      var r = readSG(sgIn, '');
      var match = 'own';
      if (r.sg) {
        Object.keys(PRESET_SG).forEach(function (k) {
          if (match === 'own' && Math.abs(PRESET_SG[k] - r.sg) < 0.0005) match = k;
        });
      }
      use.value = match;
      render();
    });

    kind.addEventListener('change', function () {
      if (kind.value !== 'own') perIn.value = POTS[kind.value].ml;
      render();
    });

    perIn.addEventListener('input', function () {
      var v = parseFloat(perIn.value);
      if (v > 0 && v < 2) v = v * 1000;
      if (!(POTS[kind.value].ml === v && kind.value !== 'own')) {
        var match = 'own';
        Object.keys(POTS).forEach(function (k) {
          if (match === 'own' && k !== 'own' && POTS[k].ml === v) match = k;
        });
        kind.value = match;
      }
      render();
    });

    [batchIn, dryIn, wetIn, nowIn, potsIn].forEach(function (el) {
      el.addEventListener('input', render);
    });

    DEFAULT_BASE.forEach(function (r) { addRow('base', r[0], r[1]); });
    DEFAULT_ADD.forEach(function (r) { addRow('add', r[0], r[1]); });
    render();
  }

  function initAll() {
    injectStyles();
    var containers = document.querySelectorAll('.' + TARGET_CLASS);
    for (var i = 0; i < containers.length; i++) initOne(containers[i]);
    embedCodeBoxes(TARGET_CLASS, EMBED_FILE);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }
})();
