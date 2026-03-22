import { describe, expect, it } from "vitest";
import {
  chartBlockHasExcelLink,
  chartGridHasAnyValue,
  createChartBlock,
  createLinkedChartBlockFromExcel,
  getChartContent,
  isChartConfigured,
} from "./chartBlock";
import { BLOCK_TYPES } from "./blockModel";

describe("chartBlock", () => {
  it("chartGridHasAnyValue is false for empty or blank rows", () => {
    expect(chartGridHasAnyValue([])).toBe(false);
    expect(chartGridHasAnyValue([[]])).toBe(false);
    expect(chartGridHasAnyValue([["", "  "]])).toBe(false);
    expect(chartGridHasAnyValue([[null as unknown as string]])).toBe(false);
  });

  it("createChartBlock defaults metadata to empty object", () => {
    const b = createChartBlock({
      position: { x: 0, y: 0 },
      pageId: null,
      languageId: "pt",
    });
    expect(b.metadata).toEqual({});
  });

  it("createChartBlock preserves explicit metadata", () => {
    const b = createChartBlock({
      position: { x: 0, y: 0 },
      pageId: null,
      languageId: "pt",
      metadata: { region: "header" },
    });
    expect((b.metadata as { region?: string }).region).toBe("header");
  });

  it("getChartContent falls back to empty when content has no chart", () => {
    const c = getChartContent({ content: { foo: 1 } });
    expect(c.configured).toBe(false);
    expect(c.dataSourceRows.length).toBeGreaterThan(0);
  });

  it("isChartConfigured is false when configured flag is false", () => {
    expect(
      isChartConfigured({
        content: {
          configured: false,
          dataSourceRows: [["a"]],
          chart: { version: 1, baseType: "line", datasets: [] },
        },
      }),
    ).toBe(false);
  });

  it("isChartConfigured is false when grid has only null-like cells", () => {
    expect(
      isChartConfigured({
        content: {
          configured: true,
          dataSourceRows: [[null as unknown as string]],
          chart: { version: 1, baseType: "line", datasets: [] },
        },
      }),
    ).toBe(false);
  });

  it("isChartConfigured is true with dataSourceBlockId and grid sem dados", () => {
    expect(
      isChartConfigured({
        content: {
          configured: true,
          dataSourceRows: [[""], [""]],
          dataSourceBlockId: "tbl-1",
          chart: { version: 1, baseType: "line", datasets: [] },
        },
      }),
    ).toBe(true);
  });

  it("chartBlockHasExcelLink is true when metadata has full excelLink", () => {
    expect(
      chartBlockHasExcelLink({
        type: BLOCK_TYPES.CHART,
        metadata: { excelLink: { filePath: "C:\\a.xlsx", sheetName: "S", range: "A1:B2" } },
      }),
    ).toBe(true);
  });

  it("chartBlockHasExcelLink is false when excelLink is null or chart has no link", () => {
    expect(chartBlockHasExcelLink({ type: BLOCK_TYPES.CHART, metadata: {} })).toBe(false);
    expect(chartBlockHasExcelLink({ type: BLOCK_TYPES.CHART, metadata: { excelLink: null } })).toBe(
      false,
    );
  });

  it("chartBlockHasExcelLink is false for non-chart or incomplete link", () => {
    expect(chartBlockHasExcelLink({ type: BLOCK_TYPES.TEXT, metadata: {} })).toBe(false);
    expect(
      chartBlockHasExcelLink({
        type: BLOCK_TYPES.CHART,
        metadata: { excelLink: { sheetName: "S", range: "A1" } },
      }),
    ).toBe(false);
    expect(
      chartBlockHasExcelLink({
        type: BLOCK_TYPES.CHART,
        metadata: { excelLink: { filePath: "C:\\a.xlsx", sheetName: "", range: "A1" } },
      }),
    ).toBe(false);
    expect(
      chartBlockHasExcelLink({
        type: BLOCK_TYPES.CHART,
        metadata: { excelLink: { filePath: "  ", sheetName: "S", range: "A1" } },
      }),
    ).toBe(false);
    expect(
      chartBlockHasExcelLink({
        type: BLOCK_TYPES.CHART,
        metadata: { excelLink: { filePath: "C:\\a.xlsx", sheetName: "S", range: "  " } },
      }),
    ).toBe(false);
    expect(
      chartBlockHasExcelLink({
        type: BLOCK_TYPES.CHART,
        metadata: { excelLink: { filePath: "C:\\a.xlsx", sheetName: "S" } as { range?: string } },
      }),
    ).toBe(false);
  });

  it("createLinkedChartBlockFromExcel uses default grid when rows are empty", () => {
    const block = createLinkedChartBlockFromExcel({
      rows: [],
      excelLink: { filePath: "C:\\d.xlsx", sheetName: "F1", range: "A1:B2" },
      position: { x: 0, y: 0 },
      pageId: null,
      languageId: "pt",
      metadata: null as unknown as Record<string, unknown>,
    });
    expect(getChartContent(block).dataSourceRows).toEqual([
      ["A", "B"],
      ["", ""],
    ]);
  });

  it("createLinkedChartBlockFromExcel sets rows, configured and excelLink", () => {
    const block = createLinkedChartBlockFromExcel({
      rows: [
        ["x", "y"],
        ["1", "2"],
      ],
      excelLink: { filePath: "C:\\d.xlsx", sheetName: "F1", range: "A1:B2" },
      position: { x: 10, y: 20 },
      pageId: "p1",
      languageId: "pt",
      metadata: {},
    });
    expect(block.type).toBe(BLOCK_TYPES.CHART);
    expect(block.metadata?.excelLink).toEqual({
      filePath: "C:\\d.xlsx",
      sheetName: "F1",
      range: "A1:B2",
    });
    const c = getChartContent(block);
    expect(c.configured).toBe(true);
    expect(c.dataSourceRows).toEqual([
      ["x", "y"],
      ["1", "2"],
    ]);
  });
});
