import { createStorageService } from "./storage";

/** @returns {Promise<{ fs: object, dialog: object } | null>} */
export async function getTauriBackend() {
  if (typeof window === "undefined") {
    return null;
  }
  if (!("__TAURI_INTERNALS__" in window)) {
    return null;
  }
  try {
    const [{ open, save }, { readTextFile, writeTextFile, readFile }] = await Promise.all([
      import("@tauri-apps/plugin-dialog"),
      import("@tauri-apps/plugin-fs"),
    ]);
    return {
      fs: { readTextFile, writeTextFile, readFile },
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

function createJsonDialogFilters(extensions: string[]) {
  return [{ name: "JSON", extensions }];
}

function normalizeJsonExtensions(extensions?: string[]) {
  if (!Array.isArray(extensions) || extensions.length === 0) {
    return ["json"];
  }

  const normalized = extensions
    .map((value) => String(value || "").trim().toLowerCase().replace(/^\./, ""))
    .filter(Boolean);

  return normalized.length > 0 ? normalized : ["json"];
}

function ensureFileSuffix(path: string, suffix?: string) {
  if (!suffix) {
    return path;
  }

  const normalizedSuffix = String(suffix).trim();
  if (!normalizedSuffix) {
    return path;
  }

  return path.toLowerCase().endsWith(normalizedSuffix.toLowerCase())
    ? path
    : `${path}${normalizedSuffix}`;
}

export async function pickSavePath({ dialog }, options: any = {}) {
  if (!dialog?.save) {
    throw new Error("Tauri dialog API is required.");
  }

  const extensions = normalizeJsonExtensions(options.extensions);
  return dialog.save({
    filters: createJsonDialogFilters(extensions),
    defaultPath: options.defaultPath,
  });
}

export async function pickOpenPath({ dialog }, options: any = {}) {
  if (!dialog?.open) {
    throw new Error("Tauri dialog API is required.");
  }

  const extensions = normalizeJsonExtensions(options.extensions);
  return dialog.open({
    multiple: false,
    filters: createJsonDialogFilters(extensions),
  });
}

export async function pickExcelOpenPath({ dialog }: { dialog: { open: (opts?: unknown) => Promise<unknown> } }) {
  if (!dialog?.open) {
    throw new Error("Tauri dialog API is required.");
  }

  const path = await dialog.open({
    multiple: false,
    filters: [{ name: "Excel", extensions: ["xlsx", "xls", "xlsm"] }],
  });
  if (path == null) {
    return null;
  }
  return Array.isArray(path) ? path[0] : path;
}

/** Leitura binaria (ex.: Excel). Requer Tauri com permissao fs:allow-read-file no path. */
export async function readBinaryFileFromPath(filePath: string): Promise<Uint8Array> {
  const { readFile } = await import("@tauri-apps/plugin-fs");
  return readFile(filePath);
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

export async function saveDocumentToFile(document: unknown, options: any = {}) {
  const { filePath, tauri, adapter, dialogOptions, fileSuffix } = options;
  const resolvedAdapter = adapter || (tauri ? createTauriAdapter(tauri) : null);

  if (!resolvedAdapter) {
    throw new Error("Storage adapter unavailable.");
  }

  const storage = createStorageService(resolvedAdapter);
  const rawTargetPath = filePath || (tauri ? await pickSavePath(tauri, dialogOptions) : null);

  if (!rawTargetPath) {
    return null;
  }

  const targetPath = ensureFileSuffix(rawTargetPath, fileSuffix);

  await storage.saveDocument(document, targetPath);
  return targetPath;
}

export async function loadDocumentFromFile(options: any = {}) {
  const { filePath, tauri, adapter, dialogOptions } = options;
  const resolvedAdapter = adapter || (tauri ? createTauriAdapter(tauri) : null);

  if (!resolvedAdapter) {
    throw new Error("Storage adapter unavailable.");
  }

  const storage = createStorageService(resolvedAdapter);
  const targetPath = filePath || (tauri ? await pickOpenPath(tauri, dialogOptions) : null);

  if (!targetPath) {
    return null;
  }

  const document = await storage.loadDocument(targetPath);
  return { document, path: targetPath };
}
