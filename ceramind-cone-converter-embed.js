/*
 * Ceramind Tools: Cone & Kiln Temperature Converter (embeddable version)
 *
 * Paste this wherever the calculator should appear:
 *
 *   <div class="ceramind-cone-converter"></div>
 *   <script src="https://cdn.jsdelivr.net/gh/ceramindtools/ceramind-calculators@main/ceramind-cone-converter-embed.js" async></script>
 *
 * Built by build.py from src/cone-converter.js + src/base.css + src/shared.js. Edit those, then run build.py.
 * The file name and the target class are the July originals, so sites that already embed it keep working.
 *
 * Two jobs, asking only what a potter knows:
 * - Cone to temperature: pick the cone and the firing rate (60 or 150°C an hour over the last 100°C), get °C first
 *   and °F second. A collapsible chart lists every cone at both rates.
 * - °C <-> °F: type a temperature, say which scale it's in.
 *
 * Every number comes from a named source:
 * - Cone temperatures: Orton, "Temperature Equivalent Chart for Orton Pyrometric Cones (°F)", cones 022-14
 *   (https://www.theceramicshop.com/downloads/Ortonconecharttemperatures.pdf, checked 16 Nov 2026). Self Supporting
 *   Cones, Regular, the 108 and 270°F/hour columns ("Heating Rate °F/hour (last 180°F of firing)"), i.e. 60 and
 *   150°C/hr over the last 100°C. °F are Orton's own figures; °C = (°F - 32) x 5/9, rounded to the nearest degree,
 *   the same way as src/firing-schedule.js. Every cone both calculators cover gives the same °C (cone 6 = 1222 and
 *   1243°C, cone 06 = 998 and 1013°C).
 *   The July 2026 hand-made file had cones 022, 021 and 020 wrong: it showed the 270°F/hr figure as the 108°F/hr
 *   one and said Orton gives no fast figure. The chart gives both (022 = 1087 and 1094°F).
 * - Rate hint: Bartlett Instruments, Genesis controller manual (3-3-16), Appendix B. Its four cone-fire presets end
 *   at 80, 108, 120 and 200°F/hr (44, 60, 67 and 111°C/hr), so only Fast is nearer 150 than 60.
 * - Quick convert: °F = °C x 9/5 + 32, shown to 0.1 of a degree. Below absolute zero (-273.15°C, -459.67°F) is refused.
 *
 * The July file's unsourced extras are gone: the "use" label per cone, the gauge, °F first.
 */
