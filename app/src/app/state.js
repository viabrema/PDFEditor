import { createBlock } from "../blocks/blockModel.js";
import { createDocument, createLanguage, createPage } from "../editor/documentModel.js";

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
    pages: [
      createPage({ id: "page-1", name: "Pagina 1" }),
      createPage({ id: "page-2", name: "Pagina 2" }),
    ],
  });
}

export function createInitialState(documentData) {
  return {
    activePageId: documentData.pages[0].id,
    activeLanguageId: documentData.activeLanguageId,
    views: [],
    interactions: [],
    selectedBlockId: null,
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
      response: "",
      chatByBlockId: {},
    },
  };
}

export function createInitialBlocks() {
  return [];
}

export const stateFile = {
  path: null,
};
