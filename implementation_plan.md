# Alumni Portal — Full Performance & Optimization Plan

> [!NOTE]
> Updated after reviewing `main` — includes all features added after the initial plan (notification badge, admin-verification restrictions, new layout components).

## Background

With ~100 users, the backend crashed and **~190 GB of data was transferred** during simple login + profile completion flows. This is catastrophically over-budget. After reading every controller, model, middleware and frontend component, I have identified **9 distinct root causes** and designed fixes for all of them.

---

## Root Cause Analysis

### 🔴 Critical — Directly Causing the 190 GB Transfer

| # | Problem | Location | Estimated Impact |
|---|---------|----------|-----------------|
| 1 | **Auto-screenshot on every message** | `ChatbotWidget.jsx` | Every chat message sends a 600 KB–1.5 MB JPEG screenshot. 100 users × 5 messages = **300–750 MB per session** |
| 2 | **Body size limit is 50 MB** | `app.js` | `express.json({ limit: "50mb" })` — allows enormous payloads with no rate limiting |
| 3 | **`getUser` returns entire user document** | `auth.js` + `userController.js` | Every page load and API guard fetches the full user object (including `mentorStats`, all slots, all embedded arrays) from DB and sends it to frontend |
| 4 | **`getPeople` fetches ALL users at once, no pagination** | `PeopleController.js` | Dumps every student + alumni + teacher in one response. With 100 users × 3 roles this is 300 documents per page load |
| 5 | **`getMyConnections` does N+1 DB queries** | `ConnectionController.js:234-264` | For each connection, makes 1 extra DB query to fetch the other user's full profile. 20 connections = 21 DB queries |

### 🟡 Major — Accelerating Resource Exhaustion

| # | Problem | Location | Estimated Impact |
|---|---------|----------|-----------------|
| 6 | **No HTTP-level caching headers** | All GET routes | Browser/CDN re-fetches everything on every navigation. No `Cache-Control`, no ETags |
| 7 | **No backend rate limiting** | `app.js` | No protection against rapid API calls or brute-force. Any spam floods the DB |
| 8 | **Socket.io uses polling fallback** | `SocketContext.jsx` | `transports: ["websocket", "polling"]` — polling sends HTTP requests every 25 seconds per connected user. 100 users = 4 requests/sec constantly |
| 9 | **No DB indexes on hot query paths** | Multiple models | `Connection.find`, `ChatMessage.find`, `MentorshipRequest.find` run without compound indexes on the fields they filter by most |

### 🟠 Moderate — Unnecessary Overhead

| # | Problem | Location |
|---|---------|----------|
| 10 | **`auth.js` fetches FULL user document on every request** | `auth.js:35` — `Model.findById(decoded.id)` with no `.select()` |
| 11 | **`getAdminTickets` does a `.populate()` on every call** | `SupportController.js:219-221` |
| 12 | **`MentorshipController.getMentors` returns all mentors at once** | No pagination |
| 13 | **Profile photo upload accepts raw base64 in body** | `userController.js:400` — sends 500 KB–2 MB in a JSON body |
| 14 | **`SocketContext.jsx` hardcodes `http://localhost:4000`** | Never uses env var in production |
| 15 | **No compression middleware** | `app.js` — HTTP responses not gzip compressed |

---

## 🆕 Newly Discovered Issues

These features exist on the `main` branch but have their own performance/security problems that must be addressed:

### 🔴 New Critical: Header Polls Connections API on Every Mount

**File:** `frontend/src/Components/StudentDashboard/Header.jsx` (and `AlumniDashboard/Header.jsx`, `TeacherDashboard/Header.jsx`)

The notification badge (the red count on the "Connections" nav link showing pending requests) works like this:

```js
// Header.jsx — runs on every page load/navigation
useEffect(() => {
  axios
    .get("http://localhost:4000/api/v1/connection/pending", { withCredentials: true })
    .then((res) => setPendingCount(res.data.requests?.length ?? 0))
    .catch(() => setPendingCount(0));
}, []);
```

