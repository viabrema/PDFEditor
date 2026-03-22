import { spawnSync } from "node:child_process";

const r = spawnSync("cargo", ["--version"], {
  encoding: "utf8",
  windowsHide: true,
});

if (r.status !== 0) {
  console.error(`
[PDFEditor desktop] Cargo (Rust) não foi encontrado no PATH.

1. Instale o Rust: https://rustup.rs/
   No Windows: descarregue e execute rustup-init.exe e aceite a instalação predefinida.

2. Feche e volte a abrir o terminal (ou reinicie o Cursor) para atualizar o PATH.

3. Confirme:  cargo --version

Depois volte a correr:  npm run dev
`);
  process.exit(1);
}
