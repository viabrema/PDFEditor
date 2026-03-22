/**
 * Snapshot unificado do documento (mesma forma usada em guardar/abrir ficheiro).
 */

export function buildDocumentSnapshot(documentData: any, blocks: any[]) {
  const pages = documentData.pages.map((page: any) => {
    const pageBlocks = blocks.filter(
      (block) =>
        block.pageId === page.id &&
        block.metadata?.region !== "header" &&
        block.metadata?.region !== "footer",
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

export type DocumentSnapshot = ReturnType<typeof buildDocumentSnapshot>;

export function applyDocumentSnapshot({
  documentData,
  blocks,
  state,
  snapshot,
  renderer,
  preserveNavigation = false,
}: {
  documentData: any;
  blocks: any[];
  state: any;
  snapshot: DocumentSnapshot | null | undefined;
  renderer: { render: () => void };
  preserveNavigation?: boolean;
}) {
  if (!snapshot) {
    return;
  }

  const prevPageId = state.activePageId;
  const prevLangId = state.activeLanguageId;
  const prevRegion = state.activeRegion;
  const prevSelected = [...(state.selectedBlockIds || [])];
  const prevEditing = state.editingBlockId;

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

  snapshot.pages?.forEach((page: any) => {
    if (!Array.isArray(page.blocks)) {
      return;
    }
    page.blocks.forEach((block: any) => {
      blocks.push({
        ...block,
        pageId: block.pageId || page.id,
        languageId: block.languageId || snapshot.activeLanguageId,
      });
    });
  });

  snapshot.regions?.header?.blocks?.forEach((block: any) => {
    blocks.push({
      ...block,
      pageId: null,
      languageId: block.languageId || snapshot.activeLanguageId,
      metadata: { ...(block.metadata || {}), region: "header" },
    });
  });

  snapshot.regions?.footer?.blocks?.forEach((block: any) => {
    blocks.push({
      ...block,
      pageId: null,
      languageId: block.languageId || snapshot.activeLanguageId,
      metadata: { ...(block.metadata || {}), region: "footer" },
    });
  });

  if (preserveNavigation) {
    const pageIds = new Set(documentData.pages.map((p: any) => p.id));
    state.activePageId = pageIds.has(prevPageId) ? prevPageId : documentData.pages[0]?.id || null;
    const langIds = new Set(documentData.languages.map((l: any) => l.id));
    state.activeLanguageId = langIds.has(prevLangId)
      ? prevLangId
      : documentData.activeLanguageId || documentData.languages[0]?.id || null;
    const blockIds = new Set(blocks.map((b) => b.id));
    state.selectedBlockIds = prevSelected.filter((id) => blockIds.has(id));
    state.editingBlockId = blockIds.has(prevEditing) ? prevEditing : null;
    state.activeRegion = prevRegion;
  } else {
    state.activePageId = documentData.pages[0]?.id || null;
    state.activeLanguageId =
      documentData.activeLanguageId || documentData.languages[0]?.id || null;
    state.activeRegion = "body";
    state.selectedBlockIds = [];
    state.editingBlockId = null;
  }

  renderer.render();
}
