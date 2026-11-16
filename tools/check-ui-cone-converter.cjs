// Layout checks for the cone converter: the collapsible chart (keyboard, aria-expanded, every row against Orton),
// the source links, a bad number in the °C/°F box, and no sideways scroll on a phone with the chart open.
//   node tools/check-ui-cone-converter.cjs <url>
const path = require("path"), os = require("os");
const PW = process.env.PW || path.join(os.homedir(), "Desktop/Project Management/node_modules/playwright");
const CHROME = process.env.CHROME || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const { chromium } = require(PW);
const ORTON = "https://www.theceramicshop.com/downloads/Ortonconecharttemperatures.pdf";
const BARTLETT = "https://www.theceramicshop.com/downloads/Genesis_Manual_3-3-16.pdf";
// Orton, Self Supporting Cones, Regular, 108 and 270°F/hr, copied by hand from the chart (rows checked in tests/cone-converter.json too)
const ROWS = { "022": [1087, 1094], "019": [1252, 1283], "010": [1657, 1679], "06": [1828, 1855], "05½": [1859, 1877],
  "04": [1945, 1971], "1": [2079, 2109], "5½": [2197, 2237], "6": [2232, 2269], "10": [2345, 2381], "14": [2489, 2523] };
const C = f => Math.round((f - 32) * 5 / 9);
(async () => {
  const url = process.argv[2];
  const b = await chromium.launch({ executablePath: CHROME, headless: true });
  const out = [];
  const ok = (name, cond, info) => out.push({ name, ok: !!cond, info });
  const go = async (page) => {
    await page.goto(url + (url.startsWith("http") ? (url.includes("?") ? "&" : "?") + "r=" + Date.now() : ""), { waitUntil: "load", timeout: 60000 });
    const root = page.locator(".ceramind-cone-converter[data-ceramind-init=true]").first();
    await root.waitFor({ timeout: 30000 });
    return root;
  };
  const p = await (await b.newContext({ viewport: { width: 1280, height: 1000 } })).newPage();
  const root = await go(p);
  const btn = root.locator("[data-role=chart-btn]");
  const vis = sel => root.locator(sel).first().isVisible();
  ok("chart collapsed by default, aria-expanded=false with aria-controls",
    !(await vis("[data-role=chart]")) && (await btn.getAttribute("aria-expanded")) === "false" && !!(await btn.getAttribute("aria-controls")));
  await btn.focus(); await p.keyboard.press("Enter");
  ok("Enter opens the chart", (await btn.getAttribute("aria-expanded")) === "true" && (await vis("[data-role=chart]")));
  const rows = await root.locator("tr[data-cone]").evaluateAll(trs => trs.map(tr => [tr.dataset.cone, ...[...tr.cells].map(td => td.innerText.replace(/\s+/g, " ").trim()), tr.classList.contains("is-current")]));
  ok("38 cones, 022 to 14", rows.length === 38 && rows[0][0] === "022" && rows[37][0] === "14", rows.length);
  const wrong = [];
  for (const [cone, [a, b2]] of Object.entries(ROWS)) {
    const r = rows.find(x => x[0] === cone);
    const want = [cone, `${C(a)}°C ${a}°F`, `${C(b2)}°C ${b2}°F`];
    if (!r || [r[0], r[2], r[3]].join("|") !== want.join("|")) wrong.push({ cone, got: r && [r[0], r[2], r[3]], want });
  }
  ok("chart rows match Orton (°C rounded from Orton's °F)", !wrong.length, wrong);
  ok("the chosen cone (6) is highlighted", rows.filter(r => r[r.length - 1]).map(r => r[0]).join() === "6");
  await root.locator("[data-role=cone]").selectOption("04");
  ok("highlight follows the cone (04)", (await root.locator("tr.is-current").getAttribute("data-cone")) === "04");
  await p.keyboard.press("Tab");
  await btn.focus(); await p.keyboard.press("Space");
  ok("Space closes the chart", (await btn.getAttribute("aria-expanded")) === "false" && !(await vis("[data-role=chart]")));
  const links = await root.evaluate(el => [...el.querySelectorAll(".cm-hint a, .cm-results a, .cm-chart-src a")].map(a => ({ t: a.textContent, href: a.href, ok: a.target === "_blank" && a.rel === "noopener" })));
  ok("source links: Bartlett and Orton, new tab, rel=noopener",
    links.some(l => l.href === BARTLETT && l.ok) && links.filter(l => l.href === ORTON && l.ok).length === 2 && links.every(l => l.ok), links);
  await root.locator("[data-mode=convert]").click();
  ok("°C ↔ °F hides the cone inputs", !(await vis("[data-role=cone]")) && (await vis("[data-role=temp]")));
  await root.locator("[data-role=temp]").focus();
  await p.keyboard.type("12e");
  const bad = (await root.locator(".cm-results").innerText()).replace(/\s+/g, " ");
  ok("a number the browser can't read asks for a plain number", bad.includes("Type the temperature as a plain number, like 1222.") && !bad.includes(" = "), bad);
  await p.context().close();

  // Phone, chart open: nothing scrolls sideways
  const ctx = await b.newContext({ viewport: { width: 390, height: 900 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const m = await ctx.newPage();
  const mroot = await go(m);
  await mroot.locator("[data-role=chart-btn]").click();
  await m.waitForTimeout(300);
  const ov = await m.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  const tbl = await mroot.locator(".cm-table-wrap").evaluate(el => el.scrollWidth - el.clientWidth);
  ok("phone 390 with the chart open: no sideways scroll", ov === 0 && tbl <= 0, { page: ov, table: tbl });
  if (process.argv[3]) await mroot.screenshot({ path: process.argv[3] });
  await b.close();
  console.log(JSON.stringify(out, null, 1));
  const failed = out.filter(c => !c.ok).length;
  console.log(failed ? `FAILED ${failed}/${out.length}` : `PASSED ${out.length}/${out.length}`);
  process.exit(failed ? 1 : 0);
})();
