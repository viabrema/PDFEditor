const ZOOM_MIN = 25;
const ZOOM_MAX = 300;

export function clampZoomPercent(value: number): number {
  const n = Number.isFinite(value) ? Math.round(value) : 100;
  return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, n));
}

/**
 * Zoom do canvas com CSS `zoom` (Chromium / WebView2 / Tauri). Mantém coordenadas de layout
 * alinhadas ao ponteiro para interact.js, ao contrário de `transform: scale`.
 */
export function syncCanvasZoomLayout(refs: any, state: any) {
  const root = refs.canvasZoomRoot;
  if (!root) {
    return;
  }

  const z = clampZoomPercent(state?.ui?.zoomPercent ?? 100);
  (root as HTMLElement).style.zoom = `${z}%`;
  (root as HTMLElement).style.removeProperty("transform");
  (root as HTMLElement).style.removeProperty("transform-origin");
}

let zoomLayoutRaf = 0;

export function scheduleCanvasZoomSync(refs: any, state: any) {
  cancelAnimationFrame(zoomLayoutRaf);
  zoomLayoutRaf = requestAnimationFrame(() => {
    syncCanvasZoomLayout(refs, state);
    requestAnimationFrame(() => syncCanvasZoomLayout(refs, state));
  });
}

export function syncStatusBar(refs: any, state: any) {
  if (refs.statusLastAction) {
    refs.statusLastAction.textContent = state.ui?.lastAction ?? "Pronto.";
  }
  const z = clampZoomPercent(state?.ui?.zoomPercent ?? 100);
  state.ui = state.ui || {};
  state.ui.zoomPercent = z;
  if (refs.zoomInput && document.activeElement !== refs.zoomInput) {
    refs.zoomInput.value = `${z}%`;
  }
  scheduleCanvasZoomSync(refs, state);
}
