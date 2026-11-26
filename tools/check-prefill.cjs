// Checks that prefilled calculators open on their blog post's worked example: node tools/check-prefill.cjs <url> <out dir>
const path = require("path"), os = require("os"), fs = require("fs");
const { chromium } = require(process.env.PW || path.join(os.homedir(), "Desktop/Project Management/node_modules/playwright"));
const CASES = {
  s1:   { expect: ["MAKE IT THIS SIZE NOW:", "Width / diameter: 7.95 cm"], clay: "own", pct: "12" },
  s3:   { expect: ["Height: 12.50 cm", "Width / diameter: 8.52 cm", "Depth: 8.41 cm"], pct: "12" },
  plain:{ expect: ["Enter at least one size above."], clay: "11", pct: "11" },
  f13:  { expect: ["2,460", "1,673"] },
  k32:  { expect: ["1,032"] },
  bad:  { expect: ["MAKE IT THIS SIZE NOW:", "Enter at least one size above."], pct: "11" },
};
(async () => {
  const [url, out] = process.argv.slice(2);
  fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" });
  let fails = 0;
  for (const [w, mobile] of [[1280, false], [390, true]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: 1000 }, isMobile: mobile, hasTouch: mobile });
    const p = await ctx.newPage(); const errors = [];
    p.on("pageerror", e => errors.push(String(e))); p.on("console", m => m.type() === "error" && errors.push(m.text()));
    await p.goto(url, { waitUntil: "load" });
    await p.waitForTimeout(1500);
    for (const [id, c] of Object.entries(CASES)) {
      const root = p.locator("#" + id);
      if (!(await root.count())) continue;
      const res = (await root.locator(".cm-results").first().innerText()).replace(/\s+/g, " ");
      const missing = c.expect.filter(t => !res.includes(t));
      const pct = c.pct ? await root.locator('[data-role="pct"]').inputValue() : null;
      const clay = c.clay ? await root.locator('[data-role="clay"]').inputValue() : null;
      const bad = missing.length || (c.pct && pct !== c.pct) || (c.clay && clay !== c.clay);
      if (bad) fails++;
      console.log(`${w}px ${id}: ${bad ? "FAIL" : "ok"}${missing.length ? " missing " + JSON.stringify(missing) : ""}${c.pct ? " pct=" + pct : ""}${c.clay ? " clay=" + clay : ""} | ${res.slice(0, 160)}`);
    }
    if (errors.length) { fails++; console.log("ERRORS", errors); }
    await p.screenshot({ path: path.join(out, `prefill-${w}.png`), fullPage: true });
    await ctx.close();
  }
  await b.close();
  console.log(fails ? `FAILED ${fails}` : "ALL PASSED");
  process.exit(fails ? 1 : 0);
})();
