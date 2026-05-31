import { useEffect, useState } from 'react';
import DashboardLayout from '../../components/common/DashboardLayout';
import Loader from '../../components/common/Loader';
import AnalyticsCharts from '../../components/admin/AnalyticsCharts';
import { getStats } from '../../services/adminService';

const Analytics = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStats().then((res) => setStats(res.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout title="Analytics Dashboard" subtitle="Placement statistics and hiring insights">
      {loading ? <Loader /> : (
        <>
          <div className="mb-8 grid gap-4 sm:grid-cols-4">
            {[
              { label: 'Placement Rate', value: `${stats?.placementPercentage}%` },
              { label: 'Total Students', value: stats?.totalStudents },
              { label: 'Placed', value: stats?.placedStudents },
              { label: 'Applications', value: stats?.totalApplications },
            ].map((c) => (
              <div key={c.label} className="rounded-xl border bg-white p-4 shadow-sm">
                <p className="text-sm text-slate-500">{c.label}</p>
                <p className="text-2xl font-bold text-indigo-600">{c.value}</p>
              </div>
            ))}
          </div>
          <AnalyticsCharts stats={stats} />
        </>
      )}
    </DashboardLayout>
  );
};

export default Analytics;
