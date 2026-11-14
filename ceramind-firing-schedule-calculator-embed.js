/*
 * Ceramind Tools — Firing Schedule Calculator (embeddable version)
 *
 * Paste this wherever the calculator should appear:
 *
 *   <div class="ceramind-firing-schedule-calculator"></div>
 *   <script src="https://cdn.jsdelivr.net/gh/ceramindtools/ceramind-calculators@main/ceramind-firing-schedule-calculator-embed.js" async></script>
 *
 * Built by build.py from src/firing-schedule.js + src/base.css. Edit those, then run build.py.
 *
 * Every number comes from a named source (full quotes: Ceramind Tools/Website/Calculators/Firing Schedule/sources.md).
 * Nothing here is made up: °F figures are converted exactly, °C = (°F - 32) x 5/9.
 * - Heating ramps: Bartlett Instruments, Genesis controller manual (3-3-16), Appendix B "Cone Fire Temperature
 *   Profiles", the four preset speeds, in °F/hr to °F:
 *     Slow (Bisc Hand Thrown)          80 > 250, 200 > 1000, 100 > 1100, 180 > top-250, 80 > top
 *     Med/Slow (Bisc Medium Pieces)   120 > 250, 300 > 1000, 150 > 1100, 225 > top-250, 108 > top
 *     Medium (Glaze Larger Pieces or Bisc Thin)  150 > 250, 400 > top-250, 120 > top
 *     Fast (Glaze Thin Pieces)        570 > top-250, 200 > top
 *   V6-CF manual, Appendix A: "The profiles for other cone numbers are the same; only the end temperatures vary.
 *   The last segment always starts 250°F below the cone temperature."
 *   Bartlett's stage times assume a 70°F (21°C) start, so ours do too. Check: this gives Bartlett's printed totals
 *   (cone 04: 13 h 26, 9 h 38, 6 h 54, 4 h 6; cone 6: 10 h 54, 7 h 37, 4 h 36).
 * - Damp ware: Bartlett preheat, 60°F/hr (33°C/hr) to 200°F (93°C), then held for the preheat time (V6-CF manual).
 *   Genesis manual: none for thin, bone dry ware; 4 h for thicker, slightly wet pieces; 8 h for thick, wet pieces.
 * - Hold at the top, default 10 min: the V6-CF manual's own cone 04 example uses a 10 minute hold; Specialist
 *   Crafts' beginner guide dwells 10 min; Plainsman's C6DHSC holds 10 min. Potclays: end biscuit "with a short soak".
 * - Drop and hold (glaze): Plainsman Clays via Digitalfire (C04PLTP, PLC6DS, C6DHSC): fall 100°F (56°C) at
 *   900°F/hr (500°C/hr) and hold 30 min.
 * - Slow cool (glaze): Digitalfire 04DSDH step 5 and C6DHSC step 5: 150°F/hr (83°C/hr) to 1400°F (760°C), then off.
 * - Cone temperatures: Orton self-supporting cones, the live Ceramind cone converter's two columns (60 and 150°C/hr
 *   over the last 100°C, ceramind-cone-converter-embed.js). Each schedule uses the column nearer its last ramp:
 *   Slow 44, Med/Slow 60 and Medium 67°C/hr use 60°C/hr (cone 6 = 1222°C); Fast 111°C/hr uses 150°C/hr
 *   (cone 6 = 1243°C). A Bartlett controller corrects for this itself; a plain ramp/hold controller needs the
 *   figure shown. Slow ends below 60°C/hr and the table has no slower column, so the note says the cone may bend early.
 * - Fast caveat: Potclays advises glaze firings at 100–130°C/hr, so Fast (317°C/hr from cold) carries a warning.
 * - Lowest top temperature 800°C: Hot Clay gives stoneware bisque as 800–1000°C.
 */
