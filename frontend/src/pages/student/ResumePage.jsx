import { useMemo, useRef, useState } from 'react';

import DashboardLayout from '../../components/common/DashboardLayout';
import useAuthStore from '../../store/authStore';
import { uploadResume, analyzeResume } from '../../services/studentService';
import { getResumeUrl } from '../../utils/api';

const ROLE_OPTIONS = [
  'Software Engineer',
  'Data Analyst',
  'AI/ML Engineer',
  'Full Stack Developer',
  'Cybersecurity',
  'Cloud Engineer',
];

const statusColor = (status) => {
  if (status === 'Good') return 'bg-emerald-100 text-emerald-700';
  if (status === 'Needs Improvement') return 'bg-amber-100 text-amber-700';
  return 'bg-red-100 text-red-700';
};

const ResumePage = () => {
  const { user, updateUser, fetchMe } = useAuthStore();
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [selectedRole, setSelectedRole] = useState('Software Engineer');
  const analysis = user?.resumeAnalysis;
  const roleAnalysisInFlight = useRef(false);
  const debounceRef = useRef(null);

  const lastRoleAnalyzedRef = useRef(selectedRole);


  const scheduleRoleAnalysis = async (role) => {
    // Always re-analyze after role change (do not rely on stale comparison).
    if (role === lastRoleAnalyzedRef.current) return;
    if (!user?.resumeUrl) return;
    if (roleAnalysisInFlight.current) return;

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(async () => {
      if (roleAnalysisInFlight.current) return;
      roleAnalysisInFlight.current = true;
      await handleAnalyze({ roleOverride: role });
      roleAnalysisInFlight.current = false;
    }, 450);
  };

  const handleUpload = async (e) => {

    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { data } = await uploadResume(file, selectedRole);
      updateUser(data);
      await fetchMe();
    } catch (err) {
      alert(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleAnalyze = async ({ roleOverride } = {}) => {
    const role = roleOverride || selectedRole;
    setAnalyzing(true);
    try {
      const { data } = await analyzeResume(role);
      updateUser(data);
      // Ensure role-based analysis refresh is reflected immediately.
      await fetchMe();
    } catch (err) {
      alert(err.response?.data?.message || 'Analysis failed');
    } finally {
      setAnalyzing(false);
    }
  };



  const scoreColor = (score) => {
    if (score >= 80) return 'text-emerald-600';
    if (score >= 60) return 'text-amber-600';
    return 'text-red-600';
  };


  const sectionCards = useMemo(() => {
    if (!analysis?.sections) return [];
    return Object.entries(analysis.sections).map(([key, section]) => ({
      key,
      title: {
        objective: 'Objective / Summary',
        education: 'Education',
        skills: 'Skills',
        projects: 'Projects',
        experience: 'Experience',
        internships: 'Internships',
        certifications: 'Certifications',
        achievements: 'Achievements',
        technicalSkills: 'Technical Skills',
        softSkills: 'Soft Skills',
      }[key] || key,
      section,
    }));
  }, [analysis]);

  return (
    <DashboardLayout title="Resume Analyzer" subtitle="AI-powered resume scoring and keyword analysis">
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-slate-900">Resume Role Focus</h2>
          <p className="mt-1 text-sm text-slate-500">Select the role that best matches your target job.</p>
          <select
            value={selectedRole}
            onChange={(e) => {
              const nextRole = e.target.value;
              setSelectedRole(nextRole);
              scheduleRoleAnalysis(nextRole);
            }}

            className="mt-4 w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-800 shadow-sm focus:border-indigo-500 focus:outline-none"
          >

            {ROLE_OPTIONS.map((role) => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>
          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-medium text-slate-900">Resume Upload</p>
            <p className="mt-2 text-sm text-slate-600">Upload a PDF resume and get a detailed section-wise review.</p>
            <label className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-indigo-200 bg-indigo-50/60 p-6 text-center hover:bg-indigo-50">
              <span className="text-4xl">📄</span>
              <span className="mt-2 text-sm font-medium text-indigo-700">
                {uploading ? 'Uploading...' : 'Choose PDF resume'}
              </span>
              <input type="file" accept=".pdf" onChange={handleUpload} className="hidden" disabled={uploading} />
            </label>
            {user?.resumeUrl && (
              <a href={getResumeUrl(user.resumeUrl)} target="_blank" rel="noreferrer"
                className="mt-3 inline-block text-sm text-indigo-600 hover:underline">
                View uploaded resume
              </a>
            )}


          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="font-semibold text-slate-900">Overall Analysis</h2>
            {user?.resumeScore ? (
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 p-5">
                  <div className="flex items-end gap-3">
                    <span className={`text-5xl font-bold ${scoreColor(user.resumeScore)}`}>{user.resumeScore}</span>
                    <span className="text-slate-500">/ 100</span>
                  </div>
                  <p className="mt-2 text-sm font-medium text-slate-700">{analysis?.grade}</p>
                  {analysis?.aiPowered && (
                    <span className="mt-3 inline-flex items-center rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700">
                      AI Enhanced
                    </span>
                  )}
                </div>
                <div className="rounded-2xl border border-slate-200 p-5">
                  <h3 className="text-sm font-semibold text-slate-900">Key Suggestions</h3>
                  <ul className="mt-3 space-y-2 text-sm text-slate-600">
                    {analysis?.improvements?.length > 0 ? (
                      analysis.improvements.slice(0, 4).map((line, idx) => (
                        <li key={idx} className="before:content-['•'] before:mr-2 before:text-indigo-500">{line}</li>
                      ))
                    ) : (
                      <li>No immediate changes detected. Your resume looks well structured.</li>
                    )}
                  </ul>
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-500">Upload a resume to get detailed section feedback, strengths, and ATS suggestions.</p>
            )}
          </div>

          {analysis?.sections && (
            <div className="space-y-4">
              {sectionCards.map(({ key, title, section }) => (
                <details key={key} className="group rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <summary className="flex cursor-pointer items-center justify-between gap-4 text-left">
                    <div>
                      <p className="text-base font-semibold text-slate-900">{title}</p>
                      <p className="mt-1 text-sm text-slate-500">{section.feedback?.[0]}</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusColor(section.status)}`}>{section.status}</span>
                  </summary>
                  <div className="mt-4 space-y-4">
                    {section.summary ? (
                      <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
                        <p className="font-medium text-slate-900">Detected content</p>
                        <p className="mt-2 whitespace-pre-line">{section.summary}</p>
                      </div>
                    ) : null}
                    {section.suggestions?.length > 0 && (
                      <div>
                        <p className="text-sm font-semibold text-slate-900">Suggestions</p>
                        <ul className="mt-2 space-y-2 text-sm text-slate-600">
                          {section.suggestions.map((suggestion, idx) => (
                            <li key={idx} className="before:content-['•'] before:mr-2 before:text-slate-500">{suggestion}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {section.atsTips?.length > 0 && (
                      <div>
                        <p className="text-sm font-semibold text-slate-900">ATS Optimization</p>
                        <ul className="mt-2 space-y-2 text-sm text-slate-600">
                          {section.atsTips.map((tip, idx) => (
                            <li key={idx} className="before:content-['•'] before:mr-2 before:text-indigo-500">{tip}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {section.roleTips?.length > 0 && (
                      <div>
                        <p className="text-sm font-semibold text-slate-900">Role-specific advice</p>
                        <ul className="mt-2 space-y-2 text-sm text-slate-600">
                          {section.roleTips.map((tip, idx) => (
                            <li key={idx} className="before:content-['•'] before:mr-2 before:text-violet-500">{tip}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {section.rewrite && (
                      <div className="rounded-3xl border border-indigo-100 bg-indigo-50 p-4 text-sm text-slate-800">
                        <p className="text-sm font-medium text-indigo-700">Suggested rewrite</p>
                        <p className="mt-2 whitespace-pre-line">{section.rewrite}</p>
                      </div>
                    )}

                    {section.replaceSuggestions?.length > 0 && (
                      <div>
                        <p className="text-sm font-semibold text-slate-900">Replace this with this</p>
                        <div className="mt-3 space-y-3">
                          {section.replaceSuggestions.map((item, idx) => (
                            <div key={idx} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                              <p className="text-xs font-semibold text-slate-500">{item.section || title}</p>
                              <p className="mt-2 text-xs text-slate-500">Original</p>
                              <div className="mt-1 rounded-2xl bg-white p-3 text-sm text-slate-700">
                                {item.original || 'No content detected'}
                              </div>
                              <p className="mt-3 text-xs text-slate-500">Improved version</p>
                              <div className="mt-1 rounded-2xl bg-white p-3 text-sm text-slate-700">
                                {item.improved || '—'}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </details>
              ))}
            </div>
          )}

          {analysis?.replaceSuggestions?.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="font-semibold text-slate-900">Replace This With This</h2>
              <div className="mt-4 space-y-4 text-sm text-slate-700">
                {analysis.replaceSuggestions.map((item, idx) => (
                  <div key={idx} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    <p className="font-semibold text-slate-900">{item.section}</p>
                    <p className="mt-2 text-slate-500">Original</p>
                    <div className="mt-1 rounded-2xl bg-white p-3 text-slate-700">{item.original || 'No content detected'}</div>
                    <p className="mt-3 text-slate-500">Improved version</p>
                    <div className="mt-1 rounded-2xl bg-white p-3 text-slate-700">{item.improved}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ResumePage;
