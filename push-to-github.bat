@echo off
setlocal

set "GIT_CMD=C:\Program Files\Git\cmd\git.exe"

echo.
echo =========================================
echo   PUSH TO GITHUB
echo =========================================
echo.
echo 1. Open: https://github.com/new
echo 2. Repository name: 3d-monolith
echo 3. Choose Private
echo 4. DO NOT initialize with README
echo 5. Click "Create repository"
echo.
echo =========================================
echo.

set /p REPO_URL="Enter your GitHub URL (e.g. https://github.com/murad-simakov/3d-monolith.git): "

echo.
echo Pushing to GitHub...
echo.

"%GIT_CMD%" remote add origin %REPO_URL%
"%GIT_CMD%" push -u origin main

echo.
echo =========================================
echo   DONE! Your code is now on GitHub!
echo =========================================
echo.

pause
