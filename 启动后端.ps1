# Launch the mall API with the bundled Node.js and pnpm runtime.
$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$serverDirectory = Join-Path $projectRoot 'server'
$runtimeBase = Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies'
$nodeBin = Join-Path $runtimeBase 'node\bin'
$pnpmCommand = Join-Path $runtimeBase 'bin\fallback\pnpm.cmd'

if (-not (Test-Path -LiteralPath $pnpmCommand)) {
  Write-Error "Bundled pnpm was not found: $pnpmCommand"
  exit 1
}

$env:Path = "$nodeBin;$env:Path"
Set-Location -LiteralPath $serverDirectory
Write-Host 'Starting mall API at http://localhost:3000 ...'
& $pnpmCommand dev
exit $LASTEXITCODE
