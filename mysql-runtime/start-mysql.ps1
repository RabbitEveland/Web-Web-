# Start the MySQL instance configured for this project.
$runtimeRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$serverHome = 'D:\web-mall-mysql'
$serverExe = Join-Path $serverHome 'bin\mysqld.exe'
$configFile = Join-Path $serverHome 'my.ini'

$portInUse = Get-NetTCPConnection -LocalPort 3306 -ErrorAction SilentlyContinue
if ($null -ne $portInUse) {
  Write-Host 'Port 3306 is already in use. MySQL may already be running.'
  exit 0
}

if (-not (Test-Path -LiteralPath $serverExe)) {
  Write-Error "MySQL executable was not found: $serverExe"
  exit 1
}

Start-Process -FilePath $serverExe -ArgumentList "--defaults-file=$configFile" -WindowStyle Hidden
Write-Host 'MySQL is starting on 127.0.0.1:3306.'
