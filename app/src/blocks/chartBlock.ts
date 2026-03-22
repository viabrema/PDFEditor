import { createBlock, BLOCK_TYPES } from "./blockModel";
import { emptyChartContent, type ChartBlockContent } from "./chartBlockTypes";
import { normalizeChartDataSourceRows } from "./chartDataFromTableBlock";

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

function gridHasAnyValue(rows: string[][]): boolean {
  return rows.some((r) => r.some((cell) => String(cell ?? "").trim() !== ""));
}

export function isChartConfigured(block: { content?: unknown }): boolean {
  const c = getChartContent(block);
  if (!c.configured) {
    return false;
  }
  if (gridHasAnyValue(c.dataSourceRows)) {
    return true;
  }
  return Boolean(c.dataSourceBlockId);
}
