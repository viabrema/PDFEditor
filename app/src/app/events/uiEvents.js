import { normalizeGridSize } from "../../utils/grid.js";

export function bindUiEvents({ documentData, state, refs, renderer }) {
  function openSettings() {
    refs.pageSettingsModal.classList.remove("hidden");
    refs.pageSettingsModal.classList.add("flex");
    refs.pageSettingsModal.setAttribute("aria-hidden", "false");
  }

  function closeSettings() {
    refs.pageSettingsModal.classList.add("hidden");
    refs.pageSettingsModal.classList.remove("flex");
    refs.pageSettingsModal.setAttribute("aria-hidden", "true");
  }

  refs.pageSettingsButton.addEventListener("click", () => {
    openSettings();
  });

  refs.pageSettingsClose.addEventListener("click", () => {
    closeSettings();
  });

  refs.pageSettingsModal.addEventListener("click", (event) => {
    if (event.target === refs.pageSettingsModal) {
      closeSettings();
    }
  });

  refs.formatSelect.addEventListener("change", (event) => {
    documentData.page.format = event.target.value;
    renderer.render();
  });

  refs.orientationSelect.addEventListener("change", (event) => {
    documentData.page.orientation = event.target.value;
    renderer.render();
  });

  refs.gridSizeInput.addEventListener("change", (event) => {
    documentData.grid.size = normalizeGridSize(event.target.value, 8);
    renderer.renderCanvas();
  });

  refs.snapToggle.addEventListener("change", (event) => {
    documentData.grid.snap = event.target.checked;
    renderer.renderCanvas();
  });

  refs.aiPanelToggle.addEventListener("click", () => {
    state.ai.open = !state.ai.open;
    renderer.renderAiPanel();
  });

  refs.aiPanelClose.addEventListener("click", () => {
    state.ai.open = false;
    renderer.renderAiPanel();
  });
}
