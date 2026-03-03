import { useEffect, useRef } from "react";
import { createBlock } from "../blocks/blockModel.js";
import {
  buildClipboardPayload,
  parseClipboardPayload,
  serializeClipboardPayload,
} from "./clipboard.js";
import { getNextBlockPosition, getPageSize, getRegionSize } from "./textUtils.js";

export function useBlockClipboard({ documentRef, blocksRef, stateRef, render }) {
  const clipboardRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = async (event) => {
      const state = stateRef.current;
      if (!state || state.editingBlockId) {
        return;
      }
      const target = event.target;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target?.isContentEditable
      ) {
        return;
      }
      const isMeta = event.metaKey || event.ctrlKey;
      if (!isMeta) {
        return;
      }
      if (event.key.toLowerCase() === "c") {
        const selected = blocksRef.current.find(
          (block) => block.id === state.selectedBlockId
        );
        if (!selected) {
          return;
        }
        const payload = buildClipboardPayload(selected);
        if (!payload) {
          return;
        }
        clipboardRef.current = payload;
        const text = serializeClipboardPayload(payload);
        if (text && navigator.clipboard?.writeText) {
          try {
            await navigator.clipboard.writeText(text);
          } catch (error) {
            // ignore clipboard write failures
          }
        }
        return;
      }
      if (event.key.toLowerCase() === "v") {
        let payload = clipboardRef.current;
        if (!payload && navigator.clipboard?.readText) {
          try {
            const text = await navigator.clipboard.readText();
            payload = parseClipboardPayload(text);
          } catch (error) {
            payload = null;
          }
        }
        if (!payload) {
          return;
        }
        event.preventDefault();

        const documentData = documentRef.current;
        const blocks = blocksRef.current;
        const region = state.activeRegion || "body";
        const isBody = region === "body";
        const blocksForRegion = blocks.filter((block) => {
          const matchesLanguage = block.languageId === state.activeLanguageId;
          if (!matchesLanguage) {
            return false;
          }
          if (isBody) {
            return (
              block.pageId === state.activePageId &&
              block.metadata?.region !== "header" &&
              block.metadata?.region !== "footer"
            );
          }
          return block.metadata?.region === region;
        });

        const regionSize = isBody
          ? getPageSize(documentData.page.format, documentData.page.orientation)
          : getRegionSize({ documentData, region });

        const blockSize = payload.size || { width: 320, height: 160 };
        const position = getNextBlockPosition({
          blocksForPage: blocksForRegion,
          blockSize,
          pageSize: regionSize,
        });

        const metadata = isBody ? {} : { region };
        const newBlock = createBlock({
          type: payload.type || "text",
          content: payload.content,
          size: blockSize,
          position,
          pageId: isBody ? state.activePageId : null,
          languageId: state.activeLanguageId,
          metadata,
        });
        blocks.push(newBlock);
        state.selectedBlockId = newBlock.id;
        state.editingBlockId = newBlock.type === "text" ? newBlock.id : null;
        render();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [blocksRef, documentRef, render, stateRef]);
}
