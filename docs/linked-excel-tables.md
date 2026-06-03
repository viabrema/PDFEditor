# Tabelas linkadas ao Excel

Funcionalidade para analistas que trabalham com **folhas Excel grandes** (várias folhas por ficheiro) e precisam de um snapshot em formato de tabela no documento do editor, com possibilidade de **atualizar** os dados a partir do mesmo ficheiro no disco.

## Requisitos

- **Desktop (Tauri):** caminho absoluto do ficheiro, diálogo nativo para abrir `.xlsx` / `.xlsm`, leitura binária via `@tauri-apps/plugin-fs`. **`.xls` legado (BIFF/OLE)** não é suportado — guarde como **Excel Workbook (.xlsx)** no Excel.
- **Browser (só Vite):** pode escolher um ficheiro com `<input type="file">`, mas o path guardado é prefixado com `__browser__:` — **não** é possível atualizar o link de forma fiável; use a app desktop para produção.

## Fluxo do utilizador

1. **Inserir:** botão da folha (ícone de folha) → escolher ficheiro Excel → modal **Folha** + **Intervalo** (ex.: `A1:G5`) → confirmar → bloco `linkedTable` na página.
2. **Atualizar links:** botão de atualizar (ícone refresh). Se um bloco `linkedTable` estiver **selecionado**, só esse bloco é atualizado; caso contrário, **todos** os blocos `linkedTable` do documento. O **tamanho, posição e formatação visual** do bloco mantêm-se — só a **camada de dados** (`dataSourceRows` / mesclagens de dados) é substituída.
3. **Reconfigurar:** painel de propriedades (ou toolbar em edição) → alterar ficheiro, folha ou intervalo; atualiza a camada de dados e o link, **sem** importar estilos do Excel.
4. **Fonte de dados:** com a tabela selecionada, botão **Fonte de dados** abre um modal só-leitura com os valores brutos (números em formato internacional `en-US`). A grelha no canvas mostra a **camada visual** (formatação do editor).
5. **Editar célula:** duplo clique na célula (modo estrutura) → o texto editável é o valor **bruto** dos dados; ao sair, volta a aparecer a formatação visual (incl. números e locale do editor).

## Formato no JSON do documento

- `type`: `"linkedTable"`.
- `content.dataSourceRows`: matriz de strings do Excel (valores brutos; não formatados para locale do editor). Documentos antigos com só `content.rows` são migrados automaticamente para `dataSourceRows`.
- `content.dataSourceMerges` / `content.merges`: mesclagens do intervalo Excel (0-based no intervalo). Só entram mesclagens **totalmente contidas** no intervalo.
- `content.cellStyles`, `content.rowStyles`, `content.colStyles`: formatação **visual** definida no editor (não vem do Excel na importação).
- `content.rows` (legado): ignorado em blocos linkados novos; preferir `dataSourceRows`.
- `metadata.excelLink`:
  - `filePath`: caminho absoluto no Windows/macOS/Linux (no browser, `__browser__:nome.xlsx`).
  - `sheetName`: nome da folha (não só índice).
  - `range`: intervalo normalizado em maiúsculas (ex.: `A1:G5`).

## Erros comuns

- **Ficheiro movido ou apagado:** ao atualizar, a leitura falha — mensagem de erro por bloco (alert) e os `dataSourceRows` antigos mantêm-se.
- **Partilha do JSON:** paths absolutos são **máquina-local**; outro PC não resolve o mesmo path.
- **Formato .xls legado:** não é OOXML (não é ZIP); a app deteta a assinatura e pede para guardar como `.xlsx`. Ficheiros corrompidos ou encriptados também falham com mensagem em português.

## Implementação (referência rápida)

| Área | Ficheiros |
|------|-----------|
| Parse A1 + leitura Excel + estilos | `app/src/services/excelRange.ts`, `app/src/services/excelTableStyle.ts` |
| Link + refresh | `app/src/services/excelLink.ts` |
| Tauri: picker + bytes | `app/src/services/tauriStorage.ts` (`pickExcelOpenPath`, `readBinaryFileFromPath`) |
| Wizard + modal | `app/src/app/linkedTableWizard.ts` |
| Eventos UI | `app/src/app/events/linkedTableEvents.ts` |
| Dados vs visual | `app/src/blocks/linkedTableModel.ts`, modal `app/src/app/linkedTableDataModal.ts` |
| Bloco / DOM | `app/src/blocks/blockModel.ts`, `tableBlock.ts`, `blockRenderer.ts` |
| Duplo clique | `app/src/app/renderBlocks.ts` + `linkedTableBridge` em `main.ts` / `render.ts` |
| PDF | `app/src/services/export.ts`, `exportTableMarkup.ts` |
| Permissões Tauri | `desktop/src-tauri/capabilities/default.json` (`fs:allow-read-file` com `**`) |

## Licença da dependência

- **exceljs** (MIT) — ver `app/package.json`.
