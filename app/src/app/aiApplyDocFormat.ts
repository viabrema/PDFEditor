import { buildTextDocFromString } from "./textUtils";
import { buildTextDocFromMarkdown, looksLikeMarkdownList } from "./aiMarkdownParser";
import { parseAiJson, sanitizeAiPayload } from "./aiApplyParsing";

export function applyTextStyleToDoc(content: any, style: Record<string, unknown>) {
  if (!content || typeof content !== "object") {
    return content;
  }
  const attrs: Record<string, string> = {};
  if (style.fontSize) {
    attrs.fontSize = String(style.fontSize);
  }
  if (style.fontFamily) {
    attrs.fontFamily = String(style.fontFamily);
  }

  function applyMarks(node: any) {
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
  if (
    block.type === "text" ||
    block.type === "heading" ||
    block.type === "title" ||
    block.type === "subtitle"
  ) {
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

  if (block.type === "table" || block.type === "linkedTable") {
    const parsed = parseAiJson(resultText);
    if (Array.isArray(parsed)) {
      block.content = { ...(block.content || {}), rows: parsed };
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
