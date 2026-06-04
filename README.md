# Mannschaftskasse — Union Schwand

Team management web app: fines, events, payments, statistics.

## Quick Start (requires Docker Desktop)

```bash
# Copy env file (already done — .env exists with dev defaults)
docker compose up --build
```

- **Frontend**: http://localhost:5173
- **API health**: http://localhost:3000/api/health

> First run takes ~3 minutes (npm install inside containers). Subsequent starts are fast.

### Test accounts (password: `Test1234!`)

| E-Mail | Rolle |
|--------|-------|
| admin@schwand.at | Admin |
| trainer@schwand.at | Trainer |
| spieler1@schwand.at | Spieler (2 offene Strafen) |
| spieler2@schwand.at | Spieler (1 offene Strafe) |
| kassenwart@schwand.at | Kassenwart |

## Hot Reload

Both backend and frontend support hot reload. Edit files in `packages/api/src/` or `packages/web/src/` and changes apply instantly (NestJS file-watch / Vite HMR).

## Architecture

```
docker-compose.yml
├── postgres (port 5432) — PostgreSQL 16
├── api (port 3000)      — NestJS + TypeORM + argon2 JWT auth
└── web (port 5173)      — Vue 3 + Vite + PrimeVue 4 + Tailwind
    └── /api/* proxied to api container (no CORS issues)
```

## Tech Stack

- **Backend**: NestJS, TypeORM (synchronize in dev), PostgreSQL, JWT + refresh tokens, argon2
- **Frontend**: Vue 3, Pinia, Vue Router, PrimeVue 4 (Aura theme), Tailwind CSS, FullCalendar
- **Local dev**: Docker Compose with hot-reload bind mounts

## Seed Data (auto-runs on first start)

- 5 users (one per role), 8 events (5 past + 3 future)
- 4 fine categories + 4 fines (spieler1: 2 OPEN + 1 PAID; spieler2: 1 OPEN)
- 1 payment + ledger entries (Kassenstand: 160€)

## Features

Core Features:
- Fine management



## AI Team

| Agent | Role |
|---------|---------|
| PfenningFuchs | Product Owner |
| Software Architect | Solution Architect |
| Football Fullstack Engineer | Full-Stack Developer |
| Football Code Reviewer | Code Reviewer |
| Football QA Engineer | Quality Assurance |
| AI Strategy Agent | AI Evaluation & Process Improvement |

For details see: docs/TEAM_AGENTS.md

