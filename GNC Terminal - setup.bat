@echo off
rem GNC Terminal: makes the "GNC Terminal" goat icon (desktop + Start menu) that starts the app with one click,
rem without the .exe (node.exe only). Run it again after moving this folder. Nothing is installed.
setlocal
title GNC Terminal - setup
cd /d "%~dp0"
set "NODE="
where node >nul 2>nul && set "NODE=node"
if not defined NODE if exist "%ProgramFiles%\nodejs\node.exe" set "NODE=%ProgramFiles%\nodejs\node.exe"
if not defined NODE if exist "%LocalAppData%\Programs\nodejs\node.exe" set "NODE=%LocalAppData%\Programs\nodejs\node.exe"
if not defined NODE goto nonode
echo.
echo  GNC Terminal - icon setup
echo  -------------------------
echo  Folder: %~dp0
echo.
choice /c YN /n /m " Start GNC Terminal hidden every time you sign in to Windows? Press Y (yes) or N (no): "
set "AUTO=--autostart-on"
if errorlevel 2 set "AUTO=--autostart-off"
echo.
echo  Start mode: [H] hidden (no window)   [V] visible (a minimized window keeps running, like version 3.1)
echo  Choose V if your antivirus removes the GNC Terminal icon in hidden mode.
choice /c HV /n /m " Press H or V: "
set "MODE="
set "RUN="
if errorlevel 2 set "MODE=--visible"
if errorlevel 2 set "RUN=--run"
echo.
"%NODE%" "%~dp0launcher\gnc.mjs" --setup %AUTO% %MODE%
echo.
echo  Starting GNC Terminal now (the app window opens in a few seconds) ...
start "GNC Terminal" /min "%NODE%" "%~dp0launcher\gnc.mjs" %RUN%
echo.
echo  You can close this window.
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
