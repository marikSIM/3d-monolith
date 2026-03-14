@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

:: Путь к Git
set "GIT_CMD=C:\Program Files\Git\cmd\git.exe"

:: Проверка Git
echo 🔍 Проверка Git...
"%GIT_CMD%" --version
if errorlevel 1 (
    echo ❌ Git не найден! Установите Git для Windows.
    pause
    exit /b 1
)

echo ✅ Git найден!

:: Настройка Git
echo.
echo ⚙️ Настройка Git...
set /p GIT_NAME="Введите ваше имя для Git: "
set /p GIT_EMAIL="Введите ваш email для Git: "

"%GIT_CMD%" config --global user.name "%GIT_NAME%"
"%GIT_CMD%" config --global user.email "%GIT_EMAIL%"

echo ✅ Git настроен!

:: Создание .gitignore
echo.
echo 📝 Создание .gitignore...
(
echo node_modules/
echo *.log
echo dist/
echo *.cpuprofile
echo electron-error.log
echo .env
) > .gitignore

echo ✅ .gitignore создан!

:: Инициализация репозитория
echo.
echo 🚀 Инициализация репозитория...
"%GIT_CMD%" init
"%GIT_CMD%" add .
"%GIT_CMD%" commit -m "Initial commit - 3D MONOLITH Studio"
"%GIT_CMD%" branch -M main

echo ✅ Репозиторий инициализирован!

:: Инструкция по добавлению remote
echo.
echo ========================================
echo 📋 СЛЕДУЮЩИЕ ШАГИ:
echo ========================================
echo.
echo 1. Создайте репозиторий на GitHub:
echo    https://github.com/new
echo.
echo 2. Имя репозитория: 3d-monolith
echo.
echo 3. Затем выполните:
echo    "%GIT_CMD%" remote add origin https://github.com/ВАШ_НИК/3d-monolith.git
echo    "%GIT_CMD%" push -u origin main
echo.
echo ========================================
echo.

pause
