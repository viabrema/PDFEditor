import {
  getTableVisualRows,
  getTypingCellRawValue,
  isLinkedTableBlock,
} from "./linkedTableModel";
import {
  TABLE_CELL_EMPTY_PLACEHOLDER,
  cellValueForDisplay,
  cellValueFromDisplay,
} from "./tableBlockData";
import { colWidthsForTableBlock, syncTableColgroup } from "./tableColumnWidths";
import type { TableFormatScope } from "./tableFormatting";

export type TableMultiSelection = {
  cells?: Array<{ row: number; col: number }>;
  rows?: number[];
  cols?: number[];
};

export type TableSelectionAnchor = {
  scope: TableFormatScope;
  row: number;
  col: number;
};

export type TableEditState = {
  blockId: string;
  scope: TableFormatScope;
  row: number;
  col: number;
  typing: boolean;
  multi?: TableMultiSelection;
  anchor?: TableSelectionAnchor;
};

export type TableDomMode = "view" | "structure" | "cell-type";

export function resolveTableDomMode(
  blockId: string,
  editingBlockId: string | null,
  tableEdit: TableEditState | null | undefined,
): TableDomMode {
  if (editingBlockId !== blockId) {
    return "view";
  }
  if (tableEdit?.typing && tableEdit.blockId === blockId) {
    return "cell-type";
  }
  return "structure";
}

/** Remove <br> fantasma que o browser insere em contenteditable vazio (evita linha extra). */
export function normalizeTypingCellContent(td: HTMLTableCellElement) {
  const text = cellValueFromDisplay(td.textContent || "").trim();
  if (!text && td.querySelector("br")) {
    td.innerHTML = "";
  }
  if (!cellValueFromDisplay(td.textContent || "").trim()) {
    td.textContent = TABLE_CELL_EMPTY_PLACEHOLDER;
  }
}

export function applyTableDomMode(
  table: HTMLTableElement,
  mode: TableDomMode,
  edit: TableEditState | null | undefined,
  options?: { block?: { type?: string; content?: unknown } },
) {
  const block = options?.block;
  const visualRows = block && isLinkedTableBlock(block) ? getTableVisualRows(block) : null;
  table.classList.toggle("is-view-mode", mode === "view");
  table.classList.toggle("is-structure-mode", mode === "structure" || mode === "cell-type");
  table.classList.toggle("is-cell-type-mode", mode === "cell-type");
  table.classList.toggle("is-readonly", mode === "view");
  table.classList.toggle("is-editing", mode !== "view");

  const typingCell =
    mode === "cell-type" && edit?.blockId
      ? { row: edit.row, col: edit.col }
      : null;

  table.querySelectorAll("td[data-table-row]").forEach((cell) => {
    const td = cell as HTMLTableCellElement;
    const r = Number(td.dataset.tableRow);
    const c = Number(td.dataset.tableCol);
    const isTyping =
      typingCell !== null && typingCell.row === r && typingCell.col === c;
    td.contentEditable = isTyping ? "true" : "false";
    td.classList.toggle("is-typing-cell", isTyping);
    if (isTyping && block && isLinkedTableBlock(block)) {
      const raw = getTypingCellRawValue(block, r, c);
      td.textContent = cellValueForDisplay(raw);
      normalizeTypingCellContent(td);
    } else if (!isTyping && visualRows && visualRows[r]) {
      td.textContent = cellValueForDisplay(visualRows[r][c] ?? "");
    } else if (isTyping) {
      normalizeTypingCellContent(td);
    }
  });

  refreshTableSelectionChrome(table, mode === "view" ? null : edit);

  if (block?.content) {
    const colLayout: "view" | "structure" = mode === "view" ? "view" : "structure";
    syncTableColgroup(table, colWidthsForTableBlock(block), colLayout);
  }
}

function highlightColumn(table: HTMLTableElement, col: number) {
  table.querySelector(`.table-col-select[data-table-col="${col}"]`)?.classList.add("is-selected");
  table.querySelectorAll(`td[data-table-col="${col}"]`).forEach((el) => {
    el.classList.add("is-selected");
  });
}

function highlightRow(table: HTMLTableElement, row: number) {
  table.querySelector(`.table-row-select[data-table-row="${row}"]`)?.classList.add("is-selected");
  table.querySelectorAll(`td[data-table-row="${row}"]`).forEach((el) => {
    el.classList.add("is-selected");
  });
}

function highlightCell(table: HTMLTableElement, row: number, col: number) {
  table
    .querySelector(`td[data-table-row="${row}"][data-table-col="${col}"]`)
    ?.classList.add("is-selected");
}

export function refreshTableSelectionChrome(
  table: HTMLTableElement,
  edit: TableEditState | null | undefined,
) {
  table.querySelectorAll(".table-col-select").forEach((el) => {
    el.classList.remove("is-selected");
  });
  table.querySelectorAll(".table-row-select").forEach((el) => {
    el.classList.remove("is-selected");
  });
  table.querySelectorAll("td[data-table-row]").forEach((el) => {
    el.classList.remove("is-selected");
  });

  if (!edit) {
    return;
  }

  const m = edit.multi;
  if (m?.cols?.length) {
    for (const col of m.cols) {
      highlightColumn(table, col);
    }
    return;
  }
  if (m?.rows?.length) {
    for (const row of m.rows) {
      highlightRow(table, row);
    }
    return;
  }
  if (m?.cells?.length) {
    for (const { row, col } of m.cells) {
      highlightCell(table, row, col);
    }
    return;
  }

  if (edit.scope === "column") {
    highlightColumn(table, edit.col);
    return;
  }

  if (edit.scope === "row") {
    highlightRow(table, edit.row);
    return;
  }

  highlightCell(table, edit.row, edit.col);
}
