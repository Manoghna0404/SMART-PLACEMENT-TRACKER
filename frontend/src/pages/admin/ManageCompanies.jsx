import { useEffect, useState } from 'react';
import DashboardLayout from '../../components/common/DashboardLayout';
import Loader from '../../components/common/Loader';
import { getCompanies, addCompany, updateCompany, deleteCompany } from '../../services/companyService';
import { BRANCHES } from '../../utils/constants';

const roundTypes = ['Application', 'Aptitude', 'Coding', 'Technical', 'GD', 'Managerial', 'HR', 'Offer', 'Other'];

const defaultRounds = [
  { name: 'Applied', type: 'Application', sequence: 1, passingCriteria: 'Application submitted' },
  { name: 'Round 1', type: 'Aptitude', sequence: 2, passingCriteria: 'Aptitude qualified' },
  { name: 'Round 2', type: 'Technical', sequence: 3, passingCriteria: 'Technical round qualified' },
  { name: 'HR Round', type: 'HR', sequence: 4, passingCriteria: 'HR qualified' },
  { name: 'Offer Released', type: 'Offer', sequence: 5, passingCriteria: 'Final offer' },
];

const emptyForm = {
  companyName: '',
  role: '',
  package: '',
  description: '',
  eligibility: { minCgpa: 6, maxBacklogs: 0, branches: ['CSE'] },
  deadline: '',
  rounds: defaultRounds,
};

