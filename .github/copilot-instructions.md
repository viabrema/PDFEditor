# Copilot Instructions - PDFEditor

## Goal
Build a Notion-style PDF editor for Windows (desktop) using a web UI. Users create draggable/resizable blocks, edit rich text, embed images/graphs, translate text via a custom API, and export to PDF. The project must stay lightweight and avoid framework-heavy UI.

## Stack
- App shell: Tauri (Windows desktop)
- UI: Vite + Vanilla JS (ESM)
- Styling: Tailwind CSS
- Tests: Vitest
- Editor core: ProseMirror (or Tiptap core used in vanilla mode)
- Drag/resize: Interact.js (or equivalent)
- Persistence: local JSON files via Tauri FS; optional IndexedDB cache
- PDF export: HTML + print/PDF pipeline

## Architecture
- src/
  - app/            # app bootstrap, routing, global state
  - editor/         # ProseMirror schema, commands, plugins
  - blocks/         # block models, renderers, drag/resize behavior
  - services/       # API clients (translation), storage, export
  - ui/             # toolbars, panels, dialogs
  - utils/          # shared helpers

## Document Model
- Store document as JSON with a stable schema.
- Each block has: id, type, content, position, size, and metadata.
- Keep schema versioning for future migrations.

## Block Interaction
- Blocks support drag and resize.
- Snap-to-grid is optional and configurable per document.
- Grid size must be configurable (default 8 or 10).
- When snap is off, movement/resizing should be free-form.
- deve ser possível escolher o formato da página (A4, Letter, etc) e o layout (retrato/paisagem)
- deve poder ter várias páginas em um mesmo documento, com blocos organizados por página
- deve poder ter abas de idiomas para cada documento

## Translation API
- Centralize the API client in src/services/translation.js.
- Support translate selection, block, or entire document.
- Always expose loading and error states in the UI.
- API endpoint: http://10.36.0.19:8080/api/ai/prompt
- API key: JygheDTXbNKNwA0DKL94riGK8AqxwtpyvCr2sfoQVfY
- Payload: { "prompt": "...", "provider": "gemini", "model": "gemini-2.5-flash-lite" }
- Idiomas suportados inicialmente: portugues (padrao), ingles e espanhol.
- Em abas EN/ES, deve existir botao "Atualizar" para resetar traducao.
- O botao clona o PDF em PT e traduz, recriando conteudo, posicao e tamanho dos blocos.
- Apos traduzir, o usuario pode editar; ao clicar novamente em Atualizar, tudo volta ao estado traduzido atual.

## PDF Export
- Render the document to HTML with print styles.
- Ensure images and fonts are embedded or available at export time.
- Provide deterministic output (stable layout across exports).

## Testing
- Use Vitest for unit tests.
- Cover: schema serialization, block commands, grid snapping math, and translation service.
- Keep tests fast and isolated (no network calls; mock API).

## Coding Rules
- Vanilla JS only (no React/Vue/Svelte).
- Prefer small modules and explicit exports.
- Avoid global state; pass dependencies where possible.
- Keep functions short and focused.
- Use ASCII in source files unless a feature requires Unicode.

## UX Guidelines
- Toolbar: bold, italic, lists, image insert, translate.
- Provide visible handles for resize and drag.
- Snap toggle should be obvious and easy to change.

## Commit and Workflow
- Keep changes small and incremental.
- Update tests when changing editor behavior.

## regras de comportamento
- sempre vá marcando os checks do todo.md conforme for implementando as features
- sempre rode os testes com coverage e garanta que estão passando antes de marcar um item como concluído
- mantenha a cobertura de testes em 100%
- sempre rode o lint e corrija os avisos antes de marcar um item como concluído
- sempre responda em portugues