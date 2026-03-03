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

export function createEditorView({
  mount,
  state,
  editable = () => true,
  onChange,
}) {
  let view;
  view = new EditorView(mount, {
    state,
    editable,
    dispatchTransaction(transaction) {
      const nextState = view.state.apply(transaction);
      view.updateState(nextState);
      if (onChange) {
        onChange(nextState);
      }
    },
  });
  return view;
}

function runCommand(command, view) {
  return command(view.state, view.dispatch, view);
}

function applyTextStyle(view, attrs) {
  const { state, dispatch } = view;
  const markType = state.schema.marks.textStyle;
  if (!markType) {
    return false;
  }

  const currentMarks = state.storedMarks || state.selection.$from.marks();
  const existing = markType.isInSet(currentMarks);
  const nextAttrs = { ...(existing?.attrs || {}), ...attrs };
  const mark = markType.create(nextAttrs);

  const tr = state.tr;
  if (state.selection.empty) {
    tr.setStoredMarks(mark.addToSet(currentMarks));
  } else {
    tr.addMark(state.selection.from, state.selection.to, mark);
  }

  dispatch(tr.scrollIntoView());
  return true;
}

export function createEditorCommands(view) {
  const { schema } = view.state;
  return {
    toggleBold: () => runCommand(toggleMark(schema.marks.strong), view),
    toggleItalic: () => runCommand(toggleMark(schema.marks.em), view),
    toggleBulletList: () => runCommand(wrapInList(schema.nodes.bullet_list), view),
    toggleOrderedList: () => runCommand(wrapInList(schema.nodes.ordered_list), view),
    setFontSize: (value) => applyTextStyle(view, { fontSize: value }),
    setFontFamily: (value) => applyTextStyle(view, { fontFamily: value }),
  };
}

export function createEditor({ mount, schema, content, editable, onChange } = {}) {
  const resolvedSchema = schema || createEditorSchema();
  const state = createEditorState({ schema: resolvedSchema, content });
  return createEditorView({ mount, state, editable, onChange });
}
