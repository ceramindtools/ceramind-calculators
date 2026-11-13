/*
 * Ceramind Tools — Kiln Firing Cost Calculator (embeddable version)
 *
 * Paste this wherever the calculator should appear:
 *
 *   <div class="ceramind-kiln-cost-calculator"></div>
 *   <script src="https://cdn.jsdelivr.net/gh/ceramindtools/ceramind-calculators@main/ceramind-kiln-cost-calculator-embed.js" async></script>
 *
 * Built by build.py from src/kiln-cost.js + src/base.css. Edit those, then run build.py.
 *
 * Numbers used (check each quarter when the price cap changes):
 * - UK electricity price cap, 1 Oct – 31 Dec 2026: 26.32p per kWh (Direct Debit, before the
 *   54.83p daily standing charge). Source: Ofgem, "Energy price cap unit rates and standing charges".
 * - Economy 7 night rate: about 14.5p per kWh (Ofgem cap average night rate, 1 Jul 2026, as cited by Scottish Gas).
 * - Average power used: bisque and other low firings about 50% of full power, cone 6 glaze about 65%.
 *   Source: Lakeside Pottery, "Estimating electric kiln firing costs".
 * - 13 amp plug: 13 A x 230 V = about 3 kW, the most a plug-in kiln can draw.
 */
