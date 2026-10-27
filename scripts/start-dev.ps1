$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$healthUrl = 'http://127.0.0.1:8000/api/v1/health'
$expectedSaveContract = 'independent-chapters-v6'
$expectedIdentityContract = 'account-bound-v1'
$backendProcess = $null

function Get-ArchiveBackendHealth {
  try {
    return Invoke-RestMethod -Uri $healthUrl -TimeoutSec 2
  } catch {
    return $null
  }
}

$backendHealth = Get-ArchiveBackendHealth
if ($backendHealth -and ($backendHealth.status -ne 'ok' -or $backendHealth.saveContract -ne $expectedSaveContract -or $backendHealth.identityContract -ne $expectedIdentityContract)) {
  throw "Port 8000 has an incompatible archive service (save: $($backendHealth.saveContract); identity: $($backendHealth.identityContract)). Stop that backend process, then run start-dev.ps1 again."
}

if (-not $backendHealth) {
  Write-Host 'Starting archive save service...'
  $backendProcess = Start-Process -FilePath 'python' -ArgumentList @('-m', 'uvicorn', 'backend.app:app', '--host', '127.0.0.1', '--port', '8000') -WorkingDirectory $projectRoot -WindowStyle Hidden -PassThru
  $backendReady = $false
  for ($attempt = 0; $attempt -lt 30; $attempt++) {
    $backendHealth = Get-ArchiveBackendHealth
    if ($backendHealth -and $backendHealth.status -eq 'ok' -and $backendHealth.saveContract -eq $expectedSaveContract -and $backendHealth.identityContract -eq $expectedIdentityContract) { $backendReady = $true; break }
    if ($backendProcess.HasExited) { break }
    Start-Sleep -Milliseconds 500
  }
  if (-not $backendReady) {
    if (-not $backendProcess.HasExited) { Stop-Process -Id $backendProcess.Id }
    if ($backendHealth) {
      throw "Archive service returned incompatible contracts (save: $($backendHealth.saveContract); identity: $($backendHealth.identityContract))."
    }
    throw 'Archive service did not start. Run "python -m uvicorn backend.app:app --host 127.0.0.1 --port 8000" in this directory to see the backend error.'
  }
}

Write-Host 'Archive service is ready: http://127.0.0.1:8000/api/v1/health'
Write-Host 'Starting frontend: http://127.0.0.1:5173'
$frontendExitCode = 0
try {
  npm --prefix (Join-Path $projectRoot 'frontend') run dev
  $frontendExitCode = $LASTEXITCODE
} finally {
  if ($backendProcess -and -not $backendProcess.HasExited) {
    Stop-Process -Id $backendProcess.Id
  }
}
if ($frontendExitCode -ne 0) {
  throw "Frontend did not start (exit code: $frontendExitCode). Check the error above and whether port 5173 is available."
}
