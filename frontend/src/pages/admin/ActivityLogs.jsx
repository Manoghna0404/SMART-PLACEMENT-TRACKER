import { useEffect, useState } from 'react';
import DashboardLayout from '../../components/common/DashboardLayout';


const ActivityLogs = () => {
  return (
    <DashboardLayout title="Activity Logs" subtitle="Audit trail for admin actions, interview updates, and student progress">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm">
        Activity logs are disabled.
      </div>
    </DashboardLayout>
  );
};

export default ActivityLogs;

