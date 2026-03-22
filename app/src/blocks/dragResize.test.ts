import { describe, expect, it, vi } from "vitest";
import { Window } from "happy-dom";
import { applyDrag, applyResize, setupDragResize } from "./dragResize";

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

    const interaction = setupDragResize({
      element,
      block,
      gridSize: 10,
      snapEnabled: true,
      interactFactory,
    });

    api.dragOptions.listeners.move({ dx: 5, dy: 5 });
    expect(block.position).toEqual({ x: 5, y: 5 });
    api.dragOptions.listeners.end();
    expect(block.position).toEqual({ x: 10, y: 10 });

    api.resizeOptions.listeners.move({
      rect: { width: 120, height: 90 },
      deltaRect: { left: 0, top: 0 },
    });

    expect(block.size).toEqual({ width: 120, height: 90 });

    interaction.setEnabled(false);
    expect(api.draggable).toHaveBeenCalledWith({ enabled: false });
    expect(api.resizable).toHaveBeenCalledWith({ enabled: false });

    interaction.setEnabled(true);
    expect(api.draggable).toHaveBeenCalledWith({ enabled: true });
    expect(api.resizable).toHaveBeenCalledWith({ enabled: true });

    interaction.destroy();
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

    const interaction = setupDragResize({
      element,
      block,
      gridSize: 8,
      snapEnabled: false,
      onUpdate,
      interactFactory,
    });

    api.dragOptions.listeners.move({ dx: 2, dy: 3 });
    api.dragOptions.listeners.end();
    api.resizeOptions.listeners.move({
      rect: { width: 120, height: 80 },
      deltaRect: { left: 0, top: 0 },
    });

    expect(onUpdate).toHaveBeenCalledTimes(2);

    interaction.destroy();
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

    const interaction = setupDragResize({
      element,
      block,
      gridSize: 10,
      snapEnabled: true,
      interactFactory,
    });

    interaction.destroy();
  });

  it("nao aplica snap quando desativado", () => {
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
      resizable: vi.fn(function () {
        return api;
      }),
      unset: vi.fn(),
    };
    const interactFactory = vi.fn(() => api);

    const interaction = setupDragResize({
      element,
      block,
      gridSize: 10,
      snapEnabled: false,
      interactFactory,
    });

    api.dragOptions.listeners.move({ dx: 6, dy: 7 });
    api.dragOptions.listeners.end();

    expect(block.position).toEqual({ x: 6, y: 7 });

    interaction.destroy();
  });

  it("notifica onUpdate no fim do drag com snap ativo", () => {
    const window = new Window();
    const element = window.document.createElement("div");
    const block = {
      position: { x: 2, y: 2 },
      size: { width: 100, height: 100 },
    };
    const onUpdate = vi.fn();

    const api = {
      draggable: vi.fn(function (options) {
        api.dragOptions = options;
        return api;
      }),
      resizable: vi.fn(function () {
        return api;
      }),
      unset: vi.fn(),
    };
    const interactFactory = vi.fn(() => api);

    const interaction = setupDragResize({
      element,
      block,
      gridSize: 10,
      snapEnabled: true,
      onUpdate,
      interactFactory,
    });

    api.dragOptions.listeners.end();

    expect(onUpdate).toHaveBeenCalledTimes(1);

    interaction.destroy();
  });

  it("setEnabled ignora instancia sem apis", () => {
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

    const interaction = setupDragResize({
      element,
      block,
      gridSize: 10,
      snapEnabled: true,
      interactFactory,
    });

    api.draggable = null;
    api.resizable = null;
    interaction.setEnabled(false);
    interaction.destroy();
  });

  it("throws when missing element", () => {
    expect(() => setupDragResize({})).toThrow(/element/);
  });

  it("drag usa deltas em px de cliente sem conversao (ex.: zoom CSS)", () => {
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

    const interaction = setupDragResize({
      element,
      block,
      gridSize: 10,
      snapEnabled: false,
      interactFactory,
    });

    api.dragOptions.listeners.move({ dx: 10, dy: 6 });
    expect(block.position).toEqual({ x: 10, y: 6 });

    api.resizeOptions.listeners.move({
      rect: { width: 200, height: 100 },
      deltaRect: { left: 0, top: 0 },
    });
    expect(block.size).toEqual({ width: 200, height: 100 });

    interaction.destroy();
  });

  it("resize incremental com deltaRect (dois passos)", () => {
    const window = new Window();
    const element = window.document.createElement("div");
    const block = {
      position: { x: 10, y: 20 },
      size: { width: 100, height: 80 },
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

    const interaction = setupDragResize({
      element,
      block,
      gridSize: 10,
      snapEnabled: false,
      interactFactory,
    });

    api.resizeOptions.listeners.move({
      deltaRect: { left: 0, top: 0, right: 20, bottom: 0, width: 20, height: 0 },
    });
    expect(block.size).toEqual({ width: 120, height: 80 });

    api.resizeOptions.listeners.move({
      deltaRect: { left: 0, top: 0, right: 0, bottom: 20, width: 0, height: 20 },
    });
    expect(block.size).toEqual({ width: 120, height: 100 });

    interaction.destroy();
  });

  it("resize com rect completo: baseline 1:1 sem salto inicial", () => {
    const window = new Window();
    const element = window.document.createElement("div");
    const block = {
      position: { x: 10, y: 20 },
      size: { width: 100, height: 80 },
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

    const interaction = setupDragResize({
      element,
      block,
      gridSize: 10,
      snapEnabled: false,
      interactFactory,
    });

    api.resizeOptions.listeners.move({
      rect: { left: 100, top: 200, width: 100, height: 80 },
    });
    expect(block.position).toEqual({ x: 10, y: 20 });
    expect(block.size).toEqual({ width: 100, height: 80 });

    api.resizeOptions.listeners.move({
      rect: { left: 100, top: 200, width: 120, height: 80 },
    });
    expect(block.size.width).toBe(120);

    api.resizeOptions.listeners.move({
      rect: { left: 110, top: 200, width: 110, height: 80 },
    });
    expect(block.position.x).toBe(20);
    expect(block.size.width).toBe(110);

    interaction.destroy();
  });
});
