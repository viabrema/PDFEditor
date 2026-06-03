import type { ChartConfiguration } from "chart.js";
import type { ChartBlockContent } from "./chartBlockTypes";
import type { ResolvedTableData } from "./chartDataFromTableBlock";
import {
  buildChartTitleAndLegend,
  buildDatasetStyle,
  chartCell,
  parseCellNumber,
} from "./chartJsConfigShared";

export function buildRadialChartConfig(
  content: ChartBlockContent,
  resolved: ResolvedTableData,
): ChartConfiguration | null {
  const { chart } = content;
  const rows = resolved.dataRows;
  const base = chart.baseType;
  const { titlePlugin, legendOpts } = buildChartTitleAndLegend(chart);

  if (base === "pie" || base === "doughnut" || base === "polarArea") {
    const ds = chart.datasets[0];
    if (!ds) {
      return null;
    }
    const xi = ds.mapping.xColumnIndex;
    const yi = ds.mapping.yColumnIndex;
    const labels = rows.map((_, i) => chartCell(rows, i, xi) || "");
    const data = rows.map((_, i) => parseCellNumber(chartCell(rows, i, yi)) ?? 0);
    const st = buildDatasetStyle(ds);
    return {
      type: base,
      data: {
        labels,
        datasets: [
          {
            label: ds.label,
            data,
            backgroundColor: rows.map((_, i) => {
              const hex = st.borderColor;
              const alpha = 0.35 + (i % 5) * 0.08;
              return hex.startsWith("#") && hex.length === 7
                ? `${hex}${Math.round(alpha * 255)
                    .toString(16)
                    .padStart(2, "0")}`
                : st.backgroundColor;
            }),
            borderColor: st.borderColor,
            borderWidth: st.borderWidth,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: legendOpts,
          title: titlePlugin as any,
        },
      },
    };
  }

  if (base === "radar") {
    const ds0 = chart.datasets[0];
    if (!ds0) {
      return null;
    }
    const xi = ds0.mapping.xColumnIndex;
    const labels = rows.map((_, i) => chartCell(rows, i, xi) || `P${i + 1}`);
    const datasets = chart.datasets.map((ds) => {
      const yi = ds.mapping.yColumnIndex;
      const st = buildDatasetStyle(ds);
      const data = rows.map((_, i) => parseCellNumber(chartCell(rows, i, yi)) ?? 0);
      return {
        label: ds.label,
        data,
        borderColor: st.borderColor,
        backgroundColor: st.backgroundColor,
        borderWidth: st.borderWidth,
        fill: st.fill,
        pointRadius: st.pointRadius,
      };
    });
    return {
      type: "radar",
      data: { labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: legendOpts,
          title: titlePlugin as any,
        },
        scales: {
          r: {
            beginAtZero: true,
          },
        },
      },
    };
  }

  return null;
}
