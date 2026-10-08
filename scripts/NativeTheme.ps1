param([ValidateSet('dark','light')][string]$Mode)
$ErrorActionPreference='Stop'
$root=Split-Path $PSScriptRoot -Parent
if(!$Mode){
  Write-Host 'Lite native theme: 1 = warm dark, 2 = paper light, 0 = cancel'
  $choice=Read-Host 'Select'
  switch($choice){'1'{$Mode='dark'}'2'{$Mode='light'}'0'{exit 0}default{throw 'Choose 1, 2 or 0'}}
}
$file=Join-Path $root "dist\native-$Mode.txt"
$code=[IO.File]::ReadAllText($file,[Text.Encoding]::UTF8).Trim()
if(!$code.StartsWith('codex-theme-v1:')){throw 'Invalid sharing code'}
Set-Clipboard -Value $code
Write-Host "Copied $Mode sharing code. In Codex: Settings -> Appearance -> Import the $Mode theme."
Write-Host 'Import both modes separately. Lite uses only native colors; no background watcher is started.'
