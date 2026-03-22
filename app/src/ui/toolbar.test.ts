import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { Window } from "happy-dom";
import { createToolbar } from "./toolbar";

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

  it("renders text toolbar", () => {
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
        variant: "text",
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

  it("renders heading toolbar", () => {
    let clicked = 0;
    const toolbar = createToolbar(
      {
        toggleBold: () => {
          clicked += 1;
        },
        toggleItalic: () => {
          clicked += 1;
        },
      },
      {
        variant: "heading",
        onAlignChange: () => {
          clicked += 1;
        },
        onFontFamilyChange: () => {
          clicked += 1;
        },
        onHeadingLevelChange: () => {
          clicked += 1;
        },
      }
    );

    expect(toolbar.querySelectorAll("button")).toHaveLength(5);
    expect(toolbar.querySelectorAll("select")).toHaveLength(2);

    toolbar.querySelectorAll("button").forEach((button) => {
      button.click();
    });

    const selects = toolbar.querySelectorAll("select");
    const levelSelect = selects[0];
    const fontSelect = selects[1];

    levelSelect.dispatchEvent(new window.Event("change"));
    fontSelect.dispatchEvent(new window.Event("change"));

    expect(clicked).toBe(7);
  });

  it("renders linked table toolbar without excel button when hook is missing", () => {
    const toolbar = createToolbar(null, {
      variant: "linkedTable",
      fontScaleValue: 1,
      onFontScaleChange: () => {},
    });
    expect(toolbar.querySelectorAll("button").length).toBe(0);
  });

  it("renders linked table toolbar with scale slider and excel button", () => {
    let scale = 0;
    let excel = 0;
    const toolbar = createToolbar(null, {
      variant: "linkedTable",
      fontScaleValue: 1,
      onFontScaleChange: (v: number) => {
        scale = v;
      },
      onLinkedTableExcelConfigure: () => {
        excel += 1;
      },
    });

    expect(toolbar.querySelector('input[type="range"]')).toBeTruthy();
    const range = toolbar.querySelector('input[type="range"]') as HTMLInputElement;
    range.value = "1.5";
    range.dispatchEvent(new window.Event("input", { bubbles: true }));
    expect(scale).toBe(1.5);

    const btn = toolbar.querySelector("button");
    expect(btn).toBeTruthy();
    btn?.click();
    expect(excel).toBe(1);
  });

  it("renders linked chart toolbar with scale, excel and design buttons", () => {
    let scale = 0;
    let excel = 0;
    let design = 0;
    const toolbar = createToolbar(null, {
      variant: "linkedChart",
      fontScaleValue: 1,
      onFontScaleChange: (v: number) => {
        scale = v;
      },
      onLinkedChartExcelConfigure: () => {
        excel += 1;
      },
      onLinkedChartDesignConfigure: () => {
        design += 1;
      },
    });

    const range = toolbar.querySelector('input[type="range"]') as HTMLInputElement;
    range.value = "1.25";
    range.dispatchEvent(new window.Event("input", { bubbles: true }));
    expect(scale).toBe(1.25);

    const buttons = toolbar.querySelectorAll("button");
    expect(buttons.length).toBe(2);
    buttons[0].click();
    buttons[1].click();
    expect(excel).toBe(1);
    expect(design).toBe(1);
  });

  it("renders disabled toolbar", () => {
    const toolbar = createToolbar(null, { disabled: true, variant: "heading" });
    const buttons = toolbar.querySelectorAll("button");
    const selects = toolbar.querySelectorAll("select");

    expect(buttons).toHaveLength(5);
    expect(selects).toHaveLength(2);
    buttons.forEach((button) => {
      expect(button.disabled).toBe(true);
    });
    selects.forEach((select) => {
      expect(select.disabled).toBe(true);
    });
  });
});
