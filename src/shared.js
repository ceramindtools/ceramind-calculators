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
