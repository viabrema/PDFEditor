import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Window } from "happy-dom";
import { Schema } from "prosemirror-model";
import { schema as basicSchema } from "prosemirror-schema-basic";
import { addListNodes } from "prosemirror-schema-list";
import { TextSelection } from "prosemirror-state";
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
    const onChange = vi.fn();
    const view = createEditor({ mount, editable: () => true, onChange });
    const commands = createEditorCommands(view);

    expect(view.dom).toBeInstanceOf(window.HTMLElement);
    expect(typeof commands.toggleBold).toBe("function");

    commands.toggleBold();
    commands.toggleItalic();
    commands.toggleBulletList();
    commands.toggleOrderedList();
    commands.setFontSize("18px");
    commands.setFontFamily("Georgia");

    expect(onChange).toHaveBeenCalled();

    view.destroy();
  });

  it("applies text style on range selection", () => {
    const mount = document.createElement("div");
    const onChange = vi.fn();
    const view = createEditor({ mount, editable: () => true, onChange });
    const commands = createEditorCommands(view);

    view.dispatch(view.state.tr.insertText("abc"));
    view.dispatch(view.state.tr.setSelection(TextSelection.create(view.state.doc, 1, 3)));
    commands.setFontSize("20px");

    expect(onChange).toHaveBeenCalled();

    view.destroy();
  });

  it("ignores text style when mark is missing", () => {
    const nodes = addListNodes(basicSchema.spec.nodes, "paragraph block*", "block");
    const schema = new Schema({ nodes, marks: basicSchema.spec.marks });
    const mount = document.createElement("div");
    const view = createEditor({ mount, schema, editable: () => true });
    const commands = createEditorCommands(view);

    commands.setFontSize("18px");
    commands.setFontFamily("Georgia");

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

  it("respects editable prop", () => {
    const schema = createEditorSchema();
    const mount = document.createElement("div");
    const view = createEditor({ mount, schema, editable: () => false });

    expect(view.props.editable()).toBe(false);

    view.destroy();
  });

  it("works without onChange", () => {
    const mount = document.createElement("div");
    const view = createEditor({ mount, editable: () => true });

    view.dispatch(view.state.tr.insertText("a"));

    view.destroy();
  });
});
