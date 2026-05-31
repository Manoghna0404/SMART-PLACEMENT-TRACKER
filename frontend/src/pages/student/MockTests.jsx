import { useEffect, useState } from 'react';
import DashboardLayout from '../../components/common/DashboardLayout';
import Loader from '../../components/common/Loader';
import TestPlayer from '../../components/student/TestPlayer';
import TestResultView from '../../components/student/TestResultView';
import { getTests, startTest, submitTest, getTestAnalytics } from '../../services/testService';

const TestCard = ({ test, onStart, disabled, label }) => (
  <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="flex items-start justify-between gap-2">
      <h3 className="font-semibold text-slate-900">{test.title}</h3>
      {test.testType === 'company' && (
        <span className="shrink-0 rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-700">Company</span>
      )}
    </div>
    <p className="mt-1 text-sm text-slate-500">{test.description}</p>
    <p className="mt-2 text-xs text-slate-400">
      {test.numberOfQuestions} questions · {test.duration} min · {test.difficulty}
    </p>
    {test.topics?.length > 0 && (
      <p className="mt-1 text-xs text-slate-400">Topics: {test.topics.join(', ')}</p>
    )}
    {test.attempted ? (
      <p className="mt-4 text-sm font-medium text-emerald-600">Completed — Score: {test.score}%</p>
    ) : (
      <button
        onClick={() => onStart(test._id)}
        disabled={disabled}
        className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
      >
        {label || 'Start Test'}
      </button>
    )}
    {test.oneAttemptOnly && !test.attempted && (
      <p className="mt-1 text-xs text-amber-600">One attempt only</p>
    )}
  </div>
);

const MockTests = () => {
  const [tests, setTests] = useState({ generalTests: [], companyTests: [] });
  const [analytics, setAnalytics] = useState(null);
  const [activeSession, setActiveSession] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const load = () => {
    Promise.all([getTests(), getTestAnalytics()])
      .then(([t, a]) => {
        setTests(t.data);
        setAnalytics(a.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleStart = async (id) => {
    setError('');
    try {
      const { data } = await startTest(id);
      setActiveSession(data);
      setResult(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Cannot start test');
    }
  };

  const handleSubmit = async (payload) => {
    if (!activeSession) return;
    setSubmitting(true);
    try {
      const { data } = await submitTest(activeSession.test._id, {
        ...payload,
        startedAt: activeSession.startedAt,
      });
      setResult(data);
      setActiveSession(null);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (activeSession) {
    return (
      <DashboardLayout title="Online Test" subtitle="Do not refresh — timer is running">
        <TestPlayer
          test={activeSession.test}
          durationSeconds={activeSession.durationSeconds}
          onSubmit={handleSubmit}
          submitting={submitting}
        />
      </DashboardLayout>
    );
  }

  if (result) {
    return (
      <DashboardLayout title="Test Result" subtitle={result.attempt?.testId?.title}>
        <TestResultView result={result} onClose={() => setResult(null)} />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Online Tests" subtitle="General practice tests and company-specific assessments">
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {analytics && (
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border bg-white p-4">
            <p className="text-sm text-slate-500">Total Attempts</p>
            <p className="text-2xl font-bold">{analytics.totalAttempts}</p>
          </div>
          <div className="rounded-xl border bg-white p-4">
            <p className="text-sm text-slate-500">Average Score</p>
            <p className="text-2xl font-bold text-indigo-600">{analytics.averageScore}%</p>
          </div>
          <div className="rounded-xl border bg-white p-4">
            <p className="text-sm text-slate-500">Top Weak Area</p>
            <p className="text-lg font-bold">{analytics.weakAreas?.[0]?.area || '—'}</p>
          </div>
        </div>
      )}

      {loading ? (
        <Loader />
      ) : (
        <div className="space-y-10">
          <section>
            <h2 className="mb-1 text-lg font-semibold text-slate-900">General Tests</h2>
            <p className="mb-4 text-sm text-slate-500">Visible to all students · unlimited attempts</p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {(tests.generalTests || []).map((t) => (
                <TestCard key={t._id} test={t} onStart={handleStart} />
              ))}
              {!tests.generalTests?.length && (
                <p className="text-sm text-slate-500">No general tests available yet.</p>
              )}
            </div>
          </section>

          <section>
            <h2 className="mb-1 text-lg font-semibold text-slate-900">Company-Specific Tests</h2>
            <p className="mb-4 text-sm text-slate-500">Assigned to you only · one attempt per test</p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {(tests.companyTests || []).map((t) => (
                <TestCard
                  key={t._id}
                  test={t}
                  onStart={handleStart}
                  disabled={t.attempted}
                  label={t.attempted ? 'Already Attempted' : 'Start Test'}
                />
              ))}
              {!tests.companyTests?.length && (
                <p className="text-sm text-slate-500">No company tests assigned to you.</p>
              )}
            </div>
          </section>
        </div>
      )}
    </DashboardLayout>
  );
};

export default MockTests;
