const ZOOM_MIN = 25;
const ZOOM_MAX = 300;

export function clampZoomPercent(value: number): number {
  const n = Number.isFinite(value) ? Math.round(value) : 100;
  return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, n));
}

export function getPointerScale(state: any): number {
  const p = state?.ui?.zoomPercent ?? 100;
  return clampZoomPercent(p) / 100;
}

export function syncCanvasZoomLayout(refs: any, state: any) {
  const outer = refs.canvasScaleOuter;
  const scaleRoot = refs.canvasScaleRoot;
  const canvas = refs.canvas;
  if (!outer || !scaleRoot || !canvas) {
    return;
  }

  const s = getPointerScale(state);
  scaleRoot.style.transform = `scale(${s})`;
  scaleRoot.style.transformOrigin = "0 0";

  const w = canvas.offsetWidth;
  const h = canvas.offsetHeight;
  outer.style.width = `${Math.ceil(w * s)}px`;
  outer.style.height = `${Math.ceil(h * s)}px`;
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
