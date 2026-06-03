export function getPropertiesPanelBlock(
  state: { editingBlockId?: string | null; selectedBlockIds?: string[] },
  blocks: { id: string; type?: string }[],
) {
  const ids = state.selectedBlockIds || [];
  if (ids.length === 1) {
    const selected = blocks.find((b) => b.id === ids[0]);
    if (selected) {
      return selected;
    }
  }
  if (state.editingBlockId) {
    return blocks.find((b) => b.id === state.editingBlockId) ?? null;
  }
  return null;
}

export function propertiesPanelMode(
  state: { editingBlockId?: string | null; selectedBlockIds?: string[] },
  blocks: { id: string; type?: string }[],
): "page" | "block" | "multi" {
  if (getPropertiesPanelBlock(state, blocks)) {
    return "block";
  }
  if ((state.selectedBlockIds || []).length > 1) {
    return "multi";
  }
  return "page";
}
