param(
  [switch]$SkipBuild,
  [switch]$SkipCivicWorkflows
)

$ErrorActionPreference = "Stop"
$workspace = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $workspace

function Resolve-Executable {
  param([string[]]$Candidates)
  foreach ($candidate in $Candidates) {
    if ([string]::IsNullOrWhiteSpace($candidate)) { continue }
    if (Test-Path -LiteralPath $candidate) { return (Resolve-Path -LiteralPath $candidate).Path }
  }
  return $null
}

$commandNode = Get-Command node -ErrorAction SilentlyContinue
$node = Resolve-Executable @(
  $(if ($commandNode) { $commandNode.Source }),
  "$env:USERPROFILE\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
)
if (-not $node) { throw "Node.js 22 could not be found. Load the Codex workspace runtime first." }

$nodeDirectory = Split-Path -Parent $node
$env:Path = "$nodeDirectory;$env:Path"

$commandPnpm = Get-Command pnpm.cmd -ErrorAction SilentlyContinue
$pnpm = Resolve-Executable @(
  $(if ($commandPnpm) { $commandPnpm.Source }),
  "$env:USERPROFILE\.cache\codex-runtimes\codex-primary-runtime\dependencies\bin\fallback\pnpm.cmd"
)
if (-not $pnpm) { throw "pnpm could not be found in PATH or the bundled Codex runtime." }

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$logRoot = Join-Path $workspace ".codex-local-logs\qa-$timestamp"
New-Item -ItemType Directory -Path $logRoot -Force | Out-Null

function Invoke-QAStep {
  param(
    [string]$Name,
    [string]$Executable,
    [string[]]$Arguments,
    [hashtable]$Environment = @{}
  )
  Write-Host "`n=== $Name ===" -ForegroundColor Cyan
  $saved = @{}
  foreach ($key in $Environment.Keys) {
    $saved[$key] = [Environment]::GetEnvironmentVariable($key, "Process")
    [Environment]::SetEnvironmentVariable($key, [string]$Environment[$key], "Process")
  }
  try {
    $log = Join-Path $logRoot (($Name -replace "[^A-Za-z0-9._-]", "-") + ".log")
    $previousErrorActionPreference = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    try {
      & $Executable @Arguments 2>&1 | Tee-Object -FilePath $log
      $nativeExitCode = $LASTEXITCODE
    } finally {
      $ErrorActionPreference = $previousErrorActionPreference
    }
    if ($nativeExitCode -ne 0) { throw "$Name failed with exit code $nativeExitCode. See $log" }
  } finally {
    foreach ($key in $Environment.Keys) {
      [Environment]::SetEnvironmentVariable($key, $saved[$key], "Process")
    }
  }
}

try {
  $site = Invoke-WebRequest -Uri "http://localhost:9877" -UseBasicParsing -TimeoutSec 8
  $worker = Invoke-WebRequest -Uri "http://127.0.0.1:8788/health" -UseBasicParsing -TimeoutSec 8
  if ($site.StatusCode -ne 200 -or $worker.StatusCode -ne 200) {
    throw "The local site and Worker must both return HTTP 200."
  }

  if (-not $SkipBuild) {
    Invoke-QAStep "build-and-unit-tests" $pnpm @("test")
  }
  Invoke-QAStep "route-and-link-smoke" $node @("scripts/test-local-routes.mjs")

  if (-not $SkipCivicWorkflows) {
    Invoke-QAStep "fixture-reset-before" $node @("scripts/reset-local-test-fixture.mjs")
    Invoke-QAStep "immigration-assessment" $node @("scripts/test-local-assessment.mjs")
    Invoke-QAStep "fixture-reset-after-assessment" $node @("scripts/reset-local-test-fixture.mjs")
    Invoke-QAStep "civic-workflow" $node @("scripts/test-local-civic-workflow.mjs")
    Invoke-QAStep "fixture-reset-after-workflow" $node @("scripts/reset-local-test-fixture.mjs")
    Invoke-QAStep "learning-storage-round-trip" $node @("scripts/test-local-learning-evaluation.mjs") @{
      LEARNING_SKIP_AI = "1"
    }
    Invoke-QAStep "fixture-reset-final" $node @("scripts/reset-local-test-fixture.mjs")
  }

  Write-Host "`nLocal QA completed successfully." -ForegroundColor Green
  Write-Host "Logs: $logRoot"
} catch {
  Write-Host "`nLocal QA failed: $($_.Exception.Message)" -ForegroundColor Red
  Write-Host "Logs: $logRoot"
  exit 1
}
