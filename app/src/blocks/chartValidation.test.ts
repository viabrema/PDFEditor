import { describe, expect, it } from "vitest";
import { validateChartConfiguration } from "./chartValidation";
import type { ChartBlockContent, ChartSpec } from "./chartBlockTypes";
import type { ResolvedTableData } from "./chartDataFromTableBlock";

const table: ResolvedTableData = {
  columnCount: 3,
  columnLabels: ["A", "B", "C"],
  dataRows: [
    ["1", "10", "100"],
    ["2", "20", "200"],
  ],
  rawRows: [],
};

function makeContent(chart: ChartSpec): ChartBlockContent {
  return {
    configured: true,
    dataSourceRows: [
      ["A", "B", "C"],
      ["1", "10", "100"],
      ["2", "20", "200"],
    ],
    firstRowIsHeader: true,
    chart,
  };
}

describe("chartValidation", () => {
  it("accepts simple line spec", () => {
    const c = makeContent({
      version: 1,
      baseType: "line",
      legendDisplay: true,
      legendPosition: "top",
      yAxisRight: false,
      datasets: [{ id: "d1", label: "S1", mapping: { xColumnIndex: 0, yColumnIndex: 1 } }],
    });
    expect(validateChartConfiguration(c, table)).toEqual({ ok: true });
  });

  it("rejects pie with multiple datasets", () => {
    const c = makeContent({
      version: 1,
      baseType: "pie",
      legendDisplay: true,
      legendPosition: "top",
      yAxisRight: false,
      datasets: [
        { id: "a", label: "A", mapping: { xColumnIndex: 0, yColumnIndex: 1 } },
        { id: "b", label: "B", mapping: { xColumnIndex: 0, yColumnIndex: 2 } },
      ],
    });
    const r = validateChartConfiguration(c, table);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.message).toContain("uma serie");
    }
  });

  it("rejects candlestick without OHLC columns", () => {
    const c = makeContent({
      version: 1,
      baseType: "candlestick",
      legendDisplay: true,
      legendPosition: "top",
      yAxisRight: false,
      datasets: [
        {
          id: "d1",
          label: "OHLC",
          mapping: { xColumnIndex: 0, yColumnIndex: 1 },
        },
      ],
    });
    const r = validateChartConfiguration(c, table);
    expect(r.ok).toBe(false);
  });

  it("accepts mixed line and bar on line base", () => {
    const c = makeContent({
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
          mapping: { xColumnIndex: 0, yColumnIndex: 2 },
        },
      ],
    });
    expect(validateChartConfiguration(c, table)).toEqual({ ok: true });
  });

  it("rejects invalid column index", () => {
    const c = makeContent({
      version: 1,
      baseType: "line",
      legendDisplay: true,
      legendPosition: "top",
      yAxisRight: false,
      datasets: [
        {
          id: "d1",
          label: "S1",
          mapping: { xColumnIndex: 0, yColumnIndex: 9 },
        },
      ],
    });
    const r = validateChartConfiguration(c, table);
    expect(r.ok).toBe(false);
  });
});
