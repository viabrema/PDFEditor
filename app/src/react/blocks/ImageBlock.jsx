import React from "react";

export function ImageBlock({ block }) {
  return <img className="image-block" alt="Imagem" src={block.content?.src || ""} />;
}
