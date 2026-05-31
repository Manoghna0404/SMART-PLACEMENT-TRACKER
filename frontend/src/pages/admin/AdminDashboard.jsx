import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import DashboardLayout from '../../components/common/DashboardLayout';
import Loader from '../../components/common/Loader';
import { getStats } from '../../services/adminService';
import { downloadSimpleReport } from '../../utils/reportUtils';

const colors = ['#4f46e5', '#10b981', '#0ea5e9', '#f59e0b', '#64748b'];

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStats().then((res) => setStats(res.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <DashboardLayout><Loader /></DashboardLayout>;

  const cards = [
    { label: 'Total Students', value: stats?.totalStudents, color: 'text-indigo-600' },
    { label: 'Placed', value: stats?.placedStudents, color: 'text-emerald-600' },
    { label: 'Unplaced', value: stats?.unplacedStudents, color: 'text-amber-600' },
    { label: 'Placement %', value: `${stats?.placementPercentage || 0}%`, color: 'text-cyan-600' },
    { label: 'Active Drives', value: stats?.activeDrives, color: 'text-violet-600' },
    { label: 'Test Attempts', value: stats?.testReports?.attempts || 0, color: 'text-slate-600 dark:text-slate-200' },
  ];

  return (
    <DashboardLayout title="Admin Dashboard" subtitle="Placement operations, analytics, and automation center">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        {cards.map((card) => (
          <motion.div key={card.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card p-5">
            <p className="text-sm text-slate-500 dark:text-slate-400">{card.label}</p>
            <p className={`mt-1 text-3xl font-bold ${card.color}`}>{card.value ?? 0}</p>
          </motion.div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <div className="card p-6 xl:col-span-2">
          <h2 className="mb-4 font-semibold text-slate-900 dark:text-white">Branch-wise Placement</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.branchStats || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="branch" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="total" fill="#94a3b8" radius={[6, 6, 0, 0]} />
                <Bar dataKey="placed" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="mb-4 font-semibold text-slate-900 dark:text-white">Company Participation</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={stats?.companyParticipation || []} dataKey="applications" nameKey="company" innerRadius={54} outerRadius={92}>
                  {(stats?.companyParticipation || []).map((entry, index) => (
                    <Cell key={entry.company} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="card p-6">
          <h2 className="font-semibold text-slate-900 dark:text-white">Most Difficult Topics</h2>
          <div className="mt-4 space-y-3">
            {stats?.testReports?.mostDifficultTopics?.map((topic) => (
              <div key={topic.topic}>
                <div className="flex justify-between text-sm">
                  <span>{topic.topic}</span>
                  <span>{topic.accuracy}% accuracy</span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div className="h-full rounded-full bg-amber-500" style={{ width: `${topic.accuracy}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-6 lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-semibold text-slate-900 dark:text-white">Placement Cell Actions</h2>
            <button
              onClick={() =>
                downloadSimpleReport('Placement Analytics Report', [
                  `Students: ${stats?.totalStudents || 0}`,
                  `Placed: ${stats?.placedStudents || 0}`,
                  `Placement: ${stats?.placementPercentage || 0}%`,
                  `Active Drives: ${stats?.activeDrives || 0}`,
                ])
              }
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              Export PDF
            </button>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            {[
              { to: '/admin/companies', label: 'Manage Drives' },
              { to: '/admin/tests', label: 'Online Tests' },
              { to: '/admin/question-bank', label: 'Question Bank' },
            ].map((item) => (
              <Link key={item.to} to={item.to} className="rounded-xl border border-indigo-100 bg-indigo-50 p-4 font-medium text-indigo-900 transition hover:bg-indigo-100 dark:border-indigo-900 dark:bg-indigo-950 dark:text-indigo-100">
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
