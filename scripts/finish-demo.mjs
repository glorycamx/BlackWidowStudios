// Unwraps the single-file demo so it can be published as a hosted preview page
// (the host adds its own doctype/head/body and viewport meta).
import fs from "node:fs";
const file = new URL("../demo-dist/index.html", import.meta.url);
let html = fs.readFileSync(file, "utf8");
html = html
  .replace(/<!doctype html>/i, "")
  .replace(/<\/?html[^>]*>/gi, "")
  .replace(/<\/?head>/gi, "")
  .replace(/<\/?body>/gi, "")
  .replace(/\s*<meta (charset|name="viewport")[^>]*>/gi, "");
const title = html.match(/<title>.*?<\/title>/)[0];
html = `${title}\n${html.replace(title, "").trim()}\n`;
fs.writeFileSync(file, html);
console.log("demo-dist/index.html ready,", Math.round(html.length / 1024), "KB");
