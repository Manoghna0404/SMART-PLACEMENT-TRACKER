import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../../components/common/Navbar';
import useAuthStore from '../../store/authStore';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { login, loading } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const user = await login(email, password);
      navigate(user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <Navbar />
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-5xl items-center px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid w-full gap-10 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-4xl border border-white/10 bg-slate-900/90 p-10 shadow-2xl shadow-slate-950/40 backdrop-blur-xl">
            <div className="max-w-md">
              <p className="text-sm uppercase tracking-[0.3em] text-indigo-300">Secure access</p>
              <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white">Welcome back to Smart Placement Tracker</h1>
              <p className="mt-4 text-slate-300">Sign in with your admin or student account to continue managing placements, applications, and AI hiring insights.</p>
            </div>
          </div>

          <div className="rounded-4xl border border-slate-700/60 bg-slate-950/95 p-8 shadow-2xl shadow-slate-950/40">
            <h2 className="text-2xl font-semibold text-white">Sign in to your account</h2>
            <p className="mt-2 text-sm text-slate-400">Admin and student authentication with secure token validation.</p>

            {error && (
              <div className="mt-6 rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-200 ring-1 ring-red-500/20">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-300">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-3 w-full rounded-3xl border border-slate-700 bg-slate-950 px-5 py-3 text-white placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                  placeholder="you@college.edu"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300">Password</label>
                <div className="mt-3 flex items-center overflow-hidden rounded-3xl border border-slate-700 bg-slate-950">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="flex-1 border-none bg-transparent px-5 py-3 text-white placeholder:text-slate-500 focus:outline-none"
                    placeholder="Enter password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="px-5 text-sm font-semibold text-indigo-300 hover:text-indigo-200"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Link to="/forgot-password" className="text-sm font-medium text-indigo-300 hover:text-indigo-200">
                  Forgot password?
                </Link>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center justify-center rounded-3xl bg-linear-to-r from-indigo-500 to-violet-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:from-indigo-400 hover:to-violet-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? 'Signing in...' : 'Sign In'}
                </button>
              </div>
            </form>

            <p className="mt-8 text-center text-sm text-slate-500">
              New to Smart Placement Tracker?{' '}
              <Link to="/register" className="font-semibold text-indigo-300 hover:text-indigo-200">
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
