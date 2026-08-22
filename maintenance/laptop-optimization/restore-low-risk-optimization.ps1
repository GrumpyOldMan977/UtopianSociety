$ErrorActionPreference = "Stop"

$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole(
    [Security.Principal.WindowsBuiltInRole]::Administrator
)

if (-not $isAdmin) {
    throw "This script must be run as administrator."
}

$runKey = "HKCU:\Software\Microsoft\Windows\CurrentVersion\Run"
$runBackupKey = "HKCU:\Software\CodexOptimizationBackup\Run"

if (Test-Path $runBackupKey) {
    $backup = Get-ItemProperty $runBackupKey
    foreach ($name in @("Adobe Acrobat Synchronizer", "EPSDNMON")) {
        $value = $backup.$name
        if ($null -ne $value) {
            New-ItemProperty -Path $runKey -Name $name -Value $value -PropertyType String -Force | Out-Null
        }
    }
}

$services = @(
    "ESRV_SVC_QUEENCREEK",
    "SystemUsageReportSvc_QUEENCREEK",
    "DSAService",
    "DSAUpdateService",
    "HPJumpStartBridge",
    "HPSupportSolutionsFrameworkService",
    "HP Comm Recover",
    "EpsonCustomerResearchParticipation"
)

foreach ($name in $services) {
    if (Get-Service -Name $name -ErrorAction SilentlyContinue) {
        Set-Service -Name $name -StartupType Automatic
    }
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
    if (Get-ScheduledTask -TaskPath $task.Path -TaskName $task.Name -ErrorAction SilentlyContinue) {
        Enable-ScheduledTask -TaskPath $task.Path -TaskName $task.Name | Out-Null
    }
}

Write-Host "Original machine-wide startup behavior restored."
