import { useEffect, useState } from 'react';
import DashboardLayout from '../../components/common/DashboardLayout';
import Loader from '../../components/common/Loader';
import { getDashboard } from '../../services/studentService';
import { STATUS_COLORS } from '../../utils/constants';

const ProgressTracker = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboard()
      .then((res) => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <DashboardLayout title="Progress Tracker" subtitle="Monitor your placement journey from application to hiring">
      <Loader />
    </DashboardLayout>
  );

  return (
    <DashboardLayout title="Progress Tracker" subtitle="Monitor your placement journey from application to hiring">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Readiness score</p>
          <p className="mt-3 text-4xl font-semibold text-slate-900">{data.analytics?.readiness || 0}%</p>
          <p className="mt-3 text-sm text-slate-500">Based on CGPA, resume score, tests, and application momentum.</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Average test score</p>
          <p className="mt-3 text-4xl font-semibold text-indigo-600">{data.analytics?.averageScore || 0}%</p>
          <p className="mt-3 text-sm text-slate-500">Performance across recent tests.</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Application count</p>
          <p className="mt-3 text-4xl font-semibold text-emerald-600">{data.totalApplications || 0}</p>
          <p className="mt-3 text-sm text-slate-500">Your placements and progress stages.</p>
        </div>
      </div>

      <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Status breakdown</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          {Object.entries(data.statusBreakdown || {}).map(([status, count]) => (
            <span key={status} className={`rounded-full px-4 py-2 text-sm font-medium ${STATUS_COLORS[status] || 'bg-slate-100 text-slate-700'}`}>
              {status}: {count}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {(data.recentApplications || []).map((app) => (
          <div key={app._id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-lg font-semibold text-slate-900">{app.companyId?.companyName}</p>
                <p className="mt-1 text-sm text-slate-500">{app.companyId?.role}</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_COLORS[app.status] || 'bg-slate-100 text-slate-700'}`}>
                {app.status}
              </span>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3 text-sm text-slate-600">
              <div>Round: {app.currentRound || 'Application Screening'}</div>
              <div>Date: {new Date(app.appliedDate).toLocaleDateString()}</div>
              <div>Mode: {app.interviewMode || 'Online'}</div>
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
};

export default ProgressTracker;
