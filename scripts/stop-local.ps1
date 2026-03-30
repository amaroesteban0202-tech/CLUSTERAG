$ErrorActionPreference = 'Stop'

$projectId = 'cluster-41f73'

$processes = Get-CimInstance Win32_Process | Where-Object {
    $_.CommandLine -and (
        (
            $_.Name -eq 'java.exe' -and
            $_.CommandLine -match 'cloud-firestore-emulator' -and
            $_.CommandLine -match [regex]::Escape($projectId)
        ) -or (
            $_.Name -eq 'node.exe' -and
            $_.CommandLine -match 'firebase-tools' -and
            $_.CommandLine -match 'emulators:(start|exec)'
        )
    )
}

foreach ($process in $processes) {
    if ($process.ProcessId -ne $PID) {
        Write-Host "Stopping emulator process $($process.ProcessId) ($($process.Name))"
        Stop-Process -Id $process.ProcessId -Force -ErrorAction SilentlyContinue
    }
}
