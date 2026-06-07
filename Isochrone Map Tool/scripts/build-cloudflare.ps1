$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$dist = Join-Path $root "dist"
$serverDir = Join-Path $dist "server"
$clientDir = Join-Path $dist "client"
$openaiDir = Join-Path $dist ".openai"

if (Test-Path $dist) {
  Remove-Item -Recurse -Force $dist
}

New-Item -ItemType Directory -Force -Path $serverDir | Out-Null
New-Item -ItemType Directory -Force -Path $clientDir | Out-Null
New-Item -ItemType Directory -Force -Path $openaiDir | Out-Null

Copy-Item (Join-Path $root "cloudflare\\worker.js") (Join-Path $serverDir "index.js")
Copy-Item (Join-Path $root "index.html") (Join-Path $clientDir "index.html")
Copy-Item (Join-Path $root "styles.css") (Join-Path $clientDir "styles.css")
Copy-Item (Join-Path $root "app.js") (Join-Path $clientDir "app.js")
Copy-Item (Join-Path $root ".openai\\hosting.json") (Join-Path $openaiDir "hosting.json")

Write-Output "Cloudflare build staged in $dist"
