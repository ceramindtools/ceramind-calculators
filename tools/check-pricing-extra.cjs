// Extra click tests for the pricing calculator: checks text OUTSIDE the results box
// (hints, the breakdown chart, the screen-reader line) and which controls are shown.
// tools/check.cjs is shared and only reads .cm-results, so this sits beside it.
//
//   node tools/check-pricing-extra.cjs <url> tests/pricing-extra.json
//
// Each case: { "name", "do": [[select|fill|click|press, sel, value]], "attrs": [[sel, attribute, value]], "wait": ms, "in": selector (inside the root),
//              "expect": [...], "absent": [...], "hidden": [selectors], "visible": [selectors],
//              "links": [[link text, part of its href]] }
const path = require("path");
const os = require("os");
const fs = require("fs");
const PW = process.env.PW || path.join(os.homedir(), "Desktop/Project Management/node_modules/playwright");
const CHROME = process.env.CHROME || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const { chromium } = require(PW);

(async () => {
  const [url, testFile] = process.argv.slice(2);
  const spec = JSON.parse(fs.readFileSync(testFile, "utf8"));
  const browser = await chromium.launch({ executablePath: CHROME, headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 1000 } })).newPage();
  const errors = [];
  page.on("pageerror", e => errors.push(String(e)));
  await page.goto(url + (url.startsWith("http") ? (url.includes("?") ? "&" : "?") + "r=" + Date.now() : ""), { waitUntil: "load", timeout: 60000 });
  // the store's cookie banner and chat sit over the page: accept or hide them, as check.cjs does
  for (const label of [/accept/i, /allow all/i, /^ok$/i]) {
    const btn = page.getByRole("button", { name: label }).first();
    if (await btn.isVisible().catch(() => false)) { await btn.click().catch(() => {}); break; }
  }
  await page.addStyleTag({ content: "html{scroll-behavior:auto!important}[id*=cookie],[id*=Cookie],[class*=cookie],[class*=Cookie],cookie-banner,.mobile-dock,.jdgm-revs-tab-btn,shopify-chat{display:none!important}" });
  await page.waitForSelector(spec.root + "[data-ceramind-init=true]", { timeout: 30000 });
  const root = page.locator(spec.root).first();
  const results = [];
  for (const c of spec.cases) {
    for (const [act, sel, val] of c.do || []) {
      const el = root.locator(sel).first();
      if (act === "select") await el.selectOption(String(val));
      else if (act === "fill") await el.fill(String(val));
      else if (act === "click") await el.click();
      else if (act === "press") await el.press(String(val));
    }
    if (c.wait) await page.waitForTimeout(c.wait);
    const text = c.in ? (await root.locator(c.in).first().innerText()).replace(/\s+/g, " ") : "";
    const missing = (c.expect || []).filter(t => !text.includes(t));
    const wrong = (c.absent || []).filter(t => text.includes(t));
    for (const s of c.hidden || []) if (await root.locator(s).first().isVisible()) wrong.push("visible: " + s);
    for (const s of c.visible || []) if (!(await root.locator(s).first().isVisible())) missing.push("hidden: " + s);
    for (const [sel, attr, want] of c.attrs || []) {
      const got = await root.locator(sel).first().getAttribute(attr);
      if (got !== want) wrong.push(sel + " " + attr + "=" + got);
    }
    if (c.links) {
      // every [text, part of href] must be a visible link that opens in a new tab with rel="noopener"
      const anchors = await root.locator(c.in || ":scope").first().evaluate(box => [...box.querySelectorAll("a")]
        .filter(a => a.getClientRects().length)
        .map(a => ({ text: a.textContent.trim(), href: a.href, target: a.target, rel: a.rel })));
      for (const [t, h] of c.links) {
        if (!anchors.some(x => x.text === t && x.href.includes(h) && x.target === "_blank" && /noopener/.test(x.rel))) missing.push("link: " + t + " -> " + h);
      }
    }
    results.push({ name: c.name, ok: !missing.length && !wrong.length, missing, wrong, text: text.slice(0, 400) });
  }
  await browser.close();
  const failed = results.filter(r => !r.ok);
  console.log(JSON.stringify({ url, cases: results, errors }, null, 1));
  console.log(failed.length ? `FAILED ${failed.length}/${results.length}` : `PASSED ${results.length}/${results.length}`);
  process.exit(failed.length || errors.length ? 1 : 0);
})();
