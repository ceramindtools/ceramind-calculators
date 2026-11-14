/*
 * Ceramind Tools — Plaster Mix Calculator (embeddable version)
 *
 * Paste this wherever the calculator should appear:
 *
 *   <div class="ceramind-plaster-mix-calculator"></div>
 *   <script src="https://cdn.jsdelivr.net/gh/ceramindtools/ceramind-calculators@main/ceramind-plaster-mix-calculator-embed.js" async></script>
 *
 * Built by build.py from src/plaster-mix.js + src/base.css + src/shared.js. Edit those, then run build.py.
 *
 * The maths:
 *   space to fill (ml) = box L x W x depth, or round pi x (D/2)^2 x depth, less the model's volume
 *   mix to make (ml)   = space to fill x (1 + extra for waste %)
 *   plaster (g)        = mix / (C/100 + 1/2.69)      C = parts water per 100 parts plaster, by weight
 *   water (g = ml)     = plaster x C/100
 *
 * Numbers used:
 * - 2.69 g per ml: how much room the plaster powder itself takes up once it is wet. Worked back from USG's
 *   No. 1 Pottery Plaster datasheet: mixed at 70 water to 100 plaster it weighs 99 lb/cu ft wet (1,586 kg/m3),
 *   so 100 g plaster + 70 g water fill 170 / 1.586 = 107.2 ml, of which the water is 70 ml and the plaster 37.2 ml.
 *   USG's gypsum cement chart gives the same figure within 1% for its harder plasters (White Hydrocal 110 lb/cu ft
 *   at 45, Ultracal 30 115 lb/cu ft at 38), so it holds for low ratios like Crystacal R too.
 *   Cross-check: Derek Au (plaster.glazy.org) poured 15 kg No. 1 Pottery Plaster + 10.5 kg water and measured
 *   15,860 cm3, i.e. 1.057 litres per kg. This formula gives 1.072 litres per kg at 70, 1.4% more.
 * - Ratios (water per 100 plaster, by weight), from each maker's or seller's own page or datasheet:
 *   Potters Plaster (Saint-Gobain Formula, Potclays 3450 and Bath Potters) 100/68, 9 min working time.
 *   Valentine Clays Potters Plaster: 1.3 kg plaster to 1 litre water (100:76.9, rounded to 77).
 *   Potterycrafts Potters Plaster P3335: 940 g plaster to 565 cc water (100:60.1, rounded to 60).
 *   Fine Casting Plaster (Saint-Gobain Formula, Bath Potters) 100/70, 20 min working time.
 *   Keramicast (Saint-Gobain Formula, Potclays 3451-01) 100/56, 8 min working time.
 *   Crystacal R (Saint-Gobain Formula, Bath Potters) 100/35, 15 min working time.
 * - Typed ratios: under 1 is a fraction (0.7 = 70); 1 to 2 is kg of plaster per litre of water (1.3 = 76.9);
 *   anything else outside 20 to 100 is refused. A space over 100 litres is refused as a likely unit slip.
 * - Extra for waste: 10% by default. That is our own allowance for plaster left in the bucket and on tools,
 *   not a maker's figure.
 */
