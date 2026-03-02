export function createToolbar(commands, options = {}) {
  const { disabled = false } = options;
  const container = document.createElement("div");
  container.className = "flex flex-wrap gap-2";

  const items = [
    { id: "bold", label: "Negrito", icon: "bold", action: commands?.toggleBold },
    { id: "italic", label: "Italico", icon: "italic", action: commands?.toggleItalic },
    { id: "bullet", label: "Lista", icon: "list", action: commands?.toggleBulletList },
    {
      id: "ordered",
      label: "Numerada",
      icon: "list-ordered",
      action: commands?.toggleOrderedList,
    },
  ];

  items.forEach((item) => {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.action = item.id;
    button.className =
      "toolbar-icon-button rounded-md border border-slate-300 bg-white text-slate-700 shadow-sm hover:border-slate-400";
    button.title = item.label;
    button.setAttribute("aria-label", item.label);
    if (disabled) {
      button.disabled = true;
      button.classList.add("opacity-40", "cursor-not-allowed");
    }
    button.innerHTML = `<i data-lucide="${item.icon}"></i>`;
    button.addEventListener("click", () => item.action && item.action());
    container.append(button);
  });

  return container;
}
