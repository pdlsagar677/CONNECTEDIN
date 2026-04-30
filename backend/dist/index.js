"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.server = exports.app = void 0;
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const rateLimiter_1 = require("./middlewares/rateLimiter");
const http_1 = __importDefault(require("http"));
const path_1 = __importDefault(require("path"));
const db_1 = __importDefault(require("./utils/db"));
const user_route_1 = __importDefault(require("./routes/user-route"));
const post_route_1 = __importDefault(require("./routes/post-route"));
const message_route_1 = __importDefault(require("./routes/message-route"));
const notification_route_1 = __importDefault(require("./routes/notification-route"));
const story_route_1 = __importDefault(require("./routes/story-route"));
const socket_1 = require("./socket/socket");
dotenv_1.default.config();
const app = (0, express_1.default)();
exports.app = app;
const PORT = Number(process.env.PORT) || 5000;
// ---------- HTTP Server (hosting platforms like Render handle SSL at edge) ----------
const server = http_1.default.createServer(app);
exports.server = server;
// ---------- Initialize Socket.IO ----------
(0, socket_1.initSocket)(server);
// ---------- Middlewares ----------
app.use((0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            connectSrc: ["'self'", "wss:", "ws:"],
            imgSrc: ["'self'", "data:", "blob:", "https:"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            fontSrc: ["'self'", "data:"],
            mediaSrc: ["'self'", "blob:"],
        },
    },
}));
app.use((0, compression_1.default)());
const allowedOrigins = ((_a = process.env.FRONTEND_URL) === null || _a === void 0 ? void 0 : _a.split(',').map(s => s.trim())) || ['http://localhost:5173'];
app.use((0, cors_1.default)({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));
app.use((0, cookie_parser_1.default)());
app.use(express_1.default.json());
app.use(rateLimiter_1.globalLimiter);
// ---------- API Routes ----------
app.use('/api/users', user_route_1.default);
app.use('/api/post', post_route_1.default);
app.use('/api/message', message_route_1.default);
app.use('/api/notifications', notification_route_1.default);
app.use('/api/stories', story_route_1.default);
// ---------- Serve Frontend (production) ----------
const frontendDist = path_1.default.resolve(__dirname, '../../frontend/dist');
app.use(express_1.default.static(frontendDist));
app.get('{*path}', (req, res) => {
    res.sendFile(path_1.default.join(frontendDist, 'index.html'));
});
// ---------- Error Handler ----------
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Internal Server Error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
});
// ---------- Start Server ----------
const startServer = () => __awaiter(void 0, void 0, void 0, function* () {
    const isDbConnected = yield (0, db_1.default)();
    if (!isDbConnected) {
        console.error('Failed to connect to MongoDB');
        process.exit(1);
    }
    console.log('MongoDB connected successfully');
    server.listen(PORT, '0.0.0.0', () => {
        console.log(`Server (API + Socket.IO) running on http://0.0.0.0:${PORT}`);
    });
    process.on('unhandledRejection', (err) => {
        console.error('Unhandled Rejection:', err.message);
        server.close(() => process.exit(1));
    });
});
startServer();
