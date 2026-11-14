/*
 * Ceramind Tools — Clay Weight Calculator (embeddable version)
 *
 * Paste this wherever the calculator should appear:
 *
 *   <div class="ceramind-clay-weight-calculator"></div>
 *   <script src="https://cdn.jsdelivr.net/gh/ceramindtools/ceramind-calculators@main/ceramind-clay-weight-calculator-embed.js" async></script>
 *
 * Built by build.py from src/clay-weight.js + src/base.css + src/shared.js. Edit those, then run build.py.
 *
 * How it works: the finished (fired) size is scaled up by 1 / (1 - shrinkage) to the wet size. The clay in the
 * wet pot is the outside solid minus the inside solid, with the wall and base thickness of the wet pot after
 * trimming. Grams = that volume x the density of wet clay, then the allowance is added on top.
 * Capacity mode: fired capacity / (1 - shrinkage)^3 = wet capacity, and the height is solved from it.
 *
 * Numbers used (sources and quotes in Website/Calculators/Clay Weight/sources.md):
 * - Wet (plastic) clay: 1.95 g per cm3. Worked out from Digitalfire's water content for bodies of modelling
 *   stiffness, 19.5-22.5% of the wet weight (digitalfire.com/test/clwc), and 2.6 g/cm3 for the clay minerals
 *   (Webmineral: kaolinite 2.60; quartz 2.65): 1 / (0.79 / 2.6 + 0.21 / 1) = 1.95. Lakeside Pottery also
 *   puts an average clay at about 20% water.
 * - Shrinkage presets 7 / 11 / 13%, the same as our Clay Shrinkage Calculator. Valentine Clays: earthenware
 *   5-10%, stoneware and porcelain 10-15% or more. Lakeside Pottery's chart assumes 11-14%.
 * - Walls: "1/4" to 3/8" walls on functional ware" (6-10 mm; Sheffield Pottery, Pottery 101, 2026; the
 *   TheStudioManager chart aims for the same). 1/4 inch right below the rim and a 1/4 inch base on untrimmed
 *   small and medium pots (Vince Pitelka, Clay: A Studio Handbook). Larger pots need thicker walls (Lakeside).
 *   Defaults: mugs and cups 6 mm walls and base; bowls, vases and cylinders 8 mm; plates 8 mm walls, 10 mm base.
 * - Throwing allowance (slurry, the wire cut and trimming): mugs and cups 15%, bowls, vases and cylinders 25%,
 *   plates 30%. Calibrated so the results land on Lakeside Pottery's 27-form chart, "Weights of Clay Needed For
 *   Ware Sizes" (20 comparable forms, average gap 6%). Lakeside suggests beginners add about 25%.
 * - Handbuilding allowance: 10%, our own working figure for slab offcuts. A round base cut from a square slab
 *   leaves 1 - pi/4 = 21% of that square as scrap, but most of it is re-wedged.
 * - Mug handle: about 100 g. Dwayne Sackey weighs out 3 1/2 ounces for a handle (Pottery Making Illustrated,
 *   Nov/Dec 2021).
 * - Capacity slips in the ml box: under 1 is read as litres, 1 to 40 as US fl oz (one tap re-reads it as UK fl oz).
 * - Capacity is to the brim. Sumi von Dassow (Pottery Making Illustrated, Nov/Dec 2021): a freshly thrown pot
 *   holds about 1.5 times the finished volume, which is (1 - shrinkage)^3 at about 12.5%.
 */
