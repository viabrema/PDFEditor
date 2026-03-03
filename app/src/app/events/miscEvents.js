export function bindMiscEvents({ state, blocks, renderer }) {
  document.addEventListener("click", (event) => {
    if (event.target.closest(".block-shell")) {
      return;
    }

    if (event.target.closest(".page-surface")) {
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

    const isEditingText = Boolean(
      event.target.closest?.("input, textarea, [contenteditable='true']")
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
    renderer.render();
  });
}
