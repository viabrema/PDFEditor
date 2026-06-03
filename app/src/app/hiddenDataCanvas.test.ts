import { Window } from "happy-dom";
import { describe, expect, it } from "vitest";
import { computeHiddenDataSurfaceSize, syncHiddenDataCanvasLayout } from "./hiddenDataCanvas";

describe("hiddenDataCanvas", () => {
  it("returns minimum size when there are no blocks", () => {
    expect(computeHiddenDataSurfaceSize([])).toEqual({ width: 640, height: 480 });
  });

  it("expands surface beyond minimum when blocks are large", () => {
    const size = computeHiddenDataSurfaceSize([
      { position: { x: 700, y: 500 }, size: { width: 400, height: 300 } },
    ]);
    expect(size.width).toBe(1148);
    expect(size.height).toBe(848);
  });

  it("syncHiddenDataCanvasLayout toggles canvas classes", () => {
    const window = new Window();
    globalThis.document = window.document;
    const scroll = document.createElement("div");
    const host = document.createElement("div");
    const canvas = document.createElement("div");
    scroll.append(host);

    syncHiddenDataCanvasLayout({ canvasScroll: scroll, canvas }, true);
    expect(scroll.classList.contains("is-hidden-data-view")).toBe(true);
    expect(host.classList.contains("is-hidden-data-canvas-host")).toBe(true);
    expect(canvas.classList.contains("is-hidden-data-canvas")).toBe(true);

    syncHiddenDataCanvasLayout({ canvasScroll: scroll, canvas }, false);
    expect(canvas.style.width).toBe("");
  });
});
