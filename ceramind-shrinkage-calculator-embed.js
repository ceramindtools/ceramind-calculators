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
  var BASE_CSS = ".cm-calc,.cm-calc *{box-sizing: border-box;}.cm-calc{--cm-ink: #171717;--cm-brand: #473728;--cm-brand-soft: #4a4642;--cm-accent: #a4886e;--cm-sand: #d2c1b4;--cm-tint: #ffffff;--cm-bg: #e3e0df;--cm-card: #efedeb;--cm-border: #d9d4d0;--cm-field: #8f857c;font-family: inherit;color: var(--cm-ink);max-width: 480px;margin: 2rem auto;text-align: left;}.cm-calc [hidden]{display: none !important;}.cm-calc .cm-card{background: var(--cm-card);border: 1px solid var(--cm-border);border-radius: 14px;padding: 1.75rem;box-shadow: 0 1px 2px rgba(71,55,40,0.06),0 8px 24px rgba(71,55,40,0.06);}.cm-calc .cm-title{margin: 0 0 0.35rem;font-size: 1.35rem;font-weight: 700;color: var(--cm-brand);line-height: 1.2;}.cm-calc .cm-sub{margin: 0 0 1.25rem;font-size: 0.9rem;color: var(--cm-brand-soft);line-height: 1.45;}.cm-calc .cm-mode-toggle{display: flex;gap: 0.4rem;margin-bottom: 1.1rem;flex-wrap: wrap;}.cm-calc .cm-mode-btn{flex: 1 1 auto;min-width: 140px;padding: 0.55rem 0.7rem;font-size: 0.82rem;font-weight: 600;font-family: inherit;line-height: 1.3;border-radius: 999px;border: 1px solid var(--cm-field);background: transparent;color: var(--cm-brand-soft);cursor: pointer;transition: background 0.15s ease,color 0.15s ease,border-color 0.15s ease;}.cm-calc .cm-mode-btn.is-active{background: var(--cm-brand);border-color: var(--cm-brand);color: #fff;}.cm-calc a:focus-visible,.cm-calc .cm-mode-btn:focus-visible,.cm-calc .cm-unit-btn:focus-visible,.cm-calc select:focus-visible,.cm-calc input:focus-visible{outline: 2px solid var(--cm-brand);outline-offset: 2px;}.cm-calc .cm-row{display: flex;align-items: center;justify-content: space-between;gap: 1rem;margin-bottom: 0.85rem;}.cm-calc .cm-label{font-size: 0.85rem;font-weight: 600;color: var(--cm-brand);flex: 0 0 auto;}.cm-calc select,.cm-calc input[type=\"number\"]{font: inherit;font-size: 0.9rem;padding: 0.5rem 0.65rem;border-radius: 8px;border: 1px solid var(--cm-field);background: #fff;color: var(--cm-ink);max-width: 220px;width: 100%;margin: 0;min-height: 0;height: auto;}.cm-calc .cm-unit-toggle{display: flex;gap: 0.3rem;}.cm-calc .cm-unit-btn{padding: 0.4rem 0.85rem;font-size: 0.82rem;font-weight: 600;font-family: inherit;line-height: 1.3;border-radius: 8px;border: 1px solid var(--cm-field);background: transparent;color: var(--cm-brand-soft);cursor: pointer;}.cm-calc .cm-unit-btn.is-active{background: var(--cm-tint);border-color: var(--cm-brand);box-shadow: inset 0 0 0 1px var(--cm-brand);color: var(--cm-brand);}.cm-calc .cm-dims{display: grid;grid-template-columns: repeat(auto-fit,minmax(120px,1fr));gap: 0.75rem;margin: 1rem 0 1.25rem;}.cm-calc .cm-dim-label{display: block;font-size: 0.78rem;font-weight: 600;color: var(--cm-brand-soft);margin-bottom: 0.3rem;}.cm-calc .cm-dims input[type=\"number\"],.cm-calc .cm-dim-input{width: 100%;max-width: none;}.cm-calc .cm-visual{display: flex;align-items: center;gap: 1rem;background: var(--cm-bg);border-radius: 10px;padding: 0.9rem 1rem;margin-bottom: 1.1rem;}.cm-calc .cm-svg{width: 76px;height: 76px;flex: 0 0 auto;}.cm-calc .cm-visual-pct{margin: 0;font-size: 1.05rem;font-weight: 700;color: var(--cm-brand);line-height: 1.3;}.cm-calc .cm-visual-legend{margin: 0.3rem 0 0;font-size: 0.75rem;color: var(--cm-brand-soft);}.cm-calc .cm-visual-note{margin: 0.25rem 0 0;font-size: 0.68rem;font-style: italic;color: var(--cm-brand-soft);line-height: 1.4;}.cm-calc .cm-dot{display: inline-block;width: 9px;height: 9px;border-radius: 50%;margin-right: 0.3rem;vertical-align: middle;}.cm-calc .cm-dot-wet{border: 1.5px dashed var(--cm-brand-soft);}.cm-calc .cm-dot-fired{background: var(--cm-brand);}.cm-calc .cm-results{background: var(--cm-brand);color: #fff;border-radius: 10px;padding: 1rem 1.1rem;margin-bottom: 1.1rem;}.cm-calc .cm-results-title{margin: 0 0 0.5rem;font-size: 0.78rem;font-weight: 700;text-transform: uppercase;letter-spacing: 0.06em;opacity: 0.85;}.cm-calc .cm-results-list{margin: 0;padding: 0;list-style: none;display: flex;flex-direction: column;gap: 0.35rem;font-size: 1rem;font-weight: 600;}.cm-calc .cm-results-list li{margin: 0;padding: 0;color: #fff;}.cm-calc .cm-results-list li::before,.cm-calc .cm-results-list li::marker{content: none;}.cm-calc .cm-results-empty{font-size: 0.85rem;font-weight: 400;opacity: 0.75;}.cm-calc .cm-results-note{margin: 0.6rem 0 0;font-size: 0.75rem;font-weight: 400;opacity: 0.8;line-height: 1.4;color: #fff;}.cm-calc a{color: var(--cm-brand);text-decoration: underline;text-underline-offset: 2px;}.cm-calc .cm-results a{color: #fff;}.cm-calc .cm-disclaimer{margin: 0 0 0.6rem;text-align: center;font-size: 0.7rem;line-height: 1.45;color: var(--cm-brand-soft);}.cm-calc .cm-credit{margin: 0;text-align: center;font-size: 0.72rem;color: var(--cm-brand-soft);}.cm-calc .cm-credit a{color: var(--cm-brand);font-weight: 600;text-decoration: none;}.cm-calc .cm-credit a:hover,.cm-calc .cm-credit a:focus-visible{text-decoration: underline;}@media (prefers-reduced-motion: reduce){.cm-calc *{transition: none !important;}}.cm-calc.cm-embed{max-width: none;margin: 0.75rem 0 1.5rem;}.cm-calc .cm-code-box{display: flex;align-items: center;gap: 0.9rem;background: var(--cm-card);border: 1px solid var(--cm-border);border-radius: 10px;padding: 0.9rem 1rem;}.cm-calc pre.cm-code{margin: 0;padding: 0;flex: 1 1 auto;min-width: 0;background: transparent;border: 0;font-family: ui-monospace,\"SF Mono\",Menlo,Consolas,monospace;font-size: 0.78rem;line-height: 1.55;color: var(--cm-ink);white-space: pre-wrap;word-break: normal;overflow-wrap: anywhere;}.cm-calc .cm-copy-btn{flex: 0 0 auto;padding: 0.55rem 1rem;font-family: inherit;font-size: 0.82rem;font-weight: 600;line-height: 1.3;border-radius: 999px;border: 1px solid var(--cm-brand);background: var(--cm-brand);color: #fff;cursor: pointer;transition: background 0.15s ease,color 0.15s ease;}.cm-calc .cm-copy-btn.is-done{background: #fff;color: var(--cm-brand);}.cm-calc .cm-copy-btn:focus-visible{outline: 2px solid var(--cm-brand);outline-offset: 2px;}.cm-calc .cm-hint{margin: -0.6rem 0 1.1rem;font-size: 0.75rem;line-height: 1.45;color: var(--cm-brand-soft);}.cm-calc .cm-sr{position: absolute !important;width: 1px;height: 1px;margin: -1px;padding: 0;overflow: hidden;clip: rect(0 0 0 0);white-space: nowrap;border: 0;}.cm-calc .cm-key{white-space: nowrap;margin-right: 0.6rem;}@media (max-width: 480px){.cm-calc .cm-card{padding: 1.4rem 1.25rem;}.cm-calc .cm-code-box{flex-direction: column;align-items: stretch;}.cm-calc .cm-row{display: grid;grid-template-columns: minmax(0,1fr);gap: 0.35rem;margin-bottom: 1rem;}.cm-calc .cm-row>select,.cm-calc .cm-row>input{max-width: none;}.cm-calc .cm-row>.cm-unit-toggle{justify-self: start;}}";
  var EMBED_FILE = 'ceramind-shrinkage-calculator-embed.js';

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
