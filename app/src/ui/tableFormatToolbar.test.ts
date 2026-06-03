import { Window } from "happy-dom";
import { describe, expect, it, vi } from "vitest";
import { createTableFormatToolbar } from "./tableFormatToolbar";

describe("tableFormatToolbar", () => {
  it("applies bold to selected scope", () => {
    const window = new Window();
    globalThis.document = window.document;

    const block = { content: { rows: [["1"]], cellStyles: {}, rowStyles: {}, colStyles: {} } };
    const onApply = vi.fn();

    const toolbar = createTableFormatToolbar({
      block,
      getFocus: () => ({ row: 0, col: 0 }),
      getScope: () => "cell",
      onApply,
    });

    const boldBtn = toolbar.querySelector('[title="Negrito"]') as HTMLButtonElement;
    boldBtn.click();
    expect(onApply).toHaveBeenCalledWith({ fontWeight: "bold" }, "cell");
  });

  it("applies row scope when selected", () => {
    const window = new Window();
    globalThis.document = window.document;

    const block = { content: { rows: [["1"]], cellStyles: {}, rowStyles: {}, colStyles: {} } };
    const onApply = vi.fn();

    const toolbar = createTableFormatToolbar({
      block,
      getFocus: () => ({ row: 0, col: 0 }),
      getScope: () => "row",
      onApply,
    });

    const centerBtn = toolbar.querySelector('[title="Alinhar centro"]') as HTMLButtonElement;
    centerBtn.click();
    expect(onApply).toHaveBeenCalledWith({ textAlign: "center" }, "row");
  });

  it("toggles italic and alignment, colors, number format, linked extras and hidden", () => {
    const window = new Window();
    globalThis.document = window.document;

    const block = {
      content: {
        rows: [["1"]],
        cellStyles: { "0,0": { fontStyle: "italic", fontWeight: "bold" } },
        rowStyles: {},
        colStyles: {},
      },
    };
    const onApply = vi.fn();
    const onToggleHidden = vi.fn();
    const extra = window.document.createElement("span");
    extra.textContent = "excel";

    const toolbar = createTableFormatToolbar({
      block,
      getFocus: () => ({ row: 0, col: 0 }),
      getScope: () => "cell",
      onApply,
      hiddenValue: true,
      onToggleHidden,
      linkedActionButtons: [extra],
    });

    (toolbar.querySelector('[title="Italico"]') as HTMLButtonElement).click();
    expect(onApply).toHaveBeenCalledWith({ fontStyle: "normal" }, "cell");

    (toolbar.querySelector('[title="Alinhar esquerda"]') as HTMLButtonElement).click();
    (toolbar.querySelector('[title="Alinhar direita"]') as HTMLButtonElement).click();
    expect(onApply).toHaveBeenCalledWith({ textAlign: "right" }, "cell");

    const colors = toolbar.querySelectorAll('input[type="color"]');
    (colors[0] as HTMLInputElement).value = "#112233";
    colors[0].dispatchEvent(new window.Event("input"));
    expect(onApply).toHaveBeenCalledWith({ color: "#112233" }, "cell");

    (colors[1] as HTMLInputElement).value = "#aabbcc";
    colors[1].dispatchEvent(new window.Event("input"));
    expect(onApply).toHaveBeenCalledWith({ backgroundColor: "#aabbcc" }, "cell");

    const selects = toolbar.querySelectorAll("select");
    const numKind = selects[0] as HTMLSelectElement;
    numKind.value = "currency";
    numKind.dispatchEvent(new window.Event("change"));
    expect(onApply).toHaveBeenCalledWith(
      expect.objectContaining({ numberFormat: expect.objectContaining({ kind: "currency" }) }),
      "cell",
    );

    const decimals = toolbar.querySelector('input[type="number"]') as HTMLInputElement;
    decimals.value = "3";
    decimals.dispatchEvent(new window.Event("change"));

    const locale = selects[1] as HTMLSelectElement;
    locale.value = "en-US";
    locale.dispatchEvent(new window.Event("change"));

    expect(toolbar.textContent).toContain("excel");

    (toolbar.querySelector('[data-action="toggle-hidden"]') as HTMLButtonElement).click();
    expect(onToggleHidden).toHaveBeenCalledWith(false);
  });

  it("resolves style when block has no content", () => {
    const window = new Window();
    globalThis.document = window.document;
    const onApply = vi.fn();
    const toolbar = createTableFormatToolbar({
      block: {},
      getFocus: () => ({ row: 0, col: 0 }),
      getScope: () => "cell",
      onApply,
    });
    (toolbar.querySelector('[title="Italico"]') as HTMLButtonElement).click();
    expect(onApply).toHaveBeenCalledWith({ fontStyle: "italic" }, "cell");
  });

  it("toggles bold off when already bold", () => {
    const window = new Window();
    globalThis.document = window.document;

    const block = {
      content: {
        rows: [["1"]],
        cellStyles: { "0,0": { fontWeight: "bold" } },
      },
    };
    const onApply = vi.fn();
    const toolbar = createTableFormatToolbar({
      block,
      getFocus: () => ({ row: 0, col: 0 }),
      getScope: () => "cell",
      onApply,
    });

    (toolbar.querySelector('[title="Negrito"]') as HTMLButtonElement).click();
    expect(onApply).toHaveBeenCalledWith({ fontWeight: "normal" }, "cell");
  });

  it("uses zero decimals when input is invalid", () => {
    const window = new Window();
    globalThis.document = window.document;

    const onApply = vi.fn();
    const toolbar = createTableFormatToolbar({
      block: { content: { rows: [["1"]] } },
      getFocus: () => ({ row: 0, col: 0 }),
      getScope: () => "cell",
      onApply,
    });

    const decimals = toolbar.querySelector('input[type="number"]') as HTMLInputElement;
    decimals.value = "";
    decimals.dispatchEvent(new window.Event("change"));
    expect(onApply).toHaveBeenCalledWith(
      expect.objectContaining({ numberFormat: expect.objectContaining({ decimals: 0 }) }),
      "cell",
    );
  });

  it("appends linked fields before format controls", () => {
    const window = new Window();
    globalThis.document = window.document;
    const scale = window.document.createElement("div");
    scale.textContent = "linked-scale";
    const toolbar = createTableFormatToolbar({
      block: { content: { rows: [["1"]] } },
      getFocus: () => ({ row: 0, col: 0 }),
      getScope: () => "cell",
      onApply: vi.fn(),
      linkedFields: [scale],
    });
    const fields = toolbar.querySelector(".context-toolbar__fields");
    expect(fields?.firstElementChild?.textContent).toContain("linked-scale");
  });

  it("renders sidebar layout classes", () => {
    const window = new Window();
    globalThis.document = window.document;
    const toolbar = createTableFormatToolbar({
      block: { content: { rows: [["1"]] } },
      getFocus: () => ({ row: 0, col: 0 }),
      getScope: () => "cell",
      onApply: vi.fn(),
      layout: "sidebar",
    });
    expect(toolbar.className).toContain("context-toolbar");
  });

  it("renders hidden toggle when not marked hidden", () => {
    const window = new Window();
    globalThis.document = window.document;

    const toolbar = createTableFormatToolbar({
      block: { content: { rows: [["1"]] } },
      getFocus: () => ({ row: 0, col: 0 }),
      getScope: () => "cell",
      onApply: vi.fn(),
      hiddenValue: false,
      onToggleHidden: vi.fn(),
    });

    const hiddenBtn = toolbar.querySelector('[data-action="toggle-hidden"]') as HTMLButtonElement;
    expect(hiddenBtn.title).toContain("Marcar");
    hiddenBtn.click();
  });
});
