# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository layout

Three separately-installed npm projects (no workspaces):

- `backend/` — Express 4 + Mongoose + Socket.io API (ESM, `"type": "module"`)
- `frontend/` — React 19 + Vite 7 + Tailwind 4 SPA
- repo root — only Playwright E2E tests (`e2e/`, `playwright.config.js`)

`implementation_plan.md` records a past performance overhaul (pagination, Redis caching, rate limiting, body-size limits, indexes). The "Fix N" comments throughout the code refer to it.

## Commands

Backend (`cd backend`):
- `npm run dev` — nodemon on `server.js` (port `PORT`, default 4000)
- `npm test` — Jest with `--experimental-vm-modules` (required for ESM)
- Single test file: `npm test -- tests/auth.test.js`; single test: `npm test -- tests/auth.test.js -t "login"`
- `npm run test:coverage`
- `npm run docker:redis` — local Redis on 127.0.0.1:6380 via `docker-compose.dev.yml` (password from `backend/.env`)

Frontend (`cd frontend`) — needs Node ≥ 20.19 (Vite 7); CI uses Node 24:
- `npm run dev`, `npm run build`, `npm run lint` (ESLint 9 flat config)
- `npm test` — Vitest (jsdom, globals, setup in `tests/setup.js`)
- Single test: `npx vitest run tests/Login.test.jsx` or `npx vitest run -t "name"`

E2E (repo root): `npx playwright test`. Note these specs hit the **live Vercel deployment** (`LOGIN_URL` hardcoded in each spec), not a local server.

Production backend: `docker-compose.yml` runs Redis, 2 backend replicas, Nginx (TLS) and certbot, intended for an Oracle Cloud Always Free VM. The frontend deploys separately to Vercel. Secrets come from the root `.env` (`REDIS_PASSWORD`) and `backend/.env`, never the compose file. First-time setup and HTTPS: `deploy/init-letsencrypt.sh`. Redeploy the backend with `deploy/rolling-update.sh` (starts new replicas, waits until healthy, then stops the old ones; `server.js` shuts down gracefully on SIGTERM); the full walkthrough is in `deploy/ORACLE_FREE_TIER.md`. MongoDB is external (Atlas via `MONGO_URI`).

CI (`.github/workflows/test.yml`, Node 24) runs backend coverage, frontend coverage, then Playwright.

## Backend architecture

- `app.js` builds the Express app (helmet, mongo-sanitize, custom XSS middleware, compression, CORS locked to `FRONTEND_URL`, 2 MB body limit, rate limiters), mounts all routers under `/api/v1/*`, starts the automation jobs, and connects Mongo. `server.js` wraps it in an HTTP server, attaches Socket.io (with Redis adapter when available), and starts `utils/reminderCron.js`.
- Layering: `routes/*Router.js` → `controllers/*Controller.js` → `models/*Model.js`. Controllers are wrapped in `catchAsyncError` and signal errors with `next(new ErrorHandler(msg, status))` (`middlewares/error.js`).
- **Users are split across four collections**: `Student`, `Teacher`, `Alumni`, `Admin` — each its own model with its own `generateToken`. The JWT carries `{ id, role, jti }`; `middlewares/auth.js` picks the model from `role`. Elsewhere, the role is derived from `req.user.constructor.modelName`, not a field. `models/userModel.js` is legacy (only referenced by support tickets).
- Auth middleware chain: `isAuthenticated` (cookie `token` or `Authorization: Bearer`, checks Redis token blacklist by `jti`, rejects blocked users) → optionally `isVerifiedByAdmin` (non-admins need `adminVerified`), `isStaff` (non-students), `isAdmin`, `requireAdminPermission("<key>")` (fine-grained `admin.permissions`).
- `utils/sendToken.js` sets the cookie (`sameSite: none`, `secure`) **and** returns the token in the JSON body; the frontend stores it in `localStorage` as `alumniToken`.
- **Redis is optional everywhere** (`utils/redisClient.js`, disable with `REDIS_ENABLED=false`). Caching (`middlewares/cache.js`), rate-limit stores, token blacklist, and the Socket.io adapter all fail open. Cache invalidation is version-based: after writes, controllers call `invalidateCache("<prefix>")` matching the prefix used in `cacheMiddleware(...)` on the router.
- Realtime: `Socket.js` exposes `emitToUser(userId, …)` (room `user:<id>`, joined via the client's `register` event), `emitToRoom(mentorshipId, …)` (room `chat:<id>`), and `emitToAll`. Controllers import these to push notifications/messages.
- Integrations: Cloudinary (uploads), Nodemailer (OTP/email templates in `utils/`), Google Calendar + Google/LinkedIn OAuth (`OAuthController`, also mounted at `/auth`), Gemini (support chatbot in `SupportController`).
- Background jobs: `automation/` (purge unverified accounts, expire mentorship requests) and `utils/reminderCron.js`, all via `node-cron`. Every instance schedules them, so wrap handlers in `runExclusive(name, ttlSeconds, fn)` (`utils/cronLock.js`, a Redis lock) so only one instance runs each tick.
- Rate limiting: create limiters with `createLimiter` from `utils/rateLimiter.js` (Redis-backed, disabled when `NODE_ENV=test`). Key logged-in traffic with `userOrIpKey`, not plain IP: campus users share one public IP.
- List pages don't poll: after creating, updating or deleting jobs, events, forum questions/answers or incubation ideas, controllers call `emitFeedUpdated("<feed>")` (`Socket.js`), and the frontend `useFeedRefresh` hook refetches.
- Mongo pool size per instance comes from `MONGO_MAX_POOL` / `MONGO_MIN_POOL` (defaults 20/2).
- Standalone admin scripts: `createAdmin.js`, `updateUsers.js`, `unblockAll.js` (run with `node`).

### Backend tests

Tests do **not** import `app.js` (it starts crons and connects to the real DB). Each test builds a minimal Express app mounting just the router under test plus `errorMiddleware`, and uses `mongodb-memory-server` + Supertest; it sets `JWT_SECRET_KEY` etc. in `beforeAll`. Follow the same pattern for new tests.

## Frontend architecture

- `main.jsx` defines the global `Context` (`isAuthenticated`, `user`, `theme`) and axios interceptors that attach `Bearer alumniToken`. `SocketContext.jsx` provides the socket connection.
- `App.jsx` holds all routes: public auth pages, then four role-scoped trees (`/student`, `/teacher`, `/alumni`, `/admin`) each wrapped in `ProtectedRoute allowedRole=…` with a `<Role>Layout`.
- Role dashboards (`Components/<Role>Dashboard/*.jsx`) are mostly thin wrappers around `Components/Shared*.jsx` (e.g. `<SharedForum role="Student" accentColor="sky" />`). Put feature logic in the Shared component and pass role-specific differences as props.
- For list pages that must stay fresh, use `useFeedRefresh(feed, refetch, { paused })` (`utils/useFeedRefresh.js`) rather than `setInterval`.
- Always build API URLs from `utils/api.js` (`API` = `${VITE_BACKEND_URL}/api/v1`), never hardcode localhost.
- Env vars: `VITE_BACKEND_URL`, `VITE_SOCKET_URL`.
