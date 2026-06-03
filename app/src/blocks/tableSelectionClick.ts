import type {
  TableEditState,
  TableMultiSelection,
  TableSelectionAnchor,
} from "./tableBlockInteraction";
import type { TableEditSelectionPatch, TableSelectionModifiers } from "./tableBlockSelection";
import {
  cellSelectionKey,
  rangeIndices,
  rectCellCoords,
  toggleInList,
} from "./tableSelectionRange";

function cellsFromMulti(multi: TableMultiSelection | undefined): Array<{ row: number; col: number }> {
  return multi?.cells ? [...multi.cells] : [];
}

function rowsFromMulti(multi: TableMultiSelection | undefined): number[] {
  return multi?.rows ? [...multi.rows] : [];
}

function colsFromMulti(multi: TableMultiSelection | undefined): number[] {
  return multi?.cols ? [...multi.cols] : [];
}

function baseAnchor(edit: TableEditState | null | undefined): TableSelectionAnchor {
  if (edit?.anchor) {
    return edit.anchor;
  }
  if (!edit) {
    return { scope: "cell", row: 0, col: 0 };
  }
  return { scope: edit.scope, row: edit.row, col: edit.col };
}

export function singleCellEdit(
  row: number,
  col: number,
  anchor: TableSelectionAnchor,
): TableEditSelectionPatch {
  return {
    scope: "cell",
    row,
    col,
    typing: false,
    multi: undefined,
    anchor,
  };
}

export function singleRowEdit(row: number, anchor: TableSelectionAnchor): TableEditSelectionPatch {
  return {
    scope: "row",
    row,
    col: 0,
    typing: false,
    multi: undefined,
    anchor,
  };
}

export function singleColEdit(col: number, anchor: TableSelectionAnchor): TableEditSelectionPatch {
  return {
    scope: "column",
    row: 0,
    col,
    typing: false,
    multi: undefined,
    anchor,
  };
}

export function selectionFromCellClick(
  prev: TableEditState | null | undefined,
  row: number,
  col: number,
  modifiers: TableSelectionModifiers = {},
): TableEditSelectionPatch {
  const anchor = baseAnchor(prev);
  const shift = modifiers.shift === true;
  const ctrl = modifiers.ctrl === true;

  if (shift && !ctrl) {
    let startRow = row;
    let startCol = col;
    if (prev) {
      startRow = prev.row;
      startCol = prev.col;
    }
    if (anchor.scope === "cell") {
      startRow = anchor.row;
      startCol = anchor.col;
    }
    const cells = rectCellCoords(startRow, startCol, row, col);
    return {
      scope: "cell",
      row,
      col,
      typing: false,
      multi: cells.length > 1 ? { cells } : undefined,
      anchor: { scope: "cell", row: startRow, col: startCol },
    };
  }

  if (ctrl) {
    const existing = cellsFromMulti(prev?.multi);
    const hadOnlyFocus =
      !prev?.multi &&
      prev?.scope === "cell" &&
      prev.row === anchor.row &&
      prev.col === anchor.col;
    let cells = existing.length ? [...existing] : [];
    if (!cells.length && hadOnlyFocus) {
      cells = [{ row: anchor.row, col: anchor.col }];
    }
    const key = cellSelectionKey(row, col);
    const idx = cells.findIndex((c) => cellSelectionKey(c.row, c.col) === key);
    if (idx >= 0) {
      cells = cells.filter((_, i) => i !== idx);
    } else {
      cells = [...cells, { row, col }];
    }
    if (cells.length === 0) {
      return singleCellEdit(row, col, { scope: "cell", row, col });
    }
    if (cells.length === 1) {
      return singleCellEdit(cells[0].row, cells[0].col, anchor);
    }
    return {
      scope: "cell",
      row,
      col,
      typing: false,
      multi: { cells },
      anchor,
    };
  }

  return singleCellEdit(row, col, { scope: "cell", row, col });
}

export function selectionFromRowClick(
  prev: TableEditState | null | undefined,
  row: number,
  modifiers: TableSelectionModifiers = {},
): TableEditSelectionPatch {
  const anchor = baseAnchor(prev);
  const shift = modifiers.shift === true;
  const ctrl = modifiers.ctrl === true;

  if (shift && !ctrl) {
    let anchorRow = row;
    if (prev) {
      anchorRow = prev.row;
    }
    if (anchor.scope === "row") {
      anchorRow = anchor.row;
    }
    const rows = rangeIndices(anchorRow, row);
    return {
      scope: "row",
      row,
      col: 0,
      typing: false,
      multi: rows.length > 1 ? { rows } : undefined,
      anchor: { scope: "row", row: anchorRow, col: 0 },
    };
  }

  if (ctrl) {
    const existing = rowsFromMulti(prev?.multi);
    const hadOnlyFocus = !prev?.multi && prev?.scope === "row" && prev.row === anchor.row;
    let rows = existing.length ? [...existing] : [];
    if (!rows.length && hadOnlyFocus) {
      rows = [anchor.row];
    }
    rows = toggleInList(rows, row);
    if (rows.length === 0) {
      return singleRowEdit(row, { scope: "row", row, col: 0 });
    }
    if (rows.length === 1) {
      return singleRowEdit(rows[0], anchor);
    }
    return {
      scope: "row",
      row,
      col: 0,
      typing: false,
      multi: { rows },
      anchor,
    };
  }

  return singleRowEdit(row, { scope: "row", row, col: 0 });
}

export function selectionFromColClick(
  prev: TableEditState | null | undefined,
  col: number,
  modifiers: TableSelectionModifiers = {},
): TableEditSelectionPatch {
  const anchor = baseAnchor(prev);
  const shift = modifiers.shift === true;
  const ctrl = modifiers.ctrl === true;

  if (shift && !ctrl) {
    let anchorCol = col;
    if (prev) {
      anchorCol = prev.col;
    }
    if (anchor.scope === "column") {
      anchorCol = anchor.col;
    }
    const cols = rangeIndices(anchorCol, col);
    return {
      scope: "column",
      row: 0,
      col,
      typing: false,
      multi: cols.length > 1 ? { cols } : undefined,
      anchor: { scope: "column", row: 0, col: anchorCol },
    };
  }

  if (ctrl) {
    const existing = colsFromMulti(prev?.multi);
    const hadOnlyFocus = !prev?.multi && prev?.scope === "column" && prev.col === anchor.col;
    let cols = existing.length ? [...existing] : [];
    if (!cols.length && hadOnlyFocus) {
      cols = [anchor.col];
    }
    cols = toggleInList(cols, col);
    if (cols.length === 0) {
      return singleColEdit(col, { scope: "column", row: 0, col });
    }
    if (cols.length === 1) {
      return singleColEdit(cols[0], anchor);
    }
    return {
      scope: "column",
      row: 0,
      col,
      typing: false,
      multi: { cols },
      anchor,
    };
  }

  return singleColEdit(col, { scope: "column", row: 0, col });
}
