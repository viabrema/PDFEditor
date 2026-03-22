import interact from "interactjs";

export function setupRegionResize({
  element,
  region,
  documentData,
  pageSize,
  onFinish,
  onResizeStart,
  interactFactory = interact,
}) {
  const isHeader = region === "header";
  const minHeight = 40;
  const maxHeight = Math.max(minHeight, Math.floor(pageSize.height * 0.4));

  const instance = interactFactory(element).resizable({
    edges: { top: !isHeader, bottom: isHeader, left: false, right: false },
    allowFrom: ".region-resize-handle",
    listeners: {
      start() {
        onResizeStart?.();
      },
      move(event) {
        const nextHeight = Math.max(
          minHeight,
          Math.min(maxHeight, event.rect.height),
        );
        if (!documentData.regions) {
          documentData.regions = { header: { enabled: true }, footer: { enabled: true } };
        }
        if (isHeader) {
          documentData.regions.header = {
            ...documentData.regions.header,
            height: nextHeight,
          };
        } else {
          documentData.regions.footer = {
            ...documentData.regions.footer,
            height: nextHeight,
          };
        }
        element.style.height = `${nextHeight}px`;
      },
      end() {
        if (onFinish) {
          onFinish();
        }
      },
    },
  });

  const destroy = () => {
    if (instance?.unset) {
      instance.unset();
    }
  };

  return { destroy };
}
