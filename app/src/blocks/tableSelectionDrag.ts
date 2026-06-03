import type { TableEditSelectionPatch } from "./tableBlockSelection";
import { rangeIndices, rectCellCoords } from "./tableSelectionRange";
import { singleCellEdit, singleColEdit, singleRowEdit } from "./tableSelectionClick";

export function selectionFromCellDrag(
  anchorRow: number,
  anchorCol: number,
  endRow: number,
  endCol: number,
): TableEditSelectionPatch {
  const cells = rectCellCoords(anchorRow, anchorCol, endRow, endCol);
  const anchor = { scope: "cell" as const, row: anchorRow, col: anchorCol };
  if (cells.length <= 1) {
    return singleCellEdit(endRow, endCol, anchor);
  }
  return {
    scope: "cell",
    row: endRow,
    col: endCol,
    typing: false,
    multi: { cells },
    anchor,
  };
}

export function selectionFromRowDrag(
  anchorRow: number,
  endRow: number,
): TableEditSelectionPatch {
  const rows = rangeIndices(anchorRow, endRow);
  const anchor = { scope: "row" as const, row: anchorRow, col: 0 };
  if (rows.length <= 1) {
    return singleRowEdit(endRow, anchor);
  }
  return {
    scope: "row",
    row: endRow,
    col: 0,
    typing: false,
    multi: { rows },
    anchor,
  };
}

export function selectionFromColDrag(
  anchorCol: number,
  endCol: number,
): TableEditSelectionPatch {
  const cols = rangeIndices(anchorCol, endCol);
  const anchor = { scope: "column" as const, row: 0, col: anchorCol };
  if (cols.length <= 1) {
    return singleColEdit(endCol, anchor);
  }
  return {
    scope: "column",
    row: 0,
    col: endCol,
    typing: false,
    multi: { cols },
    anchor,
  };
}

export function selectionForTyping(row: number, col: number): TableEditSelectionPatch {
  return {
    scope: "cell",
    row,
    col,
    typing: true,
    multi: undefined,
    anchor: { scope: "cell", row, col },
  };
}
