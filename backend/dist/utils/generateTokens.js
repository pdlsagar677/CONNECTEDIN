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
exports.generateOTP = exports.generateRefreshToken = exports.generateAccessToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const crypto_1 = __importDefault(require("crypto"));
const generateAccessToken = (userId) => {
    const secret = process.env.JWT_ACCESS_SECRET;
    if (!secret)
        throw new Error('JWT_ACCESS_SECRET is not configured');
    return jsonwebtoken_1.default.sign({ userId }, secret, { expiresIn: '15m' });
};
exports.generateAccessToken = generateAccessToken;
const generateRefreshToken = (userId) => {
    const secret = process.env.JWT_REFRESH_SECRET;
    if (!secret)
        throw new Error('JWT_REFRESH_SECRET is not configured');
    return jsonwebtoken_1.default.sign({ userId }, secret, { expiresIn: '7d' });
};
exports.generateRefreshToken = generateRefreshToken;
const generateOTP = () => __awaiter(void 0, void 0, void 0, function* () {
    const otp = String(crypto_1.default.randomInt(100000, 999999));
    const hashedOTP = yield bcryptjs_1.default.hash(otp, 10);
    const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    return { otp, hashedOTP, expiry };
});
exports.generateOTP = generateOTP;
