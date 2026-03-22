//! Chamadas HTTP ao Hub IA feitas no processo nativo (sem CORS no browser).

use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HubIaPromptInput {
    pub url: String,
    pub api_key: String,
    pub prompt: String,
    pub provider: String,
    pub model: String,
    pub chat_id: Option<String>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct HubIaPromptOutput {
    pub status: u16,
    pub body: serde_json::Value,
}

#[tauri::command]
pub async fn hub_ia_prompt(input: HubIaPromptInput) -> Result<HubIaPromptOutput, String> {
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(120))
        .build()
        .map_err(|e| e.to_string())?;

    let mut map = serde_json::Map::new();
    map.insert(
        "prompt".to_string(),
        serde_json::Value::String(input.prompt),
    );
    map.insert(
        "provider".to_string(),
        serde_json::Value::String(input.provider),
    );
    map.insert("model".to_string(), serde_json::Value::String(input.model));
    if let Some(cid) = input.chat_id.filter(|s| !s.is_empty()) {
        map.insert("chatId".to_string(), serde_json::Value::String(cid));
    }
    let json_body = serde_json::Value::Object(map);

    let res = client
        .post(&input.url)
        .header("Content-Type", "application/json")
        .header("x-api-key", &input.api_key)
        .json(&json_body)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    let status = res.status().as_u16();
    let text = res.text().await.map_err(|e| e.to_string())?;

    let body = serde_json::from_str::<serde_json::Value>(&text).unwrap_or_else(|_| {
        serde_json::Value::String(text)
    });

    Ok(HubIaPromptOutput { status, body })
}
