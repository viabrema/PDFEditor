import { getTableDataRows, isLinkedTableBlock } from "../blocks/linkedTableModel";
import type { TableBlockStyleContent } from "../blocks/tableFormatting";
import type { ExcelTableMerge } from "../services/excelRange";
import type { ExcelTableCellStyle } from "../services/excelTableStyle";

export function parseDeleteRowIndices(action: Record<string, unknown>): number[] {
  const raw = action.deleteRows ?? action.deleteTableRows ?? action.tableRowDelete;
  if (!Array.isArray(raw)) {
    return [];
  }
  const uniq = new Set<number>();
  for (const entry of raw) {
    if (typeof entry === "number" && entry >= 0 && Number.isFinite(entry)) {
      uniq.add(Math.floor(entry));
    }
  }
  return [...uniq].sort((a, b) => b - a);
}

function remapIndexAfterDeletes(index: number, deletedAsc: number[]): number {
  if (deletedAsc.includes(index)) {
    return -1;
  }
  let idx = index;
  for (const d of deletedAsc) {
    if (d < index) {
      idx -= 1;
    }
  }
  return idx;
}

export function remapCellStyleMapAfterRowDeletes(
  map: Record<string, Partial<ExcelTableCellStyle>> | undefined,
  deletedRows: number[],
): Record<string, Partial<ExcelTableCellStyle>> {
  if (!map) {
    return {};
  }
  const deletedAsc = [...new Set(deletedRows)].sort((a, b) => a - b);
  const out: Record<string, Partial<ExcelTableCellStyle>> = {};
  for (const [key, style] of Object.entries(map)) {
    const parts = key.split(",");
    if (parts.length !== 2) {
      continue;
    }
    const r0 = Number(parts[0]);
    const c0 = Number(parts[1]);
    if (!Number.isFinite(r0) || !Number.isFinite(c0)) {
      continue;
    }
    const newR = remapIndexAfterDeletes(r0, deletedAsc);
    if (newR < 0) {
      continue;
    }
    out[`${newR},${c0}`] = style;
  }
  return out;
}

export function remapRowStyleMapAfterRowDeletes(
  map: Record<string, Partial<ExcelTableCellStyle>> | undefined,
  deletedRows: number[],
): Record<string, Partial<ExcelTableCellStyle>> {
  if (!map) {
    return {};
  }
  const deletedAsc = [...new Set(deletedRows)].sort((a, b) => a - b);
  const out: Record<string, Partial<ExcelTableCellStyle>> = {};
  for (const [key, style] of Object.entries(map)) {
    const r0 = Number(key);
    if (!Number.isFinite(r0)) {
      continue;
    }
    const newR = remapIndexAfterDeletes(r0, deletedAsc);
    if (newR < 0) {
      continue;
    }
    out[String(newR)] = style;
  }
  return out;
}

export function adjustMergesAfterRowDeletes(
  merges: ExcelTableMerge[],
  deletedRows: number[],
): ExcelTableMerge[] {
  if (!merges.length || !deletedRows.length) {
    return merges;
  }
  const sorted = [...new Set(deletedRows)].sort((a, b) => a - b);
  return merges
    .filter((m) => {
      const end = m.r + m.rowspan - 1;
      return !sorted.some((d) => d >= m.r && d <= end);
    })
    .map((m) => {
      let r = m.r;
      for (const d of sorted) {
        if (d < r) {
          r -= 1;
        }
      }
      return { ...m, r };
    });
}

export function hasVisualTableFields(action: Record<string, unknown>): boolean {
  return Boolean(
    action.tableFormat ||
      action.tableFormats ||
      action.rowStyles ||
      action.cellStyles ||
      action.colStyles,
  );
}

