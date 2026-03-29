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
exports.sendPasswordResetEmail = exports.sendVerificationEmail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const createTransport = () => {
    return nodemailer_1.default.createTransport({
        host: process.env.SMTP_HOST || 'smtp.ethereal.email',
        port: Number(process.env.SMTP_PORT) || 587,
        secure: false,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });
};
const sendVerificationEmail = (to, username, otp) => __awaiter(void 0, void 0, void 0, function* () {
    const transporter = createTransport();
    const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #2563eb, #3b82f6); padding: 32px 24px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">SNAP_GRAM</h1>
        <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 14px;">Verify your email address</p>
      </div>

      <!-- Body -->
      <div style="padding: 32px 24px;">
        <p style="color: #1a1a1a; font-size: 16px; margin: 0 0 8px;">Hi <strong>${username}</strong>,</p>
        <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
          Welcome to SNAP_GRAM! Use the verification code below to complete your registration.
        </p>

        <!-- OTP Box -->
        <div style="background: #f8fafc; border: 2px dashed #3b82f6; border-radius: 12px; padding: 20px; text-align: center; margin: 0 0 24px;">
          <p style="color: #6b7280; font-size: 12px; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 1px;">Your verification code</p>
          <p style="color: #1a1a1a; font-size: 36px; font-weight: 700; letter-spacing: 8px; margin: 0;">${otp}</p>
        </div>

        <p style="color: #9ca3af; font-size: 13px; line-height: 1.5; margin: 0;">
          This code expires in <strong>10 minutes</strong>. If you didn't create an account, you can safely ignore this email.
        </p>
      </div>

      <!-- Footer -->
      <div style="background: #f9fafb; padding: 16px 24px; text-align: center; border-top: 1px solid #f3f4f6;">
        <p style="color: #9ca3af; font-size: 12px; margin: 0;">&copy; ${new Date().getFullYear()} SNAP_GRAM. All rights reserved.</p>
      </div>
    </div>
  `;
    const info = yield transporter.sendMail({
        from: `"SNAP_GRAM" <${process.env.EMAIL_FROM || 'noreply@snapgram.dev'}>`,
        to,
        subject: `${otp} is your SNAP_GRAM verification code`,
        html,
    });
    // Log Ethereal preview URL in development
    if (process.env.NODE_ENV === 'development') {
        console.log('Email preview URL:', nodemailer_1.default.getTestMessageUrl(info));
    }
});
exports.sendVerificationEmail = sendVerificationEmail;
const sendPasswordResetEmail = (to, username, otp) => __awaiter(void 0, void 0, void 0, function* () {
    const transporter = createTransport();
    const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
      <div style="background: linear-gradient(135deg, #dc2626, #ef4444); padding: 32px 24px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">SNAP_GRAM</h1>
        <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 14px;">Password Reset Request</p>
      </div>
      <div style="padding: 32px 24px;">
        <p style="color: #1a1a1a; font-size: 16px; margin: 0 0 8px;">Hi <strong>${username}</strong>,</p>
        <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
          We received a request to reset your password. Use the code below to set a new password.
        </p>
        <div style="background: #fef2f2; border: 2px dashed #ef4444; border-radius: 12px; padding: 20px; text-align: center; margin: 0 0 24px;">
          <p style="color: #6b7280; font-size: 12px; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 1px;">Your reset code</p>
          <p style="color: #1a1a1a; font-size: 36px; font-weight: 700; letter-spacing: 8px; margin: 0;">${otp}</p>
        </div>
        <p style="color: #9ca3af; font-size: 13px; line-height: 1.5; margin: 0;">
          This code expires in <strong>10 minutes</strong>. If you didn't request a password reset, you can safely ignore this email.
        </p>
      </div>
      <div style="background: #f9fafb; padding: 16px 24px; text-align: center; border-top: 1px solid #f3f4f6;">
        <p style="color: #9ca3af; font-size: 12px; margin: 0;">&copy; ${new Date().getFullYear()} SNAP_GRAM. All rights reserved.</p>
      </div>
    </div>
  `;
    const info = yield transporter.sendMail({
        from: `"SNAP_GRAM" <${process.env.EMAIL_FROM || 'noreply@snapgram.dev'}>`,
        to,
        subject: `${otp} is your SNAP_GRAM password reset code`,
        html,
    });
    if (process.env.NODE_ENV === 'development') {
        console.log('Password reset email preview URL:', nodemailer_1.default.getTestMessageUrl(info));
    }
});
exports.sendPasswordResetEmail = sendPasswordResetEmail;
