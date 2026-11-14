/*
 * Ceramind Tools: Pottery Pricing Calculator (embeddable version)
 *
 * Paste this wherever the calculator should appear:
 *
 *   <div class="ceramind-pricing-calculator"></div>
 *   <script src="https://cdn.jsdelivr.net/gh/ceramindtools/ceramind-calculators@main/ceramind-pricing-calculator-embed.js" async></script>
 *
 * Built by build.py from src/pricing.js + src/base.css. Edit those, then run build.py.
 * Replaces the hand-made July 2026 version (own look, Fraunces font). Same maths for cost:
 * materials + firing + time, plus overhead as a % of those, plus profit as a % of cost.
 * New: wholesale and retail prices, Etsy / Shopify / card reader fees, VAT.
 *
 * Numbers used (checked 13–14 Nov 2026; full quotes in Ceramind Tools/Website/Calculators/Pottery Pricing/sources.md):
 * - Retail = 2 × wholesale ("keystone"). Etsy Seller Handbook, "How to Price Your Products for Wholesale":
 *   "Retail price = Wholesale price x 2 or more". Crafts Council guide (NCAD copy, Cornelia McCarthy):
 *   "Established retail mark-ups are normally double plus VAT."
 * - Etsy, UK bank account: listing fee 0.20 USD (about 15p: ECB rate 13 Nov 2026, 1 USD = 0.75605 GBP),
 *   transaction fee 6.5% of the order, payment processing 4% + 0.20 GBP, regulatory operating fee 0.48%
 *   (up from 0.32% on 22 June 2026). Etsy adds VAT to seller fees for UK sellers who haven't given it a
 *   VAT number. Sources: help.etsy.com fees, payment processing and regulatory operating fee articles.
 * - Etsy, US bank account: listing 0.20 USD, transaction 6.5%, processing 3% + 0.25 USD.
 * - Shopify Payments UK online card rates (shopify.com/uk/pricing): Basic 2% + 25p, Grow 1.7% + 25p,
 *   Advanced 1.5% + 25p. US (shopify.com/pricing): Basic 2.9% + 30¢, Grow 2.7% + 30¢, Advanced 2.5% + 30¢.
 * - Card readers, in person, UK: SumUp 1.69% (sumup.com/en-gb/pricing), Square 1.75% (squareup.com/gb),
 *   Zettle 1.75% (zettle.com/gb/pricing), Shopify POS 1.7% + 0p on Basic (shopify.com/uk/pricing).
 *   US: Square 2.6% + 15¢ (squareup.com/us), Shopify POS 2.6% + 10¢ on Basic (shopify.com/pricing).
 * - UK VAT: standard rate 20% (gov.uk/vat-rates). Registration threshold £90,000 taxable turnover in
 *   the last 12 months (gov.uk/register-for-vat).
 * - National Living Wage £12.71 an hour from 1 April 2026 (gov.uk/national-minimum-wage-rates).
 * - Example mug: 500 g of Potclays Premium Sanded Buff at £11.26 per 12.5 kg inc VAT (90p a kg) = 45p;
 *   100 g of glaze powder (Potclays: 20 mugs take about 2 kg) of Stoneware Matt Translucent at £56.52
 *   per 5 kg inc VAT = £1.13; firing 37p bisque + 60p glaze from our kiln calculator's own example
 *   (7 kW kiln, 20 pieces, UK price cap). 30 minutes of time, 15% overhead and 75% profit are
 *   example choices, not facts.
 */
