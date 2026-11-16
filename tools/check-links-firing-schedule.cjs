// Source links in the firing schedule calculator's own text: right page, new tab, rel=noopener.
//   node tools/check-links-firing-schedule.cjs <url>
const path = require("path"), os = require("os");
const PW = process.env.PW || path.join(os.homedir(), "Desktop/Project Management/node_modules/playwright");
const CHROME = process.env.CHROME || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const { chromium } = require(PW);
const B = "https://www.theceramicshop.com/downloads/Genesis_Manual_3-3-16.pdf";
const O = "https://www.theceramicshop.com/downloads/Ortonconecharttemperatures.pdf";
const P = "https://www.potclays.co.uk/clay-questions/what-is-the-optimum-firing-rate-to-use/";
const DF = "https://digitalfire.com/schedule/";
(async () => {
  const url = process.argv[2];
  const b = await chromium.launch({ executablePath: CHROME, headless: true });
  const p = await b.newPage();
  await p.goto(url + (url.startsWith("http") ? (url.includes("?") ? "&" : "?") + "r=" + Date.now() : ""), { waitUntil: "load", timeout: 60000 });
  const root = p.locator(".ceramind-firing-schedule-calculator[data-ceramind-init=true]").first();
  await root.waitFor({ timeout: 30000 });
  const links = () => root.evaluate(el => [...el.querySelectorAll(".cm-results a, [data-role=ware-hint] a")].map(a => ({ t: a.textContent, href: a.href, ok: a.target === "_blank" && a.rel === "noopener" })));
  const states = [
    ["bisque default", [], { 'Bartlett\'s "Med/Slow" kiln controller preset': B, "Orton's self-supporting figure": O }],
    ["mid-fire thin (Fast caution)", [["select", "[data-role=firing]", "midfire"], ["click", "[data-thick=thin]"]],
      { "Bartlett": B, "Potclays": P, 'Bartlett\'s "Fast" kiln controller preset': B, "Orton's self-supporting figure": O }],
    ["mid-fire drop and hold", [["click", "[data-thick=normal]"], ["select", "[data-role=cool]", "drop"]], { "PLC6DS schedule": DF + "plc6ds" }],
    ["mid-fire slow cool", [["select", "[data-role=cool]", "slow"]], { "C6DHSC schedule": DF + "c6dhsc", "Digitalfire": DF + "c6dhsc" }],
    ["earthenware slow cool", [["select", "[data-role=firing]", "earthenware"]], { "C04PLTP schedule": DF + "c04pltp", "04DSDH schedule": DF + "04dsdh" }]
  ];
  await root.locator("[data-role=more]").click();   // cooling lives under More options
  const out = [];
  for (const [name, acts, want] of states) {
    for (const [act, sel, val] of acts) {
      const el = root.locator(sel).first();
      if (act === "select") await el.selectOption(val); else await el.click();
    }
    const got = await links();
    const problems = [];
    for (const [t, href] of Object.entries(want)) {
      const hit = got.find(l => l.t === t && l.href === href);
      if (!hit) problems.push(`missing ${t} -> ${href}`); else if (!hit.ok) problems.push(`${t} lacks target/rel`);
    }
    got.filter(l => !l.ok).forEach(l => problems.push(`${l.t} lacks target/rel`));
    out.push({ name, ok: !problems.length, problems, links: got.map(l => l.t + " -> " + l.href) });
  }
  await b.close();
  console.log(JSON.stringify(out, null, 1));
  const failed = out.filter(c => !c.ok).length;
  console.log(failed ? `FAILED ${failed}/${out.length}` : `PASSED ${out.length}/${out.length}`);
  process.exit(failed ? 1 : 0);
})();
