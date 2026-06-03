import { describe, expect, it } from "vitest";
import {
  applyBorderPresetToCells,
  borderPatchForCellInPreset,
  selectionBounds,
  selectionCellCoords,
} from "./tableBorderPresets";

describe("tableBorderPresets", () => {
  const grid = [
    ["a", "b"],
    ["c", "d"],
  ];

  it("selectionCellCoords expands multi cell rectangle", () => {
    const cells = selectionCellCoords(
      {
        scope: "cell",
        row: 0,
        col: 0,
        multi: { cells: [{ row: 0, col: 0 }, { row: 1, col: 1 }] },
      },
      grid,
    );
    expect(cells).toHaveLength(2);
    expect(selectionBounds(cells)).toEqual({ rMin: 0, rMax: 1, cMin: 0, cMax: 1 });
  });

  it("selectionCellCoords expands row and column selections", () => {
    const rowCells = selectionCellCoords(
      { scope: "row", row: 0, col: 0, multi: { rows: [0] } },
      grid,
    );
    expect(rowCells).toEqual([
      { row: 0, col: 0 },
      { row: 0, col: 1 },
    ]);

    const colCells = selectionCellCoords(
      { scope: "col", row: 0, col: 1, multi: { cols: [1] } },
      grid,
    );
    expect(colCells).toEqual([
      { row: 0, col: 1 },
      { row: 1, col: 1 },
    ]);
  });

  it("selectionCellCoords falls back to scope coords and default focus", () => {
    expect(selectionCellCoords(null, grid)).toEqual([{ row: 0, col: 0 }]);
    expect(
      selectionCellCoords({ scope: "col", row: 0, col: 0 }, grid),
    ).toEqual([
      { row: 0, col: 0 },
      { row: 1, col: 0 },
    ]);
    expect(
      selectionCellCoords(
        { scope: "row", row: 1, col: 0, multi: { rows: [99] } },
        grid,
      ),
    ).toEqual([]);
    expect(
      selectionCellCoords(
        { scope: "row", row: 0, col: 0, multi: { rows: [0, 99] } },
        grid,
      ),
    ).toEqual([
      { row: 0, col: 0 },
      { row: 0, col: 1 },
    ]);
    expect(
      selectionCellCoords(
        { scope: "col", row: 0, col: 0, multi: { cols: [99] } },
        grid,
      ),
    ).toEqual([]);
  });

  it("outside preset applies only outer edges", () => {
    const bounds = { rMin: 0, rMax: 1, cMin: 0, cMax: 1 };
    expect(borderPatchForCellInPreset("outside", 0, 0, bounds, "1px solid #000")).toEqual({
      borderTop: "1px solid #000",
      borderLeft: "1px solid #000",
    });
    expect(borderPatchForCellInPreset("outside", 1, 1, bounds, "1px solid #000")).toEqual({
      borderBottom: "1px solid #000",
      borderRight: "1px solid #000",
    });
    expect(borderPatchForCellInPreset("outside", 0, 1, bounds, "1px solid #000")).toEqual({
      borderTop: "1px solid #000",
      borderRight: "1px solid #000",
    });
    expect(borderPatchForCellInPreset("outside", 1, 0, bounds, "1px solid #000")).toEqual({
      borderBottom: "1px solid #000",
      borderLeft: "1px solid #000",
    });
  });

  it("single-side presets apply only on matching edge", () => {
    const bounds = { rMin: 0, rMax: 1, cMin: 0, cMax: 1 };
    expect(borderPatchForCellInPreset("top", 0, 0, bounds, "1px solid #000")).toEqual({
      borderTop: "1px solid #000",
    });
    expect(borderPatchForCellInPreset("top", 1, 0, bounds, "1px solid #000")).toEqual({});
    expect(borderPatchForCellInPreset("bottom", 1, 0, bounds, "1px solid #000")).toEqual({
      borderBottom: "1px solid #000",
    });
    expect(borderPatchForCellInPreset("left", 0, 0, bounds, "1px solid #000")).toEqual({
      borderLeft: "1px solid #000",
    });
    expect(borderPatchForCellInPreset("right", 0, 1, bounds, "1px solid #000")).toEqual({
      borderRight: "1px solid #000",
    });
  });

  it("all preset applies borders on every side", () => {
    const patch = borderPatchForCellInPreset(
      "all",
      1,
      1,
      { rMin: 0, rMax: 2, cMin: 0, cMax: 2 },
      "1px solid #111",
    );
    expect(patch).toEqual({
      borderTop: "1px solid #111",
      borderRight: "1px solid #111",
      borderBottom: "1px solid #111",
      borderLeft: "1px solid #111",
    });
  });

  it("applyBorderPresetToCells writes per-cell styles", () => {
    const content = { rows: [["a", "b"], ["c", "d"]], cellStyles: {} as Record<string, unknown> };
    applyBorderPresetToCells(
      content,
      [
        { row: 0, col: 0 },
        { row: 0, col: 1 },
        { row: 1, col: 0 },
        { row: 1, col: 1 },
      ],
      "all",
      "1px solid #222",
    );
    expect(content.cellStyles?.["0,0"]).toMatchObject({ borderTop: "1px solid #222" });
    expect(content.cellStyles?.["1,1"]).toMatchObject({ borderBottom: "1px solid #222" });
  });

  it("applyBorderPresetToCells initializes cellStyles and skips empty patches", () => {
    const content = { rows: [["a", "b"]] } as { rows: string[][]; cellStyles?: Record<string, unknown> };
    applyBorderPresetToCells(content, [], "all");
    expect(content.cellStyles).toBeUndefined();

    applyBorderPresetToCells(content, [{ row: 0, col: 0 }], "top", "1px solid #333");
    expect(content.cellStyles?.["0,0"]).toMatchObject({ borderTop: "1px solid #333" });

    applyBorderPresetToCells(
      content,
      [
        { row: 0, col: 0 },
        { row: 0, col: 1 },
      ],
      "left",
      "1px solid #444",
    );
    expect(content.cellStyles?.["0,1"]).toBeUndefined();
    expect(content.cellStyles?.["0,0"]).toMatchObject({ borderLeft: "1px solid #444" });
  });

  it("none preset removes print borders and keeps other styles", () => {
    const content = {
      rows: [["a"]],
      cellStyles: { "0,0": { borderTop: "1px solid #000", color: "#111" } },
    };
    applyBorderPresetToCells(content, [{ row: 0, col: 0 }], "none");
    expect(content.cellStyles?.["0,0"]).toEqual({ color: "#111" });
  });

  it("none preset deletes empty cell style entries and skips missing styles", () => {
    const content = {
      rows: [["a"]],
      cellStyles: { "0,0": { borderTop: "1px solid #000" } },
    };
    applyBorderPresetToCells(content, [{ row: 0, col: 0 }], "none");
    expect(content.cellStyles).toBeUndefined();

    const untouched = { rows: [["a"]] } as { rows: string[][]; cellStyles?: Record<string, unknown> };
    applyBorderPresetToCells(untouched, [{ row: 0, col: 0 }], "none");
    expect(untouched.cellStyles).toBeUndefined();

    const mixed = {
      rows: [["a", "b"]],
      cellStyles: { "0,1": { borderTop: "1px solid #000" } },
    };
    applyBorderPresetToCells(
      mixed,
      [
        { row: 0, col: 0 },
        { row: 0, col: 1 },
      ],
      "none",
    );
    expect(mixed.cellStyles).toBeUndefined();
  });

  it("borderPatchForCellInPreset returns empty patch for none", () => {
    expect(
      borderPatchForCellInPreset("none", 0, 0, { rMin: 0, rMax: 0, cMin: 0, cMax: 0 }, "1px solid #000"),
    ).toEqual({});
  });
});
