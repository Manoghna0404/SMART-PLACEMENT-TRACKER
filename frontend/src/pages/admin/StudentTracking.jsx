import { useEffect, useState } from 'react';
import DashboardLayout from '../../components/common/DashboardLayout';
import Loader from '../../components/common/Loader';
import { getStudents } from '../../services/adminService';
import { BRANCHES } from '../../utils/constants';

const StudentTracking = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [branch, setBranch] = useState('');

  const loadStudents = async () => {
    setLoading(true);
    try {
      const { data } = await getStudents({ branch });
      setStudents(data.students);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, [branch]);

  return (
    <DashboardLayout title="Student Tracking" subtitle="Filter student progress, placement status, and campus readiness">
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <select
          value={branch}
          onChange={(e) => setBranch(e.target.value)}
          className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm shadow-sm focus:border-indigo-500 focus:outline-none"
        >
          <option value="">All branches</option>
          {BRANCHES.map((branchOption) => (
            <option key={branchOption} value={branchOption}>{branchOption}</option>
          ))}
        </select>
      </div>

      {loading ? <Loader /> : (
        <div className="grid gap-4">
          {students.map((student) => (
            <div key={student._id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold text-slate-900">{student.name}</p>
                  <p className="text-sm text-slate-500">{student.email} · {student.branch}</p>
                </div>
                <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">Placed: {student.isPlaced ? 'Yes' : 'No'}</div>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3 text-sm text-slate-600">
                <div>CGPA: {student.cgpa}</div>
                <div>Backlogs: {student.backlogs}</div>
                <div>Resume score: {student.resumeScore || 'N/A'}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
};

export default StudentTracking;
