@echo off
chcp 65001 >nul
echo ============================================
echo 3D MONOLITH - Установка .NET 8.0 Runtime
echo ============================================
echo.
echo Это установит .NET 8.0 Desktop Runtime (x64)
echo Необходимо для работы UVTools 6.x
echo.
echo [1/3] Скачивание установщика...
powershell -NoProfile -Command "$ProgressPreference = 'SilentlyContinue'; Invoke-WebRequest -Uri 'https://download.visualstudio.microsoft.com/download/pr/72b8ded6-c7ac-4e67-b10f-f726d9a7a78e/2ae83450-e1b1-4d18-a75f-1b5e3e5e5e5e/dotnet-runtime-8.0.11-win-x64.exe' -OutFile '%~dp0dotnet-runtime-8.exe'"

if exist "%~dp0dotnet-runtime-8.exe" (
    echo ✅ Скачано!
    echo.
    echo [2/3] Установка...
    "%~dp0dotnet-runtime-8.exe" /install /quiet /norestart
    echo.
    echo [3/3] Проверка...
    dotnet --list-runtimes | findstr "8.0" >nul
    if %errorlevel% equ 0 (
        echo ✅ .NET 8.0 успешно установлен!
        echo.
        echo ⚠️  Требуется ПЕРЕЗАГРУЗКА компьютера!
    ) else (
        echo ⚠️  Установка не завершена
        echo.
        echo Попробуйте установить вручную:
        echo https://dotnet.microsoft.com/download/dotnet/8.0
    )
    del "%~dp0dotnet-runtime-8.exe" >nul 2>&1
) else (
    echo ❌ Не удалось скачать
    echo.
    echo Скачайте вручную:
    echo https://dotnet.microsoft.com/download/dotnet/8.0
)

echo.
pause
