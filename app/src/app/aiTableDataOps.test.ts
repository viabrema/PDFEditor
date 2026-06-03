import { describe, expect, it } from "vitest";
import {
  adjustMergesAfterRowDeletes,
  deleteTableRowsFromBlock,
  parseDeleteRowIndices,
  remapCellStyleMapAfterRowDeletes,
} from "./aiTableDataOps";

describe("aiTableDataOps", () => {
  it("parseDeleteRowIndices dedupes and sorts descending", () => {
    expect(parseDeleteRowIndices({ deleteRows: [0, 0, 2] })).toEqual([2, 0]);
  });

  it("remaps cell styles after row delete", () => {
    const next = remapCellStyleMapAfterRowDeletes({ "1,0": { color: "#111" } }, [0]);
    expect(next["0,0"]?.color).toBe("#111");
  });

  it("adjustMergesAfterRowDeletes drops merges on deleted row", () => {
    const out = adjustMergesAfterRowDeletes([{ r: 0, c: 0, rowspan: 1, colspan: 2 }], [0]);
    expect(out).toEqual([]);
  });
});
