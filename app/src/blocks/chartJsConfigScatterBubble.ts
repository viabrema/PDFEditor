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

export function buildScatterChartConfig(
  content: ChartBlockContent,
  resolved: ResolvedTableData,
): ChartConfiguration | null {
  const { chart } = content;
  const rows = resolved.dataRows;
  const { titlePlugin, legendOpts } = buildChartTitleAndLegend(chart);
  const scalesCartesian = buildCartesianScales(chart.baseType, chart.yAxisRight);

  const datasets = chart.datasets.map((ds) => {
    const st = buildDatasetStyle(ds);
    const xi = ds.mapping.xColumnIndex;
    const yi = ds.mapping.yColumnIndex;
    const data = rows
      .map((_, i) => {
        const x = parseCellNumber(chartCell(rows, i, xi));
        const y = parseCellNumber(chartCell(rows, i, yi));
        if (x === null || y === null) {
          return null;
        }
        return { x, y };
      })
      .filter(Boolean) as { x: number; y: number }[];
    return {
      type: "scatter" as const,
      label: ds.label,
      data,
      borderColor: st.borderColor,
      backgroundColor: st.backgroundColor,
      borderWidth: st.borderWidth,
      pointRadius: st.pointRadius,
    };
  });
  return {
    type: "scatter",
    data: { datasets },
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

export function buildBubbleChartConfig(
  content: ChartBlockContent,
  resolved: ResolvedTableData,
): ChartConfiguration | null {
  const { chart } = content;
  const rows = resolved.dataRows;
  const { titlePlugin, legendOpts } = buildChartTitleAndLegend(chart);
  const scalesCartesian = buildCartesianScales(chart.baseType, chart.yAxisRight);

  const datasets = chart.datasets.map((ds) => {
    const st = buildDatasetStyle(ds);
    const xi = ds.mapping.xColumnIndex;
    const yi = ds.mapping.yColumnIndex;
    const ri = ds.mapping.rColumnIndex ?? yi;
    const data = rows
      .map((_, i) => {
        const x = parseCellNumber(chartCell(rows, i, xi));
        const y = parseCellNumber(chartCell(rows, i, yi));
        const r = parseCellNumber(chartCell(rows, i, ri));
        if (x === null || y === null || r === null) {
          return null;
        }
        return { x, y, r: Math.max(2, r) };
      })
      .filter(Boolean) as { x: number; y: number; r: number }[];
    return {
      type: "bubble" as const,
      label: ds.label,
      data,
      borderColor: st.borderColor,
      backgroundColor: st.backgroundColor,
      borderWidth: st.borderWidth,
    };
  });
  return {
    type: "bubble",
    data: { datasets },
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
