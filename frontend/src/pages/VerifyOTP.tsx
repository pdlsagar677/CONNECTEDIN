import React, { useState, useRef, useEffect, KeyboardEvent, ClipboardEvent } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Loader2, ShieldCheck, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { setAuthUser, setToken } from '../redux/authSlice';
import { RootState } from '../redux/store';
import API from '../lib/api';

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60; // seconds

const VerifyOTP: React.FC = () => {
  const [otp, setOtp] = useState<string[]>(new Array(OTP_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(RESEND_COOLDOWN);
  const [resending, setResending] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  const user = useSelector((store: RootState) => store.auth?.user);

  const email = (location.state as { email?: string })?.email;

  // Redirect if no email or already logged in
  useEffect(() => {
    if (user) {
      navigate('/home');
    } else if (!email) {
      navigate('/signup');
    }
  }, [user, email, navigate]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => {
      setResendTimer(prev => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  // Auto-focus first input
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return; // digits only
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1); // take last digit
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all digits filled
    if (newOtp.every(d => d !== '') && newOtp.join('').length === OTP_LENGTH) {
      submitOTP(newOtp.join(''));
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (pastedData.length === 0) return;

    const newOtp = [...otp];
    for (let i = 0; i < pastedData.length; i++) {
      newOtp[i] = pastedData[i];
    }
    setOtp(newOtp);

    // Focus the next empty input or last input
    const nextEmpty = newOtp.findIndex(d => d === '');
    inputRefs.current[nextEmpty === -1 ? OTP_LENGTH - 1 : nextEmpty]?.focus();

    if (newOtp.every(d => d !== '')) {
      submitOTP(newOtp.join(''));
    }
  };

  const submitOTP = async (otpCode: string) => {
    if (loading) return;
    try {
      setLoading(true);
      const res = await API.post('/users/verify-otp', { email, otp: otpCode });

      if (res.data.success) {
        dispatch(setAuthUser(res.data.user));
        if (res.data.accessToken) dispatch(setToken(res.data.accessToken));
        toast.success('Email verified successfully!');
        navigate('/home');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Verification failed');
      setOtp(new Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0 || resending) return;
    try {
      setResending(true);
      const res = await API.post('/users/resend-otp', { email });
      if (res.data.success) {
        toast.success('New code sent to your email');
        setResendTimer(RESEND_COOLDOWN);
        setOtp(new Array(OTP_LENGTH).fill(''));
        inputRefs.current[0]?.focus();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to resend code');
    } finally {
      setResending(false);
    }
  };

  if (!email) return null;

  return (
    <div className='relative flex items-center w-screen h-screen justify-center overflow-hidden'>
      {/* Background Image with Overlay */}
      <div
        className='absolute inset-0 bg-cover bg-center bg-no-repeat'
        style={{
          backgroundImage: 'url("https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=1932&auto=format&fit=crop")',
          filter: 'brightness(0.7)',
        }}
      />

      {/* Gradient Overlay */}
      <div className='absolute inset-0 bg-gradient-to-br from-blue-500/20 to-white/10' />

      {/* Decorative Blur Elements */}
      <div className='absolute top-20 left-10 w-72 h-72 bg-blue-400/30 rounded-full blur-3xl animate-pulse' />
      <div className='absolute bottom-20 right-10 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl animate-pulse delay-1000' />

      {/* OTP Card */}
      <div className='relative z-10 w-full max-w-md px-4'>
        <div className='bg-white/95 backdrop-blur-xl shadow-2xl rounded-2xl flex flex-col gap-6 p-8 w-full border border-white/30'>
          {/* Icon and Title */}
          <div className='text-center'>
            <div className='mb-4'>
              <div className='w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg'>
                <ShieldCheck className='w-9 h-9 text-white' />
              </div>
            </div>
            <h1 className='font-bold text-3xl bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent mb-2'>
              Verify Email
            </h1>
            <p className='text-sm text-gray-600'>
              Enter the 6-digit code sent to
            </p>
            <p className='text-sm font-semibold text-gray-800 mt-1'>{email}</p>
          </div>

          {/* OTP Input Boxes */}
          <div className='flex justify-center gap-2 sm:gap-3'>
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => { inputRefs.current[index] = el; }}
                type='text'
                inputMode='numeric'
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={index === 0 ? handlePaste : undefined}
                className='w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-bold bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-800'
                disabled={loading}
              />
            ))}
          </div>

          {/* Verify Button */}
          <button
            onClick={() => {
              const code = otp.join('');
              if (code.length === OTP_LENGTH) submitOTP(code);
            }}
            disabled={loading || otp.some(d => d === '')}
            className={`w-full py-3 px-4 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center ${
              loading || otp.some(d => d === '')
                ? 'bg-gray-300 cursor-not-allowed text-gray-500'
                : 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0'
            }`}
          >
            {loading ? (
              <>
                <Loader2 className='mr-2 h-5 w-5 animate-spin' />
                Verifying...
              </>
            ) : (
              'Verify Email'
            )}
          </button>

          {/* Resend */}
          <div className='text-center'>
            <p className='text-sm text-gray-500 mb-2'>Didn't receive the code?</p>
            {resendTimer > 0 ? (
              <p className='text-sm text-gray-400'>
                Resend in <span className='font-semibold text-blue-600'>{resendTimer}s</span>
              </p>
            ) : (
              <button
                onClick={handleResend}
                disabled={resending}
                className='flex items-center gap-1.5 mx-auto text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors'
              >
                {resending ? (
                  <Loader2 className='h-4 w-4 animate-spin' />
                ) : (
                  <RotateCcw className='h-4 w-4' />
                )}
                Resend Code
              </button>
            )}
          </div>

          {/* Back to Signup */}
          <div className='text-center pt-2'>
            <Link
              to='/signup'
              className='text-sm text-gray-500 hover:text-gray-700 transition-colors'
            >
              Back to Sign Up
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className='absolute bottom-4 left-0 right-0 text-center text-white/80 text-sm z-10'>
        <p>&copy; 2024 SNAP_GRAM. Connect with friends and family</p>
      </div>
    </div>
  );
};

export default VerifyOTP;
