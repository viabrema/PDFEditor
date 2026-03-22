import { buildDocumentSnapshot, applyDocumentSnapshot, type DocumentSnapshot } from "./documentSnapshot";

/** Numero maximo de passos guardados na pilha de desfazer (configuravel). */
export const DOCUMENT_UNDO_MAX_STEPS = 10;

const EDITOR_DEBOUNCE_MS = 400;

function cloneSnapshot(documentData: any, blocks: any[]): DocumentSnapshot {
  const raw = buildDocumentSnapshot(documentData, blocks);
  try {
    return structuredClone(raw) as DocumentSnapshot;
  } catch {
    return JSON.parse(JSON.stringify(raw)) as DocumentSnapshot;
  }
}

export function createDocumentHistory({
  maxSteps = DOCUMENT_UNDO_MAX_STEPS,
  documentData,
  blocks,
  state,
}: {
  maxSteps?: number;
  documentData: any;
  blocks: any[];
  state: any;
}) {
  const past: DocumentSnapshot[] = [];
  const future: DocumentSnapshot[] = [];

  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  let burstBaseline: DocumentSnapshot | null = null;
  let hadEditorMutationInSession = false;

  function trimPast() {
    while (past.length > maxSteps) {
      past.shift();
    }
  }

  /** Descarta burst pendente sem criar passo de undo (ex.: antes de alteracao estrutural). */
  function cancelPendingEditorHistory() {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }
    burstBaseline = null;
    hadEditorMutationInSession = false;
  }

  function commitBurstToPast() {
    if (burstBaseline) {
      past.push(burstBaseline);
      trimPast();
      future.length = 0;
    }
    burstBaseline = cloneSnapshot(documentData, blocks);
    hadEditorMutationInSession = false;
  }

  function checkpointBeforeChange() {
    cancelPendingEditorHistory();
    past.push(cloneSnapshot(documentData, blocks));
    trimPast();
    future.length = 0;
  }

  function editorMutationDebounced() {
    hadEditorMutationInSession = true;
    if (burstBaseline === null) {
      burstBaseline = cloneSnapshot(documentData, blocks);
    }
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    debounceTimer = setTimeout(() => {
      debounceTimer = null;
      commitBurstToPast();
    }, EDITOR_DEBOUNCE_MS);
  }

  function editorFocusCapture() {
    cancelPendingEditorHistory();
    burstBaseline = cloneSnapshot(documentData, blocks);
    hadEditorMutationInSession = false;
  }

  function editorBlurFlush() {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }
    if (hadEditorMutationInSession && burstBaseline) {
      past.push(burstBaseline);
      trimPast();
      future.length = 0;
    }
    burstBaseline = null;
    hadEditorMutationInSession = false;
  }

  function undo(renderer: { render: () => void }): boolean {
    cancelPendingEditorHistory();
    if (past.length === 0) {
      return false;
    }
    const target = past.pop()!;
    future.push(cloneSnapshot(documentData, blocks));
    applyDocumentSnapshot({
      documentData,
      blocks,
      state,
      snapshot: target,
      renderer,
      preserveNavigation: true,
    });
    return true;
  }

  function redo(renderer: { render: () => void }): boolean {
    cancelPendingEditorHistory();
    if (future.length === 0) {
      return false;
    }
    const target = future.pop()!;
    past.push(cloneSnapshot(documentData, blocks));
    trimPast();
    applyDocumentSnapshot({
      documentData,
      blocks,
      state,
      snapshot: target,
      renderer,
      preserveNavigation: true,
    });
    return true;
  }

  function clear() {
    past.length = 0;
    future.length = 0;
    cancelPendingEditorHistory();
  }

  function canUndo() {
    return past.length > 0;
  }

  function canRedo() {
    return future.length > 0;
  }

  function syncUi(refs: { undoButton?: HTMLButtonElement | null; redoButton?: HTMLButtonElement | null }) {
    if (refs.undoButton) {
      refs.undoButton.disabled = !canUndo();
    }
    if (refs.redoButton) {
      refs.redoButton.disabled = !canRedo();
    }
  }

  return {
    checkpointBeforeChange,
    editorMutationDebounced,
    editorFocusCapture,
    editorBlurFlush,
    undo,
    redo,
    clear,
    canUndo,
    canRedo,
    syncUi,
  };
}

export type DocumentHistory = ReturnType<typeof createDocumentHistory>;
