import { createBlock } from "../blocks/blockModel";
import { createDocument, createLanguage, createPage } from "../editor/documentModel";

export function createInitialDocument() {
  return createDocument({
    title: "Documento local",
    gridSize: 15,
    languages: [
      createLanguage({ id: "lang-pt", label: "PT", isDefault: true }),
      createLanguage({ id: "lang-en", label: "EN" }),
      createLanguage({ id: "lang-es", label: "ES" }),
      createLanguage({ id: "lang-zh", label: "ZH" }),
    ],
    pages: [createPage({ id: "page-1", name: "Pagina 1" })],
  });
}

export function createInitialState(documentData) {
  return {
    activePageId: documentData.pages[0].id,
    activeLanguageId: documentData.activeLanguageId,
    views: [],
    interactions: [],
    selectedBlockIds: [],
    editingBlockId: null,
    activeRegion: "body",
    translation: {
      loading: false,
      error: null,
    },
    ai: {
      open: false,
      loading: false,
      error: null,
      history: [],
      chatByBlockId: {},
    },
    ui: {
      zoomPercent: 100,
      lastAction: "Pronto.",
    },
  };
}

export function createInitialBlocks() {
  return [];
}

export const stateFile = {
  path: null,
};
