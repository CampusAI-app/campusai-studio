// Screenshots a page of the real CampusAI demo, dark mode, at 2x, headless.
// Usage: node templates/capture.mjs <page> <out.png> [width] [height] [--full]
//   node templates/capture.mjs / out/dashboard.png
//   node templates/capture.mjs "/career?view=resume" out/resume.png 1440 900 --full
// Runs inside the studio (it borrows the studio's playwright-core and your installed Chrome).
import { chromium } from "playwright-core";
import fs from "node:fs";

const args = process.argv.slice(2);
const full = args.includes("--full");
const [page, out, w = "1440", h = "900"] = args.filter((a) => a !== "--full");
if (!page || !out) {
  console.error("Usage: node templates/capture.mjs <page> <out.png> [width] [height] [--full]");
  process.exit(1);
}

const chrome = [
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "/usr/bin/google-chrome",
].find((p) => fs.existsSync(p));

const browser = await chromium.launch({ headless: true, executablePath: chrome });
const ctx = await browser.newContext({ viewport: { width: Number(w), height: Number(h) }, deviceScaleFactor: 2 });
// The demo reads its theme from here, so the page opens dark with no toggle to press.
await ctx.addInitScript(() => {
  try { localStorage.setItem("campusai-theme", "dark"); } catch {}
});
const tab = await ctx.newPage();
await tab.goto("https://campusai-demo.vercel.app" + (page.startsWith("/") ? page : "/" + page), { waitUntil: "networkidle" });
await tab.waitForTimeout(1500); // let entrance animations settle
await tab.screenshot({ path: out, fullPage: full });
await browser.close();
console.log(out);
