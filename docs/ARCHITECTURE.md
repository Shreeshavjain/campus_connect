# Campus Connect — Implemented Architecture & Workflows

> **Interactive Diagrams:**
> - [System Architecture](architecture.html)
> - [End-to-End Workflows](workflow.html)

---

## 1. Tech Stack & Runtime Boundaries

- **Frontend:** Next.js 16.3.1 (App Router), React 19, Tailwind CSS v4, `motion`, `lucide-react`.
- **Backend / API:** Next.js Route Handlers (`app/api/**`) running in Node.js.
- **Authentication:** Stateless HS256 JWTs signed and verified via `jose` (`lib/auth.ts`), stored in an HTTP-only `auth-token` cookie (7-day expiry). Passwords and OTPs are hashed with `bcryptjs`. There is no `middleware.ts`; each protected API route calls `getAuthUser()` directly.
- **Database:** **MongoDB** via Mongoose (`lib/db.ts`). No PostgreSQL or relational database is used.
- **Caching:** **No Redis or external caching service exists.** Only in-process singleton caching is used:
  - `global._mongooseCache` in `lib/db.ts` (reuses the Mongoose connection across dev hot-reloads / serverless invocations).
  - `cachedTransporter` in `lib/email.ts` (reuses the `nodemailer` SMTP transporter).
- **External Integrations:**
  - **MongoDB** (`MONGODB_URI`) for all persistence.
  - **SMTP Server** (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`) via `nodemailer` for password-reset OTP emails.

---

## 2. Database Models & Relationships

All schemas live under `models/`:

| Model | File | Key Relationships |
|---|---|---|
| `User` | `models/User.ts` | Student profile (`name`, `email` `@nmamit.in` unique, `passwordHash` `select: false`, `campus`, `branch`, `year`, `skills`, `interests`). |
| `Request` | `models/Request.ts` | Directed between `fromUser` (`User`) and `toUser` (`User`). Self-requests rejected. Carries `type` (`FREE` \| `SKILL_SWAP`), `status` (`pending` \| `accepted` \| `rejected` \| `cancelled` \| `completed`), `conversationId` (`Conversation` ref), and `collaborationId` (`Collaboration` forward-ref, **model not yet implemented**). |
| `Conversation` | `models/Conversation.ts` | **1:1 with `Request`** (`requestId` unique). Contains exactly 2 `participants` entries (`{ user, lastReadAt, unreadCount }`), `lastMessageAt`, and `lastMessagePreview`. |
| `Message` | `models/Message.ts` | Belongs to `conversationId` (`Conversation`) and `sender` (`User`), indexed by `{ conversationId: 1, createdAt: -1 }`. |
| `PasswordReset` | `models/PasswordReset.ts` | Belongs to `userId` (`User`). Stores `otpHash`, `otpExpiresAt`, `otpAttempts`, `resetTokenHash`, `resetTokenExpiresAt`, `used`, with a 1-hour MongoDB TTL cleanup index. |

---

## 3. Implemented Data Flows

### Authentication & Password Reset
- `POST /api/auth/register`: Validates `@nmamit.in` email with Zod, hashes password with `bcryptjs` (12 rounds), creates `User`.
- `POST /api/auth/login`: Verifies password, signs 7d HS256 JWT, sets HTTP-only `auth-token` cookie.
- `GET /api/auth/me`: Reads `auth-token`, verifies JWT, re-fetches `User` from MongoDB.
- `POST /api/auth/logout`: Clears `auth-token` cookie (`maxAge: 0`).
- `POST /api/auth/forgot-password` → `POST /api/auth/verify-reset-otp` → `POST /api/auth/reset-password`: Generates 6-digit OTP (`crypto.randomInt`), enforces 60s resend cooldown and 5-attempt cap, atomically consumes OTP (`resetTokenHash: null` guard), issues SHA-256 `resetToken`, and resets password.

### Dashboard Aggregation (`GET /api/dashboard`)
1. `app/dashboard/page.tsx` fetches `GET /api/dashboard` on mount.
2. `app/api/dashboard/route.ts` verifies JWT via `getAuthUser()`, connects to MongoDB, and runs three queries in parallel:
   - `Request.aggregate` for `connections` (`accepted` / `completed`), `incomingPendingRequests`, and excluded counterpart IDs.
   - `Request.find` (top 5 recent, populated with `User` fields).
   - `Conversation.aggregate` summing `participants.unreadCount`.
3. Queries up to 100 candidate `User` docs (excluding self, connected, and pending counterparts) and ranks the top 4 in-memory using `rankRecommendedStudents()` (`lib/dashboard/recommendation.ts`).
4. Explicitly returns `collaborations: { supported: false, active: [] }` and `notifications: { supported: false, unreadCount: 0 }`.

### Requests → Conversations → Messages
- `POST /api/requests/[requestId]/accept`: Uses a Mongoose transaction (with standalone fallback) to atomically transition `Request` (`status: "pending"` → `"accepted"`), create a 1:1 `Conversation`, and link `Request.conversationId`.
- `GET /api/conversations`: Lists the user's conversations sorted by `lastMessageAt: -1`, populated with `Request` and counterpart `User`.
- `GET /api/conversations/[conversationId]/messages`: Cursor-paginates up to 50 `Message` docs and resets the caller's `unreadCount` to `0`.
- `POST /api/conversations/[conversationId]/messages`: Creates a `Message`, updates `lastMessageAt` / `lastMessagePreview`, and increments the counterpart's `unreadCount`.
- `PATCH /api/conversations/[conversationId]/read`: Atomically resets the caller's `unreadCount` to `0` and updates `lastReadAt`.

---

## 4. Planned / Unimplemented Features & Gaps

- **Collaborations:** `Request.collaborationId` references `"Collaboration"`, and `types/index.ts` defines `DashboardCollaboration`, but no `Collaboration` model, API route, or UI exists (`capabilities.collaborations: false`).
- **Notifications:** `NotificationPanel.tsx` renders a static empty state and `capabilities.notifications` is `false`; no `Notification` model or API route exists.
- **Clubs:** `ClubSection.tsx` is a static placeholder with no model or API backing.
- **Missing App Router Pages:** `Sidebar.tsx` and `app/dashboard/page.tsx` link to `/students`, `/requests`, `/connections`, `/messages`, `/clubs`, and `/notifications`, none of which have `page.tsx` implementations yet.
- **Missing Request Creation/Mutation Routes:** Only `POST /api/requests/[requestId]/accept` is implemented; there are no routes yet to create (`POST /api/requests`), reject, cancel, or complete a request.
- **Root Home Page & Auth Middleware:** `app/page.tsx` is still the default `create-next-app` template, and there is no `middleware.ts` protecting `/dashboard` on the server/edge.
