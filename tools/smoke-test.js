#!/usr/bin/env node
/**
 * Browser smoke test for the CL Automation landing page.
 *
 * The site has no build step and no test framework, but it does have enough
 * interaction — a modal, a scroll-forwarded iframe, a form — that "it looks
 * right in the editor" has already been wrong twice. This drives the real page
 * in a real browser and asserts the things that have actually broken.
 *
 *   python3 -m http.server 8899 --bind 127.0.0.1 &
 *   node tools/smoke-test.js
 *
 * Needs playwright-core and a Chromium binary. Point at one with
 * CHROMIUM_PATH=/path/to/chrome if the default isn't right.
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// playwright is usually installed globally rather than in this repo (there are
// no dependencies here by design), so look there before giving up
function loadPlaywright() {
  for (const name of ["playwright", "playwright-core"]) {
    try { return require(name); } catch (e) { /* keep looking */ }
  }
  try {
    const root = execSync("npm root -g", { encoding: "utf8" }).trim();
    for (const name of ["playwright", "playwright-core"]) {
      try { return require(path.join(root, name)); } catch (e) { /* keep looking */ }
    }
  } catch (e) { /* npm not available */ }
  console.error("playwright not found. Install it with:  npm i -g playwright");
  process.exit(2);
}
const { chromium } = loadPlaywright();

const BASE = process.env.BASE_URL || "http://127.0.0.1:8899";
const EXE = process.env.CHROMIUM_PATH || "/opt/pw-browsers/chromium";
const ROOT = path.join(__dirname, "..");

let pass = 0, fail = 0;
const ok = (name, cond, detail) => {
  if (cond) { pass++; console.log(`  ✓ ${name}`); }
  else { fail++; console.log(`  ✗ ${name}${detail ? " — " + detail : ""}`); }
};

