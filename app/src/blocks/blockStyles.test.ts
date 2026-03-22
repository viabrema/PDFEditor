import { describe, expect, it } from "vitest";
import { BLOCK_TYPES } from "./blockModel";
import { getBlockDefaultStyle, getBlockTextStyle } from "./blockStyles";

describe("blockStyles", () => {
  it("uses title and subtitle defaults", () => {
    expect(getBlockDefaultStyle(BLOCK_TYPES.TITLE)).toEqual({
      fontSize: "26px",
      fontWeight: "700",
      color: "#008737",
    });
    expect(getBlockDefaultStyle(BLOCK_TYPES.SUBTITLE)).toEqual({
      fontSize: "22px",
      fontWeight: "700",
      color: "#1f2937",
    });

    const titleStyle = getBlockTextStyle({ type: BLOCK_TYPES.TITLE, metadata: {} });
    const subtitleStyle = getBlockTextStyle({ type: BLOCK_TYPES.SUBTITLE, metadata: {} });

    expect(titleStyle.fontSize).toBe("26px");
    expect(subtitleStyle.fontSize).toBe("22px");
  });

  it("resolves heading level style", () => {
    const style = getBlockTextStyle({
      type: BLOCK_TYPES.HEADING,
      metadata: { headingLevel: 3 },
    });

    expect(style.fontSize).toBe("18px");
    expect(style.fontWeight).toBe("400");
  });
});
