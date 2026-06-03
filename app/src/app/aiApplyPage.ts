import { createBlock } from "../blocks/blockModel";
import { createChartBlock } from "../blocks/chartBlock";
import { normalizePosition, normalizeSize } from "./aiLayout";
import { buildTextDocFromString } from "./textUtils";
import { buildTextDocFromMarkdown, looksLikeMarkdownList } from "./aiMarkdownParser";
import {
  buildChartBlockContentFromAiAction,
  mergeChartBlockFromAiUpdate,
} from "./aiChartFromAction";
import { parseAiJson, tableRowsFromAiAction } from "./aiApplyParsing";
import { applyTextStyleToDoc, applyBlockFormatToDoc } from "./aiApplyDocFormat";

function resolvePageIdForAi(actionPageId: unknown, documentData: any, state: any) {
  const pages = documentData?.pages;
  if (Array.isArray(pages) && typeof actionPageId === "string" && pages.some((p) => p.id === actionPageId)) {
    return actionPageId;
  }
  return state.activePageId;
}

function regionMetadataForCreate(region: unknown) {
  if (region === "header" || region === "footer") {
    return { region };
  }
  return {};
}

function isTextualBlockType(type: string) {
  return (
    type === "text" ||
    type === "heading" ||
    type === "title" ||
    type === "subtitle"
  );
}

