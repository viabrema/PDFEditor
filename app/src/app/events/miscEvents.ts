import { setLastAction } from "../activityLog";

export function bindMiscEvents({ state, blocks, renderer }: any) {
  document.addEventListener("click", (event) => {
    const el = event.target as Element | null;
    if (el?.closest(".block-shell")) {
      return;
    }

    if (el?.closest(".page-surface")) {
      if (state.editingBlockId || state.selectedBlockIds.length > 0) {
        state.editingBlockId = null;
        state.selectedBlockIds = [];
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

    if (state.selectedBlockIds.length === 0 || state.editingBlockId) {
      return;
    }

    const toRemove = new Set(state.selectedBlockIds);
    for (let i = blocks.length - 1; i >= 0; i -= 1) {
      if (toRemove.has(blocks[i].id)) {
        blocks.splice(i, 1);
      }
    }
    state.selectedBlockIds = [];
    state.editingBlockId = null;
    setLastAction(state, "Bloco removido.");
    renderer.render();
  });
}
