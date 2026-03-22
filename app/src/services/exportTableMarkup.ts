export type ExportTableMerge = {
  r: number;
  c: number;
  rowspan: number;
  colspan: number;
};

export function renderTableBlockMarkup(
  block: { id: string; content?: { rows?: unknown; merges?: unknown } },
  escapeHtml: (v: unknown) => string,
): string {
  const rows = Array.isArray(block.content?.rows) ? (block.content!.rows as string[][]) : [];
  const merges = (Array.isArray(block.content?.merges) ? block.content!.merges : []) as ExportTableMerge[];
  const skip = new Set<string>();
  for (const m of merges) {
    for (let dr = 0; dr < m.rowspan; dr++) {
      for (let dc = 0; dc < m.colspan; dc++) {
        if (dr === 0 && dc === 0) {
          continue;
        }
        skip.add(`${m.r + dr},${m.c + dc}`);
      }
    }
  }
  const mergeAt = new Map(merges.map((m) => [`${m.r},${m.c}`, m] as const));
  const body = rows
    .map((row, r) => {
      const cells: string[] = [];
      for (let c = 0; c < row.length; c++) {
        if (skip.has(`${r},${c}`)) {
          continue;
        }
        const cell = row[c];
        const m = mergeAt.get(`${r},${c}`);
        const rs = m && m.rowspan > 1 ? ` rowspan="${m.rowspan}"` : "";
        const cs = m && m.colspan > 1 ? ` colspan="${m.colspan}"` : "";
        cells.push(`<td${rs}${cs}>${escapeHtml(cell)}</td>`);
      }
      return `<tr>${cells.join("")}</tr>`;
    })
    .join("");

  return `<div class="block table-block" data-block-id="${block.id}"><div class="table-block-export-clip"><table><tbody>${body}</tbody></table></div></div>`;
}
