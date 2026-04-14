import { describe, expect, it, vi } from "vitest";
import {
  createTauriAdapter,
  getTauriBackend,
  loadDocumentFromFile,
  pickOpenPath,
  pickPdfSavePath,
  pickSavePath,
  saveDocumentToFile,
} from "./tauriStorage";

const sampleDocument = {
  version: 1,
  id: "doc-1",
  title: "Doc",
  page: { format: "A4", orientation: "portrait" },
  grid: { size: 8, snap: true },
  languages: [{ id: "lang-pt", label: "PT", isDefault: true }],
  activeLanguageId: "lang-pt",
  pages: [{ id: "page-1", name: "Pagina 1" }],
  metadata: { createdAt: "2026-03-02", updatedAt: "2026-03-02" },
};

describe("tauri storage", () => {
  it("getTauriBackend returns null without Tauri window", async () => {
    expect(await getTauriBackend()).toBeNull();
  });

  it("creates adapter from fs", async () => {
    const fs = {
      readTextFile: vi.fn(async () => "{}"),
      writeTextFile: vi.fn(async () => {}),
    };

    const adapter = createTauriAdapter({ fs });
    await adapter.readFile("doc.json");
    await adapter.writeFile("doc.json", "{}");

    expect(fs.readTextFile).toHaveBeenCalledTimes(1);
    expect(fs.writeTextFile).toHaveBeenCalledTimes(1);
  });

  it("throws when fs is missing", () => {
    expect(() => createTauriAdapter({})).toThrow(/fs API/);
  });

  it("picks save path", async () => {
    const dialog = { save: vi.fn(async () => "doc.json") };
    const path = await pickSavePath({ dialog });
    expect(path).toBe("doc.json");
    expect(dialog.save).toHaveBeenCalledWith(
      expect.objectContaining({
        filters: [{ name: "JSON", extensions: ["json"] }],
      })
    );
  });

  it("picks save path with custom json options", async () => {
    const dialog = { save: vi.fn(async () => "arquivo") };
    const path = await pickSavePath(
      { dialog },
      { extensions: [".tp.json", " json "], defaultPath: "arquivo.tp.json" }
    );

    expect(path).toBe("arquivo");
    expect(dialog.save).toHaveBeenCalledWith(
      expect.objectContaining({
        defaultPath: "arquivo.tp.json",
        filters: [{ name: "JSON", extensions: ["tp.json", "json"] }],
      })
    );
  });

  it("throws when dialog save missing", async () => {
    await expect(pickSavePath({})).rejects.toThrow(/dialog API/);
  });

  it("picks open path", async () => {
    const dialog = { open: vi.fn(async () => "doc.json") };
    const path = await pickOpenPath({ dialog });
    expect(path).toBe("doc.json");
    expect(dialog.open).toHaveBeenCalledWith(
      expect.objectContaining({
        filters: [{ name: "JSON", extensions: ["json"] }],
      })
    );
  });

  it("picks open path with custom json options", async () => {
    const dialog = { open: vi.fn(async () => "modelo.tp.json") };
    const path = await pickOpenPath({ dialog }, { extensions: ["TP.JSON"] });

    expect(path).toBe("modelo.tp.json");
    expect(dialog.open).toHaveBeenCalledWith(
      expect.objectContaining({
        filters: [{ name: "JSON", extensions: ["tp.json"] }],
      })
    );
  });

  it("throws when dialog open missing", async () => {
    await expect(pickOpenPath({})).rejects.toThrow(/dialog API/);
  });

  it("picks pdf save path", async () => {
    const dialog = { save: vi.fn(async () => "out.pdf") };
    const path = await pickPdfSavePath({ dialog });
    expect(path).toBe("out.pdf");
    expect(dialog.save).toHaveBeenCalledWith(
      expect.objectContaining({
        filters: [{ name: "PDF", extensions: ["pdf"] }],
      })
    );
  });

  it("throws when dialog save missing for pdf", async () => {
    await expect(pickPdfSavePath({})).rejects.toThrow(/dialog API/);
  });

  it("saves document with provided path", async () => {
    const adapter = {
      readFile: vi.fn(),
      writeFile: vi.fn(async () => {}),
    };

    const path = await saveDocumentToFile(sampleDocument, {
      filePath: "doc.json",
      adapter,
    });

    expect(path).toBe("doc.json");
    expect(adapter.writeFile).toHaveBeenCalledTimes(1);
  });

  it("saves document with adapter when tauri is missing", async () => {
    const adapter = {
      readFile: vi.fn(),
      writeFile: vi.fn(async () => {}),
    };

    const path = await saveDocumentToFile(sampleDocument, {
      filePath: "doc.json",
      adapter,
      tauri: null,
    });

    expect(path).toBe("doc.json");
  });

  it("saves document using tauri dialog", async () => {
    const fs = {
      readTextFile: vi.fn(async () => "{}"),
      writeTextFile: vi.fn(async () => {}),
    };
    const dialog = { save: vi.fn(async () => "doc.json") };
    const tauri = { fs, dialog };

    const path = await saveDocumentToFile(sampleDocument, { tauri });

    expect(path).toBe("doc.json");
    expect(fs.writeTextFile).toHaveBeenCalledTimes(1);
  });

  it("applies file suffix when saving", async () => {
    const adapter = {
      readFile: vi.fn(),
      writeFile: vi.fn(async () => {}),
    };

    const path = await saveDocumentToFile(sampleDocument, {
      filePath: "arquivo",
      adapter,
      fileSuffix: ".tp.json",
    });

    expect(path).toBe("arquivo.tp.json");
    expect(adapter.writeFile).toHaveBeenCalledWith(
      "arquivo.tp.json",
      expect.any(String)
    );
  });

  it("returns null when save is cancelled", async () => {
    const tauri = { dialog: { save: vi.fn(async () => null) } };
    const adapter = {
      readFile: vi.fn(),
      writeFile: vi.fn(async () => {}),
    };

    const path = await saveDocumentToFile(sampleDocument, {
      tauri,
      adapter,
    });

    expect(path).toBeNull();
    expect(adapter.writeFile).not.toHaveBeenCalled();
  });

  it("returns null when no path and no tauri for save", async () => {
    const adapter = {
      readFile: vi.fn(),
      writeFile: vi.fn(async () => {}),
    };

    const path = await saveDocumentToFile(sampleDocument, {
      adapter,
      tauri: null,
    });

    expect(path).toBeNull();
  });

  it("throws when no adapter is available", async () => {
    await expect(saveDocumentToFile(sampleDocument)).rejects.toThrow(
      /Storage adapter unavailable/
    );
  });

  it("loads document with provided path", async () => {
    const adapter = {
      readFile: vi.fn(async () => JSON.stringify(sampleDocument)),
      writeFile: vi.fn(),
    };

    const result = await loadDocumentFromFile({
      filePath: "doc.json",
      adapter,
    });

    expect(result.document.title).toBe("Doc");
    expect(result.path).toBe("doc.json");
  });

  it("loads document with adapter when tauri is missing", async () => {
    const adapter = {
      readFile: vi.fn(async () => JSON.stringify(sampleDocument)),
      writeFile: vi.fn(),
    };

    const result = await loadDocumentFromFile({
      filePath: "doc.json",
      adapter,
      tauri: null,
    });

    expect(result.document.title).toBe("Doc");
  });

  it("loads document using tauri dialog", async () => {
    const fs = {
      readTextFile: vi.fn(async () => JSON.stringify(sampleDocument)),
      writeTextFile: vi.fn(async () => {}),
    };
    const dialog = { open: vi.fn(async () => "doc.json") };
    const tauri = { fs, dialog };

    const result = await loadDocumentFromFile({ tauri });
    expect(result.document.title).toBe("Doc");
    expect(result.path).toBe("doc.json");
  });

  it("returns null when open is cancelled", async () => {
    const tauri = { dialog: { open: vi.fn(async () => null) } };
    const adapter = {
      readFile: vi.fn(async () => "{}"),
      writeFile: vi.fn(),
    };

    const result = await loadDocumentFromFile({ tauri, adapter });
    expect(result).toBeNull();
  });

  it("returns null when no path and no tauri for load", async () => {
    const adapter = {
      readFile: vi.fn(async () => "{}"),
      writeFile: vi.fn(),
    };

    const result = await loadDocumentFromFile({ adapter, tauri: null });
    expect(result).toBeNull();
  });

  it("throws when no adapter on load", async () => {
    await expect(loadDocumentFromFile()).rejects.toThrow(
      /Storage adapter unavailable/
    );
  });
});
