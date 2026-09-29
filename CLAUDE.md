# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository layout

Three separately-installed npm projects (no workspaces):

- `backend/` — API (ESM)
- `frontend/` — React SPA
- repo root — only Playwright E2E tests (`e2e/`, `playwright.config.js`)

`implementation_plan.md` records a past performance overhaul (pagination, Redis caching, rate limiting, body-size limits, indexes). The "Fix N" comments throughout the code refer to it.

## Commands

Backend (`cd backend`) — `npm ci` needs npm 11 (Node 24); the lock file fails under npm 10:
- `npm test` — Jest with `--experimental-vm-modules` (required for ESM)
- Single test file: `npm test -- tests/auth.test.js`; single test: `npm test -- tests/auth.test.js -t "login"`
- `npm run docker:redis` — local Redis on 127.0.0.1:6380 via `docker-compose.dev.yml` (password from `backend/.env`)

Frontend (`cd frontend`) — needs Node ≥ 20.19 (Vite 7); CI uses Node 24:
- Single test: `npx vitest run tests/Login.test.jsx` or `npx vitest run -t "name"`

E2E (repo root): `npx playwright test` builds the frontend and serves it on :4173 (Playwright `webServer`); specs mock the API calls they need with `page.route`, so no backend is required. Set `E2E_BASE_URL` to run them against a deployed site instead.

Production backend: `docker-compose.yml` runs Redis, 2 backend replicas, Nginx (TLS) and certbot, intended for an Oracle Cloud Always Free VM. The frontend deploys separately to Vercel. Secrets come from the root `.env` (`REDIS_PASSWORD`) and `backend/.env`, never the compose file. First-time setup and HTTPS: `deploy/init-letsencrypt.sh`. Redeploy the backend with `deploy/rolling-update.sh` (starts new replicas, waits until healthy, then stops the old ones; `server.js` shuts down gracefully on SIGTERM); the full walkthrough is in `deploy/ORACLE_FREE_TIER.md`. MongoDB is external (Atlas via `MONGO_URI`).

## Backend architecture

- `app.js` builds the Express app (helmet, mongo-sanitize, custom XSS middleware, compression, CORS locked to `FRONTEND_URL`, 2 MB body limit, rate limiters), mounts all routers under `/api/v1/*`, starts the automation jobs, and connects Mongo. `server.js` wraps it in an HTTP server, attaches Socket.io (with Redis adapter when available), and starts `utils/reminderCron.js`.
- Layering: `routes/*Router.js` → `controllers/*Controller.js` → `models/*Model.js`. Controllers are wrapped in `catchAsyncError` and signal errors with `next(new ErrorHandler(msg, status))` (`middlewares/error.js`).
- **Users are split across four collections**: `Student`, `Teacher`, `Alumni`, `Admin` — each its own model with its own `generateToken`. The JWT carries `{ id, role, jti }`; `middlewares/auth.js` picks the model from `role`. Elsewhere, the role is derived from `req.user.constructor.modelName`, not a field. `models/userModel.js` is legacy (only referenced by support tickets).
- Auth middleware chain: `isAuthenticated` (cookie `token` or `Authorization: Bearer`, checks Redis token blacklist by `jti`, rejects blocked users) → optionally `isVerifiedByAdmin` (non-admins need `adminVerified`), `isStaff` (non-students), `isAdmin`, `requireAdminPermission("<key>")` (fine-grained `admin.permissions`).
- `utils/sendToken.js` sets the cookie (`sameSite: none`, `secure`) **and** returns the token in the JSON body; the frontend stores it in `localStorage` as `alumniToken`.
- **Redis is optional everywhere** (`utils/redisClient.js`, disable with `REDIS_ENABLED=false`). Caching (`middlewares/cache.js`), rate-limit stores, token blacklist, and the Socket.io adapter all fail open. Cache invalidation is version-based: after writes, controllers call `invalidateCache("<prefix>")` matching the prefix used in `cacheMiddleware(...)` on the router.
- Realtime: `Socket.js` exposes `emitToUser(userId, …)` (room `user:<id>`, joined via the client's `register` event), `emitToRoom(mentorshipId, …)` (room `chat:<id>`), and `emitToAll`. Controllers import these to push notifications/messages.
- Background jobs: `automation/` (purge unverified accounts, expire mentorship requests) and `utils/reminderCron.js`, all via `node-cron`. Every instance schedules them, so wrap handlers in `runExclusive(name, ttlSeconds, fn)` (`utils/cronLock.js`, a Redis lock) so only one instance runs each tick.
- Rate limiting: create limiters with `createLimiter` from `utils/rateLimiter.js` (Redis-backed, disabled when `NODE_ENV=test`). Key logged-in traffic with `userOrIpKey`, not plain IP: campus users share one public IP.
- List pages don't poll: after creating, updating or deleting jobs, events, forum questions/answers or incubation ideas, controllers call `emitFeedUpdated("<feed>")` (`Socket.js`), and the frontend `useFeedRefresh` hook refetches.
- Mongo pool size per instance comes from `MONGO_MAX_POOL` / `MONGO_MIN_POOL` (defaults 20/2).
- Never put raw user search text in `$regex`; use `searchRegex(text)` from `utils/escapeRegex.js`.
- Every list endpoint is paginated or capped (`page`/`limit` with `total`/`hasMore`; chats use a `before=<messageId>` cursor via `utils/chatHistory.js`). People, Batchmates and mentor lists are Redis-cached under the `directory`/`mentors` prefixes; call `invalidateUserListings()` (`middlewares/cache.js`) after any profile, verification, block or mentorship-slot change.

### Backend tests

Tests do **not** import `app.js` (it starts crons and connects to the real DB). Each test builds a minimal Express app mounting just the router under test plus `errorMiddleware`, and uses `mongodb-memory-server` + Supertest; it sets `JWT_SECRET_KEY` etc. in `beforeAll`. Follow the same pattern for new tests.

## Frontend architecture

- `main.jsx` only installs the axios interceptors (attach `Bearer alumniToken`) and mounts `AppWrapper.jsx`, which provides the global `Context` (`isAuthenticated`, `user`, `theme`; defined in `context.js`) and `SocketProvider` (`SocketContext.jsx`; components read the socket with `useSocket()` from `useSocket.js`). Import `Context` from `context.js`, never from `main.jsx`.
- `ProtectedRoute` loads `/user/me` into `Context` before rendering a role layout, so layouts and pages read `user` from `Context` instead of fetching it again.
- Role pages are lazy-loaded in `App.jsx` (`page(<Component />)` wraps them in `Suspense`); keep new pages lazy.
- `App.jsx` holds all routes: public auth pages, then four role-scoped trees (`/student`, `/teacher`, `/alumni`, `/admin`) each wrapped in `ProtectedRoute allowedRole=…` with a `<Role>Layout`.
- Role dashboards (`Components/<Role>Dashboard/*.jsx`) are mostly thin wrappers around `Components/Shared*.jsx` (e.g. `<SharedForum role="Student" accentColor="sky" />`). Put feature logic in the Shared component and pass role-specific differences as props.
- For list pages that must stay fresh, use `useFeedRefresh(feed, refetch, { paused })` (`utils/useFeedRefresh.js`) rather than `setInterval`.
- Always build API URLs from `utils/api.js` (`API` = `${VITE_BACKEND_URL}/api/v1`), never hardcode localhost.
