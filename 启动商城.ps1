# One-click launcher for the Web Mall course project.
# Services run in the background and write logs to runtime-logs.
$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$mysqlScript = Join-Path $projectRoot 'mysql-runtime\start-mysql.ps1'
$runtimeBase = Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies'
$nodeExe = Join-Path $runtimeBase 'node\bin\node.exe'
$serverDirectory = Join-Path $projectRoot 'server'
$clientDirectory = Join-Path $projectRoot 'client'
$viteScript = Join-Path $clientDirectory 'node_modules\vite\bin\vite.js'
$logDirectory = Join-Path $projectRoot 'runtime-logs'

function Test-LocalPort {
  param([int]$Port)
  $connection = netstat.exe -ano | Select-String -SimpleMatch ":$Port " | Select-String -Pattern 'LISTENING'
  return $null -ne $connection
}

function Wait-ForPort {
  param([int]$Port, [int]$Attempts = 24)
  for ($attempt = 0; $attempt -lt $Attempts; $attempt++) {
    if (Test-LocalPort -Port $Port) { return $true }
    Start-Sleep -Milliseconds 250
  }
  return $false
}

if (-not (Test-Path -LiteralPath $mysqlScript)) {
  Write-Error "MySQL startup script was not found: $mysqlScript"
  exit 1
}

if (-not (Test-Path -LiteralPath $nodeExe)) {
  Write-Error "Bundled Node.js was not found: $nodeExe"
  exit 1
}

if (-not (Test-Path -LiteralPath $viteScript)) {
  Write-Error "Frontend dependencies were not found. Run pnpm install in the client directory first."
  exit 1
}

New-Item -ItemType Directory -Path $logDirectory -Force | Out-Null

Write-Host 'Step 1/3: Starting MySQL...'
& $mysqlScript
if (-not (Wait-ForPort -Port 3306)) {
  Write-Error 'MySQL did not start on port 3306.'
  exit 1
}

if (Test-LocalPort -Port 3000) {
  Write-Host 'Step 2/3: API is already running on port 3000.'
} else {
  Write-Host 'Step 2/3: Starting API...'
  Start-Process -FilePath $nodeExe -ArgumentList @('--watch', 'app.js') -WorkingDirectory $serverDirectory -WindowStyle Hidden -RedirectStandardOutput (Join-Path $logDirectory 'api.out.log') -RedirectStandardError (Join-Path $logDirectory 'api.error.log')
  if (-not (Wait-ForPort -Port 3000)) {
    Write-Error "API failed to start. See $logDirectory\api.error.log"
    exit 1
  }
}

if (Test-LocalPort -Port 5173) {
  Write-Host 'Step 3/3: Web client is already running on port 5173.'
} else {
  Write-Host 'Step 3/3: Starting web client...'
  Start-Process -FilePath $nodeExe -ArgumentList @($viteScript, '--host', '127.0.0.1') -WorkingDirectory $clientDirectory -WindowStyle Hidden -RedirectStandardOutput (Join-Path $logDirectory 'client.out.log') -RedirectStandardError (Join-Path $logDirectory 'client.error.log')
  if (-not (Wait-ForPort -Port 5173)) {
    Write-Error "Web client failed to start. See $logDirectory\client.error.log"
    exit 1
  }
}

Write-Host ''
Write-Host 'Mall started successfully: http://127.0.0.1:5173'
