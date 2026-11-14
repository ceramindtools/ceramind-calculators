/*
 * Ceramind Tools — Clay Shrinkage Calculator (embeddable version)
 *
 * Paste this wherever the calculator should appear:
 *
 *   <div class="ceramind-shrinkage-calculator"></div>
 *   <script src="https://cdn.jsdelivr.net/gh/ceramindtools/ceramind-calculators@main/ceramind-shrinkage-calculator-embed.js" async></script>
 *
 * Built by build.py from src/shrinkage.js + src/base.css + src/shared.js. Edit those, then run build.py.
 * Same maths as the original July 2026 version: make-now size = finished / (1 - S); fired size = current x (1 - S).
 */
(function () {
  var TARGET_CLASS = 'ceramind-shrinkage-calculator';
  var BASE_ID = 'ceramind-calc-base-v1';
  var STYLE_ID = 'ceramind-shrink-calc-style';
  var BASE_CSS = /*@BASE_CSS@*/'';
  var EMBED_FILE = 'ceramind-shrinkage-calculator-embed.js';

/*@SHARED_JS@*/

  var PRESETS = ['7', '11', '13'];   // shrinkage % per clay body preset

  var CSS = ''
    + '.cm-calc .cm-circle-wet { fill: none; stroke: var(--cm-brand-soft); stroke-width: 1.5; stroke-dasharray: 3 3; }'
    + '.cm-calc .cm-circle-fired { fill: var(--cm-brand); transition: r 0.25s ease; }';

  var uid = 0;

  function template(id) {
    function f(name) { return id + '-' + name; }
    return ''
      + '<div class="cm-card">'
      + '  <h3 class="cm-title">Clay Shrinkage Calculator</h3>'
      + '  <p class="cm-sub">Clay shrinks as it dries and fires. Work out your sizing before you throw, roll, or mould.</p>'
      + '  <div class="cm-mode-toggle" role="group" aria-label="Which size you know">'
      + '    <button type="button" class="cm-mode-btn is-active" data-mode="toGreen" aria-pressed="true">I know the finished size</button>'
      + '    <button type="button" class="cm-mode-btn" data-mode="toFired" aria-pressed="false">I know the current size</button>'
      + '  </div>'
      + '  <div class="cm-row">'
      + '    <label class="cm-label" for="' + f('clay') + '">Clay body</label>'
      + '    <select id="' + f('clay') + '" data-role="clay">'
      + '      <option value="7">Earthenware · about 7%</option>'
      + '      <option value="11" selected>Stoneware · about 11%</option>'
      + '      <option value="13">Porcelain · about 13%</option>'
      + '      <option value="own">My own clay</option>'
      + '    </select>'
      + '  </div>'
      + '  <div class="cm-row">'
      + '    <label class="cm-label" for="' + f('pct') + '">Shrinkage %</label>'
      + '    <input type="number" id="' + f('pct') + '" data-role="pct" min="0" max="30" step="0.1" value="11" inputmode="decimal">'
      + '  </div>'
      + '  <p class="cm-hint">The presets sit inside the ranges <a href="https://valentineclays.co.uk/pages/shrinkage-rates" target="_blank" rel="noopener">Valentine Clays gives</a>: earthenware about 5–10%, stoneware and porcelain about 10–15%.</p>'
      + '  <div class="cm-row">'
      + '    <span class="cm-label" data-role="units-label">Units (finished size)</span>'
      + '    <div class="cm-unit-toggle" role="group" aria-label="Units">'
      + '      <button type="button" class="cm-unit-btn is-active" data-unit="cm" aria-pressed="true">cm</button>'
      + '      <button type="button" class="cm-unit-btn" data-unit="in" aria-pressed="false">in</button>'
      + '    </div>'
      + '  </div>'
      + '  <div class="cm-dims">'
      + '    <div class="cm-dim">'
      + '      <label class="cm-dim-label" for="' + f('d1') + '">Height</label>'
      + '      <input type="number" class="cm-dim-input" id="' + f('d1') + '" data-role="dim" data-name="Height" step="0.01" min="0" inputmode="decimal" placeholder="e.g. 10">'
      + '    </div>'
      + '    <div class="cm-dim">'
      + '      <label class="cm-dim-label" for="' + f('d2') + '">Width / diameter</label>'
      + '      <input type="number" class="cm-dim-input" id="' + f('d2') + '" data-role="dim" data-name="Width / diameter" step="0.01" min="0" inputmode="decimal" placeholder="optional">'
      + '    </div>'
      + '    <div class="cm-dim">'
      + '      <label class="cm-dim-label" for="' + f('d3') + '">Depth</label>'
      + '      <input type="number" class="cm-dim-input" id="' + f('d3') + '" data-role="dim" data-name="Depth" step="0.01" min="0" inputmode="decimal" placeholder="optional">'
      + '    </div>'
      + '  </div>'
      + '  <div class="cm-visual">'
      + '    <svg viewBox="0 0 100 100" class="cm-svg" aria-hidden="true">'
      + '      <circle class="cm-circle-wet" cx="50" cy="50" r="40"></circle>'
      + '      <circle class="cm-circle-fired" cx="50" cy="50" r="30"></circle>'
      + '    </svg>'
      + '    <div class="cm-visual-caption">'
      + '      <p class="cm-visual-pct" data-role="visual-pct">11.0% linear shrinkage</p>'
      + '      <p class="cm-visual-legend"><span class="cm-key"><span class="cm-dot cm-dot-wet"></span>Greenware</span> <span class="cm-key"><span class="cm-dot cm-dot-fired"></span>After firing</span></p>'
      + '      <p class="cm-visual-note">Circle size is exaggerated so you can see it, not to exact scale.</p>'
      + '    </div>'
      + '  </div>'
      + '  <div class="cm-results">'
      + '    <p class="cm-results-title" data-role="results-title">Make it this size now:</p>'
      + '    <ul class="cm-results-list"></ul>'
      + '  </div>'
      + '  <p class="cm-sr" aria-live="polite" aria-atomic="true" data-role="sr"></p>'
      + '  <p class="cm-disclaimer">These are estimates to help you plan. Shrinkage varies with your clay batch, how dry the piece gets and your firing, so fire and measure a test tile when the size really matters. Ceramind Tools can\'t accept responsibility for decisions based on these results.</p>'
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
    root.innerHTML = template('cmsc' + uid);

    var mode = 'toGreen';
    var unit = 'cm';
    var srTimer;

    function q(sel) { return root.querySelector(sel); }
    function qa(sel) { return root.querySelectorAll(sel); }
    var clay = q('[data-role="clay"]');
    var pct = q('[data-role="pct"]');
    var dims = qa('[data-role="dim"]');
    var unitsLabel = q('[data-role="units-label"]');
    var circleFired = q('.cm-circle-fired');
    var visualPct = q('[data-role="visual-pct"]');
    var resultsTitle = q('[data-role="results-title"]');
    var list = q('.cm-results-list');
    var sr = q('[data-role="sr"]');

    function shrinkage() {
      var n = parseFloat(pct.value);
      return isNaN(n) ? 0 : Math.min(Math.max(n / 100, 0), 0.3);
    }

    function setPressed(btns, attr, value) {
      btns.forEach(function (b) {
        var on = b.getAttribute(attr) === value;
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
    }

    function render() {
      var S = shrinkage();
      unitsLabel.textContent = mode === 'toGreen' ? 'Units (finished size)' : 'Units (current size)';
      resultsTitle.textContent = mode === 'toGreen' ? 'Make it this size now:' : 'Expect it to end up around:';
      // the fired circle is drawn 2.2x smaller than real so the change is visible
      circleFired.setAttribute('r', (40 * Math.max(1 - S * 2.2, 0.15)).toFixed(1));
      visualPct.textContent = (S * 100).toFixed(1) + '% linear shrinkage';

      list.innerHTML = '';
      var spoken = [];
      dims.forEach(function (input) {
        var v = parseFloat(input.value);
        if (isNaN(v) || v <= 0) return;
        var out = mode === 'toGreen' ? v / (1 - S) : v * (1 - S);
        var li = document.createElement('li');
        li.textContent = input.getAttribute('data-name') + ': ' + out.toFixed(2) + ' ' + unit;
        list.appendChild(li);
        spoken.push(li.textContent);
      });
      if (!spoken.length) {
        var li = document.createElement('li');
        li.className = 'cm-results-empty';
        li.textContent = 'Enter at least one size above.';
        list.appendChild(li);
      }
      clearTimeout(srTimer);
      srTimer = setTimeout(function () { sr.textContent = spoken.length ? resultsTitle.textContent + ' ' + spoken.join(', ') + '.' : ''; }, 700);
    }

    qa('.cm-mode-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        mode = btn.getAttribute('data-mode');
        setPressed(qa('.cm-mode-btn'), 'data-mode', mode);
        render();
      });
    });

    qa('.cm-unit-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        unit = btn.getAttribute('data-unit');
        setPressed(qa('.cm-unit-btn'), 'data-unit', unit);
        render();
      });
    });

    clay.addEventListener('change', function () {
      if (clay.value !== 'own') pct.value = clay.value;
      render();
    });

    pct.addEventListener('input', function () {
      var v = String(parseFloat(pct.value));
      clay.value = PRESETS.indexOf(v) >= 0 ? v : 'own';
    });

    [pct].concat(Array.prototype.slice.call(dims)).forEach(function (el) {
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
