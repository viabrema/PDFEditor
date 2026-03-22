import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { Window } from "happy-dom";
import { createBlockElement } from "./blockRenderer";

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

    const { element, editorHost } = createBlockElement(block, {
      selected: true,
      editing: true,
    });

    expect(element.dataset.blockId).toBe("block-1");
    expect(editorHost).toBeInstanceOf(window.HTMLElement);
    expect(editorHost.className).toContain("prose-editor");
    expect(element.className).toContain("is-selected");
    expect(element.className).toContain("is-editing");
  });

  it("creates image block", () => {
    const block = {
      id: "block-2",
      type: "image",
      content: { src: "data:image/png;base64,abc" },
      position: { x: 0, y: 0 },
      size: { width: 200, height: 100 },
    };

    const { element, editorHost } = createBlockElement(block);

    expect(editorHost).toBeNull();
    expect(element.querySelector("img").src).toContain("data:image/png");
  });

  it("creates image block without src", () => {
    const block = {
      id: "block-3",
      type: "image",
      position: { x: 0, y: 0 },
      size: { width: 200, height: 100 },
    };

    const { element } = createBlockElement(block);
    const img = element.querySelector("img");

    expect(img.getAttribute("src")).toBe("");
  });

  it("creates table block", () => {
    const block = {
      id: "block-4",
      type: "table",
      content: { rows: [["A", "B"]] },
      position: { x: 0, y: 0 },
      size: { width: 200, height: 100 },
    };

    const { element, editorHost } = createBlockElement(block);

    expect(editorHost).toBeNull();
    expect(element.querySelector("table")).toBeTruthy();
  });

  it("applies text block styles", () => {
    const block = {
      id: "block-5",
      type: "text",
      position: { x: 0, y: 0 },
      size: { width: 200, height: 100 },
      metadata: { align: "center", fontFamily: "Georgia", fontSize: "20px" },
    };

    const { element, editorHost } = createBlockElement(block);

    expect(element.className).toContain("text-block");
    expect(editorHost.style.textAlign).toBe("center");
    expect(editorHost.style.fontFamily).toBe("Georgia");
    expect(editorHost.style.fontSize).toBe("20px");
  });

  it("applies heading class", () => {
    const headingBlock = {
      id: "block-6",
      type: "heading",
      position: { x: 0, y: 0 },
      size: { width: 200, height: 100 },
    };

    const { element: headingElement } = createBlockElement(headingBlock);

    expect(headingElement.className).toContain("heading-block");
  });
});
