import {
  clampLinkedTableFontScale,
  resolveTableDomMode,
  syncTableElementWithBlock,
} from "../blocks/tableBlock";
import { getTableDataRows } from "../blocks/linkedTableModel";
import {
  getStructureMerges,
  mergeCellsInBlock,
  mergeStateForSelection,
  unmergeCellsInBlock,
} from "../blocks/tableCellMerge";
import {
  applyFormatPatchToEdit,
  effectiveFormatScope,
  ensureTableStyleContent,
  type TableFormatScope,
} from "../blocks/tableFormatting";
import { applyBorderPresetToCells, selectionCellCoords } from "../blocks/tableBorderPresets";
import type { TableBorderPreset } from "../blocks/tableBorderPresets";
import type { ExcelTableCellStyle } from "../services/excelTableStyle";
import { createTableFormatToolbar } from "../ui/tableFormatToolbar";
import { compactIconButton, labeledField } from "../ui/contextToolbarLayout";
import type { TableEditState } from "../blocks/tableBlockInteraction";
import type { DocumentHistory } from "./documentHistory";
import { openLinkedTableDataSource } from "./linkedTableDataModal";

function tableRowColCounts(block: { type?: string; content?: unknown }) {
  const rows = getTableDataRows(block);
  return {
    rowCount: rows.length,
    colCount: rows.reduce((max, row) => Math.max(max, row.length), 0),
  };
}

function applyTableMergeEdit(
  block: { id?: string; type?: string; content?: unknown; metadata?: { fontScale?: unknown } },
  state: { tableEdit?: { blockId?: string } & Record<string, unknown> },
  element: HTMLElement,
  documentHistory: DocumentHistory | undefined,
  requestRender: () => void,
  nextEdit: Omit<TableEditState, "blockId"> | null,
) {
  if (!nextEdit || !block.id) {
    return;
  }
  documentHistory?.checkpointBeforeChange();
  state.tableEdit = { blockId: block.id, ...nextEdit };
  const table = element.querySelector("table.table-block") as HTMLTableElement | undefined;
  if (table) {
    syncTableElementWithBlock(table, block, {
      mode: resolveTableDomMode(block.id, (state as { editingBlockId?: string | null }).editingBlockId ?? null, state.tableEdit as TableEditState),
      edit: state.tableEdit as TableEditState,
    });
  }
  requestRender();
}

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
        return effectiveFormatScope(state.tableEdit);
      }
      return "cell";
    },
    onApply: (patch: Partial<ExcelTableCellStyle>, _scope: TableFormatScope) => {
      documentHistory?.checkpointBeforeChange();
      const edit = state.tableEdit?.blockId === block.id ? state.tableEdit : null;
      applyFormatPatchToEdit(block.content, edit, patch);
      const table = element.querySelector("table.table-block") as HTMLTableElement | undefined;
      if (table) {
        syncTableElementWithBlock(table, block, {
          mode: resolveTableDomMode(block.id, state.editingBlockId, state.tableEdit),
          edit: state.tableEdit?.blockId === block.id ? state.tableEdit : null,
        });
      }
    },
    onApplyBorderPreset: (preset: TableBorderPreset, border?: string) => {
      documentHistory?.checkpointBeforeChange();
      const edit = state.tableEdit?.blockId === block.id ? state.tableEdit : null;
      const rows = getTableDataRows(block);
      const cells = selectionCellCoords(edit, rows);
      applyBorderPresetToCells(block.content, cells, preset, border);
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
    getMergeState: () => {
      const edit = state.tableEdit?.blockId === block.id ? state.tableEdit : null;
      const { rowCount, colCount } = tableRowColCounts(block);
      return mergeStateForSelection(edit, getStructureMerges(block), rowCount, colCount);
    },
    onMerge: () => {
      const edit = state.tableEdit?.blockId === block.id ? state.tableEdit : null;
      if (!edit) {
        return;
      }
      const next = mergeCellsInBlock(block, edit);
      applyTableMergeEdit(block, state, element, documentHistory, requestRender, next);
    },
    onUnmerge: () => {
      const edit = state.tableEdit?.blockId === block.id ? state.tableEdit : null;
      if (!edit) {
        return;
      }
      const next = unmergeCellsInBlock(block, edit);
      applyTableMergeEdit(block, state, element, documentHistory, requestRender, next);
    },
    linkedActionButtons: linkedParts?.actionButtons,
    linkedFields: linkedParts?.fields,
    layout,
  });
}
