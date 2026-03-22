import { normalizeGridSize } from "../../utils/grid";
import { clampZoomPercent, syncStatusBar } from "../canvasZoom";
import { setLastAction } from "../activityLog";

export function bindUiEvents({ documentData, state, refs, renderer, documentHistory }) {
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
    documentHistory?.checkpointBeforeChange();
    documentData.page.format = event.target.value;
    setLastAction(state, `Formato: ${event.target.value}`);
    renderer.render();
  });

  refs.orientationSelect.addEventListener("change", (event) => {
    documentHistory?.checkpointBeforeChange();
    documentData.page.orientation = event.target.value;
    setLastAction(
      state,
      `Orientacao: ${event.target.value === "landscape" ? "paisagem" : "retrato"}`,
    );
    renderer.render();
  });

  refs.gridSizeInput.addEventListener("change", (event) => {
    documentHistory?.checkpointBeforeChange();
    documentData.grid.size = normalizeGridSize(event.target.value, 8);
    setLastAction(state, `Grid: ${documentData.grid.size}px`);
    renderer.renderCanvas();
  });

  refs.snapToggle.addEventListener("change", (event) => {
    documentHistory?.checkpointBeforeChange();
    documentData.grid.snap = event.target.checked;
    setLastAction(state, `Snap: ${event.target.checked ? "ligado" : "desligado"}`);
    renderer.renderCanvas();
  });

  refs.headerToggle.addEventListener("change", (event) => {
    documentHistory?.checkpointBeforeChange();
    if (!documentData.regions) {
      documentData.regions = { header: { enabled: true }, footer: { enabled: true } };
    }
    documentData.regions.header = {
      ...documentData.regions.header,
      enabled: event.target.checked,
    };
    if (!event.target.checked && state.activeRegion === "header") {
      state.activeRegion = "body";
      state.selectedBlockIds = [];
      state.editingBlockId = null;
    }
    setLastAction(state, `Cabecalho: ${event.target.checked ? "visivel" : "oculto"}`);
    renderer.render();
  });

  refs.footerToggle.addEventListener("change", (event) => {
    documentHistory?.checkpointBeforeChange();
    if (!documentData.regions) {
      documentData.regions = { header: { enabled: true }, footer: { enabled: true } };
    }
    documentData.regions.footer = {
      ...documentData.regions.footer,
      enabled: event.target.checked,
    };
    if (!event.target.checked && state.activeRegion === "footer") {
      state.activeRegion = "body";
      state.selectedBlockIds = [];
      state.editingBlockId = null;
    }
    setLastAction(state, `Rodape de pagina: ${event.target.checked ? "visivel" : "oculto"}`);
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

  function bumpZoom(delta: number) {
    state.ui = state.ui || { zoomPercent: 100, lastAction: "" };
    state.ui.zoomPercent = clampZoomPercent((state.ui.zoomPercent ?? 100) + delta);
    setLastAction(state, `Zoom: ${state.ui.zoomPercent}%`);
    syncStatusBar(refs, state);
  }

  function commitZoomFromInput() {
    const raw = String(refs.zoomInput?.value ?? "").replace(/%/g, "").trim();
    const n = Number.parseInt(raw, 10);
    state.ui = state.ui || { zoomPercent: 100, lastAction: "" };
    state.ui.zoomPercent = clampZoomPercent(Number.isFinite(n) ? n : state.ui.zoomPercent);
    setLastAction(state, `Zoom: ${state.ui.zoomPercent}%`);
    syncStatusBar(refs, state);
  }

  refs.zoomOutButton?.addEventListener("click", () => bumpZoom(-10));
  refs.zoomInButton?.addEventListener("click", () => bumpZoom(10));

  refs.zoomInput?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      commitZoomFromInput();
      (refs.zoomInput as HTMLInputElement)?.blur();
    }
  });

  refs.zoomInput?.addEventListener("blur", () => {
    commitZoomFromInput();
  });
}
