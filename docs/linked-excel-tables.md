# Tabelas linkadas ao Excel

Funcionalidade para analistas que trabalham com **folhas Excel grandes** (várias folhas por ficheiro) e precisam de um snapshot em formato de tabela no documento do editor, com possibilidade de **atualizar** os dados a partir do mesmo ficheiro no disco.

## Requisitos

- **Desktop (Tauri):** caminho absoluto do ficheiro, diálogo nativo para abrir `.xlsx` / `.xlsm`, leitura binária via `@tauri-apps/plugin-fs`. **`.xls` legado (BIFF/OLE)** não é suportado — guarde como **Excel Workbook (.xlsx)** no Excel.
- **Browser (só Vite):** pode escolher um ficheiro com `<input type="file">`, mas o path guardado é prefixado com `__browser__:` — **não** é possível atualizar o link de forma fiável; use a app desktop para produção.

## Fluxo do utilizador

1. **Inserir:** botão da folha (ícone de folha) → escolher ficheiro Excel → modal **Folha** + **Intervalo** (ex.: `A1:G5`) → confirmar → bloco `linkedTable` na página.
2. **Atualizar links:** botão de atualizar (ícone refresh). Se um bloco `linkedTable` estiver **selecionado**, só esse bloco é atualizado; caso contrário, **todos** os blocos `linkedTable` do documento (todas as páginas e idiomas no array em memória). O **tamanho e a posição** da caixa do bloco mantêm-se (só `content` e mesclagens são atualizados).
3. **Reconfigurar:** **duplo clique** no bloco → repete o fluxo ficheiro + modal; o conteúdo e `metadata.excelLink` são substituídos após confirmar; **tamanho e posição** do bloco mantêm-se.

## Formato no JSON do documento

- `type`: `"linkedTable"`.
- `content.rows`: matriz de strings (último snapshot para UI e exportação PDF). Células escravas de mesclagem no Excel ficam com string vazia; o valor aparece só na célula “mestre”.
- `content.merges` (opcional): lista `{ r, c, rowspan, colspan }` em coordenadas **0-based** relativas ao canto superior esquerdo do intervalo. Só entram mesclagens **totalmente contidas** no intervalo escolhido (se o intervalo cortar uma mesclagem maior, essa mesclagem não é reproduzida).
- `metadata.excelLink`:
  - `filePath`: caminho absoluto no Windows/macOS/Linux (no browser, `__browser__:nome.xlsx`).
  - `sheetName`: nome da folha (não só índice).
  - `range`: intervalo normalizado em maiúsculas (ex.: `A1:G5`).

## Erros comuns

- **Ficheiro movido ou apagado:** ao atualizar, a leitura falha — mensagem de erro por bloco (alert) e as `rows` antigas mantêm-se.
- **Partilha do JSON:** paths absolutos são **máquina-local**; outro PC não resolve o mesmo path.
- **Formato .xls legado:** não é OOXML (não é ZIP); a app deteta a assinatura e pede para guardar como `.xlsx`. Ficheiros corrompidos ou encriptados também falham com mensagem em português.

## Implementação (referência rápida)

| Área | Ficheiros |
|------|-----------|
| Parse A1 + leitura Excel | `app/src/services/excelRange.ts`, `excelCellToPlainString` |
| Link + refresh | `app/src/services/excelLink.ts` |
| Tauri: picker + bytes | `app/src/services/tauriStorage.ts` (`pickExcelOpenPath`, `readBinaryFileFromPath`) |
| Wizard + modal | `app/src/app/linkedTableWizard.ts` |
| Eventos UI | `app/src/app/events/linkedTableEvents.ts` |
| Bloco / DOM | `app/src/blocks/blockModel.ts`, `tableBlock.ts`, `blockRenderer.ts` |
| Duplo clique | `app/src/app/renderBlocks.ts` + `linkedTableBridge` em `main.ts` / `render.ts` |
| PDF | `app/src/services/export.ts` (mesmo markup que `table`) |
| Permissões Tauri | `desktop/src-tauri/capabilities/default.json` (`fs:allow-read-file` com `**`) |

## Licença da dependência

- **exceljs** (MIT) — ver `app/package.json`.
