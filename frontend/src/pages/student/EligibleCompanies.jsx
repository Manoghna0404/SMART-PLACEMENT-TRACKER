import { useEffect, useState } from 'react';
import DashboardLayout from '../../components/common/DashboardLayout';
import Loader from '../../components/common/Loader';
import { getEligibleCompanies } from '../../services/companyService';
import { applyToCompany } from '../../services/applicationService';

const EligibleCompanies = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getEligibleCompanies().then((res) => setItems(res.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout title="Eligible Companies" subtitle="Companies you qualify for based on CGPA, branch & backlogs">
      {loading ? <Loader /> : items.length === 0 ? (
        <div className="rounded-xl bg-amber-50 p-6 text-amber-800">
          No eligible companies found. Update your profile CGPA, branch, or backlogs.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {items.map(({ company }) => (
            <div key={company._id} className="rounded-xl border-2 border-emerald-200 bg-emerald-50/50 p-5">
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">Eligible</span>
              <h3 className="mt-2 text-lg font-semibold">{company.companyName}</h3>
              <p className="text-sm text-slate-600">{company.role} · {company.package}</p>
              <p className="mt-2 text-xs text-slate-500">Deadline: {new Date(company.deadline).toLocaleDateString()}</p>
              <button
                onClick={() => applyToCompany(company._id).then(() => alert('Applied!')).catch((e) => alert(e.response?.data?.message))}
                className="mt-3 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
              >
                Quick Apply
              </button>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
};

export default EligibleCompanies;
