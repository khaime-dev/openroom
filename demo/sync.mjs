// Copies the app's real stylesheet and logo into demo/, so the demo looks like the product.
// Run `node demo/sync.mjs` after changing public/static/app.css. The copies are committed, so
// demo/ can be published as it is, with no build step.
import { copyFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
for (const [from, to] of [["app.css", "app.css"], ["icon.svg", "icon.svg"]]) copyFileSync(join(here, "..", "public", "static", from), join(here, to));
console.log("demo/app.css and demo/icon.svg refreshed from public/static");
