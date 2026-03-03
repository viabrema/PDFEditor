import { loadDocumentFromFile, saveDocumentToFile } from "../../services/tauriStorage.js";
import { renderDocumentToHtml } from "../../services/export.js";

export function bindFileEvents({ documentData, state, blocks, refs, stateFile, renderer }) {
  async function getTauriApi() {
    const tauri = globalThis.__TAURI__;
    if (!tauri?.fs || !tauri?.dialog) {
      return null;
    }
    return { fs: tauri.fs, dialog: tauri.dialog };
  }

  function buildDocumentSnapshot() {
    const pages = documentData.pages.map((page) => {
      const pageBlocks = blocks.filter((block) => block.pageId === page.id);
      return {
        ...page,
        blocks: pageBlocks,
      };
    });

    return {
      ...documentData,
      pages,
      metadata: {
        ...documentData.metadata,
        updatedAt: new Date().toISOString(),
      },
    };
  }

  function applyDocumentSnapshot(snapshot) {
    if (!snapshot) {
      return;
    }

    Object.assign(documentData, snapshot);
    blocks.length = 0;

    snapshot.pages?.forEach((page) => {
      if (!Array.isArray(page.blocks)) {
        return;
      }
      page.blocks.forEach((block) => {
        blocks.push({
          ...block,
          pageId: block.pageId || page.id,
          languageId: block.languageId || snapshot.activeLanguageId,
        });
      });
    });

    state.activePageId = documentData.pages[0]?.id || null;
    state.activeLanguageId =
      documentData.activeLanguageId || documentData.languages[0]?.id || null;
    state.selectedBlockId = null;
    state.editingBlockId = null;
    renderer.render();
  }

  refs.openDocButton.addEventListener("click", async () => {
    const tauri = await getTauriApi();
    if (!tauri) {
      refs.docStatus.textContent = "Tauri indisponivel";
      return;
    }

    const result = await loadDocumentFromFile({ tauri });
    if (!result) {
      return;
    }

    stateFile.path = result.path;
    refs.docStatus.textContent = result.path.split(/[\\/]/).pop();
    applyDocumentSnapshot(result.document);
  });

  refs.saveDocButton.addEventListener("click", async () => {
    const tauri = await getTauriApi();
    if (!tauri) {
      refs.docStatus.textContent = "Tauri indisponivel";
      return;
    }

    const snapshot = buildDocumentSnapshot();
    const path = await saveDocumentToFile(snapshot, {
      tauri,
      filePath: stateFile.path,
    });

    if (!path) {
      return;
    }

    stateFile.path = path;
    refs.docStatus.textContent = path.split(/[\\/]/).pop();
  });

  refs.exportPdfButton.addEventListener("click", () => {
    const snapshot = buildDocumentSnapshot();
    const activeLanguageId = state.activeLanguageId;
    if (activeLanguageId) {
      snapshot.pages = snapshot.pages.map((page) => ({
        ...page,
        blocks: (page.blocks || []).filter(
          (block) => block.languageId === activeLanguageId
        ),
      }));
    }
    const html = renderDocumentToHtml(snapshot);
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const preview = window.open(url, "_blank");
    if (!preview) {
      URL.revokeObjectURL(url);
      return;
    }

    preview.addEventListener("load", () => {
      preview.focus();
      preview.print();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    });
  });
}
