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
import type { DocumentHistory } from "./documentHistory";
import { openLinkedTableDataSource } from "./linkedTableDataModal";

function buildLinkedTableExtras(
  block: any,
  element: HTMLElement,
  documentHistory: DocumentHistory | undefined,
  requestRender: () => void,
  linkedTableBridge?: { reconfigure?: (block: any) => Promise<void> },
  state?: any,
) {
  const wrap = document.createElement("div");
  wrap.className = "flex flex-wrap items-center gap-2";

  const label = document.createElement("span");
  label.className = "text-xs font-medium text-slate-600";
  label.textContent = "Escala";

  const range = document.createElement("input");
  range.type = "range";
  range.min = "0.5";
  range.max = "2";
  range.step = "0.05";
  range.value = String(clampLinkedTableFontScale(block.metadata?.fontScale));
  range.className = "h-2 w-24 accent-slate-700";

  range.addEventListener("input", () => {
    documentHistory?.checkpointBeforeChange();
    block.metadata = { ...(block.metadata || {}), fontScale: Number(range.value) };
    const table = element.querySelector("table.table-block") as HTMLTableElement | undefined;
    if (table && state) {
      syncTableElementWithBlock(table, block, {
        mode: resolveTableDomMode(block.id, state.editingBlockId, state.tableEdit),
        edit: state.tableEdit?.blockId === block.id ? state.tableEdit : null,
      });
    }
  });

  wrap.append(label, range);

  const dataBtn = document.createElement("button");
  dataBtn.type = "button";
  dataBtn.className =
    "toolbar-icon-button rounded-md border border-slate-300 bg-white text-slate-700 shadow-sm";
  dataBtn.title = "Fonte de dados";
  dataBtn.innerHTML = `<i data-lucide="database"></i>`;
  dataBtn.addEventListener("click", () => openLinkedTableDataSource(block));
  wrap.append(dataBtn);

  if (linkedTableBridge?.reconfigure) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className =
      "toolbar-icon-button rounded-md border border-slate-300 bg-white text-slate-700 shadow-sm";
    btn.title = "Alterar Excel";
    btn.innerHTML = `<i data-lucide="file-spreadsheet"></i>`;
    btn.addEventListener("click", () => linkedTableBridge.reconfigure!(block));
    wrap.append(btn);
  }

  return [wrap];
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

  const linkedExtras =
    block.type === "linkedTable"
      ? buildLinkedTableExtras(
          block,
          element,
          documentHistory,
          requestRender,
          linkedTableBridge,
          state,
        )
      : undefined;

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
    linkedExtras,
    layout,
  });
}
