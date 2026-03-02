import { describe, expect, it, vi } from "vitest";
import { Window } from "happy-dom";
import { applyDrag, applyResize, setupDragResize } from "./dragResize.js";

describe("dragResize", () => {
  it("applies drag with snap", () => {
    const next = applyDrag({
      position: { x: 12, y: 12 },
      delta: { x: 3, y: 9 },
      gridSize: 10,
      snapEnabled: true,
    });

    expect(next).toEqual({ x: 20, y: 20 });
  });

  it("applies drag without snap", () => {
    const next = applyDrag({
      position: { x: 12, y: 12 },
      delta: { x: 3, y: 9 },
      gridSize: 10,
      snapEnabled: false,
    });

    expect(next).toEqual({ x: 15, y: 21 });
  });

  it("applies drag with defaults", () => {
    const next = applyDrag();

    expect(next).toEqual({ x: 0, y: 0 });
  });

  it("applies resize with snap", () => {
    const next = applyResize({
      rect: { x: 12, y: 8, width: 123, height: 47 },
      gridSize: 10,
      snapEnabled: true,
    });

    expect(next).toEqual({
      position: { x: 10, y: 10 },
      size: { width: 120, height: 50 },
    });
  });

  it("applies resize without snap", () => {
    const next = applyResize({
      rect: { x: 12, y: 8, width: 123, height: 47 },
      gridSize: 10,
      snapEnabled: false,
    });

    expect(next).toEqual({
      position: { x: 12, y: 8 },
      size: { width: 123, height: 47 },
    });
  });

  it("applies resize with missing rect", () => {
    const next = applyResize({ rect: null, gridSize: 10, snapEnabled: false });

    expect(next).toEqual({
      position: { x: 0, y: 0 },
      size: { width: 0, height: 0 },
    });
  });

  it("wires interact listeners", () => {
    const window = new Window();
    const element = window.document.createElement("div");
    const block = {
      position: { x: 0, y: 0 },
      size: { width: 100, height: 100 },
    };

    const api = {
      draggable: vi.fn(function (options) {
        api.dragOptions = options;
        return api;
      }),
      resizable: vi.fn(function (options) {
        api.resizeOptions = options;
        return api;
      }),
      unset: vi.fn(),
    };
    const interactFactory = vi.fn(() => api);

    const cleanup = setupDragResize({
      element,
      block,
      gridSize: 10,
      snapEnabled: true,
      interactFactory,
    });

    api.dragOptions.listeners.move({ dx: 5, dy: 5 });
    expect(block.position).toEqual({ x: 10, y: 10 });

    api.resizeOptions.listeners.move({
      rect: { width: 120, height: 90 },
      deltaRect: { left: 0, top: 0 },
    });

    expect(block.size).toEqual({ width: 120, height: 90 });

    cleanup();
    expect(api.unset).toHaveBeenCalledTimes(1);
  });

  it("notifica onUpdate", () => {
    const window = new Window();
    const element = window.document.createElement("div");
    const block = {
      position: { x: 0, y: 0 },
      size: { width: 100, height: 100 },
    };
    const onUpdate = vi.fn();

    const api = {
      draggable: vi.fn(function (options) {
        api.dragOptions = options;
        return api;
      }),
      resizable: vi.fn(function (options) {
        api.resizeOptions = options;
        return api;
      }),
      unset: vi.fn(),
    };
    const interactFactory = vi.fn(() => api);

    const cleanup = setupDragResize({
      element,
      block,
      gridSize: 8,
      snapEnabled: false,
      onUpdate,
      interactFactory,
    });

    api.dragOptions.listeners.move({ dx: 2, dy: 3 });
    api.resizeOptions.listeners.move({
      rect: { width: 120, height: 80 },
      deltaRect: { left: 0, top: 0 },
    });

    expect(onUpdate).toHaveBeenCalledTimes(2);

    cleanup();
  });

  it("ignora cleanup sem unset", () => {
    const window = new Window();
    const element = window.document.createElement("div");
    const block = {
      position: { x: 0, y: 0 },
      size: { width: 100, height: 100 },
    };

    const api = {
      draggable: vi.fn(function () {
        return api;
      }),
      resizable: vi.fn(function () {
        return api;
      }),
    };
    const interactFactory = vi.fn(() => api);

    const cleanup = setupDragResize({
      element,
      block,
      gridSize: 10,
      snapEnabled: true,
      interactFactory,
    });

    cleanup();
  });

  it("throws when missing element", () => {
    expect(() => setupDragResize({})).toThrow(/element/);
  });
});
