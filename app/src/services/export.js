export function renderDocumentToHtml(document) {
  const pages = Array.isArray(document?.pages) ? document.pages : [];

  const pageMarkup = pages
    .map((page, index) => {
      const name = page.name || `Page ${index + 1}`;
      return `\n      <section class=\"page\" data-page-id=\"${page.id}\">\n        <h2>${name}</h2>\n      </section>`;
    })
    .join("");

  return `<!doctype html>\n<html lang=\"en\">\n  <head>\n    <meta charset=\"utf-8\" />\n    <title>${document?.title || "Document"}</title>\n  </head>\n  <body>\n    <main class=\"document\">${pageMarkup}\n    </main>\n  </body>\n</html>\n`;
}
