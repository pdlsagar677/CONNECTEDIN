# ConnectIn - Instagram Clone

A full-featured Instagram clone built with the MERN stack (MongoDB, Express, React, Node.js) using TypeScript.

## Features

- User authentication (JWT access/refresh tokens + email OTP verification)
- Create, edit, delete posts with image uploads
- Like, comment, bookmark posts
- Follow/unfollow users
- Real-time chat with text, image, and voice messages
- Message reactions, read receipts, typing indicators
- Video and audio calling (WebRTC)
- Stories (24hr auto-expiry)
- Real-time notifications
- Explore page with infinite scroll
- User search
- Dark/Light mode
- Fully responsive (mobile + desktop)

## Tech Stack

### Backend
- Node.js + TypeScript
- Express 5
- MongoDB Atlas (Mongoose 8)
- Socket.IO 4 (real-time)
- JWT authentication (access + refresh tokens)
- Cloudinary (image storage)
- Sharp (image optimization)
- Nodemailer (email OTP)
- Helmet + Rate Limiting (security)

### Frontend
- React 19 + TypeScript
- Vite
- Redux Toolkit + Redux Persist
- React Router 7
- Tailwind CSS v4
- Radix UI
- Axios
- Socket.IO Client
- WebRTC (video/audio calls)

## Prerequisites

- Node.js (v18 or higher)
- npm
- MongoDB Atlas account (free tier works)
- Cloudinary account (free tier works)

## Installation

### 1. Clone the repository

```bash
git clone <repository-url>
cd connectedin 
```

### 2. Backend setup

```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` directory:

```env
# Database
MONGO_URI=your_mongodb_connection_string

# Server
PORT=5000
SECRET_KEY=your_secret_key
NODE_ENV=development

# Cloudinary (https://cloudinary.com)
CLOUD_NAME=your_cloudinary_cloud_name
API_KEY=your_cloudinary_api_key
API_SECRET=your_cloudinary_api_secret

# CORS
FRONTEND_URL=https://localhost:5173

# JWT Secrets (generate random 64-char strings)
JWT_ACCESS_SECRET=your_jwt_access_secret
JWT_REFRESH_SECRET=your_jwt_refresh_secret

# Email - Ethereal for dev (https://ethereal.email)
SMTP_HOST=smtp.ethereal.email
SMTP_PORT=587
SMTP_USER=your_ethereal_username
SMTP_PASS=your_ethereal_password
EMAIL_FROM=noreply@connectin.dev
```

Start the backend:

```bash
npm run dev
```

### 3. Frontend setup

```bash
cd frontend
npm install
```

Create a `.env` file in the `frontend/` directory:

```env
VITE_API_BASE_URL=/api
VITE_SOCKET_URL=
```

Start the frontend:

```bash
npm run dev
```

### 4. Open the app

Visit `https://localhost:5173` in your browser.

## Seed Test Data (Optional)

Populate the database with sample users and posts:

```bash
cd backend
npx ts-node src/scripts/seed.ts          # 50 users + 50 posts + comments + follows + likes
npx ts-node src/scripts/seed-posts.ts    # 100 more posts from existing users
```

Seed user credentials: `<username>@snapgram.test` / `Test@123`

## SSL Certificates (Optional)

For local HTTPS (recommended for full functionality):

```bash
# Install mkcert
sudo apt install mkcert   # Linux
brew install mkcert        # macOS

# Generate certificates
mkdir certs && cd certs
mkcert localhost
```

## Remote Demo with ngrok

To share the app with someone remotely without deploying:

```bash
# Install ngrok (https://ngrok.com)
ngrok http 5173

# Add the ngrok URL to backend .env FRONTEND_URL for CORS:
# FRONTEND_URL=https://localhost:5173,https://your-url.ngrok-free.app

# Restart the backend, then share the ngrok URL
```

## Project Structure

```
Instagram_clone/
├── backend/
│   └── src/
│       ├── controllers/     # Route handlers
│       ├── models/          # Mongoose schemas
│       ├── routes/          # Express routes
│       ├── middlewares/     # Auth, Multer, Rate Limiter
│       ├── socket/          # Socket.IO + WebRTC signaling
│       ├── utils/           # DB, Cloudinary, tokens, email
│       ├── scripts/         # Database seed scripts
│       └── index.ts         # Entry point
├── frontend/
│   └── src/
│       ├── components/      # UI components
│       ├── pages/           # Page components
│       ├── hooks/           # Custom React hooks
│       ├── redux/           # Redux slices + store
│       ├── types/           # TypeScript interfaces
│       ├── lib/             # API client, utilities
│       └── App.tsx          # Root component
└── certs/                   # SSL certificates (optional)
```

## API Endpoints

### Users (`/api/users`)
- `POST /register` - Register new user
- `POST /login` - Login
- `GET /logout` - Logout
- `POST /verify-otp` - Verify email OTP
- `POST /resend-otp` - Resend OTP
- `POST /forgot-password` - Request password reset
- `POST /reset-password` - Reset password with OTP
- `GET /:id/profile` - Get user profile
- `POST /profile/edit` - Edit profile
- `GET /suggested` - Get suggested users
- `POST /followorunfollow/:id` - Follow/unfollow user
- `GET /search?q=` - Search users

### Posts (`/api/post`)
- `POST /addpost` - Create post
- `GET /all?page=1&limit=10` - Get feed (paginated)
- `GET /explore?page=1` - Explore posts (paginated)
- `GET /:id/like` - Like post
- `GET /:id/dislike` - Unlike post
- `POST /:id/comment` - Add comment
- `PUT /edit/:id` - Edit post
- `DELETE /delete/:id` - Delete post
- `GET /:id/bookmark` - Bookmark post

### Messages (`/api/message`)
- `POST /send/:id` - Send message (text/image/voice)
- `GET /all/:id` - Get conversation messages
- `DELETE /:id/unsend` - Unsend message
- `PUT /:id/react` - React to message

### Stories (`/api/stories`)
- `POST /` - Create story
- `GET /feed` - Get stories feed
- `DELETE /:id` - Delete story

### Notifications (`/api/notifications`)
- `GET /` - Get notifications
- `PUT /read-all` - Mark all as read
