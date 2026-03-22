import { createBlock, BLOCK_TYPES } from "./blockModel";
import { emptyChartContent, type ChartBlockContent } from "./chartBlockTypes";

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
    return {
      configured: Boolean(c.configured),
      dataSourceBlockId: c.dataSourceBlockId ?? null,
      firstRowIsHeader: c.firstRowIsHeader !== false,
      chart: c.chart,
      previewDataUrl: c.previewDataUrl,
    };
  }
  return emptyChartContent();
}

export function isChartConfigured(block: { content?: unknown }): boolean {
  const c = getChartContent(block);
  return Boolean(c.configured && c.dataSourceBlockId);
}