**Problems:**
1. **Hardcoded `http://localhost:4000`** — This never works in production. Every user gets `setPendingCount(0)` silently (the catch swallows the error), so the badge never shows.
2. **Called on every mount** — The Header is re-mounted on every route change. With 3 dashboards × multiple pages, this fires the `/pending` API call 5–10 times per user session.
3. **No caching** — Even if a user hasn't done anything, it re-fetches every time they click a nav item.
4. **Returns full connection objects** — `getPendingRequests` returns both `incoming` and `outgoing` arrays with full connection data. We only need `incoming.length` for the badge.

**Fix:** Replace the polling `useEffect` with a Socket.io event listener. When the backend emits `connection:new_request`, increment the count in real-time. Only do the initial HTTP fetch once (on login), not on every mount.

### 🔴 New Critical: All API Base URLs Are Hardcoded as `http://localhost:4000`

**Files affected:** Virtually every frontend component — `SharedConnectionsPage.jsx`, `Header.jsx`, `ProtectedRoute.jsx`, `Requests.jsx`, `Alumni.jsx`, `SocialLogin.jsx`, `ChatbotWidget.jsx`, etc.

Every single API call is hardcoded:
```js
const API_BASE = "http://localhost:4000/api/v1"; // ← breaks in production
axios.get("http://localhost:4000/api/v1/user/me", ...)
```

In production, these calls **fail silently** (CORS mismatch, wrong host) causing cascading errors. The users hitting your deployed app are calling `localhost` on their own machine — which obviously fails. This means **every authenticated action is failing** in production, and users may be retrying repeatedly, generating error logs and wasted requests.

**Fix:** Create a single `frontend/src/utils/api.js` file that exports `const API = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000"`. Replace all hardcoded URLs across all components.

### 🟡 New Major: Admin Verification Feature Has No Backend Guard on Connection Listing

The `ProfileIncompleteModal` and `RestrictedAccess` components correctly show UI restrictions to unverified users. However, **the backend `/api/v1/connections` routes do NOT check `adminVerified`**. 

An unverified user can call `GET /api/v1/connections` directly (e.g., via Postman or by bypassing the UI) and get everyone's connection data. The `isVerifiedByAdmin` middleware exists in `auth.js` but is not applied to the connection routes in `ConnectionRouter.js`.

**Fix:** Add `isVerifiedByAdmin` middleware to `sendConnectionRequest` and `getMyConnections` routes (the two core routes that should be restricted). Pending/status checks can remain open so the UI can still show the "pending admin verification" state.

### 🟡 New Major: `ProtectedRoute` Hardcodes `http://localhost:4000` + No User Context Update

```js
// ProtectedRoute.jsx
axios.get("http://localhost:4000/api/v1/user/me", { withCredentials: true })
  .then((res) => {
    const role = res.data.user?.role;
    // ... checks role but NEVER calls setUser() or setIsAuthenticated()
  })
```

The `ProtectedRoute` fetches user data on every protected page but throws away the response — it never calls `setUser(res.data.user)` or `setIsAuthenticated(true)`. This means the global `Context` user state is never populated from `ProtectedRoute`, causing components that depend on `useContext(Context).user` to receive `null` until another component sets it.

---

## User Review Required

> [!CAUTION]
> **Fix #1 (Screenshot removal) is the single biggest bandwidth culprit.** The current code takes a full-page JPEG screenshot and sends it with *every* chat message (not just special ones). This alone can account for tens of gigabytes with minimal users. We will replace this with an **explicit 📸 button** with a 60-second cooldown — so normal text messages send zero image data.

> [!WARNING]
> **Fix #4 (Pagination on People page)** will require small frontend changes to the `People.jsx` and `BatchmatesPage.jsx` components to add a "Load More" button. The API will now return 20 users at a time instead of all at once.

> [!WARNING]
> **Fix #7 (Rate limiting)** requires installing `express-rate-limit` on the backend (`npm install express-rate-limit`). This is a new npm dependency.

