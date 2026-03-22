import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import toIco from "png-to-ico";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, "../src-tauri/icons");
const outFile = path.join(outDir, "icon.ico");
// 1×1 PNG (expandable by png-to-ico into a valid multi-size .ico)
const png1x1 = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64"
);

fs.mkdirSync(outDir, { recursive: true });
const buf = await toIco([png1x1]);
fs.writeFileSync(outFile, buf);
console.log("Wrote", outFile);
