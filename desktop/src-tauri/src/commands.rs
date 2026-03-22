//! Thin Tauri commands; PDF logic lives in `pdf-export`.

use pdf_export::{export_html_to_pdf, StdProcessRunner};
use serde::Deserialize;
use std::path::PathBuf;
use tauri::Manager;

#[cfg(windows)]
const BUNDLED_CHROME_REL: &str =
    "bundled-chromium/chrome-headless-shell-win64/chrome-headless-shell.exe";

#[cfg(not(windows))]
const BUNDLED_CHROME_REL: &str =
    "bundled-chromium/chrome-headless-shell-linux64/chrome-headless-shell";

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExportPdfInput {
    pub html: String,
    pub output_path: String,
}

#[tauri::command]
pub fn export_pdf_from_html(app: tauri::AppHandle, input: ExportPdfInput) -> Result<(), String> {
    let chromium = resolve_chromium_exe(&app)?;
    let runner = StdProcessRunner;
    let out = PathBuf::from(input.output_path.trim());
    export_html_to_pdf(&runner, &chromium, &input.html, &out).map_err(|e| e.to_string())
}

fn resolve_chromium_exe(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    if let Ok(p) = std::env::var("CHROMIUM_PATH") {
        let pb = PathBuf::from(p.trim());
        if pb.is_file() {
            return Ok(pb);
        }
        return Err(format!("CHROMIUM_PATH is not a file: {}", pb.display()));
    }

    let dev = dev_bundled_chromium_path();
    if dev.is_file() {
        return Ok(dev);
    }

    if let Ok(resource_dir) = app.path().resource_dir() {
        let bundled = resource_dir.join(BUNDLED_CHROME_REL);
        if bundled.is_file() {
            return Ok(bundled);
        }
    }

    for candidate in system_browser_for_pdf_candidates() {
        if candidate.is_file() {
            return Ok(candidate);
        }
    }

    Err(
        "Chromium não encontrado. Instale Google Chrome ou Microsoft Edge, ou execute desktop/scripts/setup-chromium.ps1, ou defina CHROMIUM_PATH."
            .into(),
    )
}

fn dev_bundled_chromium_path() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR")).join(BUNDLED_CHROME_REL)
}

/// Chrome / Edge instalados no sistema aceitam os mesmos argumentos `--headless` e `--print-to-pdf`.
#[cfg(windows)]
fn system_browser_for_pdf_candidates() -> Vec<PathBuf> {
    let mut out = Vec::new();
    if let Ok(pf) = std::env::var("ProgramFiles") {
        let root = PathBuf::from(pf);
        out.push(root.join(r"Google\Chrome\Application\chrome.exe"));
        out.push(root.join(r"Microsoft\Edge\Application\msedge.exe"));
    }
    if let Ok(pf86) = std::env::var("ProgramFiles(x86)") {
        let root = PathBuf::from(pf86);
        out.push(root.join(r"Google\Chrome\Application\chrome.exe"));
        out.push(root.join(r"Microsoft\Edge\Application\msedge.exe"));
    }
    if let Ok(local) = std::env::var("LOCALAPPDATA") {
        out.push(PathBuf::from(local).join(r"Google\Chrome\Application\chrome.exe"));
    }
    out
}

#[cfg(not(windows))]
fn system_browser_for_pdf_candidates() -> Vec<PathBuf> {
    vec![
        PathBuf::from("/usr/bin/google-chrome-stable"),
        PathBuf::from("/usr/bin/google-chrome"),
        PathBuf::from("/usr/bin/chromium"),
        PathBuf::from("/usr/bin/chromium-browser"),
        PathBuf::from("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"),
    ]
}
