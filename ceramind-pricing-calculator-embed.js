/*!
 * Ceramind® Tools — Pottery Pricing Calculator (embed)
 * https://www.ceramindtools.com
 *
 * Usage:
 *   <div class="ceramind-pricing-calculator"></div>
 *   <script src="https://cdn.jsdelivr.net/gh/YOUR-GITHUB-USERNAME/YOUR-REPO-NAME@main/ceramind-pricing-calculator-embed.js" async></script>
 *
 * Self-contained: injects its own styles + markup into any element with
 * class "ceramind-pricing-calculator". Safe to place more than one on a page.
 * No build step, no dependencies.
 */
(function () {
  'use strict';

  var HOST_CLASS = 'ceramind-pricing-calculator';
  var STYLE_ID = 'cmpc-styles';
  var FONT_LINK_ID = 'cmpc-font-fraunces';
  var SITE_URL = 'https://www.ceramindtools.com';

  /* ---------------------------------------------------------------------
   * Styles
   * ------------------------------------------------------------------- */
  var CSS = ''
    + ':root{}'
    + '.cmpc-root{'
    + '  --cmpc-ink:#2E2118; --cmpc-ink-soft:#6B5D4C; --cmpc-clay:#473728;'
    + '  --cmpc-bg:#F7F4EF; --cmpc-canvas:#FFFFFF; --cmpc-line:#E2DACB; --cmpc-white:#FFFFFF;'
    + '  --cmpc-materials:#473728; --cmpc-labor:#70503A; --cmpc-firing:#9C6B3E;'
    + '  --cmpc-overhead:#B08D63; --cmpc-profit:#C9A227;'
    + '  font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;'
    + '  color:var(--cmpc-ink); background:var(--cmpc-canvas); border:1px solid var(--cmpc-line);'
    + '  border-radius:14px; padding:28px; box-sizing:border-box; max-width:980px; margin:0 auto;'
    + '  -webkit-font-smoothing:antialiased; line-height:1.45;'
    + '}'
    + '.cmpc-root *, .cmpc-root *::before, .cmpc-root *::after{box-sizing:border-box;}'
    + '.cmpc-root button{font-family:inherit;}'
    + '.cmpc-header{margin-bottom:22px;}'
    + '.cmpc-eyebrow{display:inline-block; font-size:11px; letter-spacing:.14em; text-transform:uppercase;'
    + '  color:var(--cmpc-ink-soft); font-weight:600; margin-bottom:6px;}'
    + '.cmpc-title{font-family:"Fraunces",Georgia,"Times New Roman",serif; font-weight:600;'
    + '  font-size:26px; margin:0 0 8px; color:var(--cmpc-clay); letter-spacing:-.01em;}'
    + '.cmpc-sub{margin:0; font-size:14.5px; color:var(--cmpc-ink-soft); max-width:56ch;}'
    + '.cmpc-reset{background:none; border:1px solid var(--cmpc-line); color:var(--cmpc-ink-soft);'
    + '  font-size:12.5px; padding:6px 12px; border-radius:20px; cursor:pointer; float:right;'
    + '  transition:border-color .15s ease, color .15s ease;}'
    + '.cmpc-reset:hover{border-color:var(--cmpc-clay); color:var(--cmpc-clay);}'
    + '.cmpc-grid{display:grid; grid-template-columns:1.15fr 1fr; gap:22px; align-items:start;}'
    + '@media (max-width:760px){.cmpc-grid{grid-template-columns:1fr;}}'
    + '.cmpc-currency-bar{display:flex; align-items:center; gap:10px; background:var(--cmpc-clay); color:#fff;'
    + '  border-radius:10px; padding:10px 16px; margin-bottom:18px; flex-wrap:wrap;}'
    + '.cmpc-currency-bar label{font-size:12.5px; font-weight:600; letter-spacing:.02em;}'
    + '.cmpc-currency-bar select{font-family:inherit; font-size:13.5px; padding:6px 10px; border-radius:7px;'
    + '  border:1px solid rgba(255,255,255,.35); background:rgba(255,255,255,.12); color:#fff;}'
    + '.cmpc-currency-bar select option{color:var(--cmpc-ink); background:var(--cmpc-white);}'
    + '.cmpc-currency-bar select:focus{outline:none; box-shadow:0 0 0 3px rgba(255,255,255,.35);}'
    + ''
    + '.cmpc-form{display:flex; flex-direction:column; gap:14px;}'
    + '.cmpc-section{border:1px solid var(--cmpc-line); border-left:4px solid var(--layer-color, var(--cmpc-clay));'
    + '  background:var(--cmpc-bg); border-radius:10px; padding:14px 16px 16px; margin:0;}'
    + '.cmpc-section[data-layer="materials"]{--layer-color:var(--cmpc-materials);}'
    + '.cmpc-section[data-layer="labor"]{--layer-color:var(--cmpc-labor);}'
    + '.cmpc-section[data-layer="firing"]{--layer-color:var(--cmpc-firing);}'
    + '.cmpc-section[data-layer="overhead"]{--layer-color:var(--cmpc-overhead);}'
    + '.cmpc-section[data-layer="profit"]{--layer-color:var(--cmpc-profit);}'
    + '.cmpc-legend{display:flex; align-items:center; gap:8px; font-weight:600; font-size:14.5px;'
    + '  padding:0; margin-bottom:10px; color:var(--cmpc-ink);}'
    + '.cmpc-dot{width:9px; height:9px; border-radius:50%; background:var(--layer-color); flex:0 0 auto;'
    + '  box-shadow:0 0 0 3px rgba(0,0,0,.05) inset;}'
    + '.cmpc-help{font-size:12px; color:var(--cmpc-ink-soft); margin:6px 0 0;}'
    + '.cmpc-row{display:flex; align-items:center; justify-content:space-between; gap:12px; margin-top:8px;}'
    + '.cmpc-row:first-of-type{margin-top:0;}'
    + '.cmpc-row label{font-size:13.5px; color:var(--cmpc-ink); flex:1 1 auto;}'
    + '.cmpc-field{display:flex; align-items:center; background:var(--cmpc-white); border:1px solid var(--cmpc-line);'
    + '  border-radius:8px; overflow:hidden; flex:0 0 130px;}'
    + '.cmpc-currency{padding:8px 8px 8px 10px; font-size:13px; color:var(--cmpc-ink-soft); user-select:none;}'
    + '.cmpc-field input[type="number"]{width:100%; border:none; background:transparent; padding:8px 10px 8px 2px;'
    + '  font-size:14px; color:var(--cmpc-ink); font-variant-numeric:tabular-nums; -moz-appearance:textfield;}'
    + '.cmpc-field input[type="number"]:focus{outline:none;}'
    + '.cmpc-field.cmpc-suffix .cmpc-currency{order:2; padding:8px 10px 8px 4px;}'
    + '.cmpc-field.cmpc-suffix input{order:1; padding:8px 2px 8px 10px; text-align:right;}'
    + '.cmpc-field:focus-within{border-color:var(--cmpc-clay); box-shadow:0 0 0 3px rgba(71,55,40,.12);}'
    + '.cmpc-root input[type="number"]::-webkit-outer-spin-button,'
    + '.cmpc-root input[type="number"]::-webkit-inner-spin-button{-webkit-appearance:none; margin:0;}'
    + '.cmpc-root input[type="number"]{-moz-appearance:textfield;}'
    + '.cmpc-pct-row{display:flex; align-items:center; gap:12px; margin-top:8px;}'
    + '.cmpc-pct-row input[type="range"]{flex:1 1 auto; accent-color:var(--layer-color, var(--cmpc-clay)); height:4px;}'
    + '.cmpc-pct-field{flex:0 0 92px;}'
    + '.cmpc-pct-field .cmpc-currency{order:2; padding:8px 10px 8px 2px;}'
    + '.cmpc-pct-field input{order:1; text-align:right; padding:8px 0 8px 12px; min-width:0;}'
    + ''
    + '.cmpc-options{display:flex; gap:12px; flex-wrap:wrap; padding:12px 2px 2px;}'
    + '.cmpc-opt{display:flex; flex-direction:column; gap:4px; font-size:12px; color:var(--cmpc-ink-soft);}'
    + '.cmpc-opt select{font-family:inherit; font-size:13px; padding:7px 8px; border:1px solid var(--cmpc-line);'
    + '  border-radius:8px; background:var(--cmpc-white); color:var(--cmpc-ink);}'
    + '.cmpc-opt select:focus{outline:none; border-color:var(--cmpc-clay); box-shadow:0 0 0 3px rgba(71,55,40,.12);}'
    + ''
    + '.cmpc-results{position:sticky; top:16px; background:var(--cmpc-white); border:1px solid var(--cmpc-line);'
    + '  border-radius:12px; padding:20px; display:flex; flex-direction:column; gap:16px;}'
    + '@media (max-width:760px){.cmpc-results{position:static;}}'
    + '.cmpc-price-card{text-align:center; padding:6px 0 4px; border-bottom:1px dashed var(--cmpc-line);}'
    + '.cmpc-price-label{display:block; font-size:11px; letter-spacing:.12em; text-transform:uppercase;'
    + '  color:var(--cmpc-ink-soft); font-weight:600; margin-bottom:6px;}'
    + '.cmpc-price{font-family:"Fraunces",Georgia,serif; font-weight:600; font-size:42px; color:var(--cmpc-clay);'
    + '  letter-spacing:-.01em; font-variant-numeric:tabular-nums; display:block;}'
    + '.cmpc-profit-note{display:block; font-size:12.5px; color:var(--cmpc-ink-soft); margin-top:6px;}'
    + '.cmpc-bar{display:flex; width:100%; height:16px; border-radius:8px; overflow:hidden;'
    + '  background:var(--cmpc-line); box-shadow:inset 0 1px 2px rgba(0,0,0,.08);}'
    + '.cmpc-bar-seg{height:100%; width:0%; position:relative;}'
    + '@media (prefers-reduced-motion:no-preference){.cmpc-bar-seg{transition:width .35s ease;}}'
    + '.cmpc-bar-seg::after{content:""; position:absolute; inset:0 0 55% 0; background:linear-gradient(rgba(255,255,255,.22),rgba(255,255,255,0));}'
    + '.cmpc-bar-seg[data-layer="materials"]{background:var(--cmpc-materials);}'
    + '.cmpc-bar-seg[data-layer="labor"]{background:var(--cmpc-labor);}'
    + '.cmpc-bar-seg[data-layer="firing"]{background:var(--cmpc-firing);}'
    + '.cmpc-bar-seg[data-layer="overhead"]{background:var(--cmpc-overhead);}'
    + '.cmpc-bar-seg[data-layer="profit"]{background:var(--cmpc-profit);}'
    + '.cmpc-breakdown{list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:9px;}'
    + '.cmpc-breakdown li{display:flex; align-items:center; gap:8px; font-size:13px; color:var(--cmpc-ink);}'
    + '.cmpc-breakdown li[data-layer="materials"] .cmpc-dot{background:var(--cmpc-materials);}'
    + '.cmpc-breakdown li[data-layer="labor"] .cmpc-dot{background:var(--cmpc-labor);}'
    + '.cmpc-breakdown li[data-layer="firing"] .cmpc-dot{background:var(--cmpc-firing);}'
    + '.cmpc-breakdown li[data-layer="overhead"] .cmpc-dot{background:var(--cmpc-overhead);}'
    + '.cmpc-breakdown li[data-layer="profit"] .cmpc-dot{background:var(--cmpc-profit);}'
    + '.cmpc-b-name{flex:1 1 auto; color:var(--cmpc-ink-soft);}'
    + '.cmpc-b-amt{font-variant-numeric:tabular-nums; font-weight:600; min-width:64px; text-align:right;}'
    + '.cmpc-b-pct{font-variant-numeric:tabular-nums; color:var(--cmpc-ink-soft); min-width:34px; text-align:right; font-size:12px;}'
    + '.cmpc-empty-note{font-size:13px; color:var(--cmpc-ink-soft); text-align:center; padding:8px 4px;}'
    + '.cmpc-results.cmpc-has-value .cmpc-empty-note{display:none;}'
    + '.cmpc-results:not(.cmpc-has-value) .cmpc-bar,'
    + '.cmpc-results:not(.cmpc-has-value) .cmpc-breakdown{display:none;}'
    + ''
    + '.cmpc-powered{display:flex; align-items:center; justify-content:center; gap:6px; margin-top:22px;'
    + '  padding-top:16px; border-top:1px solid var(--cmpc-line); font-size:12.5px; color:var(--cmpc-ink-soft);'
    + '  text-decoration:none;}'
    + '.cmpc-powered:hover{color:var(--cmpc-clay);}'
    + '.cmpc-powered strong{color:var(--cmpc-clay); font-weight:600;}'
    + '.cmpc-powered:hover strong{text-decoration:underline;}'
    + '.cmpc-root a:focus-visible, .cmpc-root button:focus-visible, .cmpc-root select:focus-visible{'
    + '  outline:2px solid var(--cmpc-clay); outline-offset:2px;'
    + '}';

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    var style = document.createElement('style');
    style.id = STYLE_ID;
    style.appendChild(document.createTextNode(CSS));
    document.head.appendChild(style);

    if (!document.getElementById(FONT_LINK_ID)) {
      var link = document.createElement('link');
      link.id = FONT_LINK_ID;
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,500;0,600;1,500&display=swap';
      document.head.appendChild(link);
    }
  }

  /* ---------------------------------------------------------------------
   * Markup
   * ------------------------------------------------------------------- */
  function moneyRow(uid, field, label, helpText) {
    return ''
      + '<div class="cmpc-row">'
      + '<label for="cmpc-' + field + '-' + uid + '">' + label + '</label>'
      + '<div class="cmpc-field">'
      + '<span class="cmpc-currency" data-cmpc-currency-symbol>$</span>'
      + '<input type="number" inputmode="decimal" min="0" step="0.01" value="0" '
      + 'id="cmpc-' + field + '-' + uid + '" data-cmpc-field="' + field + '">'
      + '</div>'
      + '</div>'
      + (helpText ? '<p class="cmpc-help">' + helpText + '</p>' : '');
  }

  function template(uid) {
    return ''
      + '<div class="cmpc-header">'
      + '<button type="button" class="cmpc-reset" data-cmpc-reset>Reset</button>'
      + '<span class="cmpc-eyebrow">Cost &rarr; Price</span>'
      + '<h2 class="cmpc-title">Pottery Pricing Calculator</h2>'
      + '<p class="cmpc-sub">Add what a piece actually costs you &mdash; clay, studio time, kiln firings, overhead '
      + '&mdash; and set the markup that keeps the wheel turning. The price updates as you go.</p>'
      + '</div>'
      + '<div class="cmpc-currency-bar">'
      + '<label for="cmpc-currency-' + uid + '">Pricing currency</label>'
      + '<select id="cmpc-currency-' + uid + '" data-cmpc-currency>'
      + '<option value="$" selected>$ &nbsp;USD / CAD / AUD / NZD</option>'
      + '<option value="&#163;">&#163; &nbsp;GBP</option>'
      + '<option value="&#8364;">&#8364; &nbsp;EUR</option>'
      + '</select>'
      + '</div>'
      + '<div class="cmpc-grid">'
      + '<form class="cmpc-form" novalidate>'

      + '<fieldset class="cmpc-section" data-layer="materials">'
      + '<legend class="cmpc-legend"><span class="cmpc-dot"></span>Clay &amp; Materials</legend>'
      + moneyRow(uid, 'clay', 'Clay')
      + moneyRow(uid, 'glaze', 'Glaze &amp; surface materials')
      + moneyRow(uid, 'otherMaterials', 'Other (stains, decals, etc.)')
      + '</fieldset>'

      + '<fieldset class="cmpc-section" data-layer="labor">'
      + '<legend class="cmpc-legend"><span class="cmpc-dot"></span>Studio Time (Labor)</legend>'
      + '<div class="cmpc-row"><label for="cmpc-hours-' + uid + '">Hours on this piece</label>'
      + '<div class="cmpc-field cmpc-suffix"><input type="number" inputmode="decimal" min="0" step="0.25" value="0" '
      + 'id="cmpc-hours-' + uid + '" data-cmpc-field="hours"><span class="cmpc-currency">hrs</span></div></div>'
      + '<div class="cmpc-row"><label for="cmpc-rate-' + uid + '">Your hourly rate</label>'
      + '<div class="cmpc-field"><span class="cmpc-currency" data-cmpc-currency-symbol>$</span>'
      + '<input type="number" inputmode="decimal" min="0" step="0.5" value="0" '
      + 'id="cmpc-rate-' + uid + '" data-cmpc-field="rate"></div></div>'
      + '<p class="cmpc-help">Throwing or hand-building, trimming, glazing, decorating &mdash; all the hands-on time.</p>'
      + '</fieldset>'

      + '<fieldset class="cmpc-section" data-layer="firing">'
      + '<legend class="cmpc-legend"><span class="cmpc-dot"></span>The Kiln (Firing)</legend>'
      + moneyRow(uid, 'bisque', 'Bisque firing')
      + moneyRow(uid, 'glazeFiring', 'Glaze firing')
      + moneyRow(uid, 'extraFiring', 'Extra firings (optional)', 'Lustre, decals, a third firing &mdash; anything beyond bisque + glaze.')
      + '</fieldset>'

      + '<fieldset class="cmpc-section" data-layer="overhead">'
      + '<legend class="cmpc-legend"><span class="cmpc-dot"></span>Overhead</legend>'
      + '<div class="cmpc-pct-row">'
      + '<input type="range" min="0" max="50" step="1" value="15" data-cmpc-linked="overheadPct" aria-hidden="true" tabindex="-1">'
      + '<div class="cmpc-field cmpc-pct-field"><input type="number" min="0" max="100" step="1" value="15" '
      + 'id="cmpc-overhead-' + uid + '" data-cmpc-field="overheadPct"><span class="cmpc-currency">%</span></div>'
      + '</div>'
      + '<p class="cmpc-help">Rent, utilities, tool wear, insurance, marketing &mdash; as a % of materials + labor + firing. 10&ndash;20% is typical for a home studio.</p>'
      + '</fieldset>'

      + '<fieldset class="cmpc-section" data-layer="profit">'
      + '<legend class="cmpc-legend"><span class="cmpc-dot"></span>Your Markup</legend>'
      + '<div class="cmpc-pct-row">'
      + '<input type="range" min="0" max="300" step="5" value="75" data-cmpc-linked="markupPct" aria-hidden="true" tabindex="-1">'
      + '<div class="cmpc-field cmpc-pct-field"><input type="number" min="0" max="1000" step="5" value="75" '
      + 'id="cmpc-markup-' + uid + '" data-cmpc-field="markupPct"><span class="cmpc-currency">%</span></div>'
      + '</div>'
      + '<p class="cmpc-help">Profit on top of total cost. Many potters aim for 75&ndash;150%+ so a slow month or a kiln mishap doesn&rsquo;t sink the business.</p>'
      + '</fieldset>'

      + '<div class="cmpc-options">'
      + '<label class="cmpc-opt">Round price up to nearest<select data-cmpc-round>'
      + '<option value="none">No rounding</option>'
      + '<option value="0.5">0.50</option>'
      + '<option value="1" selected>1</option>'
      + '<option value="5">5</option>'
      + '</select></label>'
      + '</div>'
      + '</form>'

      + '<aside class="cmpc-results" data-cmpc-results aria-live="polite">'
      + '<div class="cmpc-price-card">'
      + '<span class="cmpc-price-label">Suggested price</span>'
      + '<span class="cmpc-price" data-cmpc-price>$0.00</span>'
      + '<span class="cmpc-profit-note" data-cmpc-profit-note>includes $0.00 profit</span>'
      + '</div>'
      + '<div class="cmpc-bar" role="img" data-cmpc-bar aria-label="Price composition">'
      + '<span class="cmpc-bar-seg" data-layer="materials"></span>'
      + '<span class="cmpc-bar-seg" data-layer="labor"></span>'
      + '<span class="cmpc-bar-seg" data-layer="firing"></span>'
      + '<span class="cmpc-bar-seg" data-layer="overhead"></span>'
      + '<span class="cmpc-bar-seg" data-layer="profit"></span>'
      + '</div>'
      + '<ul class="cmpc-breakdown">'
      + '<li data-layer="materials"><span class="cmpc-dot"></span><span class="cmpc-b-name">Materials</span>'
      + '<span class="cmpc-b-amt" data-cmpc-amt="materials">$0.00</span><span class="cmpc-b-pct" data-cmpc-pct="materials">0%</span></li>'
      + '<li data-layer="labor"><span class="cmpc-dot"></span><span class="cmpc-b-name">Labor</span>'
      + '<span class="cmpc-b-amt" data-cmpc-amt="labor">$0.00</span><span class="cmpc-b-pct" data-cmpc-pct="labor">0%</span></li>'
      + '<li data-layer="firing"><span class="cmpc-dot"></span><span class="cmpc-b-name">Firing</span>'
      + '<span class="cmpc-b-amt" data-cmpc-amt="firing">$0.00</span><span class="cmpc-b-pct" data-cmpc-pct="firing">0%</span></li>'
      + '<li data-layer="overhead"><span class="cmpc-dot"></span><span class="cmpc-b-name">Overhead</span>'
      + '<span class="cmpc-b-amt" data-cmpc-amt="overhead">$0.00</span><span class="cmpc-b-pct" data-cmpc-pct="overhead">0%</span></li>'
      + '<li data-layer="profit"><span class="cmpc-dot"></span><span class="cmpc-b-name">Profit</span>'
      + '<span class="cmpc-b-amt" data-cmpc-amt="profit">$0.00</span><span class="cmpc-b-pct" data-cmpc-pct="profit">0%</span></li>'
      + '</ul>'
      + '<p class="cmpc-empty-note">Add your costs on the left to see a suggested price.</p>'
      + '</aside>'
      + '</div>'
      + '<a class="cmpc-powered" href="' + SITE_URL + '" target="_blank" rel="noopener">'
      + 'Powered by <strong>Ceramind&reg; Tools</strong></a>';
  }

  /* ---------------------------------------------------------------------
   * Calculation
   * ------------------------------------------------------------------- */
  function num(v) {
    var n = parseFloat(v);
    return isFinite(n) && n >= 0 ? n : 0;
  }

  function compute(v) {
    var materials = num(v.clay) + num(v.glaze) + num(v.otherMaterials);
    var labor = num(v.hours) * num(v.rate);
    var firing = num(v.bisque) + num(v.glazeFiring) + num(v.extraFiring);
    var subtotal = materials + labor + firing;
    var overheadAmt = subtotal * (num(v.overheadPct) / 100);
    var costTotal = subtotal + overheadAmt;
    var profitAmt = costTotal * (num(v.markupPct) / 100);
    var rawPrice = costTotal + profitAmt;
    var price = applyRounding(rawPrice, v.roundTo);
    return {
      materials: materials, labor: labor, firing: firing,
      overheadAmt: overheadAmt, profitAmt: profitAmt,
      rawPrice: rawPrice, price: price
    };
  }

  function applyRounding(value, mode) {
    if (!mode || mode === 'none') return value;
    var step = parseFloat(mode);
    if (!step) return value;
    return Math.ceil((value - 1e-9) / step) * step;
  }

  function formatMoney(symbol, value) {
    var v = Math.max(0, value);
    var fixed = v.toFixed(2);
    var parts = fixed.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return symbol + parts.join('.');
  }

  /* ---------------------------------------------------------------------
   * Wiring per instance
   * ------------------------------------------------------------------- */
  var instanceCounter = 0;

  function renderWidget(container) {
    if (container.getAttribute('data-cmpc-mounted') === 'true') return;
    container.setAttribute('data-cmpc-mounted', 'true');

    var uid = 'i' + (instanceCounter++);
    var root = document.createElement('div');
    root.className = 'cmpc-root';
    root.innerHTML = template(uid);
    container.innerHTML = '';
    container.appendChild(root);

    var form = root.querySelector('.cmpc-form');
    var resultsEl = root.querySelector('[data-cmpc-results]');
    var currencySelect = root.querySelector('[data-cmpc-currency]');
    var roundSelect = root.querySelector('[data-cmpc-round]');
    var resetBtn = root.querySelector('[data-cmpc-reset]');

    var defaults = {
      clay: '0', glaze: '0', otherMaterials: '0',
      hours: '0', rate: '0',
      bisque: '0', glazeFiring: '0', extraFiring: '0',
      overheadPct: '15', markupPct: '75'
    };

    function fields() {
      var out = {};
      root.querySelectorAll('[data-cmpc-field]').forEach(function (el) {
        out[el.getAttribute('data-cmpc-field')] = el.value;
      });
      out.roundTo = roundSelect.value;
      return out;
    }

    function syncLinkedRanges(changedField, value) {
      root.querySelectorAll('[data-cmpc-linked="' + changedField + '"]').forEach(function (el) {
        el.value = value;
      });
    }

    function updateCurrencySymbol(symbol) {
      root.querySelectorAll('[data-cmpc-currency-symbol]').forEach(function (el) {
        el.textContent = symbol;
      });
    }

    function render() {
      var v = fields();
      var symbol = currencySelect.value;
      var r = compute(v);

      root.querySelector('[data-cmpc-price]').textContent = formatMoney(symbol, r.price);
      root.querySelector('[data-cmpc-profit-note]').textContent =
        'includes ' + formatMoney(symbol, r.profitAmt) + ' profit';

      var hasValue = r.rawPrice > 0.004;
      resultsEl.classList.toggle('cmpc-has-value', hasValue);

      var layers = { materials: r.materials, labor: r.labor, firing: r.firing, overhead: r.overheadAmt, profit: r.profitAmt };
      var labels = [];
      Object.keys(layers).forEach(function (key) {
        var amt = layers[key];
        var pct = hasValue ? (amt / r.rawPrice) * 100 : 0;
        var amtEl = root.querySelector('[data-cmpc-amt="' + key + '"]');
        var pctEl = root.querySelector('[data-cmpc-pct="' + key + '"]');
        var segEl = root.querySelector('.cmpc-bar-seg[data-layer="' + key + '"]');
        if (amtEl) amtEl.textContent = formatMoney(symbol, amt);
        if (pctEl) pctEl.textContent = Math.round(pct) + '%';
        if (segEl) segEl.style.width = pct + '%';
        if (hasValue) labels.push(key + ' ' + Math.round(pct) + '%');
      });
      var barEl = root.querySelector('[data-cmpc-bar]');
      if (barEl) {
        barEl.setAttribute('aria-label', hasValue ? 'Price composition: ' + labels.join(', ') : 'Price composition');
      }
    }

    form.addEventListener('input', function (e) {
      var target = e.target;
      var linked = target.getAttribute('data-cmpc-linked');
      var field = target.getAttribute('data-cmpc-field');
      if (linked) {
        var numberInput = root.querySelector('[data-cmpc-field="' + linked + '"]');
        if (numberInput) numberInput.value = target.value;
      } else if (field === 'overheadPct' || field === 'markupPct') {
        syncLinkedRanges(field, target.value);
      }
      render();
    });

    currencySelect.addEventListener('change', function () {
      updateCurrencySymbol(currencySelect.value);
      render();
    });
    roundSelect.addEventListener('change', render);

    resetBtn.addEventListener('click', function () {
      Object.keys(defaults).forEach(function (key) {
        var el = root.querySelector('[data-cmpc-field="' + key + '"]');
        if (el) el.value = defaults[key];
        syncLinkedRanges(key, defaults[key]);
      });
      currencySelect.value = '$';
      roundSelect.value = '1';
      updateCurrencySymbol('$');
      render();
    });

    render();
  }

  /* ---------------------------------------------------------------------
   * Init
   * ------------------------------------------------------------------- */
  function init() {
    injectStyles();
    var nodes = document.querySelectorAll('.' + HOST_CLASS);
    nodes.forEach(renderWidget);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Re-scan if new host divs are added dynamically (e.g. AJAX-loaded pages).
  if (typeof MutationObserver !== 'undefined') {
    var mo = new MutationObserver(function () {
      var nodes = document.querySelectorAll('.' + HOST_CLASS + ':not([data-cmpc-mounted])');
      if (nodes.length) {
        injectStyles();
        nodes.forEach(renderWidget);
      }
    });
    mo.observe(document.documentElement, { childList: true, subtree: true });
  }
})();
