import { buildTextDocFromString } from "./textUtils.js";

export function looksLikeMarkdownList(text) {
  return /^(\s*)([-*]|\d+\.)\s+/m.test(String(text || ""));
}

function buildParagraphFromLines(lines) {
  const content = [];
  lines.forEach((line, index) => {
    if (line) {
      content.push({ type: "text", text: line });
    }
    if (index < lines.length - 1) {
      content.push({ type: "hard_break" });
    }
  });
  return { type: "paragraph", content };
}

export function buildTextDocFromMarkdown(text) {
  const normalized = String(text || "").replace(/\r\n/g, "\n");
  const lines = normalized.split("\n");
  const content = [];
  let paragraphLines = [];
  let listBuffer = null;

  const flushParagraph = () => {
    if (paragraphLines.length === 0) {
      return;
    }
    content.push(buildParagraphFromLines(paragraphLines));
    paragraphLines = [];
  };

  const flushList = () => {
    if (!listBuffer) {
      return;
    }
    const listNode = {
      type: listBuffer.type,
      content: listBuffer.items.map((itemText) => ({
        type: "list_item",
        content: [buildParagraphFromLines([itemText])],
      })),
    };
    content.push(listNode);
    listBuffer = null;
  };

  lines.forEach((line) => {
    const match = line.match(/^(\s*)([-*]|\d+\.)\s+(.*)$/);
    if (match) {
      const marker = match[2];
      const itemText = match[3] || "";
      const listType = /\d+\./.test(marker) ? "ordered_list" : "bullet_list";

      flushParagraph();
      if (listBuffer && listBuffer.type !== listType) {
        flushList();
      }
      if (!listBuffer) {
        listBuffer = { type: listType, items: [] };
      }
      listBuffer.items.push(itemText);
      return;
    }

    if (!line.trim()) {
      flushParagraph();
      flushList();
      return;
    }

    if (listBuffer) {
      flushList();
    }
    paragraphLines.push(line);
  });

  flushParagraph();
  flushList();

  if (content.length === 0) {
    return buildTextDocFromString(normalized);
  }

  return { type: "doc", content };
}
