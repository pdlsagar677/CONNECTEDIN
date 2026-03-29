# Instagram Clone (ConnectIn)

## Project Overview
A full-featured Instagram clone built with the MERN stack (MongoDB, Express, React, Node.js) using TypeScript throughout. The app is called **ConnectIn**.

## Tech Stack

### Backend
- **Runtime:** Node.js with TypeScript
- **Framework:** Express 5
- **Database:** MongoDB Atlas (Mongoose 8 ODM) with compound indexes on all critical collections
- **Auth:** JWT access/refresh token system (access: 15min, refresh: 7d in DB) + bcryptjs + email OTP verification
- **Email:** Nodemailer (Ethereal for dev, swap SMTP creds for production)
- **Security:** Helmet (security headers), express-rate-limit, JWT-authenticated Socket.IO
- **Performance:** gzip compression, `.lean()` queries, `Promise.all` parallel queries, paginated endpoints
- **Real-time:** Socket.io 4
- **File Uploads:** Multer (memory storage, 10MB limit) + Sharp (image optimization) + Cloudinary
- **SSL:** mkcert for local HTTPS (certs in `certs/` directory)
- **Dev:** ts-node-dev, nodemon, seed scripts for test data

### Frontend
- **Framework:** React 19 with TypeScript
- **Build Tool:** Vite (with API + Socket.IO proxy for cross-browser compatibility)
- **State Management:** Redux Toolkit + Redux Persist (localStorage for auth/chat, blacklisted: post/story/socket/call)
- **Routing:** React Router 7
- **Styling:** Tailwind CSS v4 + Inter font (Google Fonts) + Dark/Light mode
- **UI Components:** Radix UI (avatar, dialog, label, popover, select)
- **Icons:** Lucide React
- **Layout:** Responsive with mobile bottom nav (Instagram-style) + desktop left sidebar + floating chat/suggested panels
- **HTTP Client:** Axios (centralized instance at `src/lib/api.ts` with Authorization header + silent token refresh)
- **Real-time:** Socket.io Client (authenticates via `auth.token`)
- **WebRTC:** Native browser RTCPeerConnection API for video/audio calls
- **Notifications:** Sonner (toast) + Instagram-style message popups
- **Performance:** Infinite scroll (IntersectionObserver), skeleton loaders, lazy loading images

## Project Structure

```
Instagram_clone/
├── backend/
│   └── src/
│       ├── controllers/     # Route handlers (optimized with .lean(), Promise.all)
│       ├── models/          # Mongoose schemas (with compound indexes)
│       ├── routes/          # Express routes (with rate limiters)
│       ├── middlewares/     # Auth (isAuthenticated) + Multer + Rate Limiter
│       ├── socket/          # Socket.io setup + JWT auth + WebRTC signaling + call management
│       ├── utils/           # DB, Cloudinary, DataURI, generateTokens, sendEmail
│       ├── scripts/         # Database seed scripts (seed.ts, seed-posts.ts)
│       └── index.ts         # Entry point (HTTPS/HTTP, Helmet, compression, rate limiting)
├── frontend/
│   └── src/
│       ├── components/      # All UI components (with dark: variants)
│       ├── pages/           # Page-level components (Login, Signup, VerifyOTP, ForgotPassword, Home, Explore, etc.)
│       ├── hooks/           # Custom React hooks (useWebRTC, useCallEvents, useGetRTM, useTheme, useGetAllPost, etc.)
│       ├── redux/           # Redux slices + store (auth includes token for API auth)
│       ├── types/           # Shared TypeScript interfaces
│       ├── lib/             # Utilities (api.ts with interceptors, utils.ts)
│       ├── routes/          # ProtectedRoutes
│       └── App.tsx          # Root component + Socket + Router + CallOverlay
├── certs/                   # SSL certificates (mkcert)
├── CLAUDE.md
└── DOCUMENTATION.md
```

## Running the Project

