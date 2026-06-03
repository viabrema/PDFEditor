import type { ChartBlockContent, ChartSpec } from "../blocks/chartBlockTypes";
import { defaultChartSpec, emptyChartContent } from "../blocks/chartBlockTypes";
import { normalizeChartDataSourceRows } from "../blocks/chartDataFromTableBlock";

export function cloneChartContent(raw: unknown): ChartBlockContent {
  const base = emptyChartContent();
  if (!raw || typeof raw !== "object") {
    return base;
  }
  const c = raw as ChartBlockContent;
  try {
    const d0 = defaultChartSpec();
    const ch = (c.chart || {}) as Partial<ChartSpec>;
    const datasets =
      Array.isArray(ch.datasets) && ch.datasets.length > 0 ? ch.datasets : d0.datasets;
    const merged = JSON.parse(
      JSON.stringify({
        ...base,
        ...c,
        chart: {
          ...d0,
          ...ch,
          datasets,
        },
      }),
    ) as ChartBlockContent;
    let rows = normalizeChartDataSourceRows(merged.dataSourceRows);
    if (rows.length === 0) {
      rows = base.dataSourceRows;
    }
    merged.dataSourceRows = rows;
    return merged;
  } catch {
    return base;
  }
}
