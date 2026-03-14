@echo off
setlocal

set "GIT=C:\Program Files\Git\cmd\git.exe"

echo.
echo =========================================
echo   AUTO-BACKUP 3D MONOLITH
echo =========================================
echo.

:: Проверяем есть ли изменения
%GIT% status --porcelain > temp.txt
findstr /r "." temp.txt >nul

if errorlevel 1 (
    echo Нет изменений для сохранения.
    del temp.txt
    goto :end
)

del temp.txt

echo Обнаружены изменения...

:: Добавляем все изменения
%GIT% add .

:: Получаем текущую дату и время
for /f "tokens=2-4 delims=/ " %%a in ('date /t') do (set mydate=%%c%%b%%a)
for /f "tokens=1-2 delims=/:" %%a in ('time /t') do (set mytime=%%a%%b)

:: Создаём сообщение коммита с датой
set commitmsg="Auto-backup %mydate% %mytime%"

echo Коммит: %commitmsg%

:: Делаем коммит
%GIT% commit -m %commitmsg%

if errorlevel 1 (
    echo Нет новых изменений.
    goto :end
)

echo.
echo Отправка на GitHub...
%GIT% push

if errorlevel 1 (
    echo.
    echo ⚠️ Ошибка отправки! Проверьте соединение.
    goto :end
)

echo.
echo =========================================
echo   ✅ Бэкап завершён успешно!
echo =========================================

:end
echo.
