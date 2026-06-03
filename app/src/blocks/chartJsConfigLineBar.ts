import type { ChartConfiguration } from "chart.js";
import type { ChartBlockContent } from "./chartBlockTypes";
import type { ResolvedTableData } from "./chartDataFromTableBlock";
import {
  buildCartesianScales,
  buildChartTitleAndLegend,
  buildDatasetStyle,
  chartCell,
  parseCellNumber,
} from "./chartJsConfigShared";

export function buildLineBarChartConfig(
  content: ChartBlockContent,
  resolved: ResolvedTableData,
): ChartConfiguration | null {
  const { chart } = content;
  const rows = resolved.dataRows;
  const base = chart.baseType;
  const { titlePlugin, legendOpts } = buildChartTitleAndLegend(chart);
  const scalesCartesian = buildCartesianScales(base, chart.yAxisRight);

  const ds0 = chart.datasets[0];
  if (!ds0) {
    return null;
  }
  const xi = ds0.mapping.xColumnIndex;
  const labels = rows.map((_, i) => chartCell(rows, i, xi) || `Item ${i + 1}`);

  const datasets = chart.datasets.map((ds) => {
    const t = (ds.type || base) as "line" | "bar";
    const yi = ds.mapping.yColumnIndex;
    const st = buildDatasetStyle(ds);
    const data = rows.map((_, i) => parseCellNumber(chartCell(rows, i, yi)));
    return {
      type: t,
      label: ds.label,
      data,
      borderColor: st.borderColor,
      backgroundColor: st.backgroundColor,
      borderWidth: st.borderWidth,
      fill: t === "line" ? st.fill : undefined,
      tension: t === "line" ? st.tension : undefined,
      pointRadius: st.pointRadius,
    };
  });

  const resolvedTypes = chart.datasets.map((ds) => ds.type || base);
  const mixed = new Set(resolvedTypes).size > 1;
  const chartType =
    mixed && resolvedTypes.includes("bar")
      ? ("bar" as const)
      : base === "bar"
        ? ("bar" as const)
        : ("line" as const);

  return {
    type: chartType,
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: legendOpts,
        title: titlePlugin as any,
      },
      scales: scalesCartesian as any,
    },
  };
}
