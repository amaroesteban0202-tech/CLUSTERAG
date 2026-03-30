$ErrorActionPreference = 'Stop'

$projectId = 'cluster-41f73'
$repoRoot = Split-Path -Parent $PSScriptRoot

Set-Location $repoRoot

function Stop-StaleFirebaseProcesses {
    $staleProcesses = Get-CimInstance Win32_Process | Where-Object {
        $_.CommandLine -and (
            (
                $_.Name -eq 'java.exe' -and
                $_.CommandLine -match 'cloud-firestore-emulator' -and
                $_.CommandLine -match [regex]::Escape($projectId)
            ) -or (
                $_.Name -eq 'node.exe' -and
                $_.CommandLine -match 'firebase-tools' -and
                $_.CommandLine -match 'emulators:(start|exec)' -and
                $_.CommandLine -match [regex]::Escape($repoRoot)
            )
        )
    }

    foreach ($process in $staleProcesses) {
        if ($process.ProcessId -ne $PID) {
            Write-Host "Stopping stale emulator process $($process.ProcessId) ($($process.Name))"
            Stop-Process -Id $process.ProcessId -Force -ErrorAction SilentlyContinue
        }
    }

    Start-Sleep -Seconds 2
}

function Assert-PortFree {
    param(
        [int]$Port
    )

    $connection = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue | Where-Object { $_.State -eq 'Listen' }
    if ($connection) {
        $owners = ($connection | Select-Object -ExpandProperty OwningProcess -Unique) -join ', '
        throw "Port $Port is still occupied by PID(s): $owners"
    }
}

Stop-StaleFirebaseProcesses

Assert-PortFree -Port 8787
Assert-PortFree -Port 5001
Assert-PortFree -Port 5000

npx --yes firebase-tools emulators:start --only firestore,functions,hosting --project $projectId
