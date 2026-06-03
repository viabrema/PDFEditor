import type { ExcelTableMerge } from "../services/excelRange";
import { isLinkedTableBlock } from "./linkedTableModel";
import type { TableEditState } from "./tableBlockInteraction";
import { rectCellCoords } from "./tableSelectionRange";

export type CellBounds = {
  row0: number;
  col0: number;
  row1: number;
  col1: number;
};

export type MergeActionState = {
  canMerge: boolean;
  canUnmerge: boolean;
};

function normalizeBounds(b: CellBounds): CellBounds {
  return {
    row0: Math.min(b.row0, b.row1),
    col0: Math.min(b.col0, b.col1),
    row1: Math.max(b.row0, b.row1),
    col1: Math.max(b.col0, b.col1),
  };
}

function mergeRect(m: ExcelTableMerge): CellBounds {
  return {
    row0: m.r,
    col0: m.c,
    row1: m.r + m.rowspan - 1,
    col1: m.c + m.colspan - 1,
  };
}

function rectsOverlap(a: CellBounds, b: CellBounds): boolean {
  const x = normalizeBounds(a);
  const y = normalizeBounds(b);
  return x.row0 <= y.row1 && x.row1 >= y.row0 && x.col0 <= y.col1 && x.col1 >= y.col0;
}

function cellCount(b: CellBounds): number {
  const n = normalizeBounds(b);
  return (n.row1 - n.row0 + 1) * (n.col1 - n.col0 + 1);
}

/** Selecao em modo celula (unica ou multipla); linha/coluna inteira nao mescla. */
export function selectionBoundsFromEdit(
  edit: Pick<TableEditState, "scope" | "row" | "col" | "multi"> | null | undefined,
): CellBounds | null {
  if (!edit || edit.scope !== "cell") {
    return null;
  }
  const m = edit.multi;
  if (m?.cells?.length) {
    let row0 = m.cells[0].row;
    let col0 = m.cells[0].col;
    let row1 = row0;
    let col1 = col0;
    for (const { row, col } of m.cells) {
      row0 = Math.min(row0, row);
      col0 = Math.min(col0, col);
      row1 = Math.max(row1, row);
      col1 = Math.max(col1, col);
    }
    return { row0, col0, row1, col1 };
  }
  return { row0: edit.row, col0: edit.col, row1: edit.row, col1: edit.col };
}

export function getStructureMerges(block: { type?: string; content?: { merges?: ExcelTableMerge[] } }): ExcelTableMerge[] {
  const list = block.content?.merges;
  return Array.isArray(list) ? list.map((m) => ({ ...m })) : [];
}

export function setStructureMerges(
  block: { content?: { merges?: ExcelTableMerge[] } },
  merges: ExcelTableMerge[],
) {
  block.content = block.content || {};
  block.content.merges = merges.map((m) => ({ ...m }));
}

function removeOverlappingMerges(merges: ExcelTableMerge[], bounds: CellBounds): ExcelTableMerge[] {
  const b = normalizeBounds(bounds);
  return merges.filter((m) => !rectsOverlap(mergeRect(m), b));
}

export function mergeStateForSelection(
  edit: Pick<TableEditState, "scope" | "row" | "col" | "multi"> | null | undefined,
  merges: ExcelTableMerge[],
  rowCount: number,
  colCount: number,
): MergeActionState {
  const bounds = selectionBoundsFromEdit(edit);
  if (!bounds) {
    return { canMerge: false, canUnmerge: false };
  }
  const b = normalizeBounds(bounds);
  if (b.row1 >= rowCount || b.col1 >= colCount) {
    return { canMerge: false, canUnmerge: false };
  }

  const canMerge = cellCount(b) >= 2;
  const touching = merges.filter((m) => rectsOverlap(mergeRect(m), b));
  const canUnmerge = touching.some((m) => m.rowspan > 1 || m.colspan > 1);

  return { canMerge, canUnmerge };
}

function applyPlainTableRowMerge(
  rows: string[][],
  bounds: CellBounds,
): void {
  const b = normalizeBounds(bounds);
  const anchor = rows[b.row0]?.[b.col0] ?? "";
  let combined = String(anchor).trim();
  if (!combined) {
    for (let r = b.row0; r <= b.row1; r++) {
      for (let c = b.col0; c <= b.col1; c++) {
        const v = String(rows[r]?.[c] ?? "").trim();
        if (v) {
          combined = v;
          break;
        }
      }
      if (combined) {
        break;
      }
    }
  }
  if (!rows[b.row0]) {
    rows[b.row0] = [];
  }
  rows[b.row0][b.col0] = combined;
  for (let r = b.row0; r <= b.row1; r++) {
    if (!rows[r]) {
      rows[r] = [];
    }
    for (let c = b.col0; c <= b.col1; c++) {
      if (r === b.row0 && c === b.col0) {
        continue;
      }
      rows[r][c] = "";
    }
  }
}

export function mergeCellsInBlock(
  block: { type?: string; content?: { rows?: string[][]; merges?: ExcelTableMerge[] } },
  edit: Pick<TableEditState, "scope" | "row" | "col" | "multi">,
): Omit<TableEditState, "blockId"> | null {
  const bounds = selectionBoundsFromEdit(edit);
  if (!bounds || cellCount(bounds) < 2) {
    return null;
  }
  const b = normalizeBounds(bounds);
  const merges = getStructureMerges(block);
  const nextMerges = removeOverlappingMerges(merges, b);
  nextMerges.push({
    r: b.row0,
    c: b.col0,
    rowspan: b.row1 - b.row0 + 1,
    colspan: b.col1 - b.col0 + 1,
  });
  setStructureMerges(block, nextMerges);

  if (!isLinkedTableBlock(block) && Array.isArray(block.content?.rows)) {
    applyPlainTableRowMerge(block.content!.rows as string[][], b);
  }

  const cells = rectCellCoords(b.row0, b.col0, b.row1, b.col1);
  return {
    scope: "cell",
    row: b.row0,
    col: b.col0,
    typing: false,
    multi: { cells },
    anchor: { scope: "cell", row: b.row0, col: b.col0 },
  };
}

export function unmergeCellsInBlock(
  block: { type?: string; content?: { merges?: ExcelTableMerge[] } },
  edit: Pick<TableEditState, "scope" | "row" | "col" | "multi">,
): Omit<TableEditState, "blockId"> | null {
  const bounds = selectionBoundsFromEdit(edit);
  if (!bounds) {
    return null;
  }
  const b = normalizeBounds(bounds);
  const merges = getStructureMerges(block);
  const nextMerges = merges.filter((m) => !rectsOverlap(mergeRect(m), b));
  if (nextMerges.length === merges.length) {
    return null;
  }
  setStructureMerges(block, nextMerges);

  return {
    scope: "cell",
    row: b.row0,
    col: b.col0,
    typing: false,
    multi: undefined,
    anchor: { scope: "cell", row: b.row0, col: b.col0 },
  };
}
