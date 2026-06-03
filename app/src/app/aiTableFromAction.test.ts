import { describe, expect, it } from "vitest";
import {
  aiCellText,
  applyTableUpdateFromAiAction,
  parseStructuredAiTableRows,
  pickAiCellStyle,
} from "./aiTableFromAction";

describe("aiTableFromAction", () => {
  it("extracts text and styles from structured rows", () => {
    const parsed = parseStructuredAiTableRows([
      {
        row: 0,
        cells: [
          { text: "A", backgroundColor: "#FF0000" },
          { text: "B", backgroundColor: "#FF0000" },
        ],
      },
    ]);
    expect(parsed?.hasStyleChanges).toBe(true);
    expect(parsed?.cellStyles["0,0"]?.backgroundColor).toBe("#FF0000");
    expect(parsed?.rows?.[0]).toEqual(["A", "B"]);
  });

  it("applies row background via tableFormat without rewriting data", () => {
    const block = {
      type: "table",
      content: {
        rows: [
          ["H1", "H2"],
          ["a", "b"],
        ],
        cellStyles: {},
        rowStyles: {},
        colStyles: {},
      },
    };
    const ok = applyTableUpdateFromAiAction(block, {
      tableFormat: { scope: "row", row: 0, style: { backgroundColor: "#FF0000" } },
    });
    expect(ok).toBe(true);
    expect(block.content.rowStyles?.["0"]?.backgroundColor).toBe("#FF0000");
    expect(block.content.rows[0][0]).toBe("H1");
  });

  it("applies structured tableRows styles on linkedTable without changing dataSourceRows", () => {
    const block = {
      type: "linkedTable",
      content: {
        dataSourceRows: [
          ["x", "y"],
          ["1", "2"],
        ],
        cellStyles: {},
        rowStyles: {},
        colStyles: {},
      },
    };
    const ok = applyTableUpdateFromAiAction(block, {
      tableRows: [
        {
          row: 0,
          cells: [{ text: "x", backgroundColor: "#f00" }, { text: "y", backgroundColor: "#f00" }],
        },
      ],
    });
    expect(ok).toBe(true);
    expect(block.content.dataSourceRows[0][0]).toBe("x");
    expect(block.content.cellStyles?.["0,0"]?.backgroundColor).toBe("#f00");
  });

  it("deletes first data row on linkedTable via deleteRows", () => {
    const block = {
      type: "linkedTable",
      content: {
        dataSourceRows: [
          ["title", "a"],
          ["1", "2"],
        ],
        cellStyles: { "1,0": { color: "#111" } },
        rowStyles: { "0": { backgroundColor: "#eee" } },
        colStyles: {},
      },
    };
    const ok = applyTableUpdateFromAiAction(block, { deleteRows: [0] });
    expect(ok).toBe(true);
    expect(block.content.dataSourceRows).toEqual([["1", "2"]]);
    expect(block.content.cellStyles?.["0,0"]?.color).toBe("#111");
    expect(block.content.rowStyles?.["0"]).toBeUndefined();
  });

  it("replaces linkedTable data when tableRows matrix omits rows (no visual fields)", () => {
    const block = {
      type: "linkedTable",
      content: {
        dataSourceRows: [
          ["title", "a"],
          ["1", "2"],
          ["3", "4"],
        ],
        cellStyles: {},
        rowStyles: {},
        colStyles: {},
      },
    };
    const ok = applyTableUpdateFromAiAction(block, {
      tableRows: [
        ["1", "2"],
        ["3", "4"],
      ],
    });
    expect(ok).toBe(true);
    expect(block.content.dataSourceRows).toEqual([
      ["1", "2"],
      ["3", "4"],
    ]);
  });

  it("aiCellText and pickAiCellStyle handle primitives", () => {
    expect(aiCellText("ok")).toBe("ok");
    expect(pickAiCellStyle({ backgroundColor: "#000" })?.backgroundColor).toBe("#000");
    expect(pickAiCellStyle(null)).toBe(null);
  });
});
