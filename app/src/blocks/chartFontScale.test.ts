import { describe, expect, it } from "vitest";
import { applyChartFontScale } from "./chartFontScale";
import { buildChartJsConfiguration } from "./chartSpecToChartJs";
import type { ChartBlockContent } from "./chartBlockTypes";
import type { ResolvedTableData } from "./chartDataFromTableBlock";

const resolved: ResolvedTableData = {
  columnCount: 2,
  columnLabels: ["Mes", "Val"],
  dataRows: [
    ["Jan", "10"],
    ["Feb", "20"],
  ],
  rawRows: [],
};

describe("chartFontScale", () => {
  it("returns same config when scale is 1", () => {
    const content: ChartBlockContent = {
      configured: true,
      dataSourceRows: [
        ["Mes", "Val"],
        ["Jan", "10"],
      ],
      firstRowIsHeader: true,
      chart: {
        version: 1,
        baseType: "line",
        title: { text: "" },
        legendDisplay: true,
        legendPosition: "top",
        yAxisRight: false,
        datasets: [
          {
            id: "d1",
            label: "V",
            mapping: { xColumnIndex: 0, yColumnIndex: 1 },
            style: { borderColor: "#000", tension: 0 },
          },
        ],
      },
    };
    const base = buildChartJsConfiguration(content, resolved);
    expect(base).not.toBeNull();
    if (!base) {
      return;
    }
    expect(applyChartFontScale(base, 1)).toBe(base);
  });

  it("scales legend, title and axis tick fonts", () => {
    const content: ChartBlockContent = {
      configured: true,
      dataSourceRows: [
        ["Mes", "Val"],
        ["Jan", "10"],
      ],
      firstRowIsHeader: true,
      chart: {
        version: 1,
        baseType: "line",
        title: { text: "T" },
        legendDisplay: true,
        legendPosition: "top",
        yAxisRight: false,
        datasets: [
          {
            id: "d1",
            label: "V",
            mapping: { xColumnIndex: 0, yColumnIndex: 1 },
            style: { borderColor: "#000", tension: 0 },
          },
        ],
      },
    };
    const base = buildChartJsConfiguration(content, resolved);
    expect(base).not.toBeNull();
    if (!base) {
      return;
    }
    const scaled = applyChartFontScale(base, 2);
    const opts = scaled.options as Record<string, unknown>;
    const plugins = opts.plugins as Record<string, unknown> | undefined;
    const legend = plugins?.legend as { labels?: { font?: { size?: number } } } | undefined;
    const title = plugins?.title as { font?: { size?: number } } | undefined;
    const scales = opts.scales as { x?: { ticks?: { font?: { size?: number } } } } | undefined;
    expect(legend?.labels?.font?.size).toBe(22);
    expect(title?.font?.size).toBe(26);
    expect(scales?.x?.ticks?.font?.size).toBe(22);
  });

  it("applyChartFontScale skips legend when missing and scales without ticks", () => {
    const cfg = {
      type: "radar" as const,
      data: { labels: [], datasets: [] },
      options: {
        plugins: {
          title: { display: false, text: "" },
        },
        scales: { r: { beginAtZero: true } },
      },
    };
    const scaled = applyChartFontScale(cfg as any, 2);
    expect(scaled.options).toBeDefined();
  });

  it("applyChartFontScale creates options object when missing", () => {
    const cfg = { type: "line" as const, data: { labels: [], datasets: [] } };
    const scaled = applyChartFontScale(cfg as any, 2);
    expect(scaled.options).toBeDefined();
  });

  it("applyChartFontScale initializes options and skips non-object title", () => {
    const cfg = {
      type: "line" as const,
      data: { labels: [], datasets: [] },
      options: {
        plugins: { legend: { display: true, position: "top" as const }, title: "x" as unknown as object },
      },
    };
    applyChartFontScale(cfg as any, 2);
  });
});