### Backend
```bash
cd backend
npm install
npm run dev          # ts-node-dev on port 5000 (HTTPS if certs exist)
```

### Frontend
```bash
cd frontend
npm install
npm run dev          # Vite on port 5173 (HTTPS if certs exist, proxies /api and /socket.io to backend)
```

### Seed Test Data
```bash
cd backend
npx ts-node src/scripts/seed.ts          # 50 users + 50 posts + comments + follows + likes
npx ts-node src/scripts/seed-posts.ts    # 100 more posts from existing users
# All seed users: <username>@snapgram.test / Test@123
```

### Mobile Testing (iPhone/Android on same WiFi)
1. Get laptop IP: `hostname -I`
2. Backend `.env`: `FRONTEND_URL=https://localhost:5173,https://<IP>:5173`
3. Frontend `.env`: `VITE_API_BASE_URL=/api` (Vite proxy handles forwarding)
4. Update Vite proxy target in `vite.config.ts` to point to `https://<IP>:5000`
5. Generate certs: `cd certs && mkcert localhost <IP>`
6. On iPhone: visit `https://<IP>:5173`, accept certificate warning
7. For full trust: install `certs/rootCA.pem` as a profile on iPhone

### Environment Variables

**Backend `.env`:**
```
MONGO_URI=<mongodb-connection-string>
PORT=5000
SECRET_KEY=<legacy-keep-for-now>
CLOUD_NAME=<cloudinary>
API_KEY=<cloudinary>
API_SECRET=<cloudinary>
FRONTEND_URL=https://localhost:5173,https://<IP>:5173
NODE_ENV=development

# JWT Secrets (Access + Refresh token system)
JWT_ACCESS_SECRET=<random-64-char-string>
JWT_REFRESH_SECRET=<different-random-64-char-string>

# Email (Ethereal for dev - get credentials from https://ethereal.email)
SMTP_HOST=smtp.ethereal.email
SMTP_PORT=587
SMTP_USER=<ethereal-username>
SMTP_PASS=<ethereal-password>
EMAIL_FROM=noreply@connectin.dev
```

**Frontend `.env`:**
```
VITE_API_BASE_URL=/api
VITE_SOCKET_URL=
```

## Authentication System

### Architecture (Access + Refresh Token with Authorization Header)

```
Register → OTP sent via email → Verify OTP → Auto-login
Login → backend returns { user, accessToken } → stored in Redux (localStorage)
Every API call → Authorization: Bearer <token> (from Redux)
Socket.IO → auth: { token } passed on connection
Token expires (15min) → silent refresh via /users/refresh → new token saved to Redux
Refresh token (7d) → stored ONLY in MongoDB, never sent to browser
```

### Key Design Decisions
- **Authorization header over cookies**: Cookies don't work reliably across browsers with self-signed certs on IP addresses. Token stored in Redux (persisted to localStorage) and sent via `Authorization: Bearer` header. Cookie kept as fallback for compatibility.
- **Refresh token in DB only**: Never sent to browser. If access token is stolen, attacker gets max 15 minutes. Token rotation on every refresh invalidates old tokens.
- **Email verification**: 6-digit OTP, bcrypt-hashed before storage, 10-minute expiry. Uses Ethereal for dev (swap SMTP creds for production).
- **isAuthenticated middleware**: Checks Authorization header first, then cookie fallback.
- **Socket.IO auth**: Token passed via `socket.handshake.auth.token`, with cookie fallback.

### Auth Endpoints
- `POST /register` — creates unverified user, sends OTP email
- `POST /verify-otp` — verifies OTP, auto-logs in (returns accessToken)
- `POST /resend-otp` — generates and sends new OTP
- `POST /login` — validates credentials, returns { user, accessToken }
- `POST /refresh` — reads expired token (header or cookie), validates DB refresh token, rotates both tokens
- `GET /logout` — (protected) clears refresh token from DB + cookie
- `POST /forgot-password` — sends password reset OTP to email
- `POST /reset-password` — verifies OTP + sets new password
- `POST /change-password` — (protected) validates current password + sets new
- `DELETE /delete-account` — (protected) cascade deletes all user data

