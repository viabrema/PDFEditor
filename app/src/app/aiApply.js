import { createBlock } from "../blocks/blockModel.js";
import { normalizePosition, normalizeSize } from "./aiLayout.js";
import { buildTextDocFromString } from "./textUtils.js";
import { buildTextDocFromMarkdown, looksLikeMarkdownList } from "./aiMarkdownParser.js";

export function sanitizeAiPayload(text) {
  return String(text || "")
    .replace(/^```[a-z]*\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
}

function parseAiJson(text) {
  const cleaned = sanitizeAiPayload(text);
  try {
    return JSON.parse(cleaned);
  } catch (error) {
    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");
    if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
      return null;
    }
    const slice = cleaned.slice(firstBrace, lastBrace + 1);
    try {
      return JSON.parse(slice);
    } catch (nestedError) {
      return null;
    }
  }
}


export function applyTextStyleToDoc(content, style) {
  if (!content || typeof content !== "object") {
    return content;
  }
  const attrs = {};
  if (style.fontSize) {
    attrs.fontSize = String(style.fontSize);
  }
  if (style.fontFamily) {
    attrs.fontFamily = String(style.fontFamily);
  }

  function applyMarks(node) {
    if (!node || typeof node !== "object") {
      return node;
    }
    if (node.type === "text") {
      const marks = Array.isArray(node.marks) ? [...node.marks] : [];
      if (attrs.fontSize || attrs.fontFamily) {
        marks.push({ type: "textStyle", attrs });
      }
      if (style.bold === true) {
        marks.push({ type: "strong" });
      }
      if (style.italic === true) {
        marks.push({ type: "em" });
      }
      return { ...node, marks };
    }
    if (!Array.isArray(node.content)) {
      return { ...node };
    }
    return {
      ...node,
      content: node.content.map(applyMarks),
    };
  }

  return applyMarks(content);
}


export function applyBlockFormatToDoc(content, format) {
  if (!content || typeof content !== "object") {
    return content;
  }
  if (content.type !== "doc" || !Array.isArray(content.content)) {
    return content;
  }
  if (!format || typeof format !== "object") {
    return content;
  }

  const nextType = format.type === "heading" ? "heading" : "paragraph";
  const nextLevel = format.level === 2 ? 2 : 1;
  const hasAlign = typeof format.textAlign === "string";

  function applyFormat(node) {
    if (!node || typeof node !== "object") {
      return node;
    }
    if (node.type === "paragraph" || node.type === "heading") {
      const nextAttrs = { ...(node.attrs || {}) };
      if (nextType === "heading") {
        nextAttrs.level = nextLevel;
      } else if (nextAttrs.level) {
        delete nextAttrs.level;
      }
      if (hasAlign) {
        nextAttrs.textAlign = format.textAlign;
      }
      return { ...node, type: nextType, attrs: nextAttrs };
    }
    if (!Array.isArray(node.content)) {
      return { ...node };
    }
    return {
      ...node,
      content: node.content.map(applyFormat),
    };
  }

  return {
    ...content,
    content: content.content.map(applyFormat),
  };
}

export function applyAiResultToBlock({ block, resultText }) {
  if (block.type === "text" || block.type === "title" || block.type === "subtitle") {
    const parsed = parseAiJson(resultText);
    if (
      parsed &&
      typeof parsed === "object" &&
      (parsed.contentText || parsed.textStyle || parsed.blockFormat)
    ) {
      if (typeof parsed.contentText === "string") {
        block.content = looksLikeMarkdownList(parsed.contentText)
          ? buildTextDocFromMarkdown(parsed.contentText)
          : buildTextDocFromString(parsed.contentText);
      }
      if (parsed.textStyle && typeof parsed.textStyle === "object") {
        if (parsed.textStyle.fontFamily) {
          block.metadata = {
            ...(block.metadata || {}),
            fontFamily: String(parsed.textStyle.fontFamily),
          };
        }
        if (parsed.textStyle.fontSize) {
          block.metadata = {
            ...(block.metadata || {}),
            fontSize: String(parsed.textStyle.fontSize),
          };
        }
        const inlineStyle = {
          bold: parsed.textStyle.bold,
          italic: parsed.textStyle.italic,
        };
        block.content = applyTextStyleToDoc(block.content, inlineStyle);
      }
      if (parsed.blockFormat && typeof parsed.blockFormat === "object") {
        if (parsed.blockFormat.textAlign) {
          block.metadata = {
            ...(block.metadata || {}),
            align: parsed.blockFormat.textAlign,
          };
        }
        const format = { ...parsed.blockFormat };
        if (format.textAlign) {
          delete format.textAlign;
        }
        block.content = applyBlockFormatToDoc(block.content, format);
      }
      return true;
    }
  }

  if (block.type === "table") {
    const parsed = parseAiJson(resultText);
    if (Array.isArray(parsed)) {
      block.content = { rows: parsed };
      return true;
    }
    return false;
  }

  const cleaned = sanitizeAiPayload(resultText);
  block.content = looksLikeMarkdownList(cleaned)
    ? buildTextDocFromMarkdown(cleaned)
    : buildTextDocFromString(cleaned);
  return true;
}

export function normalizeTableRows(tableRows) {
  if (!Array.isArray(tableRows)) {
    return null;
  }
  if (tableRows.length === 0) {
    return [];
  }
  if (Array.isArray(tableRows[0])) {
    return tableRows.map((row) => (Array.isArray(row) ? row : []));
  }
  if (typeof tableRows[0] === "object" && tableRows[0] !== null) {
    return tableRows.map((row) =>
      Array.isArray(row?.cells) ? row.cells.map((cell) => String(cell ?? "")) : []
    );
  }
  return null;
}

export function applyAiResultToPage({ resultText, blocks, state }) {
  const parsed = parseAiJson(resultText);
  try {
    const actions = Array.isArray(parsed?.actions) ? parsed.actions : [];
    if (actions.length === 0) {
      return false;
    }

    const byId = new Map(blocks.map((block) => [block.id, block]));
    actions.forEach((action) => {
      if (!action || typeof action !== "object") {
        return;
      }
      if (action.type === "delete" && action.id) {
        const index = blocks.findIndex((block) => block.id === action.id);
        if (index >= 0) {
          blocks.splice(index, 1);
        }
        return;
      }
      if (action.type === "update" && action.id) {
        const target = byId.get(action.id);
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
        if (target.type === "table") {
          const normalized = normalizeTableRows(action.tableRows);
          if (normalized) {
            target.content = { rows: normalized };
          }
          return;
        }
        if (target.type !== "table" && typeof action.contentText === "string") {
          target.content = looksLikeMarkdownList(action.contentText)
            ? buildTextDocFromMarkdown(action.contentText)
            : buildTextDocFromString(action.contentText);
        }
        return;
      }
      if (action.type === "create" && action.blockType) {
        if (action.blockType === "table") {
          const normalized = normalizeTableRows(action.tableRows);
          if (!normalized) {
            return;
          }
          blocks.push(
            createBlock({
              type: "table",
              content: { rows: normalized },
              position: normalizePosition(action.position) || { x: 32, y: 32 },
              size: normalizeSize(action.size) || { width: 320, height: 200 },
              pageId: state.activePageId,
              languageId: state.activeLanguageId,
            })
          );
          return;
        }
        if (
          (action.blockType === "text" ||
            action.blockType === "title" ||
            action.blockType === "subtitle") &&
          typeof action.contentText === "string"
        ) {
          blocks.push(
            createBlock({
              type: action.blockType,
              content: looksLikeMarkdownList(action.contentText)
                ? buildTextDocFromMarkdown(action.contentText)
                : buildTextDocFromString(action.contentText),
              position: normalizePosition(action.position) || { x: 32, y: 32 },
              size: normalizeSize(action.size) || { width: 320, height: 160 },
              pageId: state.activePageId,
              languageId: state.activeLanguageId,
            })
          );
        }
      }
    });

    return true;
  } catch (error) {
    return false;
  }
}
