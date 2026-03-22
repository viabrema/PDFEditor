import { describe, expect, it } from "vitest";
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

describe("chartSpecToChartJs", () => {
  it("builds line chart with labels from X column", () => {
    const content: ChartBlockContent = {
      configured: true,
      dataSourceRows: [
        ["Mes", "Val"],
        ["Jan", "10"],
        ["Feb", "20"],
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
            label: "Vendas",
            mapping: { xColumnIndex: 0, yColumnIndex: 1 },
            style: { borderColor: "#000", tension: 0 },
          },
        ],
      },
    };
    const cfg = buildChartJsConfiguration(content, resolved);
    expect(cfg).not.toBeNull();
    if (!cfg) {
      return;
    }
    expect(cfg.type).toBe("line");
    expect(cfg.data.labels).toEqual(["Jan", "Feb"]);
    const ds0 = cfg.data.datasets[0] as { data: (number | null)[] };
    expect(ds0.data).toEqual([10, 20]);
  });

  it("uses bar as root type when mixing bar and line", () => {
    const content: ChartBlockContent = {
      configured: true,
      dataSourceRows: [
        ["Mes", "Val"],
        ["Jan", "10"],
        ["Feb", "20"],
      ],
      firstRowIsHeader: true,
      chart: {
        version: 1,
        baseType: "line",
        legendDisplay: true,
        legendPosition: "top",
        yAxisRight: false,
        datasets: [
          { id: "d1", label: "L", mapping: { xColumnIndex: 0, yColumnIndex: 1 } },
          {
            id: "d2",
            label: "B",
            type: "bar",
            mapping: { xColumnIndex: 0, yColumnIndex: 1 },
          },
        ],
      },
    };
    const cfg = buildChartJsConfiguration(content, resolved);
    expect(cfg?.type).toBe("bar");
  });

  it("candlestick uses linear x scale (no date adapter)", () => {
    const content: ChartBlockContent = {
      configured: true,
      dataSourceRows: [
        ["C", "O", "H", "L", "C"],
        ["Mar/26", "1", "3", "0.5", "2"],
      ],
      firstRowIsHeader: true,
      chart: {
        version: 1,
        baseType: "candlestick",
        title: { text: "T" },
        legendDisplay: false,
        legendPosition: "top",
        yAxisRight: false,
        datasets: [
          {
            id: "d1",
            label: "P",
            mapping: {
              xColumnIndex: 0,
              openColumnIndex: 1,
              highColumnIndex: 2,
              lowColumnIndex: 3,
              closeColumnIndex: 4,
            },
          },
        ],
      },
    };
    const ohlcResolved: ResolvedTableData = {
      columnCount: 5,
      columnLabels: ["C", "O", "H", "L", "C"],
      dataRows: [["Mar/26", "1", "3", "0.5", "2"]],
      rawRows: [],
    };
    const cfg = buildChartJsConfiguration(content, ohlcResolved);
    expect(cfg?.type).toBe("candlestick");
    const xScale = (cfg?.options as { scales?: { x?: { type?: string } } })?.scales?.x;
    expect(xScale?.type).toBe("linear");
  });
});
