import { describe, expect, it } from "vitest";
import { normalizeGridSize, snapPoint, snapRect, snapValue } from "./grid.js";

describe("grid utils", () => {
  it("normalizes grid size", () => {
    expect(normalizeGridSize(10)).toBe(10);
    expect(normalizeGridSize(0, 8)).toBe(8);
    expect(normalizeGridSize(undefined, 6)).toBe(6);
  });

  it("snaps values and points", () => {
    expect(snapValue(13, 10)).toBe(10);
    expect(snapValue(17, 10)).toBe(20);

    const point = snapPoint({ x: 13, y: 17 }, 10);
    expect(point).toEqual({ x: 10, y: 20 });
  });

  it("respects snap disabled", () => {
    const point = snapPoint({ x: 13, y: 17 }, 10, false);
    expect(point).toEqual({ x: 13, y: 17 });

    const rect = snapRect({ x: 5, y: 12, width: 19, height: 28 }, 10, false);
    expect(rect).toEqual({ x: 5, y: 12, width: 19, height: 28 });
  });

  it("snaps rectangles", () => {
    const rect = snapRect({ x: 5, y: 12, width: 19, height: 28 }, 10, true);
    expect(rect).toEqual({ x: 10, y: 10, width: 20, height: 30 });
  });

  it("handles missing input", () => {
    expect(snapPoint(undefined, 10)).toEqual({ x: 0, y: 0 });
    expect(snapRect(undefined, 10)).toEqual({ x: 0, y: 0, width: 0, height: 0 });
  });
});
