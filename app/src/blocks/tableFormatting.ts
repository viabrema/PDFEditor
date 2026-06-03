import type { ExcelTableCellStyle, TableNumberFormat } from "../services/excelTableStyle";
import type { TableEditState } from "./tableBlockInteraction";

export type TableFormatScope = "cell" | "row" | "column";

export type TableBlockStyleContent = {
  rows?: string[][];
  dataSourceRows?: string[][];
  cellStyles?: Record<string, Partial<ExcelTableCellStyle>>;
  rowStyles?: Record<string, Partial<ExcelTableCellStyle>>;
  colStyles?: Record<string, Partial<ExcelTableCellStyle>>;
};

const STYLE_KEYS: (keyof ExcelTableCellStyle)[] = [
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
  "numberFormat",
];

export function mergePartialStyles(
  ...layers: Array<Partial<ExcelTableCellStyle> | undefined | null>
): ExcelTableCellStyle | undefined {
  const merged: ExcelTableCellStyle = {};
  for (const layer of layers) {
    if (!layer || typeof layer !== "object") {
      continue;
    }
    for (const key of STYLE_KEYS) {
      const value = layer[key];
      if (value !== undefined) {
        (merged as Record<string, unknown>)[key] = value;
      }
    }
  }
  return Object.keys(merged).length > 0 ? merged : undefined;
}

export function resolveTableCellStyle(
  content: TableBlockStyleContent,
  row: number,
  col: number,
): ExcelTableCellStyle | undefined {
  const colStyle = content.colStyles?.[String(col)];
  const rowStyle = content.rowStyles?.[String(row)];
  const cellStyle = content.cellStyles?.[`${row},${col}`];
  return mergePartialStyles(colStyle, rowStyle, cellStyle);
}

function tableGridDimensions(content: TableBlockStyleContent): string[][] {
  if (Array.isArray(content.dataSourceRows)) {
    return content.dataSourceRows;
  }
  return Array.isArray(content.rows) ? content.rows : [];
}

export function buildResolvedCellStylesMap(
  content: TableBlockStyleContent,
): Record<string, ExcelTableCellStyle> {
  const rows = tableGridDimensions(content);
  const out: Record<string, ExcelTableCellStyle> = {};
  rows.forEach((row, r) => {
    row.forEach((_cell, c) => {
      const st = resolveTableCellStyle(content, r, c);
      if (st) {
        out[`${r},${c}`] = st;
      }
    });
  });
  return out;
}

export function coordsInScope(
  scope: TableFormatScope,
  row: number,
  col: number,
  rows: string[][],
): Array<[number, number]> {
  const coords: Array<[number, number]> = [];
  if (scope === "cell") {
    if (rows[row]) {
      coords.push([row, col]);
    }
    return coords;
  }
  if (scope === "row") {
    const line = rows[row];
    if (!line) {
      return coords;
    }
    line.forEach((_v, c) => coords.push([row, c]));
    return coords;
  }
  rows.forEach((line, r) => {
    if (col < line.length) {
      coords.push([r, col]);
    }
  });
  return coords;
}

