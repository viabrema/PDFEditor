import { setLastAction } from "../activityLog";

export function isTextEditingUndoTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el?.closest) {
    return false;
  }
  return Boolean(el.closest("input, textarea, [contenteditable='true'], .ProseMirror"));
}

export function bindHistoryEvents({
  refs,
  state,
  documentHistory,
  renderer,
}: {
  refs: any;
  state: any;
  documentHistory?: {
    undo: (r: { render: () => void }) => boolean;
    redo: (r: { render: () => void }) => boolean;
  };
  renderer: { render: () => void };
}) {
  if (!documentHistory) {
    return;
  }

  refs.undoButton?.addEventListener("click", () => {
    if (documentHistory.undo(renderer)) {
      setLastAction(state, "Desfeito.");
    }
  });

  refs.redoButton?.addEventListener("click", () => {
    if (documentHistory.redo(renderer)) {
      setLastAction(state, "Refeito.");
    }
  });

  document.addEventListener("keydown", (event) => {
    if (!event.ctrlKey && !event.metaKey) {
      return;
    }
    const key = event.key.toLowerCase();
    if (key !== "z" && key !== "y") {
      return;
    }
    if (isTextEditingUndoTarget(event.target)) {
      return;
    }
    if (key === "z" && event.shiftKey) {
      if (documentHistory.redo(renderer)) {
        event.preventDefault();
        setLastAction(state, "Refeito.");
      }
      return;
    }
    if (key === "z") {
      if (documentHistory.undo(renderer)) {
        event.preventDefault();
        setLastAction(state, "Desfeito.");
      }
      return;
    }
    if (key === "y") {
      if (documentHistory.redo(renderer)) {
        event.preventDefault();
        setLastAction(state, "Refeito.");
      }
    }
  });
}
