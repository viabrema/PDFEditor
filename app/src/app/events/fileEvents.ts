import { invoke } from "@tauri-apps/api/core";
import {
  getTauriBackend,
  loadDocumentFromFile,
  pickPdfSavePath,
  saveDocumentToFile,
} from "../../services/tauriStorage";
import { renderDocumentToHtml } from "../../services/export";
import { effectiveBlockLanguageId } from "../translationFlow";
import { setLastAction } from "../activityLog";
import { buildDocumentSnapshot, applyDocumentSnapshot } from "../documentSnapshot";

export function bindFileEvents({
  documentData,
  state,
  blocks,
  refs,
  stateFile,
  renderer,
  documentHistory,
}: any) {
  let templateFilePath: string | null = null;

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
    setLastAction(state, "Documento aberto.");
    documentHistory?.clear();
    applyDocumentSnapshot({
      documentData,
      blocks,
      state,
      snapshot: result.document,
      renderer,
      preserveNavigation: false,
    });
  });

  refs.saveDocButton.addEventListener("click", async () => {
    const tauri = await getTauriBackend();
    if (!tauri) {
      refs.docStatus.textContent = "Tauri indisponivel";
      return;
    }

    const snapshot = buildDocumentSnapshot(documentData, blocks);
    const path = await saveDocumentToFile(snapshot, {
      tauri,
      filePath: stateFile.path,
    });

    if (!path) {
      return;
    }

    stateFile.path = path;
    refs.docStatus.textContent = path.split(/[\\/]/).pop();
    setLastAction(state, "Documento guardado.");
  });

  refs.saveTemplateButton.addEventListener("click", async () => {
    const tauri = await getTauriBackend();
    if (!tauri) {
      refs.docStatus.textContent = "Tauri indisponivel";
      return;
    }

    const snapshot = buildDocumentSnapshot(documentData, blocks);
    const path = await saveDocumentToFile(snapshot, {
      tauri,
      filePath: templateFilePath,
      dialogOptions: {
        extensions: ["json"],
        defaultPath: "arquivo.tp.json",
      },
      fileSuffix: ".tp.json",
    });

    if (!path) {
      return;
    }

    templateFilePath = path;
    refs.docStatus.textContent = path.split(/[\\/]/).pop();
    setLastAction(state, "Template guardado.");
  });

  refs.openTemplateButton.addEventListener("click", async () => {
    const tauri = await getTauriBackend();
    if (!tauri) {
      refs.docStatus.textContent = "Tauri indisponivel";
      return;
    }

    const result = await loadDocumentFromFile({
      tauri,
      dialogOptions: {
        extensions: ["json"],
      },
    });
    if (!result) {
      return;
    }

    templateFilePath = result.path;
    refs.docStatus.textContent = result.path.split(/[\\/]/).pop();
    setLastAction(state, "Template carregado.");
    documentHistory?.clear();
    applyDocumentSnapshot({
      documentData,
      blocks,
      state,
      snapshot: result.document,
      renderer,
      preserveNavigation: false,
    });
  });

  refs.exportPdfButton.addEventListener("click", async () => {
    const snapshot = buildDocumentSnapshot(documentData, blocks);
    const activeLanguageId = state.activeLanguageId;
    if (activeLanguageId) {
      snapshot.pages = snapshot.pages.map((page) => ({
        ...page,
        blocks: (page.blocks || []).filter(
          (block) => effectiveBlockLanguageId(block, snapshot) === activeLanguageId,
        ),
      }));
      if (snapshot.regions?.header?.blocks) {
        snapshot.regions.header.blocks = snapshot.regions.header.blocks.filter(
          (block) => effectiveBlockLanguageId(block, snapshot) === activeLanguageId,
        );
      }
      if (snapshot.regions?.footer?.blocks) {
        snapshot.regions.footer.blocks = snapshot.regions.footer.blocks.filter(
          (block) => effectiveBlockLanguageId(block, snapshot) === activeLanguageId,
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
        setLastAction(state, "PDF exportado.");
      } catch (err) {
        console.error(err);
        refs.docStatus.textContent = "Falha ao exportar PDF";
        setLastAction(state, "Falha ao exportar PDF.");
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
    setLastAction(state, "Pre-visualizacao de impressao aberta.");
  });
}
