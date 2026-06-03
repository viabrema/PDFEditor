import { describe, expect, it } from "vitest";
import {
  applyExcelSnapshotToLinkedTable,
  createLinkedTableContentFromExcel,
  formatDataLayerCellForDisplay,
  getTableDataRows,
  getTableRowsForStyleGrid,
  getTableDataMerges,
  getTableStructureMerges,
  getTableVisualRows,
  getTypingCellRawValue,
  normalizeLinkedTableContent,
  writeTypingCellRawValue,
} from "./linkedTableModel";
import { BLOCK_TYPES } from "./blockModel";

describe("linkedTableModel", () => {
  it("normalize skips merges when dataSourceMerges already set", () => {
    const m1 = { r: 0, c: 0, rowspan: 1, colspan: 1 };
    const m2 = { r: 0, c: 1, rowspan: 1, colspan: 1 };
    const block = {
      type: BLOCK_TYPES.LINKED_TABLE,
      content: {
        dataSourceRows: [["a"]],
        dataSourceMerges: [m1],
        merges: [m2],
      },
    };
    normalizeLinkedTableContent(block);
    expect(block.content.dataSourceMerges).toEqual([m1]);
  });

  it("getTypingCellRawValue returns empty for missing cell", () => {
    const block = {
      type: BLOCK_TYPES.LINKED_TABLE,
      content: { dataSourceRows: [["a"]] },
    };
    expect(getTypingCellRawValue(block, 0, 9)).toBe("");
  });

  it("migrates legacy rows to dataSourceRows", () => {
    const block = {
      type: BLOCK_TYPES.LINKED_TABLE,
      content: { rows: [["1", "2"]], merges: [{ r: 0, c: 0, rowspan: 1, colspan: 2 }] },
    };
    normalizeLinkedTableContent(block);
    expect(block.content.dataSourceRows).toEqual([["1", "2"]]);
    expect(block.content.dataSourceMerges).toEqual([{ r: 0, c: 0, rowspan: 1, colspan: 2 }]);
  });

  it("visual rows apply editor number format", () => {
    const block = {
      type: BLOCK_TYPES.LINKED_TABLE,
      content: {
        dataSourceRows: [["1000"]],
        cellStyles: {
          "0,0": { numberFormat: { kind: "number", locale: "pt-BR", decimals: 0 } },
        },
      },
    };
    const visual = getTableVisualRows(block)[0][0];
    expect(visual).not.toBe("1000");
    expect(visual).toMatch(/1/);
  });

  it("formatDataLayerCellForDisplay uses en-US for numbers", () => {
    expect(formatDataLayerCellForDisplay("1000.5")).toBe("1,000.5");
  });

  it("applyExcelSnapshot clears merges when snapshot has none", () => {
    const block = {
      type: BLOCK_TYPES.LINKED_TABLE,
      content: {
        dataSourceRows: [["a"]],
        dataSourceMerges: [{ r: 0, c: 0, rowspan: 1, colspan: 2 }],
      },
    };
    applyExcelSnapshotToLinkedTable(block, { rows: [["b"]], merges: null as unknown as [] });
    expect(getTableStructureMerges(block)).toEqual([]);
  });

  it("createLinkedTableContentFromExcel omits invalid merges", () => {
    const content = createLinkedTableContentFromExcel({
      rows: [["x"]],
      merges: null as unknown as [],
    });
    expect(content.merges).toEqual([]);
  });

  it("createLinkedTableContentFromExcel copies valid merges", () => {
    const merge = { r: 0, c: 0, rowspan: 1, colspan: 2 };
    const content = createLinkedTableContentFromExcel({
      rows: [["x"]],
      merges: [merge],
    });
    expect(content.merges).toEqual([merge]);
    expect(content.dataSourceMerges).toEqual([merge]);
  });

  it("applyExcelSnapshot initializes content when missing", () => {
    const block = { type: BLOCK_TYPES.LINKED_TABLE };
    applyExcelSnapshotToLinkedTable(block, {
      rows: [["n"]],
      merges: [{ r: 0, c: 0, rowspan: 1, colspan: 1 }],
    });
    expect(block.content?.dataSourceRows).toEqual([["n"]]);
  });

  it("applyExcelSnapshot updates data only", () => {
    const block = {
      type: BLOCK_TYPES.LINKED_TABLE,
      content: {
        dataSourceRows: [["old"]],
        cellStyles: { "0,0": { fontWeight: "bold" } },
      },
    };
    applyExcelSnapshotToLinkedTable(block, { rows: [["new"]], merges: [] });
    expect(getTableDataRows(block)).toEqual([["new"]]);
    expect(block.content.cellStyles?.["0,0"]?.fontWeight).toBe("bold");
  });

  it("writeTypingCellRawValue updates dataSourceRows", () => {
    const block = {
      type: BLOCK_TYPES.LINKED_TABLE,
      content: { dataSourceRows: [["a"]] },
    };
    writeTypingCellRawValue(block, 0, 0, "b");
    expect(getTypingCellRawValue(block, 0, 0)).toBe("b");
  });

  it("writeTypingCellRawValue no-op when row missing on linked table", () => {
    const block = {
      type: BLOCK_TYPES.LINKED_TABLE,
      content: { dataSourceRows: [["a"]] },
    };
    writeTypingCellRawValue(block, 9, 0, "z");
    expect(getTypingCellRawValue(block, 0, 0)).toBe("a");
  });

  it("writeTypingCellRawValue no-op when plain table row missing", () => {
    const block = { type: BLOCK_TYPES.TABLE, content: { rows: [["x"]] } };
    writeTypingCellRawValue(block, 3, 0, "z");
    expect(block.content.rows[0][0]).toBe("x");
  });

  it("writeTypingCellRawValue ignores plain table when rows is not an array", () => {
    const block = { type: BLOCK_TYPES.TABLE, content: { rows: "bad" as unknown as string[][] } };
    writeTypingCellRawValue(block, 0, 0, "z");
    expect(block.content.rows).toBe("bad");
  });

  it("getTableVisualRows handles missing content", () => {
    expect(getTableVisualRows({ type: BLOCK_TYPES.LINKED_TABLE })).toEqual([]);
    expect(getTableVisualRows({ type: BLOCK_TYPES.LINKED_TABLE, content: null as unknown as undefined })).toEqual(
      [],
    );
  });

  it("getTableVisualRows uses empty content object", () => {
    expect(getTableVisualRows({ type: BLOCK_TYPES.LINKED_TABLE, content: {} })).toEqual([]);
  });

  it("getTableVisualRows treats undefined cells as empty", () => {
    const row: string[] = ["a"];
    row[2] = "c";
    row[1] = undefined as unknown as string;
    const block = {
      type: BLOCK_TYPES.LINKED_TABLE,
      content: { dataSourceRows: [row] },
    };
    expect(getTableVisualRows(block)[0][1]).toBe("");
  });

  it("writeTypingCellRawValue initializes plain table content when missing", () => {
    const block = { type: BLOCK_TYPES.TABLE };
    writeTypingCellRawValue(block, 0, 0, "n");
    expect(block.content).toEqual({ rows: [] });
    block.content.rows = [["a"]];
    writeTypingCellRawValue(block, 0, 0, "b");
    expect(block.content.rows[0][0]).toBe("b");
  });

  it("getTableVisualRows formats null cells as empty strings", () => {
    const block = {
      type: BLOCK_TYPES.LINKED_TABLE,
      content: { dataSourceRows: [[null as unknown as string]] },
    };
    expect(getTableVisualRows(block)[0][0]).toBe("");
  });

  it("writeTypingCellRawValue updates plain table rows", () => {
    const block = { type: BLOCK_TYPES.TABLE, content: { rows: [["x"]] } };
    writeTypingCellRawValue(block, 0, 0, "y");
    expect(block.content.rows[0][0]).toBe("y");
  });

  it("getTableDataRows stringifies null cells on plain table", () => {
    expect(
      getTableDataRows({
        type: BLOCK_TYPES.TABLE,
        content: { rows: [[null as unknown as string]] },
      }),
    ).toEqual([[""]]);
  });

  it("getTableDataRows returns empty when content has no rows", () => {
    expect(getTableDataRows({ type: BLOCK_TYPES.TABLE, content: {} })).toEqual([]);
  });

  it("getTableVisualRows delegates to data rows on plain table", () => {
    expect(
      getTableVisualRows({ type: BLOCK_TYPES.TABLE, content: { rows: [["plain"]] } }),
    ).toEqual([["plain"]]);
  });

  it("formatDataLayerCellForDisplay keeps non-numeric text", () => {
    expect(formatDataLayerCellForDisplay("abc")).toBe("abc");
  });

  it("getTableStructureMerges returns empty when linked merges missing", () => {
    expect(
      getTableStructureMerges({
        type: BLOCK_TYPES.LINKED_TABLE,
        content: { dataSourceRows: [["a"]] },
      }),
    ).toEqual([]);
  });

  it("getTableStructureMerges falls back to merges on linked table", () => {
    const merge = { r: 0, c: 0, rowspan: 1, colspan: 1 };
    expect(
      getTableStructureMerges({
        type: BLOCK_TYPES.LINKED_TABLE,
        content: { dataSourceRows: [["a"]], merges: [merge] },
      }),
    ).toEqual([merge]);
  });

  it("getTableStructureMerges uses visual merges on linked table", () => {
    const block = {
      type: BLOCK_TYPES.LINKED_TABLE,
      content: {
        dataSourceRows: [["a"]],
        dataSourceMerges: [{ r: 0, c: 0, rowspan: 1, colspan: 2 }],
        merges: [{ r: 0, c: 0, rowspan: 1, colspan: 1 }],
      },
    };
    expect(getTableStructureMerges(block)).toEqual([{ r: 0, c: 0, rowspan: 1, colspan: 1 }]);
  });

  it("getTableDataMerges delegates to structure merges on plain table", () => {
    const merge = { r: 0, c: 0, rowspan: 1, colspan: 2 };
    expect(
      getTableDataMerges({
        type: BLOCK_TYPES.TABLE,
        content: { rows: [["a"]], merges: [merge] },
      }),
    ).toEqual([merge]);
  });

  it("getTableDataMerges returns empty when dataSourceMerges is invalid", () => {
    expect(
      getTableDataMerges({
        type: BLOCK_TYPES.LINKED_TABLE,
        content: { dataSourceRows: [["a"]], dataSourceMerges: null as unknown as [] },
      }),
    ).toEqual([]);
  });

  it("getTableDataMerges prefers dataSourceMerges on linked table", () => {
    const block = {
      type: BLOCK_TYPES.LINKED_TABLE,
      content: {
        dataSourceRows: [["a"]],
        dataSourceMerges: [{ r: 0, c: 0, rowspan: 1, colspan: 2 }],
        merges: [{ r: 0, c: 0, rowspan: 1, colspan: 1 }],
      },
    };
    expect(getTableDataMerges(block)).toEqual([{ r: 0, c: 0, rowspan: 1, colspan: 2 }]);
  });

  it("getTableRowsForStyleGrid returns data rows", () => {
    const block = {
      type: BLOCK_TYPES.LINKED_TABLE,
      content: { dataSourceRows: [["z"]] },
    };
    expect(getTableRowsForStyleGrid(block)).toEqual([["z"]]);
  });

  it("getTableStructureMerges returns empty for invalid plain merges", () => {
    expect(
      getTableStructureMerges({
        type: BLOCK_TYPES.TABLE,
        content: { rows: [["a"]], merges: null as unknown as [] },
      }),
    ).toEqual([]);
  });

  it("getTableStructureMerges reads merges on plain table", () => {
    const block = {
      type: BLOCK_TYPES.TABLE,
      content: { rows: [["a"]], merges: [{ r: 0, c: 0, rowspan: 1, colspan: 1 }] },
    };
    expect(getTableStructureMerges(block)).toEqual([{ r: 0, c: 0, rowspan: 1, colspan: 1 }]);
  });
});
