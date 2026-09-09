# Launch the mall web client with the bundled Node.js and pnpm runtime.
$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$clientDirectory = Join-Path $projectRoot 'client'
$runtimeBase = Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies'
$nodeBin = Join-Path $runtimeBase 'node\bin'
$pnpmCommand = Join-Path $runtimeBase 'bin\fallback\pnpm.cmd'

if (-not (Test-Path -LiteralPath $pnpmCommand)) {
  Write-Error "Bundled pnpm was not found: $pnpmCommand"
  exit 1
}

$env:Path = "$nodeBin;$env:Path"
Set-Location -LiteralPath $clientDirectory
Write-Host 'Starting mall web client at http://127.0.0.1:5173 ...'
& $pnpmCommand exec vite --host 127.0.0.1
exit $LASTEXITCODE
