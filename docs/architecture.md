# Архитектура

## Обзор
Trellix — полнофункциональный клон Trello для корпоративного управления задачами. Проект состоит из frontend (React + Vite) и backend (Node.js + Express + Prisma) сервисов. Данные хранятся в PostgreSQL. Запуск и оркестрация через Docker Compose.

## Backend
- Node.js 20, TypeScript, Express.
- Prisma ORM + PostgreSQL.
- JSON Web Tokens (access + refresh).
- RBAC для ролей `ADMIN`, `LEAD`, `EMPLOYEE`.
- REST API + WebSocket шлюз для live-обновлений (stomp/socket.io playground, MVP: polling + optimistic UI).
- Валидация входных данных через Zod.
- Журнал аудита действий в таблице activity_log.

### Основные сущности
- **users** — учетные записи, глобальная роль, ссылки на руководителя.
- **boards** — доски задач, владелец и коллекция участников.
- **board_members** — доступ пользователей к доскам и уровень прав.
- **lists** — столбцы канбан доски с индексами сортировки.
- **cards** — карточки задач, статусы, исполнители, дедлайны.
- **card_assignments** — назначения сотрудников на карточки.
- **activity_log** — действия пользователей над карточками.
- **refresh_tokens** — привязка refresh токенов к устройствам.

### Ключевые сценарии
- Регистрация/авторизация (self-signup -> employee).
- Админ: CRUD пользователей, назначение ролей/иерархии, полный доступ к сущностям.
- Руководитель: управление досками своей команды, настройка доступов подчиненных.
- Сотрудник: работа в границах выделенных досок и карточек, drag & drop карточек.

## Frontend
- React 18 + TypeScript + Vite.
- UI: Tailwind CSS + Headless UI + Radix + собственные компоненты.
- Стоечка state management: TanStack Query + Zustand для локального UI состояния.
- Drag & Drop: @dnd-kit/core.
- Клиент авторизации хранит access token в памяти, refresh в httpOnly cookie.
- Protected routing (React Router v6).

## DevOps
- Docker Compose поднимает PostgreSQL, backend, frontend.
- Старт backend: `prisma migrate deploy` + `pnpm start`.
- CI/CD сценарий: build & push образов, миграции через job, деплой `docker compose up -d`.
- `.env` описан в template. Secrets через AWS SSM / Docker secrets.

## Хостинг (AWS идея)
- Backend+DB: ECS Fargate (api, frontend), RDS для PostgreSQL.
- Альтернатива: EC2 + docker compose + Nginx reverse proxy.
- S3 + CloudFront для статики, если отделить frontend.
- Load Balancer (ALB) для HTTPS.

