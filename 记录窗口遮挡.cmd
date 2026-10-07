@echo off
powershell.exe -NoProfile -ExecutionPolicy RemoteSigned -File "%~dp0scripts\Inspect-BlockingWindow.ps1"
pause