## Key Conventions
- All frontend API calls go through `src/lib/api.ts` (Axios instance with Authorization header interceptor + silent token refresh queue)
- Access token stored in `auth.token` in Redux (persisted to localStorage via redux-persist)
- Shared TypeScript types live in `src/types/index.ts` — do NOT redefine User/Post/Comment/Message locally
- Use `RootState` from `src/redux/store.ts` — do NOT create local RootState interfaces
- Backend uses `req.id` (set by isAuthenticated middleware) for the current user's ID
- Socket.io instance is stored in Redux (`socketSlice`) so any component can emit events
- Socket.io authenticates via `auth.token` passed from frontend (not cookies or query params)
- Call state is stored in Redux (`callSlice`) — blacklisted from persist
- Post and story slices blacklisted from persist — always fetched fresh with pagination
- All images are optimized with Sharp before Cloudinary upload
- Stories auto-delete via MongoDB TTL index (no cron needed)
- Backend CORS supports comma-separated `FRONTEND_URL` for multi-device dev
- Vite proxies `/api` and `/socket.io` to the backend (configured in `vite.config.ts`)

## UI/Layout Architecture
- **Font:** Inter (Google Fonts) — loaded in `index.html`, set in `index.css`
- **Dark/Light Mode:** Tailwind `dark:` class strategy, persisted to localStorage, toggle in sidebar (Sun/Moon icon). FOUC prevention script in `<head>`. Uses `useTheme` hook.
- **MainLayout** (`pages/MainLayout.tsx`): Wraps all authenticated pages
  - Desktop: `md:ml-64` content offset for fixed left sidebar
  - Mobile: `pt-14` for fixed top header, `pb-14` for bottom nav
- **LeftSideBar** (`components/LeftSideBar.tsx`): Fixed left sidebar on desktop (`hidden md:flex w-64`), hamburger menu on mobile with user profile link + dark mode toggle
- **MobileNavBar** (`components/MobileNavBar.tsx`): Instagram-style bottom nav bar (`md:hidden`), 5 icons: Home, Explore, Suggested, Saved, Profile
- **FloatingChat** (`components/FloatingChat.tsx`): Facebook-style floating messenger (desktop only `hidden md:block`), blue bubble bottom-right with unread badge, opens chat list → mini chat window. Hidden on `/chat` page.
- **FloatingSuggested** (`components/FloatingSuggested.tsx`): Floating suggested users panel (desktop only), purple bubble bottom-left, expands to show user list with follow buttons. Hidden on `/suggested` page.
- **ChatPage** (`components/ChatPage.tsx`): Responsive — mobile shows user list OR chat (with back button), desktop shows two-column side-by-side
- **No hardcoded `pl-[20%]` or `ml-[16%]`** — all layout offsets handled by MainLayout

## Performance Optimizations

### Database Indexes
- **Post:** `{ createdAt: -1 }`, `{ author: 1, createdAt: -1 }`, `{ hashtags: 1 }`
- **Message:** `{ receiverId: 1, read: 1 }`, `{ senderId: 1, receiverId: 1, createdAt: -1 }`
- **Comment:** `{ post: 1, createdAt: -1 }`
- **Notification:** `{ recipient: 1, read: 1, createdAt: -1 }`
- **Conversation:** `{ participants: 1, updatedAt: -1 }`
- **Story:** `{ author: 1 }`, `{ expiresAt: 1 }` (TTL)

### Query Optimizations
- `.lean()` on all read-only queries (3-5x faster — plain JS objects instead of Mongoose documents)
- `Promise.all` for parallel queries (countDocuments + find run simultaneously)
- Feed comments limited to 3 per post (not all)
- Explore endpoint skips comment loading entirely
- SuggestedUsers/ChatUsers: `.select()` only needed fields + `.limit()`

