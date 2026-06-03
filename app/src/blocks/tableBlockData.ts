import { createBlock, BLOCK_TYPES } from "./blockModel";

const DEFAULT_CELL_WIDTH = 120;
const DEFAULT_CELL_HEIGHT = 36;
const PAGE_PADDING = 64;

/** Igual a `.table-block { font-size }` em style.css — celulas sem `fontSize` no Excel herdam isto. */
export const TABLE_BLOCK_BASE_FONT_PX = 14;

/** Placeholder no DOM para celulas vazias manterem a mesma altura que celulas com texto. */
export const TABLE_CELL_EMPTY_PLACEHOLDER = "\u00a0";

export function cellValueForDisplay(value: string) {
  return value === "" ? TABLE_CELL_EMPTY_PLACEHOLDER : value;
}

export function cellValueFromDisplay(text: string | null | undefined) {
  const t = text ?? "";
  return t === TABLE_CELL_EMPTY_PLACEHOLDER ? "" : t;
}

export function clampLinkedTableFontScale(raw: unknown): number {
  const n = Number(raw);
  if (!Number.isFinite(n)) {
    return 1;
  }
  return Math.min(2, Math.max(0.5, Math.round(n * 100) / 100));
}

export function parseTabularText(text) {
  if (!text) {
    return [];
  }

  const trimmed = text.trim();
  if (!trimmed) {
    return [];
  }

  return trimmed
    .split(/\r?\n/)
    .map((line) => line.split("\t"));
}

export function normalizeRows(rows) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return [];
  }

  const maxCols = Math.max(...rows.map((row) => row.length));
  return rows.map((row) => {
    const normalized = [...row];
    while (normalized.length < maxCols) {
      normalized.push("");
    }
    return normalized;
  });
}

export function createEmptyTable(rows = 2, cols = 2) {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => "")
  );
}

export function computeTableSize(rows, pageSize) {
  const rowCount = rows.length || 1;
  const colCount = rows[0]?.length || 1;
  const targetWidth = colCount * DEFAULT_CELL_WIDTH;
  const targetHeight = rowCount * DEFAULT_CELL_HEIGHT;

  if (!pageSize) {
    return { width: targetWidth, height: targetHeight };
  }

  return {
    width: Math.min(targetWidth, pageSize.width - PAGE_PADDING),
    height: Math.min(targetHeight, pageSize.height - PAGE_PADDING),
  };
}

export function createTableBlockFromRows(rows, options: any = {}) {
  const {
    pageId,
    languageId,
    position = { x: 32, y: 32 },
    pageSize,
    metadata,
  } = options;

  const normalized = normalizeRows(rows);
  const fallback = createEmptyTable();
  const safeRows = normalized.length > 0 ? normalized : fallback;
  const size = computeTableSize(safeRows, pageSize);

  return createBlock({
    type: BLOCK_TYPES.TABLE,
    content: { rows: safeRows },
    position,
    size,
    pageId,
    languageId,
    metadata,
  });
}

export function createTableBlockFromText(text, options: any = {}) {
  const rows = parseTabularText(text);
  return createTableBlockFromRows(rows, options);
}

export function createLinkedTableBlockFromRows(
  rows,
  excelLink: { filePath: string; sheetName: string; range: string },
  options: any = {},
) {
  const {
    pageId,
    languageId,
    position = { x: 32, y: 32 },
    pageSize,
    metadata,
    merges = [],
    cellStyles,
    rowHeights,
  } = options;

  const normalized = normalizeRows(rows);
  const fallback = createEmptyTable();
  const safeRows = normalized.length > 0 ? normalized : fallback;
  const size = computeTableSize(safeRows, pageSize);
  const safeMerges = Array.isArray(merges) ? merges : [];
  const content: Record<string, unknown> = { rows: safeRows, merges: safeMerges };
  if (cellStyles && typeof cellStyles === "object" && Object.keys(cellStyles).length > 0) {
    content.cellStyles = cellStyles;
  }
  if (Array.isArray(rowHeights) && rowHeights.some((x) => x != null)) {
    content.rowHeights = rowHeights;
  }

  return createBlock({
    type: BLOCK_TYPES.LINKED_TABLE,
    content,
    position,
    size,
    pageId,
    languageId,
    metadata: {
      ...(metadata || {}),
      excelLink: {
        filePath: excelLink.filePath,
        sheetName: excelLink.sheetName,
        range: excelLink.range,
      },
    },
  });
}

export function readTableRows(table: HTMLTableElement) {
  const rows = Array.from(table.querySelectorAll("tbody tr"));
  return rows.map((row) =>
    Array.from(row.querySelectorAll("td")).map((cell) =>
      cellValueFromDisplay(cell.textContent || ""),
    ),
  );
}
