// Extra checks for the plaster mix calculator that tests/plaster-mix.json can't do (it only reads the results box):
//   node tools/check-extra-plaster-mix.cjs <url>
// 1. The menu has one group per stockist. Each product shows a read-only "Mixes at ..." line linking the shop's own
//    page, and a buy link with ref=ceramindtools (new tab, rel=noopener). The yield links to USG.
// 2. "Custom plaster" shows the ratio box and hides the preset line and the buy link.
// 3. The aria-live line stays quiet on an untouched page, reads results, and never reads a stale result after an error.
const path = require("path"), os = require("os");
const PW = process.env.PW || path.join(os.homedir(), "Desktop/Project Management/node_modules/playwright");
const CHROME = process.env.CHROME || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const { chromium } = require(PW);
// [menu line, source link [text, url], buy link [text, href with ref]] for a sample of products, incl. both shops' formats
const BP = "https://www.bathpotters.co.uk/crystacal-r-plaster/p1012";
const HC = "https://www.hot-clay.com/products/potters-plaster";
const CK = "https://corbykilns.co.uk/product/3450-potters-plaster-25-kg/";
const CR = "https://www.cromartiehobbycraft.co.uk/Catalogue/Throwing-Clay-Modelling-Clay-and-Pottery-Casting-Slip/Potters-Plaster-Alginate-Plaster-of-Paris/Potters-Plaster-Fine-Casting-Plus-25kg-CH2045";
const PC = "https://www.potclays.co.uk/oxides-basic-materials-basic-materials/potters-plaster/";
const PRESETS = {
  "pc-potters": ["Mixes at 100:68 (Potclays)", ["Potclays", PC], ["Buy Potters Plaster 3450 (25 kg) from Potclays →", PC + "?ref=ceramindtools"]],
  "hc-potters": ["Mixes at 100:68 (Hot Clay)", ["Hot Clay", HC], ["Buy Potters Plaster (2.5 or 25 kg) from Hot Clay →", HC + "?ref=ceramindtools"]],
  "ck-potters-25": ["Mixes at 120 plaster to 100 water, about 100:83 (Corby Kilns)", ["Corby Kilns", CK], ["Buy 3450 Potters Plaster (25 kg) from Corby Kilns →", CK + "?ref=ceramindtools"]],
  "bp-crystacal": ["Mixes at 100:35 (Bath Potters Supplies)", ["Bath Potters Supplies", BP], ["Buy Crystacal R Plaster (1 to 25 kg) from Bath Potters Supplies →", BP + "?ref=ceramindtools"]],
  "cr-finecastplus": ["No weight ratio given (Cromartie Hobbycraft). Choose Custom plaster and use the ratio on your bag.", ["Cromartie Hobbycraft", CR], ["Buy Fine Casting Plus (25 kg) from Cromartie Hobbycraft →", CR + "?ref=ceramindtools"]]
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
  const groups = await sel.locator("optgroup").evaluateAll(gs => gs.map(g => g.label));
  check("one menu group per stockist", JSON.stringify(groups) === JSON.stringify(["Bath Potters Supplies", "Corby Kilns", "Cromartie Hobbycraft", "Hot Clay", "Potclays", "Sedgefield Pottery Supplies", "Ulster Ceramics"]), groups);
  check("default is Potclays Potters Plaster", (await sel.inputValue()) === "pc-potters", await sel.inputValue());
  const buyLinks = () => root.locator("[data-role=buy] a").evaluateAll(as => as.map(a => [a.textContent, a.getAttribute("href"), a.target, a.rel]));
  for (const [key, [text, want, buyWant]] of Object.entries(PRESETS)) {
    await sel.selectOption(key);
    const got = await links("[data-role=info]");
    const t = await info.innerText();
    check(key + ": line and source link", t === text && sameLink(got, want) && !(await ratio.isVisible()), [t, got]);
    const bl = await buyLinks();
    check(key + ": buy link with ref=ceramindtools", bl.length === 1 && bl[0][0] === buyWant[0] && bl[0][1] === buyWant[1] && bl[0][2] === "_blank" && bl[0][3] === "noopener", bl);
  }
  await sel.selectOption("custom");
  check("Custom plaster shows the ratio box, hides the preset line and the buy link",
    (await ratio.isVisible()) && !(await info.isVisible()) && !(await root.locator("[data-role=buy]").isVisible()), "");
  await ratio.fill("68"); await ratio.press("Tab");
  check("a typed ratio stays Custom plaster (several shops share 100:68)", (await sel.inputValue()) === "custom", await sel.inputValue());

  await sel.selectOption("pc-potters");
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
  await sel.selectOption("pc-potters"); await root.locator("[data-role=vol]").fill("");
  await p.waitForTimeout(900);
  check("empty state is read out", (await sr()) === "Enter the volume to fill.", await sr());
  await b.close();
  console.log(res.every(Boolean) ? `EXTRA PASSED ${res.length}/${res.length}` : "EXTRA FAILED");
  process.exit(res.every(Boolean) ? 0 : 1);
})();
