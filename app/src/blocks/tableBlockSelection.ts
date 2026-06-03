import type { TableEditState, TableMultiSelection, TableSelectionAnchor } from "./tableBlockInteraction";
import { cellSelectionKey } from "./tableSelectionRange";

export type {
  TableEditState,
  TableMultiSelection,
  TableSelectionAnchor,
} from "./tableBlockInteraction";

export type TableEditSelectionPatch = Omit<TableEditState, "blockId">;

export type TableSelectionModifiers = {
  shift?: boolean;
  ctrl?: boolean;
};

export {
  selectionFromCellClick,
  selectionFromColClick,
  selectionFromRowClick,
} from "./tableSelectionClick";
export {
  selectionForTyping,
  selectionFromCellDrag,
  selectionFromColDrag,
  selectionFromRowDrag,
} from "./tableSelectionDrag";

export { cellSelectionKey, rectCellCoords } from "./tableSelectionRange";

export function hasMultiSelection(edit: Pick<TableEditState, "multi"> | null | undefined): boolean {
  const m = edit?.multi;
  if (!m) {
    return false;
  }
  return (
    (m.cells?.length ?? 0) > 1 ||
    (m.rows?.length ?? 0) > 1 ||
    (m.cols?.length ?? 0) > 1
  );
}

export function isCellInMultiSelection(
  edit: Pick<TableEditState, "scope" | "row" | "col" | "multi"> | null | undefined,
  row: number,
  col: number,
): boolean {
  if (!edit) {
    return false;
  }
  const key = cellSelectionKey(row, col);
  if (edit.multi?.cells?.some((c) => cellSelectionKey(c.row, c.col) === key)) {
    return true;
  }
  if (edit.multi?.rows?.includes(row)) {
    return true;
  }
  if (edit.multi?.cols?.includes(col)) {
    return true;
  }
  if (!edit.multi) {
    if (edit.scope === "column") {
      return edit.col === col;
    }
    if (edit.scope === "row") {
      return edit.row === row;
    }
    return edit.scope === "cell" && edit.row === row && edit.col === col;
  }
  return false;
}
