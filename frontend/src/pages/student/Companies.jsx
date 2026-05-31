import { useEffect, useState } from 'react';
import DashboardLayout from '../../components/common/DashboardLayout';
import Loader from '../../components/common/Loader';
import { getCompanies } from '../../services/companyService';

const Companies = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);



  const fetchCompanies = () => {
    getCompanies()
      .then((res) => setCompanies(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchCompanies(); }, []);



  return (
    <DashboardLayout title="Placement Drives" subtitle="Browse and apply to active company drives">

      {loading ? <Loader /> : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {companies.map((c) => (
            <div key={c._id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900">{c.companyName}</h3>
              <p className="text-sm text-indigo-600">{c.role}</p>
              <p className="mt-2 text-sm font-medium text-emerald-600">{c.package}</p>
              <p className="mt-2 text-xs text-slate-500 line-clamp-2">{c.description}</p>
              <div className="mt-3 space-y-1 text-xs text-slate-500">
                <p>Min CGPA: {c.eligibility?.minCgpa}</p>
                <p>Max Backlogs: {c.eligibility?.maxBacklogs}</p>
                <p>Branches: {c.eligibility?.branches?.join(', ') || 'All'}</p>
                <p>Deadline: {new Date(c.deadline).toLocaleDateString()}</p>
              </div>

            </div>
          ))}
          {!companies.length && <p className="col-span-full text-center text-slate-500">No active drives. Check back later.</p>}
        </div>
      )}
    </DashboardLayout>
  );
};

export default Companies;

