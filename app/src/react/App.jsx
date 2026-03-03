import React, { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { createIcons, icons } from "lucide";
import { createAiService } from "../services/ai.js";
import { createTranslationService } from "../services/translation.js";
import { loadDocumentFromFile, saveDocumentToFile } from "../services/tauriStorage.js";
import { renderDocumentToHtml } from "../services/export.js";
import { getTranslationEndpoint, TRANSLATION_KEY } from "../app/config.js";
import { createAiFlow } from "../app/aiFlow.js";
import { extractTextFromNode } from "../app/textUtils.js";
import {
  createInitialBlocks,
  createInitialDocument,
  createInitialState,
} from "../app/state.js";
import { translateFromDefaultLanguage } from "../app/translationFlow.js";
import { useBlockClipboard } from "../app/useBlockClipboard.js";
import { Canvas } from "./Canvas.jsx";
import { PageSettingsModal } from "./PageSettingsModal.jsx";
import { AiPanel } from "./AiPanel.jsx";
import { HeaderBar } from "./HeaderBar.jsx";
import { StickyBar } from "./StickyBar.jsx";

export function App() {
  const [, forceUpdate] = useReducer((value) => value + 1, 0);
  const [docStatus, setDocStatus] = useState("");
  const documentRef = useRef(createInitialDocument());
  const blocksRef = useRef(createInitialBlocks());
  const stateRef = useRef(createInitialState(documentRef.current));
  const stateFileRef = useRef({ path: null });

  const endpoint = useMemo(() => getTranslationEndpoint(), []);
  const translationService = useMemo(
    () =>
      createTranslationService({
        endpoint,
        apiKey: TRANSLATION_KEY,
      }),
    [endpoint]
  );
  const aiService = useMemo(
    () => createAiService({ endpoint, apiKey: TRANSLATION_KEY }),
    [endpoint]
  );

  const aiFlow = useMemo(
    () => createAiFlow({ blocks: blocksRef.current, state: stateRef.current }),
    []
  );

  useEffect(() => {
    createIcons({ icons });
  });


  const render = useCallback(() => forceUpdate(), [forceUpdate]);

  useBlockClipboard({ documentRef, blocksRef, stateRef, render });

  const getTauriApi = async () => {
    const tauri = globalThis.__TAURI__;
    if (!tauri?.fs || !tauri?.dialog) {
      return null;
    }
    return { fs: tauri.fs, dialog: tauri.dialog };
  };

  const buildDocumentSnapshot = () => {
    const documentData = documentRef.current;
    const blocks = blocksRef.current;
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
  };

  const applyDocumentSnapshot = (snapshot) => {
    if (!snapshot) {
      return;
    }

    const documentData = documentRef.current;
    const blocks = blocksRef.current;
    const state = stateRef.current;

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
    const normalizeTextBlock = (block) => {
      if (block.type === "text" && typeof block.content !== "string") {
        return { ...block, content: extractTextFromNode(block.content) };
      }
      return block;
    };

    snapshot.pages?.forEach((page) => {
      if (!Array.isArray(page.blocks)) {
        return;
      }
      page.blocks.forEach((block) => {
        blocks.push({
          ...normalizeTextBlock(block),
          pageId: block.pageId || page.id,
          languageId: block.languageId || snapshot.activeLanguageId,
        });
      });
    });

    snapshot.regions?.header?.blocks?.forEach((block) => {
      blocks.push({
        ...normalizeTextBlock(block),
        pageId: null,
        languageId: block.languageId || snapshot.activeLanguageId,
        metadata: { ...(block.metadata || {}), region: "header" },
      });
    });

    snapshot.regions?.footer?.blocks?.forEach((block) => {
      blocks.push({
        ...normalizeTextBlock(block),
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
    render();
  };

  const handleOpenDocument = async () => {
    const tauri = await getTauriApi();
    if (!tauri) {
      setDocStatus("Tauri indisponivel");
      return;
    }
    const result = await loadDocumentFromFile({ tauri });
    if (!result) {
      return;
    }
    stateFileRef.current.path = result.path;
    setDocStatus(result.path.split(/[\\/]/).pop());
    applyDocumentSnapshot(result.document);
  };

  const handleSaveDocument = async () => {
    const tauri = await getTauriApi();
    if (!tauri) {
      setDocStatus("Tauri indisponivel");
      return;
    }
    const snapshot = buildDocumentSnapshot();
    const path = await saveDocumentToFile(snapshot, {
      tauri,
      filePath: stateFileRef.current.path,
    });
    if (!path) {
      return;
    }
    stateFileRef.current.path = path;
    setDocStatus(path.split(/[\\/]/).pop());
  };

  const handleExportPdf = () => {
    const snapshot = buildDocumentSnapshot();
    const activeLanguageId = stateRef.current.activeLanguageId;
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
  };

  const translateHandler = (targetLanguageId) =>
    translateFromDefaultLanguage({
      translationService,
      documentData: documentRef.current,
      state: stateRef.current,
      blocks: blocksRef.current,
      render,
      targetLanguageId,
    });

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <HeaderBar
        documentData={documentRef.current}
        docStatus={docStatus}
        onOpen={handleOpenDocument}
        onSave={handleSaveDocument}
        onExport={handleExportPdf}
      />
      <section className="w-full px-6 py-6">
        <StickyBar
          documentData={documentRef.current}
          state={stateRef.current}
          blocks={blocksRef.current}
          onTranslate={translateHandler}
          onUpdate={render}
        />
        <Canvas
          documentData={documentRef.current}
          state={stateRef.current}
          blocks={blocksRef.current}
          onUpdate={render}
        />
      </section>
      <PageSettingsModal
        documentData={documentRef.current}
        state={stateRef.current}
        onUpdate={render}
      />
      <AiPanel
        state={stateRef.current}
        aiFlow={aiFlow}
        aiService={aiService}
        onUpdate={render}
      />
    </main>
  );
}
