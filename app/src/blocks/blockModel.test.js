import { describe, expect, it } from "vitest";
import { BLOCK_TYPES, createBlock } from "./blockModel.js";

describe("blockModel", () => {
  it("creates a default block", () => {
    const block = createBlock({ id: "block-1" });

    expect(block.type).toBe(BLOCK_TYPES.TEXT);
    expect(block.position).toEqual({ x: 0, y: 0 });
    expect(block.size).toEqual({ width: 240, height: 120 });
  });

  it("accepts custom properties", () => {
    const block = createBlock({
      id: "block-2",
      type: BLOCK_TYPES.IMAGE,
      position: { x: 10, y: 20 },
      size: { width: 300, height: 200 },
      pageId: "page-1",
      languageId: "lang-1",
    });

    expect(block.type).toBe(BLOCK_TYPES.IMAGE);
    expect(block.position).toEqual({ x: 10, y: 20 });
    expect(block.size).toEqual({ width: 300, height: 200 });
    expect(block.pageId).toBe("page-1");
    expect(block.languageId).toBe("lang-1");
  });
});
