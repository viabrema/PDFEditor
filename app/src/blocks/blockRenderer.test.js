import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { Window } from "happy-dom";
import { createBlockElement } from "./blockRenderer.js";

describe("block renderer", () => {
  let window;
  let originalWindow;
  let originalDocument;

  beforeEach(() => {
    originalWindow = globalThis.window;
    originalDocument = globalThis.document;
    window = new Window();
    globalThis.window = window;
    globalThis.document = window.document;
  });

  afterEach(() => {
    globalThis.window = originalWindow;
    globalThis.document = originalDocument;
  });

  it("creates block element", () => {
    const block = {
      id: "block-1",
      position: { x: 10, y: 20 },
      size: { width: 200, height: 100 },
    };

    const { element, editorHost } = createBlockElement(block);

    expect(element.dataset.blockId).toBe("block-1");
    expect(editorHost).toBeInstanceOf(window.HTMLElement);
    expect(editorHost.className).toContain("prose-editor");
  });
});
