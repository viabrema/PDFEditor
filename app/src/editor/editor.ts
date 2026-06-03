import { EditorState, TextSelection } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { baseKeymap, setBlockType, toggleMark } from "prosemirror-commands";
import { history, redo, undo } from "prosemirror-history";
import { keymap } from "prosemirror-keymap";
import { wrapInList } from "prosemirror-schema-list";
import { createEditorSchema } from "./schema";

export function createEditorState({ schema = createEditorSchema(), content } = {} as any) {
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
  const view = new EditorView(mount, {
    state,
    editable,
    handlePaste(viewInstance, event) {
      const text = event.clipboardData?.getData("text/plain");
      if (typeof text !== "string") {
        return false;
      }
      event.preventDefault();
      viewInstance.dispatch(viewInstance.state.tr.insertText(text));
      return true;
    },
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

function applyTextAlign(view, align) {
  const { state, dispatch } = view;
  const { from, to } = state.selection;
  let tr = state.tr;
  let updated = false;

  state.doc.nodesBetween(from, to, (node, pos) => {
    if (node.type === state.schema.nodes.paragraph || node.type === state.schema.nodes.heading) {
      tr = tr.setNodeMarkup(pos, undefined, { ...node.attrs, textAlign: align });
      updated = true;
      return false;
    }
    return true;
  });

  if (!updated) {
    return false;
  }

  dispatch(tr.scrollIntoView());
  return true;
}

/** Seleciona todo o conteudo do bloco para comandos da sidebar sem modo edicao. */
export function selectEntireEditorDocument(view) {
  const doc = view.state.doc;
  let from: number | null = null;
  let to: number | null = null;
  doc.descendants((node, pos) => {
    if (node.isText) {
      if (from === null) {
        from = pos;
      }
      to = pos + node.nodeSize;
    }
  });
  if (from === null || to === null || to <= from) {
    return;
  }
  const tr = view.state.tr.setSelection(TextSelection.create(doc, from, to));
  view.dispatch(tr);
}

export function runEditorCommandOnEntireBlock(view, command: () => unknown) {
  selectEntireEditorDocument(view);
  command();
}

export function editorHasPartialTextSelection(view) {
  return !view.state.selection.empty;
}

/** Sidebar: bloco inteiro se nao estiver em edicao ou sem selecao de texto; senao so a selecao. */
export function runSidebarEditorCommand(
  view,
  options: { editMode: boolean },
  command: () => unknown,
) {
  if (options.editMode && editorHasPartialTextSelection(view)) {
    command();
    return;
  }
  runEditorCommandOnEntireBlock(view, command);
}

export function createEditorCommands(view) {
  const { schema } = view.state;
  return {
    toggleBold: () => runCommand(toggleMark(schema.marks.strong), view),
    toggleItalic: () => runCommand(toggleMark(schema.marks.em), view),
    toggleBulletList: () => runCommand(wrapInList(schema.nodes.bullet_list), view),
    toggleOrderedList: () => runCommand(wrapInList(schema.nodes.ordered_list), view),
    setParagraph: () => runCommand(setBlockType(schema.nodes.paragraph), view),
    setHeading: (level) => runCommand(setBlockType(schema.nodes.heading, { level }), view),
    setTextAlign: (align) => applyTextAlign(view, align),
    setFontSize: (value) => applyTextStyle(view, { fontSize: value }),
    setFontFamily: (value) => applyTextStyle(view, { fontFamily: value }),
  };
}

export function createEditor({ mount, schema, content, editable, onChange } = {} as any) {
  const resolvedSchema = schema || createEditorSchema();
  const state = createEditorState({ schema: resolvedSchema, content });
  return createEditorView({ mount, state, editable, onChange });
}
