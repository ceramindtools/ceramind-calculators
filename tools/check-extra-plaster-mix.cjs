// Extra checks for the plaster mix calculator that tests/plaster-mix.json can't do (it only reads the results box):
//   node tools/check-extra-plaster-mix.cjs <url>
// 1. The aria-live line stays quiet on an untouched page, reads results, and never reads a stale result after an error.
// 2. Every source link in the calculator's own text points where sources.md says, opens in a new tab with rel=noopener,
//    and the unverified Potterycrafts figure has no link.
const path = require("path"), os = require("os");
const PW = process.env.PW || path.join(os.homedir(), "Desktop/Project Management/node_modules/playwright");
const CHROME = process.env.CHROME || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const { chromium } = require(PW);
const LINKS = {
  potclays: ["Potclays", "https://www.potclays.co.uk/potters-plaster"],
  valentine: ["Valentine Clays datasheet", "https://valentineclays.co.uk/cdn/shop/files/Potters_Plaster_Technical_Data_Sheet.pdf"],
  potterycrafts: null,
  finecast: ["Bath Potters", "https://bathpotters.co.uk/fine-casting-plaster/p1184"],
  keramicast: ["Potclays", "https://www.potclays.co.uk/keramicast-high-density-plaster"],
  crystacal: ["Bath Potters", "https://bathpotters.co.uk/crystacal-r-plaster/p1012"],
  own: null
};
const USG = ["USG plaster data", "https://www.theceramicshop.com/technical_info/Plaster/No1PotteryPlaster-DataSheet.pdf"];
(async () => {
  const [u] = process.argv.slice(2);
  const b = await chromium.launch({ executablePath: CHROME, headless: true });
  const p = await (await b.newContext()).newPage();
  await p.goto(u + (u.startsWith("http") ? (u.includes("?") ? "&" : "?") + "r=" + Date.now() : ""), { waitUntil: "load", timeout: 60000 });
  for (const label of [/accept/i, /allow all/i]) { const x = p.getByRole("button", { name: label }).first(); if (await x.isVisible().catch(() => false)) { await x.click().catch(() => {}); break; } }
  const root = p.locator(".ceramind-plaster-mix-calculator[data-ceramind-init=true]").first();
  await root.waitFor({ timeout: 30000 });
  const sr = () => root.locator("[data-role=sr]").textContent();
  const links = sel => root.locator(sel + " a").evaluateAll(as => as.map(a => [a.textContent, a.href, a.target, a.rel]));
  const res = [];
  const check = (name, ok, got) => { res.push(ok); console.log((ok ? "ok   " : "FAIL ") + name + " | " + JSON.stringify(got)); };
  const sameLink = (got, want) => want ? got.length === 1 && got[0][0] === want[0] && got[0][1] === want[1] && got[0][2] === "_blank" && got[0][3] === "noopener" : got.length === 0;

  await p.waitForTimeout(1000);
  check("untouched page says nothing", (await sr()) === "", await sr());
  for (const [key, want] of Object.entries(LINKS)) {
    await root.locator("[data-role=plaster]").selectOption(key);
    const got = await links("[data-role=info]");
    check("source link for " + key, sameLink(got, want), got);
  }
  await root.locator("[data-role=plaster]").selectOption("potclays");
  await root.locator("[data-role=len]").fill("14"); await root.locator("[data-role=wid]").fill("14"); await root.locator("[data-role=dep]").fill("12");
  check("yield links to USG", sameLink(await links("[data-role=note]"), USG), await links("[data-role=note]"));
  await p.waitForTimeout(900);
  check("result is read out", (await sr()) === "To fill 2.35 litres: 1,673 ml of water and 2,460 g of plaster, 4.13 kg in all.", await sr());
  // a new result starts waiting, then an error arrives before it is read out
  await root.locator("[data-role=dep]").fill("10");
  await root.locator("[data-role=plaster]").selectOption("own");
  await root.locator("[data-role=ratio]").fill("8");
  const seen = [];
  for (let i = 0; i < 24; i++) { seen.push(await sr()); await p.waitForTimeout(50); }
  check("old result cleared at once", seen[0] === "", seen[0]);
  check("stale result never read out", !seen.some(t => t.startsWith("To fill")), [...new Set(seen)]);
  check("error is read out", seen[seen.length - 1] === "Water per 100 g plaster should be 20 to 100. It's on the bag.", seen[seen.length - 1]);
  await root.locator("[data-role=plaster]").selectOption("potclays"); await root.locator("[data-role=dep]").fill("");
  await p.waitForTimeout(900);
  check("empty state is read out", (await sr()) === "Enter your depth.", await sr());
  await b.close();
  console.log(res.every(Boolean) ? `EXTRA PASSED ${res.length}/${res.length}` : "EXTRA FAILED");
  process.exit(res.every(Boolean) ? 0 : 1);
})();
