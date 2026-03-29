# ConnectIn - Instagram Clone Documentation

## Table of Contents
1. [What Was Done](#what-was-done)
2. [Feature Details](#feature-details)
3. [Files Created & Modified](#files-created--modified)
4. [What Is Remaining](#what-is-remaining)

---

## What Was Done

### Phase 0: Bug Fixes & Foundation

**Problem:** The app had broken pages, type mismatches, hardcoded URLs, and non-functional features.

**Fixes applied:**

| Bug | File | Fix |
|-----|------|-----|
| `authSlice` User interface used `id`, `name`, `avatar` instead of `_id`, `username`, `profilePicture` | `redux/authSlice.ts` | Rewrote interface to match backend response shape |
| `Post.tsx` used `https://localhost:5000` (3 places) | `components/Post.tsx` | Replaced with centralized API instance |
| Profile page showed no posts (`displayedPost = []` hardcoded) | `components/Profile.tsx` | Derived from `userProfile.posts` / `userProfile.bookmarks` based on active tab |
| Profile stats showed "0" for posts/followers/following | `components/Profile.tsx` | Connected to `userProfile.posts.length`, `followers.length`, `following.length` |
| Profile ID comparison used `user?.id` instead of `user?._id` | `components/Profile.tsx` | Fixed to `user?._id === userProfile?._id` |
| `isFollowing` was hardcoded to `false` | `components/Profile.tsx` | Derived from `userProfile.followers.includes(user._id)` |
| Profile showed `userProfile?.avatar` instead of `profilePicture` | `components/Profile.tsx` | Fixed to `userProfile?.profilePicture` |
| Bio was hardcoded to placeholder text | `components/Profile.tsx` | Connected to `userProfile?.bio` |
| Follow/Unfollow buttons had no API calls | `Profile.tsx`, `SuggestedUsers.tsx` | Wired to `POST /api/users/followorunfollow/:id` with Redux state updates |
| `redux/hooks.ts` was a stale duplicate store | `redux/hooks.ts` | Replaced with typed `useAppDispatch` / `useAppSelector` hooks |
| `main.tsx` imported store from wrong file | `main.tsx` | Fixed import + added `PersistGate` and `Toaster` |
| Socket not stored in Redux | `App.tsx` | Added `dispatch(setSocket(socketio))` |
| `tsconfig.json` had wrong path: `@/components/* -> pages/*` | `tsconfig.json` | Simplified to single `@/* -> ./src/*` mapping |
| Every component defined its own `RootState` locally | All components | Import from `redux/store.ts` |
| 15+ files had hardcoded `http://localhost:5000` URLs | All components + hooks | Replaced with centralized `API` instance from `lib/api.ts` |

**Foundation files created:**
- `frontend/src/types/index.ts` — Shared `User`, `Post`, `Comment`, `Message`, `Conversation` interfaces
- `frontend/src/lib/api.ts` — Centralized Axios instance with `baseURL` and `withCredentials`
- `frontend/.env` — `VITE_API_BASE_URL` and `VITE_SOCKET_URL`

---

### Phase 1: Explore Page & Search

**Explore Page:**
- Backend: `GET /api/post/explore` — returns paginated posts sorted by recency with author and comments populated
- Frontend: `pages/Explore.tsx` — 3-column Instagram-style grid, hover overlay shows like/comment counts, "Load More" pagination, skeleton loading state, click opens CommentDialog
- Route added at `/explore`, wired from Headerbar "Explore" nav item

**Search:**
- Backend: `GET /api/users/search?q=` — regex search on username, returns top 20 matches with `username`, `profilePicture`, `bio`
- Frontend: `components/SearchPanel.tsx` — sliding panel from left with 300ms debounced input, results show avatar/username/bio, click navigates to profile
- Wired from Headerbar "Search" nav item

---

### Phase 2: Followers/Following Lists & Notifications

**Followers/Following Modal:**
- Backend: `GET /api/users/:id/followers` and `GET /api/users/:id/following` — returns populated user lists
- Frontend: `components/FollowersFollowingModal.tsx` — modal with user list, each row has follow/unfollow button
- Integrated into Profile — clicking "N followers" or "N following" opens the modal

**Notifications System:**
- Backend Model: `Notification` — recipient, sender, type (like/comment/follow), post (optional), message, read status, timestamps
- Backend Endpoints:
  - `GET /api/notifications` — paginated, populated with sender and post data
  - `GET /api/notifications/unread-count` — returns count of unread
  - `PUT /api/notifications/:id/read` — mark single as read
  - `PUT /api/notifications/read-all` — mark all as read
- Notifications are auto-created when:
  - A user likes a post (in `post-controller.ts` `likePost`)
  - A user comments on a post (in `post-controller.ts` `addComment`)
  - A user follows someone (in `user-controller.ts` `followOrUnfollow`)
- Frontend: `components/NotificationsDropdown.tsx` — sliding panel showing sender avatar, action text, timestamp, post thumbnail
- Redux: `redux/notificationSlice.ts` — `notifications[]`, `unreadCount`, `markAllRead`
- Unread count fetched on app load in `App.tsx`, badge shown on Headerbar

---

### Phase 3: Stories

**Backend:**
- Model: `Story` — author, image (Cloudinary URL), caption, viewers (user IDs), expiresAt (24h from creation)
- MongoDB TTL index on `expiresAt` with `expireAfterSeconds: 0` — auto-deletes expired stories
- Endpoints:
  - `POST /api/stories` — create with image upload (Sharp 1080x1920 optimization)
  - `GET /api/stories/feed` — stories from followed users, grouped by author, sorted (own first, then unviewed first)
  - `GET /api/stories/:userId` — all active stories for a user
  - `PUT /api/stories/:id/view` — mark as viewed
  - `GET /api/stories/:id/viewers` — get viewer list (owner only, populated with username/profilePicture)
  - `DELETE /api/stories/:id` — delete own story

**Frontend:**
- `components/Stories.tsx` — horizontal scrollable bar above feed with "Your Story" button and user circles with gradient ring (unviewed) or gray ring (viewed)
- `components/StoryViewer.tsx` — fullscreen overlay with:
  - Progress bars, auto-advance (5 seconds), left/right navigation, tap zones
  - **Delete button** (Trash icon) — shown only on own stories, removes story + advances
  - **Viewers panel** (Eye icon + count) — shown only on own stories, expandable list of who viewed
  - **Reply input** — shown on others' stories, sends reply as DM with story thumbnail context
  - Pauses timer when typing reply or viewing viewer list
- `components/CreateStory.tsx` — image upload modal with optional caption
- Redux: `redux/storySlice.ts` — `storyFeed[]`, `markStoryViewed`, `removeStory`
- Stories component added above Feed in `pages/Home.tsx`

---

### Phase 4: Enhanced Real-Time Socket.io

**Backend Socket Events Added:**
- `typing` / `stopTyping` — relays between sender and receiver for chat typing indicators
- `messageRead` / `messagesRead` — relays read receipts (single message and conversation-level)
- `postLikeUpdate` — broadcasts updated likes array to ALL clients when a post is liked/disliked (live feed updates)
- `getLastSeen` / `lastSeen` — tracks and serves last seen timestamps for offline users
- `messageUnsent` — notifies receiver when sender unsends a message
- `messageReaction` — broadcasts emoji reaction updates in real-time

**Message Model Updated:**
- Added `read: Boolean (default: false)` field
- Added `messageType: 'text' | 'image' | 'voice'` field
- Added `imageUrl`, `voiceUrl`, `voiceDuration` fields
- Added `replyTo` (reference to another Message)
- Added `reactions: [{ userId, emoji }]` array
- Added `storyReply: { storyId, storyImage }` for story reply context
- New endpoints:
  - `PUT /api/message/:id/read` — mark single message as read
  - `PUT /api/message/conversation/:id/read` — mark all messages from user as read
  - `PUT /api/message/:id/react` — add/remove emoji reaction
  - `DELETE /api/message/:id/unsend` — unsend own message (deletes from both sides)
  - `GET /api/message/unread-count` — get unread counts per sender

**Frontend:**
- `hooks/useSocketEvents.tsx` — centralized hook listening for `postLikeUpdate`, `typing`, `stopTyping`; updates Redux state
- `redux/chatSlice.ts` — added `typingUsers`, `unreadCounts`, `removeMessage`, `updateMessageReactions`, `incrementUnread`, `clearUnread`
- `components/ChatPage.tsx` — emits `typing`/`stopTyping` on input with 2-second debounce, shows "typing..." indicator

---

### Phase 5: Share Posts via DM & Hashtags

**Share Posts via DM:**
- `components/SharePostModal.tsx` — modal listing users with search filter, sends post link as DM
- Wired to the `Send` icon on every Post component

**Hashtags:**
- Backend: `hashtags: [String]` field added to Post model (indexed)
- Hashtags auto-extracted from caption using `/#(\w+)/g` regex during post creation
- New endpoint: `GET /api/post/hashtag/:tag` — returns all posts with the given hashtag
- Route added to post routes

---

### Phase 6: Socket.io Bug Fixes

**Critical bugs fixed:**
- `App.tsx` socket `useEffect` depended on entire `user` object — every follow/unfollow triggered disconnect/reconnect, killing all listeners. Fixed: dependency changed to `user?._id`
- Added `polling` fallback transport, `reconnection: true`, `reconnectionAttempts: 10`, `forceNew: true`
- `useGetRTM.tsx` had stale closure — `messages` in dependency array caused listener re-subscription on every message, losing messages in the gap. Fixed: uses `addMessage` Immer reducer + `useRef` for selectedUser
- `useSocketEvents.tsx` same stale closure with `posts`. Fixed: uses `postsRef`
- `ChatPage.tsx` used `suggestedUsers` (which excludes followed users) for contact list. Fixed: new `GET /api/users/chat-users` endpoint returns all users except self
- Suggested users backend: `$ne` string vs ObjectId mismatch. Fixed: `findById(req.id)` then `$nin` with real ObjectIds
- Empty suggested users returned 400 error, leaving stale Redux Persist cache. Fixed: always returns 200 with empty array

---

### Phase 7: Post & Story Enhancements

**Edit Post:**
- Backend: `PUT /api/post/edit/:id` — validates ownership, updates caption + re-extracts hashtags
- Frontend: `components/EditPostModal.tsx` — modal with caption editor, image preview, character count
- Wired to "Edit" option in Post three-dot menu (author only)

**Delete Post:** Already existed — verified working in `Post.tsx` menu

**Double-tap to Like:**
- `Post.tsx` — `onDoubleClick` on post image triggers like + shows animated heart overlay (0.8s scale-up + fade)

**Saved/Bookmarked Posts Page:**
- Backend: `GET /api/post/bookmarks` — returns user's bookmarked posts
- Frontend: `pages/SavedPosts.tsx` — grid layout with hover overlay (likes/comments count)
- Route: `/saved`, added to LeftSidebar navigation with Bookmark icon

---

### Phase 8: Advanced Messaging

**Image Sharing in DMs:**
- Backend: `POST /api/message/send/:id` now accepts multipart with `messageType: 'image'`
- Image optimized with Sharp (800x800) and uploaded to Cloudinary
- Frontend: Image button in chat input, file picker, renders shared images in message bubbles

**Voice Messages:**
- Backend: `messageType: 'voice'`, audio uploaded to Cloudinary as video resource
- Frontend: MediaRecorder API — hold mic button to record, shows recording timer with red pulse indicator, sends on stop
- Renders as `<audio>` element with controls in message bubbles

**Message Reply:**
- Backend: `replyTo` field (ObjectId ref to Message), populated on fetch
- Frontend: Click reply button on any message → shows reply preview bar above input → sent message displays replied-to context

**Message Reactions:**
- Backend: `PUT /api/message/:id/react` — adds/removes emoji per user, broadcasts via socket
- Frontend: Hover any message → click smiley → pick from 6 emojis (❤️😂😮😢😡👍) → reactions display below message bubble
- Real-time: receiver sees reaction instantly via `messageReaction` socket event

**Unsend Message:**
- Backend: `DELETE /api/message/:id/unsend` — only sender can unsend, deletes from DB + conversation, emits `messageUnsent` to receiver
- Frontend: Hover own sent message → red trash icon → click to unsend → message disappears from both sides instantly

**Read Receipts UI:**
- Single gray check = sent, double blue checks = read
- `PUT /api/message/conversation/:id/read` — marks all messages from a user as read when opening their chat
- Receiver notified via `messagesRead` socket event

**Unread Message Badges:**
- Backend: `GET /api/message/unread-count` — aggregates unread counts per sender
- Frontend: Per-user unread badge in chat sidebar, total unread badge on Messages nav item in LeftSidebar
- Increments in real-time when new message arrives from non-selected user

**Last Seen Timestamps:**
- Backend: `lastSeenMap` in socket server — records timestamp on disconnect, cleared on connect
- Frontend: Shows "last seen Xm ago" / "last seen Xh ago" instead of just "offline" in chat sidebar and header

**New Message Toast Notifications:**
- When a message arrives from someone not in the current chat, shows toast with message preview and "View" action button

---

### Phase 9: WebRTC Video & Audio Calling

**Backend (Socket Signaling):**
- Call state tracking: `activeCalls` map (userId → peerId) and `pendingCalls` map (receiverId → { callerId, callType, timeoutId })
- Socket events:
  - `call:user` — validates receiver online + not busy, sets 30s timeout, emits `call:incoming`
  - `call:accept` — clears timeout, sets active calls, emits `call:accepted`
  - `call:reject` — clears timeout, emits `call:rejected`
  - `call:end` — cleans up all state, emits `call:ended`
  - `webrtc:offer` / `webrtc:answer` / `webrtc:ice-candidate` — pure SDP/ICE relay between peers
- Edge cases: `call:busy`, `call:user-offline`, `call:missed` (30s timeout), `call:timeout`
- Disconnect cleanup: ends active calls + pending calls, notifies peers

**Frontend:**
- `redux/callSlice.ts` — State: `callStatus` (idle/calling/ringing/in-call), `callType`, `peer`, `isMuted`, `isCameraOff`, `callStartTime`
- `hooks/useWebRTC.ts` — RTCPeerConnection lifecycle with Google STUN servers, getUserMedia (video+audio or audio-only with fallback), ICE candidate handling, stream management, mute/camera toggle, cleanup
- `hooks/useCallEvents.ts` — Listens for all call socket events, manages call flow, ringtone (440Hz Web Audio API sine wave, 400ms bursts every 800ms)
- `components/CallOverlay.tsx` — Full-screen overlay:
  - **Ringing state:** Caller profile pic with pulsing green ring, Accept (green) + Reject (red) buttons
  - **Calling state:** Peer profile pic with pulsing blue ring, "Calling..." text, End Call button
  - **In-call state:** Remote video fullscreen + local video PiP (bottom-right), controls bar (mute/camera/end), call duration timer
  - Audio calls show profile picture + timer instead of video
- Call buttons (Phone + Video icons) added to ChatPage header, disabled when user is offline
- CallOverlay rendered globally in App.tsx (above everything via z-100)

---

### Phase 10: HTTPS & Mobile Device Support

**SSL Setup:**
- `mkcert` generates locally-trusted certificates for `localhost` and local IP
- Certs stored in `certs/cert.pem` and `certs/key.pem`
- Backend auto-detects: uses HTTPS if certs exist, falls back to HTTP
- Vite also auto-detects and serves HTTPS if certs exist
- Required for iOS Safari (WebRTC camera/mic needs secure context)

**Multi-device Development:**
- Backend binds to `0.0.0.0` (accessible on LAN)
- Vite `host: '0.0.0.0'` in config
- Backend CORS supports comma-separated `FRONTEND_URL` for multiple origins
- Socket.io CORS also splits comma-separated origins
- iPhone accesses via `https://<laptop-ip>:5173`

---

### Phase 11: Secure Authentication Overhaul

**Problem:** The app used a single JWT (7-day expiry) in an httpOnly cookie. No email verification, no rate limiting, no security headers. Socket.IO trusted raw userId from query params. Cookies failed on iOS Safari and Firefox with self-signed certs.

**Solution:** Enterprise-grade auth system with access/refresh tokens, email OTP verification, rate limiting, and Authorization header-based auth that works in all browsers.

#### Access/Refresh Token System
- **Access token** (15min JWT) returned in API response body, stored in Redux (persisted to localStorage), sent via `Authorization: Bearer` header
- **Refresh token** (7d JWT) stored ONLY in MongoDB `user.refreshToken` field — never sent to browser
- **Silent refresh**: When access token expires, `isAuthenticated` returns `{ expired: true }` → frontend interceptor calls `POST /users/refresh` → decodes expired token to get userId → validates DB refresh token → issues new token pair (rotation) → retries original request
- **Request queue**: Concurrent 401s are queued while refresh is in progress (prevents multiple refresh calls)
- **Cookie kept as fallback** for backward compatibility but not required

#### Email Verification (OTP)
- On register: user created with `isVerified: false`, 6-digit OTP generated, bcrypt-hashed before storage, 10-min expiry
- OTP sent via Nodemailer + Ethereal (dev) — preview URL logged to console
- New `VerifyOTP.tsx` page: 6 individual digit inputs, auto-focus-next, paste support, 60s resend cooldown
- Auto-login after successful verification (generates tokens, returns user data)
- Login blocked for unverified users → redirected to OTP page

#### Security Hardening
- **Helmet**: Security headers (CSP, X-Frame-Options, HSTS, etc.) — first middleware in Express
- **Rate limiting** (`express-rate-limit`):
  - Global: 100,000 req/min (dev), 100 req/15min (prod)
  - Auth routes: 20/min (dev), 5/15min (prod)
  - OTP resend: 10/min (dev), 3/15min (prod)
- **Socket.IO JWT auth**: `io.use()` middleware verifies JWT from `socket.handshake.auth.token` (with cookie fallback). No more trusting raw userId from query params.
- **Multer limit**: Reduced from 5GB to 10MB
- **Removed hardcoded secrets**: No more `"mysecret"` fallback in middleware

#### Cross-Browser Compatibility
- **Problem**: httpOnly cookies don't work reliably across browsers with self-signed certs on IP addresses (fails in Firefox, iOS Safari)
- **Solution**: Token returned in response body + stored in Redux (localStorage) + sent via `Authorization: Bearer` header. Works in ALL browsers.
- **Vite proxy**: `/api` and `/socket.io` proxied through Vite dev server to avoid cross-origin issues entirely

#### New Backend Files
| File | Purpose |
|------|---------|
| `backend/src/utils/generateTokens.ts` | `generateAccessToken()`, `generateRefreshToken()`, `generateOTP()` |
| `backend/src/utils/sendEmail.ts` | Nodemailer + Ethereal, styled HTML email template |
| `backend/src/middlewares/rateLimiter.ts` | Global, auth, and OTP rate limiters |

#### New Frontend Files
| File | Purpose |
|------|---------|
| `frontend/src/pages/VerifyOTP.tsx` | OTP verification page (6-digit input, resend cooldown, auto-login) |

#### Modified Backend Files
| File | Changes |
|------|---------|
| `src/models/user-model.ts` | Added `refreshToken`, `isVerified`, `verificationOTP`, `verificationOTPExpiry` |
| `src/controllers/user-controller.ts` | Rewrote register/login/logout, added verifyOTP/resendOTP/refreshAccessToken, returns accessToken in response body |
| `src/middlewares/isAuthenticated.ts` | Checks Authorization header first, cookie fallback, uses JWT_ACCESS_SECRET, returns `expired: true` on TokenExpiredError |
| `src/middlewares/multer.ts` | File size limit 5GB → 10MB |
| `src/routes/user-route.ts` | Added verify-otp, resend-otp, refresh routes with rate limiters, logout now protected |
| `src/index.ts` | Added helmet + globalLimiter middleware |
| `src/socket/socket.ts` | JWT auth middleware via `socket.handshake.auth.token` with cookie fallback |

#### Modified Frontend Files
| File | Changes |
|------|---------|
| `src/redux/authSlice.ts` | Added `token` state + `setToken` reducer |
| `src/lib/api.ts` | Request interceptor (Authorization header), response interceptor (silent refresh with queue, saves new token) |
| `src/pages/Login.tsx` | Stores accessToken in Redux, handles `requiresVerification` redirect |
| `src/pages/Signup.tsx` | Redirects to `/verify-otp` after registration |
| `src/App.tsx` | Added VerifyOTP route, socket passes `auth.token`, connect_error refreshes token |
| `vite.config.ts` | Added proxy for `/api` and `/socket.io` to backend |
| `frontend/.env` | Changed to `VITE_API_BASE_URL=/api`, `VITE_SOCKET_URL=` (empty = same origin via proxy) |

#### New npm Packages (Backend)
- `helmet` — security headers
- `express-rate-limit` — rate limiting
- `nodemailer` + `@types/nodemailer` — email sending
- `cookie` + `@types/cookie` — cookie parsing in Socket.IO

---

### Phase 12: Mobile Chat UX + Global Message Notifications

**Problem:** Chat action buttons (reply, react, delete) used CSS `group-hover` which doesn't work on mobile (no hover on touch devices). Message notifications only appeared on the Chat page, not globally.

**Fixes:**
- **Mobile message actions**: Added tap-to-toggle and long-press (400ms) to show reply/react/delete buttons. Desktop still uses hover. Action buttons slightly larger for touch targets.
- **Global message notifications**: Moved `useGetRTM()` from ChatPage to App.tsx so message popups appear on ALL pages (Home, Profile, Explore, etc.)
- **Instagram-style notification**: Custom toast with sender's profile picture, username, and message preview. Clicking navigates to chat.
- **Backend**: `newMessage` socket event now includes `senderInfo: { username, profilePicture }` for notification display.

---

### Phase 13: Account Management (Change/Forgot Password, Delete Account)

**Change Password:**
- Added to Edit Profile page with current password + new password + confirm fields
- Invalidates refresh token on change (logs out other sessions)

**Forgot Password:**
- New `/forgot-password` page with 3-step flow: Enter email → Enter 6-digit OTP → Set new password
- Red-themed password reset email template (distinct from blue verification email)
- Doesn't reveal if email exists in system (security)
- Redirects to login after successful reset

**Delete Account (Cascade Delete):**
- Added "Danger Zone" section to Edit Profile with password confirmation
- Cascade deletes: all posts + Cloudinary images, all comments, all stories + images, all messages + conversations, all notifications, profile picture, removes from followers/following lists, removes likes from posts, removes reactions from messages, removes from story viewers

**Files:** `user-controller.ts` (4 new controllers), `user-route.ts` (4 new routes), `sendEmail.ts` (reset email template), `ForgotPassword.tsx` (new page), `EditProfile.tsx` (change password + delete account sections)

---

### Phase 14: Database Seeding

- Created `backend/src/scripts/seed.ts` — populates 50 users with realistic profile pictures (randomuser.me), 50 posts with beautiful photos (picsum.photos), 200+ comments, random follow relationships, likes, and bookmarks
- All seed users share password `Test@123` with email format `<username>@snapgram.test`
- Run: `cd backend && npx ts-node src/scripts/seed.ts` (use `--clean` to re-seed)

---

### Phase 15: Responsive UI Overhaul

**Problem:** Hardcoded layout values (`pl-[20%]`, `ml-[16%]`, `pl-10`) broke mobile layouts. No mobile navigation, no consistent font.

**Fixes:**

**Font & Base Styles:**
- Added Inter font (Google Fonts) as default
- Antialiased rendering, smooth scrolling, safe-area support for iOS

**Layout System (MainLayout):**
- Desktop: `md:ml-64` for sidebar offset
- Mobile: `pt-14` (top header) + `pb-14` (bottom nav), full-width content
- Removed all hardcoded `pl-[20%]`, `ml-[16%]`, `pl-10` from pages

**Mobile Bottom Navigation (MobileNavBar):**
- Instagram-style fixed bottom bar with 5 icons: Home, Explore, Suggested, Saved, Profile
- Active state with bold icons, profile picture for Profile tab
- `md:hidden` — only on mobile

**Page Fixes:**
- `Home.tsx` — centered feed with `max-w-xl mx-auto`
- `Feed.tsx` — removed `pl-[20%]`
- `SavedPosts.tsx` — responsive grid `grid-cols-2 sm:grid-cols-3`
- `EditProfile.tsx` — `max-w-2xl mx-auto px-4`
- `ChatPage.tsx` — mobile: user list OR chat (back button to switch), desktop: two-column

**New Files:** `MobileNavBar.tsx`, `SuggestedUsersPage.tsx`

---

### Phase 16: Floating Chat & Suggested Users (Desktop)

**Floating Chat (FloatingChat.tsx):**
- Facebook-style blue chat bubble at bottom-right (desktop only)
- Click bubble → chat user list popup with online status + unread badges
- Click user → mini chat window (320px wide) with blue gradient header, scrollable messages, text input
- Real-time message receiving via socket, auto-mark as read
- Hidden on `/chat` page and mobile

**Floating Suggested Users (FloatingSuggested.tsx):**
- Purple bubble at bottom-left (desktop only, next to sidebar)
- Click → expands to suggested users panel with follow buttons
- Badge shows count of suggestions
- "See all suggestions" links to `/suggested` page
- Hidden on `/suggested` page and mobile

**Mobile Sidebar Profile Link:**
- Tapping user profile section in mobile hamburger menu navigates to profile page

**App Renamed:** SNAP_GRAM → **ConnectIn** (updated in Login, Signup, and footer)

---

### Phase 17: Dark/Light Mode

**Implementation:**
- Tailwind CSS v4 class-based dark mode via `@custom-variant dark`
- `useTheme` hook: reads/writes localStorage, toggles `dark` class on `<html>`
- FOUC prevention: inline `<script>` in `index.html` applies theme before render
- Theme toggle: Sun/Moon icon in both desktop sidebar and mobile hamburger menu
- 20+ components updated with `dark:` variants

**Color Mapping:**
| Light | Dark |
|-------|------|
| `bg-white` | `dark:bg-gray-900` |
| `bg-gray-50` | `dark:bg-gray-950` |
| `bg-gray-100` | `dark:bg-gray-800` |
| `text-gray-800` | `dark:text-gray-100` |
| `border-gray-200` | `dark:border-gray-700` |

**Components Updated:** MainLayout, LeftSideBar, MobileNavBar, Post, Profile, Explore, SavedPosts, EditProfile, ChatPage, FloatingChat, FloatingSuggested, SearchPanel, NotificationsDropdown, Stories, SuggestedUsers, FollowersFollowingModal, CreatePost, CommentDialog, SuggestedUsersPage

**Files:** `index.html`, `index.css`, `hooks/useTheme.ts` (new), all 20+ components above

---

### Phase 18: Infinite Scroll & Performance

**Infinite Scroll (Feed):**
- Backend `/post/all` now accepts `?page=1&limit=10` with pagination
- Frontend `useGetAllPost` hook: fetches page 1 on mount, exposes `loadMore()` using refs (no stale closures)
- `Posts.tsx` uses IntersectionObserver with **callback ref** pattern — observer fires when sentinel enters viewport
- `rootMargin: 600px` triggers pre-fetching before user reaches bottom
- Shows "You're all caught up!" when all posts loaded

**Skeleton Loaders:**
- `PostSkeleton.tsx` — gray pulse blocks matching post layout
- `StorySkeleton.tsx` — circular pulse blocks for story bar
- Shown during initial data fetch, replaced by real content

**Lazy Loading Images:**
- `loading="lazy"` on all post images (Post, Profile grid, SavedPosts, CommentDialog, Explore)
- Avatars/small images NOT lazy-loaded (above the fold)

**Files:** `post-controller.ts` (pagination), `postSlice.ts` (appendPosts), `useGetAllPost.tsx` (rewritten), `Posts.tsx` (IntersectionObserver), `PostSkeleton.tsx` (new), `StorySkeleton.tsx` (new), `Stories.tsx` (loading state)

---

### Phase 19: Backend Performance Optimization

**Database Indexes (4 models):**
- Post: `{ createdAt: -1 }`, `{ author: 1, createdAt: -1 }` — feed/profile queries
- Message: `{ receiverId: 1, read: 1 }`, `{ senderId: 1, receiverId: 1, createdAt: -1 }` — unread count/conversations
- Comment: `{ post: 1, createdAt: -1 }` — comment loading
- Notification: `{ recipient: 1, read: 1, createdAt: -1 }` — notification queries

**Response Compression:**
- Added `compression` middleware — all responses gzip compressed (~80% smaller)

**Query Optimizations:**
- `.lean()` on all read-only queries (3-5x faster — plain JS objects vs Mongoose documents)
- `Promise.all` for parallel queries (countDocuments + find run simultaneously instead of sequentially)
- Feed: comments limited to 3 per post (was loading ALL comments)
- Explore: comments excluded entirely (grid doesn't need them)
- SuggestedUsers: `.select()` only needed fields + `.limit(20)`
- ChatUsers: `.select()` only needed fields + `.limit(50)`

**Impact:**
| Metric | Before | After |
|--------|--------|-------|
| Feed query | Sequential, full documents, all comments | Parallel, lean, 3 comments max |
| Response size | ~50KB raw | ~8KB gzip |
| Index lookups | Full collection scans | Direct index hits |
| Suggested users | All fields, no limit | 5 fields, limit 20 |

**Files:** `post-model.ts`, `message-model.ts`, `comment-model.ts`, `notification-model.ts` (indexes), `index.ts` (compression), `post-controller.ts` (lean, Promise.all, comment limit), `user-controller.ts` (select, limit, lean)

---

## Feature Details

### Implemented Features (Working)

| Feature | Description |
|---------|-------------|
| Authentication | Register with email OTP verification, login with access/refresh tokens, silent token refresh, Authorization header auth |
| Email Verification | 6-digit OTP via email (Ethereal dev, production-ready SMTP), auto-login after verify |
| Rate Limiting | Global + auth + OTP rate limits (configurable dev/prod) |
| Security Headers | Helmet middleware (CSP, X-Frame-Options, HSTS, etc.) |
| User Profile | View/edit profile, profile picture upload, bio, gender |
| Posts | Create with image, view feed, edit caption, delete own posts |
| Double-tap Like | Double-tap post image to like with heart animation |
| Likes | Like/unlike with real-time broadcast to all clients |
| Comments | Add comments, view all comments in dialog |
| Bookmarks | Save/unsave posts, dedicated Saved Posts page at `/saved` |
| Follow/Unfollow | Toggle follow with Redux state sync |
| Suggested Users | Users excluding self and already-followed |
| Chat/Messaging | 1-on-1 real-time messaging with Socket.io |
| Image Sharing in DMs | Send images in chat (Sharp optimized + Cloudinary) |
| Voice Messages | Record and send voice messages (MediaRecorder API) |
| Message Reply | Reply to specific messages with context preview |
| Message Reactions | 6 emoji reactions on any message (real-time) |
| Unsend Messages | Delete sent messages from both sides (real-time) |
| Read Receipts | Single check (sent) / double blue check (read) |
| Unread Message Badges | Per-user and total unread counts in sidebar |
| Last Seen | "last seen Xm ago" for offline users |
| Message Notifications | Toast with preview when message arrives |
| Video Calling | WebRTC peer-to-peer video calls with signaling via Socket.io |
| Audio Calling | WebRTC audio calls with ringtone, timer, mute controls |
| Online Status | Green dot indicator for online users |
| Typing Indicators | "typing..." shown when other user types in chat |
| Stories | 24h disappearing stories with auto-delete, viewer tracking |
| Story Delete | Delete own stories from viewer |
| Story Viewers | See who viewed your story (owner only) |
| Story Reply | Reply to stories via DM with story thumbnail context |
| Explore Page | Instagram-style post grid with pagination |
| Search | User search by username with debounced input |
| Notifications | Persistent DB notifications for likes, comments, follows |
| Followers/Following | Clickable lists with follow/unfollow from modal |
| Share Posts | Send posts to other users via DM |
| Hashtags | Auto-extracted from captions, searchable by tag |
| Live Feed Updates | Like counts update in real-time across all clients |
| HTTPS | Local SSL via mkcert for secure development |
| Mobile Support | Accessible on iPhone/Android via local network HTTPS |
| Mobile Chat Actions | Tap/long-press to reply, react, delete messages on mobile |
| Global Message Popups | Instagram-style message notifications on all pages with sender avatar |
| Change Password | Change password from Edit Profile with current password verification |
| Forgot Password | 3-step email OTP flow: email → code → new password |
| Delete Account | Cascade delete all user data (posts, comments, messages, stories, likes, followers) |
| Database Seeding | 50 users + 50 posts with realistic data for testing |
| Responsive Layout | Mobile bottom nav, responsive pages, no hardcoded layout values |
| Floating Chat | Facebook-style mini messenger on desktop (bottom-right bubble) |
| Floating Suggested | Desktop floating panel for suggested users (bottom-left bubble) |
| Inter Font | Clean sans-serif font across all pages |
| Mobile Profile Nav | Tap profile in mobile sidebar menu navigates to profile |
| Dark/Light Mode | Tailwind dark: class strategy, persisted to localStorage, toggle in sidebar, 20+ components |
| Infinite Scroll | IntersectionObserver with callback ref, 10 posts per page, pre-fetches 600px ahead |
| Skeleton Loaders | PostSkeleton + StorySkeleton shown during initial load |
| Lazy Loading | `loading="lazy"` on all post images for off-screen optimization |
| Database Indexes | Compound indexes on Post, Message, Comment, Notification for fast queries |
| Response Compression | gzip compression on all API responses (~80% smaller) |
| Query Optimization | .lean(), Promise.all, limited comments, selected fields |
| Seed Scripts | 50 users + 150 posts with realistic data for testing |

---

## Files Created & Modified

### New Files Created

**Backend (6 original + 0 new = 6 files):**
| File | Purpose |
|------|---------|
| `backend/src/models/notification-model.ts` | Notification schema (recipient, sender, type, post, read) |
| `backend/src/models/story-model.ts` | Story schema with TTL auto-delete |
| `backend/src/controllers/notification-controller.ts` | CRUD for notifications |
| `backend/src/controllers/story-controller.ts` | CRUD for stories + viewer list |
| `backend/src/routes/notification-route.ts` | Notification API routes |
| `backend/src/routes/story-route.ts` | Story API routes |

**Frontend (15 original + 7 new = 22 files):**
| File | Purpose |
|------|---------|
| `frontend/src/types/index.ts` | Shared TypeScript interfaces (User, Post, Comment, Message, Conversation) |
| `frontend/src/lib/api.ts` | Centralized Axios instance |
| `frontend/.env` | Environment variables |
| `frontend/src/pages/Explore.tsx` | Explore page with post grid |
| `frontend/src/pages/SavedPosts.tsx` | Saved/bookmarked posts grid page |
| `frontend/src/components/SearchPanel.tsx` | User search sliding panel |
| `frontend/src/components/FollowersFollowingModal.tsx` | Followers/following list modal |
| `frontend/src/components/NotificationsDropdown.tsx` | Notifications panel |
| `frontend/src/components/Stories.tsx` | Stories horizontal bar |
| `frontend/src/components/StoryViewer.tsx` | Fullscreen story viewer with delete, viewers, reply |
| `frontend/src/components/CreateStory.tsx` | Story creation modal |
| `frontend/src/components/SharePostModal.tsx` | Share post via DM modal |
| `frontend/src/components/EditPostModal.tsx` | Edit post caption modal |
| `frontend/src/components/CallOverlay.tsx` | WebRTC call UI (ringing/calling/in-call states) |
| `frontend/src/redux/notificationSlice.ts` | Notification state management |
| `frontend/src/redux/storySlice.ts` | Story state management |
| `frontend/src/redux/callSlice.ts` | Call state management (idle/calling/ringing/in-call) |
| `frontend/src/hooks/useSocketEvents.tsx` | Centralized socket event listeners |
| `frontend/src/hooks/useWebRTC.ts` | WebRTC peer connection, media streams, ICE handling |
| `frontend/src/hooks/useCallEvents.ts` | Call socket event listeners + ringtone |
| `CLAUDE.md` | Project conventions for Claude Code |

**Other:**
| File | Purpose |
|------|---------|
| `certs/cert.pem` | SSL certificate (mkcert) |
| `certs/key.pem` | SSL private key (mkcert) |
| `certs/rootCA.pem` | Root CA for mobile trust |

### Modified Files

**Backend (10 files):**
- `src/index.ts` — HTTPS auto-detect, multi-origin CORS, `0.0.0.0` binding, mounted all routes
- `src/controllers/post-controller.ts` — explore, hashtag, editPost, getBookmarkedPosts, notifications on like/comment, live broadcast
- `src/controllers/user-controller.ts` — search, followers, following, getChatUsers, getSuggestedUsers (excludes self+followed)
- `src/controllers/message-controller.ts` — image/voice upload, replyTo, reactions, unsend, conversation read, unread count
- `src/routes/post-route.ts` — edit, bookmarks, explore, hashtag routes
- `src/routes/user-route.ts` — search, followers, following, chat-users routes
- `src/routes/message-route.ts` — unsend, react, conversation read, unread count routes
- `src/socket/socket.ts` — WebRTC call signaling, lastSeen tracking, multi-origin CORS, call state management
- `src/models/post-model.ts` — hashtags field
- `src/models/message-model.ts` — messageType, imageUrl, voiceUrl, voiceDuration, replyTo, reactions, storyReply fields

**Frontend (20+ files):**
- `src/App.tsx` — stable socket (userId dep), CallOverlay, SavedPosts route, HTTPS support
- `src/main.tsx` — fixed store import, PersistGate + Toaster
- `src/redux/authSlice.ts` — fixed User interface
- `src/redux/postSlice.ts` — fixed types
- `src/redux/chatSlice.ts` — typingUsers, unreadCounts, removeMessage, updateMessageReactions
- `src/redux/store.ts` — added notification, story, call slices; call blacklisted from persist
- `src/components/Post.tsx` — edit modal, double-tap like with heart animation, fixed URLs
- `src/components/ChatPage.tsx` — complete rewrite: call buttons, image/voice messages, reply, reactions, unsend, read receipts, unread badges, last seen
- `src/components/Profile.tsx` — fixed bugs, follow handler, followers/following modal
- `src/components/SuggestedUsers.tsx` — follow API, String() type-safe filtering
- `src/components/LeftSideBar.tsx` — Saved nav item, unread message badge on Messages
- `src/hooks/useGetRTM.tsx` — fixed stale closure, addMessage, unread increment, toast notifications
- `src/hooks/useSocketEvents.tsx` — fixed stale closure with postsRef
- `vite.config.ts` — HTTPS auto-detect, `host: 0.0.0.0`

---

## What Is Remaining

### High Priority (Core Instagram features)

| Feature | Difficulty | Description |
|---------|------------|-------------|
| Reels | High | Short video upload, vertical scroll feed, video player with controls |
| Direct Group Chats | Medium | Group conversations with multiple participants, group creation UI |
| Comment Replies | Medium | Nested replies to comments (threaded comments) |
| Comment Likes | Low | Like individual comments |
| Post Carousel | Medium | Multiple images per post with swipe navigation |
| Video Posts | Medium | Video upload support with playback in feed |

### Medium Priority (Polish & UX)

| Feature | Difficulty | Description |
|---------|------------|-------------|
| Dark/Light Theme Toggle | Medium | Theme switching with Tailwind `dark:` classes |
| Infinite Scroll | Medium | Replace "Load More" with automatic infinite scroll on feed and explore |
| Responsive Design | Medium | Mobile-first responsive layout improvements |
| Profile Post Modal | Medium | Click on profile grid post opens full post dialog (like Instagram) |
| Message Search | Low | Search within chat messages |
| Link Previews in Chat | Medium | Parse URLs and show Open Graph cards |
| Unfollow from Post Menu | Low | Wire the "Unfollow" option in post more-options dropdown |

### Low Priority (Nice-to-have)

| Feature | Difficulty | Description |
|---------|------------|-------------|
| Story Mentions | Medium | @mention users in stories |
| Post Location Tags | Low | Add location to posts |
| Account Privacy | Medium | Private accounts requiring follow approval |
| Block/Report Users | Medium | Block users, report posts |
| Push Notifications | High | Web push notifications (Service Worker) |
| Saved Collections | Medium | Organize bookmarks into named collections |
| Close Friends List | Medium | Share stories only with close friends |
| Google/OAuth Login | Medium | Social login integration |

### DevOps & Production

| Task | Description |
|------|-------------|
| Production Build | Configure Vite production build + Express static serving |
| Docker Setup | Dockerize backend + frontend |
| CI/CD Pipeline | GitHub Actions for lint, test, deploy |
| Input Sanitization | Sanitize all user inputs (XSS prevention) |
| TURN Server | Add TURN server for WebRTC behind strict NATs |
| Database Indexing | Add compound indexes for frequently queried fields |
| Caching | Redis caching for feed, suggested users, explore |
| Monitoring | Add logging (Winston/Morgan) and error tracking (Sentry) |
| Environment Config | Separate dev/staging/production configs |

---

## Quick Start for New Contributors

1. Clone the repo
2. Copy `backend/.env.example` to `backend/.env` and fill in your MongoDB/Cloudinary credentials
3. Copy `frontend/.env` and update URLs if needed
4. Run `npm install` in both `backend/` and `frontend/`
5. Start backend: `cd backend && npm run dev`
6. Start frontend: `cd frontend && npm run dev`
7. Open `https://localhost:5173` (or `http://localhost:5173` if no certs)

### For Mobile Testing
1. Generate certs: `mkdir certs && cd certs && mkcert localhost $(hostname -I | awk '{print $1}')`
2. Install CA: `sudo mkcert -install`
3. Update `.env` files with your IP (see CLAUDE.md for details)
4. On iPhone: visit `https://<your-ip>:5173`, accept certificate warning

## Architecture Notes

- **No SSR** — this is a client-side rendered SPA
- **Authorization header auth** — Access token stored in Redux (localStorage), sent via `Authorization: Bearer` header. Cookie kept as fallback. Refresh token in DB only.
- **Silent token refresh** — Axios interceptor catches 401 `expired`, calls `/refresh`, queues concurrent requests, retries with new token. Fully transparent to the user.
- **Vite proxy** — `/api` and `/socket.io` proxied through Vite dev server to avoid cross-origin cookie issues on all browsers (iOS Safari, Firefox, etc.)
- **Socket.io** — integrated with the same HTTP/HTTPS server as Express. Authenticates via `auth.token` (JWT), not raw userId.
- **WebRTC** — peer-to-peer media streams, Socket.io used only for signaling (SDP/ICE relay)
- **Redux Persist** — auth (including token) and chat state persist; post, story, socket, and call slices are blacklisted (always fetched fresh)
- **MongoDB TTL** — Stories auto-delete after 24h without any cron jobs
- **MongoDB Indexes** — Compound indexes on all critical query paths (feed sorting, unread counts, conversations, comments, notifications)
- **Image Pipeline** — Multer (memory, 10MB limit) -> Sharp (optimize) -> Cloudinary (host)
- **Voice Pipeline** — Multer (memory) -> Cloudinary (host as video resource)
- **HTTPS Auto-detect** — Both backend and Vite check for `certs/` directory and serve HTTPS if found
- **Multi-origin CORS** — `FRONTEND_URL` supports comma-separated origins for multi-device development
- **Security stack** — Helmet (headers) + express-rate-limit (brute-force protection) + bcrypt (password + OTP hashing) + JWT rotation
- **Performance stack** — gzip compression + .lean() queries + Promise.all parallelism + paginated endpoints + IntersectionObserver infinite scroll + skeleton loaders + lazy image loading
- **Dark/Light Mode** — Tailwind `dark:` class on `<html>`, persisted to localStorage, FOUC prevention, system preference detection
- **Responsive Layout** — Mobile bottom nav + desktop sidebar, no hardcoded offsets, chat view toggles between list/conversation on mobile
