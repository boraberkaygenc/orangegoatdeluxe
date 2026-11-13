@echo off
rem Writes a report about this PC (Node.js, port, Windows security, logs) and opens it in Notepad.
rem The report never contains config.json or your data.
setlocal
title GNC Terminal - diagnose
cd /d "%~dp0"
set "NODE="
where node >nul 2>nul && set "NODE=node"
if not defined NODE if exist "%ProgramFiles%\nodejs\node.exe" set "NODE=%ProgramFiles%\nodejs\node.exe"
if not defined NODE if exist "%LocalAppData%\Programs\nodejs\node.exe" set "NODE=%LocalAppData%\Programs\nodejs\node.exe"
if not defined NODE goto nonode
echo  Collecting information (up to a minute) ...
"%NODE%" "%~dp0launcher\gnc.mjs" --diagnose
echo.
echo  The report opened in Notepad. It is saved as:
echo  %LocalAppData%\GNC Terminal\GNC-Terminal-diagnose.txt
pause
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
