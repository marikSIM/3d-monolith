@echo off
setlocal

set "GIT_CMD=C:\Program Files\Git\cmd\git.exe"

echo.
echo =========================================
echo   3D MONOLITH - GitHub Auto Push
echo =========================================
echo.
echo This script will:
echo   1. Add GitHub remote
echo   2. Push your code to GitHub
echo.
echo BEFORE RUNNING:
echo   1. Go to: https://github.com/new
echo   2. Create repo named: 3d-monolith
echo   3. Choose Private
echo   4. DO NOT add README/.gitignore
echo   5. Copy the repository URL
echo.
echo =========================================
echo.

set /p REPO_URL="Paste your GitHub URL here: "

if "%REPO_URL%"=="" (
    echo.
    echo ERROR: No URL provided!
    echo.
    pause
    exit /b 1
)

echo.
echo Adding remote: %REPO_URL%
"%GIT_CMD%" remote add origin %REPO_URL%

echo.
echo Pushing to GitHub...
echo (This may take 2-5 minutes)
echo.

"%GIT_CMD%" push -u origin main

if errorlevel 1 (
    echo.
    echo =========================================
    echo   PUSH FAILED!
    echo =========================================
    echo.
    echo Possible reasons:
    echo   1. Repository doesn't exist on GitHub
    echo   2. Wrong URL
    echo   3. Authentication required
    echo.
    echo Try again or check:
    echo   - GitHub URL is correct
    echo   - Repository is created
    echo   - You are logged into GitHub
    echo.
) else (
    echo.
    echo =========================================
    echo   SUCCESS! Your code is on GitHub!
    echo =========================================
    echo.
    echo View your repository:
    echo   %REPO_URL%
    echo.
    echo Next time, just run:
    echo   git add .
    echo   git commit -m "Your message"
    echo   git push
    echo.
)

pause
