#!/bin/bash

echo "🎮 Создание LoL Chat Spammer проекта..."
echo ""

# Создаем структуру папок
mkdir -p src/app/api/lcu/status
mkdir -p src/app/api/lcu/send
mkdir -p src/app/api/lcu/send-batch
mkdir -p src/components/ui
mkdir -p mini-services/lcu-service
mkdir -p db
mkdir -p prisma
mkdir -p lib
mkdir -p public

echo "✅ Папки созданы"
echo ""

# Проверяем, есть ли bun
if ! command -v bun &> /dev/null; then
    echo "❌ Bun не найден. Установи bun:"
    echo "   curl -fsSL https://bun.sh/install | bash"
    exit 1
fi

echo "✅ Bun найден"
echo ""
echo "📝 Создание файлов..."

# Если файлы уже существуют, пропускаем их создание
if [ ! -f "package.json" ]; then
    echo "⚠️  package.json не найден. Убедись, что Next.js проект инициализирован."
    echo "   Выполни: bun create next-app@latest"
    exit 1
fi

# Проверяем наличие важных файлов
MISSING_FILES=()

[ ! -f "mini-services/lcu-service/package.json" ] && MISSING_FILES+=("LCU service package.json")
[ ! -f "mini-services/lcu-service/index.ts" ] && MISSING_FILES+=("LCU service index.ts")
[ ! -f "src/app/api/lcu/status/route.ts" ] && MISSING_FILES+=("API status route")
[ ! -f "src/app/api/lcu/send/route.ts" ] && MISSING_FILES+=("API send route")
[ ! -f "src/app/api/lcu/send-batch/route.ts" ] && MISSING_FILES+=("API send-batch route")
[ ! -f "src/app/page.tsx" ] && MISSING_FILES+=("Main page")

if [ ${#MISSING_FILES[@]} -gt 0 ]; then
    echo "⚠️  Отсутствуют файлы:"
    for file in "${MISSING_FILES[@]}"; do
        echo "   - $file"
    done
    echo ""
    echo "Все файлы должны быть уже созданы в проекте."
    exit 1
fi

echo "✅ Все файлы на месте"
echo ""

# Устанавливаем зависимости
echo "📦 Установка зависимостей..."
bun install

echo ""
echo "📦 Установка зависимостей LCU сервиса..."
cd mini-services/lcu-service
bun install
cd ../..

echo ""
echo "✅ Установка завершена!"
echo ""
echo "🚀 Для запуска:"
echo ""
echo "Терминал 1 (LCU сервис):"
echo "  cd mini-services/lcu-service"
echo "  bun run dev"
echo ""
echo "Терминал 2 (Next.js):"
echo "  bun run dev"
echo ""
echo "Затем открой http://localhost:3000"
echo ""
