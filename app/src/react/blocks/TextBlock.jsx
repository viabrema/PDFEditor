import React, { useEffect, useRef } from "react";
import {
  MDXEditor,
  headingsPlugin,
  listsPlugin,
  quotePlugin,
  markdownShortcutPlugin,
  toolbarPlugin,
  BoldItalicUnderlineToggles,
  BlockTypeSelect,
  ListsToggle,
} from "@mdxeditor/editor";
import { setMarkdownAlignment } from "../../app/aiMarkdown.js";

export function TextBlock({ block, isEditing, onUpdate, onStartEditing }) {
  const containerRef = useRef(null);

  return (
    <div
      ref={containerRef}
      className="prose-editor h-full w-full p-3"
      onFocusCapture={() => {
        if (!isEditing && onStartEditing) {
          onStartEditing();
        }
      }}
    >
      <MDXEditor
        markdown={block.content || ""}
        onChange={(value) => {
          block.content = value;
          onUpdate();
        }}
        readOnly={!isEditing}
        plugins={[
          headingsPlugin(),
          listsPlugin(),
          quotePlugin(),
          markdownShortcutPlugin(),
          toolbarPlugin({
            toolbarClassName: isEditing ? "block-toolbar-floating" : "mdxeditor-toolbar-hidden",
            toolbarContents: () => (
              <>
                <BlockTypeSelect />
                <BoldItalicUnderlineToggles />
                <ListsToggle />
                <div className="mdxeditor-toolbar-divider" />
                <button
                  type="button"
                  className="mdxeditor-toolbar-button"
                  title="Alinhar a esquerda"
                  aria-label="Alinhar a esquerda"
                  onClick={() => {
                    block.content = setMarkdownAlignment(block.content || "", "left");
                    onUpdate();
                  }}
                >
                  L
                </button>
                <button
                  type="button"
                  className="mdxeditor-toolbar-button"
                  title="Centralizar"
                  aria-label="Centralizar"
                  onClick={() => {
                    block.content = setMarkdownAlignment(block.content || "", "center");
                    onUpdate();
                  }}
                >
                  C
                </button>
                <button
                  type="button"
                  className="mdxeditor-toolbar-button"
                  title="Alinhar a direita"
                  aria-label="Alinhar a direita"
                  onClick={() => {
                    block.content = setMarkdownAlignment(block.content || "", "right");
                    onUpdate();
                  }}
                >
                  R
                </button>
              </>
            ),
          }),
        ]}
      />
    </div>
  );
}
