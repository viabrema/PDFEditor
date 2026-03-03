import React, { useEffect, useRef } from "react";
import { setupDragResize } from "../../blocks/dragResize.js";
import { TextBlock } from "./TextBlock.jsx";
import { TableBlock } from "./TableBlock.jsx";
import { ImageBlock } from "./ImageBlock.jsx";

export function BlockShell({ block, documentData, state, onUpdate, pageId, region }) {
  const elementRef = useRef(null);
  const isSelected = block.id === state.selectedBlockId;
  const isEditing = block.id === state.editingBlockId;

  const startEditing = () => {
    if (block.type === "image") {
      return;
    }
    const shouldRender =
      state.editingBlockId !== block.id || state.selectedBlockId !== block.id;
    state.activePageId = pageId;
    state.activeRegion = region;
    state.selectedBlockId = block.id;
    state.editingBlockId = block.id;
    if (shouldRender) {
      onUpdate();
    }
  };

  useEffect(() => {
    if (!elementRef.current) {
      return undefined;
    }
    const interaction = setupDragResize({
      element: elementRef.current,
      block,
      gridSize: documentData.grid.size,
      snapEnabled: documentData.grid.snap,
      onUpdate: onUpdate,
    });
    interaction.setEnabled(!isEditing);
    return () => interaction.destroy();
  }, [block, documentData.grid.size, documentData.grid.snap, isEditing, onUpdate]);

  return (
    <div
      ref={elementRef}
      className={`block-shell absolute rounded-md border border-slate-200 bg-white shadow-sm${
        isSelected ? " is-selected" : ""
      }${isEditing ? " is-editing" : ""}`}
      data-block-id={block.id}
      style={{
        left: `${block.position.x}px`,
        top: `${block.position.y}px`,
        width: `${block.size.width}px`,
        height: `${block.size.height}px`,
      }}
      onClick={(event) => {
        event.stopPropagation();
        state.activePageId = pageId;
        state.activeRegion = region;
        const nextSelected = block.id;
        const nextEditing =
          state.editingBlockId && state.editingBlockId !== block.id
            ? null
            : state.editingBlockId;
        const shouldRender =
          state.selectedBlockId !== nextSelected || state.editingBlockId !== nextEditing;
        state.selectedBlockId = nextSelected;
        state.editingBlockId = nextEditing;
        if (shouldRender) {
          onUpdate();
        }
      }}
      onDoubleClick={(event) => {
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
          onUpdate();
        }
      }}
    >
      {block.type === "image" && <ImageBlock block={block} />}
      {block.type === "table" && (
        <TableBlock block={block} isEditing={isEditing} onUpdate={onUpdate} />
      )}
      {block.type !== "image" && block.type !== "table" && (
        <TextBlock
          block={block}
          isEditing={isEditing}
          onUpdate={onUpdate}
          onStartEditing={startEditing}
        />
      )}
      {isSelected && (
        <>
          <span className="resize-handle" data-corner="nw"></span>
          <span className="resize-handle" data-corner="ne"></span>
          <span className="resize-handle" data-corner="se"></span>
          <span className="resize-handle" data-corner="sw"></span>
        </>
      )}
    </div>
  );
}
