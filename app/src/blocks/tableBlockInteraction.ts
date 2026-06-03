import { TABLE_CELL_EMPTY_PLACEHOLDER, cellValueFromDisplay } from "./tableBlockData";
import type { TableFormatScope } from "./tableFormatting";

export type TableEditState = {
  blockId: string;
  scope: TableFormatScope;
  row: number;
  col: number;
  typing: boolean;
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
) {
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
    if (isTyping) {
      normalizeTypingCellContent(td);
    }
  });

  refreshTableSelectionChrome(table, mode === "view" ? null : edit);
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

  if (edit.scope === "column") {
    table
      .querySelector(`.table-col-select[data-table-col="${edit.col}"]`)
      ?.classList.add("is-selected");
    table.querySelectorAll(`td[data-table-col="${edit.col}"]`).forEach((el) => {
      el.classList.add("is-selected");
    });
    return;
  }

  if (edit.scope === "row") {
    table
      .querySelector(`.table-row-select[data-table-row="${edit.row}"]`)
      ?.classList.add("is-selected");
    table.querySelectorAll(`td[data-table-row="${edit.row}"]`).forEach((el) => {
      el.classList.add("is-selected");
    });
    return;
  }

  table
    .querySelector(`td[data-table-row="${edit.row}"][data-table-col="${edit.col}"]`)
    ?.classList.add("is-selected");
}
