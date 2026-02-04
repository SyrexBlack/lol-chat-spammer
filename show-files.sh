#!/bin/bash

echo "📋 Содержимое важных файлов проекта LoL Chat Spammer"
echo "======================================================"
echo ""
echo "🔹 1. mini-services/lcu-service/package.json:"
echo "-------------------------------------------"
cat mini-services/lcu-service/package.json
echo ""
echo "🔹 2. mini-services/lcu-service/index.ts (первые 50 строк):"
echo "--------------------------------------------------------"
head -50 mini-services/lcu-service/index.ts
echo ""
echo "🔹 3. src/app/api/lcu/status/route.ts:"
echo "--------------------------------------"
cat src/app/api/lcu/status/route.ts
echo ""
echo "🔹 4. src/app/api/lcu/send/route.ts:"
echo "------------------------------------"
cat src/app/api/lcu/send/route.ts
echo ""
echo "🔹 5. src/app/api/lcu/send-batch/route.ts:"
echo "------------------------------------------"
cat src/app/api/lcu/send-batch/route.ts
echo ""
echo "🔹 6. Структура проекта:"
echo "----------------------"
find . -type f -name "*.ts" -o -name "*.tsx" -o -name "*.json" | grep -E "(src/app|mini-services|package\.json)" | sort
echo ""
echo "✅ Все файлы проекта находятся в текущей директории"
echo ""
echo "📦 Скопируй всю папку проекта на свой компьютер и запусти:"
echo "   bun install"
echo "   cd mini-services/lcu-service && bun install"
echo ""
