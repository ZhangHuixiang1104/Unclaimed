$ErrorActionPreference = 'Stop'
$projectRoot = $PSScriptRoot
$healthUrl = 'http://127.0.0.1:8000/api/v1/health'
$backendProcess = $null

function Get-ArchiveBackendHealth {
  try {
    return Invoke-RestMethod -Uri $healthUrl -TimeoutSec 2
  } catch {
    return $null
  }
}

$backendHealth = Get-ArchiveBackendHealth
if ($backendHealth -and ($backendHealth.status -ne 'ok' -or $backendHealth.saveContract -ne 'independent-chapters-v3')) {
  throw 'Port 8000 has an incompatible archive service. Stop that backend process, then run start-dev.ps1 again.'
}

if (-not $backendHealth) {
  Write-Host 'Starting archive save service...'
  $backendProcess = Start-Process -FilePath 'python' -ArgumentList @('-m', 'uvicorn', 'backend.app:app', '--host', '127.0.0.1', '--port', '8000') -WorkingDirectory $projectRoot -WindowStyle Hidden -PassThru
  $backendReady = $false
  for ($attempt = 0; $attempt -lt 30; $attempt++) {
    $backendHealth = Get-ArchiveBackendHealth
    if ($backendHealth -and $backendHealth.status -eq 'ok' -and $backendHealth.saveContract -eq 'independent-chapters-v3') { $backendReady = $true; break }
    if ($backendProcess.HasExited) { break }
    Start-Sleep -Milliseconds 500
  }
  if (-not $backendReady) {
    if (-not $backendProcess.HasExited) { Stop-Process -Id $backendProcess.Id }
    throw 'Archive service did not start. Install backend/requirements.txt and check port 8000.'
  }
}

Write-Host 'Archive service is ready: http://127.0.0.1:8000/api/v1/health'
Write-Host 'Starting frontend: http://127.0.0.1:4173'
try {
  npm --prefix (Join-Path $projectRoot 'frontend') run dev
} finally {
  if ($backendProcess -and -not $backendProcess.HasExited) {
    Stop-Process -Id $backendProcess.Id
  }
}
