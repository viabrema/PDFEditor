import type { ChartConfiguration } from "chart.js";
import type { ChartBlockContent, ChartDatasetSpec } from "./chartBlockTypes";
import type { ResolvedTableData } from "./chartDataFromTableBlock";
import { parseCellNumber } from "./chartDataFromTableBlock";

export { applyChartFontScale } from "./chartFontScale";

function cell(rows: string[][], row: number, col: number): string {
  const r = rows[row];
  if (!r || col < 0 || col >= r.length) {
    return "";
  }
  return r[col] == null ? "" : String(r[col]);
}

function buildDatasetStyle(ds: ChartDatasetSpec) {
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

export function buildChartJsConfiguration(
  content: ChartBlockContent,
  resolved: ResolvedTableData,
): ChartConfiguration | null {
  const { chart } = content;
  const rows = resolved.dataRows;
  const base = chart.baseType;

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
          ...(titleBg
            ? {
                backgroundColor: titleBg,
              }
            : {}),
        }
      : { display: false };

  const legendOpts = {
    display: chart.legendDisplay !== false,
    position: chart.legendPosition || ("top" as const),
  };

  const scalesCartesian =
    base === "line" ||
    base === "bar" ||
    base === "scatter" ||
    base === "bubble"
      ? {
          x: {
            grid: { display: true },
            ticks: { maxRotation: 45, minRotation: 0 },
          },
          y: {
            position: chart.yAxisRight ? ("right" as const) : ("left" as const),
            grid: { display: true },
            beginAtZero: base === "bar",
          },
        }
      : undefined;

  if (base === "pie" || base === "doughnut" || base === "polarArea") {
    const ds = chart.datasets[0];
    if (!ds) {
      return null;
    }
    const xi = ds.mapping.xColumnIndex;
    const yi = ds.mapping.yColumnIndex;
    const labels = rows.map((_, i) => cell(rows, i, xi) || "");
    const data = rows.map((_, i) => parseCellNumber(cell(rows, i, yi)) ?? 0);
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
    const labels = rows.map((_, i) => cell(rows, i, xi) || `P${i + 1}`);
    const datasets = chart.datasets.map((ds) => {
      const yi = ds.mapping.yColumnIndex;
      const st = buildDatasetStyle(ds);
      const data = rows.map((_, i) => parseCellNumber(cell(rows, i, yi)) ?? 0);
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

  if (base === "candlestick") {
    const ds = chart.datasets[0];
    if (!ds) {
      return null;
    }
    const m = ds.mapping;
    const xi = m.xColumnIndex;
    const data = rows.map((_, i) => {
      const xRaw = parseCellNumber(cell(rows, i, xi));
      const o = parseCellNumber(cell(rows, i, m.openColumnIndex!));
      const h = parseCellNumber(cell(rows, i, m.highColumnIndex!));
      const l = parseCellNumber(cell(rows, i, m.lowColumnIndex!));
      const c = parseCellNumber(cell(rows, i, m.closeColumnIndex!));
      return {
        x: xRaw ?? i,
        o: o ?? 0,
        h: h ?? 0,
        l: l ?? 0,
        c: c ?? 0,
      };
    });
    // chartjs-chart-financial defaults x to `timeseries`, which needs a date adapter.
    // We use index / numeric X and show labels from the X column via ticks.callback.
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
              const label = cell(rows, idx, xi).trim();
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

  if (base === "scatter") {
    const datasets = chart.datasets.map((ds) => {
      const st = buildDatasetStyle(ds);
      const xi = ds.mapping.xColumnIndex;
      const yi = ds.mapping.yColumnIndex;
      const data = rows
        .map((_, i) => {
          const x = parseCellNumber(cell(rows, i, xi));
          const y = parseCellNumber(cell(rows, i, yi));
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

  if (base === "bubble") {
    const datasets = chart.datasets.map((ds) => {
      const st = buildDatasetStyle(ds);
      const xi = ds.mapping.xColumnIndex;
      const yi = ds.mapping.yColumnIndex;
      const ri = ds.mapping.rColumnIndex ?? yi;
      const data = rows
        .map((_, i) => {
          const x = parseCellNumber(cell(rows, i, xi));
          const y = parseCellNumber(cell(rows, i, yi));
          const r = parseCellNumber(cell(rows, i, ri));
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

  // line / bar (categorias no eixo X)
  const ds0 = chart.datasets[0];
  if (!ds0) {
    return null;
  }
  const xi = ds0.mapping.xColumnIndex;
  const labels = rows.map((_, i) => cell(rows, i, xi) || `Item ${i + 1}`);

  const datasets = chart.datasets.map((ds) => {
    const t = (ds.type || base) as "line" | "bar";
    const yi = ds.mapping.yColumnIndex;
    const st = buildDatasetStyle(ds);
    const data = rows.map((_, i) => parseCellNumber(cell(rows, i, yi)));
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
