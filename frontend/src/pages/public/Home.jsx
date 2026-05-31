import { Link } from 'react-router-dom';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';

const features = [
  { icon: '📋', title: 'Placement Tracker', desc: 'Track applications, interview dates, and status across companies.' },
  { icon: '📄', title: 'AI Resume Analyzer', desc: 'Upload your resume and get AI-powered scoring and keyword analysis.' },
  { icon: '✅', title: 'Eligibility Checker', desc: 'Auto-filter companies based on CGPA, branch, and backlogs.' },
  { icon: '📝', title: 'Aptitude Mock Tests', desc: 'Practice aptitude tests and track weak areas over time.' },
  { icon: '💬', title: 'Interview Experiences', desc: 'Learn from peers — questions, rounds, and difficulty ratings.' },
  { icon: '📈', title: 'Admin Analytics', desc: 'TPO dashboard with placement stats, branch-wise and company-wise charts.' },
];

const Home = () => (
  <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100">
    <Navbar />
    <section className="relative overflow-hidden bg-slate-950 px-4 py-20 sm:px-6 lg:px-8">
      <div className="absolute inset-0 opacity-25">
        <div className="absolute -top-20 -right-24 h-96 w-96 rounded-full bg-indigo-500 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-cyan-400 blur-3xl" />
      </div>
      <div className="relative mx-auto flex max-w-6xl flex-col gap-16 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-2xl text-center lg:text-left">
          <span className="inline-flex rounded-full bg-white/10 px-4 py-2 text-sm font-semibold tracking-[0.25em] text-indigo-200 backdrop-blur">
            AI-powered placement hub
          </span>
          <h1 className="mt-8 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            Smart Placement Tracker for students and TPO admins
          </h1>
          <p className="mt-6 text-lg leading-8 text-slate-300">
            Accelerate campus hiring with placement analytics, resume intelligence, mock tests, and live interview experience sharing.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4 lg:justify-start">
            <Link
              to="/register"
              className="inline-flex items-center justify-center rounded-full bg-linear-to-r from-indigo-500 to-violet-500 px-8 py-3 text-sm font-semibold text-white shadow-xl shadow-indigo-500/20 transition hover:from-indigo-400 hover:to-violet-400"
            >
              Get Started
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/10 px-8 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
            >
              Login
            </Link>
          </div>
        </div>

        <div className="rounded-4xl border border-white/10 bg-slate-900/90 p-8 shadow-2xl shadow-slate-950/50 backdrop-blur-xl sm:p-10">
          <p className="text-sm uppercase tracking-[0.32em] text-slate-400">Launch your placement journey</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {features.slice(0, 4).map((feature) => (
              <div key={feature.title} className="rounded-3xl bg-slate-950/80 p-5 ring-1 ring-white/10">
                <span className="text-3xl">{feature.icon}</span>
                <h3 className="mt-4 text-lg font-semibold text-white">{feature.title}</h3>
                <p className="mt-2 text-sm text-slate-400">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>

    <section className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6">
      <div className="grid gap-10 lg:grid-cols-3">
        {features.map((feature) => (
          <div key={feature.title} className="rounded-4xl border border-slate-800 bg-slate-900/90 p-8 text-white shadow-xl shadow-slate-950/40">
            <span className="text-4xl">{feature.icon}</span>
            <h3 className="mt-6 text-xl font-semibold">{feature.title}</h3>
            <p className="mt-3 text-sm leading-6 text-slate-400">{feature.desc}</p>
          </div>
        ))}
      </div>
    </section>

    <section className="bg-slate-900 px-4 py-16 text-center text-slate-100 sm:px-6">
      <div className="mx-auto max-w-3xl rounded-4xl border border-white/10 bg-slate-950/90 p-10 shadow-2xl shadow-slate-950/40">
        <h2 className="text-3xl font-semibold text-white">Demo credentials included</h2>
        <p className="mt-4 text-slate-400">Use these sample accounts to explore the platform immediately.</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-3xl bg-slate-900 p-6 text-left">
            <p className="font-semibold text-indigo-300">Admin / TPO</p>
            <p className="mt-3 text-slate-300">admin@college.edu</p>
            <p className="text-slate-300">admin123</p>
          </div>
          <div className="rounded-3xl bg-slate-900 p-6 text-left">
            <p className="font-semibold text-cyan-300">Student</p>
            <p className="mt-3 text-slate-300">demo@student.edu</p>
            <p className="text-slate-300">student123</p>
          </div>
        </div>
      </div>
    </section>
    <Footer />
  </div>
);

export default Home;
