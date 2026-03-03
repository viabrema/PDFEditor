import { createId } from "../utils/id.js";

export const DOCUMENT_SCHEMA_VERSION = 1;

export function createLanguage({ id = createId("lang"), label = "Default", isDefault = false } = {}) {
  return {
    id,
    label,
    isDefault,
  };
}

export function createPage({ id = createId("page"), name = "Page 1", blocks = [] } = {}) {
  return {
    id,
    name,
    blocks,
  };
}

export function createDocument(options = {}) {
  const {
    id = createId("doc"),
    title = "Untitled",
    pageFormat = "A4",
    pageOrientation = "portrait",
    gridSize = 8,
    snapToGrid = true,
    languages,
    activeLanguageId,
    pages,
    metadata,
    regions,
  } = options;

  const resolvedLanguages = Array.isArray(languages) && languages.length > 0
    ? languages
    : [createLanguage({ isDefault: true })];

  const defaultLanguage = resolvedLanguages.find((lang) => lang.isDefault) || resolvedLanguages[0];

  const resolvedPages = Array.isArray(pages) && pages.length > 0 ? pages : [createPage()];

  const defaultRegions = {
    header: { enabled: true, height: 96 },
    footer: { enabled: true, height: 96 },
  };
  const resolvedRegions = {
    header: {
      ...defaultRegions.header,
      ...(regions?.header || {}),
    },
    footer: {
      ...defaultRegions.footer,
      ...(regions?.footer || {}),
    },
  };

  return {
    version: DOCUMENT_SCHEMA_VERSION,
    id,
    title,
    page: {
      format: pageFormat,
      orientation: pageOrientation,
    },
    grid: {
      size: gridSize,
      snap: snapToGrid,
    },
    languages: resolvedLanguages,
    activeLanguageId: activeLanguageId || defaultLanguage.id,
    pages: resolvedPages,
    regions: resolvedRegions,
    metadata: {
      createdAt: metadata?.createdAt || new Date().toISOString(),
      updatedAt: metadata?.updatedAt || new Date().toISOString(),
    },
  };
}

export function serializeDocument(document) {
  return JSON.stringify(document, null, 2);
}

export function deserializeDocument(payload) {
  return JSON.parse(payload);
}
