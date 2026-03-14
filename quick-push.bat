@echo off
setlocal

set "GIT=C:\Program Files\Git\cmd\git.exe"

echo.
echo =========================================
echo   3D MONOLITH - Quick Push
echo =========================================
echo.

:: Check for changes
%GIT% status

echo.
set /p MESSAGE="Enter commit message: "

if "%MESSAGE%"=="" (
    echo No message provided!
    pause
    exit /b 1
)

echo.
echo Adding files...
%GIT% add .

echo.
echo Committing...
%GIT% commit -m "%MESSAGE%"

echo.
echo Pushing to GitHub...
%GIT% push

echo.
echo =========================================
echo   DONE!
echo =========================================
echo.

pause
