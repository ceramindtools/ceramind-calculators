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
 * Kept simple on purpose (Gabriel, 14 Nov 2026): you know the volume to fill; it tells you the plaster (weight)
 * and the water (volume) to mix, plus extra for what sticks to the bucket. No shapes or sizes.
 *
 * The maths:
 *   mix (ml)       = volume to fill x (1 + extra/100) extra for what stays in the bucket and on the tools, default 10%
 *   plaster (g)    = mix / (C/100 + 1/2.69)           C = parts water per 100 parts plaster, by weight
 *   water (ml = g) = plaster x C/100
 *
 * Numbers used:
 * - 2.69 g per ml: how much room the plaster powder itself takes up once it is wet. Worked back from USG's
 *   No. 1 Pottery Plaster datasheet: mixed at 70 water to 100 plaster it weighs 99 lb/cu ft wet (1,586 kg/m3),
 *   so 100 g plaster + 70 g water fill 170 / 1.586 = 107.2 ml, of which the water is 70 ml and the plaster 37.2 ml.
 *   USG's gypsum cement chart gives the same figure within 1% for its harder plasters (White Hydrocal 110 lb/cu ft
 *   at 45, Ultracal 30 115 lb/cu ft at 38), so it holds for low ratios like Crystacal R too.
 *   Cross-check: Derek Au (plaster.glazy.org) poured 15 kg No. 1 Pottery Plaster + 10.5 kg water and measured
 *   15,860 cm3, i.e. 1.057 litres per kg. This formula gives 1.072 litres per kg at 70, 1.4% more.
 * - The menu lists the plasters sold by the shops that stock Ceramind tools (16 Nov 2026), each with the
 *   water per 100 plaster (by weight) from that shop's own product page:
 *   Bath Potters Supplies: Potters Plaster 100/68, Fine Casting Plaster 100/70, Keramicast 100/56,
 *     Newcast 96 100/57, Crystacal R 100/35.
 *   Corby Kilns: 3450 Potters Plaster "100 parts water to 120 parts plaster by weight" = 83.3 per 100 plaster.
 *   Cromartie Hobbycraft: Fine Casting Plus (25 kg) "1/3 plaster to 2/3 water" and Cera-Mix (1 kg) "1kg plaster to
 *     approximately 5 times water" - neither is a usable weight ratio, so both point people to Custom plaster.
 *   Hot Clay: Potters Plaster 100/68, Fine Casting Plaster 100/70, Newcast Plaster 100/57.
 *   Potclays: Potters Plaster 3450 100/68, Keramicast 3451-01 100/56.
 *   Sedgefield Pottery Supplies: Potters Plaster, water to plaster 68% by weight = 100/68.
 *   Ulster Ceramics: Fine Casting Plaster Plus 100/70.
 * - Buy links add ref=ceramindtools (URL API, so ?ref= or &ref= as needed).
 * - Typed ratios ("Custom plaster"): under 1 is a fraction (0.7 = 70); 1 to 2 is kg of plaster per litre of water
 *   (1.3 = 76.9); anything else outside 20 to 100 is refused.
 * - Volume slips: over 100 litres, or under 5 ml, stops and asks (e.g. 2350 typed with litres selected).
 * - 10% extra (default, adjustable): our own allowance for plaster left in the bucket and on tools, not a maker's
 *   figure. 0 is allowed; under 1 is read as a fraction (0.1 = 10%); over 50% gets a note.
 * Full list with quotes: Ceramind Tools/Website/Calculators/Plaster Mix/sources.md
 */
