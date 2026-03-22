import { createEditor, createEditorCommands } from "../editor/editor";
import { createToolbar } from "../ui/toolbar";
import { createBlockElement } from "../blocks/blockRenderer";
import { setupDragResize } from "../blocks/dragResize";
import { clampLinkedTableFontScale, syncTableElementWithBlock } from "../blocks/tableBlock";
import { fileToDataUrl } from "../blocks/imageBlock";
import { getBlockTextStyle } from "../blocks/blockStyles";
import { chartBlockHasExcelLink } from "../blocks/chartBlock";
import { resizeBlockChart } from "../blocks/chartRuntime";
import { scheduleChartJsMountIfConfigured } from "./mountBlockChart";
import { openChartConfiguration } from "./chartModal";
import { attachFloatingBlockToolbar } from "./renderFloatingToolbar";
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
    const { element, editorHost } = createBlockElement(block, {
      selected: isSelected,
      editing: isEditing,
    });
    container.append(element);

    if (isEditing && block.type === "table") {
      const toolbar = createToolbar(null, { disabled: true, variant: "table" });
      state.interactions.push(attachFloatingBlockToolbar(element, toolbar));
    }

    if (isEditing && block.type === "linkedTable") {
      const toolbar = createToolbar(null, {
        variant: "linkedTable",
        fontScaleValue: clampLinkedTableFontScale(block.metadata?.fontScale),
        onFontScaleChange: (scale: number) => {
          documentHistory?.checkpointBeforeChange();
          block.metadata = { ...(block.metadata || {}), fontScale: scale };
          const shell = document.querySelector(
            `.block-shell[data-block-id="${block.id}"]`,
          );
          const table = shell?.querySelector("table.table-block") as HTMLTableElement | undefined;
          if (table) {
            syncTableElementWithBlock(table, block, true);
          }
        },
        onLinkedTableExcelConfigure: linkedTableBridge?.reconfigure
          ? () => linkedTableBridge.reconfigure!(block)
          : undefined,
      });
      state.interactions.push(attachFloatingBlockToolbar(element, toolbar));
    }

    if (isEditing && block.type === "chart" && chartBlockHasExcelLink(block)) {
      const toolbar = createToolbar(null, {
        variant: "linkedChart",
        fontScaleValue: clampLinkedTableFontScale(block.metadata?.fontScale),
        onFontScaleChange: (scale: number) => {
          documentHistory?.checkpointBeforeChange();
          block.metadata = { ...(block.metadata || {}), fontScale: scale };
          requestRender();
        },
        onLinkedChartExcelConfigure: linkedChartBridge?.reconfigure
          ? () => linkedChartBridge.reconfigure!(block)
          : undefined,
        onLinkedChartDesignConfigure: () => openChartConfiguration(block),
      });
      state.interactions.push(attachFloatingBlockToolbar(element, toolbar));
    }

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

      const applyBlockStyles = () => {
        const style = getBlockTextStyle(block);
        const target = (editorHost.querySelector(".ProseMirror") || editorHost) as HTMLElement;
        target.style.fontSize = style.fontSize;
        target.style.fontFamily = style.fontFamily;
        target.style.fontWeight = style.fontWeight;
        target.style.color = style.color;
        target.style.textAlign = style.textAlign;
      };
      applyBlockStyles();

      if (isEditing) {
        const isHeading = block.type === "heading";
        const headingLevel =
          Number(block.metadata?.headingLevel ?? block.metadata?.level) || 1;
        const toolbar = createToolbar(createEditorCommands(view), {
          variant: isHeading ? "heading" : "text",
          alignValue: block.metadata?.align || "left",
          fontFamilyValue: block.metadata?.fontFamily || "Segoe UI",
          fontSizeValue: block.metadata?.fontSize || getBlockTextStyle(block).fontSize,
          headingLevelValue: Math.min(3, Math.max(1, headingLevel)),
          onAlignChange: (align) => {
            documentHistory?.checkpointBeforeChange();
            block.metadata = { ...(block.metadata || {}), align };
            applyBlockStyles();
            requestRender();
          },
          onFontFamilyChange: (fontFamily) => {
            documentHistory?.checkpointBeforeChange();
            block.metadata = { ...(block.metadata || {}), fontFamily };
            applyBlockStyles();
            requestRender();
          },
          onFontSizeChange: (fontSize) => {
            documentHistory?.checkpointBeforeChange();
            block.metadata = { ...(block.metadata || {}), fontSize };
            applyBlockStyles();
            requestRender();
          },
          onHeadingLevelChange: (level) => {
            documentHistory?.checkpointBeforeChange();
            block.metadata = { ...(block.metadata || {}), headingLevel: level };
            applyBlockStyles();
            requestRender();
          },
        });
        state.interactions.push(attachFloatingBlockToolbar(element, toolbar));
      }
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
