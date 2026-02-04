@echo off
chcp 65001 >nul
echo 🎮 Создание LoL Chat Spammer проекта...
echo.

REM Создаем структуру папок
if not exist "src\app\api\lcu\status" mkdir "src\app\api\lcu\status"
if not exist "src\app\api\lcu\send" mkdir "src\app\api\lcu\send"
if not exist "src\app\api\lcu\send-batch" mkdir "src\app\api\lcu\send-batch"
if not exist "src\components\ui" mkdir "src\components\ui"
if not exist "mini-services\lcu-service" mkdir "mini-services\lcu-service"
if not exist "db" mkdir "db"
if not exist "prisma" mkdir "prisma"
if not exist "lib" mkdir "lib"
if not exist "public" mkdir "public"

echo ✅ Папки созданы
echo.

REM Проверяем bun
where bun >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Bun не найден. Установи bun:
    echo    powershell -c "irm bun.sh/install.ps1^|iex"
    exit /b 1
)

echo ✅ Bun найден
echo.
echo 📝 Проверка файлов...

REM Проверяем наличие важных файлов
set MISSING=0

if not exist "mini-services\lcu-service\package.json" (
    echo ⚠️  Отсутствует: LCU service package.json
    set MISSING=1
)
if not exist "mini-services\lcu-service\index.ts" (
    echo ⚠️  Отсутствует: LCU service index.ts
    set MISSING=1
)
if not exist "src\app\api\lcu\status\route.ts" (
    echo ⚠️  Отсутствует: API status route
    set MISSING=1
)
if not exist "src\app\api\lcu\send\route.ts" (
    echo ⚠️  Отсутствует: API send route
    set MISSING=1
)
if not exist "src\app\api\lcu\send-batch\route.ts" (
    echo ⚠️  Отсутствует: API send-batch route
    set MISSING=1
)
if not exist "src\app\page.tsx" (
    echo ⚠️  Отсутствует: Main page
    set MISSING=1
)

if %MISSING%==1 (
    echo.
    echo ⚠️  Некоторые файлы отсутствуют.
    echo Все файлы должны быть уже созданы в проекте.
    exit /b 1
)

echo ✅ Все файлы на месте
echo.

REM Устанавливаем зависимости
echo 📦 Установка зависимостей...
bun install

echo.
echo 📦 Установка зависимостей LCU сервиса...
cd mini-services\lcu-service
bun install
cd ..\..

echo.
echo ✅ Установка завершена!
echo.
echo 🚀 Для запуска:
echo.
echo Терминал 1 ^(LCU сервис^):
echo   cd mini-services\lcu-service
echo   bun run dev
echo.
echo Терминал 2 ^(Next.js^):
echo   bun run dev
echo.
echo Затем открой http://localhost:3000
echo.

pause
