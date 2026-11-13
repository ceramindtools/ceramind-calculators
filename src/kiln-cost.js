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
  var CAP_ENDS = Date.UTC(2027, 0, 1);   // after this the note stops naming the period as current
  var PRESET_KW = ['3', '7', '11'];

  var FIRINGS = {
    bisque: { hours: 8, load: 50 },
    earthenware: { hours: 8, load: 50 },
    stoneware: { hours: 10, load: 65 }
  };

  var CSS = ''
    + '.cm-calc .cm-ring-track { fill: none; stroke: var(--cm-sand); stroke-width: 11; }'
    + '.cm-calc .cm-ring-used { fill: none; stroke: var(--cm-brand); stroke-width: 11; stroke-linecap: butt;'
    + '  transform: rotate(-90deg); transform-origin: 50px 50px; transition: stroke-dasharray 0.25s ease; }'
    + '.cm-calc .cm-ring-text { font-size: 19px; font-weight: 700; fill: var(--cm-brand); text-anchor: middle; dominant-baseline: central; font-family: inherit; }'
    + '.cm-calc .cm-dot-track { background: var(--cm-sand); }';

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
      + '      <option value="3">UK plug-in kiln · up to 3 kW</option>'
      + '      <option value="7" selected>Medium kiln · about 7 kW</option>'
      + '      <option value="11">Large kiln · about 11 kW</option>'
      + '      <option value="own">My own kiln</option>'
      + '    </select>'
      + '  </div>'
      + '  <div class="cm-row" data-estimate>'
      + '    <label class="cm-label" for="' + f('kw') + '">Kiln power (kW)</label>'
      + '    <input type="number" id="' + f('kw') + '" data-role="kw" min="0" step="0.1" value="7" inputmode="decimal">'
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
      + '    <input type="number" id="' + f('load') + '" data-role="load" min="1" max="100" step="1" value="50" inputmode="decimal">'
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
      + '      <label class="cm-dim-label" for="' + f('hours') + '">Heating time (hours)</label>'
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
      + '  <p class="cm-hint" data-estimate>Count the heating and any hold, not the cooling. A kiln cooling down on its own uses no power.</p>'
      + '  <div class="cm-visual" data-estimate>'
      + '    <svg viewBox="0 0 100 100" class="cm-svg" aria-hidden="true">'
      + '      <circle class="cm-ring-track" cx="50" cy="50" r="38"></circle>'
      + '      <circle class="cm-ring-used" cx="50" cy="50" r="38" stroke-dasharray="0 999"></circle>'
      + '      <text class="cm-ring-text" x="50" y="50">50%</text>'
      + '    </svg>'
      + '    <div class="cm-visual-caption">'
      + '      <p class="cm-visual-pct" data-role="visual-pct">Uses about half its full power</p>'
      + '      <p class="cm-visual-legend"><span class="cm-key"><span class="cm-dot cm-dot-track"></span>Full power</span> <span class="cm-key"><span class="cm-dot cm-dot-fired"></span>Used on average</span></p>'
      + '      <p class="cm-visual-note">The elements switch on and off to follow the firing, so a kiln rarely runs flat out. Leave this at the preset unless you know your kiln\'s figure.</p>'
      + '    </div>'
      + '  </div>'
      + '  <div class="cm-results">'
      + '    <p class="cm-results-title">One firing costs about:</p>'
      + '    <ul class="cm-results-list"></ul>'
      + '    <p class="cm-results-note" data-role="note"></p>'
      + '  </div>'
      + '  <p class="cm-sr" aria-live="polite" aria-atomic="true" data-role="sr"></p>'
      + '  <p class="cm-disclaimer">This is an estimate to help you plan, not a quote. Your real cost depends on your kiln, how it\'s loaded, your firing schedule and your tariff, so check your meter or bill for exact figures. Ceramind Tools can\'t accept responsibility for decisions based on these results.</p>'
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
    var savedPrice = { gbp: String(RATES.cap), usd: '' };
    var srTimer;

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
    var sr = q('[data-role="sr"]');
    var RING_LEN = 2 * Math.PI * 38;

    function num(el) {
      var n = parseFloat(el.value);
      return isNaN(n) || n <= 0 ? NaN : n;
    }

    function fmt(n, dp) {
      return n.toLocaleString('en-GB', { minimumFractionDigits: dp, maximumFractionDigits: dp });
    }

    function money(major) {
      // major = amount in pounds or dollars
      var sym = cur === 'gbp' ? '£' : '$';
      var minor = cur === 'gbp' ? 'p' : '¢';
      if (Math.round(major * 100) >= 100) return sym + fmt(major, 2);
      var m = major * 100;
      if (m < 0.05) return 'under 0.1' + minor;
      if (m < 9.95) return m.toFixed(1) + minor;
      return Math.round(m) + minor;
    }

    function kwhText(n) {
      return fmt(n, n < 1 ? 2 : 1) + ' kWh';
    }

    function describeLoad(pct) {
      if (pct < 35) return 'Uses well under half its full power';
      if (pct < 45) return 'Uses a bit under half its full power';
      if (pct <= 55) return 'Uses about half its full power';
      if (pct < 62) return 'Uses a bit over half its full power';
      if (pct <= 72) return 'Uses about two-thirds of its full power';
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

    function announce(text) {
      clearTimeout(srTimer);
      srTimer = setTimeout(function () { sr.textContent = text; }, 700);
    }

    function render() {
      qa('[data-estimate]').forEach(function (el) { el.hidden = mode !== 'estimate'; });
      qa('[data-reading]').forEach(function (el) { el.hidden = mode !== 'reading'; });
      qa('[data-uk]').forEach(function (el) { el.hidden = cur !== 'gbp'; });
      priceLabel.textContent = cur === 'gbp' ? 'Price per kWh (p)' : 'Price per kWh (¢)';
      price.placeholder = cur === 'gbp' ? 'e.g. 26.32' : 'e.g. 17';

      var notes = [];
      var pct = num(load);
      if (pct > 100) { notes.push('Average power can\'t be over 100%, so 100% is used.'); pct = 100; }
      var shown = isNaN(pct) ? 0 : pct;
      ring.setAttribute('stroke-dasharray', (RING_LEN * shown / 100).toFixed(1) + ' ' + RING_LEN.toFixed(1));
      ringText.textContent = Math.round(shown) + '%';
      visualPct.textContent = describeLoad(shown);

      var power = num(kw);
      if (power > 60) {
        notes.push('Read ' + fmt(power, 0) + ' as watts: ' + fmt(power / 1000, power % 1000 ? 2 : 0) + ' kW.');
        power = power / 1000;
      }
      var pPerKwh = num(price);
      if (pPerKwh < 1) {
        notes.push('Read ' + price.value + ' as ' + (cur === 'gbp' ? '£' : '$') + price.value + ' per kWh (' + (Math.round(pPerKwh * 10000) / 100) + (cur === 'gbp' ? 'p' : '¢') + ').');
        pPerKwh = pPerKwh * 100;
      }

      var missing = [];
      if (mode === 'estimate') {
        if (isNaN(power)) missing.push('kiln power');
        if (isNaN(num(hours))) missing.push('heating time');
        if (isNaN(pct)) missing.push('average power %');
      } else if (isNaN(num(kwhIn))) {
        missing.push('kWh reading');
      }
      if (isNaN(pPerKwh)) missing.push('electricity price');

      list.innerHTML = '';
      if (missing.length) {
        var last = missing.pop();
        line('Enter your ' + (missing.length ? missing.join(', ') + ' and ' : '') + last + '.', 'cm-results-empty');
        note.textContent = '';
        return;
      }

      var kwh = mode === 'estimate' ? power * num(hours) * (pct / 100) : num(kwhIn);
      var cost = kwh * pPerKwh / 100;
      line('Cost: ' + money(cost));
      line('Electricity: ' + kwhText(kwh));
      var n = Math.round(num(pieces));
      if (n >= 1) line('Per piece (' + n + '): ' + money(cost / n));

      var isCap = cur === 'gbp' && Math.abs(pPerKwh - RATES.cap) < 0.005;
      var isNight = cur === 'gbp' && Math.abs(pPerKwh - RATES.night) < 0.005;
      if (isCap) {
        notes.push(Date.now() < CAP_ENDS
          ? 'At the UK price cap rate for ' + CAP_PERIOD + '. Your bill shows your own rate.'
          : 'At the UK price cap rate for ' + CAP_PERIOD + '. Check your bill for today\'s rate.');
      } else if (isNight) {
        notes.push('At a typical Economy 7 night rate, as if every hour fell in your cheap window. Most firings run longer than the 7-hour window, so expect a little more.');
      } else {
        notes.push('At your own electricity price.');
      }
      note.textContent = notes.join(' ');
      announce('One firing costs about ' + money(cost) + '.');
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
        var next = btn.getAttribute('data-cur');
        if (next === cur) return;
        savedPrice[cur] = price.value;
        cur = next;
        setPressed(qa('[data-cur]'), 'data-cur', cur);
        price.value = savedPrice[cur];
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
      if (kiln.value !== 'own') kw.value = kiln.value;
      render();
    });

    kw.addEventListener('input', function () {
      var v = String(parseFloat(kw.value));
      kiln.value = PRESET_KW.indexOf(v) >= 0 ? v : 'own';
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
