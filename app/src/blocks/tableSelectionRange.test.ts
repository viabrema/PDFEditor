import { describe, expect, it } from "vitest";
import { rectCellCoords, toggleInList } from "./tableSelectionRange";

describe("tableSelectionRange", () => {
  it("toggleInList adds and removes values", () => {
    expect(toggleInList([0], 1)).toEqual([0, 1]);
    expect(toggleInList([0, 1], 0)).toEqual([1]);
  });

  it("rectCellCoords builds inclusive ranges", () => {
    expect(rectCellCoords(1, 1, 0, 0)).toHaveLength(4);
  });
});
