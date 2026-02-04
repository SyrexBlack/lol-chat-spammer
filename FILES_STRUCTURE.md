# 🎮 LoL Chat Spammer - Структура проекта

## 📁 Полная структура файлов

```
lol-chat-spammer/
├── mini-services/
│   └── lcu-service/
│       ├── index.ts              # Главный файл LCU сервиса
│       ├── package.json          # Зависимости LCU сервиса
│       └── bun.lockb             # Lock файл
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── lcu/
│   │   │       ├── status/
│   │   │       │   └── route.ts  # API для проверки статуса
│   │   │       ├── send/
│   │   │       │   └── route.ts  # API для отправки сообщения
│   │   │       └── send-batch/
│   │   │           └── route.ts  # API для массовой отправки
│   │   ├── layout.tsx            # Корневой layout
│   │   ├── page.tsx              # Главная страница
│   │   └── globals.css           # Глобальные стили
│   ├── components/
│   │   └── ui/                   # shadcn/ui компоненты
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── input.tsx
│   │       ├── label.tsx
│   │       ├── textarea.tsx
│   │       ├── badge.tsx
│   │       ├── switch.tsx
│   │       ├── tabs.tsx
│   │       ├── scroll-area.tsx
│   │       ├── toast.tsx
│   │       └── ...
│   └── lib/
│       └── utils.ts              # Утилиты (cn функция)
├── public/                       # Статические файлы
├── package.json                  # Зависимости Next.js проекта
├── tsconfig.json                 # Конфиг TypeScript
├── tailwind.config.ts            # Конфиг Tailwind
├── next.config.ts                # Конфиг Next.js
├── setup-project.sh              # Скрипт установки (Mac/Linux)
└── setup-project.bat             # Скрипт установки (Windows)
```

## 🚀 Быстрый старт

### 1. Скопируй все файлы из текущей папки проекта на свой компьютер

### 2. Установи зависимости

```bash
# Для основного проекта
bun install

# Для LCU сервиса
cd mini-services/lcu-service
bun install
cd ../..
```

### 3. Запусти приложения

**Терминал 1 - LCU сервис:**
```bash
cd mini-services/lcu-service
bun run dev
```

**Терминал 2 - Next.js приложение:**
```bash
bun run dev
```

### 4. Открой браузер

Перейди на: `http://localhost:3000`

## 📋 Необходимые файлы

### Обязательные файлы для работы:

1. **mini-services/lcu-service/index.ts** - LCU API сервис
2. **mini-services/lcu-service/package.json** - зависимости LCU
3. **src/app/api/lcu/status/route.ts** - статус соединения
4. **src/app/api/lcu/send/route.ts** - отправка сообщений
5. **src/app/api/lcu/send-batch/route.ts** - массовая отправка
6. **src/app/page.tsx** - основной интерфейс
7. **src/app/layout.tsx** - layout приложения
8. **src/components/ui/** - все UI компоненты
9. **package.json** - основной package.json

## 🔧 Требования

- **Node.js** v18+
- **Bun** (рекомендуется) или npm/yarn
- **League of Legends** (запущенный)

## 📝 Зависимости

### Основной проект (package.json):
```json
{
  "dependencies": {
    "react": "^18",
    "react-dom": "^18",
    "next": "^16",
    "@radix-ui/react-*": "...",
    "lucide-react": "...",
    "class-variance-authority": "...",
    "clsx": "...",
    "tailwind-merge": "..."
  }
}
```

### LCU сервис (mini-services/lcu-service/package.json):
```json
{
  "dependencies": {
    "hono": "^4.0.0"
  }
}
```

## 🎯 Как работает

1. **LCU Service** (порт 3003):
   - Читает lockfile League of Legends
   - Подключается к LCU API
   - Отправляет сообщения в чат

2. **Next.js App** (порт 3000):
   - Показывает интерфейс
   - Управляет сообщениями
   - Отправляет запросы к LCU сервису

3. **API Routes** (/api/lcu/*):
   - Прокси-злой к LCU сервису
   - Обрабатывают запросы от фронтенда

## 📱 Использование

1. Запусти League of Legends
2. Войди в лобби
3. Открой http://localhost:3000
4. Дождись зеленого индикатора "LoL подключен"
5. Включи сообщения
6. Отправляй в чат или используй авто-спам

## 🐛 Troubleshooting

### LoL не подключается:
- Убедись, что League of Legends запущен
- Проверь, что LCU сервис работает (порт 3003)
- Убедись, что ты в лобби или champion select

### Сообщения не отправляются:
- Проверь статус соединения
- Проверь логи LCU сервиса
- Убедись, что в лобби есть чат

### Порт занят:
```bash
# Linux/Mac
lsof -i :3003

# Windows
netstat -ano | findstr :3003
```

## 📄 Лицензия

Для личного использования.
⚠️ Используй ответственно. Не нарушай правила Riot Games.
