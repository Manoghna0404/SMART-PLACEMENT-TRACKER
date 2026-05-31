import { useEffect, useState } from 'react';
import DashboardLayout from '../../components/common/DashboardLayout';
import Loader from '../../components/common/Loader';
import { getExperiences, createExperience } from '../../services/interviewService';

const InterviewExperiences = () => {
  const [experiences, setExperiences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    companyName: '', role: '', rounds: 1, difficulty: 'Medium',
    questions: '', experience: '', outcome: 'Pending',
  });

  const load = () => {
    getExperiences().then((res) => setExperiences(res.data)).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await createExperience(form);
    setShowForm(false);
    setForm({ companyName: '', role: '', rounds: 1, difficulty: 'Medium', questions: '', experience: '', outcome: 'Pending' });
    load();
  };

  const diffColor = { Easy: 'bg-emerald-100 text-emerald-700', Medium: 'bg-amber-100 text-amber-700', Hard: 'bg-red-100 text-red-700' };

  return (
    <DashboardLayout title="Interview Experiences" subtitle="Share and learn from peer interview experiences">
      <button onClick={() => setShowForm(!showForm)}
        className="mb-6 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
        {showForm ? 'Cancel' : '+ Share Experience'}
      </button>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="grid gap-4 sm:grid-cols-2">
            <input required placeholder="Company Name" value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })}
              className="rounded-lg border px-3 py-2 sm:col-span-2" />
            <input placeholder="Role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="rounded-lg border px-3 py-2" />
            <select value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })} className="rounded-lg border px-3 py-2">
              {['Easy', 'Medium', 'Hard'].map((d) => <option key={d}>{d}</option>)}
            </select>
            <input type="number" min="1" placeholder="Rounds" value={form.rounds} onChange={(e) => setForm({ ...form, rounds: e.target.value })}
              className="rounded-lg border px-3 py-2" />
            <select value={form.outcome} onChange={(e) => setForm({ ...form, outcome: e.target.value })} className="rounded-lg border px-3 py-2">
              {['Selected', 'Rejected', 'Pending'].map((o) => <option key={o}>{o}</option>)}
            </select>
            <textarea placeholder="Interview questions (one per line)" value={form.questions} onChange={(e) => setForm({ ...form, questions: e.target.value })}
              className="rounded-lg border px-3 py-2 sm:col-span-2" rows={3} />
            <textarea required placeholder="Your experience..." value={form.experience} onChange={(e) => setForm({ ...form, experience: e.target.value })}
              className="rounded-lg border px-3 py-2 sm:col-span-2" rows={4} />
          </div>
          <button type="submit" className="mt-4 rounded-lg bg-indigo-600 px-6 py-2 text-sm font-medium text-white">Submit</button>
        </form>
      )}

      {loading ? <Loader /> : (
        <div className="space-y-4">
          {experiences.map((exp) => (
            <div key={exp._id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-semibold text-slate-900">{exp.companyName}</h3>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${diffColor[exp.difficulty]}`}>{exp.difficulty}</span>
                <span className="text-xs text-slate-500">{exp.rounds} rounds · {exp.outcome}</span>
              </div>
              <p className="mt-1 text-sm text-slate-500">by {exp.studentName} · {exp.role}</p>
              <p className="mt-3 text-sm text-slate-700">{exp.experience}</p>
              {exp.questions?.length > 0 && (
                <ul className="mt-3 list-inside list-disc text-sm text-slate-600">
                  {exp.questions.map((q, i) => <li key={i}>{q}</li>)}
                </ul>
              )}
            </div>
          ))}
          {!experiences.length && <p className="text-slate-500">No experiences shared yet. Be the first!</p>}
        </div>
      )}
    </DashboardLayout>
  );
};

export default InterviewExperiences;
