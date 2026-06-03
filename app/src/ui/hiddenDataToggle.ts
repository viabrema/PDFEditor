export function appendHiddenDataToggleButton(
  parent: HTMLElement,
  options: {
    hiddenValue?: boolean;
    disabled?: boolean;
    onToggleHidden?: (hidden: boolean) => void;
  },
) {
  const { hiddenValue = false, disabled = false, onToggleHidden } = options;
  if (!onToggleHidden) {
    return;
  }

  const btn = document.createElement("button");
  btn.type = "button";
  btn.dataset.action = "toggle-hidden";
  btn.className = hiddenValue
    ? "toolbar-icon-button shrink-0 rounded-md bg-slate-900 text-white shadow-sm"
    : "toolbar-icon-button shrink-0 rounded-md border border-slate-300 bg-white text-slate-700 shadow-sm hover:border-slate-400";
  btn.title = hiddenValue ? "Desmarcar dado oculto" : "Marcar como dado oculto";
  btn.setAttribute("aria-label", btn.title);
  btn.innerHTML = hiddenValue
    ? `<i data-lucide="eye-off"></i>`
    : `<i data-lucide="eye"></i>`;
  if (disabled) {
    btn.disabled = true;
    btn.classList.add("opacity-40", "cursor-not-allowed");
  }
  btn.addEventListener("click", () => onToggleHidden(!hiddenValue));
  parent.append(btn);
}
