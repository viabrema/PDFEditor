import { Window } from "happy-dom";
import { describe, expect, it } from "vitest";
import { hydrateLucideIcons } from "./hydrateLucideIcons";

describe("hydrateLucideIcons", () => {
  it("replaces data-lucide placeholders with svg", () => {
    const window = new Window();
    globalThis.document = window.document;

    const root = window.document.createElement("div");
    const btn = window.document.createElement("button");
    btn.innerHTML = '<i data-lucide="bold"></i>';
    root.append(btn);

    hydrateLucideIcons(root);

    expect(btn.querySelector("svg")).not.toBeNull();
  });

  it("hydrates document when root is omitted", () => {
    const window = new Window();
    globalThis.document = window.document;

    const btn = window.document.createElement("button");
    btn.innerHTML = '<i data-lucide="italic"></i>';
    window.document.body.append(btn);

    hydrateLucideIcons();

    expect(btn.querySelector("svg")).not.toBeNull();
  });
});
