/*!
 * Ceramind® Tools — Cone & Kiln Temperature Converter (embed script)
 * Usage:
 *   <div class="ceramind-cone-converter"></div>
 *   <script src=".../ceramind-cone-converter-embed.js" async></script>
 *
 * This script finds every element with the "ceramind-cone-converter" class,
 * renders the tool into it, and scopes all of its CSS under that class so it
 * cannot affect the rest of the host page. Safe to include more than once on
 * a page; each container gets its own independent instance.
 */
(function () {
  "use strict";

  var ROOT_CLASS = "ceramind-cone-converter";
  var STYLE_ID = "ceramind-cone-converter-styles";

  /* ---------------------------------------------------------------------
   * Reference data
   * Celsius values at Medium (60°C/hr) and Fast (150°C/hr) rates, adapted
   * from the Orton Ceramic Foundation self-supporting cone chart.
   * f: null means fast-rate data is not published for that cone.
   * ------------------------------------------------------------------- */
  var CONES = [
    { c: "022", m: 590, f: null, use: "China paint & overglaze decoration" },
    { c: "021", m: 617, f: null, use: "China paint & overglaze decoration" },
    { c: "020", m: 638, f: null, use: "China paint & overglaze decoration" },
    { c: "019", m: 678, f: 695, use: "China paint & overglaze decoration" },
    { c: "018", m: 715, f: 734, use: "Low-fire decorating & lustres" },
    { c: "017", m: 738, f: 763, use: "Low-fire decorating & lustres" },
    { c: "016", m: 772, f: 796, use: "Low-fire decorating & lustres" },
    { c: "015", m: 791, f: 818, use: "Low-fire decorating & lustres" },
    { c: "014", m: 807, f: 838, use: "Low-fire decorating & lustres" },
    { c: "013", m: 837, f: 861, use: "Low-fire decorating & lustres" },
    { c: "012", m: 861, f: 882, use: "Low-fire decorating & lustres" },
    { c: "011", m: 875, f: 894, use: "Low-fire decorating & lustres" },
    { c: "010", m: 903, f: 915, use: "Bisque firing (light) & low-fire glaze" },
    { c: "09", m: 920, f: 930, use: "Bisque firing & low-fire glaze" },
    { c: "08", m: 942, f: 956, use: "Bisque firing & low-fire glaze" },
    { c: "07", m: 976, f: 987, use: "Bisque firing & low-fire glaze" },
    { c: "06", m: 998, f: 1013, use: "Common bisque firing & earthenware glaze" },
    { c: "05½", m: 1015, f: 1025, use: "Earthenware glaze firing" },
    { c: "05", m: 1031, f: 1044, use: "Earthenware glaze firing" },
    { c: "04", m: 1063, f: 1077, use: "Common bisque firing & earthenware glaze" },
    { c: "03", m: 1086, f: 1104, use: "Earthenware glaze firing" },
    { c: "02", m: 1102, f: 1122, use: "Earthenware glaze firing" },
    { c: "01", m: 1119, f: 1138, use: "Low mid-range stoneware" },
    { c: "1", m: 1137, f: 1154, use: "Low mid-range stoneware" },
    { c: "2", m: 1142, f: 1164, use: "Low mid-range stoneware" },
    { c: "3", m: 1152, f: 1170, use: "Low mid-range stoneware" },
    { c: "4", m: 1162, f: 1183, use: "Mid-range stoneware" },
    { c: "5", m: 1186, f: 1207, use: "Mid-range stoneware" },
    { c: "5½", m: 1203, f: 1225, use: "Mid-range stoneware" },
    { c: "6", m: 1222, f: 1243, use: "Most common mid-fire glaze (electric kilns)" },
    { c: "7", m: 1239, f: 1257, use: "Mid-to-high stoneware" },
    { c: "8", m: 1249, f: 1271, use: "Mid-to-high stoneware" },
    { c: "9", m: 1260, f: 1280, use: "High-fire stoneware & porcelain" },
    { c: "10", m: 1285, f: 1305, use: "High-fire stoneware & porcelain (often reduction)" },
    { c: "11", m: 1294, f: 1315, use: "High-fire stoneware & porcelain (often reduction)" },
    { c: "12", m: 1306, f: 1326, use: "High-fire porcelain (often reduction)" }
  ];

  var GAUGE_MIN = 0;
  var GAUGE_MAX = 1350;

  /* ---------------------------------------------------------------------
   * Scoped styles — every selector is namespaced under .ceramind-cone-converter
   * so nothing here can affect the rest of the host page.
   * ------------------------------------------------------------------- */
  var CSS = "" +
  "." + ROOT_CLASS + "{" +
    "--ink:#2b2420;--clay:#473728;--parchment:#eee6d8;--card:#fbf8f2;" +
    "--ember:#a8481c;--gold:#d9a441;--sage:#556645;" +
    "--line:rgba(43,36,32,.13);--line-strong:rgba(43,36,32,.22);" +
    "max-width:600px;margin:0 auto;color:var(--ink);" +
    "font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;" +
    "font-size:15px;line-height:1.4;-webkit-font-smoothing:antialiased;" +
  "}" +
  "." + ROOT_CLASS + ", ." + ROOT_CLASS + " *{box-sizing:border-box;}" +
  "." + ROOT_CLASS + " .tool{background:var(--card);border:1px solid var(--line);border-radius:18px;overflow:hidden;box-shadow:0 1px 2px rgba(43,36,32,.06),0 10px 28px rgba(43,36,32,.07);}" +
  "." + ROOT_CLASS + " .tool-header{background:var(--clay);color:var(--parchment);padding:18px 22px;display:flex;align-items:center;gap:13px;}" +
  "." + ROOT_CLASS + " .eyebrow{margin:0;font-size:10.5px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--parchment);opacity:.68;}" +
  "." + ROOT_CLASS + " .tool-header h1{margin:3px 0 0;font-size:19px;font-weight:700;letter-spacing:-.01em;line-height:1.3;color:var(--parchment);}" +
  "." + ROOT_CLASS + " .tabs{display:flex;border-bottom:1px solid var(--line);}" +
  "." + ROOT_CLASS + " .tab-btn{flex:1;padding:13px 8px;border:none;background:transparent;font:inherit;font-weight:600;font-size:13.5px;color:rgba(43,36,32,.5);cursor:pointer;border-bottom:2.5px solid transparent;transition:color .15s ease,border-color .15s ease;}" +
  "." + ROOT_CLASS + " .tab-btn.active{color:var(--clay);border-color:var(--ember);}" +
  "." + ROOT_CLASS + " .tab-btn:focus-visible{outline:2px solid var(--ember);outline-offset:-2px;}" +
  "." + ROOT_CLASS + " .tab-btn:hover:not(.active){color:var(--ink);}" +
  "." + ROOT_CLASS + " .gauge-section{padding:20px 22px 6px;text-align:center;}" +
  "." + ROOT_CLASS + " .gauge-svg{width:100%;max-width:320px;height:auto;display:block;margin:0 auto;}" +
  "." + ROOT_CLASS + " .readouts{display:flex;align-items:baseline;justify-content:center;gap:10px;margin-top:12px;}" +
  "." + ROOT_CLASS + " .readout{display:flex;align-items:baseline;gap:3px;}" +
  "." + ROOT_CLASS + " .readout .value{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,'Liberation Mono',monospace;font-size:30px;font-weight:600;color:var(--clay);font-variant-numeric:tabular-nums;}" +
  "." + ROOT_CLASS + " .readout .unit{font-size:13px;color:rgba(43,36,32,.55);font-weight:600;}" +
  "." + ROOT_CLASS + " .rdivider{color:rgba(43,36,32,.28);font-size:18px;}" +
  "." + ROOT_CLASS + " .use-tag{margin:6px 0 0;min-height:17px;font-size:12.5px;font-weight:600;color:var(--sage);}" +
  "." + ROOT_CLASS + " .panel{padding:6px 22px 18px;}" +
  "." + ROOT_CLASS + " .field{margin-bottom:13px;}" +
  "." + ROOT_CLASS + " .field label{display:block;font-size:11.5px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:rgba(43,36,32,.55);margin-bottom:6px;}" +
  "." + ROOT_CLASS + " select, ." + ROOT_CLASS + " input[type='number']{width:100%;padding:11px 12px;border-radius:10px;border:1px solid var(--line-strong);background:#fff;font:inherit;font-size:15px;color:var(--ink);appearance:none;-webkit-appearance:none;}" +
  "." + ROOT_CLASS + " select{background-image:url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='6'><path d='M0 0l5 6 5-6z' fill='%23473728'/></svg>\");background-repeat:no-repeat;background-position:right 14px center;padding-right:32px;}" +
  "." + ROOT_CLASS + " select:focus-visible, ." + ROOT_CLASS + " input:focus-visible{outline:2px solid var(--ember);outline-offset:1px;}" +
  "." + ROOT_CLASS + " .segmented{display:flex;border:1px solid var(--line-strong);border-radius:10px;overflow:hidden;}" +
  "." + ROOT_CLASS + " .seg-btn{flex:1;padding:9px 6px;border:none;border-right:1px solid var(--line-strong);background:#fff;cursor:pointer;font:inherit;color:var(--ink);display:flex;flex-direction:column;align-items:center;gap:2px;}" +
  "." + ROOT_CLASS + " .seg-btn:last-child{border-right:none;}" +
  "." + ROOT_CLASS + " .seg-btn .seg-label{font-size:13px;font-weight:700;}" +
  "." + ROOT_CLASS + " .seg-btn .seg-sub{font-size:10px;font-weight:500;opacity:.72;}" +
  "." + ROOT_CLASS + " .seg-btn.active{background:var(--ember);color:#fff;}" +
  "." + ROOT_CLASS + " .seg-btn:focus-visible{outline:2px solid var(--ember);outline-offset:-2px;}" +
  "." + ROOT_CLASS + " .note{font-size:12px;line-height:1.5;color:var(--ember);margin:8px 0 0;}" +
  "." + ROOT_CLASS + " .convert-row{display:flex;align-items:flex-end;gap:10px;}" +
  "." + ROOT_CLASS + " .convert-row .field{flex:1;margin-bottom:0;}" +
  "." + ROOT_CLASS + " .swap-icon{font-size:17px;color:rgba(43,36,32,.38);padding-bottom:11px;line-height:1;}" +
  "." + ROOT_CLASS + " .table-details{margin:2px 22px 14px;border-top:1px solid var(--line);}" +
  "." + ROOT_CLASS + " .table-details summary{padding:13px 0;font-weight:700;font-size:13px;cursor:pointer;color:var(--clay);list-style:none;display:flex;align-items:center;gap:7px;user-select:none;}" +
  "." + ROOT_CLASS + " .table-details summary::-webkit-details-marker{display:none;}" +
  "." + ROOT_CLASS + " .table-details summary::before{content:'\\25B8';display:inline-block;transition:transform .15s ease;color:var(--ember);font-size:11px;}" +
  "." + ROOT_CLASS + " .table-details[open] summary::before{transform:rotate(90deg);}" +
  "." + ROOT_CLASS + " .table-scroll{max-height:280px;overflow:auto;border:1px solid var(--line);border-radius:10px;}" +
  "." + ROOT_CLASS + " table{width:100%;border-collapse:collapse;font-size:12px;}" +
  "." + ROOT_CLASS + " th, ." + ROOT_CLASS + " td{padding:7px 10px;text-align:right;border-bottom:1px solid var(--line);white-space:nowrap;color:var(--ink);}" +
  "." + ROOT_CLASS + " th:first-child, ." + ROOT_CLASS + " td:first-child{text-align:left;}" +
  "." + ROOT_CLASS + " thead th{position:sticky;top:0;background:var(--card);font-size:10px;text-transform:uppercase;letter-spacing:.03em;color:rgba(43,36,32,.55);border-bottom:1px solid var(--line-strong);}" +
  "." + ROOT_CLASS + " tbody tr.highlight{background:rgba(168,72,28,.12);}" +
  "." + ROOT_CLASS + " tbody tr:hover{background:rgba(43,36,32,.045);}" +
  "." + ROOT_CLASS + " .table-footnote{margin:8px 2px 0;font-size:11px;color:rgba(43,36,32,.55);line-height:1.5;}" +
  "." + ROOT_CLASS + " .disclaimer{margin:0 22px 16px;font-size:11px;line-height:1.55;color:rgba(43,36,32,.55);}" +
  "." + ROOT_CLASS + " .tool-footer{padding:13px 22px;border-top:1px solid var(--line);text-align:center;}" +
  "." + ROOT_CLASS + " .tool-footer a{font-size:12.5px;font-weight:700;color:var(--clay);text-decoration:none;}" +
  "." + ROOT_CLASS + " .tool-footer a:hover{color:var(--ember);text-decoration:underline;}" +
  "." + ROOT_CLASS + " .needle-group{transition:transform .45s cubic-bezier(.34,1.4,.4,1);}" +
  "@media (max-width:380px){" +
    "." + ROOT_CLASS + " .tool-header h1{font-size:16.5px;}" +
    "." + ROOT_CLASS + " .readout .value{font-size:25px;}" +
    "." + ROOT_CLASS + " .seg-sub{display:none;}" +
  "}" +
  "@media (prefers-reduced-motion:reduce){" +
    "." + ROOT_CLASS + " .needle-group{transition:none !important;}" +
  "}";

  /* ---------------------------------------------------------------------
   * Markup — {{uid}} is replaced with a per-instance id so multiple
   * copies of the widget on one page never collide.
   * ------------------------------------------------------------------- */
  var MARKUP = '' +
  '<div class="tool">' +
    '<header class="tool-header">' +
      '<div>' +
        '<p class="eyebrow">Pyrometric reference</p>' +
        '<h1>Cone &amp; Kiln Temperature Converter</h1>' +
      '</div>' +
    '</header>' +

    '<div class="tabs" role="tablist">' +
      '<button type="button" class="tab-btn active" data-role="tabConeBtn" role="tab" aria-selected="true" aria-controls="{{uid}}-panelCone" id="{{uid}}-tabConeBtn">Cone Chart</button>' +
      '<button type="button" class="tab-btn" data-role="tabConvertBtn" role="tab" aria-selected="false" aria-controls="{{uid}}-panelConvert" id="{{uid}}-tabConvertBtn">Quick Convert</button>' +
    '</div>' +

    '<section class="gauge-section">' +
      '<svg class="gauge-svg" viewBox="0 0 300 178" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">' +
        '<defs>' +
          '<linearGradient id="{{uid}}-gaugeGrad" x1="0" y1="0" x2="1" y2="0">' +
            '<stop offset="0%" style="stop-color:var(--sage)"/>' +
            '<stop offset="52%" style="stop-color:var(--gold)"/>' +
            '<stop offset="100%" style="stop-color:var(--ember)"/>' +
          '</linearGradient>' +
        '</defs>' +
        '<path d="M30,150 A120,120 0 0 1 270,150" fill="none" stroke="url(#{{uid}}-gaugeGrad)" stroke-width="14" stroke-linecap="round"/>' +
        '<text x="33" y="166" font-size="10.5" font-weight="700" text-anchor="start" style="fill:var(--sage)">COOL</text>' +
        '<text x="267" y="166" font-size="10.5" font-weight="700" text-anchor="end" style="fill:var(--ember)">HOT</text>' +
        '<g class="needle-group" data-role="needle" transform="rotate(-90 150 150)">' +
          '<line x1="150" y1="150" x2="150" y2="47" style="stroke:var(--clay)" stroke-width="4" stroke-linecap="round"/>' +
        '</g>' +
        '<circle cx="150" cy="150" r="9" style="fill:var(--clay)"/>' +
        '<circle cx="150" cy="150" r="3.5" style="fill:var(--card)"/>' +
      '</svg>' +
      '<div class="readouts">' +
        '<div class="readout"><span class="value" data-role="valF">—</span><span class="unit">°F</span></div>' +
        '<div class="rdivider">/</div>' +
        '<div class="readout"><span class="value" data-role="valC">—</span><span class="unit">°C</span></div>' +
      '</div>' +
      '<p class="use-tag" data-role="useTag"></p>' +
    '</section>' +

    '<section class="panel" data-role="panelCone" id="{{uid}}-panelCone">' +
      '<div class="field">' +
        '<label for="{{uid}}-coneSelect">Cone number</label>' +
        '<select id="{{uid}}-coneSelect" data-role="coneSelect"></select>' +
      '</div>' +
      '<div class="field">' +
        '<label id="{{uid}}-rateLabel">Firing rate</label>' +
        '<div class="segmented" role="group" aria-labelledby="{{uid}}-rateLabel" data-role="rateToggle">' +
          '<button type="button" class="seg-btn active" data-rate="m" aria-pressed="true">' +
            '<span class="seg-label">Medium</span>' +
            '<span class="seg-sub">108°F/hr · 60°C/hr</span>' +
          '</button>' +
          '<button type="button" class="seg-btn" data-rate="f" aria-pressed="false">' +
            '<span class="seg-label">Fast</span>' +
            '<span class="seg-sub">270°F/hr · 150°C/hr</span>' +
          '</button>' +
        '</div>' +
      '</div>' +
      '<p class="note" data-role="rateNote" hidden></p>' +
    '</section>' +

    '<section class="panel" data-role="panelConvert" id="{{uid}}-panelConvert" hidden>' +
      '<div class="convert-row">' +
        '<div class="field">' +
          '<label for="{{uid}}-inputF">Fahrenheit</label>' +
          '<input type="number" step="any" inputmode="decimal" id="{{uid}}-inputF" data-role="inputF" placeholder="e.g. 2232">' +
        '</div>' +
        '<div class="swap-icon" aria-hidden="true">⇄</div>' +
        '<div class="field">' +
          '<label for="{{uid}}-inputC">Celsius</label>' +
          '<input type="number" step="any" inputmode="decimal" id="{{uid}}-inputC" data-role="inputC" placeholder="e.g. 1222">' +
        '</div>' +
      '</div>' +
    '</section>' +

    '<details class="table-details" data-role="tableDetails">' +
      '<summary>View full cone reference chart</summary>' +
      '<div class="table-scroll">' +
        '<table>' +
          '<thead><tr><th>Cone</th><th>Medium rate</th><th>Fast rate</th></tr></thead>' +
          '<tbody data-role="tableBody"></tbody>' +
        '</table>' +
      '</div>' +
      '<p class="table-footnote">*Fast-fire data isn\'t published by Orton for cones 022–020; those rows show the medium-rate value only.</p>' +
    '</details>' +

    '<p class="disclaimer">Reference temperatures are adapted from Orton Ceramic Foundation self-supporting cone data at medium (108°F/60°C per hour) and fast (270°F/150°C per hour) firing rates. Actual results depend on your kiln, load, and firing schedule — always confirm heat-work with physical witness cones or a calibrated controller.</p>' +

    '<footer class="tool-footer">' +
      '<a href="https://www.ceramindtools.com" target="_blank" rel="noopener noreferrer">Powered by Ceramind<sup>®</sup> Tools</a>' +
    '</footer>' +
  '</div>';

  /* ---------------------------------------------------------------------
   * Logic
   * ------------------------------------------------------------------- */
  function cToF(c) { return (c * 9) / 5 + 32; }
  function fToC(f) { return ((f - 32) * 5) / 9; }
  function round(n) { return Math.round(n); }

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    var style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = CSS;
    document.head.appendChild(style);
  }

  var instanceCounter = 0;

  function initInstance(root) {
    instanceCounter += 1;
    var uid = "ccc-" + instanceCounter;
    root.innerHTML = MARKUP.split("{{uid}}").join(uid);

    var state = { rate: "m" };

    var els = {
      tabConeBtn: root.querySelector('[data-role="tabConeBtn"]'),
      tabConvertBtn: root.querySelector('[data-role="tabConvertBtn"]'),
      panelCone: root.querySelector('[data-role="panelCone"]'),
      panelConvert: root.querySelector('[data-role="panelConvert"]'),
      coneSelect: root.querySelector('[data-role="coneSelect"]'),
      rateToggle: root.querySelector('[data-role="rateToggle"]'),
      rateNote: root.querySelector('[data-role="rateNote"]'),
      inputF: root.querySelector('[data-role="inputF"]'),
      inputC: root.querySelector('[data-role="inputC"]'),
      valF: root.querySelector('[data-role="valF"]'),
      valC: root.querySelector('[data-role="valC"]'),
      useTag: root.querySelector('[data-role="useTag"]'),
      needle: root.querySelector('[data-role="needle"]'),
      tableBody: root.querySelector('[data-role="tableBody"]')
    };

    function buildConeSelect() {
      CONES.forEach(function (cone, i) {
        var opt = document.createElement("option");
        opt.value = i;
        opt.textContent = "Cone " + cone.c;
        els.coneSelect.appendChild(opt);
      });
      var defaultIndex = CONES.findIndex(function (c) { return c.c === "6"; });
      els.coneSelect.value = defaultIndex >= 0 ? defaultIndex : 0;
    }

    function buildTable() {
      CONES.forEach(function (cone, i) {
        var tr = document.createElement("tr");
        tr.dataset.index = i;
        var mF = round(cToF(cone.m));
        var fastCell = cone.f == null ? "—" : round(cToF(cone.f)) + "°F / " + cone.f + "°C";
        tr.innerHTML =
          "<td>" + cone.c + (cone.f == null ? "*" : "") + "</td>" +
          "<td>" + mF + "°F / " + cone.m + "°C</td>" +
          "<td>" + fastCell + "</td>";
        els.tableBody.appendChild(tr);
      });
    }

    function highlightRow(idx) {
      var rows = els.tableBody.querySelectorAll("tr");
      rows.forEach(function (tr) {
        tr.classList.toggle("highlight", parseInt(tr.dataset.index, 10) === idx);
      });
    }

    function updateGauge(tempC) {
      var frac = Math.max(0, Math.min(1, (tempC - GAUGE_MIN) / (GAUGE_MAX - GAUGE_MIN)));
      var angle = frac * 180 - 90;
      els.needle.setAttribute("transform", "rotate(" + angle + " 150 150)");
    }

    function updateReadout(tempC, useLabel) {
      els.valC.textContent = round(tempC).toLocaleString();
      els.valF.textContent = round(cToF(tempC)).toLocaleString();
      els.useTag.textContent = useLabel || "";
      updateGauge(tempC);
    }

    function syncConvertInputs(tempC) {
      els.inputC.value = Math.round(tempC * 10) / 10;
      els.inputF.value = Math.round(cToF(tempC) * 10) / 10;
    }

    function applyConeSelection() {
      var idx = parseInt(els.coneSelect.value, 10);
      var cone = CONES[idx];
      var wantsFast = state.rate === "f";
      var usingFallback = wantsFast && cone.f == null;
      var tempC = wantsFast && cone.f != null ? cone.f : cone.m;

      els.rateNote.hidden = !usingFallback;
      if (usingFallback) {
        els.rateNote.textContent = "Fast-fire data isn't published for cone " + cone.c + " — showing the medium-rate value.";
      }

      updateReadout(tempC, cone.use);
      highlightRow(idx);
      syncConvertInputs(tempC);
    }

    function switchTab(tab) {
      var isCone = tab === "cone";
      els.panelCone.hidden = !isCone;
      els.panelConvert.hidden = isCone;
      els.tabConeBtn.classList.toggle("active", isCone);
      els.tabConeBtn.setAttribute("aria-selected", String(isCone));
      els.tabConvertBtn.classList.toggle("active", !isCone);
      els.tabConvertBtn.setAttribute("aria-selected", String(!isCone));

      if (isCone) {
        applyConeSelection();
      } else {
        var c = parseFloat(els.inputC.value);
        if (!isNaN(c)) updateReadout(c, "");
      }
    }

    els.tabConeBtn.addEventListener("click", function () { switchTab("cone"); });
    els.tabConvertBtn.addEventListener("click", function () { switchTab("convert"); });

    els.coneSelect.addEventListener("change", applyConeSelection);

    els.rateToggle.querySelectorAll(".seg-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        state.rate = btn.dataset.rate;
        els.rateToggle.querySelectorAll(".seg-btn").forEach(function (b) {
          b.classList.toggle("active", b === btn);
          b.setAttribute("aria-pressed", String(b === btn));
        });
        applyConeSelection();
      });
    });

    els.inputF.addEventListener("input", function () {
      var f = parseFloat(els.inputF.value);
      if (!isNaN(f)) {
        var c = fToC(f);
        els.inputC.value = Math.round(c * 10) / 10;
        updateReadout(c, "");
      }
    });

    els.inputC.addEventListener("input", function () {
      var c = parseFloat(els.inputC.value);
      if (!isNaN(c)) {
        els.inputF.value = Math.round(cToF(c) * 10) / 10;
        updateReadout(c, "");
      }
    });

    buildConeSelect();
    buildTable();
    applyConeSelection();
  }

  function mountAll() {
    injectStyles();
    var containers = document.querySelectorAll("." + ROOT_CLASS);
    containers.forEach(function (root) {
      if (root.getAttribute("data-ceramind-mounted") === "true") return;
      root.setAttribute("data-ceramind-mounted", "true");
      initInstance(root);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mountAll);
  } else {
    mountAll();
  }
})();
