param([ValidateRange(1024,65535)][int]$Port=9445)
$ErrorActionPreference='Stop'
$root=Split-Path $PSScriptRoot -Parent
$node=(Get-Command node -ErrorAction Stop).Source
$nodeVersion=(& $node --version).Trim().TrimStart('v')
if([int]($nodeVersion.Split('.')[0]) -lt 22){throw 'Node.js 22+ required'}
$package=Get-AppxPackage -Name OpenAI.Codex | Sort-Object Version -Descending | Select-Object -First 1
if(!$package){throw 'Official Store Codex package not found'}
$exe=Join-Path $package.InstallLocation 'app\ChatGPT.exe'
if(!(Test-Path -LiteralPath $exe)){throw 'Official executable missing'}
$state=Join-Path $env:LOCALAPPDATA 'CodexDragonAtelier'
New-Item -ItemType Directory -Path $state -Force | Out-Null
$pidFile=Join-Path $state 'watcher.json'
if(Test-Path -LiteralPath $pidFile){
  $old=Get-Content -LiteralPath $pidFile -Raw -Encoding UTF8 | ConvertFrom-Json
  $process=Get-CimInstance Win32_Process -Filter "ProcessId=$($old.pid)" -ErrorAction SilentlyContinue
  if($process -and $process.Name -eq 'node.exe' -and $old.root -eq $root -and $process.CommandLine.Contains((Join-Path $root 'scripts\apply.mjs')) -and (Get-Process -Id $old.pid).StartTime.ToUniversalTime().ToString('o') -eq $old.startedAt){Write-Host 'Dragon Atelier is already running';exit 0}
}
$listen=Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction SilentlyContinue
if($listen){
  $owner=Get-Process -Id $listen[0].OwningProcess
  if($owner.Path -ne $exe -or $listen[0].LocalAddress -ne '127.0.0.1'){throw 'Port is owned by another application; choose a free port'}
}else{
  $profile=Join-Path $state 'profile'
  Start-Process -FilePath $exe -ArgumentList @('--remote-debugging-address=127.0.0.1',"--remote-debugging-port=$Port",("--user-data-dir=`"$profile`"")) -WindowStyle Normal | Out-Null
  $ready=$false
  for($attempt=0;$attempt -lt 25;$attempt++){
    try{$null=Invoke-RestMethod "http://127.0.0.1:$Port/json/version" -TimeoutSec 1;$ready=$true;break}catch{Start-Sleep -Milliseconds 400}
  }
  if(!$ready){throw 'Current Codex did not expose loopback CDP; no protected files were changed'}
}
$script=Join-Path $root 'scripts\apply.mjs'
$watcher=Start-Process -FilePath $node -ArgumentList @("`"$script`"",'--port',"$Port",'--watch') -WindowStyle Hidden -RedirectStandardOutput (Join-Path $state 'watcher.log') -RedirectStandardError (Join-Path $state 'watcher-error.log') -PassThru
Start-Sleep -Milliseconds 1000
$watcher.Refresh()
if($watcher.HasExited){throw 'Theme watcher failed. Inspect CodexDragonAtelier/watcher-error.log in LOCALAPPDATA.'}
$record=@{pid=$watcher.Id;port=$Port;startedAt=$watcher.StartTime.ToUniversalTime().ToString('o');root=$root}
[IO.File]::WriteAllText($pidFile,($record|ConvertTo-Json),[Text.UTF8Encoding]::new($false))
Write-Host 'Dragon Atelier launched; native theme codes are in dist/native-dark.txt and dist/native-light.txt'
