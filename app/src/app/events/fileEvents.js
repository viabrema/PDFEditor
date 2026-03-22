import { invoke } from "@tauri-apps/api/core";
import {
  getTauriBackend,
  loadDocumentFromFile,
  pickPdfSavePath,
  saveDocumentToFile,
} from "../../services/tauriStorage.js";
import { renderDocumentToHtml } from "../../services/export.js";

export function bindFileEvents({ documentData, state, blocks, refs, stateFile, renderer }) {

  function buildDocumentSnapshot() {
    const pages = documentData.pages.map((page) => {
      const pageBlocks = blocks.filter(
        (block) =>
          block.pageId === page.id &&
          block.metadata?.region !== "header" &&
          block.metadata?.region !== "footer"
      );
      return {
        ...page,
        blocks: pageBlocks,
      };
    });

    const regions = {
      header: {
        ...(documentData.regions?.header || {}),
        blocks: blocks.filter((block) => block.metadata?.region === "header"),
      },
      footer: {
        ...(documentData.regions?.footer || {}),
        blocks: blocks.filter((block) => block.metadata?.region === "footer"),
      },
    };

    return {
      ...documentData,
      pages,
      regions,
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
    const defaultRegions = {
      header: { enabled: true, height: 96 },
      footer: { enabled: true, height: 96 },
    };
    documentData.regions = {
      header: {
        ...defaultRegions.header,
        ...(snapshot.regions?.header || {}),
      },
      footer: {
        ...defaultRegions.footer,
        ...(snapshot.regions?.footer || {}),
      },
    };
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

    snapshot.regions?.header?.blocks?.forEach((block) => {
      blocks.push({
        ...block,
        pageId: null,
        languageId: block.languageId || snapshot.activeLanguageId,
        metadata: { ...(block.metadata || {}), region: "header" },
      });
    });

    snapshot.regions?.footer?.blocks?.forEach((block) => {
      blocks.push({
        ...block,
        pageId: null,
        languageId: block.languageId || snapshot.activeLanguageId,
        metadata: { ...(block.metadata || {}), region: "footer" },
      });
    });

    state.activePageId = documentData.pages[0]?.id || null;
    state.activeLanguageId =
      documentData.activeLanguageId || documentData.languages[0]?.id || null;
    state.activeRegion = "body";
    state.selectedBlockId = null;
    state.editingBlockId = null;
    renderer.render();
  }

  refs.openDocButton.addEventListener("click", async () => {
    const tauri = await getTauriBackend();
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
    const tauri = await getTauriBackend();
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

  refs.exportPdfButton.addEventListener("click", async () => {
    const snapshot = buildDocumentSnapshot();
    const activeLanguageId = state.activeLanguageId;
    if (activeLanguageId) {
      snapshot.pages = snapshot.pages.map((page) => ({
        ...page,
        blocks: (page.blocks || []).filter(
          (block) => block.languageId === activeLanguageId
        ),
      }));
      if (snapshot.regions?.header?.blocks) {
        snapshot.regions.header.blocks = snapshot.regions.header.blocks.filter(
          (block) => block.languageId === activeLanguageId
        );
      }
      if (snapshot.regions?.footer?.blocks) {
        snapshot.regions.footer.blocks = snapshot.regions.footer.blocks.filter(
          (block) => block.languageId === activeLanguageId
        );
      }
    }
    const html = renderDocumentToHtml(snapshot);

    const tauri = await getTauriBackend();
    if (tauri) {
      try {
        const outputPath = await pickPdfSavePath(tauri);
        if (!outputPath) {
          return;
        }
        await invoke("export_pdf_from_html", {
          input: { html, outputPath },
        });
        refs.docStatus.textContent = outputPath.split(/[\\/]/).pop();
      } catch (err) {
        console.error(err);
        refs.docStatus.textContent = "Falha ao exportar PDF";
      }
      return;
    }

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
