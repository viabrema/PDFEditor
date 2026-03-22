import { describe, expect, it } from "vitest";
import { resolveChartTableData, getTableRowsFromBlock, parseCellNumber } from "./chartDataFromTableBlock";
import type { ChartBlockContent } from "./chartBlockTypes";

describe("chartDataFromTableBlock", () => {
  it("parseCellNumber handles comma decimals and empty", () => {
    expect(parseCellNumber("1,5")).toBe(1.5);
    expect(parseCellNumber("")).toBeNull();
    expect(parseCellNumber(" 12 ")).toBe(12);
  });

  it("getTableRowsFromBlock normalizes rows", () => {
    expect(getTableRowsFromBlock({ content: { rows: [["a", 1], null] } })).toEqual([
      ["a", "1"],
      [],
    ]);
  });

  it("resolveChartTableData fails without source id", () => {
    const content: ChartBlockContent = {
      configured: false,
      dataSourceBlockId: null,
      firstRowIsHeader: true,
      chart: { version: 1, baseType: "line", datasets: [] },
    };
    const r = resolveChartTableData([], content);
    expect(r.ok).toBe(false);
  });

  it("resolveChartTableData resolves table block and strips header row", () => {
    const blocks = [
      { id: "tbl-1", type: "table", content: { rows: [["X", "Y"], ["a", "1"], ["b", "2"]] } },
    ];
    const content: ChartBlockContent = {
      configured: true,
      dataSourceBlockId: "tbl-1",
      firstRowIsHeader: true,
      chart: { version: 1, baseType: "line", datasets: [] },
    };
    const r = resolveChartTableData(blocks, content);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.dataRows).toEqual([
        ["a", "1"],
        ["b", "2"],
      ]);
      expect(r.data.columnLabels[0]).toBe("X");
    }
  });
});
