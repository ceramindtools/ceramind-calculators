// Screen-reader line check for the plaster mix calculator: node tools/sr-plaster-mix.cjs <url>
// The aria-live line must stay quiet on an untouched page, read results, and never read a stale result after an error.
const path = require("path"), os = require("os");
const { chromium } = require(path.join(os.homedir(), "Desktop/Project Management/node_modules/playwright"));
(async () => {
  const [u] = process.argv.slice(2);
  const b = await chromium.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true });
  const p = await (await b.newContext()).newPage();
  await p.goto(u + (u.startsWith("http") ? "&r=" + Date.now() : ""), { waitUntil: "load", timeout: 60000 });
  for (const label of [/accept/i, /allow all/i]) { const x = p.getByRole("button", { name: label }).first(); if (await x.isVisible().catch(() => false)) { await x.click().catch(() => {}); break; } }
  const root = p.locator(".ceramind-plaster-mix-calculator[data-ceramind-init=true]").first();
  await root.waitFor({ timeout: 30000 });
  const sr = () => root.locator("[data-role=sr]").textContent();
  const res = [];
  const check = (name, ok, got) => { res.push(ok); console.log((ok ? "ok   " : "FAIL ") + name + " | " + JSON.stringify(got)); };
  await p.waitForTimeout(1000);
  check("untouched page says nothing", (await sr()) === "", await sr());
  await root.locator("[data-role=len]").fill("14"); await root.locator("[data-role=wid]").fill("14"); await root.locator("[data-role=dep]").fill("12");
  await p.waitForTimeout(900);
  check("result is read out", (await sr()) === "Mix 2,460 g of plaster with 1,673 g of water.", await sr());
  // a new result starts waiting, then an error arrives before it is read out
  await root.locator("[data-role=dep]").fill("10");
  await root.locator("[data-role=ratio]").fill("8");
  const seen = [];
  for (let i = 0; i < 24; i++) { seen.push(await sr()); await p.waitForTimeout(50); }
  check("old result cleared at once", seen[0] === "", seen[0]);
  check("stale result never read out", !seen.some(t => t.startsWith("Mix")), [...new Set(seen)]);
  check("error is read out", seen[seen.length - 1].startsWith("Check the water per 100 g plaster"), seen[seen.length - 1]);
  await root.locator("[data-role=ratio]").fill("68"); await root.locator("[data-role=dep]").fill("");
  await p.waitForTimeout(900);
  check("empty state is read out", (await sr()) === "Enter your plaster depth.", await sr());
  await b.close();
  console.log(res.every(Boolean) ? `SR PASSED ${res.length}/${res.length}` : "SR FAILED");
})();
