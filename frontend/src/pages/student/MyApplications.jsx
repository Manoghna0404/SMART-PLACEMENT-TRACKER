import { useEffect, useState } from 'react';
import DashboardLayout from '../../components/common/DashboardLayout';
import Loader from '../../components/common/Loader';
import { getMyApplications, deleteApplication } from '../../services/applicationService';
import useNotificationStore from '../../store/notificationStore';
import { STATUS_COLORS } from '../../utils/constants';

const iconForStage = (stage) => {
  if (stage.status === 'Rejected') return 'x';
  if (['Completed', 'Selected'].includes(stage.status)) return 'check';
  if (stage.status === 'Scheduled') return 'active';
  return 'blank';
};

const MyApplications = () => {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const socket = useNotificationStore((state) => state.socket);

  const load = () => {
    getMyApplications().then((res) => setApps(res.data)).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!socket) return undefined;
    socket.on('application:updated', load);
    return () => socket.off('application:updated', load);
  }, [socket]);

  const handleDelete = async (id) => {
    if (window.confirm('Remove this application?')) {
      await deleteApplication(id);
      load();
    }
  };

  return (
    <DashboardLayout title="My Applications" subtitle="Track your live placement round progress">
      {loading ? <Loader /> : apps.length === 0 ? (
        <p className="text-slate-500">No applications yet. Browse companies to apply.</p>
      ) : (
        <div className="space-y-4">
          {apps.map((app) => {
            const currentStage = (app.pipelineStages || []).find((stage) => stage.name === app.currentRound);
            return (
              <div key={app._id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold">{app.companyId?.companyName}</h3>
                    <p className="text-sm text-slate-500">{app.companyId?.role} - {app.companyId?.package}</p>
                    <p className="mt-1 text-xs text-slate-400">Applied: {new Date(app.appliedDate).toLocaleDateString()}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_COLORS[app.status] || 'bg-slate-100 text-slate-700'}`}>{app.status}</span>
                </div>

                <div className="mt-4 grid gap-3 rounded-xl bg-slate-50 p-4 text-sm dark:bg-slate-950 md:grid-cols-3">
                  <div>
                    <p className="text-xs uppercase text-slate-400">Current round</p>
                    <p className="font-semibold">{app.currentRound || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-slate-400">Upcoming schedule</p>
                    <p className="font-semibold">{currentStage?.scheduledAt ? new Date(currentStage.scheduledAt).toLocaleString() : 'TBD'}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-slate-400">Mode / Link</p>
                    <p className="font-semibold">{currentStage?.mode || 'TBD'} {currentStage?.meetingLink ? '- Link ready' : ''}</p>
                  </div>
                </div>

                <div className="mt-5 overflow-x-auto">
                  <div className="flex min-w-max items-start gap-3">
                    {(app.pipelineStages || []).map((stage, index) => {
                      const marker = iconForStage(stage);
                      return (
                        <div key={`${app._id}-${stage.name}`} className="flex items-start gap-3">
                          <div className="w-36">
                            <div className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${
                              marker === 'check' ? 'bg-emerald-600 text-white' :
                                marker === 'x' ? 'bg-red-600 text-white' :
                                  marker === 'active' ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-500 dark:bg-slate-800'
                            }`}>
                              {marker === 'check' ? 'OK' : marker === 'x' ? 'X' : marker === 'active' ? '...' : ''}
                            </div>
                            <p className="mt-2 text-sm font-medium">{stage.name}</p>
                            <p className="text-xs text-slate-500">{stage.status}</p>
                            {stage.scheduledAt && <p className="mt-1 text-xs text-slate-500">{new Date(stage.scheduledAt).toLocaleString()}</p>}
                            {stage.meetingLink && <a href={stage.meetingLink} className="mt-1 block text-xs text-indigo-600" target="_blank" rel="noreferrer">Join link</a>}
                          </div>
                          {index < app.pipelineStages.length - 1 && <div className="mt-4 h-0.5 w-8 bg-slate-200 dark:bg-slate-700" />}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-5 rounded-xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <p className="mb-2 text-sm font-semibold">Recent workflow events</p>
                  <div className="space-y-3">
                    {app.statusHistory?.slice(-3).reverse().map((item, index) => (
                      <div key={`${app._id}-${index}`} className="rounded-lg bg-slate-50 p-3 dark:bg-slate-950">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium">{item.status}</p>
                          <span className="text-xs text-slate-500">{new Date(item.timestamp).toLocaleDateString()}</span>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">{item.round}</p>
                        {item.notes && <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">{item.notes}</p>}
                      </div>
                    ))}
                  </div>
                </div>

                <button onClick={() => handleDelete(app._id)} className="mt-4 text-sm text-red-600 hover:text-red-700">Remove</button>
              </div>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
};

export default MyApplications;