const ManageCompanies = () => {
  const [companies, setCompanies] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const load = () => {
    setLoading(true);
    getCompanies().then((res) => setCompanies(res.data)).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      rounds: form.rounds.map((round, index) => ({ ...round, sequence: index + 1 })),
    };
    if (editingId) await updateCompany(editingId, payload);
    else await addCompany(payload);
    setForm(emptyForm);
    setEditingId('');
    setShowForm(false);
    load();
  };

  const toggleBranch = (branch) => {
    const branches = form.eligibility.branches.includes(branch)
      ? form.eligibility.branches.filter((b) => b !== branch)
      : [...form.eligibility.branches, branch];
    setForm({ ...form, eligibility: { ...form.eligibility, branches } });
  };

  const updateRound = (index, key, value) => {
    const rounds = form.rounds.map((round, idx) => (idx === index ? { ...round, [key]: value } : round));
    setForm({ ...form, rounds });
  };

  const moveRound = (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= form.rounds.length) return;
    const rounds = [...form.rounds];
    [rounds[index], rounds[target]] = [rounds[target], rounds[index]];
    setForm({ ...form, rounds });
  };

  const startEdit = (company) => {
    setEditingId(company._id);
    setForm({
      companyName: company.companyName || '',
      role: company.role || '',
      package: company.package || '',
      description: company.description || '',
      eligibility: {
        minCgpa: company.eligibility?.minCgpa ?? 6,
        maxBacklogs: company.eligibility?.maxBacklogs ?? 0,
        branches: company.eligibility?.branches?.length ? company.eligibility.branches : ['CSE'],
      },
      deadline: company.deadline ? new Date(company.deadline).toISOString().slice(0, 10) : '',
      rounds: company.rounds?.length ? company.rounds : defaultRounds,
    });
    setShowForm(true);
  };

  return (
    <DashboardLayout title="Placement Drives" subtitle="Create drives with configurable recruitment rounds">
      <button onClick={() => { setShowForm(!showForm); setEditingId(''); setForm(emptyForm); }}
        className="mb-6 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
        {showForm ? 'Cancel' : '+ Add Drive'}
      </button>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-8 rounded-xl border bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="grid gap-4 sm:grid-cols-2">
            <input required placeholder="Company Name" value={form.companyName}
              onChange={(e) => setForm({ ...form, companyName: e.target.value })} className="rounded-lg border px-3 py-2 dark:border-slate-700 dark:bg-slate-950" />
            <input required placeholder="Job Role" value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })} className="rounded-lg border px-3 py-2 dark:border-slate-700 dark:bg-slate-950" />
            <input required placeholder="Package (e.g. 6 LPA)" value={form.package}
              onChange={(e) => setForm({ ...form, package: e.target.value })} className="rounded-lg border px-3 py-2 dark:border-slate-700 dark:bg-slate-950" />
            <input required type="date" value={form.deadline}
              onChange={(e) => setForm({ ...form, deadline: e.target.value })} className="rounded-lg border px-3 py-2 dark:border-slate-700 dark:bg-slate-950" />
            <input type="number" step="0.1" placeholder="Min CGPA" value={form.eligibility.minCgpa}
              onChange={(e) => setForm({ ...form, eligibility: { ...form.eligibility, minCgpa: parseFloat(e.target.value) || 0 } })}
              className="rounded-lg border px-3 py-2 dark:border-slate-700 dark:bg-slate-950" />
            <input type="number" placeholder="Max Backlogs" value={form.eligibility.maxBacklogs}
              onChange={(e) => setForm({ ...form, eligibility: { ...form.eligibility, maxBacklogs: parseInt(e.target.value, 10) || 0 } })}
              className="rounded-lg border px-3 py-2 dark:border-slate-700 dark:bg-slate-950" />
            <textarea placeholder="Description" value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="rounded-lg border px-3 py-2 dark:border-slate-700 dark:bg-slate-950 sm:col-span-2" rows={2} />
            <div className="sm:col-span-2">
              <p className="mb-2 text-sm font-medium">Eligible Branches</p>
              <div className="flex flex-wrap gap-2">
                {BRANCHES.map((b) => (
                  <button key={b} type="button" onClick={() => toggleBranch(b)}
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      form.eligibility.branches.includes(b) ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-200'
                    }`}>{b}</button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold">Recruitment Rounds</p>
              <button type="button" onClick={() => setForm({ ...form, rounds: [...form.rounds, { name: `Round ${form.rounds.length}`, type: 'Other', sequence: form.rounds.length + 1, passingCriteria: '' }] })}
                className="rounded-lg border px-3 py-1.5 text-xs font-medium dark:border-slate-700">Add round</button>
            </div>
            <div className="space-y-3">
              {form.rounds.map((round, index) => (
                <div key={`${round.name}-${index}`} className="grid gap-3 rounded-lg border border-slate-200 p-3 dark:border-slate-800 md:grid-cols-[1.2fr_0.8fr_1.5fr_auto]">
                  <input value={round.name} onChange={(e) => updateRound(index, 'name', e.target.value)} className="rounded-lg border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950" />
                  <select value={round.type} onChange={(e) => updateRound(index, 'type', e.target.value)} className="rounded-lg border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950">
                    {roundTypes.map((type) => <option key={type} value={type}>{type}</option>)}
                  </select>
                  <input value={round.passingCriteria || ''} onChange={(e) => updateRound(index, 'passingCriteria', e.target.value)} placeholder="Passing criteria" className="rounded-lg border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950" />
                  <div className="flex gap-2">
                    <button type="button" onClick={() => moveRound(index, -1)} className="rounded-lg border px-3 py-2 text-xs dark:border-slate-700">Up</button>
                    <button type="button" onClick={() => moveRound(index, 1)} className="rounded-lg border px-3 py-2 text-xs dark:border-slate-700">Down</button>
                    <button type="button" onClick={() => setForm({ ...form, rounds: form.rounds.filter((_, idx) => idx !== index) })} className="rounded-lg border border-red-200 px-3 py-2 text-xs text-red-600">Remove</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button type="submit" className="mt-5 rounded-lg bg-indigo-600 px-6 py-2 text-sm font-medium text-white">
            {editingId ? 'Save Drive' : 'Create Drive'}
          </button>
        </form>
      )}

      {loading ? <Loader /> : (
        <div className="overflow-x-auto rounded-xl border bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300">
              <tr>
                <th className="px-4 py-3">Company</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Package</th>
                <th className="px-4 py-3">Rounds</th>
                <th className="px-4 py-3">Deadline</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {companies.map((c) => (
                <tr key={c._id} className="border-b last:border-0 dark:border-slate-800">
                  <td className="px-4 py-3 font-medium">{c.companyName}</td>
                  <td className="px-4 py-3">{c.role}</td>
                  <td className="px-4 py-3 text-emerald-600">{c.package}</td>
                  <td className="px-4 py-3">{(c.rounds || []).map((round) => round.name).join(' -> ')}</td>
                  <td className="px-4 py-3">{new Date(c.deadline).toLocaleDateString()}</td>
                  <td className="space-x-3 px-4 py-3">
                    <button onClick={() => startEdit(c)} className="text-indigo-600 hover:text-indigo-700">Edit</button>
                    <button onClick={() => deleteCompany(c._id).then(load)} className="text-red-600 hover:text-red-700">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardLayout>
  );
};

export default ManageCompanies;
