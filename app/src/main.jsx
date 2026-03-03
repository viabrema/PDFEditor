import React from "react";
import { createRoot } from "react-dom/client";
import "@mdxeditor/editor/style.css";
import "./style.css";
import { App } from "./react/App.jsx";

const rootElement = document.querySelector("#app");
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(<App />);
}
