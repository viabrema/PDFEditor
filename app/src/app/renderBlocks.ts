import { createEditor, createEditorCommands } from "../editor/editor";
import { createToolbar } from "../ui/toolbar";
import { createBlockElement } from "../blocks/blockRenderer";
import { setupDragResize } from "../blocks/dragResize";
import { fileToDataUrl } from "../blocks/imageBlock";
import { getBlockTextStyle } from "../blocks/blockStyles";

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
    if (block.type === "title" || block.type === "subtitle") {
      block.metadata = {
        ...(block.metadata || {}),
        headingLevel: block.type === "subtitle" ? 2 : 1,
      };
      block.type = "heading";
    }
    const isSelected = block.id === state.selectedBlockId;
    const isEditing = block.id === state.editingBlockId;
    const { element, editorHost } = createBlockElement(block, {
      selected: isSelected,
      editing: isEditing,
    });
    container.append(element);

    if (isEditing && block.type === "table") {
      const toolbar = createToolbar(null, { disabled: true, variant: "table" });
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
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.addEventListener("change", async () => {
          const file = input.files?.[0];
          if (!file) {
            return;
          }
          try {
            const src = await fileToDataUrl(file);
            block.content = { ...(block.content || {}), src };
            requestRender();
          } catch (error) {
            // ignore file errors
          }
        });
        input.click();
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

      const applyBlockStyles = () => {
        const style = getBlockTextStyle(block);
        const target = (editorHost.querySelector(".ProseMirror") || editorHost) as HTMLElement;
        target.style.fontSize = style.fontSize;
        target.style.fontFamily = style.fontFamily;
        target.style.fontWeight = style.fontWeight;
        target.style.color = style.color;
        target.style.textAlign = style.textAlign;
      };
      applyBlockStyles();

      if (isEditing) {
        const isHeading = block.type === "heading";
        const headingLevel =
          Number(block.metadata?.headingLevel ?? block.metadata?.level) || 1;
        const toolbar = createToolbar(createEditorCommands(view), {
          variant: isHeading ? "heading" : "text",
          alignValue: block.metadata?.align || "left",
          fontFamilyValue: block.metadata?.fontFamily || "Segoe UI",
          fontSizeValue: block.metadata?.fontSize || getBlockTextStyle(block).fontSize,
          headingLevelValue: Math.min(3, Math.max(1, headingLevel)),
          onAlignChange: (align) => {
            block.metadata = { ...(block.metadata || {}), align };
            applyBlockStyles();
            requestRender();
          },
          onFontFamilyChange: (fontFamily) => {
            block.metadata = { ...(block.metadata || {}), fontFamily };
            applyBlockStyles();
            requestRender();
          },
          onFontSizeChange: (fontSize) => {
            block.metadata = { ...(block.metadata || {}), fontSize };
            applyBlockStyles();
            requestRender();
          },
          onHeadingLevelChange: (level) => {
            block.metadata = { ...(block.metadata || {}), headingLevel: level };
            applyBlockStyles();
            requestRender();
          },
        });
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
