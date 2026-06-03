export function sanitizeAiPayload(text) {
  return String(text || "")
    .replace(/^```[a-z]*\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
}

export function parseAiJson(text) {
  const cleaned = sanitizeAiPayload(text);
  try {
    return JSON.parse(cleaned);
  } catch (error) {
    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");
    if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
      return null;
    }
    const slice = cleaned.slice(firstBrace, lastBrace + 1);
    try {
      return JSON.parse(slice);
    } catch (nestedError) {
      return null;
    }
  }
}

/** Aceita `tableRows` ou `content` (modelos frequentes da IA). */
export function tableRowsFromAiAction(action: { tableRows?: unknown; content?: unknown }) {
  const raw = action.tableRows !== undefined && action.tableRows !== null ? action.tableRows : action.content;
  return normalizeTableRows(raw);
}

export function normalizeTableRows(tableRows) {
  if (!Array.isArray(tableRows)) {
    return null;
  }
  if (tableRows.length === 0) {
    return [];
  }
  if (Array.isArray(tableRows[0])) {
    return tableRows.map((row) => (Array.isArray(row) ? row : []));
  }
  if (typeof tableRows[0] === "object" && tableRows[0] !== null) {
    return tableRows.map((row) =>
      Array.isArray(row?.cells) ? row.cells.map((cell) => String(cell ?? "")) : []
    );
  }
  return null;
}
