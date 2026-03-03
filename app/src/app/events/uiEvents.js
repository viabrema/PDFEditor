import { normalizeGridSize } from "../../utils/grid.js";

export function bindUiEvents({ documentData, state, refs, renderer }) {
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
