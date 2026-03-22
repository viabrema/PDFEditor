import { createPage } from "../editor/documentModel";

export function addDocumentPage(documentData: { pages: any[] }, state: { activePageId: string | null }) {
  const num = documentData.pages.length + 1;
  const page = createPage({ name: `Pagina ${num}` });
  documentData.pages.push(page);
  state.activePageId = page.id;
  return page;
}

/**
 * Remove a pagina e os blocos do corpo associados. Cabecalho/rodape (pageId null) mantem-se.
 * @returns false se for a unica pagina ou pageId nao existir
 */
export function removeDocumentPage(
  documentData: { pages: any[] },
  state: {
    activePageId: string | null;
    selectedBlockIds: string[];
    editingBlockId: string | null;
  },
  blocks: any[],
  pageId: string,
): boolean {
  if (documentData.pages.length <= 1) {
    return false;
  }
  const idx = documentData.pages.findIndex((p) => p.id === pageId);
  if (idx < 0) {
    return false;
  }

  for (let i = blocks.length - 1; i >= 0; i -= 1) {
    if (blocks[i].pageId === pageId) {
      blocks.splice(i, 1);
    }
  }

  documentData.pages.splice(idx, 1);

  const nextIdx = Math.min(idx, documentData.pages.length - 1);
  state.activePageId = documentData.pages[nextIdx]?.id ?? null;

  state.selectedBlockIds = state.selectedBlockIds.filter((id) => blocks.some((b) => b.id === id));
  if (state.editingBlockId && !blocks.some((b) => b.id === state.editingBlockId)) {
    state.editingBlockId = null;
  }

  return true;
}
