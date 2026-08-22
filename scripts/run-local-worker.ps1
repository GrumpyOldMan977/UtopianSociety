$ErrorActionPreference = "Stop"
$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$StateDirectory = Join-Path $ProjectRoot ".local-services"
$LogFile = Join-Path $StateDirectory "worker.log"

New-Item -ItemType Directory -Path $StateDirectory -Force | Out-Null
$env:CI = "1"
$env:NO_COLOR = "1"
$env:FORCE_COLOR = "0"

$nodeCandidates = @(
  (Join-Path $env:USERPROFILE ".cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"),
  (Join-Path $env:ProgramFiles "nodejs\node.exe")
)
$pathNode = Get-Command node.exe -ErrorAction SilentlyContinue
if ($pathNode) {
  $nodeCandidates += $pathNode.Source
}

$node = $nodeCandidates |
  Where-Object { $_ -and (Test-Path -LiteralPath $_) } |
  Select-Object -First 1

if (-not $node) {
  Add-Content -LiteralPath $LogFile -Value "[$((Get-Date).ToUniversalTime().ToString('o'))] Node.js was not found."
  exit 1
}

$wrangler = (Resolve-Path (Join-Path $ProjectRoot "node_modules\wrangler\bin\wrangler.js")).Path

while ($true) {
  Add-Content -LiteralPath $LogFile -Value "[$((Get-Date).ToUniversalTime().ToString('o'))] Starting civic Worker on port 8788."

  Push-Location $ProjectRoot
  try {
    & $node $wrangler dev --cwd "cloudflare/civic-ledger" --config "wrangler.local.jsonc" --port 8788
    $exitCode = $LASTEXITCODE
  } catch {
    Add-Content -LiteralPath $LogFile -Value "[$((Get-Date).ToUniversalTime().ToString('o'))] $($_.Exception.Message)"
    $exitCode = 1
  } finally {
    Pop-Location
  }

  Add-Content -LiteralPath $LogFile -Value "[$((Get-Date).ToUniversalTime().ToString('o'))] Civic Worker stopped with exit code $exitCode; restarting in 10 seconds."
  Start-Sleep -Seconds 10
}
