const CLIPBOARD_PREFIX = "pdfeditor-block:";

export function buildClipboardPayload(block) {
  if (!block || typeof block !== "object") {
    return null;
  }

  if (block.type === "table") {
    return {
      type: block.type,
      content: {
        rows: Array.isArray(block.content?.rows)
          ? block.content.rows.map((row) => [...row])
          : [],
      },
      size: { ...block.size },
    };
  }

  if (block.type === "image") {
    return {
      type: block.type,
      content: { src: block.content?.src || "" },
      size: { ...block.size },
    };
  }

  return {
    type: block.type,
    content: typeof block.content === "string" ? block.content : "",
    size: { ...block.size },
  };
}

export function serializeClipboardPayload(payload) {
  if (!payload) {
    return null;
  }
  return `${CLIPBOARD_PREFIX}${JSON.stringify(payload)}`;
}

export function parseClipboardPayload(text) {
  if (!text || typeof text !== "string") {
    return null;
  }
  if (!text.startsWith(CLIPBOARD_PREFIX)) {
    return null;
  }
  const raw = text.slice(CLIPBOARD_PREFIX.length);
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") {
      return null;
    }
    return parsed;
  } catch (error) {
    return null;
  }
}
