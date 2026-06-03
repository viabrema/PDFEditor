import {
  applyTableFormatPatch,
  ensureTableStyleContent,
  type TableBlockStyleContent,
  type TableFormatScope,
} from "../blocks/tableFormatting";
import { getTableDataRows, isLinkedTableBlock } from "../blocks/linkedTableModel";
import type { ExcelTableCellStyle } from "../services/excelTableStyle";
import { normalizeTableRows } from "./aiApplyParsing";
import {
  applyTableDataMatrix,
  deleteTableRowsFromBlock,
  parseDeleteRowIndices,
  shouldReplaceTableDataFromMatrix,
  tableDataRowsEqual,
} from "./aiTableDataOps";

const AI_CELL_STYLE_KEYS: (keyof ExcelTableCellStyle)[] = [
  "color",
  "backgroundColor",
  "fontFamily",
  "fontSize",
  "fontWeight",
  "fontStyle",
  "textAlign",
  "verticalAlign",
  "borderTop",
  "borderRight",
  "borderBottom",
  "borderLeft",
];

export function pickAiCellStyle(source: unknown): Partial<ExcelTableCellStyle> | null {
  if (!source || typeof source !== "object") {
    return null;
  }
  const obj = source as Record<string, unknown>;
  const patch: Partial<ExcelTableCellStyle> = {};
  let any = false;
  for (const key of AI_CELL_STYLE_KEYS) {
    const value = obj[key];
    if (value !== undefined && value !== null && value !== "") {
      (patch as Record<string, unknown>)[key] = value;
      any = true;
    }
  }
  return any ? patch : null;
}

export function aiCellText(cell: unknown): string {
  if (cell == null) {
    return "";
  }
  if (typeof cell === "string" || typeof cell === "number" || typeof cell === "boolean") {
    return String(cell);
  }
  if (typeof cell === "object") {
    const o = cell as Record<string, unknown>;
    if (typeof o.text === "string") {
      return o.text;
    }
    if (o.text != null) {
      return String(o.text);
    }
    if (typeof o.value === "string" || typeof o.value === "number") {
      return String(o.value);
    }
  }
  return "";
}

function isStructuredTableRowEntry(entry: unknown): entry is { row?: number; cells?: unknown[] } {
  return (
    Boolean(entry) &&
    typeof entry === "object" &&
    !Array.isArray(entry) &&
    Array.isArray((entry as { cells?: unknown[] }).cells)
  );
}

export type ParsedAiStructuredTable = {
  rows: string[][] | null;
  rowStyles: Record<string, Partial<ExcelTableCellStyle>>;
  cellStyles: Record<string, Partial<ExcelTableCellStyle>>;
  colStyles: Record<string, Partial<ExcelTableCellStyle>>;
  hasStyleChanges: boolean;
};

export function parseStructuredAiTableRows(raw: unknown): ParsedAiStructuredTable | null {
  if (!Array.isArray(raw) || raw.length === 0 || !isStructuredTableRowEntry(raw[0])) {
    return null;
  }

  const rows: string[][] = [];
  const rowStyles: Record<string, Partial<ExcelTableCellStyle>> = {};
  const cellStyles: Record<string, Partial<ExcelTableCellStyle>> = {};
  const colStyles: Record<string, Partial<ExcelTableCellStyle>> = {};
  let hasStyleChanges = false;

  raw.forEach((entry, index) => {
    if (!isStructuredTableRowEntry(entry)) {
      return;
    }
    const rowIndex = typeof entry.row === "number" && entry.row >= 0 ? entry.row : index;
    const line: string[] = [];
    entry.cells?.forEach((cell, colIndex) => {
      line.push(aiCellText(cell));
      const style = pickAiCellStyle(cell);
      if (style) {
        cellStyles[`${rowIndex},${colIndex}`] = {
          ...(cellStyles[`${rowIndex},${colIndex}`] || {}),
          ...style,
        };
        hasStyleChanges = true;
      }
    });
    rows[rowIndex] = line;
  });

  const compactRows = rows.filter((r) => Array.isArray(r));
  return {
    rows: compactRows.length > 0 ? rows : null,
    rowStyles,
    cellStyles,
    colStyles,
    hasStyleChanges,
  };
}