(function () {
  var TARGET_CLASS = 'ceramind-kiln-cost-calculator';
  var BASE_ID = 'ceramind-calc-base-v1';
  var STYLE_ID = 'ceramind-kiln-cost-style';
  var BASE_CSS = /*@BASE_CSS@*/'';
  var EMBED_FILE = 'ceramind-kiln-cost-calculator-embed.js';

/*@SHARED_JS@*/

  var RATES = {
    cap: 26.32,      // UK price cap, 1 Oct – 31 Dec 2026
    night: 14.5      // Economy 7 night rate, about
  };
  var CAP_PERIOD = '1 Oct – 31 Dec 2026';

  var FIRINGS = {
    bisque: { hours: 8, load: 50 },
    earthenware: { hours: 8, load: 50 },
    stoneware: { hours: 10, load: 65 }
  };

  var CSS = ''
    + '.cm-calc .cm-ring-track { fill: none; stroke: var(--cm-border); stroke-width: 11; }'
    + '.cm-calc .cm-ring-used { fill: none; stroke: var(--cm-accent); stroke-width: 11; stroke-linecap: butt;'
    + '  transform: rotate(-90deg); transform-origin: 50px 50px; transition: stroke-dasharray 0.25s ease; }'
    + '.cm-calc .cm-ring-text { font-size: 19px; font-weight: 700; fill: var(--cm-brand); text-anchor: middle; dominant-baseline: central; font-family: inherit; }'
    + '.cm-calc .cm-dot-track { background: var(--cm-border); }';

  var uid = 0;

  function template(id) {
    function f(name) { return id + '-' + name; }
    return ''
      + '<div class="cm-card">'
      + '  <h3 class="cm-title">Kiln Firing Cost Calculator</h3>'
      + '  <p class="cm-sub">Work out what one firing costs in electricity, and what that adds to each piece in the kiln.</p>'
      + '  <div class="cm-mode-toggle" role="group" aria-label="How to work it out">'
      + '    <button type="button" class="cm-mode-btn is-active" data-mode="estimate" aria-pressed="true">Estimate from my kiln</button>'
      + '    <button type="button" class="cm-mode-btn" data-mode="reading" aria-pressed="false">I have a kWh reading</button>'
      + '  </div>'
      + '  <div class="cm-row" data-estimate>'
      + '    <label class="cm-label" for="' + f('kiln') + '">Kiln</label>'
      + '    <select id="' + f('kiln') + '" data-role="kiln">'
      + '      <option value="3">Plug-in kiln · up to 3 kW</option>'
      + '      <option value="7" selected>Medium kiln · about 7 kW</option>'
      + '      <option value="11">Large kiln · about 11 kW</option>'
      + '    </select>'
      + '  </div>'
      + '  <div class="cm-row" data-estimate>'
      + '    <label class="cm-label" for="' + f('kw') + '">Kiln power (kW)</label>'
      + '    <input type="number" id="' + f('kw') + '" data-role="kw" min="0" max="60" step="0.1" value="7" inputmode="decimal">'
      + '  </div>'
      + '  <div class="cm-row" data-estimate>'
      + '    <label class="cm-label" for="' + f('firing') + '">Firing</label>'
      + '    <select id="' + f('firing') + '" data-role="firing">'
      + '      <option value="bisque" selected>Bisque · about 1000°C</option>'
      + '      <option value="earthenware">Earthenware glaze · about 1080°C</option>'
      + '      <option value="stoneware">Stoneware glaze · about 1230°C</option>'
      + '    </select>'
      + '  </div>'
      + '  <div class="cm-row" data-estimate>'
      + '    <label class="cm-label" for="' + f('load') + '">Average power used %</label>'
      + '    <input type="number" id="' + f('load') + '" data-role="load" min="5" max="100" step="1" value="50" inputmode="decimal">'
      + '  </div>'
      + '  <div class="cm-row">'
      + '    <span class="cm-label">Currency</span>'
      + '    <div class="cm-unit-toggle" role="group" aria-label="Currency">'
      + '      <button type="button" class="cm-unit-btn is-active" data-cur="gbp" aria-pressed="true">£</button>'
      + '      <button type="button" class="cm-unit-btn" data-cur="usd" aria-pressed="false">$</button>'
      + '    </div>'
      + '  </div>'
      + '  <div class="cm-row" data-uk>'
      + '    <span class="cm-label">Electricity rate</span>'
      + '    <div class="cm-unit-toggle" role="group" aria-label="Electricity rate">'
      + '      <button type="button" class="cm-unit-btn is-active" data-rate="cap" aria-pressed="true">Standard</button>'
      + '      <button type="button" class="cm-unit-btn" data-rate="night" aria-pressed="false">Night (E7)</button>'
      + '    </div>'
      + '  </div>'
      + '  <div class="cm-dims">'
      + '    <div class="cm-dim" data-estimate>'
      + '      <label class="cm-dim-label" for="' + f('hours') + '">Firing time (hours)</label>'
      + '      <input type="number" class="cm-dim-input" id="' + f('hours') + '" data-role="hours" min="0" max="72" step="0.5" value="8" inputmode="decimal">'
      + '    </div>'
      + '    <div class="cm-dim" data-reading hidden>'
      + '      <label class="cm-dim-label" for="' + f('kwh') + '">kWh used</label>'
      + '      <input type="number" class="cm-dim-input" id="' + f('kwh') + '" data-role="kwh" min="0" step="0.1" inputmode="decimal" placeholder="e.g. 25">'
      + '    </div>'
      + '    <div class="cm-dim">'
      + '      <label class="cm-dim-label" for="' + f('price') + '" data-role="price-label">Price per kWh (p)</label>'
      + '      <input type="number" class="cm-dim-input" id="' + f('price') + '" data-role="price" min="0" step="0.01" value="' + RATES.cap + '" inputmode="decimal">'
      + '    </div>'
      + '    <div class="cm-dim">'
      + '      <label class="cm-dim-label" for="' + f('pieces') + '">Pieces in the kiln</label>'
      + '      <input type="number" class="cm-dim-input" id="' + f('pieces') + '" data-role="pieces" min="0" step="1" inputmode="numeric" placeholder="optional">'
      + '    </div>'
      + '  </div>'
      + '  <div class="cm-visual" data-estimate>'
      + '    <svg viewBox="0 0 100 100" class="cm-svg" aria-hidden="true">'
      + '      <circle class="cm-ring-track" cx="50" cy="50" r="38"></circle>'
      + '      <circle class="cm-ring-used" cx="50" cy="50" r="38" stroke-dasharray="0 999"></circle>'
      + '      <text class="cm-ring-text" x="50" y="50">50%</text>'
      + '    </svg>'
      + '    <div class="cm-visual-caption">'
      + '      <p class="cm-visual-pct" data-role="visual-pct">Uses about half its full power</p>'
      + '      <p class="cm-visual-legend"><span class="cm-key"><span class="cm-dot cm-dot-track"></span>Full power</span> <span class="cm-key"><span class="cm-dot cm-dot-fired"></span>Used on average</span></p>'
      + '      <p class="cm-visual-note">The elements switch on and off to follow the firing, so a kiln rarely runs flat out for the whole time.</p>'
      + '    </div>'
      + '  </div>'
      + '  <div class="cm-results" aria-live="polite">'
      + '    <p class="cm-results-title">One firing costs about:</p>'
      + '    <ul class="cm-results-list"></ul>'
      + '    <p class="cm-results-note" data-role="note"></p>'
      + '  </div>'
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
    root.innerHTML = template('cmkc' + uid);

    var mode = 'estimate';
    var cur = 'gbp';
    var rate = 'cap';

    function q(sel) { return root.querySelector(sel); }
    function qa(sel) { return root.querySelectorAll(sel); }
    var kiln = q('[data-role="kiln"]');
    var kw = q('[data-role="kw"]');
    var firing = q('[data-role="firing"]');
    var load = q('[data-role="load"]');
    var hours = q('[data-role="hours"]');
    var kwhIn = q('[data-role="kwh"]');
    var price = q('[data-role="price"]');
    var priceLabel = q('[data-role="price-label"]');
    var pieces = q('[data-role="pieces"]');
    var ring = q('.cm-ring-used');
    var ringText = q('.cm-ring-text');
    var visualPct = q('[data-role="visual-pct"]');
    var list = q('.cm-results-list');
    var note = q('[data-role="note"]');
    var RING_LEN = 2 * Math.PI * 38;

    function num(el) {
      var n = parseFloat(el.value);
      return isNaN(n) || n < 0 ? NaN : n;
    }

    function money(major) {
      // major = amount in pounds or dollars
      var sym = cur === 'gbp' ? '£' : '$';
      var minor = cur === 'gbp' ? 'p' : '¢';
      if (major < 1) {
        var m = major * 100;
        return (m < 10 ? m.toFixed(1) : Math.round(m).toString()) + minor;
      }
      return sym + major.toFixed(2);
    }

    function describeLoad(pct) {
      if (pct <= 40) return 'Uses well under half its full power';
      if (pct < 45) return 'Uses a bit under half its full power';
      if (pct <= 55) return 'Uses about half its full power';
      if (pct <= 70) return 'Uses about two-thirds of its full power';
      if (pct < 90) return 'Uses most of its full power';
      return 'Runs close to full power';
    }

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

    function render() {
      qa('[data-estimate]').forEach(function (el) { el.hidden = mode !== 'estimate'; });
      qa('[data-reading]').forEach(function (el) { el.hidden = mode !== 'reading'; });
      qa('[data-uk]').forEach(function (el) { el.hidden = cur !== 'gbp'; });
      priceLabel.textContent = cur === 'gbp' ? 'Price per kWh (p)' : 'Price per kWh (¢)';

      var pct = num(load);
      var shown = isNaN(pct) ? 0 : Math.min(pct, 100);
      ring.setAttribute('stroke-dasharray', (RING_LEN * shown / 100).toFixed(1) + ' ' + RING_LEN.toFixed(1));
      ringText.textContent = Math.round(shown) + '%';
      visualPct.textContent = describeLoad(shown);

      var kwh = mode === 'estimate' ? num(kw) * num(hours) * (pct / 100) : num(kwhIn);
      var pPerKwh = num(price);
      list.innerHTML = '';

      if (isNaN(kwh) || kwh <= 0 || isNaN(pPerKwh) || pPerKwh <= 0) {
        line(mode === 'estimate' ? 'Enter your kiln power, firing time and electricity price.' : 'Enter the kWh your kiln used and your electricity price.', 'cm-results-empty');
        note.textContent = '';
        return;
      }

      var cost = kwh * pPerKwh / 100;
      line('Electricity: ' + kwh.toFixed(1) + ' kWh');
      line('Cost: ' + money(cost));
      var n = num(pieces);
      if (!isNaN(n) && n >= 1) {
        line('Per piece (' + Math.round(n) + '): ' + money(cost / Math.round(n)));
      }

      if (cur === 'gbp' && rate === 'cap' && Math.abs(pPerKwh - RATES.cap) < 0.005) {
        note.textContent = 'At the UK price cap rate for ' + CAP_PERIOD + '. Your bill shows your own rate.';
      } else if (cur === 'gbp' && rate === 'night' && Math.abs(pPerKwh - RATES.night) < 0.005) {
        note.textContent = 'At a typical Economy 7 night rate. Only the hours that fall in your cheap window get this price.';
      } else {
        note.textContent = 'At your own electricity price.';
      }
    }

    qa('.cm-mode-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        mode = btn.getAttribute('data-mode');
        setPressed(qa('.cm-mode-btn'), 'data-mode', mode);
        render();
      });
    });

    qa('[data-cur]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        cur = btn.getAttribute('data-cur');
        setPressed(qa('[data-cur]'), 'data-cur', cur);
        if (cur === 'gbp') {
          price.value = RATES[rate];
        } else {
          price.value = '';
          price.placeholder = 'e.g. 17';
        }
        render();
      });
    });

    qa('[data-rate]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        rate = btn.getAttribute('data-rate');
        setPressed(qa('[data-rate]'), 'data-rate', rate);
        price.value = RATES[rate];
        render();
      });
    });

    kiln.addEventListener('change', function () {
      kw.value = kiln.value;
      render();
    });

    firing.addEventListener('change', function () {
      var preset = FIRINGS[firing.value];
      if (preset) {
        hours.value = preset.hours;
        load.value = preset.load;
      }
      render();
    });

    [kw, load, hours, kwhIn, price, pieces].forEach(function (el) {
      el.addEventListener('input', render);
    });

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