(function () {
  var TARGET_CLASS = 'ceramind-firing-schedule-calculator';
  var BASE_ID = 'ceramind-calc-base-v1';
  var STYLE_ID = 'ceramind-firing-schedule-style';
  var BASE_CSS = ".cm-calc,.cm-calc *{box-sizing: border-box;}.cm-calc{--cm-ink: #171717;--cm-brand: #473728;--cm-brand-soft: #4a4642;--cm-accent: #a4886e;--cm-sand: #d2c1b4;--cm-tint: #ffffff;--cm-bg: #e3e0df;--cm-card: #efedeb;--cm-border: #d9d4d0;--cm-field: #8f857c;font-family: inherit;color: var(--cm-ink);max-width: 480px;margin: 2rem auto;text-align: left;}.cm-calc [hidden]{display: none !important;}.cm-calc .cm-card{background: var(--cm-card);border: 1px solid var(--cm-border);border-radius: 14px;padding: 1.75rem;box-shadow: 0 1px 2px rgba(71,55,40,0.06),0 8px 24px rgba(71,55,40,0.06);}.cm-calc .cm-title{margin: 0 0 0.35rem;font-size: 1.35rem;font-weight: 700;color: var(--cm-brand);line-height: 1.2;}.cm-calc .cm-sub{margin: 0 0 1.25rem;font-size: 0.9rem;color: var(--cm-brand-soft);line-height: 1.45;}.cm-calc .cm-mode-toggle{display: flex;gap: 0.4rem;margin-bottom: 1.1rem;flex-wrap: wrap;}.cm-calc .cm-mode-btn{flex: 1 1 auto;min-width: 140px;padding: 0.55rem 0.7rem;font-size: 0.82rem;font-weight: 600;font-family: inherit;line-height: 1.3;border-radius: 999px;border: 1px solid var(--cm-field);background: transparent;color: var(--cm-brand-soft);cursor: pointer;transition: background 0.15s ease,color 0.15s ease,border-color 0.15s ease;}.cm-calc .cm-mode-btn.is-active{background: var(--cm-brand);border-color: var(--cm-brand);color: #fff;}.cm-calc a:focus-visible,.cm-calc .cm-mode-btn:focus-visible,.cm-calc .cm-unit-btn:focus-visible,.cm-calc select:focus-visible,.cm-calc input:focus-visible{outline: 2px solid var(--cm-brand);outline-offset: 2px;}.cm-calc .cm-row{display: flex;align-items: center;justify-content: space-between;gap: 1rem;margin-bottom: 0.85rem;}.cm-calc .cm-label{font-size: 0.85rem;font-weight: 600;color: var(--cm-brand);flex: 0 0 auto;}.cm-calc select,.cm-calc input[type=\"number\"]{font: inherit;font-size: 0.9rem;padding: 0.5rem 0.65rem;border-radius: 8px;border: 1px solid var(--cm-field);background: #fff;color: var(--cm-ink);max-width: 220px;width: 100%;margin: 0;min-height: 0;height: auto;}.cm-calc .cm-unit-toggle{display: flex;gap: 0.3rem;}.cm-calc .cm-unit-btn{padding: 0.4rem 0.85rem;font-size: 0.82rem;font-weight: 600;font-family: inherit;line-height: 1.3;border-radius: 8px;border: 1px solid var(--cm-field);background: transparent;color: var(--cm-brand-soft);cursor: pointer;}.cm-calc .cm-unit-btn.is-active{background: var(--cm-tint);border-color: var(--cm-brand);box-shadow: inset 0 0 0 1px var(--cm-brand);color: var(--cm-brand);}.cm-calc .cm-dims{display: grid;grid-template-columns: repeat(auto-fit,minmax(120px,1fr));gap: 0.75rem;margin: 1rem 0 1.25rem;}.cm-calc .cm-dim-label{display: block;font-size: 0.78rem;font-weight: 600;color: var(--cm-brand-soft);margin-bottom: 0.3rem;}.cm-calc .cm-dims input[type=\"number\"],.cm-calc .cm-dim-input{width: 100%;max-width: none;}.cm-calc .cm-visual{display: flex;align-items: center;gap: 1rem;background: var(--cm-bg);border-radius: 10px;padding: 0.9rem 1rem;margin-bottom: 1.1rem;}.cm-calc .cm-svg{width: 76px;height: 76px;flex: 0 0 auto;}.cm-calc .cm-visual-pct{margin: 0;font-size: 1.05rem;font-weight: 700;color: var(--cm-brand);line-height: 1.3;}.cm-calc .cm-visual-legend{margin: 0.3rem 0 0;font-size: 0.75rem;color: var(--cm-brand-soft);}.cm-calc .cm-visual-note{margin: 0.25rem 0 0;font-size: 0.68rem;font-style: italic;color: var(--cm-brand-soft);line-height: 1.4;}.cm-calc .cm-dot{display: inline-block;width: 9px;height: 9px;border-radius: 50%;margin-right: 0.3rem;vertical-align: middle;}.cm-calc .cm-dot-wet{border: 1.5px dashed var(--cm-brand-soft);}.cm-calc .cm-dot-fired{background: var(--cm-brand);}.cm-calc .cm-results{background: var(--cm-brand);color: #fff;border-radius: 10px;padding: 1rem 1.1rem;margin-bottom: 1.1rem;}.cm-calc .cm-results-title{margin: 0 0 0.5rem;font-size: 0.78rem;font-weight: 700;text-transform: uppercase;letter-spacing: 0.06em;opacity: 0.85;}.cm-calc .cm-results-list{margin: 0;padding: 0;list-style: none;display: flex;flex-direction: column;gap: 0.35rem;font-size: 1rem;font-weight: 600;}.cm-calc .cm-results-list li{margin: 0;padding: 0;color: #fff;}.cm-calc .cm-results-list li::before,.cm-calc .cm-results-list li::marker{content: none;}.cm-calc .cm-results-empty{font-size: 0.85rem;font-weight: 400;opacity: 0.75;}.cm-calc .cm-results-note{margin: 0.6rem 0 0;font-size: 0.75rem;font-weight: 400;opacity: 0.8;line-height: 1.4;color: #fff;}.cm-calc a{color: var(--cm-brand);text-decoration: underline;text-underline-offset: 2px;}.cm-calc .cm-results a{color: #fff;}.cm-calc .cm-disclaimer{margin: 0 0 0.6rem;text-align: center;font-size: 0.7rem;line-height: 1.45;color: var(--cm-brand-soft);}.cm-calc .cm-credit{margin: 0;text-align: center;font-size: 0.72rem;color: var(--cm-brand-soft);}.cm-calc .cm-credit a{color: var(--cm-brand);font-weight: 600;text-decoration: none;}.cm-calc .cm-credit a:hover,.cm-calc .cm-credit a:focus-visible{text-decoration: underline;}@media (prefers-reduced-motion: reduce){.cm-calc *{transition: none !important;}}.cm-calc.cm-embed{max-width: none;margin: 0.75rem 0 1.5rem;}.cm-calc .cm-code-box{display: flex;align-items: center;gap: 0.9rem;background: var(--cm-card);border: 1px solid var(--cm-border);border-radius: 10px;padding: 0.9rem 1rem;}.cm-calc pre.cm-code{margin: 0;padding: 0;flex: 1 1 auto;min-width: 0;background: transparent;border: 0;font-family: ui-monospace,\"SF Mono\",Menlo,Consolas,monospace;font-size: 0.78rem;line-height: 1.55;color: var(--cm-ink);white-space: pre-wrap;word-break: normal;overflow-wrap: anywhere;}.cm-calc .cm-copy-btn{flex: 0 0 auto;padding: 0.55rem 1rem;font-family: inherit;font-size: 0.82rem;font-weight: 600;line-height: 1.3;border-radius: 999px;border: 1px solid var(--cm-brand);background: var(--cm-brand);color: #fff;cursor: pointer;transition: background 0.15s ease,color 0.15s ease;}.cm-calc .cm-copy-btn.is-done{background: #fff;color: var(--cm-brand);}.cm-calc .cm-copy-btn:focus-visible{outline: 2px solid var(--cm-brand);outline-offset: 2px;}.cm-calc .cm-hint{margin: -0.6rem 0 1.1rem;font-size: 0.75rem;line-height: 1.45;color: var(--cm-brand-soft);}.cm-calc .cm-sr{position: absolute !important;width: 1px;height: 1px;margin: -1px;padding: 0;overflow: hidden;clip: rect(0 0 0 0);white-space: nowrap;border: 0;}.cm-calc .cm-key{white-space: nowrap;margin-right: 0.6rem;}@media (max-width: 480px){.cm-calc .cm-card{padding: 1.4rem 1.25rem;}.cm-calc .cm-code-box{flex-direction: column;align-items: stretch;}.cm-calc .cm-row{display: grid;grid-template-columns: minmax(0,1fr);gap: 0.35rem;margin-bottom: 1rem;}.cm-calc .cm-row>select,.cm-calc .cm-row>input{max-width: none;}.cm-calc .cm-row>.cm-unit-toggle{justify-self: start;}}";
  var EMBED_FILE = 'ceramind-firing-schedule-calculator-embed.js';

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


  var START_F = 70;            // Bartlett's tables start from a 70°F (21°C) kiln
  var MIN_C = 800;             // Hot Clay: stoneware bisque from 800°C
  var MAX_C = 1350;            // top of the Ceramind cone converter's gauge
  var DEFAULT_HOLD = 10;       // minutes at the top
  var KILN_COST_URL = 'https://www.ceramindtools.com/pages/kiln-cost-calculator';
  // Source pages linked from the calculator's own text (all opened and checked, see sources.md)
  var SRC = {
    bartlett: 'https://www.theceramicshop.com/downloads/Genesis_Manual_3-3-16.pdf',
    orton: 'https://www.theceramicshop.com/downloads/Ortonconecharttemperatures.pdf',
    potclays: 'https://www.potclays.co.uk/clay-questions/what-is-the-optimum-firing-rate-to-use/',
    c04pltp: 'https://digitalfire.com/schedule/c04pltp',
    plc6ds: 'https://digitalfire.com/schedule/plc6ds',
    c6dhsc: 'https://digitalfire.com/schedule/c6dhsc',
    dsdh04: 'https://digitalfire.com/schedule/04dsdh'
  };

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
  // Sentences (each a string or an array of parts) joined with spaces
  function sentences(list) {
    var out = [];
    list.forEach(function (snt, i) {
      if (i) out.push(' ');
      out = out.concat(typeof snt === 'string' ? [snt] : snt);
    });
    return out;
  }

  // Bartlett Genesis cone-fire speeds: [rate °F/hr, target °F]. A target of 0 or less is relative to the top.
  var SPEEDS = {
    slow: { name: 'Slow', segs: [[80, 250], [200, 1000], [100, 1100], [180, -250], [80, 0]] },
    medslow: { name: 'Med/Slow', segs: [[120, 250], [300, 1000], [150, 1100], [225, -250], [108, 0]] },
    medium: { name: 'Medium', segs: [[150, 250], [400, -250], [120, 0]] },
    fast: { name: 'Fast', segs: [[570, -250], [200, 0]] }
  };
  var PREHEAT = { rate: 60, to: 200, hours: { thin: 4, normal: 4, thick: 8 } };
  var DROP = { rate: 900, by: 100, hold: 30 };
  var SLOW_COOL = { rate: 150, to: 1400 };

  // Orton self-supporting cones, °C: [heated at 60°C/hr, at 150°C/hr] over the last 100°C (Ceramind cone converter data)
  var CONE_C = {
    '010': [903, 915], '09': [920, 930], '08': [942, 956], '07': [976, 987], '06': [998, 1013], '05': [1031, 1044],
    '04': [1063, 1077], '03': [1086, 1104], '02': [1102, 1122], '01': [1119, 1138], '1': [1137, 1154],
    '4': [1162, 1183], '5': [1186, 1207], '5½': [1203, 1225], '6': [1222, 1243], '7': [1239, 1257],
    '8': [1249, 1271], '9': [1260, 1280], '10': [1285, 1305], '11': [1294, 1315]
  };
  var CONE_RATES = [60, 150];   // °C/hr for the two columns above

  // The last ramp of a speed, in °F/hr, and which cone column (0 = 60°C/hr, 1 = 150°C/hr) is nearer to it
  function lastRateF(speedKey) { var segs = SPEEDS[speedKey].segs; return segs[segs.length - 1][0]; }
  function coneCol(speedKey) {
    var r = lastRateF(speedKey) * 5 / 9;
    return Math.abs(r - CONE_RATES[0]) <= Math.abs(r - CONE_RATES[1]) ? 0 : 1;
  }

  var FIRINGS = {
    bisque: {
      name: 'bisque', glaze: false, def: '06',
      cones: ['010', '09', '08', '07', '06', '05', '04', '03', '02', '01', '1'],
      speed: { thin: 'medium', normal: 'medslow', thick: 'slow' }
    },
    earthenware: {
      name: 'earthenware glaze', glaze: true, def: '04',
      cones: ['06', '05', '04', '03', '02', '01', '1'],
      speed: { thin: 'fast', normal: 'medium', thick: 'medium' }
    },
    midfire: {
      name: 'mid-fire glaze', glaze: true, def: '6',
      cones: ['4', '5', '5½', '6', '7'],
      speed: { thin: 'fast', normal: 'medium', thick: 'medium' }
    },
    highfire: {
      name: 'high-fire glaze', glaze: true, def: '10',
      cones: ['8', '9', '10', '11'],
      speed: { thin: 'fast', normal: 'medium', thick: 'medium' }
    }
  };

  // What Bartlett says each speed is for, by firing kind
  var SPEED_USE = {
    slow: 'for bisque of thicker, hand-thrown ware',
    medslow: 'for bisque of medium pieces',
    medium: { bisque: 'for bisque of very thin ware', glaze: 'for glaze on thicker ware' },
    fast: 'for glaze firings on thin ware'
  };

  var CSS = ''
    + '.cm-calc input[type="time"] { font: inherit; font-size: 0.9rem; padding: 0.5rem 0.65rem; border-radius: 8px;'
    + '  border: 1px solid var(--cm-field); background: #fff; color: var(--cm-ink); width: 100%; max-width: none; margin: 0; min-height: 0; height: auto; }'
    + '.cm-calc .cm-visual.cm-visual-graph { display: block; padding: 0.6rem 0.7rem 0.35rem; }'
    + '.cm-calc .cm-graph { display: block; width: 100%; height: auto; }'
    + '.cm-calc .cm-graph-grid { stroke: var(--cm-sand); stroke-width: 1; }'
    + '.cm-calc .cm-graph-axis { stroke: var(--cm-field); stroke-width: 1; }'
    + '.cm-calc .cm-graph-fill { fill: var(--cm-sand); opacity: 0.55; }'
    + '.cm-calc .cm-graph-line { fill: none; stroke: var(--cm-brand); stroke-width: 2.25; stroke-linejoin: round; stroke-linecap: round; }'
    + '.cm-calc .cm-graph-t { font-size: 11px; fill: var(--cm-brand-soft); font-family: inherit; }'
    + '.cm-calc .cm-graph-peak { font-size: 12px; font-weight: 700; fill: var(--cm-brand); font-family: inherit; }'
    + '@media (min-width: 481px) { .cm-calc .cm-row > select, .cm-calc .cm-row > input { max-width: 250px; } }'
    + '.cm-calc .cm-steps { margin: 0 0 0.7rem; padding: 0; list-style: none; display: flex; flex-direction: column; gap: 0.4rem; }'
    + '.cm-calc .cm-steps li { display: flex; align-items: baseline; gap: 0.55rem; margin: 0; padding: 0; color: #fff;'
    + '  font-size: 0.92rem; font-weight: 600; line-height: 1.35; font-variant-numeric: tabular-nums; }'
    + '.cm-calc .cm-steps li::before, .cm-calc .cm-steps li::marker { content: none; }'
    + '.cm-calc .cm-step-n { flex: 0 0 auto; min-width: 1.35rem; padding: 0.05rem 0.3rem; border-radius: 6px; text-align: center;'
    + '  background: rgba(255,255,255,0.16); font-size: 0.75rem; font-weight: 700; }'
    + '.cm-calc .cm-step-tag { font-weight: 400; opacity: 0.85; white-space: nowrap; }'
    + '.cm-calc .cm-steps:not(:empty) ~ .cm-results-list { border-top: 1px solid rgba(255,255,255,0.28); padding-top: 0.6rem; }'
    + '.cm-calc .cm-results-caution { margin: 0 0 0.7rem; padding: 0.5rem 0.65rem; border-radius: 8px; background: rgba(255,255,255,0.13);'
    + '  color: #fff; font-size: 0.8rem; font-weight: 600; line-height: 1.4; }'
    + '.cm-calc .cm-tips { margin: 0 0 0.9rem; padding: 0 0 0 1.1rem; font-size: 0.75rem; line-height: 1.45; color: var(--cm-brand-soft); }'
    + '.cm-calc .cm-tips li { margin: 0 0 0.25rem; padding: 0; }'
    + '.cm-calc .cm-cost { margin: 0 0 1rem; }'
    + '.cm-calc .cm-cost a { color: var(--cm-brand); font-weight: 600; }'
    + '@media (max-width: 480px) { .cm-calc .cm-steps li { font-size: 0.88rem; } }';

  var uid = 0;

  function template(id) {
    function f(name) { return id + '-' + name; }
    return ''
      + '<div class="cm-card">'
      + '  <h3 class="cm-title">Firing Schedule Calculator</h3>'
      + '  <p class="cm-sub">Pick your firing and get a typical starting schedule in °C: each ramp and hold, the total firing time and when it ends.</p>'
      + '  <div class="cm-row">'
      + '    <label class="cm-label" for="' + f('firing') + '">Firing</label>'
      + '    <select id="' + f('firing') + '" data-role="firing">'
      + '      <option value="bisque" selected>Bisque (biscuit)</option>'
      + '      <option value="earthenware">Earthenware glaze</option>'
      + '      <option value="midfire">Mid-fire glaze · cone 5–6</option>'
      + '      <option value="highfire">High-fire glaze · cone 9–10</option>'
      + '    </select>'
      + '  </div>'
      + '  <div class="cm-row">'
      + '    <label class="cm-label" for="' + f('cone') + '">Cone</label>'
      + '    <select id="' + f('cone') + '" data-role="cone"></select>'
      + '  </div>'
      + '  <div class="cm-row">'
      + '    <label class="cm-label" for="' + f('top') + '" data-role="top-label">Top temperature (°C)</label>'
      + '    <input type="number" id="' + f('top') + '" data-role="top" min="0" step="1" inputmode="decimal">'
      + '  </div>'
      + '  <div class="cm-row">'
      + '    <span class="cm-label" id="' + f('unit-l') + '">Units</span>'
      + '    <div class="cm-unit-toggle" role="group" aria-labelledby="' + f('unit-l') + '">'
      + '      <button type="button" class="cm-unit-btn is-active" data-unit="c" aria-pressed="true">°C</button>'
      + '      <button type="button" class="cm-unit-btn" data-unit="f" aria-pressed="false">°F</button>'
      + '    </div>'
      + '  </div>'
      + '  <div class="cm-row">'
      + '    <span class="cm-label" id="' + f('thick-l') + '">Wall thickness</span>'
      + '    <div class="cm-unit-toggle" role="group" aria-labelledby="' + f('thick-l') + '">'
      + '      <button type="button" class="cm-unit-btn" data-thick="thin" aria-pressed="false">Thin</button>'
      + '      <button type="button" class="cm-unit-btn is-active" data-thick="normal" aria-pressed="true">Normal</button>'
      + '      <button type="button" class="cm-unit-btn" data-thick="thick" aria-pressed="false">Thick</button>'
      + '    </div>'
      + '  </div>'
      + '  <div class="cm-row">'
      + '    <span class="cm-label" id="' + f('dry-l') + '">Ware</span>'
      + '    <div class="cm-unit-toggle" role="group" aria-labelledby="' + f('dry-l') + '">'
      + '      <button type="button" class="cm-unit-btn is-active" data-dry="dry" aria-pressed="true">Bone dry</button>'
      + '      <button type="button" class="cm-unit-btn" data-dry="damp" aria-pressed="false">Still damp</button>'
      + '    </div>'
      + '  </div>'
      + '  <div class="cm-row" data-glaze hidden>'
      + '    <label class="cm-label" for="' + f('cool') + '">Cooling</label>'
      + '    <select id="' + f('cool') + '" data-role="cool">'
      + '      <option value="off" selected>Switch off at the top</option>'
      + '      <option value="drop">Drop and hold</option>'
      + '      <option value="slow">Drop, hold and slow cool</option>'
      + '    </select>'
      + '  </div>'
      + '  <p class="cm-hint" data-glaze hidden>A drop and hold helps heal pinholes and blisters. A slow cool changes how some glazes finish, so test it on a few pieces first.</p>'
      + '  <div class="cm-dims">'
      + '    <div class="cm-dim">'
      + '      <label class="cm-dim-label" for="' + f('hold') + '">Hold at the top (min)</label>'
      + '      <input type="number" class="cm-dim-input" id="' + f('hold') + '" data-role="hold" min="0" step="1" value="' + DEFAULT_HOLD + '" inputmode="decimal">'
      + '    </div>'
      + '    <div class="cm-dim">'
      + '      <label class="cm-dim-label" for="' + f('start') + '">Start time (optional)</label>'
      + '      <input type="time" class="cm-dim-input" id="' + f('start') + '" data-role="start">'
      + '    </div>'
      + '  </div>'
      + '  <p class="cm-hint" data-role="ware-hint"></p>'
      + '  <div class="cm-visual cm-visual-graph" data-role="graph-box">'
      + '    <svg viewBox="0 0 320 132" class="cm-graph" aria-hidden="true" focusable="false">'
      + '      <line class="cm-graph-grid" data-role="g-grid1" x1="44" x2="314"></line>'
      + '      <line class="cm-graph-grid" data-role="g-grid2" x1="44" x2="314"></line>'
      + '      <text class="cm-graph-t" data-role="g-lab1" x="40" text-anchor="end" dominant-baseline="middle"></text>'
      + '      <text class="cm-graph-t" data-role="g-lab2" x="40" text-anchor="end" dominant-baseline="middle"></text>'
      + '      <path class="cm-graph-fill" data-role="g-fill" d=""></path>'
      + '      <line class="cm-graph-axis" data-role="g-axis" x1="44" y1="112" x2="314" y2="112"></line>'
      + '      <polyline class="cm-graph-line" data-role="g-line" points=""></polyline>'
      + '      <text class="cm-graph-peak" data-role="g-peak" text-anchor="middle"></text>'
      + '      <text class="cm-graph-t" x="44" y="127">0 h</text>'
      + '      <text class="cm-graph-t" data-role="g-end" x="314" y="127" text-anchor="end"></text>'
      + '    </svg>'
      + '  </div>'
      + '  <div class="cm-results">'
      + '    <p class="cm-results-title">Your starting schedule</p>'
      + '    <ol class="cm-steps" data-role="steps"></ol>'
      + '    <p class="cm-results-caution" data-role="caution" hidden></p>'
      + '    <ul class="cm-results-list"></ul>'
      + '    <p class="cm-results-note" data-role="note"></p>'
      + '  </div>'
      + '  <p class="cm-sr" aria-live="polite" aria-atomic="true" data-role="sr"></p>'
      + '  <ul class="cm-tips">'
      + '    <li>Your clay or glaze maker\'s schedule comes first. Use this where they don\'t give one.</li>'
      + '    <li>Leave the bung out (or the vent on) until about <span data-role="bung">600°C</span>, so steam and burn-off gases can escape.</li>'
      + '    <li>Fire a self-supporting witness cone where you can see it, and adjust the top temperature to match how it bends.</li>'
      + '  </ul>'
      + '  <p class="cm-hint cm-cost" data-role="cost"></p>'
      + '  <p class="cm-disclaimer">These are typical starting schedules from published sources, not a guarantee. The wrong schedule can crack, bloat or blister ware, so your clay and glaze maker\'s own schedule always comes first. Ceramind Tools can\'t accept responsibility for firings based on these results.</p>'
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

  function cToF(c) { return c * 9 / 5 + 32; }
  function fToC(f) { return (f - 32) * 5 / 9; }

  // Build the schedule in °F (the units Bartlett and Digitalfire publish), then time every step.
  function buildSchedule(firingKey, topC, thick, damp, holdMin, cool) {
    var firing = FIRINGS[firingKey];
    var top = cToF(topC);
    var speedKey = firing.speed[thick];
    var steps = [];
    var notes = [];
    if (damp) steps.push({ rate: PREHEAT.rate, to: PREHEAT.to, hold: PREHEAT.hours[thick] * 60, kind: 'dry' });
    SPEEDS[speedKey].segs.forEach(function (s) {
      steps.push({ rate: s[0], to: s[1] > 0 ? s[1] : top + s[1], hold: 0, kind: 'heat' });
    });
    steps[steps.length - 1].hold = holdMin;
    steps[steps.length - 1].kind = 'top';
    if (firing.glaze && cool !== 'off') {
      steps.push({ rate: DROP.rate, to: top - DROP.by, hold: DROP.hold, kind: 'drop' });
      if (cool === 'slow') {
        if (top - DROP.by > SLOW_COOL.to) steps.push({ rate: SLOW_COOL.rate, to: SLOW_COOL.to, hold: 0, kind: 'cool' });
        else notes.push('No slow cool: it ends at 760°C, too close to this top temperature.');
      }
    }
    var cur = START_F, total = 0, heat = 0, pts = [[0, START_F]];
    steps.forEach(function (s) {
      var h = Math.abs(s.to - cur) / s.rate;
      total += h;
      if (s.to >= cur) heat += h;
      pts.push([total, s.to]);
      if (s.hold) {
        total += s.hold / 60;
        heat += s.hold / 60;
        pts.push([total, s.to]);
      }
      cur = s.to;
    });
    return { steps: steps, speed: speedKey, totalMin: Math.round(total * 60), heatMin: Math.round(heat * 60), hours: total, pts: pts, notes: notes };
  }

  function initOne(root) {
    if (root.dataset.ceramindInit === 'true') return;
    root.dataset.ceramindInit = 'true';
    root.classList.add('cm-calc');
    uid += 1;
    root.innerHTML = template('cmfs' + uid);

    var unit = 'c';
    var thick = 'normal';
    var dry = 'dry';
    var lastSet = null;   // the top value we wrote on a unit toggle, with its exact °C, so toggling never drifts
    var srTimer;

    function q(sel) { return root.querySelector(sel); }
    function qa(sel) { return root.querySelectorAll(sel); }
    var firing = q('[data-role="firing"]');
    var cone = q('[data-role="cone"]');
    var top = q('[data-role="top"]');
    var topLabel = q('[data-role="top-label"]');
    var cool = q('[data-role="cool"]');
    var hold = q('[data-role="hold"]');
    var start = q('[data-role="start"]');
    var stepsEl = q('[data-role="steps"]');
    var list = q('.cm-results-list');
    var note = q('[data-role="note"]');
    var sr = q('[data-role="sr"]');
    var cost = q('[data-role="cost"]');
    var graphBox = q('[data-role="graph-box"]');
    var bung = q('[data-role="bung"]');
    var caution = q('[data-role="caution"]');
    var wareHint = q('[data-role="ware-hint"]');

    function speedNow() { return FIRINGS[firing.value].speed[thick]; }
    // A cone's top temperature for the schedule on screen: the Orton column nearer its last ramp
    function coneC(name) { return CONE_C[name][coneCol(speedNow())]; }
    function perHourF(rF) { return (unit === 'c' ? Math.round(rF * 5 / 9) + '°C' : Math.round(rF) + '°F') + ' an hour'; }
    var lastSchedule = null;

    function sym() { return unit === 'c' ? '°C' : '°F'; }
    function inUnit(c) { return unit === 'c' ? c : cToF(c); }
    function tempText(f) { return (unit === 'c' ? Math.round(fToC(f)) : Math.round(f)) + sym(); }
    function rateText(rF) { return (unit === 'c' ? Math.round(rF * 5 / 9) : rF) + sym() + '/hr'; }
    function cText(c) { return Math.round(inUnit(c)) + sym(); }

    // Non-breaking spaces keep "8 h" and "10 min" together when a step wraps on a phone.
    var NB = '\u00a0';
    function minText(min) {
      var m = Math.round(min * 10) / 10;
      return (m % 1 ? m.toFixed(1) : String(m)) + NB + 'min';
    }
    function durText(min) {
      if (min % 1) return minText(min);
      var h = Math.floor(min / 60), m = min % 60;
      if (!h) return m + NB + 'min';
      return h + NB + 'h' + (m ? ' ' + m + NB + 'min' : '');
    }
    function clock(mins) {
      var t = ((mins % 1440) + 1440) % 1440;
      var h = Math.floor(t / 60), m = t % 60;
      return (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m;
    }
    function dayText(d) {
      if (d === 0) return 'the same day';
      if (d === 1) return 'the next day';
      if (d === 2) return 'two days later';
      return d + ' days later';
    }

    function setPressed(btns, attr, value) {
      btns.forEach(function (b) {
        var on = b.getAttribute(attr) === value;
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
    }

    function fillCones(selected) {
      var fr = FIRINGS[firing.value];
      cone.innerHTML = '';
      fr.cones.forEach(function (name) {
        var o = document.createElement('option');
        o.value = name;
        o.textContent = 'Cone ' + name + ' · ' + cText(coneC(name));
        cone.appendChild(o);
      });
      var own = document.createElement('option');
      own.value = 'own';
      own.textContent = 'My own temperature';
      cone.appendChild(own);
      cone.value = selected && (selected === 'own' || fr.cones.indexOf(selected) >= 0) ? selected : 'own';
    }

    function setTopFromCone() {
      if (cone.value === 'own') return;
      top.value = Math.round(inUnit(coneC(cone.value)));
      lastSet = null;
    }

    // Which cone (if any) the typed number is, in the units on screen
    function coneFor(v) {
      var cones = FIRINGS[firing.value].cones;
      for (var i = 0; i < cones.length; i++) {
        if (Math.round(inUnit(coneC(cones[i]))) === v) return cones[i];
      }
      return null;
    }

    function line(text, cls) {
      var li = document.createElement('li');
      if (cls) li.className = cls;
      li.textContent = text;
      list.appendChild(li);
    }

    function step(n, text, tag) {
      var li = document.createElement('li');
      var num = document.createElement('span');
      num.className = 'cm-step-n';
      num.textContent = n;
      var body = document.createElement('span');
      body.textContent = text;
      if (tag) {
        var t = document.createElement('span');
        t.className = 'cm-step-tag';
        t.textContent = ' (' + tag + ')';
        body.appendChild(t);
      }
      li.appendChild(num);
      li.appendChild(body);
      stepsEl.appendChild(li);
    }

    function announce(text) {
      clearTimeout(srTimer);
      srTimer = setTimeout(function () { sr.textContent = text; }, 700);
    }

    function setCost(heatMin, slow) {
      cost.innerHTML = '';
      var a = document.createElement('a');
      a.href = KILN_COST_URL;
      a.target = '_blank';
      a.rel = 'noopener';
      a.textContent = 'Kiln Firing Cost Calculator';
      if (heatMin == null) {
        cost.appendChild(document.createTextNode('What will a firing cost? Our '));
        cost.appendChild(a);
        cost.appendChild(document.createTextNode(' works it out.'));
        return;
      }
      cost.appendChild(document.createTextNode('What will it cost? Put ' + durText(heatMin) + ' of heating and holds into our '));
      cost.appendChild(a);
      cost.appendChild(document.createTextNode(slow ? ' (the slow cool adds a little on top).' : '.'));
    }

    function drawGraph(s) {
      // One SVG unit = one CSS pixel at any width, so the labels stay readable on a phone.
      var svg = graphBox.querySelector('svg');
      var W = Math.max(220, Math.round(svg.getBoundingClientRect().width) || 320);
      svg.setAttribute('viewBox', '0 0 ' + W + ' 132');
      var X0 = 44, X1 = W - 6, Y0 = 112, YT = 16, MAXC = 1350;
      q('[data-role="g-axis"]').setAttribute('x2', X1);
      q('[data-role="g-grid1"]').setAttribute('x2', X1);
      q('[data-role="g-grid2"]').setAttribute('x2', X1);
      q('[data-role="g-end"]').setAttribute('x', X1);
      function x(h) { return X0 + (X1 - X0) * (s.hours ? h / s.hours : 0); }
      function y(f) { return Y0 - (Y0 - YT) * Math.max(0, fToC(f)) / MAXC; }
      var pts = s.pts.map(function (p) { return x(p[0]).toFixed(1) + ',' + y(p[1]).toFixed(1); });
      q('[data-role="g-line"]').setAttribute('points', pts.join(' '));
      q('[data-role="g-fill"]').setAttribute('d', 'M' + X0 + ',' + Y0 + ' L' + pts.join(' L') + ' L' + x(s.hours).toFixed(1) + ',' + Y0 + ' Z');
      var grid = unit === 'c' ? [500, 1000] : [1000, 2000];
      grid.forEach(function (g, i) {
        var gy = y(unit === 'c' ? cToF(g) : g).toFixed(1);
        var ln = q('[data-role="g-grid' + (i + 1) + '"]');
        ln.setAttribute('y1', gy);
        ln.setAttribute('y2', gy);
        var lab = q('[data-role="g-lab' + (i + 1) + '"]');
        lab.setAttribute('y', gy);
        lab.textContent = g + sym();
      });
      var peakF = 0, peakH = 0;
      s.pts.forEach(function (p) { if (p[1] > peakF) { peakF = p[1]; peakH = p[0]; } });
      var peak = q('[data-role="g-peak"]');
      peak.setAttribute('x', Math.min(X1 - 26, Math.max(X0 + 26, x(peakH))).toFixed(1));
      peak.setAttribute('y', (y(peakF) - 5).toFixed(1));
      peak.textContent = tempText(peakF);
      q('[data-role="g-end"]').textContent = durText(s.totalMin);
    }

    function readHold(notes) {
      if (hold.value.trim() === '') return 0;
      var h = parseFloat(hold.value);
      if (isNaN(h)) return 0;
      if (h < 0) { notes.push('A hold can\'t be negative, so no hold is used.'); return 0; }
      if (h > 0 && h < 5 && h % 1) notes.push('Holds are in minutes, so ' + hold.value + ' means ' + minText(h) + '. For half an hour, type 30.');
      return h;
    }

    function render() {
      var fr = FIRINGS[firing.value];
      qa('[data-glaze]').forEach(function (el) { el.hidden = !fr.glaze; });
      topLabel.textContent = 'Top temperature (' + sym() + ')';
      bung.textContent = cText(600);
      rich(wareHint, fr.glaze
        ? [link('Bartlett', SRC.bartlett), ' has two glaze speeds: Fast for thin ware and Medium for anything thicker. Still damp adds a drying hold first.']
        : ['Not sure? Pick the thicker or damper option. The slower schedule gives water and burn-off more time.']);
      top.placeholder = unit === 'c' ? 'e.g. 1000' : 'e.g. 1832';

      var notes = [];
      stepsEl.innerHTML = '';
      list.innerHTML = '';
      note.textContent = '';
      caution.hidden = true;

      var raw = parseFloat(top.value);
      var topC = NaN, coneName = null;
      if (!isNaN(raw) && raw > 0) {
        if (lastSet && top.value === lastSet.text) {
          topC = lastSet.c;
          coneName = cone.value !== 'own' ? cone.value : null;
        } else {
          coneName = coneFor(raw);
          topC = coneName ? coneC(coneName) : (unit === 'c' ? raw : fToC(raw));
          if (!coneName && unit === 'c' && raw > MAX_C && fToC(raw) >= MIN_C && fToC(raw) <= MAX_C) {
            topC = fToC(raw);
            notes.push('Read ' + top.value + ' as °F: ' + Math.round(topC) + '°C.');
          } else if (!coneName && unit === 'f' && raw >= MIN_C && raw <= MAX_C) {
            topC = raw;
            notes.push('Read ' + top.value + ' as °C: ' + Math.round(cToF(raw)) + '°F.');
          }
        }
      }

      var problem = '';
      if (isNaN(topC)) problem = 'Enter your top temperature.';
      else if (topC < MIN_C - 0.5) problem = 'Enter a top temperature of ' + cText(MIN_C) + ' or more. A bisque usually goes to about ' + cText(1000) + '.';
      else if (topC > MAX_C + 0.5) problem = 'That\'s hotter than these firings go. Enter a top temperature up to ' + cText(MAX_C) + '.';
      if (problem) {
        line(problem, 'cm-results-empty');
        announce(problem);   // replaces any pending result, so a stale total is never read out
        graphBox.hidden = true;
        lastSchedule = null;
        setCost(null);
        return;
      }

      var holdMin = readHold(notes);
      var s = buildSchedule(firing.value, topC, thick, dry === 'damp', holdMin, cool.value);
      var last = s.steps.length - 1;
      s.steps.forEach(function (st, i) {
        var text, tag = '';
        var ends = i === last ? ', then off' : '';
        if (st.kind === 'drop') text = 'Fall ' + rateText(st.rate) + ' to ' + tempText(st.to) + ', hold ' + durText(st.hold) + ends;
        else if (st.kind === 'cool') text = 'Cool ' + rateText(st.rate) + ' to ' + tempText(st.to) + ends;
        else text = rateText(st.rate) + ' to ' + tempText(st.to) + (st.hold ? ', hold ' + durText(st.hold) : '') + ends;
        if (st.kind === 'dry') tag = 'drying';
        if (st.kind === 'drop') tag = 'drop and hold';
        if (st.kind === 'cool') tag = 'slow cool';
        step(i + 1, text, tag);
      });

      line('Total time: ' + durText(s.totalMin));
      var ends = '';
      var m = /^(\d{1,2}):(\d{2})/.exec(start.value);
      if (m) {
        var endAt = parseInt(m[1], 10) * 60 + parseInt(m[2], 10) + s.totalMin;
        ends = clock(endAt) + ' ' + dayText(Math.floor(endAt / 1440));
        line('Ends: ' + ends);
      }

      var use = SPEED_USE[s.speed];
      if (typeof use !== 'string') use = use[fr.glaze ? 'glaze' : 'bisque'];
      var src = [['Ramps: ', link('Bartlett\'s "' + SPEEDS[s.speed].name + '" kiln controller preset', SRC.bartlett), ', ' + use + '.']];
      if (fr.glaze && thick === 'thick') src.push('Bartlett has no slower glaze speed, so thick ware fires on Medium too.');
      if (s.speed === 'fast') {
        caution.hidden = false;
        rich(caution, ['Fast climbs at ' + perHourF(570) + ' from cold. ', link('Bartlett', SRC.bartlett), ' gives it only for thin glazed ware, and ',
          link('Potclays', SRC.potclays), ' advises 100 to 130°C an hour for glaze firings, so choose Normal unless your clay or glaze maker allows a fast firing.']);
      }
      if (dry === 'damp') src.push('Drying: Bartlett\'s ' + PREHEAT.hours[thick] + '-hour preheat for damp ware.');
      if (fr.glaze && cool.value !== 'off') {
        // Earthenware: Plainsman C04PLTP (drop and hold) and Digitalfire 04DSDH (slow cool). Mid and high fire: Plainsman PLC6DS / C6DHSC.
        var low = firing.value === 'earthenware';
        var higher = firing.value === 'highfire' ? ', used here at your higher top temperature.' : '.';
        if (cool.value === 'drop' || low) {
          src.push(['Drop and hold: Plainsman\'s ', low ? link('C04PLTP schedule', SRC.c04pltp) : link('PLC6DS schedule', SRC.plc6ds), ' on Digitalfire' + higher]);
        }
        if (cool.value === 'slow') {
          src.push(low
            ? ['Slow cool: Digitalfire\'s ', link('04DSDH schedule', SRC.dsdh04), '.']
            : ['Drop, hold and slow cool: Plainsman\'s ', link('C6DHSC schedule', SRC.c6dhsc), ' on Digitalfire' + higher]);
        }
      }
      if (coneName) {
        var col = coneCol(s.speed), colF = CONE_RATES[col] * 9 / 5, rF = lastRateF(s.speed);
        var cs = ' for a ' + perHourF(colF) + ' finish';
        if (Math.abs(rF - colF) < 1) cs += ', the same as this schedule\'s last ramp.';
        else if (rF < colF && col === 0) cs += '. This schedule ends slower, at ' + perHourF(rF) + ', so the cone may bend a little before this temperature: watch your witness cone.';
        else cs += ', the nearer of the chart\'s two columns to this schedule\'s last ramp of ' + perHourF(rF) + '.';
        src.push(['Cone ' + coneName + ' is ' + cText(topC) + ': ', link('Orton\'s self-supporting figure', SRC.orton), cs]);
      } else {
        src.push('At your own top temperature of ' + cText(topC) + '.');
      }
      var lo = coneC(fr.cones[0]), hi = coneC(fr.cones[fr.cones.length - 1]);
      if (topC < lo - 25 || topC > hi + 25) {
        notes.push(cText(topC) + ' is outside the usual cones for ' + (/^[aeiou]/.test(fr.name) ? 'an ' : 'a ') + fr.name
          + ' (cone ' + fr.cones[0] + ' to ' + fr.cones[fr.cones.length - 1] + ', ' + cText(lo) + ' to ' + cText(hi) + '). Check the firing type.');
      }
      notes = notes.concat(s.notes);
      if (fr.glaze && cool.value === 'slow') notes.push([link('Digitalfire', SRC.c6dhsc), ' warns that slow cools can shorten the life of kiln relays.']);
      notes.push('Timed from a ' + (unit === 'c' ? '21°C' : '70°F') + ' kiln to the end of the program. The cool-down after that isn\'t counted.');
      rich(note, sentences(src.concat(notes)));

      graphBox.hidden = false;
      lastSchedule = s;
      drawGraph(s);
      setCost(s.heatMin, fr.glaze && cool.value === 'slow' && s.steps[last].kind === 'cool');
      announce('Total firing time ' + durText(s.totalMin) + (ends ? ', ending ' + ends : '') + '.');
    }

    firing.addEventListener('change', function () {
      fillCones(FIRINGS[firing.value].def);
      setTopFromCone();
      render();
    });

    cone.addEventListener('change', function () {
      setTopFromCone();
      render();
    });

    top.addEventListener('input', function () {
      lastSet = null;
      var v = parseFloat(top.value);
      var c = isNaN(v) ? null : coneFor(v);
      cone.value = c || 'own';
      render();
    });

    qa('[data-unit]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var next = btn.getAttribute('data-unit');
        if (next === unit) return;
        // Remember the exact temperature before switching, so °C > °F > °C gives back what was typed.
        var exact = null;
        var v = parseFloat(top.value);
        if (lastSet && top.value === lastSet.text) exact = lastSet.c;
        else if (!isNaN(v) && v > 0) exact = cone.value !== 'own' ? coneC(cone.value) : (unit === 'c' ? v : fToC(v));
        unit = next;
        setPressed(qa('[data-unit]'), 'data-unit', unit);
        var keep = cone.value;
        fillCones(keep);
        if (exact !== null) {
          top.value = String(Math.round(inUnit(exact)));
          lastSet = { text: top.value, c: exact };
        }
        render();
      });
    });

    qa('[data-thick]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var next = btn.getAttribute('data-thick');
        if (next === thick) return;
        thick = next;
        setPressed(qa('[data-thick]'), 'data-thick', thick);
        // The speed may change, and with it the cone's top temperature (see coneCol)
        fillCones(cone.value);
        setTopFromCone();
        render();
      });
    });

    qa('[data-dry]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var next = btn.getAttribute('data-dry');
        if (next === dry) return;
        dry = next;
        setPressed(qa('[data-dry]'), 'data-dry', dry);
        render();
      });
    });

    [hold, start].forEach(function (el) {
      el.addEventListener('input', render);
      el.addEventListener('change', render);
    });
    cool.addEventListener('change', render);

    if (window.ResizeObserver) {
      new ResizeObserver(function () { if (lastSchedule && !graphBox.hidden) drawGraph(lastSchedule); }).observe(graphBox);
    }

    fillCones(FIRINGS[firing.value].def);
    setTopFromCone();
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
