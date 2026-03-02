export function createToolbar(commands) {
  const container = document.createElement("div");
  container.className = "flex flex-wrap gap-2";

  const items = [
    { id: "bold", label: "Negrito", action: commands.toggleBold },
    { id: "italic", label: "Italico", action: commands.toggleItalic },
    { id: "bullet", label: "Lista", action: commands.toggleBulletList },
    { id: "ordered", label: "Numerada", action: commands.toggleOrderedList },
  ];

  items.forEach((item) => {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.action = item.id;
    button.className =
      "rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:border-slate-400";
    button.textContent = item.label;
    button.addEventListener("click", () => item.action && item.action());
    container.append(button);
  });

  return container;
}
