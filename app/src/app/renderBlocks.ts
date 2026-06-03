import { createEditor } from "../editor/editor";
import { createBlockElement } from "../blocks/blockRenderer";
import type { TableEditState } from "../blocks/tableBlock";
import { setupDragResize } from "../blocks/dragResize";
import { fileToDataUrl } from "../blocks/imageBlock";
import { chartBlockHasExcelLink } from "../blocks/chartBlock";
import { resizeBlockChart } from "../blocks/chartRuntime";
import { scheduleChartJsMountIfConfigured } from "./mountBlockChart";
import { openChartConfiguration } from "./chartModal";
import type { DocumentHistory } from "./documentHistory";

export function renderBlocksInContainer({
  container,
  blocks,
  allBlocks,
  state,
  documentData,
  pageId,
  region,
  requestRender,
  refreshTableChrome,
  linkedTableBridge,
  linkedChartBridge,
  documentHistory,
}: {
  container: HTMLElement;
  blocks: any[];
  /** Blocos no idioma ativo (para resolver fonte de dados do gráfico em qualquer região). */
  allBlocks?: any[];
  state: any;
  documentData: any;
  pageId: string;
  region: string;
  requestRender: () => void;
  refreshTableChrome?: () => void;
  linkedTableBridge?: { reconfigure?: (block: any) => Promise<void> };
  linkedChartBridge?: { reconfigure?: (block: any) => Promise<void> };
  documentHistory?: DocumentHistory;
}) {
  const blocksForChartResolve = allBlocks ?? blocks;

  blocks.forEach((block) => {
    if (block.type === "title" || block.type === "subtitle") {
      block.metadata = {
        ...(block.metadata || {}),
        headingLevel: block.type === "subtitle" ? 2 : 1,
      };
      block.type = "heading";
    }
    const isSelected = state.selectedBlockIds.includes(block.id);
    const isEditing = block.id === state.editingBlockId;
    const isTableBlock = block.type === "table" || block.type === "linkedTable";
    const tableEdit: TableEditState | null =
      isEditing && state.tableEdit?.blockId === block.id ? state.tableEdit : null;
    const onTableEditChange = isEditing && isTableBlock
      ? (edit: Omit<TableEditState, "blockId">) => {
          const prevTyping = state.tableEdit?.typing === true;
          state.tableEdit = { blockId: block.id, ...edit };
          if (edit.typing && !prevTyping) {
            requestRender();
            return;
          }
          refreshTableChrome?.();
        }
      : undefined;

    const getTableEdit = () =>
      state.tableEdit?.blockId === block.id ? state.tableEdit : null;

    const { element, editorHost } = createBlockElement(block, {
      selected: isSelected,
      editing: isEditing,
      tableEdit,
      getTableEdit: isTableBlock && isEditing ? getTableEdit : undefined,
      onTableEditChange,
      onColResizeSessionStart:
        isTableBlock && isEditing
          ? () => documentHistory?.checkpointBeforeChange()
          : undefined,
      onColResizeSessionEnd:
        isTableBlock && isEditing ? () => refreshTableChrome?.() : undefined,
    });
    container.append(element);

    element.addEventListener("click", (event) => {
      event.stopPropagation();
      state.activePageId = pageId;
      state.activeRegion = region;
      const toggleMulti = event.ctrlKey || event.metaKey;
      let nextIds = state.selectedBlockIds;
      if (toggleMulti) {
        nextIds = state.selectedBlockIds.includes(block.id)
          ? state.selectedBlockIds.filter((id) => id !== block.id)
          : [...state.selectedBlockIds, block.id];
      } else {
        nextIds = [block.id];
      }
      const nextEditing =
        state.editingBlockId && state.editingBlockId !== block.id
          ? null
          : state.editingBlockId;
      const sameSelection =
        nextIds.length === state.selectedBlockIds.length &&
        nextIds.every((id, i) => id === state.selectedBlockIds[i]);
      const shouldRender = !sameSelection || state.editingBlockId !== nextEditing;
      state.selectedBlockIds = nextIds;
      state.editingBlockId = nextEditing;
      if (!state.editingBlockId) {
        state.tableEdit = null;
      } else if (state.tableEdit && state.tableEdit.blockId !== state.editingBlockId) {
        state.tableEdit = null;
      }
      if (shouldRender) {
        requestRender();
      }
    });

    element.addEventListener("dblclick", async (event) => {
      event.stopPropagation();
      if (block.type === "chart" && !chartBlockHasExcelLink(block)) {
        state.activePageId = pageId;
        state.activeRegion = region;
        state.selectedBlockIds = [block.id];
        state.editingBlockId = null;
        openChartConfiguration(block);
        requestRender();
        return;
      }
      if (block.type === "image") {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.addEventListener("change", async () => {
          const file = input.files?.[0];
          if (!file) {
            return;
          }
          try {
            const src = await fileToDataUrl(file);
            documentHistory?.checkpointBeforeChange();
            block.content = { ...(block.content || {}), src };
            requestRender();
          } catch (error) {
            // ignore file errors
          }
        });
        input.click();
        return;
      }
      state.activePageId = pageId;
      state.activeRegion = region;
      const shouldRender =
        state.editingBlockId !== block.id || !state.selectedBlockIds.includes(block.id);
      state.selectedBlockIds = [block.id];
      state.editingBlockId = block.id;
      if (isTableBlock) {
        state.tableEdit = {
          blockId: block.id,
          scope: "cell",
          row: 0,
          col: 0,
          typing: false,
        };
      }
      if (shouldRender) {
        requestRender();
      }
    });

    if (editorHost) {
      const view = createEditor({
        mount: editorHost,
        content: block.content || undefined,
        editable: () => block.id === state.editingBlockId,
        onChange: (nextState) => {
          block.content = nextState.doc.toJSON();
          documentHistory?.editorMutationDebounced();
        },
      });
      state.views.push(view);
      editorHost.addEventListener("focusin", () => documentHistory?.editorFocusCapture());
      editorHost.addEventListener("focusout", () => documentHistory?.editorBlurFlush());

    }

    const interaction = setupDragResize({
      element,
      block,
      gridSize: documentData.grid.size,
      snapEnabled: documentData.grid.snap,
      onInteractionStart: () => documentHistory?.checkpointBeforeChange(),
      onUpdate:
        block.type === "chart"
          ? () => {
              resizeBlockChart(block.id);
            }
          : undefined,
    });
    interaction.setEnabled(!isEditing);
    state.interactions.push(interaction);

    scheduleChartJsMountIfConfigured({
      block,
      element,
      blocksForChartResolve,
      pushInteraction: (h) => state.interactions.push(h),
    });
  });
}
