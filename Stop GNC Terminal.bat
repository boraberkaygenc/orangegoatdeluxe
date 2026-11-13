@echo off
rem Stops GNC Terminal (the hidden server started by the GNC Terminal icon). Your data is saved first.
setlocal
title Stop GNC Terminal
cd /d "%~dp0"
set "NODE="
where node >nul 2>nul && set "NODE=node"
if not defined NODE if exist "%ProgramFiles%\nodejs\node.exe" set "NODE=%ProgramFiles%\nodejs\node.exe"
if not defined NODE if exist "%LocalAppData%\Programs\nodejs\node.exe" set "NODE=%LocalAppData%\Programs\nodejs\node.exe"
if not defined NODE goto nonode
"%NODE%" "%~dp0launcher\gnc.mjs" --stop
if errorlevel 1 pause
timeout /t 3 >nul
exit /b 0

:nonode
echo.
echo  Node.js was not found on this PC. GNC Terminal needs it (free).
echo  Install the LTS "Windows Installer (.msi)" from https://nodejs.org with the default settings,
echo  then run this file again.
start "" "https://nodejs.org/en/download"
echo.
pause
exit /b 1
