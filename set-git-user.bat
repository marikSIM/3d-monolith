@echo off
setlocal

set "GIT_CMD=C:\Program Files\Git\cmd\git.exe"

:: Настройка имени и email
echo.
echo === GIT IDENTITY SETUP ===
echo.

set /p GIT_NAME="Enter your name: "
set /p GIT_EMAIL="Enter your email: "

echo.
echo Setting: %GIT_NAME% <%GIT_EMAIL%>
echo.

"%GIT_CMD%" config --global user.name "%GIT_NAME%"
"%GIT_CMD%" config --global user.email "%GIT_EMAIL%"

echo.
echo Done! Now run:
echo   setup-git.bat
echo.

pause
