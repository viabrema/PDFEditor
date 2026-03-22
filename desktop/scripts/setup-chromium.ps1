# Downloads chrome-headless-shell (Chrome for Testing) for Windows x64 into src-tauri/bundled-chromium.
$ErrorActionPreference = "Stop"
$version = (Get-Content -Path "$PSScriptRoot/chromium-version.txt" -Raw).Trim()
$zipName = "chrome-headless-shell-win64.zip"
$url = "https://storage.googleapis.com/chrome-for-testing-public/$version/win64/$zipName"
$destRoot = Join-Path $PSScriptRoot "../src-tauri/bundled-chromium"
$zipPath = Join-Path $destRoot $zipName

New-Item -ItemType Directory -Force -Path $destRoot | Out-Null
Write-Host "Downloading $url ..."
Invoke-WebRequest -Uri $url -OutFile $zipPath
Expand-Archive -Path $zipPath -DestinationPath $destRoot -Force
Remove-Item -Path $zipPath -Force
Write-Host "Chromium extracted under $destRoot (expect chrome-headless-shell-win64/chrome-headless-shell.exe)"
