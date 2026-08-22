param(
  [string[]]$TaskNames = @(
    "Utopian Society Local Site",
    "Utopian Society Civic Worker",
    "Utopian Society Local Services"
  )
)

$ErrorActionPreference = "Stop"
$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path

foreach ($taskName in $TaskNames) {
  $task = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
  if ($task) {
    Stop-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
  }
}

# Task Scheduler stops the WScript host but can leave its hidden child process
# tree alive. Remove only processes whose command lines belong to this project.
$serviceProcesses = Get-CimInstance Win32_Process | Where-Object {
  $_.CommandLine -and
  $_.CommandLine.Contains($ProjectRoot) -and
  (
    $_.CommandLine -like "*run-hidden-service.vbs*" -or
    $_.CommandLine -like "*run-local-site.ps1*" -or
    $_.CommandLine -like "*run-local-worker.ps1*" -or
    $_.CommandLine -like "*node_modules*vinext*" -or
    $_.CommandLine -like "*node_modules*wrangler*" -or
    $_.CommandLine -like "*node_modules*@cloudflare*workerd*"
  )
}

foreach ($serviceProcess in $serviceProcesses) {
  Stop-Process -Id $serviceProcess.ProcessId -Force -ErrorAction SilentlyContinue
}

foreach ($port in 9877, 8788) {
  $processIds = Get-NetTCPConnection -State Listen -LocalPort $port -ErrorAction SilentlyContinue |
    Select-Object -ExpandProperty OwningProcess -Unique

  foreach ($processId in $processIds) {
    $process = Get-CimInstance Win32_Process -Filter "ProcessId = $processId" -ErrorAction SilentlyContinue
    if ($process.CommandLine -and $process.CommandLine.Contains($ProjectRoot)) {
      Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
    }
  }
}

Write-Output "Removed the Utopian Society local service tasks and stopped their listeners on 9877 and 8788."