export function applyAiResultToPage({
  resultText,
  blocks,
  state,
  documentData,
  onBeforeMutations,
}: {
  resultText: string;
  blocks: any[];
  state: any;
  documentData: any;
  onBeforeMutations?: () => void;
}) {
  const parsed = parseAiJson(resultText);
  try {
    const actions = Array.isArray(parsed?.actions) ? parsed.actions : [];
    if (actions.length === 0) {
      return false;
    }

    onBeforeMutations?.();

    const byId = new Map(blocks.map((block) => [block.id, block]));
    actions.forEach((action) => {
      if (!action || typeof action !== "object") {
        return;
      }
      if (action.type === "delete" && action.id) {
        const index = blocks.findIndex((block) => block.id === action.id);
        if (index >= 0) {
          blocks.splice(index, 1);
          byId.delete(action.id);
        }
        return;
      }
      if (action.type === "update" && action.id) {
        const target = byId.get(action.id) as any;
        if (!target) {
          return;
        }
        const nextPosition = normalizePosition(action.position);
        if (nextPosition) {
          target.position = {
            x: nextPosition.x,
            y: nextPosition.y,
          };
        }
        const nextSize = normalizeSize(action.size);
        if (nextSize) {
          target.size = {
            width: nextSize.width,
            height: nextSize.height,
          };
        }
        const nextPageId = resolvePageIdForAi(action.pageId, documentData, state);
        if (typeof action.pageId === "string" && nextPageId === action.pageId) {
          target.pageId = nextPageId;
        }

        if (target.type === "chart") {
          target.content = mergeChartBlockFromAiUpdate(
            target,
            action as Record<string, unknown>,
            blocks,
          ) as any;
          return;
        }

        if (target.type === "table" || target.type === "linkedTable") {
          const normalized = tableRowsFromAiAction(action);
          if (normalized) {
            target.content = { ...(target.content || {}), rows: normalized };
          }
          if (typeof (action as { excludeFromPdfExport?: unknown }).excludeFromPdfExport === "boolean") {
            target.metadata = {
              ...(target.metadata || {}),
              excludeFromPdfExport: (action as { excludeFromPdfExport: boolean }).excludeFromPdfExport,
            };
          }
          return;
        }

        if (target.type === "image") {
          if (typeof action.imageSrc === "string") {
            target.content = { ...(target.content || {}), src: action.imageSrc };
          }
          return;
        }

        if (isTextualBlockType(target.type)) {
          if (typeof action.contentText === "string") {
            target.content = looksLikeMarkdownList(action.contentText)
              ? buildTextDocFromMarkdown(action.contentText)
              : buildTextDocFromString(action.contentText);
          }
          if (action.textStyle && typeof action.textStyle === "object") {
            const ts = action.textStyle as Record<string, unknown>;
            if (ts.fontFamily) {
              target.metadata = { ...(target.metadata || {}), fontFamily: String(ts.fontFamily) };
            }
            if (ts.fontSize) {
              target.metadata = { ...(target.metadata || {}), fontSize: String(ts.fontSize) };
            }
            const inlineStyle = {
              bold: ts.bold,
              italic: ts.italic,
            };
            target.content = applyTextStyleToDoc(target.content, inlineStyle);
          }
          if (action.blockFormat && typeof action.blockFormat === "object") {
            const bf = action.blockFormat as Record<string, unknown>;
            if (typeof bf.textAlign === "string") {
              target.metadata = { ...(target.metadata || {}), align: bf.textAlign };
            }
            const format = { ...bf };
            if (format.textAlign) {
              delete format.textAlign;
            }
            target.content = applyBlockFormatToDoc(target.content, format);
          }
        }
        return;
      }
      if (action.type === "create" && action.blockType) {
        const pageId = resolvePageIdForAi(action.pageId, documentData, state);
        const meta: Record<string, unknown> = { ...regionMetadataForCreate(action.region) };
        if ((action as { excludeFromPdfExport?: unknown }).excludeFromPdfExport === true) {
          meta.excludeFromPdfExport = true;
        }

        if (action.blockType === "table") {
          const normalized = tableRowsFromAiAction(action);
          if (!normalized) {
            return;
          }
          const newBlock = createBlock({
            type: "table",
            content: { rows: normalized },
            position: normalizePosition(action.position) || { x: 32, y: 32 },
            size: normalizeSize(action.size) || { width: 320, height: 200 },
            pageId,
            languageId: state.activeLanguageId,
            metadata: meta,
          });
          blocks.push(newBlock);
          byId.set(newBlock.id, newBlock);
          return;
        }

        if (action.blockType === "chart") {
          const act = action as Record<string, unknown>;
          const content = buildChartBlockContentFromAiAction(act, blocks);
          const newBlock = createChartBlock({
            position: normalizePosition(action.position) || { x: 32, y: 32 },
            pageId,
            languageId: state.activeLanguageId,
            metadata: meta,
          });
          const sz = normalizeSize(action.size);
          if (sz) {
            newBlock.size = { width: sz.width, height: sz.height };
          }
          newBlock.content = content as any;
          blocks.push(newBlock);
          byId.set(newBlock.id, newBlock);
          return;
        }

        if (action.blockType === "image") {
          const src = typeof action.imageSrc === "string" ? action.imageSrc : "";
          if (!src.trim()) {
            return;
          }
          const newBlock = createBlock({
            type: "image",
            content: { src },
            position: normalizePosition(action.position) || { x: 32, y: 32 },
            size: normalizeSize(action.size) || { width: 240, height: 180 },
            pageId,
            languageId: state.activeLanguageId,
            metadata: meta,
          });
          blocks.push(newBlock);
          byId.set(newBlock.id, newBlock);
          return;
        }

        if (
          (action.blockType === "text" ||
            action.blockType === "heading" ||
            action.blockType === "title" ||
            action.blockType === "subtitle") &&
          typeof action.contentText === "string"
        ) {
          const headingLevel = Number(action.headingLevel) || 1;
          const type = action.blockType === "heading" ? "heading" : action.blockType;
          const newBlock = createBlock({
            type,
            content: looksLikeMarkdownList(action.contentText)
              ? buildTextDocFromMarkdown(action.contentText)
              : buildTextDocFromString(action.contentText),
            position: normalizePosition(action.position) || { x: 32, y: 32 },
            size: normalizeSize(action.size) || { width: 320, height: 160 },
            pageId,
            languageId: state.activeLanguageId,
            metadata:
              type === "heading"
                ? { ...meta, headingLevel: Math.min(3, Math.max(1, headingLevel)) }
                : { ...meta },
          });
          blocks.push(newBlock);
          byId.set(newBlock.id, newBlock);
        }
      }
    });

    return true;
  } catch (error) {
    return false;
  }
}
