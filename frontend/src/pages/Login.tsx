import React, { useEffect, useState, ChangeEvent, FormEvent } from "react";
import { toast } from "sonner";
import { Link, useNavigate } from "react-router-dom";
import { Loader2, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { setAuthUser, setToken } from "../redux/authSlice";
import { RootState } from "../redux/store";
import API from "../lib/api";

interface LoginFormInput {
  email: string;
  password: string;
}

const Login: React.FC = () => {
  const [input, setInput] = useState<LoginFormInput>({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const { user } = useSelector((store: RootState) => store.auth);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const changeEventHandler = (e: ChangeEvent<HTMLInputElement>): void => {
    setInput({ ...input, [e.target.name]: e.target.value });
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const loginHandler = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await API.post("/users/login", input);

      if (res.data.success) {
        dispatch(setAuthUser(res.data.user));
        if (res.data.accessToken) dispatch(setToken(res.data.accessToken));
        navigate("/home");
        toast.success("Login Successful");
        setInput({
          email: "",
          password: "",
        });
      }
    } catch (error: any) {
      console.error(error);
      if (error.response?.data?.requiresVerification) {
        toast.info("Please verify your email first");
        navigate("/verify-otp", { state: { email: input.email } });
        return;
      }
      toast.error(
        error.response?.data?.message || "An unexpected error occurred.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      navigate("/home");
    }
  }, [user, navigate]);

  return (
    <div className="relative flex items-center w-screen h-screen justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage:
            'url("https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=1932&auto=format&fit=crop")',
          filter: "brightness(0.7)",
        }}
      />

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-white/10" />

      {/* Decorative Blur Elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400/30 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl animate-pulse delay-1000" />

      {/* Login Form Container */}
      <div className="relative z-10 w-full max-w-md px-4">
        <form
          onSubmit={loginHandler}
          className="bg-white/95 backdrop-blur-xl shadow-2xl rounded-2xl flex flex-col gap-6 p-8 w-full border border-white/30"
        >
          {/* Logo and Title */}
          <div className="my-2 text-center">
            <div className="mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                <svg
                  className="w-10 h-10 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"
                  ></path>
                </svg>
              </div>
            </div>
            <h1 className="text-center font-bold text-3xl bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent mb-2">
              ConnectIn
            </h1>
            <p className="text-sm text-gray-600">
              Welcome back! Let's connect with the world
            </p>
          </div>

          {/* Email Field */}
          <div className="space-y-2">
            <label className="font-semibold text-gray-700 text-sm flex items-center gap-2">
              <Mail className="h-4 w-4 text-blue-500" />
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                name="email"
                value={input.email}
                onChange={changeEventHandler}
                placeholder="Enter your email"
                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-800 placeholder-gray-400"
                required
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <label className="font-semibold text-gray-700 text-sm flex items-center gap-2">
              <Lock className="h-4 w-4 text-blue-500" />
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={input.password}
                onChange={changeEventHandler}
                placeholder="Enter your password"
                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-800 placeholder-gray-400"
                required
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
          </div>

          {/* Forgot Password Link */}
          <div className="text-right">
            <Link
              to="/forgot-password"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium hover:underline transition-colors duration-200"
            >
              Forgot Password?
            </Link>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 px-4 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center mt-2 ${
              loading
                ? "bg-gray-300 cursor-not-allowed text-gray-500"
                : "bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0"
            }`}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </button>

          {/* Signup Link */}
          <div className="text-center pt-4">
            <span className="text-gray-600 text-sm">
              Don't have an account?{" "}
              <Link
                to="/signup"
                className="text-blue-600 hover:text-blue-700 font-semibold hover:underline transition-colors duration-200"
              >
                Create Account
              </Link>
            </span>
          </div>
        </form>
      </div>

      {/* Footer */}
      <div className="absolute bottom-4 left-0 right-0 text-center text-white/80 text-sm z-10">
        <p>© 2024 ConnectIn. Connect with friends and family</p>
      </div>
    </div>
  );
};

export default Login;
