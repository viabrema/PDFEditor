import interact from "interactjs";

export function setupRegionResize({
  element,
  region,
  documentData,
  pageSize,
  coordinateScale = 1,
  onFinish,
  interactFactory = interact,
}) {
  const s = coordinateScale > 0 ? coordinateScale : 1;
  const isHeader = region === "header";
  const minHeight = 40;
  const maxHeight = Math.max(minHeight, Math.floor(pageSize.height * 0.4));

  const instance = interactFactory(element).resizable({
    edges: { top: !isHeader, bottom: isHeader, left: false, right: false },
    allowFrom: ".region-resize-handle",
    listeners: {
      move(event) {
        const nextHeight = Math.max(
          minHeight,
          Math.min(maxHeight, event.rect.height / s)
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
