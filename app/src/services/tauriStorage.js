import { createStorageService } from "./storage.js";

/** @returns {Promise<{ fs: object, dialog: object } | null>} */
export async function getTauriBackend() {
  if (typeof window === "undefined") {
    return null;
  }
  if (!("__TAURI_INTERNALS__" in window)) {
    return null;
  }
  try {
    const [{ open, save }, { readTextFile, writeTextFile }] = await Promise.all([
      import("@tauri-apps/plugin-dialog"),
      import("@tauri-apps/plugin-fs"),
    ]);
    return {
      fs: { readTextFile, writeTextFile },
      dialog: { open, save },
    };
  } catch {
    return null;
  }
}

export function createTauriAdapter({ fs }) {
  if (!fs?.readTextFile || !fs?.writeTextFile) {
    throw new Error("Tauri fs API is required.");
  }

  return {
    async readFile(path) {
      return fs.readTextFile(path);
    },
    async writeFile(path, contents) {
      return fs.writeTextFile(path, contents);
    },
  };
}

export async function pickSavePath({ dialog }) {
  if (!dialog?.save) {
    throw new Error("Tauri dialog API is required.");
  }

  return dialog.save({
    filters: [{ name: "JSON", extensions: ["json"] }],
  });
}

export async function pickOpenPath({ dialog }) {
  if (!dialog?.open) {
    throw new Error("Tauri dialog API is required.");
  }

  return dialog.open({
    multiple: false,
    filters: [{ name: "JSON", extensions: ["json"] }],
  });
}

export async function pickPdfSavePath({ dialog }) {
  if (!dialog?.save) {
    throw new Error("Tauri dialog API is required.");
  }

  return dialog.save({
    filters: [{ name: "PDF", extensions: ["pdf"] }],
    defaultPath: "documento.pdf",
  });
}

export async function saveDocumentToFile(document, options = {}) {
  const { filePath, tauri, adapter } = options;
  const resolvedAdapter = adapter || (tauri ? createTauriAdapter(tauri) : null);

  if (!resolvedAdapter) {
    throw new Error("Storage adapter unavailable.");
  }

  const storage = createStorageService(resolvedAdapter);
  const targetPath = filePath || (tauri ? await pickSavePath(tauri) : null);

  if (!targetPath) {
    return null;
  }

  await storage.saveDocument(document, targetPath);
  return targetPath;
}

export async function loadDocumentFromFile(options = {}) {
  const { filePath, tauri, adapter } = options;
  const resolvedAdapter = adapter || (tauri ? createTauriAdapter(tauri) : null);

  if (!resolvedAdapter) {
    throw new Error("Storage adapter unavailable.");
  }

  const storage = createStorageService(resolvedAdapter);
  const targetPath = filePath || (tauri ? await pickOpenPath(tauri) : null);

  if (!targetPath) {
    return null;
  }

  const document = await storage.loadDocument(targetPath);
  return { document, path: targetPath };
}
