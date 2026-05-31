import { useEffect, useState } from 'react';
import DashboardLayout from '../../components/common/DashboardLayout';
import Loader from '../../components/common/Loader';
import { getInterviewSchedules } from '../../services/interviewService';

const MyInterviews = () => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getInterviewSchedules()
      .then((res) => setSchedules(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout title="My Interviews" subtitle="Track scheduled interviews, panel details, and meeting links">
      {loading ? <Loader /> : (
        <div className="space-y-4">
          {schedules.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm">No upcoming interviews scheduled.</div>
          ) : (
            schedules.map((item) => (
              <div key={item._id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">{item.companyId?.companyName}</h2>
                    <p className="mt-1 text-sm text-slate-500">{item.roundName} • {item.roundType}</p>
                    <p className="mt-2 text-sm text-slate-500">{new Date(item.scheduledAt).toLocaleString()}</p>
                  </div>
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">{item.status}</span>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 text-sm text-slate-600">
                  <div>Mode: {item.mode}</div>
                  <div>Interviewer: {item.interviewer || 'TBD'}</div>
                  <div>Location: {item.location || 'Virtual / TBD'}</div>
                  <div>Link: {item.meetingLink ? <a href={item.meetingLink} className="text-indigo-600">Join meeting</a> : 'Pending'}</div>
                </div>
                {item.notes && <p className="mt-4 text-sm text-slate-500">Notes: {item.notes}</p>}
              </div>
            ))
          )}
        </div>
      )}
    </DashboardLayout>
  );
};

export default MyInterviews;
