/*!
 * Ceramind® Tools — Kiln Firing Cost Calculator (embeddable widget)
 * Usage:
 *   <div class="ceramind-kiln-cost-calculator"></div>
 *   <script src=".../ceramind-kiln-cost-calculator-embed.js" async></script>
 *
 * Mounts into a Shadow DOM per container, so it can't be affected by
 * (or leak into) the host page's own styles. Safe to include more than
 * once on a page — each matching div gets its own independent instance.
 */
(function () {
  "use strict";

  var STYLE_TEXT = [
    ':host{',
    '  all:initial;',
    '  display:block;',
    '  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;',
    '  line-height:1.4;',
    '  color:#3a2e22;',
    '  -webkit-font-smoothing:antialiased;',
    '  --ck-cream:#f8f1e7;',
    '  --ck-cream-deep:#efe2ce;',
    '  --ck-white:#ffffff;',
    '  --ck-brown:#473728;',
    '  --ck-brown-dark:#2d2216;',
    '  --ck-brown-mid:#6b5843;',
    '  --ck-tan-border:#e1d0b3;',
    '  --ck-text:#3a2e22;',
    '  --ck-text-muted:#6b5d4d;',
    '  --ck-sage:#7d8a6e;',
    '  --ck-sage-dark:#57624a;',
    '  --ck-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;',
    '}',
    '*,*::before,*::after{ box-sizing:border-box; }',
    '.ck-widget{ width:100%; display:flex; justify-content:center; padding:16px 10px; }',
    '.ck-chassis{',
    '  width:100%;',
    '  max-width:460px;',
    '  background:var(--ck-cream);',
    '  border:1px solid var(--ck-tan-border);',
    '  border-radius:16px;',
    '  padding:22px;',
    '  box-shadow:',
    '    0 1px 0 rgba(255,255,255,0.6) inset,',
    '    0 14px 34px rgba(71,55,40,0.10);',
    '}',
    '.ck-header{ display:flex; align-items:center; gap:10px; margin-bottom:18px; }',
    '.ck-header h1{',
    '  font-family:var(--ck-sans);',
    '  font-size:16.5px;',
    '  font-weight:700;',
    '  letter-spacing:0.01em;',
    '  color:var(--ck-brown-dark);',
    '  margin:0;',
    '  line-height:1.3;',
    '}',
    '.ck-header p{',
    '  margin:2px 0 0;',
    '  font-size:12.5px;',
    '  color:var(--ck-text-muted);',
    '  line-height:1.3;',
    '}',
    '.ck-screen{',
    '  position:sticky;',
    '  top:8px;',
    '  z-index:5;',
    '  background:var(--ck-white);',
    '  border:1px solid var(--ck-tan-border);',
    '  border-radius:13px;',
    '  padding:16px 18px 14px;',
    '  margin-bottom:20px;',
    '  overflow:hidden;',
    '  box-shadow:0 6px 18px rgba(71,55,40,0.06);',
    '}',
    '.ck-screen-bar{',
    '  position:absolute;',
    '  top:0; left:0; right:0; height:4px;',
    '  background:linear-gradient(90deg, var(--ck-brown), var(--ck-brown-mid) 60%, var(--ck-sage));',
    '  transform-origin:left center;',
    '  animation:ck-ignite 1s cubic-bezier(.2,.8,.2,1) both;',
    '}',
    '@keyframes ck-ignite{',
    '  from{ transform:scaleX(0); opacity:0.5; }',
    '  to{ transform:scaleX(1); opacity:1; }',
    '}',
    '.ck-screen-row{',
    '  display:flex;',
    '  align-items:baseline;',
    '  justify-content:space-between;',
    '  gap:12px;',
    '  padding:6px 0;',
    '  font-size:13px;',
    '  border-bottom:1px dashed var(--ck-tan-border);',
    '}',
    '.ck-screen-row .ck-value{',
    '  font-variant-numeric: tabular-nums;',
    '  font-weight:600;',
    '  color:var(--ck-text);',
    '}',
    '.ck-screen-row:last-child{ border-bottom:none; }',
    '.ck-screen-row .ck-label{',
    '  text-transform:uppercase;',
    '  letter-spacing:0.07em;',
    '  font-size:10.5px;',
    '  font-weight:700;',
    '  color:var(--ck-text-muted);',
    '}',
    '.ck-screen-total{',
    '  display:flex;',
    '  align-items:center;',
    '  justify-content:space-between;',
    '  gap:12px;',
    '  padding:12px 14px;',
    '  margin:8px -4px 4px;',
    '  background:var(--ck-cream-deep);',
    '  border-radius:10px;',
    '}',
    '.ck-screen-total .ck-label{',
    '  text-transform:uppercase;',
    '  letter-spacing:0.07em;',
    '  font-size:11px;',
    '  font-weight:700;',
    '  color:var(--ck-brown-mid);',
    '}',
    '.ck-total-value{',
    '  font-variant-numeric: tabular-nums;',
    '  font-size:26px;',
    '  font-weight:700;',
    '  color:var(--ck-brown-dark);',
    '  transition:opacity .18s ease;',
    '}',
    '.ck-total-value.ck-pulse{ animation:ck-pulse .5s ease; }',
    '@keyframes ck-pulse{',
    '  0%{ opacity:0.45; transform:scale(0.96); }',
    '  100%{ opacity:1; transform:scale(1); }',
    '}',
    '.ck-screen-row.ck-charge-row{ border-top:1px solid var(--ck-tan-border); border-bottom:none; margin-top:2px; padding-top:10px; }',
    '.ck-screen-row.ck-charge-row .ck-value{ color:var(--ck-sage-dark); }',
    '.ck-screen-row.ck-charge-row .ck-label{ color:var(--ck-sage-dark); }',
    '.ck-section{ margin-bottom:20px; }',
    '.ck-section-title{',
    '  font-family:var(--ck-sans);',
    '  font-size:11px;',
    '  font-weight:700;',
    '  text-transform:uppercase;',
    '  letter-spacing:0.13em;',
    '  color:var(--ck-brown-mid);',
    '  margin:0 0 10px;',
    '}',
    '.ck-field{ margin-bottom:14px; }',
    '.ck-field:last-child{ margin-bottom:0; }',
    '.ck-field label{',
    '  display:block;',
    '  font-size:13px;',
    '  font-weight:600;',
    '  color:var(--ck-text);',
    '  margin-bottom:6px;',
    '}',
    '.ck-optional{ color:var(--ck-text-muted); font-weight:400; text-transform:none; letter-spacing:0; }',
    '.ck-hint{',
    '  margin:6px 0 0;',
    '  font-size:11.5px;',
    '  line-height:1.45;',
    '  color:var(--ck-text-muted);',
    '}',
    '.ck-linklike{',
    '  background:none; border:none; padding:0;',
    '  color:var(--ck-brown); font-size:11.5px; text-decoration:underline;',
    '  cursor:pointer; font-family:inherit;',
    '}',
    '.ck-linklike:hover{ color:var(--ck-brown-dark); }',
    'input[type="number"], input[type="text"], select{',
    '  width:100%;',
    '  background:var(--ck-white);',
    '  border:1px solid var(--ck-tan-border);',
    '  border-radius:8px;',
    '  padding:9px 11px;',
    '  font-family:var(--ck-sans);',
    '  font-variant-numeric: tabular-nums;',
    '  font-size:14px;',
    '  color:var(--ck-text);',
    '  line-height:1.4;',
    '}',
    'input[type="number"]::placeholder{ color:#a89a86; }',
    'input:focus-visible, select:focus-visible, button:focus-visible{',
    '  outline:2px solid var(--ck-brown);',
    '  outline-offset:2px;',
    '}',
    '.ck-inline-fields{ display:flex; align-items:flex-end; gap:8px; margin-top:10px; }',
    '.ck-field-small{ flex:1; }',
    '.ck-field-small label{ font-size:11.5px; margin-bottom:5px; color:var(--ck-text-muted); font-weight:600; }',
    '.ck-multiply{ padding-bottom:9px; color:var(--ck-text-muted); }',
    '.ck-amps-calc{ margin-top:8px; }',
    '.ck-btn-secondary{',
    '  margin-top:10px;',
    '  width:100%;',
    '  background:transparent;',
    '  border:1px solid var(--ck-brown);',
    '  color:var(--ck-brown);',
    '  border-radius:8px;',
    '  padding:8px 10px;',
    '  font-size:13px;',
    '  font-weight:600;',
    '  cursor:pointer;',
    '  font-family:var(--ck-sans);',
    '}',
    '.ck-btn-secondary:hover{ background:rgba(71,55,40,0.06); }',
    '.ck-presets{ display:flex; gap:8px; flex-wrap:wrap; margin-bottom:14px; }',
    '.ck-preset{',
    '  flex:1 1 auto;',
    '  min-width:100px;',
    '  text-align:left;',
    '  background:var(--ck-white);',
    '  border:1px solid var(--ck-tan-border);',
    '  border-radius:8px;',
    '  padding:9px 11px;',
    '  cursor:pointer;',
    '  font-family:var(--ck-sans);',
    '  color:var(--ck-text);',
    '  font-size:12.5px;',
    '  font-weight:600;',
    '  transition:background .15s ease, border-color .15s ease, color .15s ease;',
    '}',
    '.ck-preset span{',
    '  display:block;',
    '  font-variant-numeric: tabular-nums;',
    '  font-size:11px;',
    '  font-weight:400;',
    '  color:var(--ck-text-muted);',
    '  margin-top:2px;',
    '}',
    '.ck-preset.active{ background:var(--ck-brown); border-color:var(--ck-brown); color:#fff; }',
    '.ck-preset.active span{ color:rgba(255,255,255,0.8); }',
    '.ck-preset:hover:not(.active){ border-color:var(--ck-brown); }',
    '.ck-range-row{ display:flex; align-items:center; gap:10px; }',
    'input[type="range"]{',
    '  flex:1;',
    '  accent-color:var(--ck-brown);',
    '  height:20px;',
    '}',
    '.ck-range-value{',
    '  font-variant-numeric: tabular-nums;',
    '  font-size:13px;',
    '  font-weight:600;',
    '  color:var(--ck-brown-dark);',
    '  min-width:42px;',
    '  text-align:right;',
    '}',
    '.ck-currency-row{ display:flex; gap:8px; align-items:center; }',
    '.ck-currency-row select{ width:64px; flex-shrink:0; }',
    '.ck-currency-row input{ flex:1; }',
    '.ck-currency-row .ck-unit{ font-size:12px; color:var(--ck-text-muted); flex-shrink:0; }',
    '.ck-footer{',
    '  text-align:center;',
    '  padding-top:16px;',
    '  margin-top:6px;',
    '  border-top:1px solid var(--ck-tan-border);',
    '}',
    '.ck-footer a{',
    '  font-size:11.5px;',
    '  color:var(--ck-text-muted);',
    '  text-decoration:none;',
    '  letter-spacing:0.02em;',
    '}',
    '.ck-footer a:hover{ color:var(--ck-brown); }',
    '.ck-footer a strong{ color:var(--ck-brown-dark); font-weight:700; }',
    '@media (max-width:380px){',
    '  .ck-chassis{ padding:16px; }',
    '  .ck-total-value{ font-size:22px; }',
    '}',
    '@media (prefers-reduced-motion: reduce){',
    '  .ck-screen-bar{ animation:none; }',
    '  .ck-total-value.ck-pulse{ animation:none; }',
    '}'
  ].join('\n');

  var MARKUP = [
    '<div class="ck-widget">',
    '  <div class="ck-chassis">',
    '    <div class="ck-header">',
    '      <div>',
    '        <h1>Kiln Firing Cost Calculator</h1>',
    '        <p>Know what a firing costs before you switch it on.</p>',
    '      </div>',
    '    </div>',
    '    <div class="ck-screen">',
    '      <div class="ck-screen-bar"></div>',
    '      <div class="ck-screen-row">',
    '        <span class="ck-label">Energy used</span>',
    '        <span class="ck-value" id="ck-result-kwh">0.0 kWh</span>',
    '      </div>',
    '      <div class="ck-screen-row">',
    '        <span class="ck-label">Electricity cost</span>',
    '        <span class="ck-value" id="ck-result-electricity">$0.00</span>',
    '      </div>',
    '      <div class="ck-screen-row" id="ck-result-piece-row" hidden>',
    '        <span class="ck-label">Cost per piece</span>',
    '        <span class="ck-value" id="ck-result-piece">$0.00</span>',
    '      </div>',
    '      <div class="ck-screen-total" aria-live="polite">',
    '        <span class="ck-label">Total firing cost</span>',
    '        <span class="ck-total-value" id="ck-result-total">$0.00</span>',
    '      </div>',
    '      <div class="ck-screen-row ck-charge-row" id="ck-result-charge-row" hidden>',
    '        <span class="ck-label" id="ck-result-charge-label">Suggested charge</span>',
    '        <span class="ck-value" id="ck-result-charge">$0.00</span>',
    '      </div>',
    '    </div>',
    '    <section class="ck-section">',
    '      <h2 class="ck-section-title">Kiln</h2>',
    '      <div class="ck-field">',
    '        <label for="ck-watts">Kiln wattage</label>',
    '        <input type="number" id="ck-watts" value="8000" min="0" step="50" inputmode="decimal">',
    '        <p class="ck-hint">',
    '          Check the data plate or manual for this. Don\'t have it handy?',
    '          <button type="button" class="ck-linklike" id="ck-toggle-amps">Work it out from amps &amp; volts</button>',
    '        </p>',
    '        <div class="ck-amps-calc" id="ck-amps-calc" hidden>',
    '          <div class="ck-inline-fields">',
    '            <div class="ck-field-small">',
    '              <label for="ck-amps">Amps</label>',
    '              <input type="number" id="ck-amps" min="0" step="0.1" placeholder="40">',
    '            </div>',
    '            <span class="ck-multiply">&times;</span>',
    '            <div class="ck-field-small">',
    '              <label for="ck-volts">Volts</label>',
    '              <input type="number" id="ck-volts" min="0" step="1" placeholder="240">',
    '            </div>',
    '          </div>',
    '          <button type="button" class="ck-btn-secondary" id="ck-apply-amps">Use this wattage</button>',
    '        </div>',
    '      </div>',
    '    </section>',
    '    <section class="ck-section">',
    '      <h2 class="ck-section-title">Firing</h2>',
    '      <div class="ck-presets">',
    '        <button type="button" class="ck-preset active" data-hours="8" data-load="60">Bisque<span>~8 hrs</span></button>',
    '        <button type="button" class="ck-preset" data-hours="10" data-load="70">Cone 6 glaze<span>~10 hrs</span></button>',
    '        <button type="button" class="ck-preset" data-hours="13" data-load="75">Cone 10 glaze<span>~13 hrs</span></button>',
    '      </div>',
    '      <div class="ck-field">',
    '        <label for="ck-hours">Firing duration (hours)</label>',
    '        <input type="number" id="ck-hours" value="8" min="0" step="0.25" inputmode="decimal">',
    '      </div>',
    '      <div class="ck-field">',
    '        <label for="ck-load">Average load factor</label>',
    '        <div class="ck-range-row">',
    '          <input type="range" id="ck-load" min="30" max="100" value="60" step="5">',
    '          <span class="ck-range-value"><span id="ck-load-value">60</span>%</span>',
    '        </div>',
    '        <p class="ck-hint">Kilns cycle on and off to hold temperature, so they don\'t draw full wattage the whole time. 55&ndash;75% is typical for most firing schedules.</p>',
    '      </div>',
    '    </section>',
    '    <section class="ck-section">',
    '      <h2 class="ck-section-title">Costs</h2>',
    '      <div class="ck-field">',
    '        <label for="ck-rate">Electricity rate</label>',
    '        <div class="ck-currency-row">',
    '          <select id="ck-currency" aria-label="Currency symbol">',
    '            <option value="£">£</option>',
    '            <option value="$">$</option>',
    '            <option value="€">€</option>',
    '            <option value="A$">A$</option>',
    '            <option value="C$">C$</option>',
    '          </select>',
    '          <input type="number" id="ck-rate" value="0.26" min="0" step="0.01" inputmode="decimal">',
    '          <span class="ck-unit">/ kWh</span>',
    '        </div>',
    '        <p class="ck-hint">Find this on a recent electricity bill &mdash; it\'s your actual cost, not a national average.</p>',
    '      </div>',
    '      <div class="ck-field">',
    '        <label for="ck-extra">Additional cost per firing <span class="ck-optional">(optional)</span></label>',
    '        <input type="number" id="ck-extra" value="0" min="0" step="0.5" inputmode="decimal">',
    '        <p class="ck-hint">Kiln wash, shelves and posts wear, cones, an element replacement fund &mdash; anything else worth folding in.</p>',
    '      </div>',
    '      <div class="ck-field">',
    '        <label for="ck-pieces">Pieces in this firing <span class="ck-optional">(optional)</span></label>',
    '        <input type="number" id="ck-pieces" value="" min="0" step="1" placeholder="25" inputmode="numeric">',
    '      </div>',
    '    </section>',
    '    <section class="ck-section">',
    '      <h2 class="ck-section-title">Charge <span class="ck-optional">(optional)</span></h2>',
    '      <div class="ck-field">',
    '        <label for="ck-markup">Markup multiplier</label>',
    '        <div class="ck-range-row">',
    '          <input type="range" id="ck-markup" min="1" max="6" value="1" step="0.5">',
    '          <span class="ck-range-value"><span id="ck-markup-value">1</span>&times;</span>',
    '        </div>',
    '        <p class="ck-hint">Studios firing for members or students often charge 3&ndash;5&times; the raw cost to cover labor, overhead, and kiln depreciation.</p>',
    '      </div>',
    '    </section>',
    '    <div class="ck-footer">',
    '      <a href="https://www.ceramindtools.com" target="_blank" rel="noopener">Powered by <strong>Ceramind® Tools</strong></a>',
    '    </div>',
    '  </div>',
    '</div>'
  ].join('\n');

  function wireUp(root) {
    var $ = function (id) { return root.getElementById(id); };

    var wattsEl = $('ck-watts');
    var ampsToggleBtn = $('ck-toggle-amps');
    var ampsCalcBox = $('ck-amps-calc');
    var ampsEl = $('ck-amps');
    var voltsEl = $('ck-volts');
    var applyAmpsBtn = $('ck-apply-amps');

    var hoursEl = $('ck-hours');
    var loadEl = $('ck-load');
    var loadValueEl = $('ck-load-value');
    var presetBtns = root.querySelectorAll('.ck-preset');

    var currencyEl = $('ck-currency');
    var rateEl = $('ck-rate');
    var extraEl = $('ck-extra');
    var piecesEl = $('ck-pieces');
    var markupEl = $('ck-markup');
    var markupValueEl = $('ck-markup-value');

    var kwhOut = $('ck-result-kwh');
    var elecOut = $('ck-result-electricity');
    var totalOut = $('ck-result-total');
    var pieceRow = $('ck-result-piece-row');
    var pieceOut = $('ck-result-piece');
    var chargeRow = $('ck-result-charge-row');
    var chargeLabel = $('ck-result-charge-label');
    var chargeOut = $('ck-result-charge');

    function num(el, fallback) {
      var v = parseFloat(el.value);
      return isFinite(v) && v >= 0 ? v : (fallback || 0);
    }

    function fmt(n) {
      if (!isFinite(n)) n = 0;
      return currencyEl.value + n.toFixed(2);
    }

    var pulseTimeout = null;
    function pulseTotal() {
      totalOut.classList.remove('ck-pulse');
      void totalOut.offsetWidth; /* restart animation */
      totalOut.classList.add('ck-pulse');
      clearTimeout(pulseTimeout);
      pulseTimeout = setTimeout(function () { totalOut.classList.remove('ck-pulse'); }, 550);
    }

    function calculate(shouldPulse) {
      var watts = num(wattsEl, 0);
      var hours = num(hoursEl, 0);
      var load = num(loadEl, 0) / 100;
      var rate = num(rateEl, 0);
      var extra = num(extraEl, 0);
      var pieces = num(piecesEl, 0);
      var markup = parseFloat(markupEl.value) || 1;

      var kwh = (watts / 1000) * hours * load;
      var electricityCost = kwh * rate;
      var total = electricityCost + extra;

      kwhOut.textContent = kwh.toFixed(1) + ' kWh';
      elecOut.textContent = fmt(electricityCost);
      var prevTotal = totalOut.textContent;
      totalOut.textContent = fmt(total);

      if (pieces > 0) {
        pieceRow.hidden = false;
        pieceOut.textContent = fmt(total / pieces);
      } else {
        pieceRow.hidden = true;
      }

      if (markup > 1) {
        chargeRow.hidden = false;
        if (pieces > 0) {
          chargeLabel.textContent = 'Suggested charge / piece';
          chargeOut.textContent = fmt((total * markup) / pieces);
        } else {
          chargeLabel.textContent = 'Suggested charge';
          chargeOut.textContent = fmt(total * markup);
        }
      } else {
        chargeRow.hidden = true;
      }

      if (shouldPulse && prevTotal !== totalOut.textContent) { pulseTotal(); }
    }

    loadEl.addEventListener('input', function () {
      loadValueEl.textContent = loadEl.value;
      calculate(true);
    });
    markupEl.addEventListener('input', function () {
      markupValueEl.textContent = markupEl.value;
      calculate(true);
    });

    [wattsEl, hoursEl, rateEl, extraEl, piecesEl].forEach(function (el) {
      el.addEventListener('input', function () { calculate(true); });
    });
    currencyEl.addEventListener('change', function () { calculate(false); });

    ampsToggleBtn.addEventListener('click', function () {
      ampsCalcBox.hidden = !ampsCalcBox.hidden;
    });

    applyAmpsBtn.addEventListener('click', function () {
      var amps = num(ampsEl, 0);
      var volts = num(voltsEl, 0);
      if (amps > 0 && volts > 0) {
        wattsEl.value = Math.round(amps * volts);
        calculate(true);
      }
    });

    presetBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        presetBtns.forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        hoursEl.value = btn.getAttribute('data-hours');
        loadEl.value = btn.getAttribute('data-load');
        loadValueEl.textContent = btn.getAttribute('data-load');
        calculate(true);
      });
    });

    calculate(false);
  }

  function mount(container) {
    if (container.shadowRoot) return; // already mounted
    var shadow = container.attachShadow({ mode: 'open' });

    var styleEl = document.createElement('style');
    styleEl.textContent = STYLE_TEXT;
    shadow.appendChild(styleEl);

    var wrapper = document.createElement('div');
    wrapper.innerHTML = MARKUP;
    shadow.appendChild(wrapper);

    wireUp(shadow);
  }

  function init() {
    var containers = document.querySelectorAll('.ceramind-kiln-cost-calculator');
    containers.forEach(mount);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
