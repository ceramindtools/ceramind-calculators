// Screen-reader check for the firing schedule calculator (review fix 3): an error must replace a pending
// result announcement, so a stale total is never read out.
//   node tools/check-sr-firing-schedule.cjs <url>
const path = require("path"), os = require("os");
const PW = process.env.PW || path.join(os.homedir(), "Desktop/Project Management/node_modules/playwright");
const CHROME = process.env.CHROME || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const { chromium } = require(PW);
(async () => {
  const url = process.argv[2];
  const b = await chromium.launch({ executablePath: CHROME, headless: true });
  const p = await b.newPage();
  await p.goto(url + (url.startsWith("http") ? (url.includes("?") ? "&" : "?") + "r=" + Date.now() : ""), { waitUntil: "load", timeout: 60000 });
  const root = p.locator(".ceramind-firing-schedule-calculator[data-ceramind-init=true]").first();
  await root.waitFor({ timeout: 30000 });
  const sr = root.locator("[data-role=sr]");
  const cases = [];
  async function check(name, act, want, notWant) {
    await act();
    await p.waitForTimeout(1200);
    const t = (await sr.textContent()).replace(/\s+/g, " ");
    const ok = t.includes(want) && !(notWant && t.includes(notWant));
    cases.push({ name, ok, said: t });
  }
  await check("a result is announced", async () => { await root.locator("[data-role=hold]").fill("15"); }, "Total firing time 9 h 21 min");
  await check("blank right after a change: the error replaces the pending result",
    async () => { await root.locator("[data-role=hold]").fill("20"); await root.locator("[data-role=top]").fill(""); },
    "Enter your top temperature.", "Total firing time");
  await check("too low is announced", async () => { await root.locator("[data-role=top]").fill("500"); }, "Enter a top temperature of 800°C or more.");
  await check("valid again is announced", async () => { await root.locator("[data-role=top]").fill("998"); }, "Total firing time 9 h 26 min");
  await b.close();
  console.log(JSON.stringify(cases, null, 1));
  const failed = cases.filter(c => !c.ok).length;
  console.log(failed ? `FAILED ${failed}/${cases.length}` : `PASSED ${cases.length}/${cases.length}`);
  process.exit(failed ? 1 : 0);
})();
