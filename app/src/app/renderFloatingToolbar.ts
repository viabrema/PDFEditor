export type FloatingToolbarHandle = { destroy(): void; setEnabled(): void };

export function attachFloatingBlockToolbar(
  element: HTMLElement,
  toolbar: HTMLElement,
): FloatingToolbarHandle {
  toolbar.classList.add("block-toolbar-floating");
  document.body.append(toolbar);

  const positionToolbar = () => {
    const rect = element.getBoundingClientRect();
    const toolbarRect = toolbar.getBoundingClientRect();
    const offset = 8;
    let top = rect.top - toolbarRect.height - offset;
    if (top < offset) {
      top = rect.bottom + offset;
    }
    let left = rect.left + 12;
    if (left + toolbarRect.width > window.innerWidth - offset) {
      left = Math.max(offset, window.innerWidth - toolbarRect.width - offset);
    }
    toolbar.style.top = `${top}px`;
    toolbar.style.left = `${left}px`;
  };

  positionToolbar();
  const frame = window.requestAnimationFrame(positionToolbar);
  window.addEventListener("scroll", positionToolbar, true);
  window.addEventListener("resize", positionToolbar);

  return {
    destroy() {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", positionToolbar, true);
      window.removeEventListener("resize", positionToolbar);
      toolbar.remove();
    },
    setEnabled() {},
  };
}