### Response Compression
- `compression` middleware — gzip compresses all JSON responses (~80% smaller payloads)

### Frontend Performance
- **Infinite scroll:** IntersectionObserver with callback ref pattern (no stale closures), 10 posts per page
- **Skeleton loaders:** PostSkeleton, StorySkeleton shown during initial load
- **Lazy loading:** `loading="lazy"` on all post images (feed, profile grid, saved, explore)
- **Redux persist blacklist:** `post`, `story`, `socket`, `call` — only auth/chat persisted

## Security Features
- **Helmet**: Security headers (CSP, X-Frame-Options, HSTS, etc.)
- **Rate Limiting**: Global (100k/min dev, 100/15min prod), Auth (20/min dev, 5/15min prod), OTP (10/min dev, 3/15min prod)
- **JWT Auth on Socket.IO**: Verifies token on connection via `auth.token` (no raw userId trust)
- **Multer limit**: 10MB max file size
- **OTP hashing**: bcrypt-hashed before storage in DB
- **Token rotation**: New refresh token on every refresh call
- **Cascade delete**: Account deletion removes all posts, comments, messages, stories, notifications, likes, followers, Cloudinary images
- **Password security**: bcrypt with cost 10, min 6 chars validation

## API Endpoints

### Users (`/api/users`)
- POST `/register`, POST `/login`, GET `/logout` (protected)
- POST `/verify-otp`, POST `/resend-otp`, POST `/refresh`
- POST `/forgot-password`, POST `/reset-password`
- POST `/change-password` (protected), DELETE `/delete-account` (protected)
- GET `/:id/profile`, POST `/profile/edit`
- GET `/suggested`, GET `/chat-users`, GET `/search?q=`
- GET `/:id/followers`, GET `/:id/following`
- POST `/followorunfollow/:id`

### Posts (`/api/post`)
- POST `/addpost`, GET `/all?page=1&limit=10` (paginated), GET `/explore?page=1` (paginated)
- GET `/userpost/all`
- GET `/:id/like`, GET `/:id/dislike`
- POST `/:id/comment`, GET `/:id/comment/all`
- PUT `/edit/:id`, DELETE `/delete/:id`
- GET `/bookmarks`, GET `/:id/bookmark`
- GET `/hashtag/:tag`

### Messages (`/api/message`)
- POST `/send/:id` (supports text, image, voice via multipart)
- GET `/all/:id` (populates replyTo)
- DELETE `/:id/unsend`
- PUT `/:id/read`, PUT `/conversation/:id/read`
- PUT `/:id/react`
- GET `/unread-count`

### Notifications (`/api/notifications`)
- GET `/`, GET `/unread-count`
- PUT `/:id/read`, PUT `/read-all`

### Stories (`/api/stories`)
- POST `/`, GET `/feed`, GET `/:userId`
- PUT `/:id/view`, GET `/:id/viewers`
- DELETE `/:id`

## Socket Events

### Chat
- `getOnlineUsers` — broadcasts online user IDs
- `newMessage` — real-time chat message delivery (includes senderInfo for notifications)
- `messageUnsent` — real-time message deletion
- `messageReaction` — real-time emoji reaction updates
- `messagesRead` — read receipt broadcast
- `typing` / `stopTyping` — chat typing indicators
- `getLastSeen` / `lastSeen` — last seen timestamp for offline users

### Notifications
- `notification` — like/comment/follow notifications
- `postLikeUpdate` — live like count updates on feed

### WebRTC Calling
- `call:user` — initiate call (validates online/busy status)
- `call:incoming` — incoming call notification with ringtone
- `call:accept` / `call:reject` / `call:end` — call lifecycle
- `call:accepted` / `call:rejected` / `call:ended` — call state responses
- `call:busy` / `call:user-offline` / `call:missed` / `call:timeout` — edge cases
- `webrtc:offer` / `webrtc:answer` / `webrtc:ice-candidate` — SDP/ICE relay
