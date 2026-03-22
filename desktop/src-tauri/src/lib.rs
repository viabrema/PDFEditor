mod commands;
mod hub_ia;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            commands::export_pdf_from_html,
            hub_ia::hub_ia_prompt,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
