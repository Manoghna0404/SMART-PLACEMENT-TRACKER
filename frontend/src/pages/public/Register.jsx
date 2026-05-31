import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../../components/common/Navbar';
import useAuthStore from '../../store/authStore';
import { BRANCHES } from '../../utils/constants';

const Register = () => {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    cgpa: '',
    branch: 'CSE',
    backlogs: '0',
    skills: '',
  });
  const [error, setError] = useState('');
  const { register, loading } = useAuthStore();
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await register({
        ...form,
        cgpa: parseFloat(form.cgpa) || 0,
        backlogs: parseInt(form.backlogs, 10) || 0,
        skills: form.skills.split(',').map((s) => s.trim()).filter(Boolean),
      });
      navigate('/login');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar />
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid w-full gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-4xl border border-white/10 bg-slate-900/80 p-10 shadow-2xl shadow-slate-950/40 backdrop-blur-xl">
            <span className="inline-flex rounded-full bg-indigo-500/10 px-4 py-1 text-sm font-semibold text-indigo-200">
              Student account onboarding
            </span>
            <h1 className="mt-8 text-4xl font-semibold tracking-tight text-white">Register for smarter placement tracking</h1>
            <p className="mt-4 max-w-xl text-slate-400">
              Join Smart Placement Tracker to manage drives, monitor eligibility, take mock tests, and get AI-powered resume insights.
            </p>
            <div className="mt-10 space-y-4 text-sm text-slate-300">
              <div className="flex items-start gap-3 rounded-3xl border border-slate-800 bg-slate-950/80 p-4">
                <span className="mt-1 text-lg">✅</span>
                <p>Secure registration with saved profile, CGPA, branch and skills data.</p>
              </div>
              <div className="flex items-start gap-3 rounded-3xl border border-slate-800 bg-slate-950/80 p-4">
                <span className="mt-1 text-lg">🚀</span>
                <p>Access company eligibility, applications, tests and interview experience content.</p>
              </div>
              <div className="flex items-start gap-3 rounded-3xl border border-slate-800 bg-slate-950/80 p-4">
                <span className="mt-1 text-lg">💡</span>
                <p>Switch between light and dark mode anytime from the top navigation.</p>
              </div>
            </div>
          </div>

          <div className="rounded-4xl border border-slate-800 bg-slate-950/95 p-8 shadow-2xl shadow-slate-950/40">
            <h2 className="text-3xl font-semibold text-white">Create your student profile</h2>
            <p className="mt-2 text-sm text-slate-400">Fill in your details to get started with placement tracking.</p>

            {error && (
              <div className="mt-6 rounded-3xl bg-red-500/10 px-4 py-3 text-sm text-red-200 ring-1 ring-red-500/20">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-300">Full Name</label>
                <input
                  name="name"
                  required
                  value={form.name}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-3xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-300">Email</label>
                <input
                  name="email"
                  type="email"
                  required
                  value={form.email}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-3xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300">Password</label>
                <input
                  name="password"
                  type="password"
                  required
                  minLength={6}
                  value={form.password}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-3xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300">CGPA</label>
                <input
                  name="cgpa"
                  type="number"
                  step="0.01"
                  min="0"
                  max="10"
                  value={form.cgpa}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-3xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300">Branch</label>
                <select
                  name="branch"
                  value={form.branch}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-3xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                >
                  {BRANCHES.map((b) => (
                    <option key={b} value={b} className="bg-slate-950 text-white">
                      {b}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300">Backlogs</label>
                <input
                  name="backlogs"
                  type="number"
                  min="0"
                  value={form.backlogs}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-3xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-300">Skills (comma separated)</label>
                <input
                  name="skills"
                  value={form.skills}
                  onChange={handleChange}
                  placeholder="React, Node.js, Python"
                  className="mt-2 w-full rounded-3xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="sm:col-span-2 rounded-3xl bg-linear-to-r from-indigo-500 to-violet-500 px-6 py-3 text-sm font-semibold text-white shadow-xl shadow-indigo-500/20 transition hover:from-indigo-400 hover:to-violet-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Creating account...' : 'Register'}
              </button>
            </form>

            <p className="mt-8 text-center text-sm text-slate-400">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-indigo-300 hover:text-indigo-200">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
