import { createBlock, BLOCK_TYPES } from "./blockModel.js";

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

export function createTableBlockFromRows(rows, options = {}) {
  const {
    pageId,
    languageId,
    position = { x: 32, y: 32 },
    pageSize,
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
  });
}

export function createTableBlockFromText(text, options = {}) {
  const rows = parseTabularText(text);
  return createTableBlockFromRows(rows, options);
}

export function readTableRows(table) {
  const rows = Array.from(table.querySelectorAll("tbody tr"));
  return rows.map((row) =>
    Array.from(row.querySelectorAll("td")).map((cell) => cell.textContent || "")
  );
}

export function updateTableBody(table, rows) {
  const tbody = table.querySelector("tbody") || table.appendChild(document.createElement("tbody"));
  tbody.innerHTML = "";

  rows.forEach((row) => {
    const tr = document.createElement("tr");
    row.forEach((value) => {
      const td = document.createElement("td");
      td.contentEditable = "true";
      td.textContent = value;
      tr.append(td);
    });
    tbody.append(tr);
  });
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

export function createTableElement(block) {
  const table = document.createElement("table");
  table.className = "table-block";
  const rows = normalizeRows(block.content?.rows || createEmptyTable());
  updateTableBody(table, rows);
  attachTableHandlers({ table, block });
  return table;
}
