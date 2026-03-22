//! Core logic for exporting HTML to PDF using a headless Chromium binary.
//! All subprocess execution goes through [`ProcessRunner`] so unit tests never need a real browser.

use std::ffi::OsString;
use std::fmt;
use std::path::{Path, PathBuf};
use std::process::Command;

/// Runs a subprocess (Chromium). Injected in tests via mocks.
pub trait ProcessRunner {
    /// Returns the process exit code (`0` = success).
    fn run(&self, program: &Path, args: &[OsString]) -> std::io::Result<i32>;
}

/// Default runner using [`std::process::Command`].
pub struct StdProcessRunner;

impl ProcessRunner for StdProcessRunner {
    fn run(&self, program: &Path, args: &[OsString]) -> std::io::Result<i32> {
        let status = Command::new(program).args(args).status()?;
        Ok(status.code().unwrap_or(-1))
    }
}

/// Test double: configurable exit code and optional PDF file creation.
pub struct MockRunner {
    pub exit_code: std::cell::Cell<i32>,
    /// When set, a minimal PDF-like file is written here on each successful `run` (code 0).
    pub write_pdf_to: Option<PathBuf>,
}

impl ProcessRunner for MockRunner {
    fn run(&self, program: &Path, args: &[OsString]) -> std::io::Result<i32> {
        let _ = program;
        let code = self.exit_code.get();
        if code == 0 {
            if let Some(ref target) = self.write_pdf_to {
                std::fs::write(target, b"%PDF-1.4\n%\xe2\xe3\xcf\xd3\n")?;
            }
        }
        let _ = args;
        Ok(code)
    }
}

/// Record program and args for assertions (does not spawn a process).
pub struct RecordingMockRunner {
    pub program: std::cell::RefCell<Option<PathBuf>>,
    pub args: std::cell::RefCell<Vec<OsString>>,
    pub exit_code: std::cell::Cell<i32>,
    pub write_pdf_to: Option<PathBuf>,
}

impl ProcessRunner for RecordingMockRunner {
    fn run(&self, program: &Path, args: &[OsString]) -> std::io::Result<i32> {
        *self.program.borrow_mut() = Some(program.to_path_buf());
        *self.args.borrow_mut() = args.to_vec();
        let code = self.exit_code.get();
        if code == 0 {
            if let Some(ref target) = self.write_pdf_to {
                std::fs::write(target, b"%PDF-1.4\n%\xe2\xe3\xcf\xd3\n")?;
            }
        }
        Ok(code)
    }
}

#[derive(Debug, PartialEq, Eq)]
pub enum ExportError {
    InvalidOutputPath,
    Io(String),
    ChromeFailed(i32),
    PdfMissing,
}

impl fmt::Display for ExportError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            ExportError::InvalidOutputPath => write!(f, "output path must end with .pdf"),
            ExportError::Io(msg) => write!(f, "io error: {msg}"),
            ExportError::ChromeFailed(code) => write!(f, "chromium exited with code {code}"),
            ExportError::PdfMissing => write!(f, "pdf file was not produced"),
        }
    }
}

impl std::error::Error for ExportError {}

/// Ensures the path is intended for a PDF file.
pub fn validate_pdf_output_path(path: &Path) -> Result<(), ExportError> {
    let Some(name) = path.file_name().and_then(|s| s.to_str()) else {
        return Err(ExportError::InvalidOutputPath);
    };
    if !name.to_ascii_lowercase().ends_with(".pdf") {
        return Err(ExportError::InvalidOutputPath);
    }
    Ok(())
}

/// Resolve relative paths against the current directory.
pub fn absolutize_output_path(path: &Path) -> Result<PathBuf, ExportError> {
    if path.is_absolute() {
        return Ok(path.to_path_buf());
    }
    let cwd = std::env::current_dir().map_err(|e| ExportError::Io(e.to_string()))?;
    Ok(cwd.join(path))
}

