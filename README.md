# TFMio

> Encuentra tu TFM. Gestiona tu camino.

Plataforma inteligente de emparejamiento y gestión integral de Trabajos Fin de Máster y Trabajos Fin de Grado — ETSIIT, Universidad de Granada.

TFMio combines a Tinder-style topic discovery experience with an LLM-powered recommendation engine and a full lifecycle management system for TFM/TFG works, covering the entire process from finding a topic to receiving the final grade.

**TFM autor:** Anas Tahir
**Tutor:** Prof. Miguel García Silvente (DECSAI)
**Programa:** Máster en Ingeniería Informática (MII)

---

## Monorepo structure

```
TFMio/
├── server/     Node.js + Express + TypeScript API
└── client/     React + Vite + TypeScript frontend
```

## Tech stack

| Layer | Technology |
|-------|-----------|
| Frontend | React, Vite, TypeScript, Tailwind CSS, Zustand, TanStack Query |
| Backend | Node.js, Express, TypeScript |
| Database | MongoDB Atlas + Vector Search |
| AI / LLM | OpenAI API (embeddings + chat), Vercel AI SDK |
| Auth | JWT + bcrypt, role-based access control |

## Getting started

### 1. Backend

```bash
cd server
npm install
cp .env.example .env        # then fill in your real values in .env
npm run dev
```

The API runs on `http://localhost:5000`.

### 2. Frontend

```bash
cd client
npm install
cp .env.example .env
npm run dev
```

The app runs on `http://localhost:5173`.

## Roles

- **Student** — discover topics, get AI recommendations, express interest, track their TFM
- **Tutor** — publish topics, review student requests, supervise active works
- **Coordinator** — oversee the full lifecycle, schedule defenses, manage grades

## Phase 1 status (this foundation)

- [x] Monorepo structure
- [x] MongoDB connection + all data models
- [x] Degree (titulación) model — coordinators scoped per degree, per tutor feedback
- [x] JWT auth (register/login) with role middleware
- [x] OpenAI embedding pipeline (proof of concept)
- [x] Seed script with realistic fake data (degrees, students, tutors, coordinators, topics)
- [x] Frontend shell with routing and auth store
- [ ] Phase 2 — matching engine + AI recommendations
- [ ] Phase 3 — lifecycle management
- [ ] Phase 4 — polish, testing, deployment

## Multi-degree architecture

Following the tutor's review, the platform supports multiple titulaciones (degrees)
from day one, not as future work:

- `Degree` — a titulación (e.g. MII, GII), each with its own coordinator
- Students belong to exactly one degree
- Tutors can supervise across several degrees
- Coordinators are scoped to exactly one degree — they only see their own students/topics
- Topics declare which degree(s) they're open to

## Seed data (development only)

Everything in the database right now should be **fake data** — invented students,
professors, and topics, never real people. This lets you build and test freely
without any privacy concerns. Populate the database with:

```bash
cd server
npm run seed
```

This creates 3 degrees, 2 coordinators, 3 tutors, and 3 students with varied skill
profiles, plus 4 topics — enough to test swiping, matching, and recommendations
end to end. Every seeded account uses the password `Password123`.

When the platform is ready for real pilot testing with actual ETSIIT students and
professors (with their consent), this fake data gets wiped and replaced.

## Security note

Never commit your `.env` file. It is git-ignored by default. Only `.env.example` (with placeholder values) belongs in the repository.