(function () {
  var TARGET_CLASS = 'ceramind-pricing-calculator';
  var BASE_ID = 'ceramind-calc-base-v1';
  var STYLE_ID = 'ceramind-pricing-style';
  var BASE_CSS = /*@BASE_CSS@*/'';
  var EMBED_FILE = 'ceramind-pricing-calculator-embed.js';
  var KILN_URL = 'https://ceramindtools.com/pages/kiln-cost-calculator';

/*@SHARED_JS@*/

  var VAT_RATE = 0.20;        // UK standard rate
  var NLW = 12.71;            // UK National Living Wage from 1 April 2026

  // Example mug the calculator opens on (see the header for where each figure comes from)
  var EXAMPLE = { clay: '0.45', glaze: '1.13', other: '', bisque: '0.37', glazefire: '0.60', extra: '', hours: '0.5' };

  var ETSY = {
    gbp: { listing: 0.15, transaction: 6.5, processing: 4, processingFixed: 0.20, regulatory: 0.48, vatOnFees: true },
    usd: { listing: 0.20, transaction: 6.5, processing: 3, processingFixed: 0.25, regulatory: 0, vatOnFees: false }
  };
  var SHOPIFY = {
    gbp: { basic: [2, 0.25], grow: [1.7, 0.25], advanced: [1.5, 0.25] },
    usd: { basic: [2.9, 0.30], grow: [2.7, 0.30], advanced: [2.5, 0.30] }
  };
  var READERS = {
    gbp: [
      { id: 'sumup', name: 'SumUp', pct: 1.69, fixed: 0 },
      { id: 'square', name: 'Square', pct: 1.75, fixed: 0 },
      { id: 'zettle', name: 'Zettle', pct: 1.75, fixed: 0 },
      { id: 'shopifypos', name: 'Shopify POS', pct: 1.7, fixed: 0 }
    ],
    usd: [
      { id: 'square', name: 'Square', pct: 2.6, fixed: 0.15 },
      { id: 'shopifypos', name: 'Shopify POS', pct: 2.6, fixed: 0.10 }
    ]
  };

  // Chart colours: checked with the dataviz palette validator on white (lightness, chroma,
  // colour-blind and normal-vision separation of neighbours, 3:1 contrast), with and without VAT.
  var PARTS = [
    { key: 'materials', name: 'Materials', color: '#b5562f' },
    { key: 'firing', name: 'Firing', color: '#00897b' },
    { key: 'time', name: 'Your time', color: '#c08a16' },
    { key: 'overhead', name: 'Overhead', color: '#d0607a' },
    { key: 'vat', name: 'VAT', color: '#8a8a1a' },
    { key: 'fees', name: 'Fees', color: '#2f74c0' },
    { key: 'profit', name: 'Profit', color: '#4c8c2b' }
  ];

  var CSS = ''
    + '.cm-calc.cm-pricing .cm-example { margin: -0.6rem 0 1.1rem; font-size: 0.8rem; color: var(--cm-brand-soft); line-height: 1.45; }'
    + '.cm-calc.cm-pricing .cm-link-btn { font: inherit; font-weight: 600; color: var(--cm-brand); background: none; border: 0; padding: 0; margin: 0; cursor: pointer; text-decoration: underline; text-underline-offset: 2px; }'
    + '.cm-calc.cm-pricing .cm-link-btn:focus-visible { outline: 2px solid var(--cm-brand); outline-offset: 2px; }'
    + '.cm-calc.cm-pricing .cm-group { border-top: 1px solid var(--cm-border); padding-top: 0.9rem; margin: 0 0 1rem; }'
    + '.cm-calc.cm-pricing .cm-group-title { margin: 0 0 0.6rem; font-size: 0.75rem; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: var(--cm-brand); }'
    + '.cm-calc.cm-pricing .cm-group .cm-dims { margin: 0 0 0.7rem; }'
    + '.cm-calc.cm-pricing .cm-dim { display: flex; flex-direction: column; justify-content: flex-end; min-width: 0; }'
    + '.cm-calc.cm-pricing .cm-group .cm-hint { margin: 0 0 0.2rem; }'
    + '.cm-calc.cm-pricing .cm-group .cm-row + .cm-hint { margin-top: -0.4rem; }'
    + '.cm-calc.cm-pricing .cm-hint a { color: var(--cm-brand); font-weight: 600; text-decoration: underline; text-underline-offset: 2px; }'
    + '.cm-calc.cm-pricing .cm-results-list + .cm-results-title { margin-top: 0.9rem; }'
    + '.cm-calc.cm-pricing .cm-results-list li { line-height: 1.35; }'
    + '.cm-calc.cm-pricing .cm-split { background: #fff; border: 1px solid var(--cm-border); border-radius: 10px; padding: 0.9rem 1rem; margin-bottom: 1.1rem; }'
    + '.cm-calc.cm-pricing .cm-split-title { margin: 0 0 0.55rem; font-size: 0.9rem; font-weight: 700; color: var(--cm-brand); line-height: 1.3; }'
    + '.cm-calc.cm-pricing .cm-split-views { display: flex; flex-wrap: wrap; gap: 0.3rem; margin-bottom: 0.8rem; }'
    + '.cm-calc.cm-pricing .cm-split-views .cm-unit-btn { padding: 0.35rem 0.7rem; font-size: 0.78rem; }'
    + '.cm-calc.cm-pricing .cm-bar { display: flex; gap: 2px; height: 8px; border-radius: 999px; overflow: hidden; background: #fff; margin: 0 0 0.7rem; }'
    + '.cm-calc.cm-pricing .cm-seg { height: 100%; min-width: 2px; }'
    + '.cm-calc.cm-pricing .cm-split-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.25rem; }'
    + '.cm-calc.cm-pricing .cm-split-list li { display: flex; align-items: center; gap: 0.5rem; margin: 0; padding: 0; font-size: 0.82rem; line-height: 1.4; color: var(--cm-ink); }'
    + '.cm-calc.cm-pricing .cm-split-list li::before, .cm-calc.cm-pricing .cm-split-list li::marker { content: none; }'
    + '.cm-calc.cm-pricing .cm-sw { width: 10px; height: 10px; border-radius: 3px; flex: 0 0 auto; }'
    + '.cm-calc.cm-pricing .cm-sl-name { flex: 1 1 auto; color: var(--cm-brand-soft); }'
    + '.cm-calc.cm-pricing .cm-sl-amt { font-weight: 600; font-variant-numeric: tabular-nums; }'
    + '.cm-calc.cm-pricing .cm-sl-pct { min-width: 2.6rem; text-align: right; font-variant-numeric: tabular-nums; color: var(--cm-brand-soft); }'
    + '.cm-calc.cm-pricing .cm-group .cm-hint + .cm-row { margin-top: 0.9rem; }'
    + '@media (max-width: 480px) { .cm-calc.cm-pricing .cm-dims { grid-template-columns: repeat(auto-fit, minmax(84px, 1fr)); gap: 0.6rem; }'
    + '  .cm-calc.cm-pricing .cm-split-views .cm-unit-btn { padding: 0.35rem 0.55rem; } }';

  var uid = 0;

  function template(id) {
    function f(name) { return id + '-' + name; }
    function dim(role, label, value, opts) {
      opts = opts || {};
      return ''
        + '<div class="cm-dim">'
        + '<label class="cm-dim-label" for="' + f(role) + '"' + (opts.money ? ' data-money-label="' + label + '"' : '') + '>' + label + (opts.money ? ' (£)' : '') + '</label>'
        + '<input type="number" class="cm-dim-input" id="' + f(role) + '" data-role="' + role + '" min="0" step="' + (opts.step || '0.01') + '"'
        + ' value="' + value + '" inputmode="decimal"' + (opts.placeholder ? ' placeholder="' + opts.placeholder + '"' : '') + '>'
        + '</div>';
    }
    return ''
      + '<div class="cm-card">'
      + '  <h3 class="cm-title">Pottery Pricing Calculator</h3>'
      + '  <p class="cm-sub">Work out what a piece costs you to make, then what to charge: a wholesale price, a retail price, and what you keep after Etsy, Shopify or card reader fees.</p>'
      + '  <p class="cm-example"><span data-role="example-text">It opens on an example mug.</span> <button type="button" class="cm-link-btn" data-role="example">Clear the example</button></p>'
      + '  <div class="cm-row">'
      + '    <span class="cm-label">Currency</span>'
      + '    <div class="cm-unit-toggle" role="group" aria-label="Currency">'
      + '      <button type="button" class="cm-unit-btn is-active" data-cur="gbp" aria-pressed="true">£</button>'
      + '      <button type="button" class="cm-unit-btn" data-cur="usd" aria-pressed="false">$</button>'
      + '    </div>'
      + '  </div>'

      + '  <div class="cm-group" role="group" aria-labelledby="' + f('g1') + '">'
      + '    <p class="cm-group-title" id="' + f('g1') + '">Materials for this piece</p>'
      + '    <div class="cm-dims">'
      +        dim('clay', 'Clay', EXAMPLE.clay, { money: true })
      +        dim('glaze', 'Glaze', EXAMPLE.glaze, { money: true, placeholder: '0' })
      +        dim('other', 'Other', EXAMPLE.other, { money: true, placeholder: '0' })
      + '    </div>'
      + '    <p class="cm-hint">Weigh the clay you use, trimmings included. Other covers stains, decals, lustre and packaging. Our example: 500 g of clay at 90p a kg, and 100 g of glaze powder at £11.30 a kg.</p>'
      + '  </div>'

      + '  <div class="cm-group" role="group" aria-labelledby="' + f('g2') + '">'
      + '    <p class="cm-group-title" id="' + f('g2') + '">Firing, per piece</p>'
      + '    <div class="cm-dims">'
      +        dim('bisque', 'Bisque', EXAMPLE.bisque, { money: true, placeholder: '0' })
      +        dim('glazefire', 'Glaze firing', EXAMPLE.glazefire, { money: true, placeholder: '0' })
      +        dim('extra', 'Extra firings', EXAMPLE.extra, { money: true, placeholder: '0' })
      + '    </div>'
      + '    <p class="cm-hint">Your share of each firing. Work it out with our <a href="' + KILN_URL + '" target="_blank" rel="noopener">Kiln Firing Cost Calculator</a>: a 7 kW kiln holding 20 mugs comes to about 37p a mug for a bisque firing and 60p for a stoneware glaze firing.</p>'
      + '  </div>'

      + '  <div class="cm-group" role="group" aria-labelledby="' + f('g3') + '">'
      + '    <p class="cm-group-title" id="' + f('g3') + '">Your time</p>'
      + '    <div class="cm-dims">'
      +        dim('hours', 'Hours on this piece', EXAMPLE.hours, { step: '0.25' })
      +        dim('rate', 'Hourly rate', String(NLW), { money: true, step: '0.5' })
      + '    </div>'
      + '    <p class="cm-hint">Count all your hands-on time: making, trimming, glazing and packing. 30 minutes is 0.5.<span data-uk> £12.71 is the UK National Living Wage from 1 April 2026.</span></p>'
      + '  </div>'

      + '  <div class="cm-group" role="group" aria-labelledby="' + f('g4') + '">'
      + '    <p class="cm-group-title" id="' + f('g4') + '">Overhead and profit</p>'
      + '    <div class="cm-dims">'
      +        dim('overhead', 'Overhead %', '15', { step: '1' })
      +        dim('profit', 'Profit %', '75', { step: '5' })
      +        dim('mult', 'Retail ×', '2', { step: '0.1' })
      + '    </div>'
      + '    <p class="cm-hint">Overhead is studio rent, power, tools, insurance and stall fees, as a % of the costs above. Cost plus profit is your wholesale price. Shops usually sell at 2 × wholesale (Retail × 2), so charge that retail price everywhere you sell.</p>'
      + '    <div class="cm-row">'
      + '      <label class="cm-label" for="' + f('round') + '">Round prices up to</label>'
      + '      <select id="' + f('round') + '" data-role="round">'
      + '        <option value="0">No rounding</option>'
      + '        <option value="0.1">10p</option>'
      + '        <option value="0.5">50p</option>'
      + '        <option value="1" selected>£1</option>'
      + '        <option value="5">£5</option>'
      + '      </select>'
      + '    </div>'
      + '    <div class="cm-row" data-uk>'
      + '      <span class="cm-label">VAT registered</span>'
      + '      <div class="cm-unit-toggle" role="group" aria-label="VAT registered">'
      + '        <button type="button" class="cm-unit-btn is-active" data-vat="no" aria-pressed="true">No</button>'
      + '        <button type="button" class="cm-unit-btn" data-vat="yes" aria-pressed="false">Yes</button>'
      + '      </div>'
      + '    </div>'
      + '    <p class="cm-hint" data-uk>Only VAT-registered sellers add 20% VAT. You must register once your taxable turnover goes over £90,000 in 12 months. If you\'re registered, enter your costs without VAT.</p>'
      + '  </div>'

      + '  <div class="cm-group" role="group" aria-labelledby="' + f('g5') + '">'
      + '    <p class="cm-group-title" id="' + f('g5') + '">Selling fees</p>'
      + '    <div class="cm-row">'
      + '      <label class="cm-label" for="' + f('shopify') + '">Shopify plan</label>'
      + '      <select id="' + f('shopify') + '" data-role="shopify"></select>'
      + '    </div>'
      + '    <div class="cm-row">'
      + '      <label class="cm-label" for="' + f('reader') + '">Card reader</label>'
      + '      <select id="' + f('reader') + '" data-role="reader"></select>'
      + '    </div>'
      + '    <div class="cm-row">'
      + '      <label class="cm-label" for="' + f('readerpct') + '">Card reader fee %</label>'
      + '      <input type="number" id="' + f('readerpct') + '" data-role="readerpct" min="0" max="100" step="0.01" inputmode="decimal">'
      + '    </div>'
      + '    <p class="cm-hint" data-role="fee-hint"></p>'
      + '  </div>'

      + '  <div class="cm-results">'
      + '    <p class="cm-results-title">Your prices</p>'
      + '    <ul class="cm-results-list" data-role="prices"></ul>'
      + '    <p class="cm-results-title" data-role="sell-title"></p>'
      + '    <ul class="cm-results-list" data-role="channels"></ul>'
      + '    <p class="cm-results-note" data-role="note"></p>'
      + '  </div>'

      + '  <div class="cm-split" data-role="split">'
      + '    <p class="cm-split-title" data-role="split-title"></p>'
      + '    <div class="cm-split-views" role="group" aria-label="Show the split for">'
      + '      <button type="button" class="cm-unit-btn" data-view="wholesale" aria-pressed="false">Wholesale</button>'
      + '      <button type="button" class="cm-unit-btn is-active" data-view="etsy" aria-pressed="true">Etsy</button>'
      + '      <button type="button" class="cm-unit-btn" data-view="shopify" aria-pressed="false">Shopify</button>'
      + '      <button type="button" class="cm-unit-btn" data-view="reader" aria-pressed="false">Card reader</button>'
      + '    </div>'
      + '    <div class="cm-bar" role="img" data-role="bar"></div>'
      + '    <ul class="cm-split-list" data-role="split-list"></ul>'
      + '  </div>'

      + '  <p class="cm-sr" aria-live="polite" aria-atomic="true" data-role="sr"></p>'
      + '  <p class="cm-disclaimer">This is a guide to help you set prices, not financial or tax advice. Platform fees change, so check each one\'s fee page, and ask HMRC or an accountant about VAT. Ceramind Tools can\'t accept responsibility for decisions based on these results.</p>'
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
    root.classList.add('cm-calc', 'cm-pricing');
    uid += 1;
    root.innerHTML = template('cmpr' + uid);

    var cur = 'gbp';
    var vatOn = false;
    var view = 'etsy';
    var cleared = false;
    var readerState = { gbp: { sel: 'sumup', pct: '1.69' }, usd: { sel: 'square', pct: '2.6' } };
    var srTimer;

    function q(sel) { return root.querySelector(sel); }
    function qa(sel) { return root.querySelectorAll(sel); }
    var el = {};
    ['clay', 'glaze', 'other', 'bisque', 'glazefire', 'extra', 'hours', 'rate', 'overhead', 'profit', 'mult',
      'round', 'shopify', 'reader', 'readerpct', 'prices', 'channels', 'sell-title', 'note', 'split', 'split-title',
      'bar', 'split-list', 'sr', 'fee-hint', 'example', 'example-text'].forEach(function (r) { el[r] = q('[data-role="' + r + '"]'); });

    function fmt(n, dp) {
      return n.toLocaleString('en-GB', { minimumFractionDigits: dp, maximumFractionDigits: dp });
    }
    function plain(n) {
      // 2 -> "2", 2.5 -> "2.5", 1.694 -> "1.69"
      return String(Math.round(n * 100) / 100);
    }
    function sym() { return cur === 'gbp' ? '£' : '$'; }
    function money(major) {
      // £/p and $/¢: 99.75p shows as £1.00, never 100p
      var neg = major < 0;
      var a = Math.abs(major);
      var out;
      if (Math.round(a * 100) >= 100) out = sym() + fmt(a, 2);
      else out = Math.round(a * 100) + (cur === 'gbp' ? 'p' : '¢');
      return (neg ? '−' : '') + out;
    }
    function roundUp(x, step) {
      if (!step) return x;
      return Math.round(Math.ceil(x / step - 1e-6) * step * 100) / 100;
    }

    function setPressed(btns, attr, value) {
      btns.forEach(function (b) {
        var on = b.getAttribute(attr) === value;
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
    }

    function announce(text) {
      clearTimeout(srTimer);
      srTimer = setTimeout(function () { el.sr.textContent = text; }, 700);
    }

    function addLine(list, text, cls) {
      var li = document.createElement('li');
      if (cls) li.className = cls;
      li.textContent = text;
      list.appendChild(li);
    }

    // ---- currency-dependent controls ----
    function fillShopify() {
      var keep = el.shopify.value || 'basic';
      var r = SHOPIFY[cur];
      var minor = cur === 'gbp' ? 'p' : '¢';
      el.shopify.innerHTML = ['basic', 'grow', 'advanced'].map(function (k) {
        var nm = k.charAt(0).toUpperCase() + k.slice(1);
        return '<option value="' + k + '">' + nm + ' · ' + r[k][0] + '% + ' + Math.round(r[k][1] * 100) + minor + '</option>';
      }).join('');
      el.shopify.value = keep;
    }
    function readerLabel(p) {
      return p.name + ' · ' + p.pct + '%' + (p.fixed ? ' + ' + Math.round(p.fixed * 100) + (cur === 'gbp' ? 'p' : '¢') : '');
    }
    function fillReader() {
      el.reader.innerHTML = READERS[cur].map(function (p) {
        return '<option value="' + p.id + '">' + readerLabel(p) + '</option>';
      }).join('') + '<option value="own">My own rate</option>';
      el.reader.value = readerState[cur].sel;
      el.readerpct.value = readerState[cur].pct;
    }
    function fillRound() {
      var opts = el.round.options;
      var gb = cur === 'gbp';
      opts[1].textContent = gb ? '10p' : '10¢';
      opts[2].textContent = gb ? '50p' : '50¢';
      opts[3].textContent = gb ? '£1' : '$1';
      opts[4].textContent = gb ? '£5' : '$5';
    }
    function fillLabels() {
      qa('[data-money-label]').forEach(function (l) { l.textContent = l.getAttribute('data-money-label') + ' (' + sym() + ')'; });
      el['fee-hint'].textContent = cur === 'gbp'
        ? 'Etsy UK: a 15p listing fee ($0.20), 6.5% transaction fee, 4% + 20p payment processing and a 0.48% regulatory fee, plus 20% VAT on those fees unless Etsy has your VAT number. Shopify Payments and card readers: UK card rates. Shopify POS is the Basic plan rate.'
        : 'Etsy US: a $0.20 listing fee, 6.5% transaction fee and 3% + 25¢ payment processing. Shopify Payments and card readers: US card rates. Shopify POS is the Basic plan rate.';
      qa('[data-uk]').forEach(function (n) { n.hidden = cur !== 'gbp'; });
    }
    function readerPreset() {
      var id = el.reader.value;
      for (var i = 0; i < READERS[cur].length; i++) if (READERS[cur][i].id === id) return READERS[cur][i];
      return null;
    }

    // ---- inputs ----
    function val(name) {
      var s = el[name].value;
      if (s === '' || s == null) return NaN;
      return parseFloat(s);
    }

    function render() {
      var notes = [];
      var missing = [];
      function need(name, label, allowZero) {
        var v = val(name);
        if (isNaN(v) || v < 0 || (!allowZero && v === 0)) { missing.push(label); return NaN; }
        return v;
      }
      function optional(name, label) {
        var v = val(name);
        if (isNaN(v)) return 0;
        if (v < 0) { notes.push('Read ' + el[name].value + ' ' + label + ' as 0: costs can\'t be negative.'); return 0; }
        return v;
      }

      var clay = need('clay', 'clay cost');
      var glaze = optional('glaze', 'glaze');
      var other = optional('other', 'other materials');
      var bisque = optional('bisque', 'bisque');
      var glazefire = optional('glazefire', 'glaze firing');
      var extra = optional('extra', 'extra firings');
      var hours = need('hours', 'hours on this piece');
      var rate = need('rate', 'hourly rate');
      var overheadPct = need('overhead', 'overhead %', true);
      var profitPct = need('profit', 'profit %', true);
      var mult = need('mult', 'retail multiplier');

      // usual slips: pence typed as pounds, minutes typed as hours, a mark-up typed as a multiplier
      [['clay', clay, 'of clay for one piece is a lot'], ['glaze', glaze, 'of glaze for one piece is a lot'],
        ['other', other, 'of other materials for one piece is a lot']].forEach(function (c) {
        if (c[1] >= 50) notes.push(money(c[1]) + ' ' + c[2] + '. For ' + Math.round(c[1]) + (cur === 'gbp' ? 'p' : '¢') + ', type ' + (c[1] / 100).toFixed(2) + '.');
      });
      [['bisque', bisque, 'to bisque'], ['glazefire', glazefire, 'to glaze fire'], ['extra', extra, 'for extra firings of']].forEach(function (c) {
        if (c[1] >= 25) notes.push(money(c[1]) + ' ' + c[2] + ' one piece is more than a whole kiln load usually costs. For ' + Math.round(c[1]) + (cur === 'gbp' ? 'p' : '¢') + ', type ' + (c[1] / 100).toFixed(2) + '.');
      });
      if (hours >= 24) notes.push(fmt(hours, hours % 1 ? 2 : 0) + ' hours is over a day on one piece. For minutes, divide by 60: 30 minutes is 0.5.');
      if (cur === 'gbp' && rate > 0 && rate < NLW) notes.push(money(rate) + ' an hour is below the UK National Living Wage of £12.71.');
      if (overheadPct > 100) notes.push('An overhead of ' + plain(overheadPct) + '% is more than your costs: check it.');
      if (profitPct > 0 && profitPct <= 3) notes.push('Read ' + plain(profitPct) + ' as ' + plain(profitPct) + '% profit. To double your cost, type 100.');
      if (mult >= 20) {
        notes.push('Read ' + plain(mult) + ' as a ' + plain(mult) + '% mark-up: ' + plain(1 + mult / 100) + ' × wholesale.');
        mult = 1 + mult / 100;
      } else if (mult > 0 && mult < 1) {
        notes.push('Retail can\'t be less than wholesale, so 1 × is used.');
        mult = 1;
      }

      el.prices.innerHTML = '';
      el.channels.innerHTML = '';
      if (missing.length) {
        var last = missing.pop();
        addLine(el.prices, 'Enter your ' + (missing.length ? missing.join(', ') + ' and ' : '') + last + '.', 'cm-results-empty');
        el['sell-title'].hidden = true;
        el.note.textContent = '';
        el.split.hidden = true;
        return;
      }
      el['sell-title'].hidden = false;
      el.split.hidden = false;

      var step = parseFloat(el.round.value) || 0;
      var vat = cur === 'gbp' && vatOn;
      var materials = clay + glaze + other;
      var firing = bisque + glazefire + extra;
      var time = hours * rate;
      var overhead = (materials + firing + time) * overheadPct / 100;
      var cost = materials + firing + time + overhead;
      var wholesale = roundUp(cost * (1 + profitPct / 100), step);
      var retailEx, paid, vatAmt;
      if (vat) {
        paid = roundUp(wholesale * mult * (1 + VAT_RATE), step);
        retailEx = paid / (1 + VAT_RATE);
        vatAmt = paid - retailEx;
      } else {
        paid = roundUp(wholesale * mult, step);
        retailEx = paid;
        vatAmt = 0;
      }

      // fees on the price the buyer pays
      var e = ETSY[cur];
      var etsyFees = e.listing + paid * (e.transaction + e.processing + e.regulatory) / 100 + e.processingFixed;
      if (e.vatOnFees && !vat) etsyFees *= 1 + VAT_RATE;
      var sp = SHOPIFY[cur][el.shopify.value] || SHOPIFY[cur].basic;
      var shopifyFees = paid * sp[0] / 100 + sp[1];
      var preset = readerPreset();
      var readerPct = val('readerpct');
      var readerOk = !isNaN(readerPct) && readerPct >= 0 && readerPct < 100;
      if (!isNaN(readerPct) && readerPct >= 100) notes.push('A card fee can\'t be 100% or more: check the card reader fee.');
      var readerFees = readerOk ? paid * readerPct / 100 + (preset ? preset.fixed : 0) : NaN;
      var readerName = 'Card reader' + (preset ? ' (' + preset.name + ')' : '');

      var channels = {
        etsy: { name: 'Etsy', fees: etsyFees },
        shopify: { name: 'Shopify', fees: shopifyFees },
        reader: { name: readerName, fees: readerFees }
      };
      Object.keys(channels).forEach(function (k) {
        var c = channels[k];
        c.profit = paid - vatAmt - c.fees - cost;
      });

      addLine(el.prices, 'Cost to make: ' + money(cost));
      addLine(el.prices, 'Wholesale: ' + money(wholesale) + (vat ? ' + VAT = ' + money(wholesale * (1 + VAT_RATE)) : '') + ' (' + money(wholesale - cost) + ' profit)');
      addLine(el.prices, vat
        ? 'Retail: ' + money(paid) + ' with VAT (' + money(retailEx) + ' + ' + money(vatAmt) + ' VAT)'
        : 'Retail: ' + money(paid) + ' (' + plain(mult) + ' × wholesale)');

      el['sell-title'].textContent = 'Selling at ' + money(paid);
      ['etsy', 'shopify', 'reader'].forEach(function (k) {
        var c = channels[k];
        if (isNaN(c.fees)) { addLine(el.channels, c.name + (isNaN(readerPct) ? ': enter its fee % to see this' : ': check its fee %')); return; }
        addLine(el.channels, c.name + ': ' + money(c.fees) + ' in fees, ' + (c.profit < 0 ? 'a loss of ' + money(-c.profit) : money(c.profit) + ' profit'));
      });

      if (cur === 'gbp' && !vat) notes.push('Etsy\'s fees include the 20% VAT it adds when it doesn\'t have your VAT number.');
      if (vat) notes.push('Retail is rounded with VAT in, as shoppers see it.');
      notes.push('Fees on postage aren\'t counted.');
      el.note.textContent = notes.join(' ');

      // ---- where the money goes ----
      var parts = { materials: materials, firing: firing, time: time, overhead: overhead, vat: 0, fees: 0, profit: 0 };
      var total, title;
      if (view === 'wholesale') {
        total = wholesale;
        parts.profit = wholesale - cost;
        title = 'Where ' + money(wholesale) + ' wholesale goes';
      } else {
        var c = channels[view];
        total = paid;
        parts.vat = vatAmt;
        parts.fees = isNaN(c.fees) ? 0 : c.fees;
        parts.profit = paid - vatAmt - parts.fees - cost;
        title = 'Where ' + money(paid) + ' goes ' + (view === 'reader' ? 'with a card reader' : 'on ' + c.name);
      }
      el['split-title'].textContent = title;
      var loss = parts.profit < 0 ? -parts.profit : 0;
      if (loss) parts.profit = 0;
      var barTotal = 0;
      PARTS.forEach(function (p) { barTotal += parts[p.key]; });
      el.bar.innerHTML = '';
      el['split-list'].innerHTML = '';
      var labels = [];
      PARTS.forEach(function (p) {
        var amt = parts[p.key];
        if (p.key === 'vat' && !(vat && view !== 'wholesale')) return;
        if (p.key === 'fees' && view === 'wholesale') return;
        var pct = barTotal > 0 ? amt / barTotal * 100 : 0;
        if (amt > 0.004) {
          var seg = document.createElement('span');
          seg.className = 'cm-seg';
          seg.style.background = p.color;
          seg.style.flex = amt + ' 1 0px';
          seg.title = p.name + ': ' + money(amt) + ' (' + Math.round(pct) + '%)';
          el.bar.appendChild(seg);
        }
        if (!(p.key === 'profit' && loss)) labels.push(p.name + ' ' + Math.round(pct) + '%');
        var li = document.createElement('li');
        li.innerHTML = '<span class="cm-sw"></span><span class="cm-sl-name"></span><span class="cm-sl-amt"></span><span class="cm-sl-pct"></span>';
        li.children[0].style.background = p.key === 'profit' && loss ? 'transparent' : p.color;
        li.children[1].textContent = p.key === 'profit' && loss ? 'Loss' : p.name;
        li.children[2].textContent = p.key === 'profit' && loss ? money(-loss) : money(amt);
        li.children[3].textContent = p.key === 'profit' && loss ? '' : Math.round(pct) + '%';
        el['split-list'].appendChild(li);
      });
      el.bar.setAttribute('aria-label', title + ': ' + labels.join(', ') + (loss ? ', a loss of ' + money(loss) : ''));

      announce('Wholesale ' + money(wholesale) + ', retail ' + money(paid) + '.');
    }

    // ---- events ----
    qa('[data-cur]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var next = btn.getAttribute('data-cur');
        if (next === cur) return;
        readerState[cur] = { sel: el.reader.value, pct: el.readerpct.value };
        cur = next;
        setPressed(qa('[data-cur]'), 'data-cur', cur);
        fillShopify();
        fillReader();
        fillRound();
        fillLabels();
        render();
      });
    });

    qa('[data-vat]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var next = btn.getAttribute('data-vat') === 'yes';
        if (next === vatOn) return;
        vatOn = next;
        setPressed(qa('[data-vat]'), 'data-vat', vatOn ? 'yes' : 'no');
        render();
      });
    });

    qa('[data-view]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var next = btn.getAttribute('data-view');
        if (next === view) return;
        view = next;
        setPressed(qa('[data-view]'), 'data-view', view);
        render();
      });
    });

    el.reader.addEventListener('change', function () {
      var p = readerPreset();
      if (p) el.readerpct.value = p.pct;
      render();
    });
    el.readerpct.addEventListener('input', function () {
      var v = parseFloat(el.readerpct.value);
      var match = 'own';
      for (var i = 0; i < READERS[cur].length; i++) {
        if (Math.abs(READERS[cur][i].pct - v) < 1e-9) { match = READERS[cur][i].id; break; }
      }
      el.reader.value = match;
      render();
    });

    el.example.addEventListener('click', function () {
      cleared = !cleared;
      Object.keys(EXAMPLE).forEach(function (k) {
        el[k].value = cleared ? '' : EXAMPLE[k];
      });
      el.example.textContent = cleared ? 'Put the example back' : 'Clear the example';
      el['example-text'].textContent = cleared ? 'Add your own figures for one piece.' : 'It opens on an example mug.';
      render();
    });

    ['clay', 'glaze', 'other', 'bisque', 'glazefire', 'extra', 'hours', 'rate', 'overhead', 'profit', 'mult'].forEach(function (k) {
      el[k].addEventListener('input', render);
    });
    el.round.addEventListener('change', render);
    el.shopify.addEventListener('change', render);

    fillShopify();
    fillReader();
    fillRound();
    fillLabels();
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
