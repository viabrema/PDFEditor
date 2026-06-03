import { describe, expect, it } from "vitest";
import {
  getPropertiesPanelBlock,
  propertiesPanelMode,
} from "./propertiesPanelBlock";

describe("propertiesPanelBlock", () => {
  const blocks = [
    { id: "a", type: "text" },
    { id: "b", type: "table" },
  ];

  it("prefers single selection over editing block", () => {
    const state = { editingBlockId: "b", selectedBlockIds: ["a"] };
    expect(getPropertiesPanelBlock(state, blocks)?.id).toBe("a");
    expect(propertiesPanelMode(state, blocks)).toBe("block");
  });

  it("uses single selection when not editing", () => {
    const state = { editingBlockId: null, selectedBlockIds: ["a"] };
    expect(getPropertiesPanelBlock(state, blocks)?.id).toBe("a");
  });

  it("returns page mode when nothing selected", () => {
    const state = { editingBlockId: null, selectedBlockIds: [] };
    expect(getPropertiesPanelBlock(state, blocks)).toBeNull();
    expect(propertiesPanelMode(state, blocks)).toBe("page");
  });

  it("returns multi mode for several selections", () => {
    const state = { editingBlockId: null, selectedBlockIds: ["a", "b"] };
    expect(propertiesPanelMode(state, blocks)).toBe("multi");
  });
});
