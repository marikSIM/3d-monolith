@echo off
setlocal

set "GIT_CMD=C:\Program Files\Git\cmd\git.exe"
set "REPO_URL=https://github.com/marikSIM/3d-monolith.git"

echo.
echo =========================================
echo   PUSH TO GITHUB
echo =========================================
echo.
echo Enter your GitHub Personal Access Token:
echo (Create at: https://github.com/settings/tokens)
echo.

set /p TOKEN="Token: "

echo.
echo Pushing code to GitHub...
echo (This may take 2-5 minutes for 1.1M lines)
echo.

:: Push using token for authentication
"%GIT_CMD%" push https://%TOKEN%@github.com/marikSIM/3d-monolith.git main

if errorlevel 1 (
    echo.
    echo =========================================
    echo   PUSH FAILED!
    echo =========================================
    echo.
    echo Check:
    echo   1. Token is valid
    echo   2. Token has 'repo' scope
    echo   3. Repository exists: https://github.com/marikSIM/3d-monolith
    echo.
) else (
    echo.
    echo =========================================
    echo   SUCCESS!
    echo =========================================
    echo.
    echo Your code is now on GitHub:
    echo   https://github.com/marikSIM/3d-monolith
    echo.
    echo Next time run:
    echo   git add .
    echo   git commit -m "message"
    echo   git push
    echo.
)

pause