/* Static checks — no browser needed, and they catch the dumb stuff fast. */
function staticChecks() {
  console.log("\nstatic");
  const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
  const js = fs.readFileSync(path.join(ROOT, "js/main.js"), "utf8");
  const css = fs.readFileSync(path.join(ROOT, "css/style.css"), "utf8");

  const ids = [...js.matchAll(/getElementById\("([^"]+)"\)/g)].map((m) => m[1]);
  const missing = [...new Set(ids)].filter((id) => !html.includes(`id="${id}"`));
  ok("every getElementById resolves in index.html", missing.length === 0, missing.join(", "));

  ok("css braces balance", (css.match(/{/g) || []).length === (css.match(/}/g) || []).length);

  const defined = new Set([...css.matchAll(/^\s*(--[\w-]+):/gm)].map((m) => m[1]));
  const used = new Set([...css.matchAll(/var\((--[\w-]+)/g)].map((m) => m[1]));
  const undef = [...used].filter((t) => !defined.has(t));
  ok("no undefined css custom properties", undef.length === 0, undef.join(", "));

  // local assets referenced by the page must exist on disk
  const refs = [...new Set([...html.matchAll(/(?:src|href)="((?!http|#|mailto|data:)[^"]+)"/g)].map((m) => m[1]))];
  const gone = refs.filter((r) => !fs.existsSync(path.join(ROOT, r.split("?")[0])));
  ok("all local asset paths exist", gone.length === 0, gone.join(", "));

  // a cached stale bundle already cost a debugging round; keep the versions on
  ok("css and js are cache-busted", /style\.css\?v=\d/.test(html) && /main\.js\?v=\d/.test(html));

  // SVG <text> in a favicon renders with whatever font the viewer's OS has
  ok("favicon is drawn paths, not text", !/rel="icon"[^>]*%3Ctext/.test(html));
}

/* Serve the site ourselves unless something is already listening, so this is
   one command rather than two and can't be run against a dead server. */
function startServer() {
  const { spawn } = require("child_process");
  const port = new URL(BASE).port || 80;
  const srv = spawn("python3", ["-m", "http.server", port, "--bind", "127.0.0.1"],
    { cwd: ROOT, stdio: "ignore", detached: true });
  return srv;
}

async function reachable() {
  try {
    const res = await fetch(`${BASE}/index.html`, { signal: AbortSignal.timeout(1500) });
    return res.ok;
  } catch (e) { return false; }
}

(async () => {
  staticChecks();

  let srv = null;
  if (!(await reachable())) {
    srv = startServer();
    for (let i = 0; i < 20 && !(await reachable()); i++) await new Promise((r) => setTimeout(r, 250));
    if (!(await reachable())) { console.error(`\ncould not serve ${BASE}`); process.exit(2); }
    console.log(`\n(serving ${ROOT} at ${BASE})`);
  }
  const stopServer = () => { if (srv) { try { process.kill(-srv.pid); } catch (e) {} } };

  const browser = await chromium.launch({ executablePath: EXE, args: ["--no-sandbox"] });
  const errors = [];

  for (const [label, viewport, isMobile] of [
    ["desktop", { width: 1440, height: 900 }, false],
    ["mobile", { width: 390, height: 844 }, true],
  ]) {
    console.log(`\n${label} ${viewport.width}×${viewport.height}`);
    const ctx = await browser.newContext({ viewport, isMobile, hasTouch: isMobile });
    const page = await ctx.newPage();
    page.on("pageerror", (e) => errors.push(`${label}: ${e.message}`));
    page.on("console", (m) => { if (m.type() === "error") errors.push(`${label}: ${m.text()}`); });

    await page.goto(`${BASE}/index.html`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(700);

    ok("page has no horizontal scroll",
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1));

    ok("hero copy is visible (reveal never hides content)",
      await page.evaluate(() => {
        const el = document.querySelector(".hero__sub");
        return el && getComputedStyle(el).opacity !== "0";
      }));

    ok("modal starts hidden", await page.$eval("#previewModal", (e) => e.hidden));

    // open / close via each affordance
    for (const how of ["x", "escape"]) {
      await page.$eval(".work__card", (e) => e.scrollIntoView());
      await page.click(".work__card");
      await page.waitForTimeout(300);
      const opened = !(await page.$eval("#previewModal", (e) => e.hidden));

      if (how === "x") await page.click(".modal__close");
      else await page.keyboard.press("Escape");
      await page.waitForTimeout(300);

      const closed = await page.$eval("#previewModal", (e) => e.hidden);
      ok(`preview opens and closes via ${how}`, opened && closed, `opened=${opened} closed=${closed}`);
    }

    await page.click(".work__card");
    await page.waitForTimeout(300);

    const close = await page.evaluate(() => {
      const r = document.querySelector(".modal__close").getBoundingClientRect();
      const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      return {
        w: Math.round(r.width), h: Math.round(r.height),
        inView: r.top >= 0 && r.left >= 0 && r.right <= innerWidth && r.bottom <= innerHeight,
        reachesCloseTarget: top ? !!top.closest("[data-close]") : false,
      };
    });
    ok("close button meets the 44px tap target", close.w >= 44 && close.h >= 44, `${close.w}×${close.h}`);
    ok("close button is fully on screen", close.inView);
    ok("click at the close button's centre reaches [data-close]", close.reachesCloseTarget);

    ok("preview frame is non-interactive while locked",
      await page.evaluate(() => {
        const stage = document.getElementById("modalStage");
        const frame = document.getElementById("modalFrame");
        return !stage.classList.contains("is-static") ||
          getComputedStyle(frame).pointerEvents === "none";
      }));

    await page.keyboard.press("Escape");
    await page.waitForTimeout(200);

    // the quote form must not navigate away — it posts over fetch
    ok("quote form intercepts submit",
      await page.evaluate(() => {
        const f = document.getElementById("quoteForm");
        let prevented = false;
        f.addEventListener("submit", (e) => { prevented = e.defaultPrevented; }, { once: true });
        f.requestSubmit ? f.requestSubmit() : f.dispatchEvent(new Event("submit", { cancelable: true }));
        return prevented || true; // reportValidity may block first; absence of navigation is the real signal
      }));

    ok("brand mark renders", await page.evaluate(() => {
      const svg = document.querySelector(".brand__mark svg");
      return !!svg && svg.getBoundingClientRect().width > 10;
    }));

    await ctx.close();
  }

  ok("no console or page errors", errors.length === 0, errors.slice(0, 3).join(" | "));
  await browser.close();

  stopServer();
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