(function () {
  var TARGET_CLASS = 'ceramind-plaster-mix-calculator';
  var BASE_ID = 'ceramind-calc-base-v1';
  var STYLE_ID = 'ceramind-plaster-mix-style';
  var BASE_CSS = /*@BASE_CSS@*/'';
  var EMBED_FILE = 'ceramind-plaster-mix-calculator-embed.js';

/*@SHARED_JS@*/

  var PLASTER_SG = 2.69;   // g per ml of the plaster powder once wet (from USG's wet density, see above)
  var WASTE = 10;          // default extra for waste, %
  var TO_CM = { mm: 0.1, cm: 1, in: 2.54 };
  var NB = '\u00a0';      // keeps "450 ml" together when the note wraps
  var MAX_ML = 100000;     // over 100 litres (about 95 kg of plaster): stop and ask, it's almost always a unit slip

  var PLASTERS = {
    potclays: { ratio: 68, name: 'Potters Plaster',
      info: 'Potters Plaster from Potclays (3450) or Bath Potters, both 100:68. Made for slip-casting moulds. About 9 minutes to work.' },
    valentine: { ratio: 77, name: 'Valentine Clays Potters Plaster',
      info: 'Valentine Clays Potters Plaster: their datasheet says 1.3 kg of plaster to 1 litre of water (about 100:77). Starts to set in about 9 minutes.' },
    potterycrafts: { ratio: 60, name: 'Potterycrafts Potters Plaster',
      info: 'Potterycrafts Potters Plaster (P3335): their mix is 940 g of plaster to 565 ml of water (about 100:60).' },
    finecast: { ratio: 70, name: 'Fine Casting Plaster',
      info: 'Fine Casting Plaster from Saint-Gobain Formula, sold by Bath Potters and others. About 20 minutes to work.' },
    keramicast: { ratio: 56, name: 'Keramicast',
      info: 'Keramicast from Potclays (3451-01), a harder, denser mould plaster. About 8 minutes to work.' },
    crystacal: { ratio: 35, name: 'Crystacal R',
      info: 'Crystacal R, a very hard Saint-Gobain Formula plaster for detailed casts and models. With so little water it sets far less absorbent than potters plaster. About 15 minutes to work.' }
  };
  var OWN_INFO = 'Type the water per 100 g of plaster from your bag or its datasheet.';

  var CSS = ''
    + '.cm-calc .cm-plaster-info { margin-top: -0.45rem; }'
    + '.cm-calc .cm-unit-toggle .cm-unit-btn { min-width: 2.9rem; }';

  var uid = 0;

  function template(id) {
    function f(name) { return id + '-' + name; }
    return ''
      + '<div class="cm-card">'
      + '  <h3 class="cm-title">Plaster Mix Calculator</h3>'
      + '  <p class="cm-sub">Work out how much plaster and water to mix for a mould, a drying bat or a wedging slab.</p>'
      + '  <div class="cm-mode-toggle" role="group" aria-label="Shape of the space to fill">'
      + '    <button type="button" class="cm-mode-btn is-active" data-shape="box" aria-pressed="true">Box or slab</button>'
      + '    <button type="button" class="cm-mode-btn" data-shape="round" aria-pressed="false">Round (cylinder)</button>'
      + '  </div>'
      + '  <div class="cm-row">'
      + '    <label class="cm-label" for="' + f('plaster') + '">Plaster</label>'
      + '    <select id="' + f('plaster') + '" data-role="plaster">'
      + '      <optgroup label="Potters plaster">'
      + '        <option value="potclays" selected>Potclays · 100:68</option>'
      + '        <option value="valentine">Valentine Clays · 100:77</option>'
      + '        <option value="potterycrafts">Potterycrafts · 100:60</option>'
      + '      </optgroup>'
      + '      <optgroup label="Other plasters">'
      + '        <option value="finecast">Fine Casting · 100:70</option>'
      + '        <option value="keramicast">Keramicast · 100:56</option>'
      + '        <option value="crystacal">Crystacal R · 100:35</option>'
      + '      </optgroup>'
      + '      <option value="own">My own ratio</option>'
      + '    </select>'
      + '  </div>'
      + '  <p class="cm-hint cm-plaster-info" data-role="info"></p>'
      + '  <div class="cm-row">'
      + '    <label class="cm-label" for="' + f('ratio') + '">Water per 100 g plaster</label>'
      + '    <input type="number" id="' + f('ratio') + '" data-role="ratio" min="0" step="1" value="68" inputmode="decimal">'
      + '  </div>'
      + '  <div class="cm-row">'
      + '    <span class="cm-label">Units</span>'
      + '    <div class="cm-unit-toggle" role="group" aria-label="Units">'
      + '      <button type="button" class="cm-unit-btn" data-unit="mm" aria-pressed="false">mm</button>'
      + '      <button type="button" class="cm-unit-btn is-active" data-unit="cm" aria-pressed="true">cm</button>'
      + '      <button type="button" class="cm-unit-btn" data-unit="in" aria-pressed="false">in</button>'
      + '    </div>'
      + '  </div>'
      + '  <div class="cm-dims">'
      + '    <div class="cm-dim" data-box>'
      + '      <label class="cm-dim-label" for="' + f('len') + '" data-unit-label="Length">Length (cm)</label>'
      + '      <input type="number" class="cm-dim-input" id="' + f('len') + '" data-role="len" min="0" step="0.1" inputmode="decimal" placeholder="e.g. 14">'
      + '    </div>'
      + '    <div class="cm-dim" data-box>'
      + '      <label class="cm-dim-label" for="' + f('wid') + '" data-unit-label="Width">Width (cm)</label>'
      + '      <input type="number" class="cm-dim-input" id="' + f('wid') + '" data-role="wid" min="0" step="0.1" inputmode="decimal" placeholder="e.g. 14">'
      + '    </div>'
      + '    <div class="cm-dim" data-round hidden>'
      + '      <label class="cm-dim-label" for="' + f('dia') + '" data-unit-label="Diameter">Diameter (cm)</label>'
      + '      <input type="number" class="cm-dim-input" id="' + f('dia') + '" data-role="dia" min="0" step="0.1" inputmode="decimal" placeholder="e.g. 14">'
      + '    </div>'
      + '    <div class="cm-dim">'
      + '      <label class="cm-dim-label" for="' + f('dep') + '" data-unit-label="Plaster depth">Plaster depth (cm)</label>'
      + '      <input type="number" class="cm-dim-input" id="' + f('dep') + '" data-role="dep" min="0" step="0.1" inputmode="decimal" placeholder="e.g. 12">'
      + '    </div>'
      + '    <div class="cm-dim">'
      + '      <label class="cm-dim-label" for="' + f('model') + '">Model volume (ml)</label>'
      + '      <input type="number" class="cm-dim-input" id="' + f('model') + '" data-role="model" min="0" step="1" inputmode="decimal" placeholder="optional">'
      + '    </div>'
      + '    <div class="cm-dim">'
      + '      <label class="cm-dim-label" for="' + f('waste') + '">Extra for waste (%)</label>'
      + '      <input type="number" class="cm-dim-input" id="' + f('waste') + '" data-role="waste" min="0" max="100" step="1" value="' + WASTE + '" inputmode="decimal">'
      + '    </div>'
      + '  </div>'
      + '  <p class="cm-hint">Measure inside the mould box or cottle, and how deep the plaster will go. To find a model\'s volume, lower it into a measuring jug of water until it\'s just covered: the rise in ml is its volume.</p>'
      + '  <div class="cm-results">'
      + '    <p class="cm-results-title">Mix this:</p>'
      + '    <ul class="cm-results-list"></ul>'
      + '    <p class="cm-results-note" data-role="note"></p>'
      + '  </div>'
      + '  <p class="cm-sr" aria-live="polite" aria-atomic="true" data-role="sr"></p>'
      + '  <p class="cm-disclaimer">This is a guide to help you plan a pour, not a guarantee. Plasters vary, so check the ratio on your own bag or datasheet and weigh both the plaster and the water. Ceramind Tools can\'t accept responsibility for decisions based on these results.</p>'
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
    root.innerHTML = template('cmpm' + uid);

    var shape = 'box';
    var unit = 'cm';
    var srTimer;
    var ready = false;   // no read-out for the first, untouched render

    function q(sel) { return root.querySelector(sel); }
    function qa(sel) { return root.querySelectorAll(sel); }
    var plaster = q('[data-role="plaster"]');
    var info = q('[data-role="info"]');
    var ratio = q('[data-role="ratio"]');
    var len = q('[data-role="len"]');
    var wid = q('[data-role="wid"]');
    var dia = q('[data-role="dia"]');
    var dep = q('[data-role="dep"]');
    var model = q('[data-role="model"]');
    var waste = q('[data-role="waste"]');
    var list = q('.cm-results-list');
    var note = q('[data-role="note"]');
    var sr = q('[data-role="sr"]');

    function num(el) {
      var n = parseFloat(el.value);
      return isNaN(n) || n <= 0 ? NaN : n;
    }

    function fmt(n, dp) {
      return n.toLocaleString('en-GB', { minimumFractionDigits: dp, maximumFractionDigits: dp });
    }

    function trim(n) {
      // 68 -> "68", 76.9 -> "76.9", up to 2 decimals
      return String(Math.round(n * 100) / 100);
    }

    function grams(g) {
      if (g < 1) return 'under 1' + NB + 'g';
      if (Math.round(g) < 10000) return fmt(Math.round(g), 0) + NB + 'g';
      return fmt(g / 1000, 1) + NB + 'kg';
    }

    function waterText(g) {
      // water: 1 g = 1 ml
      if (g < 1) return 'under 1' + NB + 'g (under 1' + NB + 'ml)';
      if (Math.round(g) < 10000) return fmt(Math.round(g), 0) + NB + 'g (' + fmt(Math.round(g), 0) + NB + 'ml)';
      return fmt(g / 1000, 1) + NB + 'kg (' + fmt(g / 1000, 1) + NB + 'litres)';
    }

    function vol(ml) {
      if (ml < 0.5) return 'under 1' + NB + 'ml';
      if (Math.round(ml) < 1000) return fmt(Math.round(ml), 0) + NB + 'ml';
      if (ml < 9995) return fmt(ml / 1000, 2) + NB + 'litres';
      return fmt(ml / 1000, 1) + NB + 'litres';
    }

    function joinAnd(items) {
      if (items.length < 2) return items.join('');
      return items.slice(0, -1).join(', ') + ' and ' + items[items.length - 1];
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

    function stop(text) {
      list.innerHTML = '';
      line(text, 'cm-results-empty');
      note.textContent = '';
      // Never let a result that was waiting to be read out follow an error: clear it, then read the error.
      sr.textContent = '';
      if (ready) announce(text);
      else clearTimeout(srTimer);
    }

    function ratioText(c) {
      return String(Math.round(c * 10) / 10);
    }

    function render() {
      qa('[data-box]').forEach(function (el) { el.hidden = shape !== 'box'; });
      qa('[data-round]').forEach(function (el) { el.hidden = shape !== 'round'; });
      qa('[data-unit-label]').forEach(function (el) {
        el.textContent = el.getAttribute('data-unit-label') + ' (' + unit + ')';
      });
      var preset = PLASTERS[plaster.value];
      info.textContent = preset ? preset.info : OWN_INFO;

      var notes = [];

      // Water per 100 plaster. Under 1 is a fraction (0.7 = 70). 1 to 2 is kg of plaster per litre of water,
      // the way some bags word it (1.3 kg to 1 litre = 100 / 1.3 = 76.9 water per 100 plaster).
      var c = num(ratio);
      if (c < 1) {
        notes.push('Read ' + ratio.value + ' as ' + ratioText(c * 100) + ' g of water per 100 g of plaster.');
        c = c * 100;
      } else if (c <= 2) {
        c = 100 / c;
        notes.push('Read ' + ratio.value + ' as kg of plaster per litre of water: about ' + ratioText(c) + ' g of water per 100 g of plaster.');
      }

      // Sizes
      var fields = shape === 'box'
        ? [[len, 'length'], [wid, 'width'], [dep, 'plaster depth']]
        : [[dia, 'diameter'], [dep, 'plaster depth']];
      var missing = [];
      var sizes = [];
      fields.forEach(function (fd) {
        var v = num(fd[0]);
        if (isNaN(v)) missing.push(fd[1]);
        sizes.push(v);
      });
      if (isNaN(c)) missing.push('water per 100 g plaster');
      if (missing.length) {
        stop('Enter your ' + joinAnd(missing) + '.');
        return;
      }
      if (c < 20 || c > 100) {
        stop('Check the water per 100 g plaster: it should be between 20 and 100, and it\'s on the bag or the datasheet. You can also type kg of plaster per litre of water, such as 1.3.');
        return;
      }

      function spaceMl(toCm) {
        var cm = sizes.map(function (s) { return s * toCm; });
        return shape === 'box' ? cm[0] * cm[1] * cm[2] : Math.PI * (cm[0] / 2) * (cm[0] / 2) * cm[1];   // ml = cm3
      }
      var space = spaceMl(TO_CM[unit]);
      if (space > MAX_ML) {
        // e.g. 140 x 140 x 120 typed in mm while cm is selected: 2,352 litres. Ask rather than guess.
        var big = 'That\'s ' + fmt(Math.round(space / 1000), 0) + NB + 'litres, far more than a mould or slab needs. ';
        stop(big + (unit === 'cm' ? 'If your sizes are in mm, switch to mm.'
          : unit === 'in' ? 'Check your sizes are in inches, not cm or mm.' : 'Check your sizes.'));
        return;
      }
      if (unit === 'mm' && space < 5) {
        notes.push('That\'s only ' + vol(space) + '. If your sizes are in cm, switch to cm.');
      }

      // Model
      var m = num(model);
      if (m < 1) {
        notes.push('Read ' + model.value + ' as litres: ' + vol(m * 1000) + '.');
        m = m * 1000;
      }
      if (isNaN(m)) m = 0;
      if (m >= space) {
        stop('The model (' + vol(m) + ') is as big as the space to fill (' + vol(space) + '). Check the model volume and your sizes.');
        return;
      }

      // Extra for waste
      var w = parseFloat(waste.value);
      if (isNaN(w) || w <= 0) {
        if (w < 0) notes.push('Extra for waste can\'t be negative, so none is added.');
        w = 0;
      } else if (w > 100) {
        notes.push('Extra for waste is capped at 100%.');
        w = 100;
      }

      var fill = space - m;
      var mix = fill * (1 + w / 100);
      var dry = mix / (c / 100 + 1 / PLASTER_SG);
      var water = dry * c / 100;

      list.innerHTML = '';
      line('Plaster: ' + grams(dry));
      line('Water: ' + waterText(water));
      line('Makes: ' + vol(mix) + ' of mix');

      var name = preset && Math.abs(preset.ratio - c) < 1e-9 ? preset.name : 'Your plaster';
      var fillText = m > 0
        ? 'Space to fill: ' + vol(space) + ' less the ' + vol(m) + ' model = ' + vol(fill) + '.'
        : 'Space to fill: ' + vol(space) + '.';
      notes.push(fillText);
      notes.push(w > 0 ? 'Includes ' + trim(w) + '% extra for waste.' : 'No extra for waste included.');
      notes.push(name + ' at 100:' + ratioText(c) + ': each kg of plaster makes about ' + fmt(c / 100 + 1 / PLASTER_SG, 2) + ' litres of mix.');
      note.textContent = notes.join(' ');
      announce('Mix ' + grams(dry) + ' of plaster with ' + grams(water) + ' of water.');
    }

    qa('[data-shape]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var next = btn.getAttribute('data-shape');
        if (next === shape) return;
        shape = next;
        setPressed(qa('[data-shape]'), 'data-shape', shape);
        render();
      });
    });

    qa('[data-unit]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var next = btn.getAttribute('data-unit');
        if (next === unit) return;
        unit = next;   // the sizes stay as typed: clicking a unit usually means "these numbers are in ..."
        setPressed(qa('[data-unit]'), 'data-unit', unit);
        render();
      });
    });

    plaster.addEventListener('change', function () {
      var preset = PLASTERS[plaster.value];
      if (preset) ratio.value = preset.ratio;
      render();
    });

    ratio.addEventListener('input', function () {
      var v = parseFloat(ratio.value);
      var match = 'own';
      Object.keys(PLASTERS).forEach(function (k) { if (PLASTERS[k].ratio === v) match = k; });
      plaster.value = match;
    });

    [ratio, len, wid, dia, dep, model, waste].forEach(function (el) {
      el.addEventListener('input', render);
    });

    render();
    ready = true;
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
