import { describe, expect, it } from "vitest";
import {
  appendBorderCssParts,
  cellStyleToEditorCssString,
  clearPrintBorderSides,
  printBorderToInsetShadow,
} from "./excelTableCellCss";

describe("excelTableCellCss", () => {
  it("cellStyleToEditorCssString renders print borders as inset box-shadow", () => {
    expect(printBorderToInsetShadow("1px solid #000", "top")).toBe("inset 0 1px 0 0 #000");
    expect(printBorderToInsetShadow("2px solid #abc", "left")).toBe("inset 2px 0 0 0 #abc");
    expect(printBorderToInsetShadow("1px solid #000", "bottom")).toBe("inset 0 -1px 0 0 #000");
    expect(printBorderToInsetShadow("1px solid #000", "right")).toBe("inset -1px 0 0 0 #000");
    expect(printBorderToInsetShadow("none", "top")).toBeNull();
    expect(printBorderToInsetShadow("invalid", "top")).toBeNull();

    const css = cellStyleToEditorCssString({
      color: "#111",
      borderTop: "1px solid #000",
      borderLeft: "1px solid #333",
      borderBottom: "1px solid #444",
      borderRight: "1px solid #555",
    });
    expect(css).toContain("color:#111");
    expect(css).toContain("box-shadow:");
    expect(css).not.toContain("border-top:");
  });

  it("appendBorderCssParts and clearPrintBorderSides handle print borders", () => {
    const parts: string[] = [];
    appendBorderCssParts(parts, {
      borderTop: "none",
      borderRight: "1px solid #111",
      borderBottom: "1px solid #222",
      borderLeft: "1px solid #333",
    });
    expect(parts).toEqual([
      "border-right:1px solid #111",
      "border-bottom:1px solid #222",
      "border-left:1px solid #333",
    ]);
    expect(clearPrintBorderSides({ color: "#000", borderTop: "1px solid #000" })).toEqual({
      color: "#000",
    });

    expect(
      cellStyleToEditorCssString({
        borderTop: "1px solid",
        borderRight: "1px solid",
        borderBottom: "1px solid",
        borderLeft: "1px solid",
      }),
    ).toBe("");

    expect(
      cellStyleToEditorCssString({
        borderTop: "1px solid #111",
        borderRight: "1px solid",
        borderBottom: "1px solid",
        borderLeft: "1px solid",
      }),
    ).toContain("box-shadow:inset 0 1px 0 0 #111");
  });
});
