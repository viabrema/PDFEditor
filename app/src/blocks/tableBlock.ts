import { createBlock, BLOCK_TYPES } from "./blockModel";
import type { ExcelTableMerge } from "../services/excelRange";

const DEFAULT_CELL_WIDTH = 120;
const DEFAULT_CELL_HEIGHT = 36;
const PAGE_PADDING = 64;

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
  } = options;

  const normalized = normalizeRows(rows);
  const fallback = createEmptyTable();
  const safeRows = normalized.length > 0 ? normalized : fallback;
  const size = computeTableSize(safeRows, pageSize);
  const safeMerges = Array.isArray(merges) ? merges : [];

  return createBlock({
    type: BLOCK_TYPES.LINKED_TABLE,
    content: { rows: safeRows, merges: safeMerges },
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

export function updateTableBody(table, rows, merges: ExcelTableMerge[] | null | undefined = null) {
  const tbody = table.querySelector("tbody") || table.appendChild(document.createElement("tbody"));
  tbody.innerHTML = "";
  const list = Array.isArray(merges) ? merges : [];
  const skip = buildMergedCellSkipSet(list);
  const mergeAt = new Map<string, ExcelTableMerge>();
  for (const m of list) {
    mergeAt.set(`${m.r},${m.c}`, m);
  }

  rows.forEach((row, r) => {
    const tr = document.createElement("tr");
    row.forEach((value, c) => {
      if (skip.has(`${r},${c}`)) {
        return;
      }
      const td = document.createElement("td");
      td.contentEditable = "true";
      td.textContent = value;
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
}

export function setTableEditable(table, editable) {
  const cells = table.querySelectorAll("td");
  cells.forEach((cell) => {
    cell.contentEditable = editable ? "true" : "false";
  });
  table.classList.toggle("is-readonly", !editable);
  table.classList.toggle("is-editing", editable);
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
    updateTableBody(table, safeRows);
    handleInput();
  });
}

export function createTableElement(block, options: { readOnly?: boolean } = {}) {
  const readOnly = Boolean(options.readOnly);
  const table = document.createElement("table");
  table.className = "table-block";
  if (readOnly) {
    table.classList.add("is-linked-table");
  }
  const rows = normalizeRows(block.content?.rows || createEmptyTable());
  const merges = Array.isArray(block.content?.merges) ? block.content.merges : [];
  updateTableBody(table, rows, merges);
  setTableEditable(table, !readOnly);
  if (!readOnly) {
    attachTableHandlers({ table, block });
  }
  return table;
}
