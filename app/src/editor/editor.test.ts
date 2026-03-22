import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Window } from "happy-dom";
import { Schema } from "prosemirror-model";
import { schema as basicSchema } from "prosemirror-schema-basic";
import { addListNodes } from "prosemirror-schema-list";
import { NodeSelection, TextSelection } from "prosemirror-state";
import { createEditor, createEditorCommands, createEditorState } from "./editor";
import { createEditorSchema } from "./schema";

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
    commands.setParagraph();
    commands.setHeading(1);
    commands.setTextAlign("center");
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

  it("applies block alignment", () => {
    const mount = document.createElement("div");
    const onChange = vi.fn();
    const view = createEditor({ mount, editable: () => true, onChange });
    const commands = createEditorCommands(view);

    view.dispatch(view.state.tr.insertText("abc"));
    view.dispatch(view.state.tr.setSelection(TextSelection.create(view.state.doc, 1, 2)));
    commands.setTextAlign("right");

    expect(onChange).toHaveBeenCalled();
    view.destroy();
  });

  it("ignores alignment on non-text blocks", () => {
    const mount = document.createElement("div");
    const content = { type: "doc", content: [{ type: "chart" }] };
    const view = createEditor({ mount, content, editable: () => true });
    const commands = createEditorCommands(view);

    const selection = NodeSelection.create(view.state.doc, 0);
    view.dispatch(view.state.tr.setSelection(selection));
    const result = commands.setTextAlign("center");

    expect(result).toBe(false);
    view.destroy();
  });

  it("pastes plain text", () => {
    const mount = document.createElement("div");
    const view = createEditor({ mount, editable: () => true });

    const event = {
      clipboardData: {
        getData: () => "Texto colado",
      },
      preventDefault: () => {},
    };

    const handled = view.props.handlePaste(view, event);
    expect(handled).toBe(true);
    expect(view.state.doc.textContent).toContain("Texto colado");

    view.destroy();
  });

  it("ignores paste without text", () => {
    const mount = document.createElement("div");
    const view = createEditor({ mount, editable: () => true });

    const event = {
      clipboardData: {
        getData: () => null,
      },
      preventDefault: () => {},
    };

    const handled = view.props.handlePaste(view, event);
    expect(handled).toBe(false);

    view.destroy();
  });
});
