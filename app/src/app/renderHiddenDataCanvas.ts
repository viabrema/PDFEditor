import type { DocumentHistory } from "./documentHistory";
import { renderBlocksInContainer } from "./renderBlocks";
import { computeHiddenDataSurfaceSize } from "./hiddenDataCanvas";

export function renderHiddenDataOnlyCanvas({
  activeBlocks,
  state,
  documentData,
  refs,
  requestRender,
  refreshTableChrome,
  linkedTableBridge,
  linkedChartBridge,
  documentHistory,
}: {
  activeBlocks: any[];
  state: any;
  documentData: any;
  refs: { canvas: HTMLElement };
  requestRender: () => void;
  refreshTableChrome?: () => void;
  linkedTableBridge?: { reconfigure?: (block: any) => Promise<void> };
  linkedChartBridge?: { reconfigure?: (block: any) => Promise<void> };
  documentHistory?: DocumentHistory;
}) {
  const canvas = refs.canvas;
  const hiddenBlocks = activeBlocks.filter((block) => block.metadata?.hidden === true);
  const { width, height } = computeHiddenDataSurfaceSize(hiddenBlocks);
  canvas.style.position = "relative";
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  canvas.addEventListener("click", () => {
    const shouldClear = state.editingBlockId || state.selectedBlockIds.length > 0;
    if (shouldClear) {
      state.editingBlockId = null;
      state.tableEdit = null;
      state.selectedBlockIds = [];
      requestRender();
    }
  });

  if (hiddenBlocks.length === 0) {
    const empty = document.createElement("div");
    empty.className =
      "hidden-data-empty absolute inset-0 flex items-center justify-center px-6 text-center text-sm text-slate-400";
    empty.textContent = "Nenhum dado oculto neste idioma.";
    canvas.append(empty);
    return;
  }

  renderBlocksInContainer({
    container: canvas,
    blocks: hiddenBlocks,
    allBlocks: activeBlocks,
    state,
    documentData,
    pageId: state.activePageId,
    region: "body",
    requestRender,
    refreshTableChrome,
    linkedTableBridge,
    linkedChartBridge,
    documentHistory,
  });
}
