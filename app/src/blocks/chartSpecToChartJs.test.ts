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
      dataSourceBlockId: "t1",
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
      dataSourceBlockId: "t1",
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
});
