@echo off
chcp 65001 >nul
echo ============================================
echo 3D MONOLITH - Установка UVTools v6.0.0
echo ============================================
echo.

:: Шаг 1: Удаляем старую версию
echo [1/4] Удаление старой версии...
if exist "C:\Users\murad\AppData\Local\UVtools" (
    rmdir /s /q "C:\Users\murad\AppData\Local\UVtools"
    echo ✅ Старая версия удалена
) else (
    echo ℹ️  Старая версия не найдена
)
echo.

:: Шаг 2: Скачиваем новую версию
echo [2/4] Скачивание UVTools v6.0.0...
powershell -Command "Invoke-WebRequest -Uri 'https://github.com/sn4k3/UVtools/releases/download/v6.0.0/UVtools_win-x64_v6.0.0.zip' -OutFile '%~dp0UVtools-new.zip'"
if errorlevel 1 (
    echo ❌ Ошибка скачивания!
    pause
    exit /b 1
)
echo ✅ Скачано
echo.

:: Шаг 3: Распаковываем
echo [3/4] Распаковка...
powershell -Command "Expand-Archive -Path '%~dp0UVtools-new.zip' -DestinationPath 'C:\Users\murad\AppData\Local\UVtools' -Force"
if errorlevel 1 (
    echo ❌ Ошибка распаковки!
    pause
    exit /b 1
)
echo ✅ Распаковано в C:\Users\murad\AppData\Local\UVtools
echo.

:: Шаг 4: Проверяем установку
echo [4/4] Проверка установки...
"C:\Users\murad\AppData\Local\UVtools\UVtoolsCmd.exe" --version
if errorlevel 1 (
    echo ❌ Ошибка проверки!
    pause
    exit /b 1
)
echo.

:: Удаляем ZIP
del "%~dp0UVtools-new.zip" >nul 2>&1

echo ============================================
echo ✅ UVTools v6.0.0 успешно установлен!
echo ============================================
echo.
echo Путь: C:\Users\murad\AppData\Local\UVtools
echo.
pause
