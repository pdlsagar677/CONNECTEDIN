import React, { useEffect, useState, ChangeEvent, FormEvent } from 'react';
import { AxiosError } from 'axios';
import { toast } from 'sonner';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, User, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useSelector } from 'react-redux';
import { RootState } from '../redux/store';
import API from '../lib/api';

interface SignupInput {
    username: string;
    email: string;
    password: string;
}

interface ApiErrorResponse {
    message: string;
}

interface FormErrors {
    username?: string;
    email?: string;
    password?: string;
}

const Signup: React.FC = () => {
    const [input, setInput] = useState<SignupInput>({
        username: "",
        email: "",
        password: ""
    });
    const [errors, setErrors] = useState<FormErrors>({});
    const [loading, setLoading] = useState<boolean>(false);
    const [showPassword, setShowPassword] = useState<boolean>(false);
    
    const user = useSelector((store: RootState) => store.auth?.user);
    const navigate = useNavigate();

    const validateField = (name: string, value: string): string => {
        switch (name) {
            case 'username':
                if (!value.trim()) return 'Username is required';
                if (value.length < 3) return 'Username must be at least 3 characters';
                if (value.length > 20) return 'Username must be less than 20 characters';
                if (!/^[a-zA-Z0-9_]+$/.test(value)) return 'Username can only contain letters, numbers, and underscores';
                return '';
            case 'email':
                if (!value.trim()) return 'Email is required';
                const emailRegex = /^[^\s@]+@([^\s@]+\.)+[^\s@]+$/;
                if (!emailRegex.test(value)) return 'Please enter a valid email address';
                return '';
            case 'password':
                if (!value) return 'Password is required';
                if (value.length < 6) return 'Password must be at least 6 characters';
                if (value.length > 50) return 'Password must be less than 50 characters';
                if (!/(?=.*[A-Za-z])(?=.*\d)/.test(value)) {
                    return 'Password must contain at least one letter and one number';
                }
                return '';
            default:
                return '';
        }
    };

    const changeEventHandler = (e: ChangeEvent<HTMLInputElement>): void => {
        const { name, value } = e.target;
        setInput({ ...input, [name]: value });
        
        // Clear error when user starts typing
        if (errors[name as keyof FormErrors]) {
            setErrors({ ...errors, [name]: '' });
        }
    };

    const validateForm = (): boolean => {
        const newErrors: FormErrors = {};
        
        // Validate each field
        newErrors.username = validateField('username', input.username);
        newErrors.email = validateField('email', input.email);
        newErrors.password = validateField('password', input.password);
        
        setErrors(newErrors);
        
        // Return true if no errors
        return !Object.values(newErrors).some(error => error !== '');
    };

    const signupHandler = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
        e.preventDefault();
        
        // Clear all previous errors
        setErrors({});
        
        // Validate form
        if (!validateForm()) {
            toast.error('Please fix the errors before submitting');
            return;
        }

        try {
            setLoading(true);
            const res = await API.post('/users/register', input);

            if (res.data.success) {
                toast.success(res.data.message);
                if (res.data.requiresVerification) {
                    navigate("/verify-otp", { state: { email: input.email } });
                } else {
                    navigate("/home");
                }
                setInput({ username: "", email: "", password: "" });
                setErrors({});
            }
        } catch (error) {
            console.log(error);
            const axiosError = error as AxiosError<ApiErrorResponse>;
            const errorMessage = axiosError.response?.data?.message || 'Something went wrong';
            
            // Handle specific API errors
            if (errorMessage.toLowerCase().includes('email')) {
                setErrors({ ...errors, email: errorMessage });
            } else if (errorMessage.toLowerCase().includes('username')) {
                setErrors({ ...errors, username: errorMessage });
            } else {
                toast.error(errorMessage);
            }
        } finally {
            setLoading(false);
        }
    };

    const togglePasswordVisibility = (): void => {
        setShowPassword(!showPassword);
    };

    useEffect(() => {
        if (user) {
            navigate("/home");
        }
    }, [user, navigate]);

    return (
        <div className='relative flex items-center w-screen h-screen justify-center overflow-hidden'>
            {/* Background Image with Overlay */}
            <div 
                className='absolute inset-0 bg-cover bg-center bg-no-repeat'
                style={{
                    backgroundImage: 'url("https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=1932&auto=format&fit=crop")',
                    filter: 'brightness(0.7)'
                }}
            />
            
            {/* Gradient Overlay */}
            <div className='absolute inset-0 bg-gradient-to-br from-blue-500/20 to-white/10' />
            
            {/* Decorative Blur Elements */}
            <div className='absolute top-20 left-10 w-72 h-72 bg-blue-400/30 rounded-full blur-3xl animate-pulse' />
            <div className='absolute bottom-20 right-10 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl animate-pulse delay-1000' />
            
            {/* Signup Form Container */}
            <div className='relative z-10 w-full max-w-md px-4'>
                <form 
                    onSubmit={signupHandler} 
                    className='bg-white/95 backdrop-blur-xl shadow-2xl rounded-2xl flex flex-col gap-5 p-8 w-full border border-white/30 max-h-[90vh] overflow-y-auto'
                >
                    {/* Logo and Title */}
                    <div className='my-2 text-center'>
                        <div className='mb-4'>
                            <div className='w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg'>
                                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                            </div>
                        </div>
                        <h1 className='text-center font-bold text-3xl bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent mb-2'>
                            ConnectIn
                        </h1>
                        <p className='text-sm text-gray-600'>
                            Join our community and start connecting
                        </p>
                    </div>

                    {/* Google Login Button */}
                    <button
                        type="button"
                        onClick={() => {/* Add your Google auth handler here */}}
                        className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 border-gray-200 bg-white hover:bg-gray-50 transition-all duration-200 hover:shadow-md"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5">
                            <path 
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" 
                                fill="#4285F4"
                            />
                            <path 
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" 
                                fill="#34A853"
                            />
                            <path 
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" 
                                fill="#FBBC05"
                            />
                            <path 
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" 
                                fill="#EA4335"
                            />
                        </svg>
                        <span className='text-gray-700 font-medium'>Continue with Google</span>
                    </button>

                    <div className='flex items-center my-1'>
                        <div className='flex-1 h-px bg-gray-200'></div>
                        <span className='px-4 text-sm text-gray-500'>OR</span>
                        <div className='flex-1 h-px bg-gray-200'></div>
                    </div>

                    {/* Username Field */}
                    <div className='space-y-1'>
                        <label className='font-semibold text-gray-700 text-sm flex items-center gap-2'>
                            <User className='h-4 w-4 text-blue-500' />
                            Username
                        </label>
                        <div className='relative'>
                            <input
                                type="text"
                                name="username"
                                value={input.username}
                                onChange={changeEventHandler}
                                placeholder="Choose a username"
                                className={`w-full px-4 py-3 bg-gray-50 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-800 placeholder-gray-400 ${
                                    errors.username ? 'border-red-500 bg-red-50' : 'border-gray-200'
                                }`}
                                required
                            />
                        </div>
                        {errors.username && (
                            <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                                <span className="inline-block w-1 h-1 rounded-full bg-red-500"></span>
                                {errors.username}
                            </p>
                        )}
                    </div>

                    {/* Email Field */}
                    <div className='space-y-1'>
                        <label className='font-semibold text-gray-700 text-sm flex items-center gap-2'>
                            <Mail className='h-4 w-4 text-blue-500' />
                            Email Address
                        </label>
                        <div className='relative'>
                            <input
                                type="email"
                                name="email"
                                value={input.email}
                                onChange={changeEventHandler}
                                placeholder="Enter your email"
                                className={`w-full px-4 py-3 bg-gray-50 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-800 placeholder-gray-400 ${
                                    errors.email ? 'border-red-500 bg-red-50' : 'border-gray-200'
                                }`}
                                required
                            />
                        </div>
                        {errors.email && (
                            <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                                <span className="inline-block w-1 h-1 rounded-full bg-red-500"></span>
                                {errors.email}
                            </p>
                        )}
                    </div>

                    {/* Password Field */}
                    <div className='space-y-1'>
                        <label className='font-semibold text-gray-700 text-sm flex items-center gap-2'>
                            <Lock className='h-4 w-4 text-blue-500' />
                            Password
                        </label>
                        <div className='relative'>
                            <input
                                type={showPassword ? "text" : "password"}
                                name="password"
                                value={input.password}
                                onChange={changeEventHandler}
                                placeholder="Create a password"
                                className={`w-full px-4 py-3 bg-gray-50 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-800 placeholder-gray-400 ${
                                    errors.password ? 'border-red-500 bg-red-50' : 'border-gray-200'
                                }`}
                                required
                                minLength={6}
                            />
                            <button
                                type="button"
                                onClick={togglePasswordVisibility}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-blue-600 transition-colors duration-200"
                            >
                                {showPassword ? (
                                    <EyeOff className="h-5 w-5" />
                                ) : (
                                    <Eye className="h-5 w-5" />
                                )}
                            </button>
                        </div>
                        {errors.password ? (
                            <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                                <span className="inline-block w-1 h-1 rounded-full bg-red-500"></span>
                                {errors.password}
                            </p>
                        ) : (
                            <p className="text-xs text-gray-500 mt-1">Password must contain at least one letter and one number</p>
                        )}
                    </div>

                    {/* Terms and Conditions */}
                    <div className='flex items-start gap-2 mt-1'>
                        <input
                            type="checkbox"
                            id="terms"
                            className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                            required
                        />
                        <label htmlFor="terms" className="text-xs text-gray-600 cursor-pointer">
                            I agree to the{' '}
                            <Link to="/terms" className="text-blue-600 hover:text-blue-700 font-medium hover:underline">
                                Terms of Service
                            </Link>
                            {' '}and{' '}
                            <Link to="/privacy" className="text-blue-600 hover:text-blue-700 font-medium hover:underline">
                                Privacy Policy
                            </Link>
                        </label>
                    </div>

                    {/* Submit Button */}
                    <button
                        type='submit'
                        disabled={loading}
                        className={`w-full py-3 px-4 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center mt-2 ${
                            loading 
                                ? 'bg-gray-300 cursor-not-allowed text-gray-500' 
                                : 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0'
                        }`}
                    >
                        {loading ? (
                            <>
                                <Loader2 className='mr-2 h-5 w-5 animate-spin' />
                                Creating account...
                            </>
                        ) : (
                            'Create Account'
                        )}
                    </button>

                    {/* Login Link */}
                    <div className='text-center pt-2'>
                        <span className='text-gray-600 text-sm'>
                            Already have an account?{' '}
                            <Link 
                                to="/login" 
                                className='text-blue-600 hover:text-blue-700 font-semibold hover:underline transition-colors duration-200'
                            >
                                Sign In
                            </Link>
                        </span>
                    </div>
                </form>
            </div>

            {/* Footer */}
            <div className='absolute bottom-4 left-0 right-0 text-center text-white/80 text-sm z-10'>
                <p>© 2024 Let's Chat. Connect with friends and family</p>
            </div>
        </div>
    );
};

export default Signup;