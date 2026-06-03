import type { ExcelTableMerge } from "../services/excelRange";
import type { TableBlockStyleContent } from "./tableFormatting";
import {
  applyExcelSnapshotToLinkedTable,
  getTableStructureMerges,
  getTableVisualRows,
  isLinkedTableBlock,
  writeTypingCellRawValue,
} from "./linkedTableModel";
import {
  clampLinkedTableFontScale,
  createEmptyTable,
  cellValueFromDisplay,
  normalizeRows,
  parseTabularText,
  readTableRows,
} from "./tableBlockData";
import { updateTableBody, type UpdateTableBodyOptions } from "./tableBlockDomBuild";
import {
  applyTableDomMode,
  normalizeTypingCellContent,
  resolveTableDomMode,
  type TableDomMode,
  type TableEditState,
} from "./tableBlockInteraction";

export { updateTableBody, type UpdateTableBodyOptions } from "./tableBlockDomBuild";
export {
  applyTableDomMode,
  normalizeTypingCellContent,
  refreshTableSelectionChrome,
  resolveTableDomMode,
  type TableDomMode,
  type TableEditState,
} from "./tableBlockInteraction";

function tableFontScaleForBlock(block: { type?: string; metadata?: { fontScale?: unknown } }) {
  return block.type === "linkedTable" ? clampLinkedTableFontScale(block.metadata?.fontScale) : 1;
}

export type TableDomConfig = {
  mode: TableDomMode;
  edit: TableEditState | null;
};

/** @deprecated Use syncTableElementWithBlock com TableDomConfig. */
export function setTableEditable(table: HTMLTableElement, editing: boolean) {
  applyTableDomMode(
    table,
    editing ? "structure" : "view",
    editing ? { blockId: "", scope: "cell", row: 0, col: 0, typing: false } : null,
  );
}

export function attachTableHandlers({
  table,
  block,
  onTableEditChange,
}: {
  table: HTMLTableElement;
  block: { content?: TableBlockStyleContent; type?: string; metadata?: { fontScale?: unknown } };
  onTableEditChange?: (edit: Omit<TableEditState, "blockId">) => void;
}) {
  const handleInput = () => {
    if (isLinkedTableBlock(block)) {
      const typingTd = table.querySelector("td.is-typing-cell") as HTMLTableCellElement | null;
      if (!typingTd) {
        return;
      }
      const row = Number(typingTd.dataset.tableRow);
      const col = Number(typingTd.dataset.tableCol);
      if (!Number.isFinite(row)) {
        return;
      }
      /* v8 ignore start */
      if (!Number.isFinite(col)) {
        return;
      }
      /* v8 ignore end */
      writeTypingCellRawValue(block, row, col, cellValueFromDisplay(typingTd.textContent || ""));
      return;
    }
    block.content = block.content || {};
    block.content.rows = readTableRows(table);
  };

  table.addEventListener("input", handleInput);

  table.addEventListener("focusin", (event) => {
    const td = (event.target as HTMLElement | null)?.closest?.("td.is-typing-cell");
    if (td && table.contains(td)) {
      normalizeTypingCellContent(td as HTMLTableCellElement);
    }
  });

  table.addEventListener("click", (event) => {
    if (!table.classList.contains("is-structure-mode") && !table.classList.contains("is-cell-type-mode")) {
      return;
    }
    const target = event.target as HTMLElement;
    const colHead = target.closest(".table-col-select");
    if (colHead) {
      event.stopPropagation();
      onTableEditChange?.({
        scope: "column",
        row: 0,
        col: Number((colHead as HTMLElement).dataset.tableCol),
        typing: false,
      });
      return;
    }
    const rowHead = target.closest(".table-row-select");
    if (rowHead) {
      event.stopPropagation();
      onTableEditChange?.({
        scope: "row",
        row: Number((rowHead as HTMLElement).dataset.tableRow),
        col: 0,
        typing: false,
      });
      return;
    }
    const td = target.closest("td[data-table-row]");
    if (td && table.contains(td)) {
      event.stopPropagation();
      const row = Number((td as HTMLElement).dataset.tableRow);
      const col = Number((td as HTMLElement).dataset.tableCol);
      if (Number.isFinite(row) && Number.isFinite(col)) {
        onTableEditChange?.({ scope: "cell", row, col, typing: false });
      }
    }
  });

  table.addEventListener("dblclick", (event) => {
    if (!table.classList.contains("is-structure-mode")) {
      return;
    }
    const td = (event.target as HTMLElement).closest("td[data-table-row]");
    if (!td || !table.contains(td)) {
      return;
    }
    event.stopPropagation();
    event.preventDefault();
    const row = Number((td as HTMLElement).dataset.tableRow);
    const col = Number((td as HTMLElement).dataset.tableCol);
    if (Number.isFinite(row) && Number.isFinite(col)) {
      onTableEditChange?.({ scope: "cell", row, col, typing: true });
    }
  });

  table.addEventListener("paste", (event) => {
    const text = event.clipboardData?.getData("text/plain");
    if (!text || (!text.includes("\t") && !text.includes("\n"))) {
      return;
    }

    event.preventDefault();
    const rows = normalizeRows(parseTabularText(text));
    const safeRows = rows.length > 0 ? rows : createEmptyTable();
    if (isLinkedTableBlock(block)) {
      applyExcelSnapshotToLinkedTable(block, { rows: safeRows, merges: [] });
    } else {
      block.content = block.content || {};
      block.content.rows = safeRows;
    }
    syncTableElementWithBlock(table, block, {
      mode: table.classList.contains("is-cell-type-mode")
        ? "cell-type"
        : table.classList.contains("is-structure-mode")
          ? "structure"
          : "view",
      edit: null,
    });
  });
}

export function syncTableElementWithBlock(
  table: HTMLTableElement,
  block: { type?: string; content?: any; metadata?: { fontScale?: unknown } },
  config: TableDomConfig | boolean,
) {
  const rows = normalizeRows(
    isLinkedTableBlock(block)
      ? getTableVisualRows(block)
      : block.content?.rows || createEmptyTable(),
  );
  const merges = isLinkedTableBlock(block)
    ? getTableStructureMerges(block)
    : Array.isArray(block.content?.merges)
      ? block.content.merges
      : [];
  const rowHeights = Array.isArray(block.content?.rowHeights)
    ? (block.content.rowHeights as (number | null)[])
    : null;
  const domConfig: TableDomConfig =
    typeof config === "boolean"
      ? { mode: config ? "structure" : "view", edit: null }
      : config;
  updateTableBody(table, rows, merges, block.content || null, rowHeights, {
    fontScale: tableFontScaleForBlock(block),
  });
  applyTableDomMode(table, domConfig.mode, domConfig.edit, { block });
}

export function createTableElement(
  block: { type?: string; content?: TableBlockStyleContent; metadata?: { fontScale?: unknown } },
  options: {
    readOnly?: boolean;
    domConfig?: TableDomConfig;
    onTableEditChange?: (edit: Omit<TableEditState, "blockId">) => void;
  } = {},
) {
  const table = document.createElement("table");
  table.className = "table-block";
  if (block.type === "linkedTable") {
    table.classList.add("is-linked-table");
  }
  const mode: TableDomMode = options.readOnly
    ? "view"
    : options.domConfig?.mode ?? "view";
  const edit = options.domConfig?.edit ?? null;
  syncTableElementWithBlock(table, block, { mode, edit });
  if (!options.readOnly) {
    attachTableHandlers({ table, block, onTableEditChange: options.onTableEditChange });
  }
  return table;
}
