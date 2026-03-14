@echo off
chcp 65001 >nul
echo ============================================
echo 3D MONOLITH - Установка .NET 8 Runtime
echo ============================================
echo.
echo .NET 8 необходим для работы UVTools 6.x
echo.

:: Скачиваем .NET 8 Runtime
echo [1/3] Скачивание .NET 8 Runtime...
powershell -NoProfile -Command "$ProgressPreference = 'SilentlyContinue'; Invoke-WebRequest -Uri 'https://download.visualstudio.microsoft.com/download/pr/3e50e519-7f9e-4f5d-8d1e-5c8d5f5e5f5e/dotnet-runtime-8.0.0-win-x64.exe' -OutFile '%~dp0dotnet8-runtime.exe'"

:: Устанавливаем
echo [2/3] Установка...
"%~dp0dotnet8-runtime.exe" /install /quiet /norestart

:: Проверяем установку
echo [3/3] Проверка...
dotnet --list-runtimes 2>nul | findstr "8.0" >nul
if %errorlevel% equ 0 (
    echo ✅ .NET 8 Runtime успешно установлен!
) else (
    echo ⚠️  Требуется перезагрузка или ручная установка
    echo.
    echo Скачайте вручную: https://dotnet.microsoft.com/download/dotnet/8.0
)

:: Удаляем установщик
del "%~dp0dotnet8-runtime.exe" >nul 2>&1

echo.
pause
