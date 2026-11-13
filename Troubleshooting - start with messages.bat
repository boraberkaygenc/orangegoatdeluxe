@echo off
setlocal EnableExtensions
title GNC Terminal
cd /d "%~dp0"
set "NODE="
where node >nul 2>nul && set "NODE=node"
if not defined NODE if exist "%ProgramFiles%\nodejs\node.exe" set "NODE=%ProgramFiles%\nodejs\node.exe"
if not defined NODE if exist "%LocalAppData%\Programs\nodejs\node.exe" set "NODE=%LocalAppData%\Programs\nodejs\node.exe"
if defined NODE goto havenode

echo.
echo  GNC Terminal needs Node.js (free, one-time install).
echo.
echo  [I] Install it now with Windows Package Manager
echo  [W] Open the nodejs.org download page instead
echo.
choice /c IW /n /m " Press I or W: "
if errorlevel 2 goto website
echo.
echo  Installing Node.js LTS ... Windows may ask for permission; click Yes.
winget install --id OpenJS.NodeJS.LTS -e --accept-package-agreements --accept-source-agreements
if exist "%ProgramFiles%\nodejs\node.exe" set "NODE=%ProgramFiles%\nodejs\node.exe"
if defined NODE goto havenode
echo.
echo  The automatic install did not finish. Opening nodejs.org instead.
:website
start "" "https://nodejs.org/en/download"
echo.
echo  1. Download the LTS installer (.msi) and run it with the default settings.
echo  2. Then double-click this file again.
echo.
pause
exit /b

:havenode
"%NODE%" -e "process.exit(+process.versions.node.split('.')[0]>=18?0:1)"
if errorlevel 1 (
  echo  Your Node.js is older than version 18. Install the LTS version from https://nodejs.org and start again.
  start "" "https://nodejs.org/en/download"
  pause
  exit /b
)
if not exist "public\index.html" (
  echo  !! public\index.html is missing next to this file. Open the inner "GNC Terminal" folder from the zip and start from there.
  pause
  exit /b
)
rem stop a GNC Terminal server that is still running (hidden, from the icon or from an older folder), otherwise the browser
rem keeps showing the old copy or "Not found". The stop.flag tells its hidden keeper (launcher\gnc.mjs or GNC Terminal.exe) not to restart it.
rem A listening row has foreign address 0.0.0.0:0, so this also works where Windows translates the word LISTENING.
set "PORT=8765"
for /f "delims=" %%p in ('call "%NODE%" "%~dp0launcher\gnc.mjs" --port') do set "PORT=%%p"
set "SD=%LocalAppData%\GNC Terminal"
if not "%PORT%"=="8765" set "SD=%LocalAppData%\GNC Terminal\port-%PORT%"
if not exist "%SD%" mkdir "%SD%" >nul 2>nul
echo stop requested by Troubleshooting - start with messages.bat> "%SD%\stop.flag"
for /f "tokens=2,3,5" %%a in ('netstat -ano -p tcp ^| findstr /c:":%PORT% "') do if "%%b"=="0.0.0.0:0" (
  echo  Stopping the GNC Terminal that was still running ^(process %%c^) ...
  taskkill /PID %%c /F >nul 2>nul
)
timeout /t 2 >nul
if /i not "%~1"=="/silent" start "" cmd /c "timeout /t 4 >nul & start http://localhost:%PORT%"
echo.
echo  GNC Terminal is running at http://localhost:%PORT%
echo  Keep this window open (you can minimise it). Closing it stops the updates.
echo.
"%NODE%" server.mjs
echo.
pause
