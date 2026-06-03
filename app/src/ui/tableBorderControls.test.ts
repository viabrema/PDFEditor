import { Window } from "happy-dom";
import { describe, expect, it, vi } from "vitest";
import { createTableBorderControls } from "./tableBorderControls";

describe("tableBorderControls", () => {
  it("renders preset buttons and applies selection", () => {
    const window = new Window();
    globalThis.document = window.document;
    const onApplyPreset = vi.fn();

    const controls = createTableBorderControls({
      borderColor: "#112233",
      onBorderColorChange: vi.fn(),
      onApplyPreset,
    });

    expect(controls.querySelector('[data-border-preset="outside"]')).toBeTruthy();
    expect(controls.querySelector(".table-border-preset-icon")).toBeTruthy();
    (controls.querySelector('[data-border-preset="all"]') as HTMLButtonElement).click();
    expect(onApplyPreset).toHaveBeenCalledWith("all");
  });

  it("updates border color through picker", () => {
    const window = new Window();
    globalThis.document = window.document;
    const onBorderColorChange = vi.fn();

    const controls = createTableBorderControls({
      onBorderColorChange,
      onApplyPreset: vi.fn(),
    });

    const color = controls.querySelector('input[type="color"]') as HTMLInputElement;
    color.value = "#aabbcc";
    color.dispatchEvent(new window.Event("input"));
    expect(onBorderColorChange).toHaveBeenCalledWith("#aabbcc");
  });

  it("omits color picker when border color handler is absent", () => {
    const window = new Window();
    globalThis.document = window.document;

    const controls = createTableBorderControls({
      onApplyPreset: vi.fn(),
    });

    expect(controls.querySelector('input[type="color"]')).toBeNull();
  });
});
