// Renders an HTML graphic to a PNG at 2x, headless, so nothing opens on screen.
// Usage: node templates/render.mjs <file.html> <out.png> <width> <height>
// Runs inside the studio (it borrows the studio's playwright-core and your installed Chrome).
import { chromium } from "playwright-core";
import path from "node:path";
import fs from "node:fs";

const [html, out, w, h] = process.argv.slice(2);
if (!html || !out || !w || !h) {
  console.error("Usage: node templates/render.mjs <file.html> <out.png> <width> <height>");
  process.exit(1);
}

const chrome = [
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "/usr/bin/google-chrome",
].find((p) => fs.existsSync(p));

const browser = await chromium.launch({ headless: true, executablePath: chrome });
const page = await browser.newPage({
  viewport: { width: Number(w), height: Number(h) },
  deviceScaleFactor: 2,
});
await page.goto("file://" + path.resolve(html), { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: out, clip: { x: 0, y: 0, width: Number(w), height: Number(h) } });
await browser.close();
console.log(out);