(function () {
  var TARGET_CLASS = 'ceramind-clay-weight-calculator';
  var BASE_ID = 'ceramind-calc-base-v1';
  var STYLE_ID = 'ceramind-clay-weight-style';
  var BASE_CSS = /*@BASE_CSS@*/'';
  var EMBED_FILE = 'ceramind-clay-weight-calculator-embed.js';

/*@SHARED_JS@*/

  var DENSITY = 1.95;          // g per cm3 of wet, workable clay
  // Fluid ounces: US = 1/128 of the 231 cubic inch US gallon; UK = 1/160 of the 4.54609 litre imperial gallon
  var ML_PER = { ml: 1, usoz: 29.5735295625, ukoz: 28.4130625 };
  var CAP_NAME = { ml: 'ml', usoz: 'US fl oz', ukoz: 'UK fl oz' };
  var G_PER_OZ = 28.3495;
  var HANDLE_G = 100;          // one pulled mug handle
  var HAND_ALLOW = 10;         // handbuilding allowance %
  var PRESET_SHRINK = ['7', '11', '13'];
  var PRESET_RANGE = { '7': ['earthenware', '5–10%'], '11': ['stoneware', '10–15%'], '13': ['porcelain', '10–15%'] };

  // Source pages linked from the calculator's own text (quotes in Website/Calculators/Clay Weight/sources.md)
  var SRC = {
    lakeside: 'https://www.lakesidepottery.com/HTML%20Text/Tips/weights-of-clay-needed-for-ware-size.pdf',
    digitalfire: 'https://digitalfire.com/test/clwc',
    valentine: 'https://valentineclays.co.uk/pages/shrinkage-rates',
    sheffield: 'https://www.sheffield-pottery.com/blogs/ceramic-arts-blog/pottery-101-answers-to-the-questions-every-new-potter-asks',
    sackey: 'https://ceramicartsnetwork.org/pottery-making-illustrated/pottery-making-illustrated-article/fluidity-in-form-and-surface'
  };
  var NB = '\u00a0';           // keeps a number on the same line as its unit

  // Default finished (fired) size, wet wall and base after trimming, and the throwing allowance, per form.
  var FORMS = {
    mug:      { shape: 'cyl',   cap: 350,  d: 8,   h: 10,  wall: 6, base: 6,  allow: 15, text: 'a straight-sided mug' },
    cup:      { shape: 'cyl',   cap: 200,  d: 7.5, h: 7,   wall: 6, base: 6,  allow: 15, text: 'a straight-sided cup' },
    bowl:     { shape: 'bowl',  cap: 500,  d: 15,  h: 7,   wall: 8, base: 8,  allow: 25, text: 'a round-bottomed bowl' },
    plate:    { shape: 'plate', cap: 0,    d: 27,  h: 2.5, wall: 8, base: 10, allow: 30, text: 'a flat plate with a rim rising at 45°' },
    vase:     { shape: 'vase',  cap: 1000, d: 12,  h: 18,  wall: 8, base: 8,  allow: 25, text: 'a rounded, egg-shaped vase' },
    cylinder: { shape: 'cyl',   cap: 1000, d: 11,  h: 15,  wall: 8, base: 8,  allow: 25, text: 'a straight-sided cylinder' }
  };

  var CSS = ''
    + '.cm-calc .cm-pot-wet { fill: none; stroke: var(--cm-brand-soft); stroke-width: 1.2; stroke-dasharray: 3 2.5; }'
    + '.cm-calc .cm-pot-fired { fill: var(--cm-brand); }'
    + '.cm-calc .cm-ground { stroke: var(--cm-accent); stroke-width: 1; }'
    + '.cm-calc .cm-dims { grid-template-columns: repeat(2, minmax(0, 1fr)); margin-bottom: 0.9rem; }'
    + '.cm-calc .cm-results-list li:first-child:not(.cm-results-empty) { font-size: 1.3rem; line-height: 1.3; }'
    + '.cm-calc .cm-link-btn { display: inline-block; margin: 0.5rem 0 0; padding: 0; border: 0; background: none; color: #fff;'
    + '  font: inherit; font-size: 0.78rem; font-weight: 600; text-decoration: underline; cursor: pointer; }'
    + '.cm-calc .cm-link-btn:focus-visible { outline: 2px solid #fff; outline-offset: 2px; }';

  var uid = 0;

  function template(id) {
    function f(name) { return id + '-' + name; }
    return ''
      + '<div class="cm-card">'
      + '  <h3 class="cm-title">Clay Weight Calculator</h3>'
      + '  <p class="cm-sub">Work out how much clay to weigh out for a pot, and the wet size to throw or build it to.</p>'
      + '  <div class="cm-mode-toggle" role="group" aria-label="How you make it">'
      + '    <button type="button" class="cm-mode-btn is-active" data-method="throw" aria-pressed="true">Thrown on the wheel</button>'
      + '    <button type="button" class="cm-mode-btn" data-method="hand" aria-pressed="false">Handbuilt</button>'
      + '  </div>'
      + '  <div class="cm-row">'
      + '    <label class="cm-label" for="' + f('form') + '">Pot</label>'
      + '    <select id="' + f('form') + '" data-role="form">'
      + '      <option value="mug" selected>Mug (with handle)</option>'
      + '      <option value="cup">Cup or tumbler</option>'
      + '      <option value="bowl">Bowl</option>'
      + '      <option value="plate">Plate</option>'
      + '      <option value="vase">Vase, rounded</option>'
      + '      <option value="cylinder">Cylinder, straight</option>'
      + '    </select>'
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
      + '    <label class="cm-label" for="' + f('shrink') + '">Shrinkage %</label>'
      + '    <input type="number" id="' + f('shrink') + '" data-role="shrink" min="0" max="30" step="0.5" value="11" inputmode="decimal">'
      + '  </div>'
      + '  <div class="cm-row">'
      + '    <span class="cm-label">Units</span>'
      + '    <div class="cm-unit-toggle" role="group" aria-label="Units">'
      + '      <button type="button" class="cm-unit-btn is-active" data-units="metric" aria-pressed="true">cm · g</button>'
      + '      <button type="button" class="cm-unit-btn" data-units="imperial" aria-pressed="false">in · lb</button>'
      + '    </div>'
      + '  </div>'
      + '  <div class="cm-row" data-vessel>'
      + '    <span class="cm-label">Size by</span>'
      + '    <div class="cm-unit-toggle" role="group" aria-label="Size by">'
      + '      <button type="button" class="cm-unit-btn is-active" data-by="cap" aria-pressed="true">Capacity</button>'
      + '      <button type="button" class="cm-unit-btn" data-by="height" aria-pressed="false">Height</button>'
      + '    </div>'
      + '  </div>'
      + '  <div class="cm-row" data-vessel>'
      + '    <span class="cm-label">Capacity in</span>'
      + '    <div class="cm-unit-toggle" role="group" aria-label="Capacity units">'
      + '      <button type="button" class="cm-unit-btn is-active" data-cap-unit="ml" aria-pressed="true">ml</button>'
      + '      <button type="button" class="cm-unit-btn" data-cap-unit="usoz" aria-pressed="false">US fl oz</button>'
      + '      <button type="button" class="cm-unit-btn" data-cap-unit="ukoz" aria-pressed="false">UK fl oz</button>'
      + '    </div>'
      + '  </div>'
      + '  <div class="cm-dims">'
      + '    <div class="cm-dim" data-show="cap">'
      + '      <label class="cm-dim-label" for="' + f('cap') + '" data-label="cap">Capacity (ml)</label>'
      + '      <input type="number" class="cm-dim-input" id="' + f('cap') + '" data-field="cap" min="0" step="any" inputmode="decimal">'
      + '    </div>'
      + '    <div class="cm-dim">'
      + '      <label class="cm-dim-label" for="' + f('d') + '" data-label="d">Width (cm)</label>'
      + '      <input type="number" class="cm-dim-input" id="' + f('d') + '" data-field="d" min="0" step="any" inputmode="decimal">'
      + '    </div>'
      + '    <div class="cm-dim" data-show="height">'
      + '      <label class="cm-dim-label" for="' + f('h') + '" data-label="h">Height (cm)</label>'
      + '      <input type="number" class="cm-dim-input" id="' + f('h') + '" data-field="h" min="0" step="any" inputmode="decimal">'
      + '    </div>'
      + '    <div class="cm-dim">'
      + '      <label class="cm-dim-label" for="' + f('wall') + '" data-label="wall">Wall (mm)</label>'
      + '      <input type="number" class="cm-dim-input" id="' + f('wall') + '" data-field="wall" min="0" step="any" inputmode="decimal">'
      + '    </div>'
      + '    <div class="cm-dim">'
      + '      <label class="cm-dim-label" for="' + f('base') + '" data-label="base">Base (mm)</label>'
      + '      <input type="number" class="cm-dim-input" id="' + f('base') + '" data-field="base" min="0" step="any" inputmode="decimal">'
      + '    </div>'
      + '  </div>'
      + '  <div class="cm-row">'
      + '    <label class="cm-label" for="' + f('allow') + '" data-role="allow-label">Throwing allowance %</label>'
      + '    <input type="number" id="' + f('allow') + '" data-role="allow" min="0" max="100" step="1" inputmode="decimal">'
      + '  </div>'
      + '  <p class="cm-hint" data-role="hint"></p>'
      + '  <div class="cm-visual">'
      + '    <svg viewBox="0 0 100 100" class="cm-svg" aria-hidden="true">'
      + '      <line class="cm-ground" x1="4" y1="92.5" x2="96" y2="92.5"></line>'
      + '      <path class="cm-pot-fired" d=""></path>'
      + '      <path class="cm-pot-wet" d=""></path>'
      + '    </svg>'
      + '    <div class="cm-visual-caption">'
      + '      <p class="cm-visual-pct" data-role="visual-pct">11% smaller once fired</p>'
      + '      <p class="cm-visual-legend"><span class="cm-key"><span class="cm-dot cm-dot-wet"></span>Wet size</span> <span class="cm-key"><span class="cm-dot cm-dot-fired"></span>Fired</span></p>'
      + '      <p class="cm-visual-note">Drawn to scale, side on. Make it the dashed size.</p>'
      + '    </div>'
      + '  </div>'
      + '  <div class="cm-results">'
      + '    <p class="cm-results-title">For this pot:</p>'
      + '    <ul class="cm-results-list"></ul>'
      + '    <p class="cm-results-note" data-role="note"></p>'
      + '    <button type="button" class="cm-link-btn" data-role="ukoz" hidden>Use UK fl oz instead</button>'
      + '  </div>'
      + '  <p class="cm-sr" aria-live="polite" aria-atomic="true" data-role="sr"></p>'
      + '  <p class="cm-disclaimer">This is an estimate to help you plan, not a guarantee. Clay bodies, throwing styles and trimming all differ, so weigh your first pot, note what it came out at and adjust. Ceramind Tools can\'t accept responsibility for decisions based on these results.</p>'
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

  // ---- Geometry, all in cm and cm3 on the wet pot ----

  // Volume of a round-bottomed bowl of rim radius a and depth h: a spherical cap while h <= a,
  // then a half sphere with a straight-sided collar above it.
  function bowlVol(a, h) {
    if (h <= a) return Math.PI * h * (3 * a * a + h * h) / 6;
    return 2 / 3 * Math.PI * a * a * a + Math.PI * a * a * (h - a);
  }

  // Depth that gives a bowl of rim radius a the volume v (bowlVol only grows with h).
  function bowlDepth(a, v) {
    var half = 2 / 3 * Math.PI * a * a * a;
    if (v > half) return a + (v - half) / (Math.PI * a * a);
    var lo = 0, hi = a;
    for (var i = 0; i < 60; i++) {
      var mid = (lo + hi) / 2;
      if (bowlVol(a, mid) < v) lo = mid; else hi = mid;
    }
    return (lo + hi) / 2;
  }

  // Inside measurements, or an error if the walls and base leave no room.
  function inside(shape, D, H, t, b) {
    var R = D / 2;
    if (shape === 'vase') return { r: R - t, h: H - t - b };
    return { r: R - t, h: H - b };
  }

  function insideVol(shape, r, h) {
    if (shape === 'cyl') return Math.PI * r * r * h;
    if (shape === 'bowl') return bowlVol(r, h);
    if (shape === 'vase') return Math.PI / 6 * (2 * r) * (2 * r) * h;
    return 0;
  }

  // Clay in the wet pot (cm3) for outside width D and height H.
  function clayVol(shape, D, H, t, b) {
    var R = D / 2;
    if (shape === 'plate') {
      var r0 = R - H;                           // flat base; the rim rises at 45 degrees
      return Math.PI * r0 * r0 * b + Math.PI * (R + r0) * H * Math.SQRT2 * t;
    }
    var inn = inside(shape, D, H, t, b);
    var outer = shape === 'cyl' ? Math.PI * R * R * H
      : shape === 'bowl' ? bowlVol(R, H)
      : Math.PI / 6 * D * D * H;
    return outer - insideVol(shape, inn.r, inn.h);
  }

  // Outside height of the wet pot that holds wetCap (cm3) at width D.
  function heightFor(shape, D, t, b, wetCap) {
    var r = D / 2 - t;
    if (shape === 'cyl') return wetCap / (Math.PI * r * r) + b;
    if (shape === 'bowl') return bowlDepth(r, wetCap) + b;
    return wetCap / (Math.PI / 6 * 4 * r * r) + t + b;   // vase
  }

  // Side-on outline for the picture, standing on y = 92.5, centred on x = 50.
  function outline(shape, w, h) {
    var x0 = 50 - w / 2, x1 = 50 + w / 2, y = 92.5, top = y - h;
    function p(n) { return n.toFixed(2); }
    if (shape === 'cyl') return 'M' + p(x0) + ' ' + p(top) + 'L' + p(x0) + ' ' + p(y) + 'L' + p(x1) + ' ' + p(y) + 'L' + p(x1) + ' ' + p(top) + 'Z';
    if (shape === 'plate') {
      var inset = Math.min(h, w / 2);
      return 'M' + p(x0) + ' ' + p(top) + 'L' + p(x0 + inset) + ' ' + p(y) + 'L' + p(x1 - inset) + ' ' + p(y) + 'L' + p(x1) + ' ' + p(top) + 'Z';
    }
    if (shape === 'bowl') {
      var a = w / 2;
      if (h <= a) return 'M' + p(x0) + ' ' + p(top) + 'A' + p(a) + ' ' + p(h) + ' 0 0 0 ' + p(x1) + ' ' + p(top) + 'Z';
      var side = top + (h - a);
      return 'M' + p(x0) + ' ' + p(top) + 'L' + p(x0) + ' ' + p(side) + 'A' + p(a) + ' ' + p(a) + ' 0 0 0 ' + p(x1) + ' ' + p(side) + 'L' + p(x1) + ' ' + p(top) + 'Z';
    }
    var cy = y - h / 2;
    return 'M' + p(x0) + ' ' + p(cy) + 'A' + p(w / 2) + ' ' + p(h / 2) + ' 0 1 0 ' + p(x1) + ' ' + p(cy)
      + 'A' + p(w / 2) + ' ' + p(h / 2) + ' 0 1 0 ' + p(x0) + ' ' + p(cy) + 'Z';
  }

  function initOne(root) {
    if (root.dataset.ceramindInit === 'true') return;
    root.dataset.ceramindInit = 'true';
    root.classList.add('cm-calc');
    uid += 1;
    root.innerHTML = template('cmcw' + uid);

    var method = 'throw';
    var units = 'metric';
    var capUnit = 'ml';
    var by = 'cap';
    var ownAllow = { throw: null, hand: null };   // the user's own allowance per method, as typed
    var last = null;                              // last good result, for carrying sizes across the Size by toggle
    var srTimer;

    // The sizes in metric (ml, cm, mm). Inputs show them in the chosen units; typing updates them.
    var val = {};

    function q(sel) { return root.querySelector(sel); }
    function qa(sel) { return root.querySelectorAll(sel); }
    var formSel = q('[data-role="form"]');
    var clay = q('[data-role="clay"]');
    var shrink = q('[data-role="shrink"]');
    var allow = q('[data-role="allow"]');
    var hint = q('[data-role="hint"]');
    var allowLabel = q('[data-role="allow-label"]');
    var fired = q('.cm-pot-fired');
    var wet = q('.cm-pot-wet');
    var visualPct = q('[data-role="visual-pct"]');
    var list = q('.cm-results-list');
    var note = q('[data-role="note"]');
    var sr = q('[data-role="sr"]');
    var ukBtn = q('[data-role="ukoz"]');
    var fields = {};
    qa('[data-field]').forEach(function (el) { fields[el.getAttribute('data-field')] = el; });

    // metric value -> shown value, per field
    var TO_IMP = { d: 1 / 2.54, h: 1 / 2.54, wall: 1 / 25.4, base: 1 / 25.4 };
    var DP = { metric: { d: 1, h: 1, wall: 1, base: 1 }, imperial: { d: 2, h: 2, wall: 2, base: 2 } };
    var LABELS = {
      metric: { d: 'Width (cm)', h: 'Height (cm)', wall: 'Wall (mm)', base: 'Base (mm)' },
      imperial: { d: 'Width (in)', h: 'Height (in)', wall: 'Wall (in)', base: 'Base (in)' }
    };

    // metric value x factor = the value shown in the box
    function factor(name) {
      if (name === 'cap') return 1 / ML_PER[capUnit];
      return units === 'metric' ? 1 : TO_IMP[name];
    }
    function places(name) {
      return name === 'cap' ? (capUnit === 'ml' ? 0 : 1) : DP[units][name];
    }

    function round(n, dp) { var m = Math.pow(10, dp); return Math.round(n * m) / m; }

    function show(name) {
      var v = val[name];
      if (isNaN(v)) { fields[name].value = ''; return; }
      fields[name].value = String(round(v * factor(name), places(name)));
    }

    function readField(name) {
      var n = parseFloat(fields[name].value);
      if (isNaN(n)) { val[name] = NaN; return; }
      val[name] = n / factor(name);
    }

    function fmt(n, dp) {
      return n.toLocaleString('en-GB', { minimumFractionDigits: dp, maximumFractionDigits: dp });
    }

    function grams(g) {
      var metric = (g < 50 ? Math.round(g) : Math.round(g / 10) * 10).toLocaleString('en-GB') + NB + 'g';
      if (units === 'metric') return metric;
      var oz = Math.round(g / G_PER_OZ);
      var lb = Math.floor(oz / 16);
      var imp = lb ? lb + NB + 'lb ' + (oz - lb * 16) + NB + 'oz' : Math.max(oz, 1) + NB + 'oz';
      return imp + ' (' + metric + ')';
    }

    function len(cm) {
      return units === 'metric' ? fmt(cm, 1) + NB + 'cm' : fmt(cm / 2.54, 1) + NB + 'in';
    }

    function thick(mm) {
      return units === 'metric' ? fmt(mm, mm % 1 ? 1 : 0) + NB + 'mm' : fmt(mm / 25.4, 2) + NB + 'in';
    }

    // exact: the user's own capacity, shown as typed rather than rounded to 5 ml
    function capText(ml, exact) {
      if (capUnit !== 'ml') return fmt(ml / ML_PER[capUnit], 1) + NB + CAP_NAME[capUnit].replace(/ /g, NB);
      if (ml >= 1000) {
        var l = Math.round(ml / 10) / 100;
        return l.toLocaleString('en-GB', { maximumFractionDigits: 2 }) + NB + (l === 1 ? 'litre' : 'litres');
      }
      return (exact || ml < 100 ? Math.round(ml) : Math.round(ml / 5) * 5) + NB + 'ml';
    }

    // "an 8%", "an 11%", "an 18%", "an 80%"; "a" otherwise
    function an(n) {
      var d = String(Math.floor(Math.abs(n)));
      if (d.charAt(0) === '8') return 'an';
      if (d.length % 3 === 2 && (d.slice(0, 2) === '11' || d.slice(0, 2) === '18')) return 'an';
      return 'a';
    }

    function setPressed(btns, attr, value) {
      btns.forEach(function (b) {
        var on = b.getAttribute(attr) === value;
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
    }

    // Text with source links: a string, or a list of strings and { t: text, href: url } parts, built as DOM nodes.
    function src(t, key) { return { t: t, href: SRC[key] }; }
    function put(el, text) {
      (typeof text === 'string' ? [text] : text).forEach(function (part) {
        if (typeof part === 'string') { el.appendChild(document.createTextNode(part)); return; }
        var a = document.createElement('a');
        a.href = part.href;
        a.target = '_blank';
        a.rel = 'noopener';
        a.textContent = part.t;
        el.appendChild(a);
      });
    }
    function plain(text) {
      return typeof text === 'string' ? text : text.map(function (p) { return typeof p === 'string' ? p : p.t; }).join('');
    }
    function putNotes(list) {
      note.textContent = '';
      list.forEach(function (n, i) {
        if (i) note.appendChild(document.createTextNode(' '));
        put(note, n);
      });
    }

    function line(text, cls) {
      var li = document.createElement('li');
      if (cls) li.className = cls;
      put(li, text);
      list.appendChild(li);
    }

    function announce(text) {
      clearTimeout(srTimer);
      srTimer = setTimeout(function () { sr.textContent = text; }, 700);
    }

    function allowDefault() {
      return method === 'hand' ? HAND_ALLOW : FORMS[formSel.value].allow;
    }

    function loadForm() {
      var F = FORMS[formSel.value];
      val = { cap: F.cap || NaN, d: F.d, h: F.h, wall: F.wall, base: F.base };
      ['cap', 'd', 'h', 'wall', 'base'].forEach(show);
      if (ownAllow[method] === null) allow.value = allowDefault();
      last = null;
    }

    function clearPic() {
      fired.setAttribute('d', '');
      wet.setAttribute('d', '');
    }

    function render() {
      var F = FORMS[formSel.value];
      var shape = F.shape;
      var vessel = shape !== 'plate';
      var useCap = vessel && by === 'cap';
      qa('[data-vessel]').forEach(function (el) { el.hidden = !vessel; });
      q('[data-show="cap"]').hidden = !useCap;
      q('[data-show="height"]').hidden = useCap;
      ['d', 'h', 'wall', 'base'].forEach(function (k) { q('[data-label="' + k + '"]').textContent = LABELS[units][k]; });
      q('[data-label="cap"]').textContent = 'Capacity (' + CAP_NAME[capUnit] + ')';
      ukBtn.hidden = true;
      allowLabel.textContent = method === 'hand' ? 'Offcut allowance %' : 'Throwing allowance %';
      hint.textContent = '';
      put(hint, [(shape === 'vase' ? 'Width is the widest point, outside. ' : 'Width is outside, at the rim. ')
        + 'Sizes are the finished, fired pot; wall and base are the wet pot\'s thickness '
        + (method === 'hand' ? 'as you build it (your slab). ' : 'after trimming. '),
        src('Sheffield Pottery', 'sheffield'), ' suggests ' + (units === 'metric' ? '6–10 mm' : '1/4–3/8 in') + ' walls for pots you\'ll use. ']
        .concat(method === 'hand' ? ['Pinching with no offcuts? Set the allowance to 0.']
          : ['Still learning? ', src('Lakeside Pottery', 'lakeside'), ' suggests about 25% more clay.']));

      var notes = [];
      var imp = units === 'imperial';

      // Shrinkage: 0 is allowed (sizes are then the wet sizes); under 1 is read as a fraction (0.12 = 12%),
      // and the range checks run on the converted figure: over 16% warns, 30% or more is refused.
      var s = parseFloat(shrink.value);
      if (s > 0 && s < 1) { notes.push('Read ' + shrink.value + ' as ' + fmt(s * 100, 0) + '% shrinkage.'); s = s * 100; }
      var highShrink = [fmt(s, s % 1 ? 1 : 0) + '% is unusually high: ', src('most clays shrink about 5–15%', 'valentine'), ', so check your figure.'];
      var badShrink = !isNaN(s) && s >= 30;
      if (s > 16 && !badShrink) notes.push(highShrink);

      var a = parseFloat(allow.value);
      if (a > 0 && a < 1) { notes.push('Read ' + allow.value + ' as ' + an(a * 100) + ' ' + fmt(a * 100, 0) + '% allowance.'); a = a * 100; }
      if (a > 100) { notes.push('An allowance over 100% would more than double the clay, so 100% is used.'); a = 100; }

      // Catch unit slips on the shown values, then work in metric.
      var cap = val.cap, D = val.d, H = val.h, t = val.wall, b = val.base;
      var cs = parseFloat(fields.cap.value);
      // A caught slip is stored as the corrected value, so a later unit click converts the right amount.
      if (useCap && cs > 0) {
        var typed = fields.cap.value;
        if (capUnit === 'ml' && cs < 1) { cap = cs * 1000; notes.push('Read ' + typed + ' as ' + typed + ' litres (' + fmt(cap, 0) + ' ml).'); }
        else if (capUnit === 'ml' && cs <= 40) {
          cap = cs * ML_PER.usoz;
          notes.push('Read ' + typed + ' as ' + typed + ' US fl oz (' + fmt(cap, 0) + ' ml).');
          ukBtn.hidden = false;
        }
        else if (capUnit !== 'ml' && cs >= 150) { cap = cs; notes.push('Read ' + typed + ' as ' + typed + ' ml (' + fmt(cs / ML_PER[capUnit], 1) + ' ' + CAP_NAME[capUnit] + ').'); }
        val.cap = cap;
      }
      function sizeSlip(name, cm) {
        var shown = parseFloat(fields[name].value);
        if (isNaN(shown)) return cm;
        if (!imp && shown > 60) { notes.push('Read ' + fields[name].value + ' as ' + fields[name].value + ' mm (' + fmt(shown / 10, 1) + ' cm).'); cm = shown / 10; }
        else if (imp && shown > 24) { notes.push('Read ' + fields[name].value + ' as ' + fields[name].value + ' cm (' + fmt(shown / 2.54, 1) + ' in).'); cm = shown; }
        val[name] = cm;
        return cm;
      }
      function thickSlip(name, mm) {
        var shown = parseFloat(fields[name].value);
        if (isNaN(shown) || shown <= 0) return mm;
        if (!imp && shown < 1.5) { notes.push('Read ' + fields[name].value + ' as ' + fields[name].value + ' cm (' + fmt(shown * 10, 0) + ' mm).'); mm = shown * 10; }
        else if (imp && shown >= 1) { notes.push('Read ' + fields[name].value + ' as ' + fields[name].value + ' mm (' + fmt(shown / 25.4, 2) + ' in).'); mm = shown; }
        val[name] = mm;
        return mm;
      }
      D = sizeSlip('d', D);
      if (!useCap) H = sizeSlip('h', H);
      t = thickSlip('wall', t);
      b = thickSlip('base', b);

      var missing = [];
      function need(ok, name) { if (!ok) missing.push(name); }
      if (useCap) need(cap > 0, 'capacity'); else need(H > 0, 'height');
      need(D > 0, 'width');
      need(t > 0, 'wall thickness');
      need(b > 0, 'base thickness');
      need(s >= 0, 'shrinkage');
      need(a >= 0, 'allowance');

      var negative = [];
      [['shrink', s, 'Shrinkage'], ['allow', a, 'The allowance'], ['cap', useCap ? cs : NaN, 'The capacity'],
        ['h', useCap ? NaN : parseFloat(fields.h.value), 'The height'], ['d', parseFloat(fields.d.value), 'The width'],
        ['wall', parseFloat(fields.wall.value), 'The wall thickness'], ['base', parseFloat(fields.base.value), 'The base thickness']
      ].forEach(function (c) { if (c[1] < 0) negative.push(c[2] + ' can\'t be negative.'); });

      list.innerHTML = '';
      function stop(text) {
        announce(plain(text));
        line(text, 'cm-results-empty');
        putNotes(notes);
        visualPct.textContent = isNaN(s) || badShrink ? 'Shrinks as it dries and fires' : fmt(s, s % 1 ? 1 : 0) + '% smaller once fired';
        clearPic();
        last = null;
      }
      if (negative.length) return stop(negative.join(' '));
      if (missing.length) {
        var lastOne = missing.pop();
        return stop('Enter your ' + (missing.length ? missing.join(', ') + ' and ' : '') + lastOne + '.');
      }
      if (badShrink) return stop(highShrink);

      var k = 1 - s / 100;
      var Dw = D / k;
      var tc = t / 10, bc = b / 10;               // mm -> cm
      var Hw, wetCap = null;
      if (useCap) {
        wetCap = cap / (k * k * k);
        if (Dw / 2 - tc <= 0) return stop('The walls are too thick for a pot this narrow. Check the width and wall.');
        Hw = heightFor(shape, Dw, tc, bc, wetCap);
      } else {
        Hw = H / k;
      }
      if (shape === 'plate') {
        if (Hw >= Dw / 2) return stop('That\'s deep for a plate. For anything deeper than half its width, pick Bowl.');
        if (bc >= Hw) return stop('The base is as thick as the plate is tall. Check the height and base.');
      } else {
        var inn = inside(shape, Dw, Hw, tc, bc);
        if (inn.r <= 0) return stop('The walls are too thick for a pot this narrow. Check the width and wall.');
        if (inn.h <= 0) return stop('The base is as thick as the pot is tall. Check the height and base.');
        if (!useCap) wetCap = insideVol(shape, inn.r, inn.h);
      }

      var potG = clayVol(shape, Dw, Hw, tc, bc) * DENSITY;
      var totalG = potG * (1 + a / 100);
      var firedCap = wetCap === null ? null : wetCap * k * k * k;
      var firedH = Hw * k;

      line('Weigh out: ' + grams(totalG));
      line('Wet size: ' + len(Dw) + ' wide, ' + len(Hw) + ' tall');
      line('Fired: ' + len(D) + ' wide, ' + len(firedH) + ' tall' + (firedCap === null ? '' : ', holds ' + capText(firedCap, useCap)));
      if (formSel.value === 'mug') line('Handle: about ' + (imp ? '3½' + NB + 'oz' : HANDLE_G + NB + 'g') + ' more');

      notes.push('About ' + grams(potG) + ' ends up in the wet pot, and the ' + fmt(a, a % 1 ? 1 : 0) + '% allowance covers '
        + (method === 'hand' ? 'offcuts and joins.' : 'throwing slurry and trimming.'));
      if (method === 'throw' && a === allowDefault()) {
        notes.push(['Our throwing allowances are set so the results match ', src('Lakeside Pottery\'s throwing chart', 'lakeside'), '.']);
      }
      notes.push(['Worked out for ' + F.text + ': walls ' + thick(t) + ', base ' + thick(b) + ', '
        + fmt(s, s % 1 ? 1 : 0) + '% shrinkage, wet clay at 1.95 g per cm³ (from ', src('Digitalfire', 'digitalfire'),
        '\'s water content figures).' + (firedCap === null ? '' : ' Capacity is to the brim.')]);
      var preset = PRESET_RANGE[clay.value];
      if (preset && String(s) === clay.value) {
        notes.push(['The ' + preset[0] + ' preset sits in the ' + preset[1] + ' range ', src('Valentine Clays', 'valentine'), ' gives.']);
      }
      if (formSel.value === 'mug') notes.push([src('Dwayne Sackey', 'sackey'), ' weighs out 3½ oz (about 100 g) for a mug handle.']);
      if (s === 0) notes.push('With 0% shrinkage, the fired sizes are the wet sizes.');
      putNotes(notes);

      // Picture: the wet pot fills the box; the fired one is drawn inside it at its real size.
      var scale = 80 / Math.max(Dw, Hw);
      wet.setAttribute('d', outline(shape, Dw * scale, Hw * scale));
      fired.setAttribute('d', outline(shape, Dw * k * scale, Hw * k * scale));
      visualPct.textContent = s === 0 ? 'No shrinkage entered' : fmt(s, s % 1 ? 1 : 0) + '% smaller once fired';

      last = { firedH: firedH, firedCap: firedCap };
      announce('Weigh out about ' + grams(totalG) + ' of clay.');
    }

    qa('[data-method]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var next = btn.getAttribute('data-method');
        if (next === method) return;
        method = next;
        setPressed(qa('[data-method]'), 'data-method', method);
        allow.value = ownAllow[method] !== null ? ownAllow[method] : allowDefault();
        render();
      });
    });

    qa('[data-units]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var next = btn.getAttribute('data-units');
        if (next === units) return;
        units = next;
        setPressed(qa('[data-units]'), 'data-units', units);
        if (units === 'imperial' && capUnit === 'ml') capUnit = 'usoz';
        if (units === 'metric' && capUnit !== 'ml') capUnit = 'ml';
        setPressed(qa('[data-cap-unit]'), 'data-cap-unit', capUnit);
        ['cap', 'd', 'h', 'wall', 'base'].forEach(show);
        render();
      });
    });

    qa('[data-cap-unit]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var next = btn.getAttribute('data-cap-unit');
        if (next === capUnit) return;
        capUnit = next;
        setPressed(qa('[data-cap-unit]'), 'data-cap-unit', capUnit);
        show('cap');
        render();
      });
    });

    // One tap: the number typed in the ml box was UK fl oz, not US.
    ukBtn.addEventListener('click', function () {
      var typed = parseFloat(fields.cap.value);
      capUnit = 'ukoz';
      setPressed(qa('[data-cap-unit]'), 'data-cap-unit', capUnit);
      if (!isNaN(typed)) val.cap = typed * ML_PER.ukoz;
      show('cap');
      render();
    });

    qa('[data-by]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var next = btn.getAttribute('data-by');
        if (next === by) return;
        // Carry the pot across: the height it came out at, or the capacity it holds.
        if (last) {
          if (next === 'height') { val.h = round(last.firedH, 1); show('h'); }
          else if (last.firedCap) { val.cap = Math.round(last.firedCap / 5) * 5; show('cap'); }
        }
        by = next;
        setPressed(qa('[data-by]'), 'data-by', by);
        render();
      });
    });

    formSel.addEventListener('change', function () {
      loadForm();
      render();
    });

    clay.addEventListener('change', function () {
      if (clay.value !== 'own') shrink.value = clay.value;
      render();
    });

    shrink.addEventListener('input', function () {
      var v = String(parseFloat(shrink.value));
      clay.value = PRESET_SHRINK.indexOf(v) >= 0 ? v : 'own';
      render();
    });

    allow.addEventListener('input', function () {
      // Typing the default back counts as using the default, so a new pot gets its own default again.
      ownAllow[method] = parseFloat(allow.value) === allowDefault() ? null : allow.value;
      render();
    });

    Object.keys(fields).forEach(function (name) {
      fields[name].addEventListener('input', function () {
        readField(name);
        render();
      });
    });

    loadForm();
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