> [!IMPORTANT]
> **Fix #3 (Lean getUser response)** changes what fields are returned from `/api/v1/user/me`. The frontend currently spreads the entire user object everywhere — after this fix, very large fields like `mentorshipSlots`, `mentorStats`, and `googleTokens` will NOT be in the top-level user context. Separate API calls will fetch them only on the pages that need them (Settings, Mentorship). This is the correct pattern and will not break any currently working features.

---

## Proposed Changes (9 Fixes, Grouped by Component)

---

### Fix 1 — Remove Auto-Screenshot; Add Manual 📸 Button with Anti-Spam

#### [MODIFY] [ChatbotWidget.jsx](file:///c:/Users/prath/OneDrive/Desktop/Work/College%20Work/Minor%20Project/Minor-Project/Alumni_Portal-main/frontend/src/Components/ChatbotWidget.jsx)

- **Remove** the `htmlToImage.toJpeg(document.body, ...)` call from `handleSend`. Text messages will send **zero image data**.
- **Add** a new `screenshotCooldown` state (boolean).
- **Add** `handleSendWithScreenshot` function that:
  - Checks `screenshotCooldown === false` before proceeding.
  - Takes a compressed screenshot (`quality: 0.4`, `maxWidth: 800px`) using `htmlToImage`.
  - Sends the API request with the image.
  - Sets `screenshotCooldown = true` and resets it after 60 seconds.
- **Add** a 📸 camera `<button>` next to the chat input (disabled + shows countdown when on cooldown).
- The normal **Send** button / Enter key sends **text only** (a few bytes).

**Expected Result:** Eliminates ~95% of chatbot bandwidth. Normal conversation: 0 bytes of image data.

---

### Fix 2 — Reduce Body Size Limit + Add HTTP Compression

#### [MODIFY] [app.js](file:///c:/Users/prath/OneDrive/Desktop/Work/College%20Work/Minor%20Project/Minor-Project/Alumni_Portal-main/backend/app.js)

- Change `express.json({ limit: "50mb" })` → `express.json({ limit: "2mb" })`.
- Change `express.urlencoded({ limit: "50mb" })` → `express.urlencoded({ limit: "2mb" })`.
- Add `compression` middleware (`npm install compression`) to gzip all HTTP responses. This alone reduces payload sizes by ~70%.

**Expected Result:** Rejects accidentally huge payloads. Gzip compresses all API JSON responses.

---

### Fix 3 — Add Rate Limiting

#### [MODIFY] [app.js](file:///c:/Users/prath/OneDrive/Desktop/Work/College%20Work/Minor%20Project/Minor-Project/Alumni_Portal-main/backend/app.js)

- Install and configure `express-rate-limit` (`npm install express-rate-limit`).
- Apply a **global limiter**: 100 requests per 15 minutes per IP.
- Apply a **strict limiter** to auth routes (`/api/v1/user/register`, `/login`, `/forgot-password`): 10 requests per 15 minutes per IP.
- Apply a **support chat limiter** to `/api/v1/support/ask`: 20 requests per 5 minutes per IP.

**Expected Result:** Prevents any single user/bot from hammering the API and crashing the server.

---

### Fix 4 — Slim Down `getUser` Response + Slim Auth Middleware

#### [MODIFY] [userController.js](file:///c:/Users/prath/OneDrive/Desktop/Work/College%20Work/Minor%20Project/Minor-Project/Alumni_Portal-main/backend/controllers/userController.js)

- In `getUser`, use `.select()` to return only core identity fields: `name email phone role department profilePhoto bio linkedIn github accountVerified adminVerified isBlocked enrollmentYear graduationYear`. Heavy fields like `mentorshipSlots`, `mentorStats`, `googleTokens` are excluded.

#### [MODIFY] [auth.js](file:///c:/Users/prath/OneDrive/Desktop/Work/College%20Work/Minor%20Project/Minor-Project/Alumni_Portal-main/backend/middlewares/auth.js)

- Add `.select()` to `Model.findById(decoded.id)` in `isAuthenticated` to only fetch the fields needed for auth checks: `name email isBlocked adminVerified accountVerified role`. This reduces the DB payload on every single API call.

