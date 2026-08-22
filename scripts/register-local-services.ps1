param(
  [string]$SiteTaskName = "Utopian Society Local Site",
  [string]$WorkerTaskName = "Utopian Society Civic Worker"
)

$ErrorActionPreference = "Stop"
$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$CurrentUser = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name
$WScript = Join-Path $env:SystemRoot "System32\wscript.exe"
$HiddenRunner = (Resolve-Path (Join-Path $PSScriptRoot "run-hidden-service.vbs")).Path
$SiteRunner = (Resolve-Path (Join-Path $PSScriptRoot "run-local-site.ps1")).Path
$WorkerRunner = (Resolve-Path (Join-Path $PSScriptRoot "run-local-worker.ps1")).Path

function Register-LocalServiceTask {
  param(
    [string]$TaskName,
    [string]$Arguments,
    [string]$Description
  )

  $action = New-ScheduledTaskAction `
    -Execute $script:WScript `
    -Argument $Arguments `
    -WorkingDirectory $script:ProjectRoot

  $trigger = New-ScheduledTaskTrigger -AtLogOn -User $script:CurrentUser
  $principal = New-ScheduledTaskPrincipal `
    -UserId $script:CurrentUser `
    -LogonType Interactive `
    -RunLevel Limited

  $settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -MultipleInstances IgnoreNew `
    -RestartCount 999 `
    -RestartInterval (New-TimeSpan -Minutes 1) `
    -ExecutionTimeLimit ([TimeSpan]::Zero)

  Register-ScheduledTask `
    -TaskName $TaskName `
    -Action $action `
    -Trigger $trigger `
    -Principal $principal `
    -Settings $settings `
    -Description $Description `
    -Force | Out-Null
}

# Remove the earlier combined supervisor task if it exists.
$legacyTask = Get-ScheduledTask -TaskName "Utopian Society Local Services" -ErrorAction SilentlyContinue
if ($legacyTask) {
  Stop-ScheduledTask -TaskName $legacyTask.TaskName -ErrorAction SilentlyContinue
  Unregister-ScheduledTask -TaskName $legacyTask.TaskName -Confirm:$false
}

Register-LocalServiceTask `
  -TaskName $SiteTaskName `
  -Arguments "`"$HiddenRunner`" `"$SiteRunner`"" `
  -Description "Runs the Utopian Society local website on http://localhost:9877."

Register-LocalServiceTask `
  -TaskName $WorkerTaskName `
  -Arguments "`"$HiddenRunner`" `"$WorkerRunner`"" `
  -Description "Runs the Utopian Society local civic Worker on http://localhost:8788."

Start-ScheduledTask -TaskName $SiteTaskName
Start-ScheduledTask -TaskName $WorkerTaskName

Write-Output "Registered and started '$SiteTaskName' and '$WorkerTaskName'."
