import { createBlock, BLOCK_TYPES } from "./blockModel";
import { emptyChartContent, type ChartBlockContent } from "./chartBlockTypes";
import { normalizeChartDataSourceRows } from "./chartDataFromTableBlock";
import type { ExcelLinkMeta } from "../services/excelLink";

const DEFAULT_CHART_SIZE = { width: 520, height: 320 };

export function createChartBlock(options: {
  position: { x: number; y: number };
  pageId: string | null;
  languageId: string | null;
  metadata?: Record<string, unknown>;
}): ReturnType<typeof createBlock> {
  return createBlock({
    type: BLOCK_TYPES.CHART,
    content: emptyChartContent() as unknown as ChartBlockContent,
    position: options.position,
    size: { ...DEFAULT_CHART_SIZE },
    pageId: options.pageId,
    languageId: options.languageId,
    metadata: options.metadata || {},
  });
}

export function getChartContent(block: { content?: unknown }): ChartBlockContent {
  const c = block.content as ChartBlockContent | undefined;
  if (c && typeof c === "object" && "chart" in c) {
    let dataSourceRows = normalizeChartDataSourceRows(c.dataSourceRows);
    if (dataSourceRows.length === 0) {
      dataSourceRows = emptyChartContent().dataSourceRows;
    }
    return {
      configured: Boolean(c.configured),
      dataSourceRows,
      firstRowIsHeader: c.firstRowIsHeader !== false,
      chart: c.chart,
      previewDataUrl: c.previewDataUrl,
      dataSourceBlockId: c.dataSourceBlockId ?? undefined,
    };
  }
  return emptyChartContent();
}

/** Indica se a grelha do grafico tem alguma celula nao vazia (apos trim). */
export function chartGridHasAnyValue(rows: string[][]): boolean {
  return rows.some((r) => r.some((cell) => String(cell ?? "").trim() !== ""));
}

export function isChartConfigured(block: { content?: unknown }): boolean {
  const c = getChartContent(block);
  if (!c.configured) {
    return false;
  }
  if (chartGridHasAnyValue(c.dataSourceRows)) {
    return true;
  }
  return Boolean(c.dataSourceBlockId);
}

export function chartBlockHasExcelLink(block: {
  type?: string;
  metadata?: { excelLink?: Partial<ExcelLinkMeta> | null };
}): boolean {
  if (block.type !== BLOCK_TYPES.CHART) {
    return false;
  }
  const link = block.metadata?.excelLink;
  return Boolean(
    link && String(link.filePath || "").trim() && link.sheetName && String(link.range || "").trim(),
  );
}

export function createLinkedChartBlockFromExcel(options: {
  rows: string[][];
  excelLink: ExcelLinkMeta;
  position: { x: number; y: number };
  pageId: string | null;
  languageId: string | null;
  metadata?: Record<string, unknown>;
}): ReturnType<typeof createBlock> {
  const normalized = normalizeChartDataSourceRows(options.rows);
  const base = emptyChartContent();
  const dataSourceRows = normalized.length > 0 ? normalized : base.dataSourceRows;
  return createBlock({
    type: BLOCK_TYPES.CHART,
    content: {
      ...base,
      dataSourceRows,
      configured: true,
    } as unknown as ChartBlockContent,
    position: options.position,
    size: { width: 520, height: 320 },
    pageId: options.pageId,
    languageId: options.languageId,
    metadata: { ...(options.metadata || {}), excelLink: options.excelLink },
  });
}
