import { useState } from 'react';
import toast from 'react-hot-toast';
import axios from "axios";
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../utils/constant';
import { useGoogleLogin } from '@react-oauth/google';
import { useAppData } from '../context/AppContext';

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const { setUser, setIsAuth } = useAppData();

  const responseGoogle = async (authResult: any) => {
    if (authResult?.error) {
      toast.error('Google verification failed or cancelled');
      return;
    }

    setLoading(true);
    try {
      const result = await axios.post(`${authService}/api/auth/google`, {
        code: authResult["code"],
      });

      localStorage.setItem("token", result.data.token);
      toast.success(result.data.message || "Welcome back!");
      setUser(result.data.user);
      setIsAuth(true);
      navigate(result.data.needsRoleSelection ? "/select-role" : "/");
    } catch (error) {
      console.error("Authentication Error:", error);
      toast.error("An error occurred during authentication. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: responseGoogle,
    onError: responseGoogle,
    flow: "auth-code",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Please fill in both fields");
      return;
    }

    setLoading(true);
    try {
      const result = await axios.post(`${authService}/api/auth/login`, {
        email,
        password,
      });

      localStorage.setItem("token", result.data.token);
      toast.success(result.data.message || "Welcome back!");
      setUser(result.data.user);
      setIsAuth(true);
      navigate(result.data.needsRoleSelection ? "/select-role" : "/");
    } catch (error: any) {
      console.error("Login Error:", error);
      toast.error(error?.response?.data?.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] p-4 text-[#212121]">
      <div className="w-full max-w-md rounded-2xl border border-gray-100 overflow-hidden bg-white shadow-xl shadow-gray-100/50">

        {/* Brand Banner Header */}
        <div className="bg-gradient-to-r from-[#FF9933] to-[#E65100] px-8 py-8 text-center text-white">
          <div className="flex items-center justify-center gap-2.5 mb-1.5">
            <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center font-black text-[#E65100] text-xl shadow-sm">
              Z
            </div>
            <span className="text-2xl font-black tracking-tight">
              zayka<span className="text-gray-900 opacity-90">Drop</span>
            </span>
          </div>
          <p className="text-xs text-orange-100/90 font-medium tracking-wide">
            Flavors Delivered Right to Your Doorstep
          </p>
        </div>

        {/* Form Body Wrapper */}
        <div className="px-8 py-8">
          <h3 className="text-xl font-bold mb-1 text-gray-900">Welcome Back</h3>
          <p className="text-xs text-gray-500 mb-6">Sign in to manage your orders and profile preferences</p>

          {/* Premium Federated Google Authenticator Option */}
          <button
            type="button"
            onClick={() => googleLogin()}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-3 border border-gray-200 rounded-xl text-sm font-bold hover:bg-gray-50 hover:border-gray-300 transition duration-200 disabled:opacity-50 mb-5 shadow-sm"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                <span className="text-gray-500">Signing in...</span>
              </div>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <span className="text-gray-700">Continue with Google</span>
              </>
            )}
          </button>

          {/* Styled Text Divider */}
          <div className="flex items-center gap-3 my-6">
            <hr className="flex-1 border-gray-100" />
            <span className="text-xs font-bold tracking-wider text-gray-400 uppercase">or</span>
            <hr className="flex-1 border-gray-100" />
          </div>

          {/* Standard Form Fallbacks */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-gray-500 block mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-[#FF9933] focus:ring-1 focus:ring-[#FF9933] transition"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-gray-500 block mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-[#FF9933] focus:ring-1 focus:ring-[#FF9933] transition"
              />
            </div>

            {/* Primary Submit CTA Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 bg-gradient-to-r from-[#FF9933] to-[#E65100] hover:from-[#E65100] hover:to-[#d84315] text-white rounded-xl text-sm font-bold shadow-md shadow-orange-500/10 transition duration-200 disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <p className="text-center text-xs text-gray-500 mt-6">
            New to our platform?{' '}
            <Link to="/register" className="text-[#E65100] font-bold hover:underline">
              Create an account
            </Link>
          </p>
        </div>

        {/* Dynamic Marketing Footer */}
        <div className="border-t border-gray-100 bg-gray-50 py-3.5 text-center">
          <span className="text-xs text-gray-400 font-medium">Fresh food • Fast delivery • Every time</span>
        </div>
      </div>
    </div>
  );
};

export default Login;