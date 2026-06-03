import type { ChartDatasetSpec } from "./chartBlockTypes";
import { parseCellNumber } from "./chartDataFromTableBlock";

export { parseCellNumber };

export function chartCell(rows: string[][], row: number, col: number): string {
  const r = rows[row];
  if (!r || col < 0 || col >= r.length) {
    return "";
  }
  return r[col] == null ? "" : String(r[col]);
}

export function buildDatasetStyle(ds: ChartDatasetSpec) {
  const s = ds.style || {};
  return {
    borderColor: s.borderColor ?? "#2563eb",
    backgroundColor: s.backgroundColor ?? "rgba(37, 99, 235, 0.2)",
    borderWidth: s.borderWidth ?? 2,
    fill: s.fill ?? false,
    tension: s.tension ?? 0.2,
    pointRadius: s.pointRadius ?? 3,
  };
}

export function buildChartTitleAndLegend(chart: {
  title?: { text?: string; backgroundColor?: string; color?: string };
  legendDisplay?: boolean;
  legendPosition?: string;
}) {
  const titleText = chart.title?.text?.trim() || "";
  const titleBg = chart.title?.backgroundColor || "";
  const titleColor = chart.title?.color || "#fff";

  const titlePlugin =
    titleText !== ""
      ? {
          display: true,
          text: titleText,
          color: titleColor,
          padding: { top: 8, bottom: 8 },
          ...(titleBg ? { backgroundColor: titleBg } : {}),
        }
      : { display: false };

  const legendOpts = {
    display: chart.legendDisplay !== false,
    position: (chart.legendPosition || "top") as "top",
  };

  return { titlePlugin, legendOpts };
}

export function buildCartesianScales(
  base: string,
  yAxisRight?: boolean,
) {
  if (
    base === "line" ||
    base === "bar" ||
    base === "scatter" ||
    base === "bubble"
  ) {
    return {
      x: {
        grid: { display: true },
        ticks: { maxRotation: 45, minRotation: 0 },
      },
      y: {
        position: yAxisRight ? ("right" as const) : ("left" as const),
        grid: { display: true },
        beginAtZero: base === "bar",
      },
    };
  }
  return undefined;
}
