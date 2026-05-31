import { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../../components/common/DashboardLayout';
import Loader from '../../components/common/Loader';
import { closeRound, getRoundTracking, promoteRoundStudents, startRound } from '../../services/applicationService';
import useNotificationStore from '../../store/notificationStore';
import { STATUS_COLORS } from '../../utils/constants';

const stageMark = (status) => {
  if (['Completed', 'Selected'].includes(status)) return 'Qualified';
  if (status === 'Rejected') return 'Rejected';
  if (status === 'Scheduled') return 'In Progress';
  return status || 'Pending';
};

const ManageApplications = () => {
  const [groups, setGroups] = useState([]);
  const [companyId, setCompanyId] = useState('');
  const [roundName, setRoundName] = useState('');
  const [selected, setSelected] = useState({});
  const [schedule, setSchedule] = useState({ scheduledAt: '', mode: 'Online', meetingLink: '', location: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const socket = useNotificationStore((state) => state.socket);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await getRoundTracking(companyId ? { companyId } : undefined);
      setGroups(data.companies || []);
      const firstCompany = data.companies?.[0];
      if (!companyId && firstCompany) setCompanyId(firstCompany.company._id);
      if (!roundName && firstCompany?.roundStats?.[1]) setRoundName(firstCompany.roundStats[1].name);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [companyId]);

  useEffect(() => {
    if (!socket) return undefined;
    socket.on('application:updated', load);
    return () => socket.off('application:updated', load);
  }, [socket, companyId]);

  const activeGroup = useMemo(() => groups.find((group) => group.company._id === companyId) || groups[0], [groups, companyId]);
  const activeRound = activeGroup?.roundStats?.find((round) => round.name === roundName) || activeGroup?.roundStats?.[1];
  const applications = activeGroup?.applications || [];

  useEffect(() => {
    if (activeRound?.name && activeRound.name !== roundName) setRoundName(activeRound.name);
  }, [activeRound?.name]);

  const currentStage = (application) => application.pipelineStages?.find((stage) => stage.name === activeRound?.name);
  const candidates = applications.filter((application) => {
    const stage = currentStage(application);
    return stage && application.status !== 'Rejected' && !['Applied', 'Offer Released'].includes(activeRound?.name);
  });

  const toggle = (id, decision) => {
    setSelected((state) => ({ ...state, [id]: state[id] === decision ? '' : decision }));
  };

  const runAction = async (action) => {
    if (!activeGroup || !activeRound) return;
    setSaving(true);
    try {
      if (action === 'start') {
        await startRound(activeGroup.company._id, { roundName: activeRound.name, schedule });
      }
      if (action === 'close') {
        await closeRound(activeGroup.company._id, { roundName: activeRound.name });
      }
      if (action === 'publish') {
        const qualifiedIds = Object.entries(selected).filter(([, value]) => value === 'qualified').map(([id]) => id);
        const rejectedIds = Object.entries(selected).filter(([, value]) => value === 'rejected').map(([id]) => id);
        await promoteRoundStudents(activeGroup.company._id, { roundName: activeRound.name, qualifiedIds, rejectedIds, schedule });
        setSelected({});
      }
      await load();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout title="Round Tracking" subtitle="Track, shortlist, reject, and promote students round by round">
      {loading ? <Loader /> : (
        <div className="space-y-6">
          <div className="grid gap-4 rounded-xl border bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:grid-cols-2">
            <select value={activeGroup?.company._id || ''} onChange={(e) => { setCompanyId(e.target.value); setRoundName(''); }}
              className="rounded-lg border px-3 py-2 dark:border-slate-700 dark:bg-slate-950">
              {groups.map((group) => <option key={group.company._id} value={group.company._id}>{group.company.companyName}</option>)}
            </select>
            <select value={activeRound?.name || ''} onChange={(e) => setRoundName(e.target.value)}
              className="rounded-lg border px-3 py-2 dark:border-slate-700 dark:bg-slate-950">
              {(activeGroup?.roundStats || []).filter((round) => round.name !== 'Applied').map((round) => (
                <option key={round.name} value={round.name}>{round.name}</option>
              ))}
            </select>
          </div>

          {activeGroup && (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {activeGroup.roundStats.map((round) => (
                <button key={round.name} type="button" onClick={() => round.name !== 'Applied' && setRoundName(round.name)}
                  className={`rounded-xl border p-4 text-left shadow-sm dark:border-slate-800 ${round.name === activeRound?.name ? 'bg-indigo-50 ring-2 ring-indigo-500 dark:bg-indigo-950' : 'bg-white dark:bg-slate-900'}`}>
                  <p className="font-semibold">{round.name}</p>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span>Eligible: {round.totalEligible}</span>
                    <span>Appeared: {round.appeared}</span>
                    <span>Qualified: {round.qualified}</span>
                    <span>Rejected: {round.rejected}</span>
                  </div>
                </button>
              ))}
            </div>
          )}

          <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
            <div className="rounded-xl border bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">{activeRound?.name || 'Round'} Students</h2>
                  <p className="text-sm text-slate-500">Select completed students and publish round results together.</p>
                </div>
                <div className="flex gap-2">
                  <button disabled={saving} onClick={() => runAction('start')} className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-50">Start round</button>
                  <button disabled={saving} onClick={() => runAction('close')} className="rounded-lg border px-3 py-2 text-sm font-medium dark:border-slate-700">Close round</button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b text-slate-500 dark:border-slate-800">
                    <tr>
                      <th className="px-3 py-2">Student</th>
                      <th className="px-3 py-2">Branch</th>
                      <th className="px-3 py-2">Current</th>
                      <th className="px-3 py-2">Round Status</th>
                      <th className="px-3 py-2">Decision</th>
                    </tr>
                  </thead>
                  <tbody>
                    {candidates.map((application) => {
                      const stage = currentStage(application);
                      return (
                        <tr key={application._id} className="border-b last:border-0 dark:border-slate-800">
                          <td className="px-3 py-3">
                            <p className="font-medium">{application.studentId?.name}</p>
                            <p className="text-xs text-slate-500">{application.studentEmail || application.studentId?.email}</p>
                          </td>
                          <td className="px-3 py-3">{application.studentId?.branch || 'N/A'}</td>
                          <td className="px-3 py-3">
                            <span className={`rounded-full px-2 py-1 text-xs ${STATUS_COLORS[application.status] || 'bg-slate-100 text-slate-700'}`}>{application.status}</span>
                          </td>
                          <td className="px-3 py-3">{stageMark(stage?.status)}</td>
                          <td className="px-3 py-3">
                            <div className="flex gap-2">
                              <button type="button" onClick={() => toggle(application._id, 'qualified')}
                                className={`rounded-lg px-3 py-1 text-xs font-medium ${selected[application._id] === 'qualified' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700'}`}>Qualified</button>
                              <button type="button" onClick={() => toggle(application._id, 'rejected')}
                                className={`rounded-lg px-3 py-1 text-xs font-medium ${selected[application._id] === 'rejected' ? 'bg-red-600 text-white' : 'bg-red-50 text-red-700'}`}>Rejected</button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-xl border bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h3 className="font-semibold">Next Round Schedule</h3>
              <div className="mt-4 space-y-3">
                <input type="datetime-local" value={schedule.scheduledAt} onChange={(e) => setSchedule({ ...schedule, scheduledAt: e.target.value })}
                  className="w-full rounded-lg border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950" />
                <select value={schedule.mode} onChange={(e) => setSchedule({ ...schedule, mode: e.target.value })}
                  className="w-full rounded-lg border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950">
                  <option>Online</option>
                  <option>Offline</option>
                  <option>Hybrid</option>
                </select>
                <input value={schedule.meetingLink} onChange={(e) => setSchedule({ ...schedule, meetingLink: e.target.value })} placeholder="Meeting link"
                  className="w-full rounded-lg border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950" />
                <input value={schedule.location} onChange={(e) => setSchedule({ ...schedule, location: e.target.value })} placeholder="Location"
                  className="w-full rounded-lg border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950" />
                <button disabled={saving} onClick={() => runAction('publish')} className="w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
                  Promote selected students
                </button>
              </div>

              <div className="mt-6">
                <p className="mb-2 text-sm font-semibold">Funnel</p>
                <div className="space-y-2">
                  {(activeGroup?.funnel || []).map((item) => (
                    <div key={item.label} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm dark:bg-slate-950">
                      <span>{item.label}</span>
                      <span className="font-semibold">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default ManageApplications;
