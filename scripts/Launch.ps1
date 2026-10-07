param([ValidateRange(1024,65535)][int]$Port=9445,[ValidateSet('q','portrait')][string]$Edition='q')
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
$reuseWatcher=$false
# WinPS launched from PS7 can inherit a module path where the Get-FileHash
# function is unavailable. Use framework SHA256 without changing module paths.
$payloadPath=Join-Path $root "dist\dragon-atelier-$Edition.js"
$sha=[Security.Cryptography.SHA256]::Create()
try{$payloadHash=[BitConverter]::ToString($sha.ComputeHash([IO.File]::ReadAllBytes($payloadPath))).Replace('-','')}
finally{$sha.Dispose()}
if(Test-Path -LiteralPath $pidFile){
  $old=Get-Content -LiteralPath $pidFile -Raw -Encoding UTF8 | ConvertFrom-Json
  $recordedStart=([DateTime]$old.startedAt).ToUniversalTime()
  $process=Get-CimInstance Win32_Process -Filter "ProcessId=$($old.pid)" -ErrorAction SilentlyContinue
  if($process){
    if($process.Name -ne 'node.exe' -or $old.root -ne $root -or !$process.CommandLine.Contains((Join-Path $root 'scripts\apply.mjs')) -or (Get-Process -Id $old.pid).StartTime.ToUniversalTime() -ne $recordedStart){throw 'Watcher identity changed; refused to stop unrelated process'}
    if($old.edition -eq $Edition -and $old.port -eq $Port -and $old.payloadHash -eq $payloadHash){$reuseWatcher=$true}
    else{Stop-Process -Id $old.pid}
  }
}
$listen=Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction SilentlyContinue
if($listen){
  $owner=Get-Process -Id $listen[0].OwningProcess
  if($owner.Path -ne $exe -or $listen[0].LocalAddress -ne '127.0.0.1'){throw 'Port is owned by another application; choose a free port'}
  # Closing the native window can leave its renderer and CDP endpoint alive.
  # Reopen the same verified official client's profile, never create another
  # profile against a port already in use or resize an existing window.
  if($owner.MainWindowHandle -eq 0){
    $ownerRecord=Get-CimInstance Win32_Process -Filter "ProcessId=$($owner.Id)"
    $profileMatch=[regex]::Match($ownerRecord.CommandLine,'--user-data-dir=(?:"(?<quoted>[^"]+)"|(?<plain>\S+))')
    if(!$profileMatch.Success){throw 'The test client window is closed and its profile could not be identified. Reopen that client explicitly.'}
    $profile=$profileMatch.Groups['quoted'].Value
    if(!$profile){$profile=$profileMatch.Groups['plain'].Value}
    $profile=[IO.Path]::GetFullPath($profile)
    if(!(Test-Path -LiteralPath $profile -PathType Container)){throw 'The existing client profile is unavailable; no new profile was created'}
    Start-Process -FilePath $exe -ArgumentList @('--remote-debugging-address=127.0.0.1',"--remote-debugging-port=$Port",("--user-data-dir=`"$profile`"")) -WindowStyle Normal | Out-Null
  }
}else{
  $profile=Join-Path $state 'profile'
  Start-Process -FilePath $exe -ArgumentList @('--remote-debugging-address=127.0.0.1',"--remote-debugging-port=$Port",("--user-data-dir=`"$profile`"")) -WindowStyle Normal | Out-Null
  $ready=$false
  for($attempt=0;$attempt -lt 25;$attempt++){
    try{$null=Invoke-RestMethod "http://127.0.0.1:$Port/json/version" -TimeoutSec 1;$ready=$true;break}catch{Start-Sleep -Milliseconds 400}
  }
  if(!$ready){throw 'Current Codex did not expose loopback CDP; no protected files were changed'}
}
if($reuseWatcher){Write-Host 'Dragon Atelier is already running';exit 0}
$script=Join-Path $root 'scripts\apply.mjs'
$watcher=Start-Process -FilePath $node -ArgumentList @("`"$script`"",'--port',"$Port",'--edition',$Edition,'--watch') -WindowStyle Hidden -RedirectStandardOutput (Join-Path $state 'watcher.log') -RedirectStandardError (Join-Path $state 'watcher-error.log') -PassThru
Start-Sleep -Milliseconds 1000
$watcher.Refresh()
if($watcher.HasExited){throw 'Theme watcher failed. Inspect CodexDragonAtelier/watcher-error.log in LOCALAPPDATA.'}
$record=@{pid=$watcher.Id;port=$Port;edition=$Edition;payloadHash=$payloadHash;startedAt=$watcher.StartTime.ToUniversalTime().ToString('o');root=$root}
[IO.File]::WriteAllText($pidFile,($record|ConvertTo-Json),[Text.UTF8Encoding]::new($false))
Write-Host 'Dragon Atelier launched; native theme codes are in dist/native-dark.txt and dist/native-light.txt'
