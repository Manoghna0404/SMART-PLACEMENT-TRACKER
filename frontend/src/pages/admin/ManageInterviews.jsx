import { useEffect, useState } from 'react';
import DashboardLayout from '../../components/common/DashboardLayout';
import Loader from '../../components/common/Loader';
import {
  getInterviewSchedules,
  createInterviewSchedule,
  updateInterviewSchedule,
  cancelInterviewSchedule,
} from '../../services/interviewService';

const emptyForm = {
  applicationId: '',
  roundName: '',
  roundType: 'Technical',
  scheduledAt: '',
  mode: 'Online',
  meetingLink: '',
  location: '',
  interviewer: '',
  notes: '',
};

const ManageInterviews = () => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const loadSchedules = async () => {
    setLoading(true);
    try {
      const { data } = await getInterviewSchedules();
      setSchedules(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSchedules();
  }, []);

  const resetForm = () => setForm(emptyForm);

  const handleSave = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      if (selectedSchedule) {
        await updateInterviewSchedule(selectedSchedule._id, form);
      } else {
        await createInterviewSchedule(form);
      }
      resetForm();
      setSelectedSchedule(null);
      await loadSchedules();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleEdit = (schedule) => {
    setSelectedSchedule(schedule);
    setForm({
      applicationId: schedule.applicationId?._id || schedule.applicationId,
      roundName: schedule.roundName,
      roundType: schedule.roundType,
      scheduledAt: schedule.scheduledAt ? new Date(schedule.scheduledAt).toISOString().slice(0, 16) : '',
      mode: schedule.mode,
      meetingLink: schedule.meetingLink,
      location: schedule.location,
      interviewer: schedule.interviewer,
      notes: schedule.notes,
    });
  };

  const handleCancel = async (scheduleId) => {
    if (!window.confirm('Cancel this interview schedule?')) return;
    setActionLoading(true);
    try {
      await cancelInterviewSchedule(scheduleId);
      await loadSchedules();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <DashboardLayout title="Interview Management" subtitle="Schedule, track, and manage interview rounds">
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">{selectedSchedule ? 'Edit Interview' : 'Schedule Interview'}</h2>
          <form onSubmit={handleSave} className="mt-5 space-y-4">
            <input
              value={form.applicationId}
              onChange={(e) => setForm({ ...form, applicationId: e.target.value })}
              placeholder="Application ID"
              required
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none"
            />
            <input
              value={form.roundName}
              onChange={(e) => setForm({ ...form, roundName: e.target.value })}
              placeholder="Round name"
              required
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none"
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <select
                value={form.roundType}
                onChange={(e) => setForm({ ...form, roundType: e.target.value })}
                className="rounded-2xl border border-slate-300 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none"
              >
                <option value="Aptitude">Aptitude</option>
                <option value="Technical">Technical</option>
                <option value="HR">HR</option>
                <option value="Managerial">Managerial</option>
                <option value="Other">Other</option>
              </select>
              <select
                value={form.mode}
                onChange={(e) => setForm({ ...form, mode: e.target.value })}
                className="rounded-2xl border border-slate-300 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none"
              >
                <option value="Online">Online</option>
                <option value="Offline">Offline</option>
              </select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <input
                type="datetime-local"
                value={form.scheduledAt}
                onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
                required
                className="rounded-2xl border border-slate-300 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none"
              />
              <input
                value={form.interviewer}
                onChange={(e) => setForm({ ...form, interviewer: e.target.value })}
                placeholder="Interviewer name"
                className="rounded-2xl border border-slate-300 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <input
              value={form.meetingLink}
              onChange={(e) => setForm({ ...form, meetingLink: e.target.value })}
              placeholder="Meeting link"
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none"
            />
            <input
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder="Location"
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none"
            />
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={3}
              placeholder="Notes"
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none"
            />
            <div className="flex flex-wrap gap-3">
              <button type="submit" disabled={actionLoading} className="rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50">
                {selectedSchedule ? 'Save changes' : 'Create schedule'}
              </button>
              {selectedSchedule && (
                <button type="button" onClick={() => { resetForm(); setSelectedSchedule(null); }} className="rounded-2xl border border-slate-300 px-5 py-3 text-sm text-slate-700 hover:bg-slate-50">
                  Reset
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Live schedule feed</h2>
          {loading ? <Loader /> : schedules.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">No interviews scheduled yet.</p>
          ) : (
            <div className="mt-4 space-y-4">
              {schedules.map((schedule) => (
                <div key={schedule._id} className="rounded-3xl border border-slate-100 p-4 dark:border-slate-800">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">{schedule.companyId?.companyName}</p>
                      <p className="text-sm text-slate-500">{schedule.roundName} • {schedule.mode}</p>
                    </div>
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">{schedule.status}</span>
                  </div>
                  <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">Student: {schedule.studentId?.name}</p>
                  <p className="mt-1 text-sm text-slate-500">{new Date(schedule.scheduledAt).toLocaleString()}</p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <button onClick={() => handleEdit(schedule)} className="rounded-2xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">Edit</button>
                    <button onClick={() => handleCancel(schedule._id)} className="rounded-2xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50">Cancel</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ManageInterviews;
