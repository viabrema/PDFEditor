export function sanitizeAiPayload(text) {
  return String(text || "")
    .replace(/^```[a-z]*\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
}

/** Fecha `]` e `}` em falta (respostas da IA cortadas). */
export function balanceJsonBrackets(text: string): string {
  let s = text.trim();
  let brace = 0;
  let bracket = 0;
  let inString = false;
  let escape = false;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (ch === "\\" && inString) {
      escape = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      continue;
    }
    if (inString) {
      continue;
    }
    if (ch === "{") {
      brace += 1;
    } else if (ch === "}") {
      brace -= 1;
    } else if (ch === "[") {
      bracket += 1;
    } else if (ch === "]") {
      bracket -= 1;
    }
  }
  for (let i = 0; i < bracket; i++) {
    s += "]";
  }
  for (let i = 0; i < brace; i++) {
    s += "}";
  }
  return s;
}

function tryParseAiJsonCandidate(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export function parseAiJson(text) {
  const cleaned = sanitizeAiPayload(text);
  let parsed = tryParseAiJsonCandidate(cleaned);
  if (parsed) {
    return parsed;
  }

  const balanced = balanceJsonBrackets(cleaned);
  parsed = tryParseAiJsonCandidate(balanced);
  if (parsed) {
    return parsed;
  }

  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    return null;
  }
  const slice = balanceJsonBrackets(cleaned.slice(firstBrace, lastBrace + 1));
  return tryParseAiJsonCandidate(slice);
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
    const first = tableRows[0] as { cells?: unknown[] };
    if (Array.isArray(first.cells)) {
      return null;
    }
    return tableRows.map((row) => (Array.isArray(row) ? row.map((cell) => String(cell ?? "")) : []));
  }
  return null;
}
