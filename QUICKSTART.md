# TFMio — Phase 1 Quickstart

This is the foundation of TFMio. Everything the rest of the app builds on is here and working: authentication, all database models, role-based access control, and the AI/LLM service layer.

## What's inside

```
TFMio/
├── server/                  Node.js + Express + TypeScript API
│   ├── src/
│   │   ├── config/          env loader + MongoDB connection
│   │   ├── models/          User, Topic, Interest, Work, SubmittedDocument, Notification
│   │   ├── middleware/       auth (JWT + role guards), error handler
│   │   ├── controllers/     auth controller (register/login/me)
│   │   ├── routes/          auth routes
│   │   ├── services/        llm.service.ts  ← ALL the AI code lives here
│   │   ├── scripts/         testEmbedding.ts  ← proof the AI loop works
│   │   ├── types/           shared enums
│   │   └── index.ts         server entry point
│   ├── .env                 your real credentials (git-ignored)
│   └── .env.example         template (safe to commit)
│
└── client/                  React + Vite + TypeScript + Tailwind
    └── src/
        ├── pages/           Login, Register, Dashboard
        ├── store/           auth.ts (Zustand)
        ├── lib/             api.ts (axios + JWT interceptor)
        └── App.tsx          routing + protected routes
```

## Run it

### Step 1 — start MongoDB
Your MongoDB Atlas cluster is already configured in `server/.env`.
**Important:** before running, go to MongoDB Atlas → Network Access and make sure your IP is allowed (or allow `0.0.0.0/0` for development).

### Step 2 — backend
```bash
cd server
npm install
npm run dev
```
You should see:
```
✓ MongoDB connected
✓ TFMio API running on http://localhost:5000
```

### Step 3 — frontend (new terminal)
```bash
cd client
npm install
npm run dev
```
Open http://localhost:5173 — you can register as a student, tutor, or coordinator, log in, and see your role-specific dashboard.

## Test the AI pipeline

Add your OpenAI key to `server/.env`:
```
OPENAI_API_KEY=sk-...your-real-key...
```
Then run:
```bash
cd server
npm run test:embedding
```
You'll see a fake student profile get embedded and four topics ranked by match percentage. This is the exact logic that powers recommendations in Phase 2.

## Important security steps

1. **Rotate your MongoDB password.** It was shared in plain text — change it in Atlas → Database Access, then update `server/.env`.
2. **Set a real JWT secret.** In `server/.env`, replace `JWT_SECRET` with a long random string: `openssl rand -hex 32`.
3. **Never commit `.env`.** It's already git-ignored. Only `.env.example` goes to GitHub.

## Push to GitHub

```bash
cd TFMio
git init
git add .
git commit -m "Phase 1: foundation — auth, models, AI service layer"
git branch -M main
git remote add origin https://github.com/anas-tahi/TFMio-.git
git push -u origin main
```

## What's next — Phase 2

The matching engine and AI recommendations:
- Student profile setup UI + auto-embedding on save
- Topic creation for tutors + auto-embedding on publish
- Vector search endpoint (`$vectorSearch` in MongoDB Atlas)
- The swipe card UI
- Express interest → AI match summary → tutor accept → match

Everything in Phase 2 plugs directly into the models and the `llm.service.ts` already built here.
