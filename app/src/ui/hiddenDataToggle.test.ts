import { Window } from "happy-dom";
import { describe, expect, it, vi } from "vitest";
import { appendHiddenDataToggleButton } from "./hiddenDataToggle";

describe("hiddenDataToggle", () => {
  it("renders eye icon and toggles hidden state", () => {
    const window = new Window();
    globalThis.document = window.document;
    const parent = window.document.createElement("div");
    const onToggleHidden = vi.fn();

    appendHiddenDataToggleButton(parent, { hiddenValue: false, onToggleHidden });
    const btn = parent.querySelector('[data-action="toggle-hidden"]') as HTMLButtonElement;
    expect(btn.innerHTML).toContain("eye");
    expect(btn.title).toContain("Marcar");
    btn.click();
    expect(onToggleHidden).toHaveBeenCalledWith(true);
  });

  it("renders eye-off when block is already hidden", () => {
    const window = new Window();
    globalThis.document = window.document;
    const parent = window.document.createElement("div");

    appendHiddenDataToggleButton(parent, {
      hiddenValue: true,
      onToggleHidden: vi.fn(),
    });
    const btn = parent.querySelector('[data-action="toggle-hidden"]') as HTMLButtonElement;
    expect(btn.innerHTML).toContain("eye-off");
    expect(btn.className).toContain("bg-slate-900");
  });

  it("does nothing when callback is missing", () => {
    const window = new Window();
    globalThis.document = window.document;
    const parent = window.document.createElement("div");
    appendHiddenDataToggleButton(parent, {});
    expect(parent.childElementCount).toBe(0);
  });
});
