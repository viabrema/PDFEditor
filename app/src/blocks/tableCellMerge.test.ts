import { describe, expect, it } from "vitest";
import { BLOCK_TYPES } from "./blockModel";
import {
  getStructureMerges,
  mergeCellsInBlock,
  mergeStateForSelection,
  selectionBoundsFromEdit,
  setStructureMerges,
  unmergeCellsInBlock,
} from "./tableCellMerge";

describe("tableCellMerge", () => {
  it("mergeStateForSelection returns false when edit is missing", () => {
    expect(mergeStateForSelection(null, [], 2, 2)).toEqual({
      canMerge: false,
      canUnmerge: false,
    });
  });

  it("getStructureMerges ignores non-array merges", () => {
    expect(getStructureMerges({ content: { merges: "x" as unknown as [] } })).toEqual([]);
  });

  it("selectionBoundsFromEdit returns null for row scope", () => {
    expect(
      selectionBoundsFromEdit({ scope: "row", row: 0, col: 0, typing: false }),
    ).toBeNull();
  });

  it("selectionBoundsFromEdit uses multi cells", () => {
    expect(
      selectionBoundsFromEdit({
        scope: "cell",
        row: 1,
        col: 1,
        typing: false,
        multi: { cells: [{ row: 0, col: 0 }, { row: 1, col: 2 }] },
      }),
    ).toEqual({ row0: 0, col0: 0, row1: 1, col1: 2 });
  });

  it("mergeStateForSelection disables merge for single cell without merge", () => {
    expect(
      mergeStateForSelection(
        { scope: "cell", row: 0, col: 0, typing: false },
        [],
        3,
        3,
      ),
    ).toEqual({ canMerge: false, canUnmerge: false });
  });

  it("mergeStateForSelection enables merge for rectangle", () => {
    expect(
      mergeStateForSelection(
        {
          scope: "cell",
          row: 0,
          col: 0,
          typing: false,
          multi: {
            cells: [
              { row: 0, col: 0 },
              { row: 0, col: 1 },
            ],
          },
        },
        [],
        2,
        2,
      ),
    ).toEqual({ canMerge: true, canUnmerge: false });
  });

  it("mergeStateForSelection enables unmerge when merged cell selected", () => {
    expect(
      mergeStateForSelection(
        { scope: "cell", row: 0, col: 0, typing: false },
        [{ r: 0, c: 0, rowspan: 1, colspan: 2 }],
        2,
        2,
      ),
    ).toEqual({ canMerge: false, canUnmerge: true });
  });

  it("merges plain table cells and consolidates text", () => {
    const block = {
      type: BLOCK_TYPES.TABLE,
      content: {
        rows: [
          ["A", "B"],
          ["C", "D"],
        ],
        merges: [],
      },
    };
    const next = mergeCellsInBlock(block, {
      scope: "cell",
      row: 0,
      col: 0,
      typing: false,
      multi: {
        cells: [
          { row: 0, col: 0 },
          { row: 0, col: 1 },
        ],
      },
    });
    expect(next?.row).toBe(0);
    expect(next?.col).toBe(0);
    expect(getStructureMerges(block)).toEqual([{ r: 0, c: 0, rowspan: 1, colspan: 2 }]);
    expect(block.content.rows[0][0]).toBe("A");
    expect(block.content.rows[0][1]).toBe("");
  });

  it("merges linked table visual merges only", () => {
    const block = {
      type: BLOCK_TYPES.LINKED_TABLE,
      content: {
        dataSourceRows: [
          ["1", "2"],
          ["3", "4"],
        ],
        dataSourceMerges: [{ r: 0, c: 0, rowspan: 2, colspan: 2 }],
        merges: [],
      },
    };
    mergeCellsInBlock(block, {
      scope: "cell",
      row: 0,
      col: 0,
      typing: false,
      multi: {
        cells: [
          { row: 0, col: 0 },
          { row: 1, col: 1 },
        ],
      },
    });
    expect(block.content.merges).toEqual([{ r: 0, c: 0, rowspan: 2, colspan: 2 }]);
    expect(block.content.dataSourceMerges).toEqual([{ r: 0, c: 0, rowspan: 2, colspan: 2 }]);
  });

  it("unmerge removes overlapping merges", () => {
    const block = {
      type: BLOCK_TYPES.TABLE,
      content: {
        rows: [["x", ""], ["", ""]],
        merges: [{ r: 0, c: 0, rowspan: 2, colspan: 2 }],
      },
    };
    const next = unmergeCellsInBlock(block, { scope: "cell", row: 0, col: 0, typing: false });
    expect(next?.scope).toBe("cell");
    expect(getStructureMerges(block)).toEqual([]);
  });

  it("mergeCellsInBlock returns null for invalid selection", () => {
    const block = { type: BLOCK_TYPES.TABLE, content: { rows: [["a"]], merges: [] } };
    expect(
      mergeCellsInBlock(block, { scope: "cell", row: 0, col: 0, typing: false }),
    ).toBeNull();
  });

  it("setStructureMerges creates content when missing", () => {
    const block: { content?: { merges?: unknown[] } } = {};
    setStructureMerges(block, [{ r: 0, c: 0, rowspan: 1, colspan: 1 }]);
    expect(block.content?.merges).toEqual([{ r: 0, c: 0, rowspan: 1, colspan: 1 }]);
  });

  it("merge creates missing row arrays in plain table", () => {
    const block = {
      type: BLOCK_TYPES.TABLE,
      content: { rows: [] as string[][], merges: [] },
    };
    mergeCellsInBlock(block, {
      scope: "cell",
      row: 0,
      col: 0,
      typing: false,
      multi: {
        cells: [
          { row: 0, col: 0 },
          { row: 1, col: 1 },
        ],
      },
    });
    expect(block.content.rows[0][0]).toBe("");
    expect(block.content.rows[1][1]).toBe("");
  });

  it("unmergeCellsInBlock returns null when selection is not cells", () => {
    const block = { type: BLOCK_TYPES.TABLE, content: { merges: [{ r: 0, c: 0, rowspan: 2, colspan: 1 }] } };
    expect(
      unmergeCellsInBlock(block, { scope: "row", row: 0, col: 0, typing: false }),
    ).toBeNull();
  });

  it("merge replaces merges that overlap the selection", () => {
    const block = {
      type: BLOCK_TYPES.TABLE,
      content: {
        rows: [
          ["a", "b", "c"],
          ["d", "e", "f"],
        ],
        merges: [{ r: 0, c: 0, rowspan: 1, colspan: 2 }],
      },
    };
    mergeCellsInBlock(block, {
      scope: "cell",
      row: 0,
      col: 0,
      typing: false,
      multi: {
        cells: [
          { row: 0, col: 0 },
          { row: 1, col: 1 },
        ],
      },
    });
    expect(getStructureMerges(block)).toEqual([{ r: 0, c: 0, rowspan: 2, colspan: 2 }]);
  });

  it("unmergeCellsInBlock returns null when no merge overlaps", () => {
    const block = {
      type: BLOCK_TYPES.TABLE,
      content: { rows: [["a"]], merges: [] },
    };
    expect(
      unmergeCellsInBlock(block, { scope: "cell", row: 0, col: 0, typing: false }),
    ).toBeNull();
  });

  it("mergeStateForSelection rejects out-of-range selection", () => {
    expect(
      mergeStateForSelection(
        { scope: "cell", row: 9, col: 9, typing: false },
        [],
        2,
        2,
      ),
    ).toEqual({ canMerge: false, canUnmerge: false });
  });

  it("selectionBoundsFromEdit uses single cell coords", () => {
    expect(
      selectionBoundsFromEdit({ scope: "cell", row: 2, col: 3, typing: false }),
    ).toEqual({ row0: 2, col0: 3, row1: 2, col1: 3 });
  });

  it("applyPlainTableRowMerge picks first non-empty cell", () => {
    const block = {
      type: BLOCK_TYPES.TABLE,
      content: {
        rows: [
          ["", "B"],
          ["", ""],
        ],
        merges: [],
      },
    };
    mergeCellsInBlock(block, {
      scope: "cell",
      row: 0,
      col: 0,
      typing: false,
      multi: {
        cells: [
          { row: 0, col: 0 },
          { row: 1, col: 1 },
        ],
      },
    });
    expect(block.content.rows[0][0]).toBe("B");
  });
});
