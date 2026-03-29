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
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const isAuthenticated = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Authorization header first (works in all browsers), cookie as fallback
        const authHeader = req.headers.authorization;
        const token = ((authHeader === null || authHeader === void 0 ? void 0 : authHeader.startsWith('Bearer ')) ? authHeader.slice(7) : null)
            || req.cookies.accessToken
            || req.cookies.token;
        if (!token) {
            return res.status(401).json({
                message: 'User not authenticated',
                success: false,
            });
        }
        const secret = process.env.JWT_ACCESS_SECRET;
        if (!secret) {
            console.error('JWT_ACCESS_SECRET is not configured');
            return res.status(500).json({
                message: 'Server configuration error',
                success: false,
            });
        }
        const decode = jsonwebtoken_1.default.verify(token, secret);
        if (!decode || !decode.userId) {
            return res.status(401).json({
                message: 'Invalid token',
                success: false,
            });
        }
        req.id = decode.userId;
        next();
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            // Signal frontend to refresh the token
            return res.status(401).json({
                message: 'Token expired',
                success: false,
                expired: true,
            });
        }
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            return res.status(401).json({
                message: 'Invalid token',
                success: false,
            });
        }
        return res.status(500).json({
            message: 'Authentication failed',
            success: false,
        });
    }
});
exports.default = isAuthenticated;
