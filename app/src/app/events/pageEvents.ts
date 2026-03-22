import { setLastAction } from "../activityLog";
import { addDocumentPage, removeDocumentPage } from "../pageOps";

export function bindPageEvents({ documentData, state, blocks, refs, renderer }) {
  refs.addPageButton.addEventListener("click", () => {
    addDocumentPage(documentData, state);
    setLastAction(state, `Pagina adicionada (${documentData.pages.length} no total).`);
    renderer.render();
  });

  refs.removePageButton.addEventListener("click", () => {
    const pageId = state.activePageId;
    if (!pageId) {
      return;
    }
    const ok = removeDocumentPage(documentData, state, blocks, pageId);
    if (!ok) {
      setLastAction(state, "Nao e possivel apagar a unica pagina.");
      renderer.render();
      return;
    }
    setLastAction(state, "Pagina removida.");
    renderer.render();
  });
}
