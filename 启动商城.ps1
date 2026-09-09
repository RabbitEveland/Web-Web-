# One-click launcher for the Web Mall course project.
$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$mysqlScript = Join-Path $projectRoot 'mysql-runtime\start-mysql.ps1'
$serverScript = Join-Path $projectRoot '启动后端.ps1'
$clientScript = Join-Path $projectRoot '启动前端.ps1'

function Test-LocalPort {
  param([int]$Port)
  $connection = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
  return $null -ne $connection
}

if (-not (Test-Path -LiteralPath $mysqlScript)) {
  Write-Error "MySQL startup script was not found: $mysqlScript"
  exit 1
}

Write-Host 'Step 1/3: Starting MySQL...'
& $mysqlScript
Start-Sleep -Seconds 2

if (Test-LocalPort -Port 3000) {
  Write-Host 'The API is already running on port 3000.'
} else {
  Write-Host 'Step 2/3: Opening API window...'
  Start-Process -FilePath 'powershell.exe' -WorkingDirectory $projectRoot -ArgumentList @('-NoExit', '-ExecutionPolicy', 'Bypass', '-File', $serverScript)
}

if (Test-LocalPort -Port 5173) {
  Write-Host 'The web client is already running on port 5173.'
} else {
  Write-Host 'Step 3/3: Opening web-client window...'
  Start-Process -FilePath 'powershell.exe' -WorkingDirectory $projectRoot -ArgumentList @('-NoExit', '-ExecutionPolicy', 'Bypass', '-File', $clientScript)
}

Write-Host ''
Write-Host 'When both windows show ready, open: http://127.0.0.1:5173'
