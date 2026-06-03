import type { ChartConfiguration } from "chart.js";
import type { ChartBlockContent } from "./chartBlockTypes";
import type { ResolvedTableData } from "./chartDataFromTableBlock";
import { buildChartTitleAndLegend, chartCell, parseCellNumber } from "./chartJsConfigShared";

export function buildCandlestickChartConfig(
  content: ChartBlockContent,
  resolved: ResolvedTableData,
): ChartConfiguration | null {
  const { chart } = content;
  const rows = resolved.dataRows;
  const { titlePlugin, legendOpts } = buildChartTitleAndLegend(chart);

  const ds = chart.datasets[0];
  if (!ds) {
    return null;
  }
  const m = ds.mapping;
  const xi = m.xColumnIndex;
  const data = rows.map((_, i) => {
    const xRaw = parseCellNumber(chartCell(rows, i, xi));
    const o = parseCellNumber(chartCell(rows, i, m.openColumnIndex!));
    const h = parseCellNumber(chartCell(rows, i, m.highColumnIndex!));
    const l = parseCellNumber(chartCell(rows, i, m.lowColumnIndex!));
    const c = parseCellNumber(chartCell(rows, i, m.closeColumnIndex!));
    return {
      x: xRaw ?? i,
      o: o ?? 0,
      h: h ?? 0,
      l: l ?? 0,
      c: c ?? 0,
    };
  });
  const scalesCandlestick = {
    x: {
      type: "linear" as const,
      grid: { display: true },
      ticks: {
        maxRotation: 45,
        minRotation: 0,
        callback(tickValue: string | number) {
          const n = typeof tickValue === "number" ? tickValue : Number(tickValue);
          if (!Number.isFinite(n)) {
            return String(tickValue);
          }
          const idx = Math.round(n);
          if (idx >= 0 && idx < rows.length) {
            const label = chartCell(rows, idx, xi).trim();
            if (label) {
              return label;
            }
          }
          return String(tickValue);
        },
      },
    },
    y: {
      type: "linear" as const,
      position: chart.yAxisRight ? ("right" as const) : ("left" as const),
      grid: { display: true },
    },
  };
  return {
    type: "candlestick",
    data: {
      datasets: [
        {
          label: ds.label,
          data,
          borderColor: ds.style?.borderColor || "#0891b2",
          backgroundColors: {
            up: "#16a34a",
            down: "#dc2626",
            unchanged: "#64748b",
          },
          borderColors: {
            up: "#15803d",
            down: "#b91c1c",
            unchanged: "#475569",
          },
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
      scales: scalesCandlestick as any,
    },
  };
}
