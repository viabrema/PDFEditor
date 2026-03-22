import { createBlock, BLOCK_TYPES } from "./blockModel";
import type { ExcelTableMerge } from "../services/excelRange";
import {
  cellStyleToCssString,
  scaleExcelCellStyleFontSize,
  type ExcelTableCellStyle,
} from "../services/excelTableStyle";

const DEFAULT_CELL_WIDTH = 120;
const DEFAULT_CELL_HEIGHT = 36;
const PAGE_PADDING = 64;

/** Igual a `.table-block { font-size }` em style.css — células sem `fontSize` no Excel herdam isto. */
export const TABLE_BLOCK_BASE_FONT_PX = 14;

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
    Array.from(row.querySelectorAll("td")).map((cell) => cell.textContent || "")
  );
}

function buildMergedCellSkipSet(merges: ExcelTableMerge[]): Set<string> {
  const skip = new Set<string>();
  for (const m of merges) {
    for (let dr = 0; dr < m.rowspan; dr++) {
      for (let dc = 0; dc < m.colspan; dc++) {
        if (dr === 0 && dc === 0) {
          continue;
        }
        skip.add(`${m.r + dr},${m.c + dc}`);
      }
    }
  }
  return skip;
}

export type UpdateTableBodyOptions = {
  /** Só tabelas linkadas; multiplica `font-size` nas células com estilo e na base da tabela. */
  fontScale?: number;
};

/** `rowHeights` mantem-se no modelo para exportacao PDF; no canvas as linhas seguem a altura do conteudo. */
export function updateTableBody(
  table,
  rows,
  merges: ExcelTableMerge[] | null | undefined = null,
  cellStyles: Record<string, ExcelTableCellStyle> | null | undefined = null,
  _rowHeights: (number | null)[] | null | undefined = null,
  options: UpdateTableBodyOptions = {},
) {
  const fontScale =
    typeof options.fontScale === "number" && options.fontScale > 0
      ? clampLinkedTableFontScale(options.fontScale)
      : 1;
  const tbody = table.querySelector("tbody") || table.appendChild(document.createElement("tbody"));
  tbody.innerHTML = "";
  const list = Array.isArray(merges) ? merges : [];
  const skip = buildMergedCellSkipSet(list);
  const mergeAt = new Map<string, ExcelTableMerge>();
  for (const m of list) {
    mergeAt.set(`${m.r},${m.c}`, m);
  }
  const styles = cellStyles && typeof cellStyles === "object" ? cellStyles : null;

  rows.forEach((row, r) => {
    const tr = document.createElement("tr");
    row.forEach((value, c) => {
      if (skip.has(`${r},${c}`)) {
        return;
      }
      const td = document.createElement("td");
      td.contentEditable = "true";
      td.textContent = value;
      const st = styles?.[`${r},${c}`];
      if (st) {
        const scaled = fontScale !== 1 ? scaleExcelCellStyleFontSize(st, fontScale) : st;
        const css = cellStyleToCssString(scaled);
        if (css) {
          td.setAttribute("style", css);
        }
      }
      const m = mergeAt.get(`${r},${c}`);
      if (m && (m.rowspan > 1 || m.colspan > 1)) {
        if (m.rowspan > 1) {
          td.rowSpan = m.rowspan;
        }
        if (m.colspan > 1) {
          td.colSpan = m.colspan;
        }
      }
      tr.append(td);
    });
    tbody.append(tr);
  });

  if (fontScale !== 1) {
    table.style.fontSize = `${TABLE_BLOCK_BASE_FONT_PX * fontScale}px`;
  } else {
    table.style.fontSize = "";
  }
}

export function setTableEditable(table, editable) {
  const cells = table.querySelectorAll("td");
  cells.forEach((cell) => {
    cell.contentEditable = editable ? "true" : "false";
  });
  table.classList.toggle("is-readonly", !editable);
  table.classList.toggle("is-editing", editable);
}

function tableFontScaleForBlock(block: { type?: string; metadata?: { fontScale?: unknown } }) {
  return block.type === "linkedTable" ? clampLinkedTableFontScale(block.metadata?.fontScale) : 1;
}

export function attachTableHandlers({ table, block }) {
  const handleInput = () => {
    block.content = block.content || {};
    block.content.rows = readTableRows(table);
  };

  table.addEventListener("input", handleInput);

  table.addEventListener("paste", (event) => {
    const text = event.clipboardData?.getData("text/plain");
    if (!text || (!text.includes("\t") && !text.includes("\n"))) {
      return;
    }

    event.preventDefault();
    const rows = normalizeRows(parseTabularText(text));
    const safeRows = rows.length > 0 ? rows : createEmptyTable();
    updateTableBody(table, safeRows, null, null, null, {
      fontScale: tableFontScaleForBlock(block),
    });
    handleInput();
  });
}

/** Atualiza tbody e escala de fonte a partir do modelo (ex.: slider de escala sem re-renderizar o canvas inteiro). */
export function syncTableElementWithBlock(
  table: HTMLTableElement,
  block: { type?: string; content?: any; metadata?: { fontScale?: unknown } },
  editing: boolean,
) {
  const rows = normalizeRows(block.content?.rows || createEmptyTable());
  const merges = Array.isArray(block.content?.merges) ? block.content.merges : [];
  const cellStyles =
    block.content?.cellStyles && typeof block.content.cellStyles === "object"
      ? (block.content.cellStyles as Record<string, ExcelTableCellStyle>)
      : null;
  const rowHeights = Array.isArray(block.content?.rowHeights)
    ? (block.content.rowHeights as (number | null)[])
    : null;
  updateTableBody(table, rows, merges, cellStyles, rowHeights, {
    fontScale: tableFontScaleForBlock(block),
  });
  setTableEditable(table, editing);
}

export function createTableElement(block, options: { readOnly?: boolean } = {}) {
  const readOnly = Boolean(options.readOnly);
  const table = document.createElement("table");
  table.className = "table-block";
  if (block.type === "linkedTable") {
    table.classList.add("is-linked-table");
  }
  syncTableElementWithBlock(table, block, !readOnly);
  if (!readOnly) {
    attachTableHandlers({ table, block });
  }
  return table;
}