function pruneTableStylesToDimensions(content: TableBlockStyleContent, rows: string[][]) {
  const rowCount = rows.length;
  if (content.cellStyles) {
    const next: Record<string, Partial<ExcelTableCellStyle>> = {};
    for (const [key, style] of Object.entries(content.cellStyles)) {
      const parts = key.split(",");
      const r = Number(parts[0]);
      const c = Number(parts[1]);
      if (r >= 0 && r < rowCount && c >= 0 && c < (rows[r]?.length ?? 0)) {
        next[key] = style;
      }
    }
    content.cellStyles = next;
  }
  if (content.rowStyles) {
    const next: Record<string, Partial<ExcelTableCellStyle>> = {};
    for (const [key, style] of Object.entries(content.rowStyles)) {
      const r = Number(key);
      if (r >= 0 && r < rowCount) {
        next[key] = style;
      }
    }
    content.rowStyles = next;
  }
  for (const mergeKey of ["merges", "dataSourceMerges"] as const) {
    const list = (content as Record<string, unknown>)[mergeKey];
    if (!Array.isArray(list)) {
      continue;
    }
    (content as Record<string, unknown>)[mergeKey] = (list as ExcelTableMerge[]).filter((m) => {
      if (m.r < 0 || m.r >= rowCount) {
        return false;
      }
      const cols = rows[m.r]?.length ?? 0;
      return m.c >= 0 && m.c < cols;
    });
  }
  const rowHeights = (content as { rowHeights?: (number | null)[] }).rowHeights;
  if (Array.isArray(rowHeights) && rowHeights.length > rowCount) {
    (content as { rowHeights?: (number | null)[] }).rowHeights = rowHeights.slice(0, rowCount);
  }
}

export function applyTableDataMatrix(
  block: { type?: string; content?: TableBlockStyleContent },
  content: TableBlockStyleContent,
  rows: string[][],
) {
  const cloned = rows.map((row) => [...row]);
  if (isLinkedTableBlock(block)) {
    content.dataSourceRows = cloned;
    delete content.rows;
  } else {
    content.rows = cloned;
  }
  pruneTableStylesToDimensions(content, cloned);
}

export function deleteTableRowsFromBlock(
  block: { type?: string; content?: TableBlockStyleContent },
  indices: number[],
): boolean {
  const content = block.content;
  if (!content || indices.length === 0) {
    return false;
  }
  const existing = getTableDataRows(block);
  const toDelete = [...new Set(indices)]
    .filter((i) => i >= 0 && i < existing.length)
    .sort((a, b) => b - a);
  if (toDelete.length === 0) {
    return false;
  }

  const nextRows = existing.map((row) => [...row]);
  for (const index of toDelete) {
    nextRows.splice(index, 1);
  }

  const deletedAsc = [...toDelete].sort((a, b) => a - b);
  content.cellStyles = remapCellStyleMapAfterRowDeletes(content.cellStyles, deletedAsc);
  content.rowStyles = remapRowStyleMapAfterRowDeletes(content.rowStyles, deletedAsc);
  applyTableDataMatrix(block, content, nextRows);

  for (const mergeKey of ["merges", "dataSourceMerges"] as const) {
    const list = (content as Record<string, unknown>)[mergeKey];
    if (Array.isArray(list)) {
      (content as Record<string, unknown>)[mergeKey] = adjustMergesAfterRowDeletes(
        list as ExcelTableMerge[],
        deletedAsc,
      );
    }
  }

  return true;
}

export function tableDataRowsEqual(a: string[][], b: string[][]): boolean {
  if (a.length !== b.length) {
    return false;
  }
  return a.every((row, r) => {
    const other = b[r];
    if (!other || row.length !== other.length) {
      return false;
    }
    return row.every((cell, c) => cell === other[c]);
  });
}

export function shouldReplaceTableDataFromMatrix(
  block: { type?: string },
  action: Record<string, unknown>,
  normalized: string[][],
  existing: string[][],
): boolean {
  const linked = isLinkedTableBlock(block);
  const dataOnly = !hasVisualTableFields(action);
  return (
    !linked ||
    action.replaceTableData === true ||
    (dataOnly && !tableDataRowsEqual(normalized, existing))
  );
}
