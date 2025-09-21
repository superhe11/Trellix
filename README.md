# Trellix — Канбан-платформа с ролевой моделью

Trellix — полнофункциональный клон Trello для команд с жестким разграничением ролей (администратор, руководитель, сотрудник). Проект состоит из backend на Node.js/Express + PostgreSQL и современного frontend на React/Vite с drag & drop для карточек.

## Ключевые возможности
- Регистрация, авторизация, refresh-токены, защита по ролям.
- Админпанель: управление пользователями, назначение ролей, привязка сотрудников к руководителям.
- Доски/списки/карточки с гибкой настройкой доступа, перетаскиванием задач и статусами.
- Drag & drop на клиенте через dnd-kit, live-обновление через реактивные запросы.
- Полностью контейнеризовано, миграции БД запускаются автоматически.

## Технологии
- **Backend:** Node.js 20, TypeScript, Express, Prisma, PostgreSQL, JWT.
- **Frontend:** React 18, Vite, TailwindCSS, TanStack Query, Zustand, dnd-kit.
- **Инфраструктура:** Docker, Docker Compose, Nginx (для фронтенда), Postgres 15.

## Локальный запуск (без Docker)
### Backend
```bash
cd backend
cp .env.example .env # при необходимости скорректируйте
npm install
npx prisma migrate dev
npm run dev
```
Backend стартует на `http://localhost:4000`.

### Frontend
```bash
cd frontend
cp .env.example .env # VITE_API_BASE_URL по умолчанию указывает на backend
npm install
npm run dev
```
Интерфейс будет доступен на `http://localhost:5173`.

## Запуск через Docker Compose
Убедитесь, что порт `5432`, `4000` и `5173` свободны.
```bash
cd <корень проекта>
docker compose up --build
```
Сервисы:
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:4000`
- Postgres: порт `5432`, пользователь/пароль из `docker-compose.yml`.

Контейнер `backend` выполняет `prisma migrate deploy` перед стартом приложения. Начальный администратор создаётся через сидер (`npm run seed`) или вручную через API.

## Переменные окружения
### Backend (`backend/.env`)
| Переменная | Значение по умолчанию | Назначение |
|------------|----------------------|------------|
| `DATABASE_URL` | `postgresql://trellix_user:trellix_pass@db:5432/trellix?schema=public` | Строка подключения к Postgres |
| `JWT_ACCESS_SECRET` | `super-secret-access` | Соль для access токена |
| `JWT_REFRESH_SECRET` | `super-secret-refresh` | Соль для refresh токена |
| `ACCESS_TOKEN_TTL` | `15m` | TTL access токена |
| `REFRESH_TOKEN_TTL` | `7d` | TTL refresh токена |
| `COOKIE_DOMAIN` | `localhost` | Домен cookie refresh токена |
| `COOKIE_SECURE` | `false` | Использовать secure-cookie |
| `COOKIE_SAME_SITE` | `lax` | SameSite политика |

### Frontend (`frontend/.env`)
| Переменная | Описание |
|------------|----------|
| `VITE_API_BASE_URL` | Базовый URL API (`http://localhost:4000/api/v1`) |

## Структура репозитория
```
backend/   – REST API, Prisma schema, миграции, Dockerfile
frontend/  – Vite-приложение, Tailwind, Dockerfile
docs/      – архитектура и заметки
```

## Деплой в облако (AWS пример)
1. **База данных:** RDS PostgreSQL, security group открывает доступ только из приватной сети.
2. **Сервисы:**
   - Backend и frontend как контейнеры в ECS Fargate (или на EC2 под управлением `docker compose`).
   - Для фронтенда альтернативно — сборка и выкладка статики в S3 + CloudFront.
3. **Секреты:** хранить в AWS SSM Parameter Store и прокидывать в ECS через task definition.
4. **Балансировщик:** ALB с HTTP→HTTPS, пробрасывает трафик на frontend контейнер; backend можно скрыть за приватной сетью и дергать из frontend через обратный proxy.
5. **CI/CD:** GitHub Actions/S3 deploy → ECS update. Перед релизом выполнять `prisma migrate deploy` в отдельной задаче.

## Сценарии тестирования
- `npm run build` (backend/frontend) — проверка типизации и сборка.
- Postman коллекция может быть собрана из REST эндпоинтов `/auth/*`, `/boards`, `/lists`, `/cards`, `/admin/users`.

## Полезные команды
Backend:
- `npm run dev` — запуск с tsx watcher.
- `npm run prisma:migrate` — миграции в dev.
- `npm run seed` — сидер(создает администратора).

Frontend:
- `npm run dev` — дев-сервер на Vite.
- `npm run build` / `npm run preview` — прод-сборка и предпросмотр.

## TODO / Roadmap
- Подключить websocket-канал для live-событий.
- Добавить уведомления и комментарии к карточкам.
- Включить e2e-тесты (Playwright/Cypress) для ключевых сценариев.

---
С вопросами и предложениями — смело обращайтесь!

### Учётные данные по умолчанию
- Администратор: `admin@trellix.dev` / `12345678`
