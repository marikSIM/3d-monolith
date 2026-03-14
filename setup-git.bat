@echo off
setlocal EnableDelayedExpansion

:: Git path
set "GIT_CMD=C:\Program Files\Git\cmd\git.exe"

:: Check Git
echo Checking Git...
"%GIT_CMD%" --version
if errorlevel 1 (
    echo Git not found!
    pause
    exit /b 1
)

echo Git found!

:: Create .gitignore
echo Creating .gitignore...
(
echo node_modules/
echo *.log
echo dist/
echo *.cpuprofile
echo electron-error.log
echo .env
) > .gitignore

echo .gitignore created!

:: Init repo
echo Initializing repository...
"%GIT_CMD%" init
"%GIT_CMD%" add .
"%GIT_CMD%" commit -m "Initial commit - 3D MONOLITH Studio"
"%GIT_CMD%" branch -M main

echo Repository initialized!

echo.
echo NEXT STEPS:
echo 1. Create repo at: https://github.com/new
echo 2. Name: 3d-monolith
echo 3. Run these commands:
echo    "%GIT_CMD%" remote add origin https://github.com/YOUR_USERNAME/3d-monolith.git
echo    "%GIT_CMD%" push -u origin main
echo.

pause