**Expected Result:** Every page load / API call that hits `isAuthenticated` fetches ~500 bytes instead of ~5 KB.

---

### Fix 5 — Paginate `getPeople` API

#### [MODIFY] [PeopleController.js](file:///c:/Users/prath/OneDrive/Desktop\Work\College%20Work\Minor%20Project\Minor-Project\Alumni_Portal-main\backend\controllers\PeopleController.js)

- Add `page` and `limit` query params (default: `page=1`, `limit=20`).
- Apply `.skip()` and `.limit()` to all three model queries.
- Return `total`, `page`, `pages` in response for frontend pagination.

#### [MODIFY] [People.jsx](file:///c:/Users/prath/OneDrive/Desktop/Work/College%20Work/Minor%20Project/Minor-Project/Alumni_Portal-main/frontend/src/Components/People.jsx)

- Add state for `page` and `hasMore`.
- Add a "Load More" button at the bottom.
- Append new results to existing list instead of replacing.

**Expected Result:** First load fetches 20 users instead of 100+. Reduces initial payload by ~80%.

---

### Fix 6 — Fix N+1 Query in `getMyConnections`

#### [MODIFY] [ConnectionController.js](file:///c:/Users/prath/OneDrive/Desktop/Work/College%20Work/Minor%20Project/Minor-Project/Alumni_Portal-main/backend/controllers/ConnectionController.js)

- Replace the `Promise.all(connections.map(async (c) => ...findById...))` pattern with a batch lookup.
- Collect all IDs by role first, then do **3 `findMany` calls** (one per role) using `$in`, and build a lookup map.
- Merge the results — now it's `O(connections.length + 3)` queries instead of `O(connections.length × 2)`.

**Expected Result:** 20 connections = 4 DB queries instead of 41. ~10x faster, dramatically less DB load.

---

### Fix 7 — Fix Socket.io Polling + Production URL

#### [MODIFY] [SocketContext.jsx](file:///c:/Users/prath/OneDrive/Desktop/Work/College%20Work/Minor%20Project/Minor-Project/Alumni_Portal-main/frontend/src/SocketContext.jsx)

- Change `transports: ["websocket", "polling"]` → `transports: ["websocket"]`.
  - WebSocket is a single persistent connection. Polling sends a new HTTP request every 25 seconds per user. With 100 users, polling generates 4 requests/second constantly.
- Fix the hardcoded `http://localhost:4000` → use `import.meta.env.VITE_BACKEND_URL`.

**Expected Result:** Eliminates ~4 HTTP polling requests/second with 100 users (~10 GB of unnecessary data per day).

---

### Fix 8 — Add MongoDB Compound Indexes

#### [MODIFY] [ConnectionModel.js](file:///c:/Users/prath/OneDrive/Desktop/Work/College%20Work/Minor%20Project/Minor-Project/Alumni_Portal-main/backend/models/ConnectionModel.js)

- Add compound index: `{ "sender.id": 1, "receiver.id": 1, status: 1 }`.
- Add index: `{ "receiver.id": 1, status: 1 }`.

#### [MODIFY] [ChatMessageModel.js](file:///c:/Users/prath/OneDrive/Desktop/Work/College%20Work/Minor%20Project/Minor-Project/Alumni_Portal-main/backend/models/ChatMessageModel.js)

- Already has `{ connectionId: 1, createdAt: 1 }` and `{ mentorshipId: 1, createdAt: 1 }` — these are good.
- Add index on `{ "sender.id": 1, readBy: 1 }` for the unread counts aggregation.

#### [MODIFY] [MentorshipRequestModel.js](file:///c:/Users/prath/OneDrive/Desktop/Work/College%20Work/Minor%20Project/Minor-Project/Alumni_Portal-main/backend/models/MentorshipRequestModel.js)

- Add index: `{ "student.id": 1, status: 1 }`.
- Add index: `{ "mentor.id": 1, status: 1 }`.

**Expected Result:** DB queries on hot paths run in microseconds instead of full collection scans.

---

### Fix 9 — Paginate `getMentors` API

