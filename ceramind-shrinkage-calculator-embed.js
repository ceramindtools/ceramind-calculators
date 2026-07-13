/*
 * Ceramind Tools — Clay Shrinkage Calculator (embeddable version)
 *
 * HOW TO EMBED THIS ON ANY SITE:
 * 1. Host this file somewhere with a public URL (see hosting notes from Claude).
 * 2. Paste this snippet wherever the calculator should appear:
 *
 *      <div class="ceramind-shrinkage-calculator"></div>
 *      <script src="PASTE-YOUR-HOSTED-URL-HERE/ceramind-shrinkage-calculator-embed.js" async></script>
 *
 * That's it — the script finds the placeholder div, builds the calculator inside it,
 * and works the same wherever it's placed. Multiple placeholders on one page all work independently.
 */
(function () {
  var STYLE_ID = 'ceramind-shrink-calc-style';
  var TARGET_CLASS = 'ceramind-shrinkage-calculator';
  var SCOPE_CLASS = 'cm-shrink-calc';

  var CSS = '.cm-shrink-calc, .cm-shrink-calc * { box-sizing: border-box; }'
    + '.cm-shrink-calc {'
    + '  --cm-ink: #2e2118;'
    + '  --cm-brand: #473728;'
    + '  --cm-brand-soft: #6b5644;'
    + '  --cm-clay: #96502f;'
    + '  --cm-sage: #66765a;'
    + '  --cm-bg: #efe7da;'
    + '  --cm-card: #fffdf9;'
    + '  --cm-border: #ddd0ba;'
    + '  font-family: inherit;'
    + '  color: var(--cm-ink);'
    + '  max-width: 480px;'
    + '  margin: 2rem auto;'
    + '}'
    + '.cm-shrink-calc .cm-card {'
    + '  background: var(--cm-card);'
    + '  border: 1px solid var(--cm-border);'
    + '  border-radius: 14px;'
    + '  padding: 1.75rem;'
    + '  box-shadow: 0 1px 2px rgba(71,55,40,0.06), 0 8px 24px rgba(71,55,40,0.06);'
    + '}'
    + '.cm-shrink-calc .cm-title {'
    + '  margin: 0 0 0.35rem;'
    + '  font-size: 1.35rem;'
    + '  font-weight: 700;'
    + '  color: var(--cm-brand);'
    + '  line-height: 1.2;'
    + '}'
    + '.cm-shrink-calc .cm-sub {'
    + '  margin: 0 0 1.25rem;'
    + '  font-size: 0.9rem;'
    + '  color: var(--cm-brand-soft);'
    + '  line-height: 1.45;'
    + '}'
    + '.cm-shrink-calc .cm-mode-toggle {'
    + '  display: flex;'
    + '  gap: 0.4rem;'
    + '  margin-bottom: 1.1rem;'
    + '  flex-wrap: wrap;'
    + '}'
    + '.cm-shrink-calc .cm-mode-btn {'
    + '  flex: 1 1 auto;'
    + '  min-width: 140px;'
    + '  padding: 0.55rem 0.7rem;'
    + '  font-size: 0.82rem;'
    + '  font-weight: 600;'
    + '  font-family: inherit;'
    + '  border-radius: 999px;'
    + '  border: 1px solid var(--cm-border);'
    + '  background: transparent;'
    + '  color: var(--cm-brand-soft);'
    + '  cursor: pointer;'
    + '  transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;'
    + '}'
    + '.cm-shrink-calc .cm-mode-btn.is-active {'
    + '  background: var(--cm-brand);'
    + '  border-color: var(--cm-brand);'
    + '  color: #fff;'
    + '}'
    + '.cm-shrink-calc .cm-mode-btn:focus-visible,'
    + '.cm-shrink-calc .cm-unit-btn:focus-visible,'
    + '.cm-shrink-calc select:focus-visible,'
    + '.cm-shrink-calc input:focus-visible {'
    + '  outline: 2px solid var(--cm-sage);'
    + '  outline-offset: 2px;'
    + '}'
    + '.cm-shrink-calc .cm-row {'
    + '  display: flex;'
    + '  align-items: center;'
    + '  justify-content: space-between;'
    + '  gap: 1rem;'
    + '  margin-bottom: 0.85rem;'
    + '}'
    + '.cm-shrink-calc .cm-label {'
    + '  font-size: 0.85rem;'
    + '  font-weight: 600;'
    + '  color: var(--cm-brand);'
    + '  flex: 0 0 auto;'
    + '}'
    + '.cm-shrink-calc select,'
    + '.cm-shrink-calc input[type="number"] {'
    + '  font: inherit;'
    + '  font-size: 0.9rem;'
    + '  padding: 0.5rem 0.65rem;'
    + '  border-radius: 8px;'
    + '  border: 1px solid var(--cm-border);'
    + '  background: #fff;'
    + '  color: var(--cm-ink);'
    + '  max-width: 220px;'
    + '  width: 100%;'
    + '}'
    + '.cm-shrink-calc .cm-unit-toggle { display: flex; gap: 0.3rem; }'
    + '.cm-shrink-calc .cm-unit-btn {'
    + '  padding: 0.4rem 0.85rem;'
    + '  font-size: 0.82rem;'
    + '  font-weight: 600;'
    + '  font-family: inherit;'
    + '  border-radius: 8px;'
    + '  border: 1px solid var(--cm-border);'
    + '  background: transparent;'
    + '  color: var(--cm-brand-soft);'
    + '  cursor: pointer;'
    + '}'
    + '.cm-shrink-calc .cm-unit-btn.is-active {'
    + '  background: var(--cm-sage);'
    + '  border-color: var(--cm-sage);'
    + '  color: #fff;'
    + '}'
    + '.cm-shrink-calc .cm-dims {'
    + '  display: grid;'
    + '  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));'
    + '  gap: 0.75rem;'
    + '  margin: 1rem 0 1.25rem;'
    + '}'
    + '.cm-shrink-calc .cm-dim-label {'
    + '  display: block;'
    + '  font-size: 0.78rem;'
    + '  font-weight: 600;'
    + '  color: var(--cm-brand-soft);'
    + '  margin-bottom: 0.3rem;'
    + '}'
    + '.cm-shrink-calc .cm-dim-input { width: 100%; }'
    + '.cm-shrink-calc .cm-visual {'
    + '  display: flex;'
    + '  align-items: center;'
    + '  gap: 1rem;'
    + '  background: var(--cm-bg);'
    + '  border-radius: 10px;'
    + '  padding: 0.9rem 1rem;'
    + '  margin-bottom: 1.1rem;'
    + '}'
    + '.cm-shrink-calc .cm-svg { width: 76px; height: 76px; flex: 0 0 auto; }'
    + '.cm-shrink-calc .cm-circle-wet {'
    + '  fill: none;'
    + '  stroke: var(--cm-brand-soft);'
    + '  stroke-width: 1.5;'
    + '  stroke-dasharray: 3 3;'
    + '}'
    + '.cm-shrink-calc .cm-circle-fired {'
    + '  fill: var(--cm-clay);'
    + '  fill-opacity: 0.85;'
    + '  transition: r 0.25s ease;'
    + '}'
    + '.cm-shrink-calc .cm-visual-pct {'
    + '  margin: 0;'
    + '  font-size: 1.05rem;'
    + '  font-weight: 700;'
    + '  color: var(--cm-clay);'
    + '}'
    + '.cm-shrink-calc .cm-visual-legend {'
    + '  margin: 0.3rem 0 0;'
    + '  font-size: 0.75rem;'
    + '  color: var(--cm-brand-soft);'
    + '}'
    + '.cm-shrink-calc .cm-visual-note {'
    + '  margin: 0.25rem 0 0;'
    + '  font-size: 0.68rem;'
    + '  font-style: italic;'
    + '  color: var(--cm-brand-soft);'
    + '  opacity: 0.8;'
    + '}'
    + '.cm-shrink-calc .cm-dot {'
    + '  display: inline-block;'
    + '  width: 9px;'
    + '  height: 9px;'
    + '  border-radius: 50%;'
    + '  margin-right: 0.3rem;'
    + '  vertical-align: middle;'
    + '}'
    + '.cm-shrink-calc .cm-dot-wet { border: 1.5px dashed var(--cm-brand-soft); }'
    + '.cm-shrink-calc .cm-dot-fired { background: var(--cm-clay); }'
    + '.cm-shrink-calc .cm-results {'
    + '  background: var(--cm-brand);'
    + '  color: #fff;'
    + '  border-radius: 10px;'
    + '  padding: 1rem 1.1rem;'
    + '  margin-bottom: 1.1rem;'
    + '}'
    + '.cm-shrink-calc .cm-results-title {'
    + '  margin: 0 0 0.5rem;'
    + '  font-size: 0.78rem;'
    + '  font-weight: 700;'
    + '  text-transform: uppercase;'
    + '  letter-spacing: 0.06em;'
    + '  opacity: 0.85;'
    + '}'
    + '.cm-shrink-calc .cm-results-list {'
    + '  margin: 0;'
    + '  padding: 0;'
    + '  list-style: none;'
    + '  display: flex;'
    + '  flex-direction: column;'
    + '  gap: 0.35rem;'
    + '  font-size: 1rem;'
    + '  font-weight: 600;'
    + '}'
    + '.cm-shrink-calc .cm-results-empty { font-size: 0.85rem; font-weight: 400; opacity: 0.75; }'
    + '.cm-shrink-calc .cm-credit {'
    + '  margin: 0;'
    + '  text-align: center;'
    + '  font-size: 0.72rem;'
    + '  color: var(--cm-brand-soft);'
    + '}'
    + '.cm-shrink-calc .cm-credit a {'
    + '  color: var(--cm-clay);'
    + '  font-weight: 600;'
    + '  text-decoration: none;'
    + '}'
    + '.cm-shrink-calc .cm-credit a:hover,'
    + '.cm-shrink-calc .cm-credit a:focus-visible {'
    + '  text-decoration: underline;'
    + '}'
    + '@media (prefers-reduced-motion: reduce) {'
    + '  .cm-shrink-calc .cm-circle-fired { transition: none; }'
    + '}'
    + '@media (max-width: 380px) {'
    + '  .cm-shrink-calc .cm-row { flex-direction: column; align-items: flex-start; }'
    + '  .cm-shrink-calc select, .cm-shrink-calc input[type="number"] { max-width: 100%; }'
    + '}';

  var TEMPLATE = ''
    + '<div class="cm-card">'
    + '  <h3 class="cm-title">Clay Shrinkage Calculator</h3>'
    + '  <p class="cm-sub">Clay shrinks as it dries and fires. Work out your sizing before you throw, roll, or mould.</p>'
    + '  <div class="cm-mode-toggle" role="tablist">'
    + '    <button type="button" class="cm-mode-btn is-active" data-mode="toGreen">I know the finished size</button>'
    + '    <button type="button" class="cm-mode-btn" data-mode="toFired">I know the current size</button>'
    + '  </div>'
    + '  <div class="cm-row">'
    + '    <label class="cm-label">Clay body</label>'
    + '    <select class="cm-clay-select">'
    + '      <option value="0.07">Earthenware — approx. 7%</option>'
    + '      <option value="0.11" selected>Stoneware — approx. 11%</option>'
    + '      <option value="0.13">Porcelain — approx. 13%</option>'
    + '    </select>'
    + '  </div>'
    + '  <div class="cm-row cm-custom-row">'
    + '    <label class="cm-label">Shrinkage %</label>'
    + '    <input type="number" class="cm-custom-pct" min="0" max="30" step="0.1" value="11" inputmode="decimal">'
    + '  </div>'
    + '  <div class="cm-row">'
    + '    <label class="cm-label cm-units-label">Units (Finished Size)</label>'
    + '    <div class="cm-unit-toggle">'
    + '      <button type="button" class="cm-unit-btn is-active" data-unit="cm">cm</button>'
    + '      <button type="button" class="cm-unit-btn" data-unit="in">in</button>'
    + '    </div>'
    + '  </div>'
    + '  <div class="cm-dims">'
    + '    <div class="cm-dim">'
    + '      <label class="cm-dim-label" data-role="label-1">Height</label>'
    + '      <input type="number" class="cm-dim-input" data-role="dim-1" step="0.01" inputmode="decimal" placeholder="e.g. 10">'
    + '    </div>'
    + '    <div class="cm-dim">'
    + '      <label class="cm-dim-label" data-role="label-2">Width / diameter</label>'
    + '      <input type="number" class="cm-dim-input" data-role="dim-2" step="0.01" inputmode="decimal" placeholder="optional">'
    + '    </div>'
    + '    <div class="cm-dim">'
    + '      <label class="cm-dim-label" data-role="label-3">Depth</label>'
    + '      <input type="number" class="cm-dim-input" data-role="dim-3" step="0.01" inputmode="decimal" placeholder="optional">'
    + '    </div>'
    + '  </div>'
    + '  <div class="cm-visual">'
    + '    <svg viewBox="0 0 100 100" class="cm-svg" aria-hidden="true">'
    + '      <circle class="cm-circle-wet" cx="50" cy="50" r="40"></circle>'
    + '      <circle class="cm-circle-fired" cx="50" cy="50" r="36"></circle>'
    + '    </svg>'
    + '    <div class="cm-visual-caption">'
    + '      <p class="cm-visual-pct">11.0% linear shrinkage</p>'
    + '      <p class="cm-visual-legend"><span class="cm-dot cm-dot-wet"></span>Greenware&nbsp;&nbsp;<span class="cm-dot cm-dot-fired"></span>After firing</p>'
    + '      <p class="cm-visual-note">Circle size is exaggerated for visibility, not exact scale.</p>'
    + '    </div>'
    + '  </div>'
    + '  <div class="cm-results">'
    + '    <p class="cm-results-title">Make it this size now:</p>'
    + '    <ul class="cm-results-list"></ul>'
    + '  </div>'
    + '  <p class="cm-credit">Powered by <a href="https://www.ceramindtools.com" target="_blank" rel="noopener">Ceramind® Tools</a></p>'
    + '</div>';

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    var styleEl = document.createElement('style');
    styleEl.id = STYLE_ID;
    styleEl.textContent = CSS;
    document.head.appendChild(styleEl);
  }

  function initOne(root) {
    if (root.dataset.ceramindInit === 'true') return;
    root.dataset.ceramindInit = 'true';
    root.classList.add(SCOPE_CLASS);
    root.innerHTML = TEMPLATE;

    var mode = 'toGreen';
    var unit = 'cm';

    var modeBtns = root.querySelectorAll('.cm-mode-btn');
    var unitBtns = root.querySelectorAll('.cm-unit-btn');
    var claySelect = root.querySelector('.cm-clay-select');
    var customPct = root.querySelector('.cm-custom-pct');
    var dim1 = root.querySelector('[data-role="dim-1"]');
    var dim2 = root.querySelector('[data-role="dim-2"]');
    var dim3 = root.querySelector('[data-role="dim-3"]');
    var label1 = root.querySelector('[data-role="label-1"]');
    var label2 = root.querySelector('[data-role="label-2"]');
    var label3 = root.querySelector('[data-role="label-3"]');
    var unitsLabel = root.querySelector('.cm-units-label');
    var circleFired = root.querySelector('.cm-circle-fired');
    var visualPct = root.querySelector('.cm-visual-pct');
    var resultsTitle = root.querySelector('.cm-results-title');
    var resultsList = root.querySelector('.cm-results-list');

    var BASE_R = 40;

    function getShrinkage() {
      var n = parseFloat(customPct.value);
      return isNaN(n) ? 0 : Math.min(Math.max(n / 100, 0), 0.3);
    }

    function baseLabel(labelEl) {
      return labelEl.textContent.split(' (')[0];
    }

    function updateLabels() {
      var sizeType = mode === 'toGreen' ? 'Finished Size' : 'Current Size';
      unitsLabel.textContent = 'Units (' + sizeType + ')';
      resultsTitle.textContent = mode === 'toGreen'
        ? 'Make it this size now:'
        : 'Expect it to end up around:';
    }

    function updateVisual(S) {
      var AMPLIFY = 2.2;
      var factor = Math.max(1 - (S * AMPLIFY), 0.15);
      var r = BASE_R * factor;
      circleFired.setAttribute('r', r.toFixed(1));
      visualPct.textContent = (S * 100).toFixed(1) + '% linear shrinkage';
    }

    function calcOne(value, S) {
      return mode === 'toGreen' ? value / (1 - S) : value * (1 - S);
    }

    function render() {
      var S = getShrinkage();
      updateVisual(S);

      var rows = [
        [baseLabel(label1), dim1.value],
        [baseLabel(label2), dim2.value],
        [baseLabel(label3), dim3.value]
      ];

      resultsList.innerHTML = '';
      var any = false;
      rows.forEach(function (pair) {
        var raw = parseFloat(pair[1]);
        if (!isNaN(raw) && raw > 0) {
          any = true;
          var out = calcOne(raw, S);
          var li = document.createElement('li');
          li.textContent = pair[0] + ': ' + out.toFixed(2) + ' ' + unit;
          resultsList.appendChild(li);
        }
      });

      if (!any) {
        var li = document.createElement('li');
        li.className = 'cm-results-empty';
        li.textContent = 'Enter at least one dimension above.';
        resultsList.appendChild(li);
      }
    }

    modeBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        modeBtns.forEach(function (b) { b.classList.remove('is-active'); });
        btn.classList.add('is-active');
        mode = btn.getAttribute('data-mode');
        updateLabels();
        render();
      });
    });

    unitBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        unitBtns.forEach(function (b) { b.classList.remove('is-active'); });
        btn.classList.add('is-active');
        unit = btn.getAttribute('data-unit');
        render();
      });
    });

    claySelect.addEventListener('change', function () {
      var preset = parseFloat(claySelect.value);
      if (!isNaN(preset)) {
        customPct.value = (preset * 100).toFixed(1);
      }
      render();
    });

    [customPct, dim1, dim2, dim3].forEach(function (input) {
      input.addEventListener('input', render);
    });

    updateLabels();
    render();
  }

  function initAll() {
    injectStyles();
    var containers = document.querySelectorAll('.' + TARGET_CLASS);
    for (var i = 0; i < containers.length; i++) {
      initOne(containers[i]);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }
})();
