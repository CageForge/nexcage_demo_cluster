@echo off
setlocal enabledelayedexpansion

REM Ensure current working directory is the folder where run.bat is located
cd /d "%~dp0"

set "PORT=3000"
if defined DEMO_PORT set "PORT=%DEMO_PORT%"

echo ====================================================
echo    ^>^>^> NexCage Demo Cluster Launcher (Windows)
echo ====================================================

REM 1. Verify if dist\index.html exists; if not, build it with npm
if not exist "dist\index.html" (
    echo [INFO] Production bundle 'dist' was not found. Attempting to build...
    where npm >nul 2>nul
    if %ERRORLEVEL% neq 0 (
        echo [ERROR] 'npm' was not found in your PATH.
        echo Please install Node.js from https://nodejs.org/ to compile the demo.
        echo.
        pause
        exit /b 1
    )
    echo ==^> Running 'npm install' ...
    call npm install
    if %ERRORLEVEL% neq 0 (
        echo [ERROR] 'npm install' failed.
        pause
        exit /b 1
    )
    echo ==^> Running 'npm run build' ...
    call npm run build
    if %ERRORLEVEL% neq 0 (
        echo [ERROR] 'npm run build' failed.
        pause
        exit /b 1
    )
    if not exist "dist\index.html" (
        echo [ERROR] Build completed but 'dist\index.html' was not created.
        pause
        exit /b 1
    )
    echo [OK] Production bundle built successfully!
    echo.
)

REM 2. Determine best available web server
set "SERVER_LAUNCHER="

REM Check Windows Python launcher (py.exe)
where py >nul 2>nul
if %ERRORLEVEL% equ 0 (
    py -3 -c "import sys" >nul 2>nul
    if !ERRORLEVEL! equ 0 (
        set "SERVER_LAUNCHER=py -3"
        goto :launch_python
    )
)

REM Check python.exe (verify it is real Python and not Windows Store stub)
where python >nul 2>nul
if %ERRORLEVEL% equ 0 (
    python -c "import sys" >nul 2>nul
    if !ERRORLEVEL! equ 0 (
        set "SERVER_LAUNCHER=python"
        goto :launch_python
    )
)

REM Check Node.js / npx serve
where npx >nul 2>nul
if %ERRORLEVEL% equ 0 (
    goto :launch_npx
)

REM Check standalone Node.js
where node >nul 2>nul
if %ERRORLEVEL% equ 0 (
    goto :launch_node
)

REM If nothing found:
echo.
echo [ERROR] No suitable web server runtime was found.
echo Please install either:
echo   1. Python 3: https://www.python.org/
echo   2. Node.js:  https://nodejs.org/
echo.
pause
exit /b 1

:launch_python
echo ==^> Starting web server on http://localhost:%PORT% using Python (%SERVER_LAUNCHER%)...
echo ==^> Opening default web browser...
start http://localhost:%PORT%
echo ==^> Press Ctrl+C in this console window to stop the server.
echo.
%SERVER_LAUNCHER% -m http.server %PORT% --directory dist
goto :eof

:launch_npx
echo ==^> Starting web server on http://localhost:%PORT% using npx serve...
echo ==^> Opening default web browser...
start http://localhost:%PORT%
echo ==^> Press Ctrl+C in this console window to stop the server.
echo.
call npx -y serve dist -l %PORT%
if %ERRORLEVEL% neq 0 (
    echo [WARNING] npx serve failed, falling back to built-in Node.js server...
    goto :launch_node
)
goto :eof

:launch_node
echo ==^> Starting web server on http://localhost:%PORT% using Node.js built-in HTTP server...
echo ==^> Opening default web browser...
start http://localhost:%PORT%
echo ==^> Press Ctrl+C in this console window to stop the server.
echo.
node -e "const http=require('http'),fs=require('fs'),path=require('path');const port=parseInt(process.env.PORT||'%PORT%',10);const mime={'.html':'text/html','.js':'application/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.ico':'image/x-icon'};http.createServer((req,res)=>{let f=path.join('dist',req.url==='/'?'index.html':req.url.split('?')[0]);if(!fs.existsSync(f)||fs.statSync(f).isDirectory())f=path.join('dist','index.html');res.writeHead(200,{'Content-Type':mime[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(res);}).listen(port,()=>console.log('Server running at http://localhost:'+port));"
goto :eof