#### [MODIFY] [MentorshipController.js](file:///c:/Users/prath/OneDrive/Desktop/Work/College%20Work/Minor%20Project/Minor-Project/Alumni_Portal-main/backend/controllers/MentorshipController.js)

- Add `page` and `limit` params to `getMentors` (default: `page=1`, `limit=12`).
- Apply `.limit()` to both Alumni and Teacher queries.
- Return pagination metadata.

**Expected Result:** Fetches 12 mentors at a time instead of all of them.

---

### Fix 10 — Replace Header Polling with Socket.io Real-Time Badge

#### [MODIFY] All 3 Header files:
- [StudentDashboard/Header.jsx](file:///c:/Users/prath/OneDrive/Desktop/Work/College%20Work/Minor%20Project/Minor-Project/Alumni_Portal-main/frontend/src/Components/StudentDashboard/Header.jsx)
- [AlumniDashboard/Header.jsx](file:///c:/Users/prath/OneDrive/Desktop/Work/College%20Work/Minor%20Project/Minor-Project/Alumni_Portal-main/frontend/src/Components/AlumniDashboard/Header.jsx)
- [TeacherDashboard/Header.jsx](file:///c:/Users/prath/OneDrive/Desktop/Work/College%20Work/Minor%20Project/Minor-Project/Alumni_Portal-main/frontend/src/Components/TeacherDashboard/Header.jsx)

**Changes:**
- Remove the `useEffect` that calls `/api/v1/connection/pending` on every mount.
- Instead, use `useSocket()` to listen for `connection:new_request` and `connection:accepted/rejected/withdrawn` events to update `pendingCount` in real-time.
- Do one initial HTTP fetch **only** on first mount (not on every re-mount) by using the global Context to cache the count.
- Fix the hardcoded URL to use `import.meta.env.VITE_BACKEND_URL`.

**Expected Result:** Eliminates 5–10 API calls per user session. Badge updates instantly via WebSocket instead.

---

### Fix 11 — Create Central API Base URL Utility + Fix All Hardcoded URLs

#### [NEW] [frontend/src/utils/api.js](file:///c:/Users/prath/OneDrive/Desktop/Work/College%20Work/Minor%20Project/Minor-Project/Alumni_Portal-main/frontend/src/utils/api.js)

```js
export const API_BASE = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";
export const API = `${API_BASE}/api/v1`;
```

#### [MODIFY] All frontend components that have hardcoded URLs:
- `SharedConnectionsPage.jsx` — `const API_BASE = "http://localhost:4000/api/v1"`
- `StudentDashboard/Header.jsx` — `axios.get("http://localhost:4000/...")`
- `ProtectedRoute.jsx` — `axios.get("http://localhost:4000/api/v1/user/me")`
- `StudentDashboard/Alumni.jsx` — `axios.get("http://localhost:4000/api/v1/people")`
- `StudentDashboard/Requests.jsx` — `const API = "http://localhost:4000/api/v1/mentorship"`
- `Authentication/SocialLogin.jsx` — `const BASE = "http://localhost:4000/api/v1/oauth"`
- `ChatbotWidget.jsx` — multiple hardcoded URLs
- *(and all other components with the same pattern)*

Replace all with:
```js
import { API } from "../../utils/api.js";
// then use: axios.get(`${API}/connection/pending`, ...)
```

#### [MODIFY] [SocketContext.jsx](file:///c:/Users/prath/OneDrive/Desktop/Work/College%20Work/Minor%20Project/Minor-Project/Alumni_Portal-main/frontend/src/SocketContext.jsx)
- Replace `io("http://localhost:4000", ...)` with `io(API_BASE, ...)`.

**Expected Result:** The app actually works in production. This is likely why users are generating massive error traffic — every API call is silently failing against `localhost` and the frontend is retrying.

---

### Fix 12 — Add `isVerifiedByAdmin` Guard to Connection Send/List Routes

#### [MODIFY] [ConnectionRouter.js](file:///c:/Users/prath/OneDrive/Desktop/Work/College%20Work/Minor%20Project/Minor-Project/Alumni_Portal-main/backend/routes/ConnectionRouter.js)

- Import `isVerifiedByAdmin` from `auth.js`.
- Add it as middleware to `POST /send` and `GET /` (getMyConnections):
  ```js
  router.post("/send", isVerifiedByAdmin, sendConnectionRequest);
  router.get("/", isVerifiedByAdmin, getMyConnections);
  ```
- Leave `GET /pending`, `GET /status/:userId`, and chat routes open — these are needed to show the user their current state even while unverified.

#### [MODIFY] [ProtectedRoute.jsx](file:///c:/Users/prath/OneDrive/Desktop/Work/College%20Work/Minor%20Project/Minor-Project/Alumni_Portal-main/frontend/src/Components/ProtectedRoute.jsx)

- Call `setUser(res.data.user)` and `setIsAuthenticated(true)` inside the `.then()` so the global Context is populated. This eliminates duplicate `/me` API calls from child components.

**Expected Result:** Unverified users can't spam connection requests via the API. Context user is populated from ProtectedRoute, eliminating redundant `/me` calls from dashboard components.

---

## Summary Table

| Fix | Files Changed | Difficulty | Bandwidth Saved |
|-----|--------------|------------|-----------------|
| 1 — Remove auto-screenshot | `ChatbotWidget.jsx` | Low | **~80–95% of total** |
| 2 — Compress responses + smaller body limit | `app.js` | Low | ~70% of remaining JSON |
| 3 — Rate limiting | `app.js` | Low | Prevents abuse spikes |
| 4 — Slim getUser response | `userController.js`, `auth.js` | Low | ~60% of per-request overhead |
| 5 — Paginate getPeople | `PeopleController.js`, `People.jsx` | Medium | ~80% of people page |
| 6 — Fix N+1 connections query | `ConnectionController.js` | Medium | ~10x fewer DB queries |
| 7 — Socket.io websocket only | `SocketContext.jsx` | Low | ~10 GB/day at 100 users |
| 8 — MongoDB indexes | 3 model files | Low | Faster DB, less CPU |
| 9 — Paginate getMentors | `MentorshipController.js` | Low | ~70% of mentors page |
| **10 — Replace Header polling with Socket badge** | 3 Header files | Low | Eliminates 5–10 API calls/user session |
| **11 — Central API URL + fix all localhost hardcodes** | ~15+ frontend files | Medium | **Fixes production entirely** — currently all API calls likely fail |
| **12 — `isVerifiedByAdmin` on connection routes + fix ProtectedRoute context** | `ConnectionRouter.js`, `ProtectedRoute.jsx` | Low | Security + removes duplicate `/me` calls |

---

## Verification Plan

### Automated / Manual Checks
- Open browser DevTools → Network tab → login and navigate to dashboard. Total transferred should be **< 2 MB** (vs current ~190 MB/user session).
- Check that chat sends 0 bytes of image data when pressing Enter.
- Check the 📸 button disables for 60s after use and shows a countdown.
- Verify `People` page shows 20 results with a "Load More" button.
- Verify `Messages` page loads connections without hanging.

### Backend Checks
- Hit `/api/v1/support/ask` rapidly 21+ times — should get `429 Too Many Requests` after 20.
- Hit `/api/v1/user/login` 11 times quickly — should get 429 after 10.
- MongoDB: run `db.connections.getIndexes()` to confirm new indexes exist.

---

## Open Questions

1. **Cloudinary profile photo uploads**: The current flow sends raw base64 in the JSON body (`uploadProfilePhoto` in `userController.js`). Even after body limit is 2 MB, a high-res photo can exceed this. Do you want me to add a separate **multipart/form-data upload route** using `multer` for profile photos, which is the correct approach for file uploads?

2. **Frontend environment variable**: The deployed frontend likely has `VITE_BACKEND_URL` set. Is that correct, or is it missing from the production build env? (This would also explain the socket not connecting properly in production.)

3. **`getAdminTickets` populate**: Currently fetches all non-resolved tickets. Should we add pagination here too (e.g., 20 tickets per page), or is the admin panel OK fetching all for now?
