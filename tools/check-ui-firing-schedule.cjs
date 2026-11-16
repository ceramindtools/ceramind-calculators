// Simplified layout checks for the firing schedule calculator: what shows by default, the keyboard-usable
// "More options" toggle with aria-expanded, damp/bone dry for bisque only, and "My own temperature" opening the panel.
//   node tools/check-ui-firing-schedule.cjs <url>
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
  const vis = sel => root.locator(sel).first().isVisible();
  const more = root.locator("[data-role=more]");
  const out = [];
  const ok = (name, cond, info) => out.push({ name, ok: !!cond, info });
  ok("visible by default: firing, cone, thickness, bisque dryness, More options",
    (await vis("[data-role=firing]")) && (await vis("[data-role=cone]")) && (await vis("[data-thick=thin]")) && (await vis("[data-dry=damp]")) && (await vis("[data-role=more]")));
  ok("collapsed by default: top temperature, units, hold, start time hidden; aria-expanded=false",
    !(await vis("[data-role=top]")) && !(await vis("[data-unit=f]")) && !(await vis("[data-role=hold]")) && !(await vis("[data-role=start]"))
      && (await more.getAttribute("aria-expanded")) === "false" && !!(await more.getAttribute("aria-controls")));
  ok("results show by default", (await root.locator(".cm-results").innerText()).includes("Total time: 9"));
  await more.focus(); await p.keyboard.press("Enter");
  ok("Enter opens it: aria-expanded=true and the fields show", (await more.getAttribute("aria-expanded")) === "true" && (await vis("[data-role=top]")) && (await vis("[data-role=hold]")));
  await p.keyboard.press("Space");
  ok("Space closes it again", (await more.getAttribute("aria-expanded")) === "false" && !(await vis("[data-role=top]")));
  await root.locator("[data-role=firing]").selectOption("midfire");
  ok("glaze firing hides the damp/bone dry choice", !(await vis("[data-dry=damp]")));
  await more.click();
  ok("cooling shows under More options for a glaze", await vis("[data-role=cool]"));
  await more.click();
  await root.locator("[data-role=cone]").selectOption("own");
  const focused = await p.evaluate(() => document.activeElement && document.activeElement.getAttribute("data-role"));
  ok("'My own temperature' opens More options and focuses the box", (await more.getAttribute("aria-expanded")) === "true" && focused === "top", focused);
  await b.close();
  console.log(JSON.stringify(out, null, 1));
  const failed = out.filter(c => !c.ok).length;
  console.log(failed ? `FAILED ${failed}/${out.length}` : `PASSED ${out.length}/${out.length}`);
  process.exit(failed ? 1 : 0);
})();
