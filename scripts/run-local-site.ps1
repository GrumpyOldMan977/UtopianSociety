$ErrorActionPreference = "Stop"
$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$StateDirectory = Join-Path $ProjectRoot ".local-services"
$LogFile = Join-Path $StateDirectory "site.log"

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

$vinext = (Resolve-Path (Join-Path $ProjectRoot "node_modules\vinext\dist\cli.js")).Path

while ($true) {
  Add-Content -LiteralPath $LogFile -Value "[$((Get-Date).ToUniversalTime().ToString('o'))] Starting local site on port 9877."

  Push-Location $ProjectRoot
  try {
    & $node $vinext dev --port 9877
    $exitCode = $LASTEXITCODE
  } catch {
    Add-Content -LiteralPath $LogFile -Value "[$((Get-Date).ToUniversalTime().ToString('o'))] $($_.Exception.Message)"
    $exitCode = 1
  } finally {
    Pop-Location
  }

  Add-Content -LiteralPath $LogFile -Value "[$((Get-Date).ToUniversalTime().ToString('o'))] Local site stopped with exit code $exitCode; restarting in 10 seconds."
  Start-Sleep -Seconds 10
}