(function () {
  var TARGET_CLASS = 'ceramind-cone-converter';
  var BASE_ID = 'ceramind-calc-base-v1';
  var STYLE_ID = 'ceramind-cone-converter-style';
  var BASE_CSS = ".cm-calc,.cm-calc *{box-sizing: border-box;}.cm-calc{--cm-ink: #171717;--cm-brand: #473728;--cm-brand-soft: #4a4642;--cm-accent: #a4886e;--cm-sand: #d2c1b4;--cm-tint: #ffffff;--cm-bg: #e3e0df;--cm-card: #efedeb;--cm-border: #d9d4d0;--cm-field: #8f857c;font-family: inherit;color: var(--cm-ink);max-width: 480px;margin: 2rem auto;text-align: left;}.cm-calc [hidden]{display: none !important;}.cm-calc .cm-card{background: var(--cm-card);border: 1px solid var(--cm-border);border-radius: 14px;padding: 1.75rem;box-shadow: 0 1px 2px rgba(71,55,40,0.06),0 8px 24px rgba(71,55,40,0.06);}.cm-calc .cm-title{margin: 0 0 0.35rem;font-size: 1.35rem;font-weight: 700;color: var(--cm-brand);line-height: 1.2;}.cm-calc .cm-sub{margin: 0 0 1.25rem;font-size: 0.9rem;color: var(--cm-brand-soft);line-height: 1.45;}.cm-calc .cm-mode-toggle{display: flex;gap: 0.4rem;margin-bottom: 1.1rem;flex-wrap: wrap;}.cm-calc .cm-mode-btn{flex: 1 1 auto;min-width: 140px;padding: 0.55rem 0.7rem;font-size: 0.82rem;font-weight: 600;font-family: inherit;line-height: 1.3;border-radius: 999px;border: 1px solid var(--cm-field);background: transparent;color: var(--cm-brand-soft);cursor: pointer;transition: background 0.15s ease,color 0.15s ease,border-color 0.15s ease;}.cm-calc .cm-mode-btn.is-active{background: var(--cm-brand);border-color: var(--cm-brand);color: #fff;}.cm-calc a:focus-visible,.cm-calc .cm-mode-btn:focus-visible,.cm-calc .cm-unit-btn:focus-visible,.cm-calc select:focus-visible,.cm-calc input:focus-visible{outline: 2px solid var(--cm-brand);outline-offset: 2px;}.cm-calc .cm-row{display: flex;align-items: center;justify-content: space-between;gap: 1rem;margin-bottom: 0.85rem;}.cm-calc .cm-label{font-size: 0.85rem;font-weight: 600;color: var(--cm-brand);flex: 0 0 auto;}.cm-calc select,.cm-calc input[type=\"number\"]{font: inherit;font-size: 0.9rem;padding: 0.5rem 0.65rem;border-radius: 8px;border: 1px solid var(--cm-field);background: #fff;color: var(--cm-ink);max-width: 220px;width: 100%;margin: 0;min-height: 0;height: auto;}.cm-calc .cm-unit-toggle{display: flex;gap: 0.3rem;}.cm-calc .cm-unit-btn{padding: 0.4rem 0.85rem;font-size: 0.82rem;font-weight: 600;font-family: inherit;line-height: 1.3;border-radius: 8px;border: 1px solid var(--cm-field);background: transparent;color: var(--cm-brand-soft);cursor: pointer;}.cm-calc .cm-unit-btn.is-active{background: var(--cm-tint);border-color: var(--cm-brand);box-shadow: inset 0 0 0 1px var(--cm-brand);color: var(--cm-brand);}.cm-calc .cm-dims{display: grid;grid-template-columns: repeat(auto-fit,minmax(120px,1fr));gap: 0.75rem;margin: 1rem 0 1.25rem;}.cm-calc .cm-dim-label{display: block;font-size: 0.78rem;font-weight: 600;color: var(--cm-brand-soft);margin-bottom: 0.3rem;}.cm-calc .cm-dims input[type=\"number\"],.cm-calc .cm-dim-input{width: 100%;max-width: none;}.cm-calc .cm-visual{display: flex;align-items: center;gap: 1rem;background: var(--cm-bg);border-radius: 10px;padding: 0.9rem 1rem;margin-bottom: 1.1rem;}.cm-calc .cm-svg{width: 76px;height: 76px;flex: 0 0 auto;}.cm-calc .cm-visual-pct{margin: 0;font-size: 1.05rem;font-weight: 700;color: var(--cm-brand);line-height: 1.3;}.cm-calc .cm-visual-legend{margin: 0.3rem 0 0;font-size: 0.75rem;color: var(--cm-brand-soft);}.cm-calc .cm-visual-note{margin: 0.25rem 0 0;font-size: 0.68rem;font-style: italic;color: var(--cm-brand-soft);line-height: 1.4;}.cm-calc .cm-dot{display: inline-block;width: 9px;height: 9px;border-radius: 50%;margin-right: 0.3rem;vertical-align: middle;}.cm-calc .cm-dot-wet{border: 1.5px dashed var(--cm-brand-soft);}.cm-calc .cm-dot-fired{background: var(--cm-brand);}.cm-calc .cm-results{background: var(--cm-brand);color: #fff;border-radius: 10px;padding: 1rem 1.1rem;margin-bottom: 1.1rem;}.cm-calc .cm-results-title{margin: 0 0 0.5rem;font-size: 0.78rem;font-weight: 700;text-transform: uppercase;letter-spacing: 0.06em;opacity: 0.85;}.cm-calc .cm-results-list{margin: 0;padding: 0;list-style: none;display: flex;flex-direction: column;gap: 0.35rem;font-size: 1rem;font-weight: 600;}.cm-calc .cm-results-list li{margin: 0;padding: 0;color: #fff;}.cm-calc .cm-results-list li::before,.cm-calc .cm-results-list li::marker{content: none;}.cm-calc .cm-results-empty{font-size: 0.85rem;font-weight: 400;opacity: 0.75;}.cm-calc .cm-results-note{margin: 0.6rem 0 0;font-size: 0.75rem;font-weight: 400;opacity: 0.8;line-height: 1.4;color: #fff;}.cm-calc a{color: var(--cm-brand);text-decoration: underline;text-underline-offset: 2px;}.cm-calc .cm-results a{color: #fff;}.cm-calc .cm-disclaimer{margin: 0 0 0.6rem;text-align: center;font-size: 0.7rem;line-height: 1.45;color: var(--cm-brand-soft);}.cm-calc .cm-credit{margin: 0;text-align: center;font-size: 0.72rem;color: var(--cm-brand-soft);}.cm-calc .cm-credit a{color: var(--cm-brand);font-weight: 600;text-decoration: none;}.cm-calc .cm-credit a:hover,.cm-calc .cm-credit a:focus-visible{text-decoration: underline;}@media (prefers-reduced-motion: reduce){.cm-calc *{transition: none !important;}}.cm-calc.cm-embed{max-width: none;margin: 0.75rem 0 1.5rem;}.cm-calc .cm-code-box{display: flex;align-items: center;gap: 0.9rem;background: var(--cm-card);border: 1px solid var(--cm-border);border-radius: 10px;padding: 0.9rem 1rem;}.cm-calc pre.cm-code{margin: 0;padding: 0;flex: 1 1 auto;min-width: 0;background: transparent;border: 0;font-family: ui-monospace,\"SF Mono\",Menlo,Consolas,monospace;font-size: 0.78rem;line-height: 1.55;color: var(--cm-ink);white-space: pre-wrap;word-break: normal;overflow-wrap: anywhere;}.cm-calc .cm-copy-btn{flex: 0 0 auto;padding: 0.55rem 1rem;font-family: inherit;font-size: 0.82rem;font-weight: 600;line-height: 1.3;border-radius: 999px;border: 1px solid var(--cm-brand);background: var(--cm-brand);color: #fff;cursor: pointer;transition: background 0.15s ease,color 0.15s ease;}.cm-calc .cm-copy-btn.is-done{background: #fff;color: var(--cm-brand);}.cm-calc .cm-copy-btn:focus-visible{outline: 2px solid var(--cm-brand);outline-offset: 2px;}.cm-calc .cm-hint{margin: -0.6rem 0 1.1rem;font-size: 0.75rem;line-height: 1.45;color: var(--cm-brand-soft);}.cm-calc .cm-sr{position: absolute !important;width: 1px;height: 1px;margin: -1px;padding: 0;overflow: hidden;clip: rect(0 0 0 0);white-space: nowrap;border: 0;}.cm-calc .cm-key{white-space: nowrap;margin-right: 0.6rem;}@media (max-width: 480px){.cm-calc .cm-card{padding: 1.4rem 1.25rem;}.cm-calc .cm-code-box{flex-direction: column;align-items: stretch;}.cm-calc .cm-row{display: grid;grid-template-columns: minmax(0,1fr);gap: 0.35rem;margin-bottom: 1rem;}.cm-calc .cm-row>select,.cm-calc .cm-row>input{max-width: none;}.cm-calc .cm-row>.cm-unit-toggle{justify-self: start;}}";
  var EMBED_FILE = 'ceramind-cone-converter-embed.js';

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


  // Source pages linked from the calculator's own text
  var SRC = {
    orton: 'https://www.theceramicshop.com/downloads/Ortonconecharttemperatures.pdf',
    bartlett: 'https://www.theceramicshop.com/downloads/Genesis_Manual_3-3-16.pdf'
  };

  // Orton self-supporting cones (regular), °F: [cone, at 108°F/hr, at 270°F/hr] over the last 180°F (100°C)
  var CONES = [
    ['022', 1087, 1094], ['021', 1112, 1143], ['020', 1159, 1180], ['019', 1252, 1283], ['018', 1319, 1353],
    ['017', 1360, 1405], ['016', 1422, 1465], ['015', 1456, 1504], ['014', 1485, 1540], ['013', 1539, 1582],
    ['012', 1582, 1620], ['011', 1607, 1641], ['010', 1657, 1679], ['09', 1688, 1706], ['08', 1728, 1753],
    ['07', 1789, 1809], ['06', 1828, 1855], ['05½', 1859, 1877], ['05', 1888, 1911], ['04', 1945, 1971],
    ['03', 1987, 2019], ['02', 2016, 2052], ['01', 2046, 2080], ['1', 2079, 2109], ['2', 2088, 2127],
    ['3', 2106, 2138], ['4', 2124, 2161], ['5', 2167, 2205], ['5½', 2197, 2237], ['6', 2232, 2269],
    ['7', 2262, 2295], ['8', 2280, 2320], ['9', 2300, 2336], ['10', 2345, 2381], ['11', 2361, 2399],
    ['12', 2383, 2419], ['13', 2428, 2458], ['14', 2489, 2523]
  ];
  var RATES = { 60: { col: 1, f: 108 }, 150: { col: 2, f: 270 } };   // °C/hr: column in CONES, the same rate in °F/hr
  var DEFAULT_CONE = '6';
  var ABS_ZERO = { c: -273.15, f: -459.67 };
  var MINUS = '−';

  // Text with source links: parts are strings or { t: text, href: url }. Built from DOM nodes, never innerHTML.
  function link(t, href) { return { t: t, href: href }; }
  function rich(el, parts) {
    el.textContent = '';
    parts.forEach(function (part) {
      if (typeof part === 'string') { el.appendChild(document.createTextNode(part)); return; }
      var a = document.createElement('a');
      a.href = part.href;
      a.target = '_blank';
      a.rel = 'noopener';
      a.textContent = part.t;
      el.appendChild(a);
    });
  }

  var CSS = ''
    + '@media (min-width: 481px) { .cm-calc .cm-row > select, .cm-calc .cm-row > input { max-width: 200px; } }'
    + '.cm-calc .cm-results-list li.cm-li-big:not(.cm-results-empty) { font-size: 1.6rem; line-height: 1.2; font-variant-numeric: tabular-nums; }'
    + '.cm-calc .cm-results-list li.cm-li-sub { font-size: 1.05rem; opacity: 0.9; font-variant-numeric: tabular-nums; }'
    + '.cm-calc .cm-more-btn { display: inline-flex; align-items: center; gap: 0.45rem; margin: 0 0 1rem; padding: 0.35rem 0; background: none; border: 0;'
    + '  font: inherit; font-size: 0.85rem; font-weight: 600; color: var(--cm-brand); cursor: pointer; text-decoration: underline; text-underline-offset: 3px; }'
    + '.cm-calc .cm-more-btn:focus-visible { outline: 2px solid var(--cm-brand); outline-offset: 2px; border-radius: 4px; }'
    + '.cm-calc .cm-more-chev { width: 0.42rem; height: 0.42rem; border-right: 2px solid currentColor; border-bottom: 2px solid currentColor;'
    + '  transform: rotate(-45deg); transition: transform 0.15s ease; }'
    + '.cm-calc .cm-more-btn[aria-expanded="true"] .cm-more-chev { transform: rotate(45deg); }'
    + '.cm-calc .cm-chart { margin: -0.25rem 0 1.1rem; }'
    + '.cm-calc .cm-table-wrap { border: 1px solid var(--cm-border); border-radius: 10px; overflow: hidden; background: #fff; }'
    + '.cm-calc table.cm-table { width: 100%; margin: 0; border: 0; border-collapse: collapse; table-layout: auto; background: none;'
    + '  font-size: 0.8rem; line-height: 1.35; font-variant-numeric: tabular-nums; }'
    + '.cm-calc .cm-table caption { caption-side: top; text-align: left; padding: 0.55rem 0.65rem; font-size: 0.75rem; font-weight: 600;'
    + '  color: var(--cm-brand); background: var(--cm-bg); border-bottom: 1px solid var(--cm-border); }'
    + '.cm-calc .cm-table th, .cm-calc .cm-table td { padding: 0.4rem 0.65rem; border: 0; border-bottom: 1px solid var(--cm-border);'
    + '  background: none; color: var(--cm-ink); text-align: right; vertical-align: baseline; font-weight: 400; white-space: normal; }'
    + '.cm-calc .cm-table th { font-size: 0.75rem; font-weight: 700; color: var(--cm-brand); }'
    + '.cm-calc .cm-table th:first-child, .cm-calc .cm-table td:first-child { text-align: left; }'
    + '.cm-calc .cm-table tbody tr:last-child td { border-bottom: 0; }'
    + '.cm-calc .cm-table tr.is-current td { background: var(--cm-sand); font-weight: 700; }'
    + '.cm-calc .cm-tc, .cm-calc .cm-tf { display: inline-block; white-space: nowrap; }'
    + '.cm-calc .cm-tf { margin-left: 0.15rem; color: var(--cm-brand-soft); }'
    + '.cm-calc .cm-chart-src { margin: 0.5rem 0 0; font-size: 0.72rem; line-height: 1.45; color: var(--cm-brand-soft); }';

  var uid = 0;

  function template(id) {
    function f(name) { return id + '-' + name; }
    return ''
      + '<div class="cm-card">'
      + '  <h3 class="cm-title">Cone &amp; Kiln Temperature Converter</h3>'
      + '  <p class="cm-sub">Look up the temperature for an Orton cone in °C and °F, or convert any temperature between the two.</p>'
      + '  <div class="cm-mode-toggle" role="group" aria-label="What to do">'
      + '    <button type="button" class="cm-mode-btn is-active" data-mode="cone" aria-pressed="true">Cone to temperature</button>'
      + '    <button type="button" class="cm-mode-btn" data-mode="convert" aria-pressed="false">°C ↔ °F</button>'
      + '  </div>'
      + '  <div data-panel="cone">'
      + '    <div class="cm-row">'
      + '      <label class="cm-label" for="' + f('cone') + '">Cone</label>'
      + '      <select id="' + f('cone') + '" data-role="cone"></select>'
      + '    </div>'
      + '    <div class="cm-row">'
      + '      <span class="cm-label" id="' + f('rate-l') + '">Firing rate</span>'
      + '      <div class="cm-unit-toggle" role="group" aria-labelledby="' + f('rate-l') + '">'
      + '        <button type="button" class="cm-unit-btn is-active" data-rate="60" aria-pressed="true">60°C/hr</button>'
      + '        <button type="button" class="cm-unit-btn" data-rate="150" aria-pressed="false">150°C/hr</button>'
      + '      </div>'
      + '    </div>'
      + '    <p class="cm-hint" data-role="rate-hint"></p>'
      + '  </div>'
      + '  <div data-panel="convert" hidden>'
      + '    <div class="cm-row">'
      + '      <label class="cm-label" for="' + f('temp') + '">Temperature</label>'
      + '      <input type="number" id="' + f('temp') + '" data-role="temp" step="any" inputmode="decimal" placeholder="e.g. 1222">'
      + '    </div>'
      + '    <div class="cm-row">'
      + '      <span class="cm-label" id="' + f('unit-l') + '">From</span>'
      + '      <div class="cm-unit-toggle" role="group" aria-labelledby="' + f('unit-l') + '">'
      + '        <button type="button" class="cm-unit-btn is-active" data-unit="c" aria-pressed="true">°C</button>'
      + '        <button type="button" class="cm-unit-btn" data-unit="f" aria-pressed="false">°F</button>'
      + '      </div>'
      + '    </div>'
      + '  </div>'
      + '  <div class="cm-results">'
      + '    <p class="cm-results-title" data-role="r-title"></p>'
      + '    <ul class="cm-results-list"></ul>'
      + '    <p class="cm-results-note" data-role="note"></p>'
      + '  </div>'
      + '  <p class="cm-sr" aria-live="polite" aria-atomic="true" data-role="sr"></p>'
      + '  <button type="button" class="cm-more-btn" data-role="chart-btn" aria-expanded="false" aria-controls="' + f('chart') + '">'
      + '    <span class="cm-more-chev" aria-hidden="true"></span>Full cone chart</button>'
      + '  <div class="cm-chart" id="' + f('chart') + '" data-role="chart" hidden>'
      + '    <div class="cm-table-wrap">'
      + '      <table class="cm-table">'
      + '        <caption>Orton self-supporting cones, by the rate over the last 100°C</caption>'
      + '        <thead><tr><th scope="col">Cone</th><th scope="col">60°C/hr</th><th scope="col">150°C/hr</th></tr></thead>'
      + '        <tbody data-role="rows"></tbody>'
      + '      </table>'
      + '    </div>'
      + '    <p class="cm-chart-src" data-role="chart-src"></p>'
      + '  </div>'
      + '  <p class="cm-disclaimer">Orton\'s chart is a guide: the actual bending temperature depends on how your kiln fires, so check with witness cones. Ceramind Tools can\'t accept responsibility for firings based on these results.</p>'
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

  function fToC(f) { return (f - 32) * 5 / 9; }
  function cToF(c) { return c * 9 / 5 + 32; }
  // A cone's °C, rounded to the nearest degree from Orton's °F
  function coneC(f) { return Math.round(fToC(f)); }
  // Numbers as text: a real minus sign, and at most one decimal place
  function num(v, places) {
    var p = Math.pow(10, places);
    var r = Math.round(v * p) / p;
    if (r === 0) r = 0;   // no "-0"
    return String(r).replace('-', MINUS);
  }

  function initOne(root) {
    if (root.dataset.ceramindInit === 'true') return;
    root.dataset.ceramindInit = 'true';
    root.classList.add('cm-calc');
    uid += 1;
    root.innerHTML = template('cmcc' + uid);

    var mode = 'cone';
    var rate = 60;
    var unit = 'c';
    var srTimer;

    function q(sel) { return root.querySelector(sel); }
    function qa(sel) { return root.querySelectorAll(sel); }
    var cone = q('[data-role="cone"]');
    var temp = q('[data-role="temp"]');
    var title = q('[data-role="r-title"]');
    var list = q('.cm-results-list');
    var note = q('[data-role="note"]');
    var sr = q('[data-role="sr"]');
    var rows = q('[data-role="rows"]');
    var chartBtn = q('[data-role="chart-btn"]');
    var chart = q('[data-role="chart"]');

    rich(q('[data-role="rate-hint"]'), ['How fast your kiln climbs over the last 100°C. Not sure? Keep 60: three of ',
      link('Bartlett\'s four controller presets', SRC.bartlett), ' finish closer to 60 than to 150.']);
    rich(q('[data-role="chart-src"]'), ['From ', link('Orton\'s cone chart', SRC.orton),
      '. Orton gives °F; the °C figures are rounded to the nearest degree.']);

    CONES.forEach(function (row) {
      var o = document.createElement('option');
      o.value = row[0];
      o.textContent = 'Cone ' + row[0];
      cone.appendChild(o);

      var tr = document.createElement('tr');
      tr.setAttribute('data-cone', row[0]);
      var th = document.createElement('td');
      th.textContent = row[0];
      tr.appendChild(th);
      [row[1], row[2]].forEach(function (f) {
        var td = document.createElement('td');
        var c = document.createElement('span');
        c.className = 'cm-tc';
        c.textContent = coneC(f) + '°C';
        var fs = document.createElement('span');
        fs.className = 'cm-tf';
        fs.textContent = f + '°F';
        td.appendChild(c);
        td.appendChild(document.createTextNode(' '));
        td.appendChild(fs);
        tr.appendChild(td);
      });
      rows.appendChild(tr);
    });
    cone.value = DEFAULT_CONE;

    function setPressed(attr, value) {
      qa('[' + attr + ']').forEach(function (b) {
        var on = b.getAttribute(attr) === String(value);
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
    }

    function item(text, cls) {
      var li = document.createElement('li');
      if (cls) li.className = cls;
      li.textContent = text;
      list.appendChild(li);
    }

    function announce(text) {
      clearTimeout(srTimer);
      srTimer = setTimeout(function () { sr.textContent = text; }, 700);
    }

    function coneRow(name) {
      for (var i = 0; i < CONES.length; i++) if (CONES[i][0] === name) return CONES[i];
      return null;
    }

    function renderCone() {
      var row = coneRow(cone.value) || coneRow(DEFAULT_CONE);
      var f = row[RATES[rate].col];
      var c = coneC(f);
      title.textContent = 'Cone ' + row[0] + ' at ' + rate + '°C/hr';
      item(c + '°C', 'cm-li-big');
      item(f + '°F', 'cm-li-sub');
      rich(note, ['From ', link('Orton\'s cone chart', SRC.orton), ', for a self-supporting cone heated at '
        + rate + '°C (' + RATES[rate].f + '°F) an hour over the last 100°C.']);
      announce('Cone ' + row[0] + ' at ' + rate + '°C an hour: ' + c + '°C, ' + f + '°F.');
      qa('tr[data-cone]').forEach(function (tr) { tr.classList.toggle('is-current', tr.getAttribute('data-cone') === row[0]); });
    }

    function renderConvert() {
      var from = unit === 'c' ? '°C' : '°F';
      var to = unit === 'c' ? '°F' : '°C';
      title.textContent = from + ' to ' + to;
      temp.placeholder = unit === 'c' ? 'e.g. 1222' : 'e.g. 2232';
      var problem = '';
      var v = parseFloat(temp.value);
      if (temp.validity && temp.validity.badInput) problem = 'Type the temperature as a plain number, like 1222.';
      else if (temp.value.trim() === '' || isNaN(v)) problem = 'Enter a temperature to convert.';
      else if (v < ABS_ZERO[unit]) problem = 'That\'s below absolute zero (' + num(ABS_ZERO[unit], 2) + from + '). Check the number.';
      if (problem) {
        item(problem, 'cm-results-empty');
        announce(problem);
        return;
      }
      var out = unit === 'c' ? cToF(v) : fToC(v);
      var text = num(v, 2) + from + ' = ' + num(out, 1) + to;
      item(text, 'cm-li-big');
      note.textContent = unit === 'c' ? '°F = °C × 9 ÷ 5 + 32' : '°C = (°F ' + MINUS + ' 32) × 5 ÷ 9';
      announce(text.replace('=', 'is'));
    }

    function render() {
      list.innerHTML = '';
      note.textContent = '';
      qa('[data-panel]').forEach(function (p) { p.hidden = p.getAttribute('data-panel') !== mode; });
      if (mode === 'cone') renderCone();
      else renderConvert();
    }

    qa('[data-mode]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var next = btn.getAttribute('data-mode');
        if (next === mode) return;
        mode = next;
        setPressed('data-mode', mode);
        render();
      });
    });

    qa('[data-rate]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var next = parseInt(btn.getAttribute('data-rate'), 10);
        if (next === rate) return;
        rate = next;
        setPressed('data-rate', rate);
        render();
      });
    });

    qa('[data-unit]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var next = btn.getAttribute('data-unit');
        if (next === unit) return;
        unit = next;   // the number typed stays, read in the other scale
        setPressed('data-unit', unit);
        render();
      });
    });

    cone.addEventListener('change', render);
    temp.addEventListener('input', render);
    temp.addEventListener('change', render);

    chartBtn.addEventListener('click', function () {
      var open = chartBtn.getAttribute('aria-expanded') !== 'true';
      chart.hidden = !open;
      chartBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
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
