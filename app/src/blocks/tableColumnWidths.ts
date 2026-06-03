import { getTableVisualRows, isLinkedTableBlock } from "./linkedTableModel";
import { normalizeRows } from "./tableBlockData";

/** Largura por defeito de cada coluna de dados (px). */
export const TABLE_DEFAULT_COL_WIDTH_PX = 120;

/** Largura minima ao redimensionar (px). */
export const TABLE_MIN_COL_WIDTH_PX = 32;

/** Largura do marcador de canto / linha no thead (px), alinhado a 1.25rem. */
export const TABLE_ROW_HEAD_WIDTH_PX = 20;

export function normalizeColWidths(
  colCount: number,
  source?: (number | null)[] | null,
): number[] {
  const n = Math.max(0, colCount);
  const out: number[] = [];
  for (let c = 0; c < n; c++) {
    const raw = source?.[c];
    const w = typeof raw === "number" && Number.isFinite(raw) && raw > 0 ? raw : TABLE_DEFAULT_COL_WIDTH_PX;
    out.push(Math.max(TABLE_MIN_COL_WIDTH_PX, Math.round(w)));
  }
  return out;
}

export function resizeColumnAt(
  widths: number[],
  colIndex: number,
  nextWidth: number,
): number[] {
  if (colIndex < 0 || colIndex >= widths.length) {
    return widths;
  }
  const next = [...widths];
  next[colIndex] = Math.max(TABLE_MIN_COL_WIDTH_PX, Math.round(nextWidth));
  return next;
}

export function tableDataColCount(
  rows: string[][],
  colWidths?: (number | null)[] | null,
): number {
  const fromRows = rows.reduce((max, row) => Math.max(max, row.length), 0);
  const fromWidths = Array.isArray(colWidths) ? colWidths.length : 0;
  return Math.max(fromRows, fromWidths);
}

export function sumColWidths(widths: number[]): number {
  return widths.reduce((sum, w) => sum + w, 0);
}

export function tableWidthFromColWidths(widths: number[]): number {
  return TABLE_ROW_HEAD_WIDTH_PX + sumColWidths(widths);
}

export type TableColLayoutMode = "view" | "structure";

export function resolveTableColLayoutMode(table: HTMLTableElement): TableColLayoutMode {
  return table.classList.contains("is-view-mode") ? "view" : "structure";
}

/** Modo estrutura: coluna de canto + dados (px). Modo visual: so dados (px) — marcadores estao display:none. */
export function syncTableColgroup(
  table: HTMLTableElement,
  widths: number[],
  mode: TableColLayoutMode,
) {
  const structure = mode === "structure";
  let colgroup = table.querySelector("colgroup");
  if (!colgroup) {
    colgroup = document.createElement("colgroup");
    const thead = table.querySelector("thead");
    if (thead) {
      table.insertBefore(colgroup, thead);
    } else {
      table.prepend(colgroup);
    }
  }
  colgroup.innerHTML = "";
  if (structure) {
    const cornerCol = document.createElement("col");
    cornerCol.className = "table-corner-col";
    cornerCol.style.width = `${TABLE_ROW_HEAD_WIDTH_PX}px`;
    colgroup.append(cornerCol);
  }
  widths.forEach((w, c) => {
    const colEl = document.createElement("col");
    colEl.dataset.tableCol = String(c);
    colEl.style.width = `${w}px`;
    colgroup!.append(colEl);
  });
}

export function colWidthsForTableBlock(block: {
  type?: string;
  content?: {
    rows?: string[][];
    dataSourceRows?: string[][];
    colWidths?: (number | null)[];
  };
}): number[] {
  if (!block.content) {
    return [];
  }
  const rows = isLinkedTableBlock(block)
    ? getTableVisualRows(block)
    : normalizeRows(Array.isArray(block.content.rows) ? block.content.rows : []);
  return normalizeColWidths(
    tableDataColCount(rows, block.content.colWidths),
    block.content.colWidths,
  );
}

export function readColWidthsFromTable(table: HTMLTableElement, colCount: number): number[] {
  const cols = table.querySelectorAll("colgroup col[data-table-col]");
  const out: number[] = [];
  for (let c = 0; c < colCount; c++) {
    const el = cols[c] as HTMLTableColElement | undefined;
    const raw = el?.style.width ?? "";
    const parsed = raw.endsWith("%") ? NaN : Number.parseFloat(raw);
    out.push(
      Number.isFinite(parsed) && parsed > 0 ? parsed : TABLE_DEFAULT_COL_WIDTH_PX,
    );
  }
  return normalizeColWidths(colCount, out);
}

export function applyColWidthsToTable(table: HTMLTableElement, widths: number[]) {
  syncTableColgroup(table, widths, resolveTableColLayoutMode(table));
}
