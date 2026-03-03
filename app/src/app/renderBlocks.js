import { createEditor, createEditorCommands } from "../editor/editor.js";
import { createToolbar } from "../ui/toolbar.js";
import { createBlockElement } from "../blocks/blockRenderer.js";
import { setupDragResize } from "../blocks/dragResize.js";

export function renderBlocksInContainer({
  container,
  blocks,
  state,
  documentData,
  pageId,
  region,
  requestRender,
}) {
  function mountFloatingToolbar({ element, toolbar }) {
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

  blocks.forEach((block) => {
    const isSelected = block.id === state.selectedBlockId;
    const isEditing = block.id === state.editingBlockId;
    const { element, editorHost } = createBlockElement(block, {
      selected: isSelected,
      editing: isEditing,
    });
    container.append(element);

    if (isEditing && block.type === "table") {
      const toolbar = createToolbar(null, { disabled: true });
      state.interactions.push(
        mountFloatingToolbar({
          element,
          toolbar,
        })
      );
    }

    element.addEventListener("click", (event) => {
      event.stopPropagation();
      state.activePageId = pageId;
      state.activeRegion = region;
      const nextSelected = block.id;
      const nextEditing =
        state.editingBlockId && state.editingBlockId !== block.id
          ? null
          : state.editingBlockId;
      const shouldRender =
        state.selectedBlockId !== nextSelected ||
        state.editingBlockId !== nextEditing;
      state.selectedBlockId = nextSelected;
      state.editingBlockId = nextEditing;
      if (shouldRender) {
        requestRender();
      }
    });

    element.addEventListener("dblclick", (event) => {
      event.stopPropagation();
      if (block.type === "image") {
        return;
      }
      state.activePageId = pageId;
      state.activeRegion = region;
      const shouldRender =
        state.editingBlockId !== block.id || state.selectedBlockId !== block.id;
      state.selectedBlockId = block.id;
      state.editingBlockId = block.id;
      if (shouldRender) {
        requestRender();
      }
    });

    if (editorHost) {
      const view = createEditor({
        mount: editorHost,
        content: block.content || undefined,
        editable: () => block.id === state.editingBlockId,
        onChange: (nextState) => {
          block.content = nextState.doc.toJSON();
        },
      });
      state.views.push(view);

      if (isEditing) {
        const toolbar = createToolbar(createEditorCommands(view));
        state.interactions.push(
          mountFloatingToolbar({
            element,
            toolbar,
          })
        );
      }
    }

    const interaction = setupDragResize({
      element,
      block,
      gridSize: documentData.grid.size,
      snapEnabled: documentData.grid.snap,
    });
    interaction.setEnabled(!isEditing);
    state.interactions.push(interaction);
  });
}
