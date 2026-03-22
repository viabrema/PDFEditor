# PDFEditor

Editor de documentos em blocos com exportação PDF (HTML → PDF via Chromium headless no desktop).

## Estrutura

| Pasta | Conteúdo |
|--------|-----------|
| [`app/`](app/) | Frontend Vite + Vanilla JS + ProseMirror |
| [`desktop/`](desktop/) | Shell Tauri 2 + workspace Rust (`crates/pdf-export`, `src-tauri`) |

## Desenvolvimento

**Só web (Vite):**

```bash
cd app
npm install
npm run dev
```

**App desktop (Tauri):** precisa do **Cargo no PATH** — instala [Rust com rustup](https://rustup.rs/) (executável `rustup-init.exe` no Windows). Sem isso, `npm run dev` em `desktop/` falha com *program not found*. Depois de instalar, **fecha e reabre o terminal** (ou o Cursor).

Na primeira vez, o Chromium empacotado (para PDF):

```powershell
cd desktop/scripts
./setup-chromium.ps1
```

Depois:

```bash
cd desktop
npm install
npm run dev
```

Isto inicia o Vite em `../app` e abre a janela Tauri. Exportar PDF grava um ficheiro `.pdf` real (sem depender da impressão do browser). Sem Tauri, o export mantém o fluxo de pré-visualização + `print()`.

## Testes

- **JavaScript:** `cd app && npm run test:run` / `npm run test:coverage`
- **Rust:** `cd desktop && cargo test` e, para cobertura do crate `pdf-export`, ver [`desktop/README.md`](desktop/README.md)
