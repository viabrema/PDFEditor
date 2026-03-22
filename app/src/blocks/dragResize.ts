import interact from "interactjs";
import { snapPoint, snapRect } from "../utils/grid";

export function applyDrag({
  position = { x: 0, y: 0 },
  delta = { x: 0, y: 0 },
  gridSize,
  snapEnabled,
} = {} as any) {
  const next = {
    x: position.x + delta.x,
    y: position.y + delta.y,
  };

  return snapPoint(next, gridSize, snapEnabled);
}

export function applyResize({ rect, gridSize, snapEnabled }: any) {
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

function applyResizeStyles(
  block: any,
  element: HTMLElement,
  next: { position: { x: number; y: number }; size: { width: number; height: number } },
) {
  block.position = next.position;
  block.size = next.size;
  element.style.left = `${next.position.x}px`;
  element.style.top = `${next.position.y}px`;
  element.style.width = `${next.size.width}px`;
  element.style.height = `${next.size.height}px`;
}

function hasFullClientRect(er: any): boolean {
  return (
    er &&
    Number.isFinite(er.left) &&
    Number.isFinite(er.top) &&
    Number.isFinite(er.width) &&
    Number.isFinite(er.height)
  );
}

/** Mocks sem `left`+`top` no rect. */
function resizeLayoutFallback(block: any, event: any) {
  const dr = event.deltaRect || {};
  const dl = dr.left ?? 0;
  const dt = dr.top ?? 0;
  const x = block.position.x + dl;
  const y = block.position.y + dt;

  const er = event.rect;
  if (er && Number.isFinite(er.width) && Number.isFinite(er.height)) {
    return {
      x,
      y,
      width: Math.max(1, er.width),
      height: Math.max(1, er.height),
    };
  }

  const dwFromEdges = (dr.right ?? 0) - (dr.left ?? 0);
  const dhFromEdges = (dr.bottom ?? 0) - (dr.top ?? 0);
  const dw = Number.isFinite(dr.width) ? dr.width : dwFromEdges;
  const dh = Number.isFinite(dr.height) ? dr.height : dhFromEdges;

  return {
    x,
    y,
    width: Math.max(1, block.size.width + dw),
    height: Math.max(1, block.size.height + dh),
  };
}

export function setupDragResize({
  element,
  block,
  gridSize,
  snapEnabled,
  onUpdate,
  onInteractionStart,
  interactFactory = interact,
}: any) {
  if (!element || !block) {
    throw new Error("Drag/resize requires element and block.");
  }

  let resizeBaseline: {
    client: { left: number; top: number; width: number; height: number };
    pos: { x: number; y: number };
    size: { width: number; height: number };
  } | null = null;

  function snapResizeEnd() {
    if (!snapEnabled) {
      return;
    }
    const next = applyResize({
      rect: {
        x: block.position.x,
        y: block.position.y,
        width: block.size.width,
        height: block.size.height,
      },
      gridSize,
      snapEnabled: true,
    });
    applyResizeStyles(block, element, next);
    if (onUpdate) {
      onUpdate(block);
    }
  }

  const instance = interactFactory(element)
    .draggable({
      deltaSource: "client",
      listeners: {
        start() {
          onInteractionStart?.();
        },
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
      deltaSource: "client",
      edges: { left: true, right: true, top: true, bottom: true },
      allowFrom: ".resize-handle",
      listeners: {
        start() {
          onInteractionStart?.();
        },
        move(event) {
          const er = event.rect;
          let rect;

          if (hasFullClientRect(er)) {
            if (!resizeBaseline) {
              resizeBaseline = {
                client: { left: er.left, top: er.top, width: er.width, height: er.height },
                pos: { ...block.position },
                size: { ...block.size },
              };
            }
            const b = resizeBaseline;
            rect = {
              x: b.pos.x + (er.left - b.client.left),
              y: b.pos.y + (er.top - b.client.top),
              width: Math.max(1, b.size.width + (er.width - b.client.width)),
              height: Math.max(1, b.size.height + (er.height - b.client.height)),
            };
          } else {
            rect = resizeLayoutFallback(block, event);
          }

          const next = applyResize({ rect, gridSize, snapEnabled: false });
          applyResizeStyles(block, element, next);

          if (onUpdate) {
            onUpdate(block);
          }
        },
        end() {
          resizeBaseline = null;
          snapResizeEnd();
        },
      },
    });

  const setEnabled = (enabled: boolean) => {
    if (instance?.draggable) {
      instance.draggable({ enabled });
    }
    if (instance?.resizable) {
      instance.resizable({ enabled });
    }
  };

  const destroy = () => {
    resizeBaseline = null;
    if (instance?.unset) {
      instance.unset();
    }
  };

  return { destroy, setEnabled };
}
