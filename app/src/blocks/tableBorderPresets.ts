import type { ExcelTableCellStyle } from "../services/excelTableStyle";
import { clearPrintBorderSides } from "../services/excelTableCellCss";
import type { TableEditState } from "./tableBlockInteraction";
import { coordsInScope, mergePartialStyles, type TableBlockStyleContent } from "./tableFormatting";

export type TableBorderPreset =
  | "none"
  | "outside"
  | "top"
  | "bottom"
  | "left"
  | "right"
  | "all";

export const DEFAULT_TABLE_BORDER = "1px solid #0f172a";

export function selectionCellCoords(
  edit: Pick<TableEditState, "scope" | "row" | "col" | "multi"> | null | undefined,
  rows: string[][],
): Array<{ row: number; col: number }> {
  if (!edit) {
    return [{ row: 0, col: 0 }];
  }

  const multi = edit.multi;
  if (multi?.cells?.length) {
    return multi.cells.map((cell) => ({ row: cell.row, col: cell.col }));
  }
  if (multi?.rows?.length) {
    const cells: Array<{ row: number; col: number }> = [];
    for (const row of multi.rows) {
      const line = rows[row];
      if (!line) {
        continue;
      }
      line.forEach((_value, col) => cells.push({ row, col }));
    }
    return cells;
  }
  if (multi?.cols?.length) {
    const cells: Array<{ row: number; col: number }> = [];
    rows.forEach((line, row) => {
      for (const col of multi.cols!) {
        if (col < line.length) {
          cells.push({ row, col });
        }
      }
    });
    return cells;
  }

  return coordsInScope(edit.scope, edit.row, edit.col, rows).map(([row, col]) => ({ row, col }));
}

export function selectionBounds(cells: Array<{ row: number; col: number }>) {
  const rows = cells.map((cell) => cell.row);
  const cols = cells.map((cell) => cell.col);
  return {
    rMin: Math.min(...rows),
    rMax: Math.max(...rows),
    cMin: Math.min(...cols),
    cMax: Math.max(...cols),
  };
}

export function borderPatchForCellInPreset(
  preset: TableBorderPreset,
  row: number,
  col: number,
  bounds: { rMin: number; rMax: number; cMin: number; cMax: number },
  border: string,
): Partial<ExcelTableCellStyle> {
  const { rMin, rMax, cMin, cMax } = bounds;

  if (preset === "none") {
    return {};
  }

  if (preset === "all") {
    return {
      borderTop: border,
      borderRight: border,
      borderBottom: border,
      borderLeft: border,
    };
  }

  if (preset === "outside") {
    return {
      ...(row === rMin ? { borderTop: border } : {}),
      ...(row === rMax ? { borderBottom: border } : {}),
      ...(col === cMin ? { borderLeft: border } : {}),
      ...(col === cMax ? { borderRight: border } : {}),
    };
  }

  if (preset === "top" && row === rMin) {
    return { borderTop: border };
  }
  if (preset === "bottom" && row === rMax) {
    return { borderBottom: border };
  }
  if (preset === "left" && col === cMin) {
    return { borderLeft: border };
  }
  if (preset === "right" && col === cMax) {
    return { borderRight: border };
  }

  return {};
}

export function applyBorderPresetToCells(
  content: TableBlockStyleContent,
  cells: Array<{ row: number; col: number }>,
  preset: TableBorderPreset,
  border: string = DEFAULT_TABLE_BORDER,
) {
  if (cells.length === 0) {
    return;
  }

  if (preset === "none") {
    if (!content.cellStyles) {
      return;
    }
    for (const { row, col } of cells) {
      const key = `${row},${col}`;
      const prev = content.cellStyles[key];
      if (!prev) {
        continue;
      }
      const next = clearPrintBorderSides(prev);
      if (Object.keys(next).length === 0) {
        delete content.cellStyles[key];
      } else {
        content.cellStyles[key] = next;
      }
    }
    if (Object.keys(content.cellStyles).length === 0) {
      delete content.cellStyles;
    }
    return;
  }

  if (!content.cellStyles) {
    content.cellStyles = {};
  }

  const bounds = selectionBounds(cells);
  for (const { row, col } of cells) {
    const key = `${row},${col}`;
    const patch = borderPatchForCellInPreset(preset, row, col, bounds, border);
    if (Object.keys(patch).length === 0) {
      continue;
    }
    const prev = content.cellStyles[key] || {};
    content.cellStyles[key] = mergePartialStyles(prev, patch)!;
  }
}
