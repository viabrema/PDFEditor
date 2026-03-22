import { describe, expect, it } from "vitest";
import {
  resolveChartTableData,
  getTableRowsFromBlock,
  parseCellNumber,
  normalizeChartDataSourceRows,
} from "./chartDataFromTableBlock";
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

  it("normalizeChartDataSourceRows coerces cells to string", () => {
    expect(normalizeChartDataSourceRows([["x", 1], null])).toEqual([["x", "1"], []]);
  });

  it("resolveChartTableData fails when grelha vazia e sem legado", () => {
    const content: ChartBlockContent = {
      configured: false,
      dataSourceRows: [],
      firstRowIsHeader: true,
      chart: { version: 1, baseType: "line", datasets: [] },
    };
    const r = resolveChartTableData([], content);
    expect(r.ok).toBe(false);
  });

  it("resolveChartTableData uses dataSourceRows embutido", () => {
    const content: ChartBlockContent = {
      configured: true,
      dataSourceRows: [
        ["X", "Y"],
        ["a", "1"],
        ["b", "2"],
      ],
      firstRowIsHeader: true,
      chart: { version: 1, baseType: "line", datasets: [] },
    };
    const r = resolveChartTableData([], content);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.dataRows).toEqual([
        ["a", "1"],
        ["b", "2"],
      ]);
      expect(r.data.columnLabels[0]).toBe("X");
    }
  });

  it("resolveChartTableData prioriza grelha embutida sobre legado dataSourceBlockId", () => {
    const blocks = [
      { id: "tbl-1", type: "table", content: { rows: [["Old"], ["x"]] } },
    ];
    const content: ChartBlockContent = {
      configured: true,
      dataSourceRows: [
        ["U", "V"],
        ["1", "2"],
      ],
      dataSourceBlockId: "tbl-1",
      firstRowIsHeader: true,
      chart: { version: 1, baseType: "line", datasets: [] },
    };
    const r = resolveChartTableData(blocks, content);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.dataRows).toEqual([["1", "2"]]);
      expect(r.data.columnLabels[0]).toBe("U");
    }
  });

  it("resolveChartTableData usa bloco tabela apenas se grelha vazia (legado)", () => {
    const blocks = [
      { id: "tbl-1", type: "table", content: { rows: [["X", "Y"], ["a", "1"], ["b", "2"]] } },
    ];
    const content: ChartBlockContent = {
      configured: true,
      dataSourceRows: [],
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
    }
  });
});
