$ErrorActionPreference = "Stop"

$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole(
    [Security.Principal.WindowsBuiltInRole]::Administrator
)

if (-not $isAdmin) {
    throw "This script must be run as administrator."
}

$runKey = "HKCU:\Software\Microsoft\Windows\CurrentVersion\Run"
$runBackupKey = "HKCU:\Software\CodexOptimizationBackup\Run"
New-Item -Path $runBackupKey -Force | Out-Null

foreach ($name in @("Adobe Acrobat Synchronizer", "EPSDNMON")) {
    $value = (Get-ItemProperty -Path $runKey -Name $name -ErrorAction SilentlyContinue).$name
    if ($null -ne $value) {
        New-ItemProperty -Path $runBackupKey -Name $name -Value $value -PropertyType String -Force | Out-Null
        Remove-ItemProperty -Path $runKey -Name $name -Force
    }
}

$serviceChanges = [ordered]@{
    "ESRV_SVC_QUEENCREEK"                    = "Disabled"
    "SystemUsageReportSvc_QUEENCREEK"        = "Disabled"
    "DSAService"                             = "Manual"
    "DSAUpdateService"                       = "Manual"
    "HPJumpStartBridge"                      = "Disabled"
    "HPSupportSolutionsFrameworkService"     = "Manual"
    "HP Comm Recover"                        = "Manual"
    "EpsonCustomerResearchParticipation"     = "Disabled"
}

foreach ($entry in $serviceChanges.GetEnumerator()) {
    $service = Get-Service -Name $entry.Key -ErrorAction SilentlyContinue
    if (-not $service) {
        continue
    }

    if ($service.Status -ne "Stopped") {
        Stop-Service -Name $entry.Key -Force -ErrorAction SilentlyContinue
    }

    Set-Service -Name $entry.Key -StartupType $entry.Value
}

$tasks = @(
    @{ Path = "\"; Name = "HPJumpStartLaunch" },
    @{ Path = "\Hewlett-Packard\HP Support Assistant\"; Name = "HP Support Solutions Framework Updater - Resources" },
    @{ Path = "\Hewlett-Packard\HP Support Assistant\"; Name = "HP Support Solutions Framework Updater - resources updates" },
    @{ Path = "\Hewlett-Packard\HP Support Assistant\"; Name = "Product Configurator" },
    @{ Path = "\Hewlett-Packard\HP Support Assistant\"; Name = "WarrantyChecker" },
    @{ Path = "\Hewlett-Packard\HP Support Assistant\"; Name = "Opt-in For HP Support Assistant Quick Start" }
)

foreach ($task in $tasks) {
    $existing = Get-ScheduledTask -TaskPath $task.Path -TaskName $task.Name -ErrorAction SilentlyContinue
    if (-not $existing) {
        continue
    }

    if ($existing.State -eq "Running") {
        Stop-ScheduledTask -TaskPath $task.Path -TaskName $task.Name -ErrorAction SilentlyContinue
    }

    Disable-ScheduledTask -TaskPath $task.Path -TaskName $task.Name | Out-Null
}

Get-Process -Name "AdobeCollabSync", "EPSDNMON", "DSATray", "HPJumpStartLaunch" -ErrorAction SilentlyContinue |
    Stop-Process -Force -ErrorAction SilentlyContinue

Write-Host "Low-risk machine-wide optimization applied."
