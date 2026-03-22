import { getPageSize } from "./textUtils";
import { effectiveBlockLanguageId } from "./translationFlow";
import { renderBlocksInContainer } from "./renderBlocks";
import { setupRegionResize } from "./regionResize";
import type { DocumentHistory } from "./documentHistory";

export function renderCanvasView({
  documentData,
  state,
  blocks,
  refs,
  requestRender,
  linkedTableBridge,
  linkedChartBridge,
  documentHistory,
}: {
  documentData: any;
  state: any;
  blocks: any[];
  refs: any;
  requestRender: () => void;
  linkedTableBridge?: { reconfigure?: (block: any) => Promise<void> };
  linkedChartBridge?: { reconfigure?: (block: any) => Promise<void> };
  documentHistory?: DocumentHistory;
}) {
  const activeBlocks = blocks.filter(
    (block) => effectiveBlockLanguageId(block, documentData) === state.activeLanguageId,
  );
  const headerBlocks = activeBlocks.filter(
    (block) => block.metadata?.region === "header"
  );
  const footerBlocks = activeBlocks.filter(
    (block) => block.metadata?.region === "footer"
  );
  const bodyBlocks = activeBlocks.filter(
    (block) =>
      block.metadata?.region !== "header" && block.metadata?.region !== "footer"
  );

  documentData.pages.forEach((page) => {
    const pageWrapper = document.createElement("div");
    pageWrapper.className = "page-shell";

    const { width, height } = getPageSize(
      documentData.page.format,
      documentData.page.orientation
    );

    const pageHeader = document.createElement("div");
    pageHeader.className = "mb-2 flex items-center justify-between text-xs text-slate-500";
    pageHeader.textContent = page.name;
    pageWrapper.append(pageHeader);

    const pageSurface = document.createElement("div");
    const isActivePage = page.id === state.activePageId;
    pageSurface.className = documentData.grid.snap
      ? "page-surface grid-on"
      : "page-surface";
    if (isActivePage) {
      pageSurface.classList.add("is-active");
    }
    pageSurface.style.width = `${width}px`;
    pageSurface.style.height = `${height}px`;
    pageSurface.style.setProperty("--grid-size", `${documentData.grid.size}px`);
    pageWrapper.append(pageSurface);

    pageSurface.addEventListener("click", () => {
      const shouldClear = state.editingBlockId || state.selectedBlockIds.length > 0;
      const shouldRender =
        shouldClear ||
        state.activePageId !== page.id ||
        state.activeRegion !== "body";
      state.activePageId = page.id;
      state.activeRegion = "body";
      if (shouldClear) {
        state.editingBlockId = null;
        state.selectedBlockIds = [];
      }
      if (shouldRender) {
        requestRender();
      }
    });

    const pageBlocks = bodyBlocks.filter((block) => block.pageId === page.id);

    if (pageBlocks.length === 0) {
      const empty = document.createElement("div");
      empty.className = "absolute inset-0 flex items-center justify-center text-sm text-slate-300";
      empty.textContent = "Sem blocos";
      pageSurface.append(empty);
    }

    renderBlocksInContainer({
      container: pageSurface,
      blocks: pageBlocks,
      allBlocks: activeBlocks,
      state,
      documentData,
      pageId: page.id,
      region: "body",
      requestRender,
      linkedTableBridge,
      linkedChartBridge,
      documentHistory,
    });

    if (documentData.regions?.header?.enabled) {
      const headerRegion = document.createElement("div");
      headerRegion.className = "page-region is-header";
      if (state.activeRegion === "header" && state.activePageId === page.id) {
        headerRegion.classList.add("is-active");
      }
      headerRegion.style.height = `${documentData.regions.header.height}px`;
      headerRegion.addEventListener("click", (event) => {
        event.stopPropagation();
        const shouldClear = state.editingBlockId || state.selectedBlockIds.length > 0;
        const shouldRender =
          shouldClear ||
          state.activePageId !== page.id ||
          state.activeRegion !== "header";
        state.activePageId = page.id;
        state.activeRegion = "header";
        if (shouldClear) {
          state.editingBlockId = null;
          state.selectedBlockIds = [];
        }
        if (shouldRender) {
          requestRender();
        }
      });

      const headerHandle = document.createElement("div");
      headerHandle.className = "region-resize-handle is-bottom";
      headerRegion.append(headerHandle);

      renderBlocksInContainer({
        container: headerRegion,
        blocks: headerBlocks,
        allBlocks: activeBlocks,
        state,
        documentData,
        pageId: page.id,
        region: "header",
        requestRender,
        linkedTableBridge,
        linkedChartBridge,
        documentHistory,
      });

      pageSurface.append(headerRegion);
      state.interactions.push(
        setupRegionResize({
          element: headerRegion,
          region: "header",
          documentData,
          pageSize: { width, height },
          onFinish: requestRender,
          onResizeStart: () => documentHistory?.checkpointBeforeChange(),
        })
      );
    }

    if (documentData.regions?.footer?.enabled) {
      const footerRegion = document.createElement("div");
      footerRegion.className = "page-region is-footer";
      if (state.activeRegion === "footer" && state.activePageId === page.id) {
        footerRegion.classList.add("is-active");
      }
      footerRegion.style.height = `${documentData.regions.footer.height}px`;
      footerRegion.addEventListener("click", (event) => {
        event.stopPropagation();
        const shouldClear = state.editingBlockId || state.selectedBlockIds.length > 0;
        const shouldRender =
          shouldClear ||
          state.activePageId !== page.id ||
          state.activeRegion !== "footer";
        state.activePageId = page.id;
        state.activeRegion = "footer";
        if (shouldClear) {
          state.editingBlockId = null;
          state.selectedBlockIds = [];
        }
        if (shouldRender) {
          requestRender();
        }
      });

      const footerHandle = document.createElement("div");
      footerHandle.className = "region-resize-handle is-top";
      footerRegion.append(footerHandle);

      renderBlocksInContainer({
        container: footerRegion,
        blocks: footerBlocks,
        allBlocks: activeBlocks,
        state,
        documentData,
        pageId: page.id,
        region: "footer",
        requestRender,
        linkedTableBridge,
        linkedChartBridge,
        documentHistory,
      });

      pageSurface.append(footerRegion);
      state.interactions.push(
        setupRegionResize({
          element: footerRegion,
          region: "footer",
          documentData,
          pageSize: { width, height },
          onFinish: requestRender,
          onResizeStart: () => documentHistory?.checkpointBeforeChange(),
        })
      );
    }

    refs.canvas.append(pageWrapper);
  });
}
