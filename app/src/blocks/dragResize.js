import interact from "interactjs";
import { snapPoint, snapRect } from "../utils/grid.js";

export function applyDrag({
  position = { x: 0, y: 0 },
  delta = { x: 0, y: 0 },
  gridSize,
  snapEnabled,
} = /** @type {any} */ ({})) {
  const next = {
    x: position.x + delta.x,
    y: position.y + delta.y,
  };

  return snapPoint(next, gridSize, snapEnabled);
}

export function applyResize({ rect, gridSize, snapEnabled }) {
  const safeRect = {
    x: rect?.x ?? 0,
    y: rect?.y ?? 0,
    width: rect?.width ?? 0,
    height: rect?.height ?? 0,
  };

  const snapped = snapRect(safeRect, gridSize, snapEnabled);
  return {
    position: { x: snapped.x, y: snapped.y },
    size: { width: snapped.width, height: snapped.height },
  };
}

export function setupDragResize({
  element,
  block,
  gridSize,
  snapEnabled,
  onUpdate,
  interactFactory = interact,
}) {
  if (!element || !block) {
    throw new Error("Drag/resize requires element and block.");
  }

  const instance = interactFactory(element)
    .draggable({
      listeners: {
        move(event) {
          const nextPosition = applyDrag({
            position: block.position,
            delta: { x: event.dx, y: event.dy },
            gridSize,
            snapEnabled: false,
          });

          block.position = nextPosition;
          element.style.left = `${nextPosition.x}px`;
          element.style.top = `${nextPosition.y}px`;

          if (onUpdate) {
            onUpdate(block);
          }
        },
        end() {
          if (!snapEnabled) {
            return;
          }

          const snapped = snapPoint(block.position, gridSize, true);
          block.position = snapped;
          element.style.left = `${snapped.x}px`;
          element.style.top = `${snapped.y}px`;

          if (onUpdate) {
            onUpdate(block);
          }
        },
      },
    })
    .resizable({
      edges: { left: true, right: true, top: true, bottom: true },
      allowFrom: ".resize-handle",
      listeners: {
        move(event) {
          const rect = {
            x: block.position.x + event.deltaRect.left,
            y: block.position.y + event.deltaRect.top,
            width: event.rect.width,
            height: event.rect.height,
          };

          const next = applyResize({ rect, gridSize, snapEnabled });
          block.position = next.position;
          block.size = next.size;

          element.style.left = `${next.position.x}px`;
          element.style.top = `${next.position.y}px`;
          element.style.width = `${next.size.width}px`;
          element.style.height = `${next.size.height}px`;

          if (onUpdate) {
            onUpdate(block);
          }
        },
      },
    });

  const setEnabled = (enabled) => {
    if (instance?.draggable) {
      instance.draggable({ enabled });
    }
    if (instance?.resizable) {
      instance.resizable({ enabled });
    }
  };

  const destroy = () => {
    if (instance?.unset) {
      instance.unset();
    }
  };

  return { destroy, setEnabled };
}
