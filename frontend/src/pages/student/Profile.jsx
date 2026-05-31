import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/common/DashboardLayout';
import useAuthStore from '../../store/authStore';
import { updateProfile, getProfile } from '../../services/studentService';
import { BRANCHES } from '../../utils/constants';

const Profile = () => {
  const { user, updateUser } = useAuthStore();
  const [form, setForm] = useState({ name: '', cgpa: '', branch: 'CSE', backlogs: '0', skills: '' });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getProfile().then((res) => {
      const u = res.data;
      setForm({
        name: u.name || '',
        cgpa: u.cgpa || '',
        branch: u.branch || 'CSE',
        backlogs: u.backlogs || 0,
        skills: (u.skills || []).join(', '),
      });
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { data } = await updateProfile({
      ...form,
      cgpa: parseFloat(form.cgpa),
      backlogs: parseInt(form.backlogs, 10),
      skills: form.skills.split(',').map((s) => s.trim()).filter(Boolean),
    });
    updateUser(data);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <DashboardLayout title="My Profile" subtitle="Update your academic details for eligibility matching">
      <form onSubmit={handleSubmit} className="max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        {saved && <div className="mb-4 rounded-lg bg-emerald-50 px-4 py-2 text-sm text-emerald-700">Profile updated!</div>}
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700">Email</label>
            <p className="mt-1 text-slate-600">{user?.email}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Name</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="mt-1 w-full rounded-lg border px-3 py-2" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700">CGPA</label>
              <input type="number" step="0.01" value={form.cgpa} onChange={(e) => setForm({ ...form, cgpa: e.target.value })}
                className="mt-1 w-full rounded-lg border px-3 py-2" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Backlogs</label>
              <input type="number" value={form.backlogs} onChange={(e) => setForm({ ...form, backlogs: e.target.value })}
                className="mt-1 w-full rounded-lg border px-3 py-2" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Branch</label>
            <select value={form.branch} onChange={(e) => setForm({ ...form, branch: e.target.value })}
              className="mt-1 w-full rounded-lg border px-3 py-2">
              {BRANCHES.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Skills</label>
            <input value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })}
              className="mt-1 w-full rounded-lg border px-3 py-2" placeholder="React, Node.js, Python" />
          </div>
        </div>
        <button type="submit" className="mt-6 rounded-lg bg-indigo-600 px-6 py-2.5 font-medium text-white hover:bg-indigo-700">
          Save Profile
        </button>
      </form>
    </DashboardLayout>
  );
};

export default Profile;
