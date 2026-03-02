import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { baseKeymap, toggleMark } from "prosemirror-commands";
import { history, redo, undo } from "prosemirror-history";
import { keymap } from "prosemirror-keymap";
import { wrapInList } from "prosemirror-schema-list";
import { createEditorSchema } from "./schema.js";

export function createEditorState({ schema = createEditorSchema(), content } = {}) {
  const doc = content ? schema.nodeFromJSON(content) : schema.topNodeType.createAndFill();
  return EditorState.create({
    schema,
    doc,
    plugins: [
      history(),
      keymap({
        "Mod-z": undo,
        "Mod-y": redo,
        "Mod-Shift-z": redo,
      }),
      keymap(baseKeymap),
    ],
  });
}

export function createEditorView({ mount, state, editable = () => true }) {
  let view;
  view = new EditorView(mount, {
    state,
    editable,
    dispatchTransaction(transaction) {
      const nextState = view.state.apply(transaction);
      view.updateState(nextState);
    },
  });
  return view;
}

function runCommand(command, view) {
  return command(view.state, view.dispatch, view);
}

export function createEditorCommands(view) {
  const { schema } = view.state;
  return {
    toggleBold: () => runCommand(toggleMark(schema.marks.strong), view),
    toggleItalic: () => runCommand(toggleMark(schema.marks.em), view),
    toggleBulletList: () => runCommand(wrapInList(schema.nodes.bullet_list), view),
    toggleOrderedList: () => runCommand(wrapInList(schema.nodes.ordered_list), view),
  };
}

export function createEditor({ mount, schema, content, editable } = {}) {
  const resolvedSchema = schema || createEditorSchema();
  const state = createEditorState({ schema: resolvedSchema, content });
  return createEditorView({ mount, state, editable });
}
