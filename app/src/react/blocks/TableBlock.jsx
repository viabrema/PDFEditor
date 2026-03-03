import React from "react";
import { createEmptyTable, normalizeRows } from "../../blocks/tableBlock.js";

export function TableBlock({ block, isEditing, onUpdate }) {
  const rows = normalizeRows(block.content?.rows || createEmptyTable());

  return (
    <table className={`table-block ${isEditing ? "" : "is-readonly"}`}>
      <tbody>
        {rows.map((row, rowIndex) => (
          <tr key={`row-${rowIndex}`}>
            {row.map((cell, cellIndex) => (
              <td
                key={`cell-${rowIndex}-${cellIndex}`}
                contentEditable={isEditing}
                suppressContentEditableWarning={true}
                onInput={(event) => {
                  const nextRows = normalizeRows(block.content?.rows || createEmptyTable());
                  nextRows[rowIndex][cellIndex] = event.currentTarget.textContent || "";
                  block.content = { rows: nextRows };
                  onUpdate();
                }}
              >
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
