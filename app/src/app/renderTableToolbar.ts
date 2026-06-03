import {
  clampLinkedTableFontScale,
  resolveTableDomMode,
  syncTableElementWithBlock,
} from "../blocks/tableBlock";
import {
  applyTableFormatPatch,
  ensureTableStyleContent,
  type TableFormatScope,
} from "../blocks/tableFormatting";
import type { ExcelTableCellStyle } from "../services/excelTableStyle";
import { createTableFormatToolbar } from "../ui/tableFormatToolbar";
import { compactIconButton, labeledField } from "../ui/contextToolbarLayout";
import type { DocumentHistory } from "./documentHistory";
import { openLinkedTableDataSource } from "./linkedTableDataModal";

function buildLinkedTableToolbarParts(
  block: any,
  element: HTMLElement,
  documentHistory: DocumentHistory | undefined,
  requestRender: () => void,
  linkedTableBridge?: { reconfigure?: (block: any) => Promise<void> },
  state?: any,
) {
  const actionButtons: HTMLElement[] = [
    compactIconButton("database", "Fonte de dados", () => openLinkedTableDataSource(block)),
  ];
  if (linkedTableBridge?.reconfigure) {
    actionButtons.push(
      compactIconButton("file-spreadsheet", "Alterar Excel", () => linkedTableBridge.reconfigure!(block)),
    );
  }

  const range = document.createElement("input");
  range.type = "range";
  range.min = "0.5";
  range.max = "2";
  range.step = "0.05";
  range.value = String(clampLinkedTableFontScale(block.metadata?.fontScale));
  range.className = "h-2 w-full accent-slate-700";
  range.addEventListener("input", () => {
    documentHistory?.checkpointBeforeChange();
    block.metadata = { ...(block.metadata || {}), fontScale: Number(range.value) };
    const table = element.querySelector("table.table-block") as HTMLTableElement | undefined;
    if (table && state) {
      syncTableElementWithBlock(table, block, {
        mode: resolveTableDomMode(block.id, state.editingBlockId, state.tableEdit),
        edit: state.tableEdit?.blockId === block.id ? state.tableEdit : null,
      });
    } else {
      requestRender();
    }
  });

  const scaleField = labeledField("Escala da fonte", range);
  const valueEl = document.createElement("span");
  valueEl.className = "text-xs tabular-nums text-slate-500";
  valueEl.textContent = Number(range.value).toFixed(2);
  range.addEventListener("input", () => {
    valueEl.textContent = Number(range.value).toFixed(2);
  });
  scaleField.append(valueEl);

  return { actionButtons, fields: [scaleField] };
}

export function mountTableFormatToolbar({
  block,
  state,
  element,
  documentHistory,
  requestRender,
  linkedTableBridge,
  layout = "inline",
}: {
  block: any;
  state: any;
  element: HTMLElement;
  documentHistory?: DocumentHistory;
  requestRender: () => void;
  linkedTableBridge?: { reconfigure?: (block: any) => Promise<void> };
  layout?: "inline" | "sidebar";
}) {
  ensureTableStyleContent(block);
  if (!state.tableEdit || state.tableEdit.blockId !== block.id) {
    state.tableEdit = { blockId: block.id, scope: "cell", row: 0, col: 0, typing: false };
  }

  const linkedParts =
    block.type === "linkedTable"
      ? buildLinkedTableToolbarParts(
          block,
          element,
          documentHistory,
          requestRender,
          linkedTableBridge,
          state,
        )
      : null;

  return createTableFormatToolbar({
    block,
    getFocus: () => {
      if (state.tableEdit?.blockId === block.id) {
        return { row: state.tableEdit.row, col: state.tableEdit.col };
      }
      return { row: 0, col: 0 };
    },
    getScope: (): TableFormatScope => {
      if (state.tableEdit?.blockId === block.id) {
        return state.tableEdit.scope;
      }
      return "cell";
    },
    onApply: (patch: Partial<ExcelTableCellStyle>, scope: TableFormatScope) => {
      documentHistory?.checkpointBeforeChange();
      const focus = state.tableEdit?.blockId === block.id ? state.tableEdit : { row: 0, col: 0 };
      applyTableFormatPatch(block.content, scope, focus.row, focus.col, patch);
      const table = element.querySelector("table.table-block") as HTMLTableElement | undefined;
      if (table) {
        syncTableElementWithBlock(table, block, {
          mode: resolveTableDomMode(block.id, state.editingBlockId, state.tableEdit),
          edit: state.tableEdit?.blockId === block.id ? state.tableEdit : null,
        });
      }
    },
    hiddenValue: block.metadata?.hidden === true,
    onToggleHidden: (hidden: boolean) => {
      documentHistory?.checkpointBeforeChange();
      block.metadata = { ...(block.metadata || {}), hidden };
      requestRender();
    },
    linkedActionButtons: linkedParts?.actionButtons,
    linkedFields: linkedParts?.fields,
    layout,
  });
}
