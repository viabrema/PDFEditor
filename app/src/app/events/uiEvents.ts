import { normalizeGridSize } from "../../utils/grid";

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

  refs.headerToggle.addEventListener("change", (event) => {
    if (!documentData.regions) {
      documentData.regions = { header: { enabled: true }, footer: { enabled: true } };
    }
    documentData.regions.header = {
      ...documentData.regions.header,
      enabled: event.target.checked,
    };
    if (!event.target.checked && state.activeRegion === "header") {
      state.activeRegion = "body";
      state.selectedBlockId = null;
      state.editingBlockId = null;
    }
    renderer.render();
  });

  refs.footerToggle.addEventListener("change", (event) => {
    if (!documentData.regions) {
      documentData.regions = { header: { enabled: true }, footer: { enabled: true } };
    }
    documentData.regions.footer = {
      ...documentData.regions.footer,
      enabled: event.target.checked,
    };
    if (!event.target.checked && state.activeRegion === "footer") {
      state.activeRegion = "body";
      state.selectedBlockId = null;
      state.editingBlockId = null;
    }
    renderer.render();
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
