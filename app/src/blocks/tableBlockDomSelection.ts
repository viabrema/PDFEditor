import type { TableEditState } from "./tableBlockInteraction";
import {
  selectionForTyping,
  selectionFromCellClick,
  selectionFromCellDrag,
  selectionFromColClick,
  selectionFromColDrag,
  selectionFromRowClick,
  selectionFromRowDrag,
  type TableSelectionModifiers,
} from "./tableBlockSelection";

const DRAG_THRESHOLD_PX = 4;

function modifiersFromMouseEvent(event: MouseEvent): TableSelectionModifiers {
  return {
    shift: event.shiftKey,
    ctrl: event.ctrlKey || event.metaKey,
  };
}

function cellCoordsFromTarget(
  table: HTMLTableElement,
  target: EventTarget | null,
): { kind: "cell"; row: number; col: number } | null {
  const td = (target as HTMLElement | null)?.closest?.("td[data-table-row]");
  /* v8 ignore start -- pointer outside table cell */
  if (!td || !table.contains(td)) {
    return null;
  }
  /* v8 ignore end */
  const row = Number((td as HTMLElement).dataset.tableRow);
  const col = Number((td as HTMLElement).dataset.tableCol);
  /* v8 ignore start -- DOM guard for malformed data-table-* */
  if (!Number.isFinite(row) || !Number.isFinite(col)) {
    return null;
  }
  /* v8 ignore end */
  return { kind: "cell", row, col };
}

function rowIndexFromTarget(
  table: HTMLTableElement,
  target: EventTarget | null,
): number | null {
  const rowHead = (target as HTMLElement | null)?.closest?.(".table-row-select");
  if (!rowHead || !table.contains(rowHead)) {
    return null;
  }
  const row = Number((rowHead as HTMLElement).dataset.tableRow);
  return Number.isFinite(row) ? row : null;
}

function colIndexFromTarget(
  table: HTMLTableElement,
  target: EventTarget | null,
): number | null {
  const colHead = (target as HTMLElement | null)?.closest?.(".table-col-select");
  if (!colHead || !table.contains(colHead)) {
    return null;
  }
  const col = Number((colHead as HTMLElement).dataset.tableCol);
  return Number.isFinite(col) ? col : null;
}

type DragState = {
  kind: "cell" | "row" | "col";
  anchorRow: number;
  anchorCol: number;
  startX: number;
  startY: number;
  active: boolean;
};

