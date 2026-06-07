$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$workerSource = Get-Content (Join-Path $root "cloudflare\\worker.js") -Raw
$html = Get-Content (Join-Path $root "index.html") -Raw
$css = Get-Content (Join-Path $root "styles.css") -Raw
$js = Get-Content (Join-Path $root "app.js") -Raw

function Convert-ToJsStringLiteral([string]$value) {
  return ($value | ConvertTo-Json -Compress)
}

$outputPath = Join-Path $root "dist\\server\\live-worker.js"
New-Item -ItemType Directory -Force -Path (Split-Path -Parent $outputPath) | Out-Null

$assetPrefix = @"
const indexHtmlAsset = $(Convert-ToJsStringLiteral $html);
const stylesCssAsset = $(Convert-ToJsStringLiteral $css);
const appJsAsset = $(Convert-ToJsStringLiteral $js);

"@

$workerBody = $workerSource `
  -replace 'env\["index\.html"\]', 'indexHtmlAsset' `
  -replace 'env\[asset\.path\]', '{ "index.html": indexHtmlAsset, "styles.css": stylesCssAsset, "app.js": appJsAsset }[asset.path]' `
  -replace 'if \(env\.ASSETS\) \{[\s\S]*?if \(assetResponse\.status !== 404\) \{[\s\S]*?\}\s*\}', ''

Set-Content -Path $outputPath -Value ($assetPrefix + $workerBody) -Encoding UTF8
Write-Output "Inline worker written to $outputPath"
