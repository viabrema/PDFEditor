import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { Window } from "happy-dom";
import { createToolbar } from "./toolbar.js";

describe("toolbar", () => {
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

  it("renders buttons", () => {
    let clicked = 0;
    const toolbar = createToolbar(
      {
        toggleBold: () => {
          clicked += 1;
        },
        toggleItalic: () => {
          clicked += 1;
        },
        toggleBulletList: () => {
          clicked += 1;
        },
        toggleOrderedList: () => {
          clicked += 1;
        },
      },
      {
        onAlignChange: () => {
          clicked += 1;
        },
        onFontFamilyChange: () => {
          clicked += 1;
        },
        onFontSizeChange: () => {
          clicked += 1;
        },
      }
    );

    expect(toolbar.querySelectorAll("button")).toHaveLength(7);
    expect(toolbar.querySelectorAll("select")).toHaveLength(2);

    toolbar.querySelectorAll("button").forEach((button) => {
      button.click();
    });

    const selects = toolbar.querySelectorAll("select");
    const fontSelect = selects[0];
    const sizeSelect = selects[1];

    fontSelect.dispatchEvent(new window.Event("change"));
    sizeSelect.dispatchEvent(new window.Event("change"));

    expect(clicked).toBe(9);
  });

  it("renders disabled toolbar", () => {
    const toolbar = createToolbar(null, { disabled: true });
    const buttons = toolbar.querySelectorAll("button");
    const selects = toolbar.querySelectorAll("select");

    expect(buttons).toHaveLength(7);
    expect(selects).toHaveLength(2);
    buttons.forEach((button) => {
      expect(button.disabled).toBe(true);
    });
    selects.forEach((select) => {
      expect(select.disabled).toBe(true);
    });
  });
});
