import { Resend } from 'resend';
// import nodemailer from 'nodemailer';
//
// --- Gmail SMTP path (commented out) ---
// Render's free tier blocks outbound SMTP on ports 25/465/587, so this path
// only works locally or on a paid Render plan. Re-enable it by uncommenting
// this block and the corresponding sendMail() calls below.
//
// const createTransport = () => {
//   return nodemailer.createTransport({
//     host: process.env.SMTP_HOST || 'smtp.ethereal.email',
//     port: Number(process.env.SMTP_PORT) || 587,
//     secure: false,
//     auth: {
//       user: process.env.SMTP_USER,
//       pass: process.env.SMTP_PASS,
//     },
//   });
// };

const getResend = () => {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    throw new Error('RESEND_API_KEY is not set');
  }
  return new Resend(key);
};
const fromAddress = () => process.env.SMTP_FROM || 'Connectedin <onboarding@resend.dev>';

export const sendVerificationEmail = async (
  to: string,
  username: string,
  otp: string
): Promise<void> => {
  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #2563eb, #3b82f6); padding: 32px 24px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">Connectedin</h1>
        <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 14px;">Verify your email address</p>
      </div>

      <!-- Body -->
      <div style="padding: 32px 24px;">
        <p style="color: #1a1a1a; font-size: 16px; margin: 0 0 8px;">Hi <strong>${username}</strong>,</p>
        <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
          Welcome to Connectedin! Use the verification code below to complete your registration.
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
        <p style="color: #9ca3af; font-size: 12px; margin: 0;">&copy; ${new Date().getFullYear()} Connectedin. All rights reserved.</p>
      </div>
    </div>
  `;

  try {
    const { data, error } = await getResend().emails.send({
      from: fromAddress(),
      to,
      subject: `${otp} is your Connectedin verification code`,
      html,
    });
    if (error) throw error;
    console.log('Verification email sent:', data?.id);
  } catch (err) {
    console.error('sendVerificationEmail failed:', err);
    throw err;
  }

  // --- Gmail SMTP path (commented out) ---
  // const transporter = createTransport();
  // const info = await transporter.sendMail({
  //   from: `"Connectedin" <${process.env.SMTP_FROM || 'noreply@snapgram.dev'}>`,
  //   to,
  //   subject: `${otp} is your Connectedin verification code`,
  //   html,
  // });
  // if (process.env.NODE_ENV === 'development') {
  //   console.log('Email preview URL:', nodemailer.getTestMessageUrl(info));
  // }
};

export const sendPasswordResetEmail = async (
  to: string,
  username: string,
  otp: string
): Promise<void> => {
  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
      <div style="background: linear-gradient(135deg, #dc2626, #ef4444); padding: 32px 24px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">Connectedin</h1>
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
        <p style="color: #9ca3af; font-size: 12px; margin: 0;">&copy; ${new Date().getFullYear()} Connectedin. All rights reserved.</p>
      </div>
    </div>
  `;

  try {
    const { data, error } = await getResend().emails.send({
      from: fromAddress(),
      to,
      subject: `${otp} is your Connectedin password reset code`,
      html,
    });
    if (error) throw error;
    console.log('Password reset email sent:', data?.id);
  } catch (err) {
    console.error('sendPasswordResetEmail failed:', err);
    throw err;
  }

  // --- Gmail SMTP path (commented out) ---
  // const transporter = createTransport();
  // const info = await transporter.sendMail({
  //   from: `"Connectedin" <${process.env.SMTP_FROM || 'noreply@snapgram.dev'}>`,
  //   to,
  //   subject: `${otp} is your Connectedin password reset code`,
  //   html,
  // });
  // if (process.env.NODE_ENV === 'development') {
  //   console.log('Password reset email preview URL:', nodemailer.getTestMessageUrl(info));
  // }
};
