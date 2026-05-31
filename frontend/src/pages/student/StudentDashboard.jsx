import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import DashboardLayout from '../../components/common/DashboardLayout';
import Loader from '../../components/common/Loader';
import { getDashboard } from '../../services/studentService';
import { STATUS_COLORS } from '../../utils/constants';

const StatCard = ({ label, value, color }) => (
  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card p-5">
    <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
    <p className={`mt-1 text-2xl font-bold ${color || 'text-slate-900 dark:text-white'}`}>{value}</p>
  </motion.div>
);

const StudentDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboard()
      .then((res) => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <DashboardLayout><Loader /></DashboardLayout>;

  const { user, recentApplications, recentTests, statusBreakdown, totalApplications, analytics, activities } = data || {};

  const upcomingSteps = (recentApplications || [])
    .map((app) => ({
      ...app,
      nextStage: app.pipelineStages?.find((stage) => stage.status === 'Pending'),
    }))
    .filter((app) => app.nextStage);

  return (
    <DashboardLayout title={`Welcome, ${user?.name || 'Student'}`} subtitle="Placement readiness, tests, applications, and recent activity">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Readiness" value={`${analytics?.readiness || 0}%`} color="text-emerald-600" />
        <StatCard label="Applications" value={totalApplications || 0} />
        <StatCard label="Average Test Score" value={`${analytics?.averageScore || 0}%`} color="text-indigo-600" />
        <StatCard label="Resume" value={user?.resumeScore ? `${user.resumeScore}/100` : 'Missing'} color="text-cyan-600" />
        <StatCard label="Status" value={user?.isPlaced ? 'Placed' : 'Seeking'} color={user?.isPlaced ? 'text-emerald-600' : 'text-amber-600'} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <div className="card p-6 xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900 dark:text-white">Aptitude Performance Trend</h2>
            <Link to="/tests" className="text-sm font-medium text-indigo-600 dark:text-indigo-300">Practice</Link>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics?.performanceTrend || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" hide />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Line type="monotone" dataKey="score" stroke="#4f46e5" strokeWidth={3} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="accuracy" stroke="#10b981" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="mb-4 font-semibold text-slate-900 dark:text-white">Topic Strengths</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics?.topicBreakdown || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="topic" hide />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="score" fill="#0f766e" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="card p-6">
          <h2 className="font-semibold text-slate-900 dark:text-white">Recent Applications</h2>
          <div className="mt-4 space-y-3">
            {recentApplications?.length ? recentApplications.map((app) => (
              <div key={app._id} className="rounded-lg bg-slate-50 px-4 py-3 dark:bg-slate-800">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">{app.companyId?.companyName}</p>
                    <p className="text-xs text-slate-500">{app.companyId?.role}</p>
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[app.status] || 'bg-slate-100 text-slate-700'}`}>
                    {app.status}
                  </span>
                </div>
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Current round: {app.currentRound || 'N/A'}</p>
              </div>
            )) : <p className="text-sm text-slate-500">No applications yet.</p>}
          </div>
        </div>

        <div className="card p-6">
          <h2 className="font-semibold text-slate-900 dark:text-white">Upcoming Rounds</h2>
          <div className="mt-4 space-y-3">
            {upcomingSteps?.length ? upcomingSteps.map((app) => (
              <div key={app._id} className="rounded-lg bg-slate-50 px-4 py-3 dark:bg-slate-800">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">{app.companyId?.companyName}</p>
                    <p className="text-xs text-slate-500">{app.nextStage?.name}</p>
                  </div>
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{app.nextStage?.status}</span>
                </div>
                {app.nextStage?.scheduledAt && (
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Scheduled: {new Date(app.nextStage.scheduledAt).toLocaleString()}</p>
                )}
              </div>
            )) : <p className="text-sm text-slate-500">No upcoming rounds in the pipeline yet.</p>}
          </div>
        </div>

        <div className="card p-6">
          <h2 className="font-semibold text-slate-900 dark:text-white">Recent Test Scores</h2>
          <div className="mt-4 space-y-3">
            {recentTests?.length ? recentTests.map((test) => (
              <div key={test._id} className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3 dark:bg-slate-800">
                <p className="font-medium text-slate-900 dark:text-white">{test.testId?.title}</p>
                <span className="font-semibold text-indigo-600 dark:text-indigo-300">{test.score}%</span>
              </div>
            )) : <p className="text-sm text-slate-500">No tests attempted yet.</p>}
          </div>
        </div>

        <div className="card p-6">
          <h2 className="font-semibold text-slate-900 dark:text-white">Activity Timeline</h2>
          <div className="mt-4 space-y-4">
            {activities?.length ? activities.map((activity) => (
              <div key={activity._id} className="border-l-2 border-indigo-200 pl-4 dark:border-indigo-800">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{activity.title}</p>
                <p className="text-xs text-slate-500">{activity.description}</p>
              </div>
            )) : <p className="text-sm text-slate-500">Your timeline will appear here.</p>}
          </div>
        </div>
      </div>

      {statusBreakdown && Object.keys(statusBreakdown).length > 0 && (
        <div className="card mt-6 p-6">
          <h2 className="font-semibold text-slate-900 dark:text-white">Application Status Breakdown</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            {Object.entries(statusBreakdown).map(([status, count]) => (
              <span key={status} className={`rounded-full px-4 py-1.5 text-sm font-medium ${STATUS_COLORS[status] || 'bg-slate-100'}`}>
                {status}: {count}
              </span>
            ))}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default StudentDashboard;
