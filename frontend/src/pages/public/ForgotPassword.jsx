import { useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/common/Navbar';
import { forgotPassword } from '../../services/authService';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setStatus('');

    if (!email) {
      setError('Please enter your email address to continue.');
      return;
    }

    setLoading(true);
    try {
      const { data } = await forgotPassword(email);
      setStatus(data.message || 'If an account exists, a password reset email has been sent.');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Unable to send reset email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar />
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-4xl items-center px-4 py-16 sm:px-6 lg:px-8">
        <div className="w-full rounded-4xl border border-slate-800 bg-slate-900/90 p-10 shadow-2xl shadow-slate-950/40 backdrop-blur-xl">
          <div className="max-w-xl">
            <p className="text-sm uppercase tracking-[0.3em] text-indigo-300">Password recovery</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white">Reset your password</h1>
            <p className="mt-4 text-slate-400">Enter the email address associated with your account, and we will send a secure reset link.</p>
          </div>

          {error && (
            <div className="mt-8 rounded-3xl bg-red-500/10 px-4 py-4 text-sm text-red-200 ring-1 ring-red-500/20">
              {error}
            </div>
          )}

          {status && (
            <div className="mt-8 rounded-3xl bg-emerald-500/10 px-4 py-4 text-sm text-emerald-200 ring-1 ring-emerald-500/20">
              {status}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-300">Email address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-3 w-full rounded-3xl border border-slate-700 bg-slate-950 px-5 py-3 text-white placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                placeholder="you@college.edu"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-3xl bg-linear-to-r from-indigo-500 to-violet-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:from-indigo-400 hover:to-violet-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Sending reset link...' : 'Send reset link'}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-slate-400">
            Remembered your password?{' '}
            <Link to="/login" className="font-semibold text-indigo-300 hover:text-indigo-200">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
