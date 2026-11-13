// Click-test and screenshot a Ceramind calculator, locally or on the real store.
//
//   node tools/check.cjs <url> <tests/name.json> <out dir>
//
// tests/<name>.json: { "root": ".ceramind-kiln-cost-calculator",
//   "cases": [ { "name": "...", "do": [["select", sel, value] | ["fill", sel, value] | ["click", sel]],
//                "expect": ["text that must appear in the results box", ...],
//                "absent": ["text that must NOT appear"] } ] }
// Cases run in order on one page, so each starts from the state the last one left.
// Needs Playwright from Project Management/node_modules and Google Chrome.
const path = require("path");
const os = require("os");
const PW = process.env.PW || path.join(os.homedir(), "Desktop/Project Management/node_modules/playwright");
const CHROME = process.env.CHROME || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const { chromium } = require(PW);
const fs = require("fs");

(async () => {
  const [url, testFile, out] = process.argv.slice(2);
  const spec = JSON.parse(fs.readFileSync(testFile, "utf8"));
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({ executablePath: CHROME, headless: true });
  const report = { url, cases: [], shots: {} };

  async function open(width, mobile) {
    const ctx = await browser.newContext({ viewport: { width, height: 1000 }, deviceScaleFactor: 2, isMobile: mobile, hasTouch: mobile });
    const page = await ctx.newPage();
    const errors = [];
    page.on("pageerror", e => errors.push(String(e)));
    page.on("console", m => { if (m.type() === "error") errors.push(m.text()); });
    await page.goto(url + (url.startsWith("http") ? (url.includes("?") ? "&" : "?") + "r=" + Date.now() : ""), { waitUntil: "load", timeout: 60000 });
    for (const label of [/accept/i, /allow all/i, /^ok$/i]) {
      const b = page.getByRole("button", { name: label }).first();
      if (await b.isVisible().catch(() => false)) { await b.click().catch(() => {}); break; }
    }
    await page.addStyleTag({ content: "html{scroll-behavior:auto!important}[id*=cookie],[class*=cookie],[class*=Cookie],.mobile-dock,.jdgm-revs-tab-btn,shopify-chat{display:none!important}" });
    await page.waitForSelector(spec.root + "[data-ceramind-init=true]", { timeout: 30000 });
    return { ctx, page, errors };
  }

  // 1. click-through cases on desktop
  const { ctx, page, errors } = await open(1280, false);
  const root = page.locator(spec.root).first();
  for (const c of spec.cases) {
    for (const [act, sel, val] of c.do || []) {
      const el = root.locator(sel).first();
      if (act === "select") await el.selectOption(String(val));
      else if (act === "fill") await el.fill(String(val));
      else if (act === "click") await el.click();
    }
    const text = (await root.locator(".cm-results").innerText()).replace(/\s+/g, " ");
    const missing = (c.expect || []).filter(t => !text.includes(t));
    const wrong = (c.absent || []).filter(t => text.includes(t));
    report.cases.push({ name: c.name, ok: !missing.length && !wrong.length, missing, wrong, results: text });
  }
  report.errors = errors;
  await ctx.close();

  // 2. screenshots of the default state, desktop and phone
  for (const [name, w, mobile] of [["desktop", 1280, false], ["phone", 390, true]]) {
    const o = await open(w, mobile);
    const el = o.page.locator(spec.root).first();
    await el.scrollIntoViewIfNeeded();
    await o.page.waitForTimeout(400);
    await el.screenshot({ path: path.join(out, `${name}.png`) });
    report.shots[name] = await o.page.evaluate(() => ({ overflow: document.documentElement.scrollWidth - window.innerWidth }));
    await o.ctx.close();
  }
  await browser.close();
  const failed = report.cases.filter(c => !c.ok);
  console.log(JSON.stringify(report, null, 1));
  console.log(failed.length ? `FAILED ${failed.length}/${report.cases.length}` : `PASSED ${report.cases.length}/${report.cases.length}`);
  process.exit(failed.length || report.errors.length ? 1 : 0);
})();
