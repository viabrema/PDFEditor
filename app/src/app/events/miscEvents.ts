import { setLastAction } from "../activityLog";

export function bindMiscEvents({ state, blocks, renderer }: any) {
  document.addEventListener("click", (event) => {
    const el = event.target as Element | null;
    if (el?.closest(".block-shell")) {
      return;
    }

    if (el?.closest(".page-surface")) {
      if (state.editingBlockId || state.selectedBlockId) {
        state.editingBlockId = null;
        state.selectedBlockId = null;
        renderer.render();
      }
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Delete" && event.key !== "Backspace") {
      return;
    }

    const t = event.target as Element | null;
    const isEditingText = Boolean(
      t?.closest?.("input, textarea, [contenteditable='true']")
    );
    if (isEditingText) {
      return;
    }

    if (!state.selectedBlockId || state.editingBlockId) {
      return;
    }

    const index = blocks.findIndex((block) => block.id === state.selectedBlockId);
    if (index === -1) {
      return;
    }

    blocks.splice(index, 1);
    state.selectedBlockId = null;
    state.editingBlockId = null;
    setLastAction(state, "Bloco removido.");
    renderer.render();
  });
}
