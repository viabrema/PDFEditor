const SURFACE_PAD = 48;
const MIN_SURFACE_WIDTH = 640;
const MIN_SURFACE_HEIGHT = 480;

export function computeHiddenDataSurfaceSize(
  blocks: Array<{ position: { x: number; y: number }; size: { width: number; height: number } }>,
): { width: number; height: number } {
  if (blocks.length === 0) {
    return { width: MIN_SURFACE_WIDTH, height: MIN_SURFACE_HEIGHT };
  }

  let maxX = 0;
  let maxY = 0;
  for (const block of blocks) {
    maxX = Math.max(maxX, block.position.x + block.size.width);
    maxY = Math.max(maxY, block.position.y + block.size.height);
  }

  return {
    width: Math.max(MIN_SURFACE_WIDTH, maxX + SURFACE_PAD),
    height: Math.max(MIN_SURFACE_HEIGHT, maxY + SURFACE_PAD),
  };
}

export function syncHiddenDataCanvasLayout(
  refs: {
    canvasScroll?: Element | null;
    canvas?: Element | null;
  },
  showHiddenOnlyView: boolean,
) {
  refs.canvasScroll?.classList.toggle("is-hidden-data-view", showHiddenOnlyView);
  const host = refs.canvasScroll?.firstElementChild;
  host?.classList.toggle("is-hidden-data-canvas-host", showHiddenOnlyView);
  refs.canvas?.classList.toggle("is-hidden-data-canvas", showHiddenOnlyView);

  const canvas = refs.canvas as HTMLElement | undefined;
  if (!showHiddenOnlyView && canvas) {
    canvas.style.removeProperty("position");
    canvas.style.removeProperty("width");
    canvas.style.removeProperty("height");
  }
}
