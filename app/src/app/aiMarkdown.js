export function stripAlignWrapper(markdown) {
  const trimmed = String(markdown || "").trim();
  const match = trimmed.match(
    /^<div\s+style=["'][^"']*text-align\s*:\s*[^"']+["']\s*>[\s\S]*<\/div>$/i
  );
  if (!match) {
    return trimmed;
  }
  return trimmed
    .replace(/^<div\s+[^>]*>/i, "")
    .replace(/<\/div>\s*$/i, "")
    .trim();
}

export function setMarkdownAlignment(content, align) {
  const normalized = stripAlignWrapper(content);
  if (!align || align === "left") {
    return normalized;
  }
  return `<div style="text-align: ${align}">${normalized}</div>`;
}

export function applyTextStyleToMarkdown(content, style) {
  if (!style || typeof style !== "object") {
    return content;
  }
  const styles = [];
  if (style.fontSize) {
    styles.push(`font-size: ${String(style.fontSize).replace(/[";<>]/g, "").trim()}`);
  }
  if (style.fontFamily) {
    styles.push(
      `font-family: ${String(style.fontFamily).replace(/[";<>]/g, "").trim()}`
    );
  }
  if (style.bold === true) {
    styles.push("font-weight: 700");
  }
  if (style.italic === true) {
    styles.push("font-style: italic");
  }
  if (styles.length === 0) {
    return content;
  }
  const normalized = stripAlignWrapper(content);
  return `<span style="${styles.join("; ")}">${normalized}</span>`;
}

export function applyBlockFormatToMarkdown(content, format) {
  if (!format || typeof format !== "object") {
    return content;
  }
  const normalized = stripAlignWrapper(content);
  const lines = normalized.split("\n");
  const firstLineIndex = lines.findIndex((line) => line.trim().length > 0);
  const nextLines = [...lines];
  const headingPrefix = format.level === 2 ? "## " : "# ";
  const hasAlign = typeof format.textAlign === "string";
  const isHtml = normalized.trim().startsWith("<");
  let updated = normalized;

  if (format.type === "heading") {
    if (isHtml) {
      const alignStyle = hasAlign ? ` style="text-align: ${format.textAlign}"` : "";
      updated = `<h${format.level || 1}${alignStyle}>${normalized}</h${
        format.level || 1
      }>`;
      return updated;
    }
    if (firstLineIndex >= 0) {
      const stripped = nextLines[firstLineIndex].replace(/^#{1,6}\s+/, "");
      nextLines[firstLineIndex] = `${headingPrefix}${stripped}`;
      updated = nextLines.join("\n");
    }
  }

  if (format.type === "paragraph") {
    if (firstLineIndex >= 0) {
      nextLines[firstLineIndex] = nextLines[firstLineIndex].replace(/^#{1,6}\s+/, "");
      updated = nextLines.join("\n");
    }
  }

  if (hasAlign && !updated.trim().startsWith("<h")) {
    return `<div style="text-align: ${format.textAlign}">${updated}</div>`;
  }
  return updated;
}
