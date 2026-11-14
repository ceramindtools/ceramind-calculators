// Extra checks for the plaster mix calculator that tests/plaster-mix.json can't do (it only reads the results box):
//   node tools/check-extra-plaster-mix.cjs <url>
// 1. Each preset shows a small read-only "Mixes at ..." line whose source link points where sources.md says
//    (new tab, rel=noopener); the unverified Potterycrafts figure has no link; the yield links to USG.
// 2. "Custom plaster" shows the ratio box; a finished value that matches a preset picks that preset.
// 3. The aria-live line stays quiet on an untouched page, reads results, and never reads a stale result after an error.
const path = require("path"), os = require("os");
const PW = process.env.PW || path.join(os.homedir(), "Desktop/Project Management/node_modules/playwright");
const CHROME = process.env.CHROME || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const { chromium } = require(PW);
const PRESETS = {
  potclays: ["Mixes at 100:68 (Potclays)", ["Potclays", "https://www.potclays.co.uk/potters-plaster"]],
  valentine: ["Mixes at 1.3 kg to 1 litre, about 100:77 (Valentine Clays)", ["Valentine Clays", "https://valentineclays.co.uk/cdn/shop/files/Potters_Plaster_Technical_Data_Sheet.pdf"]],
  potterycrafts: ["Mixes at 940 g to 565 ml, about 100:60 (Potterycrafts)", null],
  finecast: ["Mixes at 100:70 (Bath Potters)", ["Bath Potters", "https://bathpotters.co.uk/fine-casting-plaster/p1184"]],
  keramicast: ["Mixes at 100:56 (Potclays)", ["Potclays", "https://www.potclays.co.uk/keramicast-high-density-plaster"]],
  crystacal: ["Mixes at 100:35 (Bath Potters)", ["Bath Potters", "https://bathpotters.co.uk/crystacal-r-plaster/p1012"]]
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
  const sel = root.locator("[data-role=plaster]");
  const ratio = root.locator("[data-role=ratio]");
  const info = root.locator("[data-role=info]");
  const sr = () => root.locator("[data-role=sr]").textContent();
  const links = s => root.locator(s + " a").evaluateAll(as => as.map(a => [a.textContent, a.href, a.target, a.rel]));
  const res = [];
  const check = (name, ok, got) => { res.push(ok); console.log((ok ? "ok   " : "FAIL ") + name + " | " + JSON.stringify(got)); };
  const sameLink = (got, want) => want ? got.length === 1 && got[0][0] === want[0] && got[0][1] === want[1] && got[0][2] === "_blank" && got[0][3] === "noopener" : got.length === 0;

  await p.waitForTimeout(1000);
  check("untouched page says nothing", (await sr()) === "", await sr());
  for (const [key, [text, want]] of Object.entries(PRESETS)) {
    await sel.selectOption(key);
    const got = await links("[data-role=info]");
    const t = await info.innerText();
    check(key + ": line and source link", t === text && sameLink(got, want) && !(await ratio.isVisible()), [t, got]);
  }
  await sel.selectOption("custom");
  check("Custom plaster shows the ratio box and hides the preset line", (await ratio.isVisible()) && !(await info.isVisible()), "");
  await ratio.fill("70.5"); await ratio.press("Tab");
  check("a ratio that matches no preset stays Custom plaster", (await sel.inputValue()) === "custom", await sel.inputValue());
  await ratio.fill("56"); await ratio.press("Tab");
  check("56 typed then left picks Keramicast", (await sel.inputValue()) === "keramicast" && !(await ratio.isVisible()), await sel.inputValue());

  await sel.selectOption("potclays");
  await root.locator("[data-role=vol]").fill("2.35");
  check("yield links to USG", sameLink(await links("[data-role=note]"), USG), await links("[data-role=note]"));
  await p.waitForTimeout(900);
  check("result is read out", (await sr()) === "Mix 2,458 g of plaster with 1,671 ml of water.", await sr());
  // a new result starts waiting, then an error arrives before it is read out
  await root.locator("[data-role=vol]").fill("2");
  await sel.selectOption("custom");
  await ratio.fill("8");
  const seen = [];
  for (let i = 0; i < 24; i++) { seen.push(await sr()); await p.waitForTimeout(50); }
  check("old result cleared at once", seen[0] === "", seen[0]);
  check("stale result never read out", !seen.some(t => t.startsWith("Mix")), [...new Set(seen)]);
  check("error is read out", seen[seen.length - 1] === "Water per 100 g of plaster should be 20 to 100. It's on the bag.", seen[seen.length - 1]);
  await sel.selectOption("potclays"); await root.locator("[data-role=vol]").fill("");
  await p.waitForTimeout(900);
  check("empty state is read out", (await sr()) === "Enter the volume to fill.", await sr());
  await b.close();
  console.log(res.every(Boolean) ? `EXTRA PASSED ${res.length}/${res.length}` : "EXTRA FAILED");
  process.exit(res.every(Boolean) ? 0 : 1);
})();