function mergeStyleMaps(
  target: Record<string, Partial<ExcelTableCellStyle>>,
  source: Record<string, Partial<ExcelTableCellStyle>> | undefined,
) {
  if (!source || typeof source !== "object") {
    return;
  }
  for (const [key, patch] of Object.entries(source)) {
    if (patch && typeof patch === "object") {
      target[key] = { ...(target[key] || {}), ...patch };
    }
  }
}

export function mergeTableStyleMapsOnContent(
  content: TableBlockStyleContent,
  maps: {
    rowStyles?: Record<string, Partial<ExcelTableCellStyle>>;
    cellStyles?: Record<string, Partial<ExcelTableCellStyle>>;
    colStyles?: Record<string, Partial<ExcelTableCellStyle>>;
  },
) {
  mergeStyleMaps(content.rowStyles!, maps.rowStyles);
  mergeStyleMaps(content.cellStyles!, maps.cellStyles);
  mergeStyleMaps(content.colStyles!, maps.colStyles);
}

export type AiTableFormatPatch = {
  scope?: TableFormatScope;
  row?: number;
  col?: number;
  style?: Partial<ExcelTableCellStyle>;
  backgroundColor?: string;
  color?: string;
};

export function applyAiTableFormatPatches(
  content: TableBlockStyleContent,
  patches: AiTableFormatPatch | AiTableFormatPatch[] | undefined,
) {
  if (!patches) {
    return false;
  }
  const list = Array.isArray(patches) ? patches : [patches];
  let changed = false;
  for (const patch of list) {
    if (!patch || typeof patch !== "object") {
      continue;
    }
    const scope = (patch.scope || "cell") as TableFormatScope;
    const row = typeof patch.row === "number" ? patch.row : 0;
    const col = typeof patch.col === "number" ? patch.col : 0;
    const style =
      pickAiCellStyle(patch.style) ||
      pickAiCellStyle(patch) ||
      (patch.backgroundColor || patch.color
        ? pickAiCellStyle({
            backgroundColor: patch.backgroundColor,
            color: patch.color,
          })
        : null);
    if (!style) {
      continue;
    }
    applyTableFormatPatch(content, scope, row, col, style);
    changed = true;
  }
  return changed;
}

export { deleteTableRowsFromBlock, parseDeleteRowIndices } from "./aiTableDataOps";

export function applyTableUpdateFromAiAction(
  block: { type?: string; content?: TableBlockStyleContent },
  action: Record<string, unknown>,
): boolean {
  const content = (block.content || {}) as TableBlockStyleContent;
  block.content = content;
  ensureTableStyleContent(block);

  let changed = false;
  const linked = isLinkedTableBlock(block);

  const deleteIndices = parseDeleteRowIndices(action);
  if (deleteIndices.length > 0 && deleteTableRowsFromBlock(block, deleteIndices)) {
    changed = true;
  }

  if (
    applyAiTableFormatPatches(
      content,
      (action.tableFormat ?? action.tableFormats) as AiTableFormatPatch | AiTableFormatPatch[],
    )
  ) {
    changed = true;
  }

  const directMaps = {
    rowStyles: action.rowStyles as Record<string, Partial<ExcelTableCellStyle>> | undefined,
    cellStyles: action.cellStyles as Record<string, Partial<ExcelTableCellStyle>> | undefined,
    colStyles: action.colStyles as Record<string, Partial<ExcelTableCellStyle>> | undefined,
  };
  if (directMaps.rowStyles || directMaps.cellStyles || directMaps.colStyles) {
    mergeTableStyleMapsOnContent(content, directMaps);
    changed = true;
  }

  const rawRows =
    action.tableRows !== undefined && action.tableRows !== null ? action.tableRows : action.content;
  const structured = parseStructuredAiTableRows(rawRows);
  if (structured) {
    if (structured.hasStyleChanges) {
      mergeTableStyleMapsOnContent(content, structured);
      changed = true;
    }
    const matrix = structured.rows;
    if (matrix && !linked && action.replaceTableData !== false) {
      const existing = getTableDataRows(block);
      if (!tableDataRowsEqual(matrix, existing)) {
        applyTableDataMatrix(block, content, matrix);
        changed = true;
      }
    }
    return changed;
  }

  const normalized = normalizeTableRows(rawRows);
  if (normalized) {
    const existing = getTableDataRows(block);
    if (
      shouldReplaceTableDataFromMatrix(block, action, normalized, existing) &&
      !tableDataRowsEqual(normalized, existing)
    ) {
      applyTableDataMatrix(block, content, normalized);
      changed = true;
    }
  }

  return changed;
}