(function () {
  var TARGET_CLASS = 'ceramind-plaster-mix-calculator';
  var BASE_ID = 'ceramind-calc-base-v1';
  var STYLE_ID = 'ceramind-plaster-mix-style';
  var BASE_CSS = /*@BASE_CSS@*/'';
  var EMBED_FILE = 'ceramind-plaster-mix-calculator-embed.js';

/*@SHARED_JS@*/

  var PLASTER_SG = 2.69;   // g per ml of the plaster powder once wet (from USG's wet density, see above)
  var EXTRA = 10;          // default % extra for what stays in the bucket and on the tools (people can change it)
  var EXTRA_WARN = 50;     // above this, say it's a lot (still worked out)
  var TO_ML = { l: 1000, ml: 1 };
  var NB = ' ';       // keeps "2.35 litres" together when a line wraps
  var MAX_ML = 100000;     // over 100 litres (about 95 kg of plaster): stop and ask, it's almost always a unit slip
  var MIN_ML = 5;          // under 5 ml: stop and ask (2.35 typed with ml selected)

  var USG = 'https://www.theceramicshop.com/technical_info/Plaster/No1PotteryPlaster-DataSheet.pdf';
  // The shops that stock Ceramind tools and the plasters they sell. ratio = water per 100 plaster from the shop's own
  // product page; mix = how that page words it, when it isn't 100:x; ratio 0 = the page gives no usable weight ratio.
  // label = short menu text that fits a 320 px phone; name and pack = as the shop lists them (used in the buy link).
  var SHOPS = [
    { shop: 'Bath Potters Supplies', items: [
      { k: 'bp-potters', label: 'Potters Plaster (1-25 kg)', name: 'Potters Plaster', pack: '1 to 25 kg', ratio: 68, url: 'https://www.bathpotters.co.uk/potters-plaster/p2290' },
      { k: 'bp-finecast', label: 'Fine Casting (1-25 kg)', name: 'Fine Casting Plaster', pack: '1 to 25 kg', ratio: 70, url: 'https://www.bathpotters.co.uk/fine-casting-plaster/p1184' },
      { k: 'bp-keramicast', label: 'Keramicast (1-25 kg)', name: 'Keramicast Plaster', pack: '1 to 25 kg', ratio: 56, url: 'https://www.bathpotters.co.uk/keramicast-plaster/p1741' },
      { k: 'bp-newcast', label: 'Newcast 96 (1-25 kg)', name: 'Newcast 96 Mould Making Plaster', pack: '1 to 25 kg', ratio: 57, url: 'https://www.bathpotters.co.uk/newcast-96-mould-making-plaster/p1961' },
      { k: 'bp-crystacal', label: 'Crystacal R (1-25 kg)', name: 'Crystacal R Plaster', pack: '1 to 25 kg', ratio: 35, url: 'https://www.bathpotters.co.uk/crystacal-r-plaster/p1012' }] },
    { shop: 'Corby Kilns', items: [
      { k: 'ck-potters-25', label: '3450 Potters Plaster (25 kg)', name: '3450 Potters Plaster', pack: '25 kg', ratio: 100 / 1.2, mix: '120 plaster to 100 water, about 100:83', url: 'https://corbykilns.co.uk/product/3450-potters-plaster-25-kg/' },
      { k: 'ck-potters-12', label: '3450 Potters (12.5 kg)', name: '3450 Potters Plaster', pack: '12.5 kg', ratio: 100 / 1.2, mix: '120 plaster to 100 water, about 100:83', url: 'https://corbykilns.co.uk/product/3450-potters-plaster-12-5-kg/' }] },
    { shop: 'Cromartie Hobbycraft', items: [
      { k: 'cr-finecastplus', label: 'Fine Casting Plus (25 kg)', name: 'Fine Casting Plus', pack: '25 kg', ratio: 0, url: 'https://www.cromartiehobbycraft.co.uk/Catalogue/Throwing-Clay-Modelling-Clay-and-Pottery-Casting-Slip/Potters-Plaster-Alginate-Plaster-of-Paris/Potters-Plaster-Fine-Casting-Plus-25kg-CH2045' },
      { k: 'cr-ceramix', label: 'Cera-Mix Plaster (1 kg)', name: 'Cera-Mix Standard Casting Plaster', pack: '1 kg', ratio: 0, url: 'https://www.cromartiehobbycraft.co.uk/Catalogue/Throwing-Clay-Modelling-Clay-and-Pottery-Casting-Slip/Potters-Plaster-Alginate-Plaster-of-Paris/Cera-Mix-Standard-Casting-Plaster-1kg-CH786500' }] },
    { shop: 'Hot Clay', items: [
      { k: 'hc-potters', label: 'Potters Plaster (2.5/25 kg)', name: 'Potters Plaster', pack: '2.5 or 25 kg', ratio: 68, url: 'https://www.hot-clay.com/products/potters-plaster' },
      { k: 'hc-finecast', label: 'Fine Casting (2.5/25 kg)', name: 'Fine Casting Plaster', pack: '2.5 or 25 kg', ratio: 70, url: 'https://www.hot-clay.com/products/fine-casting-plaster' },
      { k: 'hc-newcast', label: 'Newcast (2.5/25 kg)', name: 'Newcast Plaster', pack: '2.5 or 25 kg', ratio: 57, url: 'https://www.hot-clay.com/products/newcast-plaster' }] },
    { shop: 'Potclays', items: [
      { k: 'pc-potters', label: 'Potters Plaster 3450 (25 kg)', name: 'Potters Plaster 3450', pack: '25 kg', ratio: 68, url: 'https://www.potclays.co.uk/oxides-basic-materials-basic-materials/potters-plaster/' },
      { k: 'pc-keramicast', label: 'Keramicast 3451-01 (25 kg)', name: 'Keramicast High Density Plaster', pack: '25 kg', ratio: 56, url: 'https://www.potclays.co.uk/bisque-pottery/keramicast-high-density-plaster/' }] },
    { shop: 'Sedgefield Pottery Supplies', items: [
      { k: 'sp-potters', label: 'Potters Plaster (5-200 kg)', name: 'Potters Plaster', pack: '5 to 200 kg', ratio: 68, url: 'https://sedgefieldpottery.co.uk/product/potters-plaster/' }] },
    { shop: 'Ulster Ceramics', items: [
      { k: 'uc-finecastplus', label: 'Fine Casting Plus (5/25 kg)', name: 'Fine Casting Plaster Plus', pack: '5 or 25 kg', ratio: 70, url: 'https://www.ulsterceramicspotterysupplies.co.uk/products/fine-casting-plaster-25kgs-copy' }] }
  ];
  var DEFAULT = 'pc-potters';   // Potclays Potters Plaster at 100:68 (the F13 blog figures use it)
  var PLASTERS = { custom: {} };
  SHOPS.forEach(function (g) {
    g.items.forEach(function (it) {
      it.shop = g.shop;
      PLASTERS[it.k] = it;
    });
  });

  function refLink(url) {
    // Add ref=ceramindtools, keeping any query string the page already has.
    try {
      var u = new URL(url);
      u.searchParams.set('ref', 'ceramindtools');
      return u.toString();
    } catch (e) {
      return url + (url.indexOf('?') >= 0 ? '&' : '?') + 'ref=ceramindtools';
    }
  }

  var CSS = ''
    + '.cm-calc .cm-plaster-info { margin-top: -0.45rem; }'
    + '.cm-calc .cm-vol-row { margin-bottom: 0.6rem; }'
    + '.cm-calc .cm-vol-input { display: flex; gap: 0.4rem; align-items: center; width: 100%; max-width: 260px; }'
    + '.cm-calc .cm-vol-input input[type="number"] { flex: 1 1 auto; min-width: 0; max-width: none; }'
    + '.cm-calc .cm-vol-hint { margin: 0 0 1.1rem; }'
    + '.cm-calc .cm-ratio-hint { margin-top: -0.45rem; }'
    + '.cm-calc .cm-buy { margin: -0.4rem 0 1.1rem; font-size: 0.85rem; font-weight: 600; line-height: 1.4; }'
    + '.cm-calc select.cm-plaster-select { max-width: 260px; }'
    + '@media (max-width: 480px) { .cm-calc select.cm-plaster-select { max-width: none; } }'
    + '@media (max-width: 480px) { .cm-calc .cm-vol-input { max-width: none; } }';

  var uid = 0;

  function template(id) {
    function f(name) { return id + '-' + name; }
    return ''
      + '<div class="cm-card">'
      + '  <h3 class="cm-title">Plaster Mix Calculator</h3>'
      + '  <p class="cm-sub">Enter the volume you need to fill and pick your plaster. We\'ll tell you how much plaster to weigh and how much water to measure.</p>'
      + '  <div class="cm-row cm-vol-row">'
      + '    <label class="cm-label" for="' + f('vol') + '">Volume to fill</label>'
      + '    <div class="cm-vol-input">'
      + '      <input type="number" id="' + f('vol') + '" data-role="vol" min="0" step="0.01" inputmode="decimal" placeholder="e.g. 2.35">'
      + '      <div class="cm-unit-toggle" role="group" aria-label="Volume unit">'
      + '        <button type="button" class="cm-unit-btn is-active" data-unit="l" aria-pressed="true">litres</button>'
      + '        <button type="button" class="cm-unit-btn" data-unit="ml" aria-pressed="false">ml</button>'
      + '      </div>'
      + '    </div>'
      + '  </div>'
      + '  <p class="cm-hint cm-vol-hint">Not sure? Fill the mould or box with water from a measuring jug. For a box, length × width × height in cm ÷ 1,000 = litres.</p>'
      + '  <div class="cm-row">'
      + '    <label class="cm-label" for="' + f('plaster') + '">Plaster</label>'
      + '    <select id="' + f('plaster') + '" class="cm-plaster-select" data-role="plaster">'
      + SHOPS.map(function (g) {
          return '<optgroup label="' + g.shop + '">' + g.items.map(function (it) {
            return '<option value="' + it.k + '"' + (it.k === DEFAULT ? ' selected' : '') + '>' + it.label + '</option>';
          }).join('') + '</optgroup>';
        }).join('')
      + '      <option value="custom">Custom plaster</option>'
      + '    </select>'
      + '  </div>'
      + '  <p class="cm-hint cm-plaster-info" data-role="info"></p>'
      + '  <div class="cm-row" data-custom hidden>'
      + '    <label class="cm-label" for="' + f('ratio') + '">Water per 100 g of plaster</label>'
      + '    <input type="number" id="' + f('ratio') + '" data-role="ratio" min="0" step="1" value="68" inputmode="decimal">'
      + '  </div>'
      + '  <p class="cm-hint cm-ratio-hint" data-custom hidden>Your plaster\'s bag or datasheet gives this. It\'s often written 100:70, which means 70 g (ml) of water for every 100 g of plaster.</p>'
      + '  <div class="cm-row">'
      + '    <label class="cm-label" for="' + f('extra') + '">Extra for the bucket (%)</label>'
      + '    <input type="number" id="' + f('extra') + '" data-role="extra" min="0" max="100" step="1" value="' + EXTRA + '" inputmode="decimal">'
      + '  </div>'
      + '  <div class="cm-results">'
      + '    <p class="cm-results-title">Mix this:</p>'
      + '    <ul class="cm-results-list"></ul>'
      + '    <p class="cm-results-note" data-role="note"></p>'
      + '  </div>'
      + '  <p class="cm-buy" data-role="buy"></p>'
      + '  <p class="cm-sr" aria-live="polite" aria-atomic="true" data-role="sr"></p>'
      + '  <p class="cm-disclaimer">A guide to help you plan a pour, not a guarantee. Plasters vary, so check the ratio on your own bag and weigh the plaster and water. Ceramind Tools can\'t accept responsibility for decisions based on these results.</p>'
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

  // Fill an element with plain text and, optionally, one source link (built as DOM, never as HTML).
  function textWithLink(el, before, linkText, url, after) {
    el.textContent = '';
    el.appendChild(document.createTextNode(before));
    if (linkText) {
      var a = document.createElement('a');
      a.href = url;
      a.target = '_blank';
      a.rel = 'noopener';
      a.textContent = linkText;
      el.appendChild(a);
      el.appendChild(document.createTextNode(after || ''));
    }
  }

  function initOne(root) {
    if (root.dataset.ceramindInit === 'true') return;
    root.dataset.ceramindInit = 'true';
    root.classList.add('cm-calc');
    uid += 1;
    root.innerHTML = template('cmpm' + uid);

    var unit = 'l';
    var srTimer;
    var ready = false;   // no read-out for the first, untouched render

    function q(sel) { return root.querySelector(sel); }
    function qa(sel) { return root.querySelectorAll(sel); }
    var volIn = q('[data-role="vol"]');
    var plaster = q('[data-role="plaster"]');
    var info = q('[data-role="info"]');
    var buy = q('[data-role="buy"]');
    var ratio = q('[data-role="ratio"]');
    var extraIn = q('[data-role="extra"]');
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

    function ratioText(c) {
      return String(Math.round(c * 10) / 10);
    }

    function vol(ml) {
      if (Math.round(ml) < 1000) return fmt(Math.round(ml), 0) + NB + 'ml';
      if (ml < 9995) return fmt(ml / 1000, 2) + NB + 'litres';
      return fmt(ml / 1000, 1) + NB + 'litres';
    }

    function grams(g) {
      if (Math.round(g) < 10000) return fmt(Math.round(g), 0) + NB + 'g';
      return fmt(g / 1000, 1) + NB + 'kg';
    }

    function waterText(ml) {
      // 1 ml of water weighs 1 g. Whole ml up to 10 litres, then litres to 1 decimal.
      if (Math.round(ml) < 10000) return fmt(Math.round(ml), 0) + NB + 'ml';
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

    function render() {
      var custom = plaster.value === 'custom';
      qa('[data-custom]').forEach(function (el) { el.hidden = !custom; });
      info.hidden = custom;
      var preset = PLASTERS[plaster.value];
      buy.hidden = custom;
      if (!custom) {
        textWithLink(info, preset.ratio ? 'Mixes at ' + (preset.mix || '100:' + ratioText(preset.ratio)) + ' (' : 'No weight ratio given (',
          preset.shop, preset.url, preset.ratio ? ')' : '). Choose Custom plaster and use the ratio on your bag.');
        textWithLink(buy, '', 'Buy ' + preset.name + ' (' + preset.pack + ') from ' + preset.shop + ' →', refLink(preset.url), '');
      }

      var notes = [];

      // Water per 100 plaster. Presets use their own figure; "Custom plaster" reads what was typed.
      // Under 1 is a fraction (0.7 = 70). 1 to 2 is kg of plaster per litre of water (1.3 = 100 / 1.3 = 76.9).
      if (!custom && !preset.ratio) {
        stop('Choose Custom plaster and enter the ratio from your bag.');
        return;
      }
      var c = custom ? num(ratio) : preset.ratio;
      if (custom) {
        if (c < 1) {
          notes.push('Read ' + ratio.value + ' as ' + ratioText(c * 100) + '.');
          c = c * 100;
        } else if (c <= 2) {
          c = 100 / c;
          notes.push('Read ' + ratio.value + ' as kg of plaster per litre of water (about ' + ratioText(c) + ').');
        }
      }

      // Extra for the bucket: 0 is fine; under 1 is a fraction (0.1 = 10%).
      var e = parseFloat(extraIn.value);
      if (e > 0 && e < 1) {
        notes.push('Read ' + extraIn.value + ' as ' + ratioText(e * 100) + '%.');
        e = e * 100;
      }

      var v = num(volIn);
      var missing = [];
      if (isNaN(v)) missing.push('the volume to fill');
      if (isNaN(c)) missing.push('your water per 100 g of plaster');
      if (isNaN(e) || e < 0) missing.push('the extra for the bucket (0 for none)');
      if (missing.length) {
        stop('Enter ' + joinAnd(missing) + '.');
        return;
      }
      if (c < 20 || c > 100) {
        stop('Water per 100 g of plaster should be 20 to 100. It\'s on the bag.');
        return;
      }

      var space = v * TO_ML[unit];
      if (space > MAX_ML) {
        // e.g. 2350 ml typed with litres selected: 2,350 litres. Ask rather than guess.
        stop('That\'s ' + fmt(Math.round(space / 1000), 0) + NB + 'litres. '
          + (unit === 'l' ? 'If you meant ml, switch to ml.' : 'Check the volume.'));
        return;
      }
      if (space < MIN_ML) {
        // e.g. 2.35 litres typed with ml selected
        stop('Only ' + trimMl(space) + NB + 'ml. ' + (unit === 'ml' ? 'If you meant litres, switch to litres.' : 'Check the volume.'));
        return;
      }

      var mix = space * (1 + e / 100);
      var dry = mix / (c / 100 + 1 / PLASTER_SG);
      var water = dry * c / 100;

      list.innerHTML = '';
      line('Plaster: ' + grams(dry));
      line('Water: ' + waterText(water));

      if (e > EXTRA_WARN) notes.push(ratioText(e) + '% extra is a lot. Check that\'s what you meant.');
      notes.push((e > 0 ? 'Includes ' + ratioText(e) + '% extra for what stays in the bucket and on the tools.'
        : 'No extra included for the bucket and tools.') + ' Based on ');
      textWithLink(note, notes.join(' '), 'USG plaster data', USG, '.');
      announce('Mix ' + grams(dry) + ' of plaster with ' + waterText(water) + ' of water.');
    }

    function trimMl(ml) {
      return String(Math.round(ml * 100) / 100);
    }

    qa('[data-unit]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var next = btn.getAttribute('data-unit');
        if (next === unit) return;
        unit = next;   // the number stays as typed: clicking a unit usually means "this number is in ..."
        setPressed(qa('[data-unit]'), 'data-unit', unit);
        render();
      });
    });

    plaster.addEventListener('change', function () {
      // Picking "Custom plaster" starts from the last preset's figure, so the box is never empty.
      var preset = PLASTERS[plaster.value];
      if (preset.ratio) ratio.value = ratioText(preset.ratio);
      render();
    });

    [volIn, ratio, extraIn].forEach(function (el) {
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
