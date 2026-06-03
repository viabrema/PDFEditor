import { Window } from "happy-dom";
import { describe, expect, it, vi } from "vitest";
import {
  compactIconButton,
  createContextToolbarActionsRow,
  createContextToolbarFieldsPanel,
  createContextToolbarRoot,
  labeledField,
  toolbarSeparator,
} from "./contextToolbarLayout";

describe("contextToolbarLayout", () => {
  it("builds root, actions, fields and labeled control", () => {
    const window = new Window();
    globalThis.document = window.document;

    const root = createContextToolbarRoot("extra");
    const actions = createContextToolbarActionsRow();
    const fields = createContextToolbarFieldsPanel();
    const clicked = vi.fn();
    actions.append(compactIconButton("bold", "Negrito", clicked));
    actions.append(toolbarSeparator());

    const input = document.createElement("input");
    fields.append(labeledField("Cor", input));

    root.append(actions, fields);

    expect(root.className).toContain("context-toolbar");
    expect(root.className).toContain("extra");
    expect(actions.className).toContain("context-toolbar__actions");
    expect(fields.querySelector("label")?.textContent).toBe("Cor");
    expect(input.id).toBeTruthy();
    expect(input.getAttribute("aria-label")).toBe("Cor");

    (actions.querySelector("button") as HTMLButtonElement).click();
    expect(clicked).toHaveBeenCalled();
  });

  it("preserves full-width class on control when already set", () => {
    const window = new Window();
    globalThis.document = window.document;

    const select = document.createElement("select");
    select.className = "w-full custom";
    const field = labeledField("Opcao", select);
    expect(select.className).toContain("custom");
    expect(select.className).toContain("w-full");
    expect(field.querySelector("label")?.htmlFor).toBe(select.id);
  });

  it("keeps existing aria-label on control", () => {
    const window = new Window();
    globalThis.document = window.document;

    const input = document.createElement("input");
    input.setAttribute("aria-label", "Custom");
    labeledField("Cor", input);
    expect(input.getAttribute("aria-label")).toBe("Custom");
  });
});
