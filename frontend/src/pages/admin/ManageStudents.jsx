import { useEffect, useState } from 'react';
import DashboardLayout from '../../components/common/DashboardLayout';
import Loader from '../../components/common/Loader';
import { exportStudentsCsv, getStudents, updateStudentPlacement } from '../../services/adminService';
import { BRANCHES } from '../../utils/constants';

const ManageStudents = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [branch, setBranch] = useState('');
  const [placed, setPlaced] = useState('');
  const [skill, setSkill] = useState('');
  const [resume, setResume] = useState('');

  const load = () => {
    setLoading(true);
    const params = {};
    if (branch) params.branch = branch;
    if (placed) params.placed = placed;
    if (skill) params.skill = skill;
    if (resume) params.resume = resume;
    getStudents(params)
      .then((res) => setStudents(res.data.students || res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [branch, placed, skill, resume]);

  const togglePlaced = async (student) => {
    await updateStudentPlacement(student._id, { isPlaced: !student.isPlaced });
    load();
  };

  const downloadCsv = async () => {
    const { data } = await exportStudentsCsv();
    const url = URL.createObjectURL(new Blob([data], { type: 'text/csv' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'students-export.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <DashboardLayout title="Student Management" subtitle="Filter by branch, CGPA, skills, resume availability, and placement status">
      <div className="mb-6 flex flex-wrap gap-3">
        <select value={branch} onChange={(e) => setBranch(e.target.value)} className="rounded-lg border px-3 py-2 text-sm">
          <option value="">All Branches</option>
          {BRANCHES.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>
        <select value={placed} onChange={(e) => setPlaced(e.target.value)} className="rounded-lg border px-3 py-2 text-sm">
          <option value="">All Students</option>
          <option value="true">Placed</option>
          <option value="false">Unplaced</option>
        </select>
        <input value={skill} onChange={(e) => setSkill(e.target.value)} placeholder="Skill" className="rounded-lg border px-3 py-2 text-sm" />
        <select value={resume} onChange={(e) => setResume(e.target.value)} className="rounded-lg border px-3 py-2 text-sm">
          <option value="">Any Resume</option>
          <option value="available">Resume Available</option>
          <option value="missing">Resume Missing</option>
        </select>
        <button onClick={downloadCsv} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">
          Export CSV
        </button>
      </div>

      {loading ? <Loader /> : (
        <div className="overflow-x-auto rounded-xl border bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Branch</th>
                <th className="px-4 py-3">CGPA</th>
                <th className="px-4 py-3">Backlogs</th>
                <th className="px-4 py-3">Resume</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student._id} className="border-b last:border-0 dark:border-slate-800">
                  <td className="px-4 py-3 font-medium">{student.name}</td>
                  <td className="px-4 py-3 text-slate-500">{student.email}</td>
                  <td className="px-4 py-3">{student.branch}</td>
                  <td className="px-4 py-3">{student.cgpa}</td>
                  <td className="px-4 py-3">{student.backlogs}</td>
                  <td className="px-4 py-3">{student.resumeUrl ? `${student.resumeScore || 0}/100` : 'Missing'}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${student.isPlaced ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                      {student.isPlaced ? 'Placed' : 'Unplaced'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => togglePlaced(student)} className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
                      Toggle
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!students.length && <p className="p-6 text-center text-slate-500">No students found.</p>}
        </div>
      )}
    </DashboardLayout>
  );
};

export default ManageStudents;
