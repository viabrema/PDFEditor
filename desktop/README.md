# PDF Editor — desktop (Tauri + Rust)

## Estrutura

- **`crates/pdf-export`** — lógica de exportação HTML → PDF (Chromium headless), testável sem browser.
- **`src-tauri`** — shell Tauri 2 (plugins `dialog`, `fs`, comando `export_pdf_from_html`).

## Pré-requisitos

- **Rust + Cargo** (obrigatório para `tauri dev`). Se vir `program not found` ao correr `cargo`, o Rust não está instalado ou o terminal não vê o PATH.
  - Instalação: [https://rustup.rs/](https://rustup.rs/) (no Windows, corre `rustup-init.exe` e aceita o default).
  - Depois de instalar, **feche e reabra o terminal** (ou o Cursor) e confirme: `cargo --version`.
- **Windows — linker MSVC:** se `cargo build` falhar com `linker link.exe not found`, instale [Visual Studio Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) com a carga **“Desenvolvimento para desktop com C++”** (ou `Microsoft.VisualStudio.2022.BuildTools` com workload `VCTools`).
- Node/npm.
- **Chromium** para PDF: execute uma vez:

```powershell
cd desktop/scripts
./setup-chromium.ps1
```

Isto preenche `src-tauri/bundled-chromium/` (gitignored). Em alternativa: **Chrome ou Edge** instalados no Windows são detetados automaticamente; ou defina `CHROMIUM_PATH` para qualquer `chrome.exe` / `msedge.exe` / `chrome-headless-shell.exe`.

## Comandos

Na pasta **`desktop/`**:

```bash
npm install
```

O `postinstall` gera `src-tauri/icons/icon.ico` (ícone mínimo). Para regenerar: `npm run icons`.

```bash
npm run dev
```

Isto arranca o Vite em `../app` e o Tauri. O Vite isolado continua a ser `npm run dev` dentro de `app/`.

## Cobertura Rust (`pdf-export`)

Instalar [cargo-llvm-cov](https://github.com/taiki-e/cargo-llvm-cov):

```bash
cargo install cargo-llvm-cov
```

Na pasta **`desktop/`**:

```bash
cargo llvm-cov -p pdf-export --summary-only
```

Meta do projeto: **100%** de cobertura no crate `pdf-export` (verificação local).

## Build de release

```bash
npm run build
```

Ative `"bundle": { "active": true }` em `src-tauri/tauri.conf.json`, acrescente `"resources": ["bundled-chromium"]` após correr `setup-chromium.ps1`, e configure ícones quando for distribuir instaladores.
