import React, { useState, useRef, useEffect, KeyboardEvent, ClipboardEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Loader2, Mail, Lock, Eye, EyeOff, ShieldCheck, RotateCcw, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import API from '../lib/api';

type Step = 'email' | 'otp' | 'newPassword';
const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60;

const ForgotPassword: React.FC = () => {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState<string[]>(new Array(OTP_LENGTH).fill(''));
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(RESEND_COOLDOWN);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const navigate = useNavigate();

  // Resend cooldown timer
  useEffect(() => {
    if (step !== 'otp' || resendTimer <= 0) return;
    const interval = setInterval(() => setResendTimer(prev => prev - 1), 1000);
    return () => clearInterval(interval);
  }, [step, resendTimer]);

  // Auto-focus first OTP input
  useEffect(() => {
    if (step === 'otp') inputRefs.current[0]?.focus();
  }, [step]);

  // Step 1: Send reset code
  const handleSendCode = async () => {
    if (!email.trim()) { toast.error('Please enter your email'); return; }
    try {
      setLoading(true);
      const res = await API.post('/users/forgot-password', { email });
      if (res.data.success) {
        toast.success(res.data.message);
        setStep('otp');
        setResendTimer(RESEND_COOLDOWN);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  // OTP input handlers
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < OTP_LENGTH - 1) inputRefs.current[index + 1]?.focus();
    if (newOtp.every(d => d !== '')) setStep('newPassword');
  };

  const handleOtpKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) inputRefs.current[index - 1]?.focus();
  };

  const handleOtpPaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    const newOtp = [...otp];
    for (let i = 0; i < pasted.length; i++) newOtp[i] = pasted[i];
    setOtp(newOtp);
    if (newOtp.every(d => d !== '')) setStep('newPassword');
  };

  // Step 3: Reset password
  const handleResetPassword = async () => {
    if (newPassword.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    if (newPassword !== confirmPassword) { toast.error('Passwords do not match'); return; }

    try {
      setLoading(true);
      const res = await API.post('/users/reset-password', {
        email,
        otp: otp.join(''),
        newPassword,
      });
      if (res.data.success) {
        toast.success(res.data.message);
        navigate('/login');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Reset failed');
      if (error.response?.data?.message?.includes('expired') || error.response?.data?.message?.includes('Invalid')) {
        setStep('otp');
        setOtp(new Array(OTP_LENGTH).fill(''));
      }
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResend = async () => {
    if (resendTimer > 0) return;
    try {
      setLoading(true);
      await API.post('/users/forgot-password', { email });
      toast.success('New code sent');
      setResendTimer(RESEND_COOLDOWN);
      setOtp(new Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to resend');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='relative flex items-center w-screen h-screen justify-center overflow-hidden'>
      <div className='absolute inset-0 bg-cover bg-center bg-no-repeat' style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=1932&auto=format&fit=crop")', filter: 'brightness(0.7)' }} />
      <div className='absolute inset-0 bg-gradient-to-br from-blue-500/20 to-white/10' />
      <div className='absolute top-20 left-10 w-72 h-72 bg-blue-400/30 rounded-full blur-3xl animate-pulse' />
      <div className='absolute bottom-20 right-10 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl animate-pulse delay-1000' />

      <div className='relative z-10 w-full max-w-md px-4'>
        <div className='bg-white/95 backdrop-blur-xl shadow-2xl rounded-2xl flex flex-col gap-6 p-8 w-full border border-white/30'>

          {/* Header */}
          <div className='text-center'>
            <div className='w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg mb-4'>
              {step === 'email' ? <Mail className='w-9 h-9 text-white' /> :
               step === 'otp' ? <ShieldCheck className='w-9 h-9 text-white' /> :
               <Lock className='w-9 h-9 text-white' />}
            </div>
            <h1 className='font-bold text-3xl bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent mb-2'>
              {step === 'email' ? 'Forgot Password' : step === 'otp' ? 'Enter Code' : 'New Password'}
            </h1>
            <p className='text-sm text-gray-600'>
              {step === 'email' ? 'Enter your email to receive a reset code' :
               step === 'otp' ? `Enter the 6-digit code sent to ${email}` :
               'Create your new password'}
            </p>
          </div>

          {/* Step 1: Email */}
          {step === 'email' && (
            <>
              <input
                type='email'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendCode()}
                placeholder='Enter your email'
                className='w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800'
              />
              <button
                onClick={handleSendCode}
                disabled={loading}
                className={`w-full py-3 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center ${loading ? 'bg-gray-300 text-gray-500' : 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white hover:shadow-xl'}`}
              >
                {loading ? <><Loader2 className='mr-2 h-5 w-5 animate-spin' />Sending...</> : 'Send Reset Code'}
              </button>
            </>
          )}

          {/* Step 2: OTP */}
          {step === 'otp' && (
            <>
              <div className='flex justify-center gap-2 sm:gap-3'>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => { inputRefs.current[i] = el; }}
                    type='text'
                    inputMode='numeric'
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    onPaste={i === 0 ? handleOtpPaste : undefined}
                    className='w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-bold bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800'
                  />
                ))}
              </div>
              <div className='text-center'>
                {resendTimer > 0 ? (
                  <p className='text-sm text-gray-400'>Resend in <span className='font-semibold text-blue-600'>{resendTimer}s</span></p>
                ) : (
                  <button onClick={handleResend} disabled={loading} className='flex items-center gap-1.5 mx-auto text-sm font-semibold text-blue-600 hover:text-blue-700'>
                    <RotateCcw className='h-4 w-4' /> Resend Code
                  </button>
                )}
              </div>
            </>
          )}

          {/* Step 3: New Password */}
          {step === 'newPassword' && (
            <>
              <div className='relative'>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder='New password'
                  className='w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800'
                />
                <button type='button' onClick={() => setShowPassword(!showPassword)} className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-500'>
                  {showPassword ? <EyeOff className='h-5 w-5' /> : <Eye className='h-5 w-5' />}
                </button>
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleResetPassword()}
                placeholder='Confirm new password'
                className='w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800'
              />
              <button
                onClick={handleResetPassword}
                disabled={loading}
                className={`w-full py-3 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center ${loading ? 'bg-gray-300 text-gray-500' : 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white hover:shadow-xl'}`}
              >
                {loading ? <><Loader2 className='mr-2 h-5 w-5 animate-spin' />Resetting...</> : 'Reset Password'}
              </button>
            </>
          )}

          {/* Back links */}
          <div className='text-center pt-2'>
            {step !== 'email' ? (
              <button onClick={() => { setStep('email'); setOtp(new Array(OTP_LENGTH).fill('')); }} className='text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mx-auto'>
                <ArrowLeft className='h-4 w-4' /> Start over
              </button>
            ) : (
              <Link to='/login' className='text-sm text-blue-600 hover:text-blue-700 font-semibold'>Back to Sign In</Link>
            )}
          </div>
        </div>
      </div>

      <div className='absolute bottom-4 left-0 right-0 text-center text-white/80 text-sm z-10'>
        <p>&copy; 2024 SNAP_GRAM. Connect with friends and family</p>
      </div>
    </div>
  );
};

export default ForgotPassword;
