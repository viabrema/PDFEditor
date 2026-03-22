import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

function walk(dir) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) {
      walk(p);
    } else if (f.endsWith(".ts")) {
      let s = fs.readFileSync(p, "utf8");
      const n = s.replace(/from (["'])(\.\.?\/[^"']+)\.js\1/g, "from $1$2$1");
      if (n !== s) {
        fs.writeFileSync(p, n);
      }
    }
  }
}

walk(path.join(root, "src"));