export function parseNumericCellText(text: string): number | null {
  let s = String(text ?? "").trim();
  if (!s) {
    return null;
  }
  s = s.replace(/\s/g, "").replace(/%$/, "");
  if (s.includes(",") && s.includes(".")) {
    const lastComma = s.lastIndexOf(",");
    const lastDot = s.lastIndexOf(".");
    if (lastComma > lastDot) {
      s = s.replace(/\./g, "").replace(",", ".");
    } else {
      s = s.replace(/,/g, "");
    }
  } else if (s.includes(",")) {
    s = s.replace(",", ".");
  }
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export function currencyCodeForLocale(locale: string): string {
  if (locale.startsWith("en-US")) {
    return "USD";
  }
  if (locale.startsWith("pt")) {
    return "BRL";
  }
  if (locale.startsWith("es")) {
    return "EUR";
  }
  return "EUR";
}

export function formatNumberForDisplay(text: string, fmt: TableNumberFormat | undefined): string {
  if (!fmt || fmt.kind === "general") {
    return text;
  }
  const n = parseNumericCellText(text);
  if (n === null) {
    return text;
  }
  const locale = fmt.locale || "pt-BR";
  const decimals = fmt.decimals ?? (fmt.kind === "currency" ? 2 : fmt.kind === "percent" ? 1 : 0);
  if (fmt.kind === "percent") {
    const value = Math.abs(n) <= 1 && !text.includes("%") ? n : n / 100;
    return new Intl.NumberFormat(locale, {
      style: "percent",
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);
  }
  if (fmt.kind === "currency") {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currencyCodeForLocale(locale),
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(n);
  }
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(n);
}

function targetStyleMap(
  content: TableBlockStyleContent,
  scope: TableFormatScope,
  row: number,
  col: number,
): Record<string, Partial<ExcelTableCellStyle>> {
  if (scope === "cell") {
    if (!content.cellStyles) {
      content.cellStyles = {};
    }
    return content.cellStyles;
  }
  if (scope === "row") {
    if (!content.rowStyles) {
      content.rowStyles = {};
    }
    return content.rowStyles;
  }
  if (!content.colStyles) {
    content.colStyles = {};
  }
  return content.colStyles;
}

function styleKeyForScope(scope: TableFormatScope, row: number, col: number): string {
  if (scope === "cell") {
    return `${row},${col}`;
  }
  if (scope === "row") {
    return String(row);
  }
  return String(col);
}

export function applyTableFormatPatch(
  content: TableBlockStyleContent,
  scope: TableFormatScope,
  row: number,
  col: number,
  patch: Partial<ExcelTableCellStyle>,
) {
  const map = targetStyleMap(content, scope, row, col);
  const key = styleKeyForScope(scope, row, col);
  const prev = map[key] || {};
  map[key] = mergePartialStyles(prev, patch) || patch;

  if (patch.numberFormat !== undefined && Array.isArray(content.rows)) {
    const rows = content.rows;
    for (const [r, c] of coordsInScope(scope, row, col, rows)) {
      const style = resolveTableCellStyle(content, r, c);
      rows[r][c] = formatNumberForDisplay(rows[r][c], style?.numberFormat);
    }
  }
}

export type TableFormatTarget = {
  scope: TableFormatScope;
  row: number;
  col: number;
};

export function formatTargetsFromEdit(
  edit: Pick<TableEditState, "scope" | "row" | "col" | "multi"> | null | undefined,
): TableFormatTarget[] {
  if (!edit) {
    return [{ scope: "cell", row: 0, col: 0 }];
  }

  const m = edit.multi;
  if (m?.cells?.length) {
    return m.cells.map((c) => ({ scope: "cell", row: c.row, col: c.col }));
  }
  if (m?.rows?.length) {
    return m.rows.map((r) => ({ scope: "row", row: r, col: 0 }));
  }
  if (m?.cols?.length) {
    return m.cols.map((c) => ({ scope: "column", row: 0, col: c }));
  }

  return [{ scope: edit.scope, row: edit.row, col: edit.col }];
}

export function effectiveFormatScope(
  edit: Pick<TableEditState, "scope" | "multi"> | null | undefined,
): TableFormatScope {
  if (!edit) {
    return "cell";
  }
  const m = edit.multi;
  if (m?.cells && m.cells.length > 1) {
    return "cell";
  }
  if (m?.rows && m.rows.length > 1) {
    return "row";
  }
  if (m?.cols && m.cols.length > 1) {
    return "column";
  }
  return edit.scope;
}

export function applyFormatPatchToEdit(
  content: TableBlockStyleContent,
  edit: Pick<TableEditState, "scope" | "row" | "col" | "multi"> | null | undefined,
  patch: Partial<ExcelTableCellStyle>,
) {
  for (const target of formatTargetsFromEdit(edit)) {
    applyTableFormatPatch(content, target.scope, target.row, target.col, patch);
  }
}

export function ensureTableStyleContent(block: { content?: TableBlockStyleContent }) {
  block.content = block.content || {};
  if (!block.content.cellStyles) {
    block.content.cellStyles = {};
  }
  if (!block.content.rowStyles) {
    block.content.rowStyles = {};
  }
  if (!block.content.colStyles) {
    block.content.colStyles = {};
  }
}
