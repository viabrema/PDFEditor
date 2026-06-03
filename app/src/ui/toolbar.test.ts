import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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

  it("renders linked table sidebar toolbar with labels and compact actions", () => {
    const window = new Window();
    globalThis.document = window.document;
    const toolbar = createToolbar(null, {
      variant: "linkedTable",
      layout: "sidebar",
      fontScaleValue: 1,
      onFontScaleChange: () => {},
      onLinkedTableDataSource: () => {},
    });
    expect(toolbar.className).toContain("context-toolbar");
    expect(toolbar.textContent).toContain("Escala da fonte");
    expect(toolbar.querySelector(".context-toolbar__actions")).toBeTruthy();
  });

  it("renders hidden toggle on linked chart without action separator", () => {
    const window = new Window();
    globalThis.document = window.document;
    const toolbar = createToolbar(null, {
      variant: "linkedChart",
      onToggleHidden: vi.fn(),
      hiddenValue: true,
    });
    expect(toolbar.querySelector('[data-action="toggle-hidden"]')).toBeTruthy();
    expect(toolbar.querySelector(".context-toolbar__actions span[aria-hidden]")).toBeFalsy();
  });

  it("renders hidden toggle on linked table toolbar with separator", () => {
    const window = new Window();
    globalThis.document = window.document;
    const onToggleHidden = vi.fn();
    const toolbar = createToolbar(null, {
      variant: "linkedTable",
      onLinkedTableDataSource: () => {},
      onToggleHidden,
      hiddenValue: false,
    });
    const hidden = toolbar.querySelector('[data-action="toggle-hidden"]') as HTMLButtonElement;
    expect(hidden).toBeTruthy();
    hidden.click();
    expect(onToggleHidden).toHaveBeenCalledWith(true);
    expect(toolbar.querySelector(".context-toolbar__actions span[aria-hidden]")).toBeTruthy();
  });

  it("renders linked table toolbar with data source and excel buttons", () => {
    let scale = 0;
    let excel = 0;
    let data = 0;
    const toolbar = createToolbar(null, {
      variant: "linkedTable",
      fontScaleValue: 1,
      onFontScaleChange: (v: number) => {
        scale = v;
      },
      onLinkedTableDataSource: () => {
        data += 1;
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

    const buttons = toolbar.querySelectorAll("button");
    expect(buttons.length).toBe(2);
    buttons[0]?.click();
    expect(data).toBe(1);
    buttons[1]?.click();
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

  it("renders sidebar layout for text toolbar", () => {
    const window = new Window();
    globalThis.document = window.document;
    const toolbar = createToolbar(
      {
        toggleBold: vi.fn(),
        toggleItalic: vi.fn(),
        toggleBulletList: vi.fn(),
        toggleOrderedList: vi.fn(),
      },
      { layout: "sidebar", variant: "text" },
    );
    expect(toolbar.className).toContain("context-toolbar");
    const actions = toolbar.querySelector(".context-toolbar__actions");
    expect(actions).toBeTruthy();
    expect(actions?.querySelectorAll("button").length).toBeGreaterThan(4);
    const select = toolbar.querySelector("select") as HTMLSelectElement;
    expect(select.className).toContain("w-full");
  });

  it("renders sidebar layout for heading toolbar with actions in a row", () => {
    const window = new Window();
    globalThis.document = window.document;
    const toolbar = createToolbar(
      { toggleBold: vi.fn(), toggleItalic: vi.fn() },
      { layout: "sidebar", variant: "heading", onHeadingLevelChange: vi.fn() },
    );
    expect(toolbar.querySelector(".context-toolbar__actions")?.childElementCount).toBeGreaterThan(4);
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

  it("renders hidden toggle on text toolbar and toggles state", () => {
    let nextHidden = false;
    const toolbar = createToolbar(
      {
        toggleBold: () => {},
        toggleItalic: () => {},
        toggleBulletList: () => {},
        toggleOrderedList: () => {},
      },
      {
        variant: "text",
        hiddenValue: false,
        onToggleHidden: (next: boolean) => {
          nextHidden = next;
        },
      }
    );

    const toggle = toolbar.querySelector('button[data-action="toggle-hidden"]') as HTMLButtonElement;
    expect(toggle).toBeTruthy();
    expect(toggle.querySelector('[data-lucide="eye"]')).toBeTruthy();
    toggle.click();
    expect(nextHidden).toBe(true);
  });

  it("renders table toolbar with only hidden toggle", () => {
    let nextHidden = true;
    const toolbar = createToolbar(null, {
      variant: "table",
      hiddenValue: true,
      onToggleHidden: (next: boolean) => {
        nextHidden = next;
      },
    });

    const buttons = toolbar.querySelectorAll("button");
    expect(buttons.length).toBe(1);
    expect((buttons[0] as HTMLButtonElement).dataset.action).toBe("toggle-hidden");
    expect((buttons[0] as HTMLButtonElement).getAttribute("aria-label")).toContain("Desmarcar");
    (buttons[0] as HTMLButtonElement).click();
    expect(nextHidden).toBe(false);
  });

  it("disables hidden toggle when toolbar is disabled", () => {
    const toolbar = createToolbar(null, {
      variant: "table",
      disabled: true,
      hiddenValue: false,
      onToggleHidden: () => {},
    });

    const toggle = toolbar.querySelector('button[data-action="toggle-hidden"]') as HTMLButtonElement;
    expect(toggle.disabled).toBe(true);
  });
});
