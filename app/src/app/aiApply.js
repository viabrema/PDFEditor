import { createBlock } from "../blocks/blockModel.js";
import { buildTextDocFromString } from "./textUtils.js";

export function sanitizeAiPayload(text) {
  return String(text || "")
    .replace(/^```[a-z]*\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
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

export function applyAiResultToBlock({ block, resultText }) {
  const cleaned = sanitizeAiPayload(resultText);

  if (block.type === "text") {
    try {
      const parsed = JSON.parse(cleaned);
      if (parsed && typeof parsed === "object" && (parsed.contentText || parsed.textStyle)) {
        if (typeof parsed.contentText === "string") {
          block.content = buildTextDocFromString(parsed.contentText);
        }
        if (parsed.textStyle && typeof parsed.textStyle === "object") {
          block.content = applyTextStyleToDoc(block.content, parsed.textStyle);
        }
        return true;
      }
    } catch (error) {
      // fallthrough
    }
  }

  if (block.type === "table") {
    try {
      const parsed = JSON.parse(cleaned);
      if (Array.isArray(parsed)) {
        block.content = { rows: parsed };
        return true;
      }
    } catch (error) {
      return false;
    }
    return false;
  }

  block.content = buildTextDocFromString(cleaned);
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
  const cleaned = sanitizeAiPayload(resultText);
  try {
    const parsed = JSON.parse(cleaned);
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
        if (action.position) {
          target.position = {
            x: action.position.x ?? target.position.x,
            y: action.position.y ?? target.position.y,
          };
        }
        if (action.size) {
          target.size = {
            width: action.size.width ?? target.size.width,
            height: action.size.height ?? target.size.height,
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
          target.content = buildTextDocFromString(action.contentText);
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
              position: action.position || { x: 32, y: 32 },
              size: action.size || { width: 320, height: 200 },
              pageId: state.activePageId,
              languageId: state.activeLanguageId,
            })
          );
          return;
        }
        if (action.blockType === "text" && typeof action.contentText === "string") {
          blocks.push(
            createBlock({
              type: "text",
              content: buildTextDocFromString(action.contentText),
              position: action.position || { x: 32, y: 32 },
              size: action.size || { width: 320, height: 160 },
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
