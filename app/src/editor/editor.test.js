import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { Window } from "happy-dom";
import { createEditor, createEditorCommands, createEditorState } from "./editor.js";
import { createEditorSchema } from "./schema.js";

describe("editor", () => {
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

  it("creates editor view and commands", () => {
    const mount = document.createElement("div");
    const view = createEditor({ mount });
    const commands = createEditorCommands(view);

    expect(view.dom).toBeInstanceOf(window.HTMLElement);
    expect(typeof commands.toggleBold).toBe("function");

    commands.toggleBold();
    commands.toggleItalic();
    commands.toggleBulletList();
    commands.toggleOrderedList();

    view.destroy();
  });

  it("creates state from JSON content", () => {
    const schema = createEditorSchema();
    const doc = schema.topNodeType.createAndFill();
    const state = createEditorState({ schema, content: doc.toJSON() });

    expect(state.schema).toBe(schema);
  });

  it("uses provided schema in view", () => {
    const schema = createEditorSchema();
    const mount = document.createElement("div");
    const view = createEditor({ mount, schema });

    expect(view.state.schema).toBe(schema);

    view.destroy();
  });
});
