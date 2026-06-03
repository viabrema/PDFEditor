import { createIcons, icons } from "lucide";

/** Converte `<i data-lucide>` em SVG; usar apos injetar HTML na sidebar ou toolbar. */
export function hydrateLucideIcons(root?: Element | null) {
  if (root) {
    createIcons({ icons, root });
    return;
  }
  createIcons({ icons });
}
