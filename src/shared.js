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
  // Prefill: a page can open a calculator on its own worked example by putting data attributes on the
  // calculator's div, e.g. <div class="ceramind-shrinkage-calculator" data-shrinkage="12" data-width="7"></div>.
  // Each calculator lists the attributes it accepts in its PREFILL map: attribute -> a field selector, or
  // { button: '<attribute of a toggle button>', values: { name: button value } }. Values go in through the same
  // click, input and change events a person makes, so every check and unit guard still runs. Unknown, empty or
  // invalid values are skipped, and a div with no attributes opens exactly as before (added 26 Nov 2026).
  function applyPrefill(root, map) {
    Object.keys(map).forEach(function (key) {
      var raw = root.getAttribute('data-' + key);
      if (raw === null) return;
      raw = String(raw).trim().replace(/"/g, '');
      if (!raw) return;
      var spec = map[key];
      if (typeof spec === 'object') {
        var btn = root.querySelector('[' + spec.button + '="' + ((spec.values && spec.values[raw]) || raw) + '"]');
        if (btn) btn.click();
        return;
      }
      var el = root.querySelector(spec);
      if (!el) return;
      if (el.tagName === 'SELECT' && !el.querySelector('option[value="' + raw + '"]')) return;
      el.value = raw;
      ['input', 'change'].forEach(function (type) {
        var ev;
        try { ev = new Event(type, { bubbles: true }); } catch (e) { ev = document.createEvent('Event'); ev.initEvent(type, true, true); }
        el.dispatchEvent(ev);
      });
    });
  }
  // ---- end shared ----