/// Build `file://` URL for a path that must exist on disk (temp HTML file).
pub fn path_to_file_url(path: &Path) -> Result<String, ExportError> {
    let abs = path
        .canonicalize()
        .map_err(|e| ExportError::Io(e.to_string()))?;
    let s = abs.to_string_lossy();
    let trimmed = s.trim_start_matches(r"\\?\");
    if cfg!(windows) {
        let path_part = trimmed.replace('\\', "/");
        Ok(format!("file:///{path_part}"))
    } else {
        Ok(format!("file://{}", abs.display()))
    }
}

/// Arguments for `chrome-headless-shell` / Chromium headless print-to-pdf.
pub fn build_chrome_print_args(pdf_output: &Path, html_file_url: &str) -> Vec<OsString> {
    let print_arg = format!("--print-to-pdf={}", pdf_output.to_string_lossy());
    vec![
        OsString::from("--headless=new"),
        OsString::from("--disable-gpu"),
        OsString::from("--no-sandbox"),
        OsString::from(print_arg),
        OsString::from(html_file_url),
    ]
}

/// Writes `html` to a unique temp file and returns its path.
pub fn write_temp_html(html: &str) -> Result<PathBuf, ExportError> {
    let name = format!("pdf_export_{}.html", uuid::Uuid::new_v4());
    let path = std::env::temp_dir().join(name);
    std::fs::write(&path, html.as_bytes()).map_err(|e| ExportError::Io(e.to_string()))?;
    Ok(path)
}

/// Full export: temp HTML, invoke Chromium, verify PDF, delete temp HTML.
pub fn export_html_to_pdf(
    runner: &impl ProcessRunner,
    chromium_exe: &Path,
    html: &str,
    output_pdf: &Path,
) -> Result<(), ExportError> {
    validate_pdf_output_path(output_pdf)?;
    let output_pdf = absolutize_output_path(output_pdf)?;

    let html_path = write_temp_html(html)?;
    let html_url = path_to_file_url(&html_path)?;
    let args = build_chrome_print_args(&output_pdf, &html_url);

    let code = runner
        .run(chromium_exe, &args)
        .map_err(|e| ExportError::Io(e.to_string()))?;

    let _ = std::fs::remove_file(&html_path);

    if code != 0 {
        return Err(ExportError::ChromeFailed(code));
    }

    let meta = std::fs::metadata(&output_pdf).map_err(|e| ExportError::Io(e.to_string()))?;
    if meta.len() == 0 {
        return Err(ExportError::PdfMissing);
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::ffi::OsString;

    #[test]
    fn validate_rejects_non_pdf() {
        assert_eq!(
            validate_pdf_output_path(Path::new("out.txt")),
            Err(ExportError::InvalidOutputPath)
        );
    }

    #[test]
    fn validate_accepts_pdf() {
        assert!(validate_pdf_output_path(Path::new("doc.pdf")).is_ok());
        assert!(validate_pdf_output_path(Path::new("DOC.PDF")).is_ok());
    }

    #[test]
    fn absolutize_relative() {
        let cwd = std::env::current_dir().unwrap();
        let p = absolutize_output_path(Path::new("rel.pdf")).unwrap();
        assert_eq!(p, cwd.join("rel.pdf"));
    }

    #[test]
    fn absolutize_absolute_unchanged() {
        let p = if cfg!(windows) {
            PathBuf::from(r"C:\x\y.pdf")
        } else {
            PathBuf::from("/x/y.pdf")
        };
        assert_eq!(absolutize_output_path(&p).unwrap(), p);
    }

    #[test]
    fn path_to_file_url_roundtrip() {
        let dir = std::env::temp_dir().join(format!("pdf_export_test_{}", uuid::Uuid::new_v4()));
        std::fs::create_dir_all(&dir).unwrap();
        let f = dir.join("t.html");
        std::fs::write(&f, b"<html/>").unwrap();
        let url = path_to_file_url(&f).unwrap();
        assert!(url.starts_with("file://"));
        assert!(url.contains("t.html"));
        let _ = std::fs::remove_file(&f);
        let _ = std::fs::remove_dir(&dir);
    }

    #[test]
    fn build_chrome_print_args_order() {
        let pdf = PathBuf::from(r"C:\out\a.pdf");
        let args = build_chrome_print_args(&pdf, "file:///C:/tmp/x.html");
        assert!(args
            .iter()
            .any(|a| a.to_string_lossy().contains("print-to-pdf")));
        assert_eq!(
            args.last().unwrap().to_string_lossy(),
            "file:///C:/tmp/x.html"
        );
    }

    #[test]
    fn export_success_with_mock() {
        let dir = tempfile_in_test();
        let pdf = dir.join("out.pdf");
        let runner = MockRunner {
            exit_code: std::cell::Cell::new(0),
            write_pdf_to: Some(pdf.clone()),
        };
        export_html_to_pdf(
            &runner,
            Path::new("fake-chrome.exe"),
            "<html><body>x</body></html>",
            &pdf,
        )
        .unwrap();
        assert!(pdf.exists());
    }

    #[test]
    fn export_chrome_failure() {
        let dir = tempfile_in_test();
        let pdf = dir.join("out.pdf");
        let runner = MockRunner {
            exit_code: std::cell::Cell::new(1),
            write_pdf_to: None,
        };
        let err =
            export_html_to_pdf(&runner, Path::new("fake-chrome.exe"), "<html/>", &pdf).unwrap_err();
        assert_eq!(err, ExportError::ChromeFailed(1));
    }

    #[test]
    fn export_pdf_missing_when_empty() {
        let dir = tempfile_in_test();
        let pdf = dir.join("out.pdf");
        std::fs::write(&pdf, b"").unwrap();
        let runner = MockRunner {
            exit_code: std::cell::Cell::new(0),
            write_pdf_to: None,
        };
        let err =
            export_html_to_pdf(&runner, Path::new("fake-chrome.exe"), "<html/>", &pdf).unwrap_err();
        assert_eq!(err, ExportError::PdfMissing);
    }

    #[test]
    fn recording_mock_captures_invocation() {
        let dir = tempfile_in_test();
        let pdf = dir.join("z.pdf");
        let chrome = Path::new("C:\\bin\\chrome.exe");
        let runner = RecordingMockRunner {
            program: std::cell::RefCell::new(None),
            args: std::cell::RefCell::new(vec![]),
            exit_code: std::cell::Cell::new(0),
            write_pdf_to: Some(pdf.clone()),
        };
        export_html_to_pdf(&runner, chrome, "<p>a</p>", &pdf).unwrap();
        assert_eq!(*runner.program.borrow(), Some(chrome.to_path_buf()));
        assert!(!runner.args.borrow().is_empty());
    }

    #[test]
    fn std_runner_runs_cmd_exit_zero_on_windows() {
        if !cfg!(windows) {
            return;
        }
        let runner = StdProcessRunner;
        let code = runner
            .run(
                Path::new("cmd"),
                &[
                    OsString::from("/C"),
                    OsString::from("exit"),
                    OsString::from("0"),
                ],
            )
            .unwrap();
        assert_eq!(code, 0);
    }

    #[test]
    fn std_runner_runs_cmd_exit_nonzero_on_windows() {
        if !cfg!(windows) {
            return;
        }
        let runner = StdProcessRunner;
        let code = runner
            .run(
                Path::new("cmd"),
                &[
                    OsString::from("/C"),
                    OsString::from("exit"),
                    OsString::from("7"),
                ],
            )
            .unwrap();
        assert_eq!(code, 7);
    }

    #[cfg(unix)]
    #[test]
    fn std_runner_true_and_false() {
        let runner = StdProcessRunner;
        assert_eq!(runner.run(Path::new("/bin/true"), &[]).unwrap(), 0);
        assert_ne!(runner.run(Path::new("/bin/false"), &[]).unwrap(), 0);
    }

    #[test]
    fn export_error_display_messages() {
        assert!(ExportError::InvalidOutputPath.to_string().contains("pdf"));
        assert!(ExportError::Io("x".to_string()).to_string().contains("io"));
        assert!(ExportError::ChromeFailed(2).to_string().contains('2'));
        assert!(ExportError::PdfMissing.to_string().contains("pdf"));
    }

    fn tempfile_in_test() -> PathBuf {
        let dir = std::env::temp_dir().join(format!("pdf_export_{}", uuid::Uuid::new_v4()));
        std::fs::create_dir_all(&dir).unwrap();
        dir
    }
}
