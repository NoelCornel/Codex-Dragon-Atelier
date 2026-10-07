@echo off
powershell.exe -NoProfile -ExecutionPolicy RemoteSigned -File "%~dp0scripts\Launch.ps1" -Edition portrait
if errorlevel 1 pause
