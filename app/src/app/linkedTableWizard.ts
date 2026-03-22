import { toBrowserExcelPath } from "../services/excelLink";
import {
  extractRangeToTableContent,
  getSheetNamesFromExcelBytes,
  normalizeRangeString,
  parseA1Range,
  type ExcelTableMerge,
} from "../services/excelRange";
import { pickExcelOpenPath } from "../services/tauriStorage";

export type ExcelLinkModalRefs = {
  modal: HTMLElement;
  sheetSelect: HTMLSelectElement;
  rangeInput: HTMLInputElement;
  errorEl: HTMLElement;
  confirmBtn: HTMLButtonElement;
  cancelBtn: HTMLButtonElement;
};

function showModal(refs: ExcelLinkModalRefs) {
  refs.modal.classList.remove("hidden");
  refs.modal.classList.add("flex");
  refs.modal.setAttribute("aria-hidden", "false");
}

function hideModal(refs: ExcelLinkModalRefs) {
  refs.modal.classList.add("hidden");
  refs.modal.classList.remove("flex");
  refs.modal.setAttribute("aria-hidden", "true");
}

export function openExcelConfigureModal(
  refs: ExcelLinkModalRefs,
  options: {
    sheetNames: string[];
    defaultSheet?: string;
    defaultRange?: string;
  },
): Promise<{ sheetName: string; range: string } | null> {
  return new Promise((resolve) => {
    refs.errorEl.textContent = "";
    refs.sheetSelect.innerHTML = "";
    options.sheetNames.forEach((name) => {
      const opt = document.createElement("option");
      opt.value = name;
      opt.textContent = name;
      refs.sheetSelect.append(opt);
    });
    if (options.defaultSheet && options.sheetNames.includes(options.defaultSheet)) {
      refs.sheetSelect.value = options.defaultSheet;
    }
    refs.rangeInput.value = options.defaultRange || "A1:D10";

    const ac = new AbortController();

    const finish = (value: { sheetName: string; range: string } | null) => {
      ac.abort();
      hideModal(refs);
      resolve(value);
    };

    const onConfirm = () => {
      refs.errorEl.textContent = "";
      try {
        parseA1Range(refs.rangeInput.value);
      } catch (e) {
        refs.errorEl.textContent = e instanceof Error ? e.message : "Intervalo invalido.";
        return;
      }
      const sheetName = refs.sheetSelect.value;
      if (!sheetName) {
        refs.errorEl.textContent = "Selecione uma folha.";
        return;
      }
      finish({
        sheetName,
        range: normalizeRangeString(refs.rangeInput.value),
      });
    };

    const onCancel = () => finish(null);

    refs.confirmBtn.addEventListener("click", onConfirm, { signal: ac.signal });
    refs.cancelBtn.addEventListener("click", onCancel, { signal: ac.signal });
    showModal(refs);
    refs.rangeInput.focus();
  });
}

export async function pickExcelBytes(options: {
  tauri: { dialog?: { open?: (o?: unknown) => Promise<unknown> }; fs?: { readFile?: (p: string) => Promise<Uint8Array> } } | null;
  fileInput: HTMLInputElement;
}): Promise<{ filePath: string; bytes: Uint8Array } | null> {
  const { tauri, fileInput } = options;
  if (tauri?.dialog?.open && tauri.fs?.readFile) {
    const path = await pickExcelOpenPath({
      dialog: tauri.dialog as { open: (opts?: unknown) => Promise<unknown> },
    });
    if (!path || typeof path !== "string") {
      return null;
    }
    const bytes = await tauri.fs.readFile(path);
    return { filePath: path, bytes };
  }

  return new Promise((resolve) => {
    const onChange = async () => {
      fileInput.removeEventListener("change", onChange);
      const f = fileInput.files?.[0];
      fileInput.value = "";
      if (!f) {
        resolve(null);
        return;
      }
      const buf = await f.arrayBuffer();
      resolve({
        filePath: toBrowserExcelPath(f.name),
        bytes: new Uint8Array(buf),
      });
    };
    fileInput.addEventListener("change", onChange);
    fileInput.click();
  });
}

export async function runExcelLinkSetup(options: {
  tauri: { dialog?: { open?: (o?: unknown) => Promise<unknown> }; fs?: { readFile?: (p: string) => Promise<Uint8Array> } } | null;
  modalRefs: ExcelLinkModalRefs;
  fileInput: HTMLInputElement;
  defaults?: { sheetName?: string; range?: string };
}): Promise<{
  filePath: string;
  sheetName: string;
  range: string;
  rows: string[][];
  merges: ExcelTableMerge[];
} | null> {
  const picked = await pickExcelBytes({ tauri: options.tauri, fileInput: options.fileInput });
  if (!picked) {
    return null;
  }
  let sheetNames: string[];
  try {
    sheetNames = await getSheetNamesFromExcelBytes(picked.bytes);
  } catch (e) {
    window.alert(e instanceof Error ? e.message : "Erro ao ler o ficheiro Excel.");
    return null;
  }
  if (sheetNames.length === 0) {
    window.alert("O ficheiro Excel nao tem folhas utilizaveis.");
    return null;
  }
  const cfg = await openExcelConfigureModal(options.modalRefs, {
    sheetNames,
    defaultSheet: options.defaults?.sheetName || sheetNames[0],
    defaultRange: options.defaults?.range || "A1:D10",
  });
  if (!cfg) {
    return null;
  }
  try {
    const { rows, merges } = await extractRangeToTableContent(picked.bytes, cfg.sheetName, cfg.range);
    return {
      filePath: picked.filePath,
      sheetName: cfg.sheetName,
      range: cfg.range,
      rows,
      merges,
    };
  } catch (e) {
    window.alert(e instanceof Error ? e.message : "Erro ao ler o intervalo no Excel.");
    return null;
  }
}
