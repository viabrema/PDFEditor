import type { ExcelTableMerge } from "../services/excelRange";
import type { ExcelTableContent } from "../services/excelRange";
import {
  formatNumberForDisplay,
  parseNumericCellText,
  resolveTableCellStyle,
  type TableBlockStyleContent,
} from "./tableFormatting";

/** Locale para apresentar numeros da camada de dados (modal e edicao de celula). */
export const TABLE_DATA_NUMBER_LOCALE = "en-US";

export type LinkedTableBlockContent = TableBlockStyleContent & {
  dataSourceRows?: string[][];
  dataSourceMerges?: ExcelTableMerge[];
  merges?: ExcelTableMerge[];
  rowHeights?: (number | null)[];
};

export function isLinkedTableBlock(block: { type?: string } | null | undefined): boolean {
  return block?.type === "linkedTable";
}

function cloneRows(rows: string[][]): string[][] {
  return rows.map((row) => [...row]);
}

function isStringMatrix(rows: unknown): rows is string[][] {
  return Array.isArray(rows) && rows.every((row) => Array.isArray(row));
}

/** Migra documentos antigos: `rows` unico passa a ser `dataSourceRows`. */
export function normalizeLinkedTableContent(block: {
  content?: LinkedTableBlockContent | null;
}) {
  const content = block.content || {};
  block.content = content;
  if (!Array.isArray(content.dataSourceRows) && isStringMatrix(content.rows)) {
    content.dataSourceRows = cloneRows(content.rows);
  }
  if (!Array.isArray(content.dataSourceMerges) && Array.isArray(content.merges)) {
    content.dataSourceMerges = [...(content.merges as ExcelTableMerge[])];
  }
}

export function getTableDataRows(block: { type?: string; content?: LinkedTableBlockContent }): string[][] {
  if (isLinkedTableBlock(block)) {
    normalizeLinkedTableContent(block);
    return cloneRows(block.content?.dataSourceRows || []);
  }
  const rows = block.content?.rows;
  if (!Array.isArray(rows)) {
    return [];
  }
  return rows.map((row: unknown) =>
    Array.isArray(row) ? row.map((c) => (c == null ? "" : String(c))) : [],
  );
}

export function getTableStructureMerges(block: {
  type?: string;
  content?: LinkedTableBlockContent;
}): ExcelTableMerge[] {
  if (isLinkedTableBlock(block)) {
    normalizeLinkedTableContent(block);
    const list = block.content?.dataSourceMerges ?? block.content?.merges;
    return Array.isArray(list) ? [...list] : [];
  }
  return Array.isArray(block.content?.merges) ? [...(block.content!.merges as ExcelTableMerge[])] : [];
}

export function getTableVisualRows(block: { type?: string; content?: LinkedTableBlockContent }): string[][] {
  if (!isLinkedTableBlock(block)) {
    return getTableDataRows(block);
  }
  const dataRows = getTableDataRows(block);
  /* v8 ignore start */
  const content = block.content ?? {};
  return dataRows.map((row, r) =>
    row.map((raw, c) => {
      const style = resolveTableCellStyle(content, r, c);
      return formatNumberForDisplay(String(raw ?? ""), style?.numberFormat);
    }),
  );
  /* v8 ignore end */
}

export function getTableRowsForStyleGrid(block: { type?: string; content?: LinkedTableBlockContent }) {
  return getTableDataRows(block);
}

export function formatDataLayerCellForDisplay(raw: string): string {
  const text = String(raw ?? "");
  const n = parseNumericCellText(text);
  if (n !== null) {
    return new Intl.NumberFormat(TABLE_DATA_NUMBER_LOCALE, {
      maximumFractionDigits: 10,
    }).format(n);
  }
  return text;
}

export function getTypingCellRawValue(
  block: { type?: string; content?: LinkedTableBlockContent },
  row: number,
  col: number,
): string {
  const dataRows = getTableDataRows(block);
  return dataRows[row]?.[col] ?? "";
}

export function writeTypingCellRawValue(
  block: { type?: string; content?: LinkedTableBlockContent },
  row: number,
  col: number,
  raw: string,
) {
  if (isLinkedTableBlock(block)) {
    normalizeLinkedTableContent(block);
    const rows = getTableDataRows(block);
    if (!rows[row]) {
      return;
    }
    rows[row][col] = raw;
    block.content!.dataSourceRows = rows;
    delete block.content!.rows;
    return;
  }
  if (!block.content) {
    block.content = { rows: [] };
  }
  const rows = Array.isArray(block.content.rows) ? block.content.rows : [];
  if (!rows[row]) {
    return;
  }
  rows[row][col] = raw;
  block.content.rows = rows;
}

/** Atualiza apenas a camada de dados (refresh Excel ou reconfigurar intervalo). */
export function applyExcelSnapshotToLinkedTable(
  block: { type?: string; content?: LinkedTableBlockContent },
  snapshot: ExcelTableContent,
) {
  normalizeLinkedTableContent(block);
  block.content ??= {};
  const content = block.content;
  content.dataSourceRows = cloneRows(snapshot.rows);
  content.dataSourceMerges = Array.isArray(snapshot.merges) ? [...snapshot.merges] : [];
  content.merges = [...content.dataSourceMerges];
  delete content.rows;
  delete content.rowHeights;
}

export function createLinkedTableContentFromExcel(snapshot: ExcelTableContent): LinkedTableBlockContent {
  return {
    dataSourceRows: cloneRows(snapshot.rows),
    dataSourceMerges: Array.isArray(snapshot.merges) ? [...snapshot.merges] : [],
    merges: Array.isArray(snapshot.merges) ? [...snapshot.merges] : [],
    cellStyles: {},
    rowStyles: {},
    colStyles: {},
  };
}
