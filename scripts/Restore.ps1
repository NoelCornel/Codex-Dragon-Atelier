$ErrorActionPreference='Stop'
$root=Split-Path $PSScriptRoot -Parent
$state=Join-Path $env:LOCALAPPDATA 'CodexDragonAtelier'
$file=Join-Path $state 'watcher.json'
if(!(Test-Path -LiteralPath $file)){Write-Host 'No recorded watcher; to remove a test session run node scripts/apply.mjs --port <port> --restore';exit 0}
$saved=Get-Content -LiteralPath $file -Encoding UTF8 -Raw|ConvertFrom-Json
$recordedStart=([DateTime]$saved.startedAt).ToUniversalTime()
if($saved.root -ne $root){throw 'Restore must run from the recorded installation root'}
$process=Get-CimInstance Win32_Process -Filter "ProcessId=$($saved.pid)" -ErrorAction SilentlyContinue
if($process){
  $live=Get-Process -Id $saved.pid
  if($process.Name -ne 'node.exe' -or !$process.CommandLine.Contains((Join-Path $saved.root 'scripts\apply.mjs')) -or $live.StartTime.ToUniversalTime() -ne $recordedStart){throw 'Watcher identity changed; refused to stop unrelated process'}
  Stop-Process -Id $saved.pid
}
& node (Join-Path $root 'scripts\apply.mjs') --port $saved.port --restore
if($LASTEXITCODE -ne 0){throw 'Live restore did not complete; close the test Codex window to remove its transient decoration'}
Move-Item -LiteralPath $file -Destination ($file+'.restored-'+(Get-Date -Format yyyyMMddHHmmss))
Write-Host 'Decorations removed. Native colors remain installed; import your saved original codes to restore colors.'