export function attachTableStructureSelection(
  table: HTMLTableElement,
  options: {
    getTableEdit?: () => TableEditState | null;
    onTableEditChange?: (edit: Omit<TableEditState, "blockId">) => void;
  },
) {
  const { getTableEdit, onTableEditChange } = options;
  let suppressClick = false;
  let drag: DragState | null = null;

  const clearDragListeners = () => {
    document.removeEventListener("mousemove", onDocumentMouseMove);
    document.removeEventListener("mouseup", onDocumentMouseUp);
    table.classList.remove("is-table-dragging");
    drag = null;
  };

  const applyDragSelection = (event: MouseEvent) => {
    if (!drag || !onTableEditChange) {
      return;
    }
    const target = document.elementFromPoint(event.clientX, event.clientY);
    let patch: Omit<TableEditState, "blockId"> | null = null;
    if (drag.kind === "cell") {
      const cell = cellCoordsFromTarget(table, target);
      if (cell) {
        patch = selectionFromCellDrag(drag.anchorRow, drag.anchorCol, cell.row, cell.col);
      }
    } else if (drag.kind === "row") {
      const row = rowIndexFromTarget(table, target) ?? cellCoordsFromTarget(table, target)?.row;
      if (row !== null && row !== undefined) {
        patch = selectionFromRowDrag(drag.anchorRow, row);
      }
    } else {
      const col = colIndexFromTarget(table, target) ?? cellCoordsFromTarget(table, target)?.col;
      if (col !== null && col !== undefined) {
        patch = selectionFromColDrag(drag.anchorCol, col);
      }
    }
    if (patch) {
      onTableEditChange(patch);
    }
  };

  const onDocumentMouseMove = (event: MouseEvent) => {
    /* v8 ignore next -- listener cleared before drag is nulled */
    if (!drag) {
      return;
    }
    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    if (!drag.active) {
      if (Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) {
        return;
      }
      drag.active = true;
      table.classList.add("is-table-dragging");
    }
    event.preventDefault();
    applyDragSelection(event);
  };

  const onDocumentMouseUp = () => {
    if (drag?.active) {
      suppressClick = true;
    }
    clearDragListeners();
  };

  table.addEventListener("mousedown", (event) => {
    if (!table.classList.contains("is-structure-mode")) {
      return;
    }
    if (event.button !== 0) {
      return;
    }
    const target = event.target as HTMLElement;
    if (target.closest(".is-typing-cell")) {
      return;
    }

    if (target.closest(".table-col-resize-handle")) {
      return;
    }

    const col = colIndexFromTarget(table, target);
    if (col !== null && target.closest(".table-col-select")) {
      if (event.shiftKey || event.ctrlKey || event.metaKey) {
        return;
      }
      drag = {
        kind: "col",
        anchorRow: 0,
        anchorCol: col,
        startX: event.clientX,
        startY: event.clientY,
        active: false,
      };
      event.preventDefault();
      document.addEventListener("mousemove", onDocumentMouseMove);
      document.addEventListener("mouseup", onDocumentMouseUp);
      return;
    }

    const row = rowIndexFromTarget(table, target);
    if (row !== null && target.closest(".table-row-select")) {
      if (event.shiftKey || event.ctrlKey || event.metaKey) {
        return;
      }
      drag = {
        kind: "row",
        anchorRow: row,
        anchorCol: 0,
        startX: event.clientX,
        startY: event.clientY,
        active: false,
      };
      event.preventDefault();
      document.addEventListener("mousemove", onDocumentMouseMove);
      document.addEventListener("mouseup", onDocumentMouseUp);
      return;
    }

    const cell = cellCoordsFromTarget(table, target);
    if (cell) {
      if (event.shiftKey || event.ctrlKey || event.metaKey) {
        return;
      }
      drag = {
        kind: "cell",
        anchorRow: cell.row,
        anchorCol: cell.col,
        startX: event.clientX,
        startY: event.clientY,
        active: false,
      };
      event.preventDefault();
      document.addEventListener("mousemove", onDocumentMouseMove);
      document.addEventListener("mouseup", onDocumentMouseUp);
    }
  });

  table.addEventListener("click", (event) => {
    if (suppressClick) {
      suppressClick = false;
      return;
    }
    if (!table.classList.contains("is-structure-mode") && !table.classList.contains("is-cell-type-mode")) {
      return;
    }
    const target = event.target as HTMLElement;
    const prev = getTableEdit?.() ?? null;
    const mods = modifiersFromMouseEvent(event);

    const colHead = target.closest(".table-col-select");
    if (colHead) {
      event.stopPropagation();
      const col = Number((colHead as HTMLElement).dataset.tableCol);
      if (Number.isFinite(col)) {
        onTableEditChange?.(selectionFromColClick(prev, col, mods));
      }
      return;
    }

    const rowHead = target.closest(".table-row-select");
    if (rowHead) {
      event.stopPropagation();
      const row = Number((rowHead as HTMLElement).dataset.tableRow);
      if (Number.isFinite(row)) {
        onTableEditChange?.(selectionFromRowClick(prev, row, mods));
      }
      return;
    }

    const td = target.closest("td[data-table-row]");
    if (td && table.contains(td)) {
      event.stopPropagation();
      const row = Number((td as HTMLElement).dataset.tableRow);
      const col = Number((td as HTMLElement).dataset.tableCol);
      if (Number.isFinite(row) && Number.isFinite(col)) {
        onTableEditChange?.(selectionFromCellClick(prev, row, col, mods));
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
      onTableEditChange?.(selectionForTyping(row, col));
    }
  });
}
