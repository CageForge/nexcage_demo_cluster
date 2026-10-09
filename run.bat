@echo off
set PORT=3000
echo === NexCage Demo Cluster Launcher ===

if not exist "dist" (
  echo ==> Building dist/ bundle...
  call npm install
  call npm run build
)

where python >nul 2>nul
if %ERRORLEVEL% equ 0 (
  echo ==> Starting web server on http://localhost:%PORT% using Python...
  echo ==> Open http://localhost:%PORT% in your browser.
  python -m http.server %PORT% --directory dist
  goto :eof
)

where npx >nul 2>nul
if %ERRORLEVEL% equ 0 (
  echo ==> Starting web server on http://localhost:%PORT% using npx serve...
  npx serve dist -l %PORT%
  goto :eof
)

echo Error: Please install Python or Node.js to run the local server.
pause
