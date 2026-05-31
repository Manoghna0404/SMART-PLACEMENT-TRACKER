import { useEffect, useState } from 'react';
import DashboardLayout from '../../components/common/DashboardLayout';
import Loader from '../../components/common/Loader';
import {
  adminGetTests,
  adminCreateTest,
  adminActivateTest,
  adminDeactivateTest,
  adminRegenerateTest,
  getEligibleStudentsForCompany,
  checkQuestionAvailability,
} from '../../services/testService';
import { getCompanies } from '../../services/companyService';
import { getQuestionMeta } from '../../services/questionBankService';
import useQuestionBankStore from '../../store/questionBankStore';

const emptyForm = {
  title: '',
  description: '',
  duration: 30,
  numberOfQuestions: 10,
  topics: [],
  difficulty: 'Mixed',
  testType: 'general',
  companyId: '',
};

const ManageTests = () => {
  const [tests, setTests] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [meta, setMeta] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [eligibleStudentData, setEligibleStudentData] = useState({ count: 0, preview: [] });
  const [fetchingEligibleStudents, setFetchingEligibleStudents] = useState(false);

  const selectedCompany = companies.find((c) => c._id === form.companyId);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  const [busyTestIds, setBusyTestIds] = useState(new Set());
  const [createBusy, setCreateBusy] = useState(false);
  const [excludedQuestionBankIds, setExcludedQuestionBankIds] = useState([]);
  const [latestQuestionBankIds, setLatestQuestionBankIds] = useState([]);


  const [availabilityInfo, setAvailabilityInfo] = useState(null);
  const [checkingAvailability, setCheckingAvailability] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([adminGetTests(), getCompanies(), getQuestionMeta()])
      .then(([t, c, m]) => {
        setTests(t.data);
        setCompanies(c.data);
        setMeta(m.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const fetchEligible = async () => {
      if (form.testType !== 'company' || !form.companyId) {
        setEligibleStudentData({ count: 0, preview: [] });
        return;
      }

      try {
        setFetchingEligibleStudents(true);
        const response = await getEligibleStudentsForCompany(form.companyId);
        setEligibleStudentData({
          count: response.data.count,
          preview: response.data.preview || [],
        });
      } catch (err) {
        console.error('[MANAGE_TESTS] Failed to load eligible students:', err);
        setEligibleStudentData({ count: 0, preview: [] });
      } finally {
        setFetchingEligibleStudents(false);
      }
    };

    fetchEligible();
  }, [form.testType, form.companyId]);



  const selectedTopicSet = useQuestionBankStore((s) => s.selectedTopicSet);
  const setSelectedTopicSet = useQuestionBankStore((s) => s.setSelectedTopicSet);
  const setTopicQuestions = useQuestionBankStore((s) => s.setTopicQuestions);

  const [topicQuestions, setLocalTopicQuestions] = useState([]);
  const [setLoadingQuestions, setSetLoadingQuestions] = useState(false);

  const loadQuestionsForBankSet = async (bankSetKey, topicName = '') => {
    // No “Filter Bank Topics” UI. For sets-only mode we only filter by bankSet.
    // Reuse the existing Question Bank endpoint.
    const { getQuestions } = await import('../../services/questionBankService');
    setSetLoadingQuestions(true);
    try {
      const { data } = await getQuestions({ topicName, bankSet: bankSetKey, limit: 200 });
      const q = data?.questions || [];
      setLocalTopicQuestions(q);
      setTopicQuestions(q);
      setSelectedTopicSet({ topicName, bankSet: bankSetKey });
      setShowForm(true);
    } finally {
      setSetLoadingQuestions(false);
    }
  };

  const clearQuestionBankSelection = () => {
    setLocalTopicQuestions([]);
    setTopicQuestions([]);
    setSelectedTopicSet({ topicName: '', bankSet: '' });
  };

  useEffect(() => {
    if (selectedTopicSet.bankSet) {
      loadQuestionsForBankSet(selectedTopicSet.bankSet, selectedTopicSet.topicName || '');
    }
  }, []);

  // Check question availability before submission
  const checkAvailability = async () => {
    try {
      setCheckingAvailability(true);
      const topicNames = [];


      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
      console.log('[MANAGE_TESTS] Checking question availability:', {
        apiUrl: `${apiBaseUrl}/tests/admin/check-availability`,
        topicNames,
        difficulty: form.difficulty,
        numberOfQuestions: parseInt(form.numberOfQuestions, 10),
        bankSet: selectedTopicSet.bankSet || undefined,
      });

      const response = await checkQuestionAvailability({
        topicNames,
        difficulty: form.difficulty,
        numberOfQuestions: parseInt(form.numberOfQuestions, 10),
        bankSet: selectedTopicSet.bankSet || undefined,
      });

      setAvailabilityInfo(response.data);

      if (!response.data.isAvailable) {
        setMessage(response.data.message);
        setMessageType('error');
        return false;
      }
      setMessage('');
      return true;
    } catch (err) {
      console.error('Availability check failed:', err);
      const responseData = err.response?.data;
      const errorMessage =
        responseData?.message ||
        responseData?.error ||
        (typeof responseData === 'string' ? responseData : responseData ? JSON.stringify(responseData) : undefined) ||
        err.message ||
        'Unable to check question availability';
      setMessage(errorMessage);
      setMessageType('error');
      return false;
    } finally {
      setCheckingAvailability(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    // Pre-submission validation
    if (!form.title.trim()) {
      setMessageType('error');
      setMessage('Test title is required');
      return;
    }

    if (form.duration < 1) {
      setMessageType('error');
      setMessage('Duration must be at least 1 minute');
      return;
    }

    if (form.numberOfQuestions < 1) {
      setMessageType('error');
      setMessage('Number of questions must be at least 1');
      return;
    }

    if (form.testType === 'company') {
      if (!form.companyId) {
        setMessageType('error');
        setMessage('Please select a company for company-specific tests');
        return;
      }
    }

    // Check question availability
    const isAvailable = await checkAvailability();
    if (!isAvailable) {
      return;
    }

    try {
      setCreateBusy(true);
      const topicNames = selectedTopicSet.topicName ? [selectedTopicSet.topicName] : [];

      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ;
      const createPayload = {
        ...form,
        duration: parseInt(form.duration, 10),
        numberOfQuestions: parseInt(form.numberOfQuestions, 10),
        companyId: form.testType === 'company' ? form.companyId : undefined,
        topicNames,
        bankSet: selectedTopicSet.bankSet || undefined,
        excludeQuestionBankIds: excludedQuestionBankIds,
      };
      console.log('[MANAGE_TESTS] Creating test:', {
        apiUrl: `${apiBaseUrl}/tests/admin/create`,
        topicNames,
        selectedBankSet: selectedTopicSet.bankSet,
        payload: {
          title: createPayload.title,
          duration: createPayload.duration,
          numberOfQuestions: createPayload.numberOfQuestions,
          difficulty: createPayload.difficulty,
          testType: createPayload.testType,
          bankSet: createPayload.bankSet,
        },
      });

      const response = await adminCreateTest(createPayload);

      setMessageType('success');
      setMessage('Test created with auto-generated questions from bank!');
      setLatestQuestionBankIds(response.data.questions?.map((q) => q.questionBankId).filter(Boolean) || []);
      setShowForm(false);
      load();


    } catch (err) {
      console.error('[MANAGE_TESTS] Test creation failed:', {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
      });

      setMessageType('error');
      const responseData = err.response?.data;
      const errorMessage =
        responseData?.message ||
        responseData?.error ||
        (typeof responseData === 'string' ? responseData : responseData ? JSON.stringify(responseData) : undefined) ||
        err.message ||
        'Failed to create test. Please try again.';
      setMessage(errorMessage);

      if (err.response) {
        console.error('[MANAGE_TESTS] Create test HTTP response:', {
          status: err.response.status,
          statusText: err.response.statusText,
          data: err.response.data,
        });
      } else {
        console.error('[MANAGE_TESTS] Create test failed without HTTP response:', err);
      }

      if (responseData?.debugInfo) {
        console.log('[MANAGE_TESTS] Debug Info:', responseData.debugInfo);
      }
    } finally {
      setCreateBusy(false);
    }
  };





  const runWithBusy = async (testId, fn) => {
    setBusyTestIds((prev) => {
      const next = new Set(prev);
      next.add(testId);
      return next;
    });
    try {
      await fn();
      load();
    } catch (err) {
      setMessageType('error');
      setMessage(err.response?.data?.message || err.message || 'Action failed');
    } finally {
      setBusyTestIds((prev) => {
        const next = new Set(prev);
        next.delete(testId);
        return next;
      });
    }
  };

  return (
    <DashboardLayout title="Manage Online Tests" subtitle="Create tests — questions are randomly picked from the question bank">
      <button
        onClick={() => {
          setMessage('');
          setShowForm((v) => !v);
        }}
        className="mb-6 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
      >
        {showForm ? 'Cancel' : '+ Create Test'}
      </button>

      {message && (
        <div
          className={`mb-4 rounded-lg px-4 py-3 text-sm ${
            messageType === 'success'
              ? 'bg-emerald-50 text-emerald-700'
              : messageType === 'warning'
              ? 'bg-amber-50 text-amber-700'
              : 'bg-red-50 text-red-700'
          }`}
        >
          {message}
        </div>
      )}

      <div className="mb-6 rounded-xl border bg-white p-4 shadow-sm">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-900">Question Bank Topics and Sets</p>
            <p className="text-sm text-slate-500">Select a topic and set to preview available bank questions before generating the test.</p>
          </div>
        </div>

        {meta?.topicSummary?.length ? (
          <div className="overflow-x-auto rounded-lg">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b bg-slate-100 text-slate-600">
                <tr>
                  <th className="px-4 py-3">Topic</th>
                  <th className="px-4 py-3">Total Questions</th>
                  <th className="px-4 py-3">Set1</th>
                  <th className="px-4 py-3">Set2</th>
                  <th className="px-4 py-3">Set3</th>
                </tr>
              </thead>
              <tbody>
                {meta.topicSummary.map((topic) => (
                  <tr key={topic.topicName} className="border-b last:border-0 hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">{topic.topicName}</td>
                    <td className="px-4 py-3">{topic.totalQuestions}</td>
                    {['set1', 'set2', 'set3'].map((setKey) => {
                      const count = topic.bankSets?.find((row) => row.bankSet === setKey)?.count || 0;
                      const isActive = selectedTopicSet.topicName === topic.topicName && selectedTopicSet.bankSet === setKey;
                      return (
                        <td key={`${topic.topicName}-${setKey}`} className="px-4 py-3">
                          <button
                            type="button"
                            disabled={count === 0}
                            onClick={() => loadQuestionsForBankSet(setKey, topic.topicName)}
                            className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                              isActive ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            } ${count === 0 ? 'cursor-not-allowed opacity-50' : ''}`}
                          >
                            {count > 0 ? `${setKey.toUpperCase()} (${count})` : `${setKey.toUpperCase()} — Used`}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-slate-500">No available question bank topics found. Upload question bank data first.</p>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-8 rounded-xl border bg-white p-6 shadow-sm">
          <div className="grid gap-4 sm:grid-cols-2">
            <input
              required
              placeholder="Test Title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="rounded-lg border px-3 py-2 sm:col-span-2"
            />
            <textarea
              placeholder="Description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="rounded-lg border px-3 py-2 sm:col-span-2"
              rows={2}
            />
            <input
              required
              type="number"
              min="1"
              placeholder="Duration (minutes)"
              value={form.duration}
              onChange={(e) => setForm({ ...form, duration: e.target.value })}
              className="rounded-lg border px-3 py-2"
            />
            <input
              required
              type="number"
              min="1"
              placeholder="Number of Questions"
              value={form.numberOfQuestions}
              onChange={(e) => setForm({ ...form, numberOfQuestions: e.target.value })}
              className="rounded-lg border px-3 py-2"
            />
            <select
              value={form.difficulty}
              onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
              className="rounded-lg border px-3 py-2"
            >
              {['Mixed', 'Easy', 'Medium', 'Hard'].map((d) => <option key={d}>{d}</option>)}
            </select>
            <select
              value={form.testType}
              onChange={(e) => setForm({ ...form, testType: e.target.value })}
              className="rounded-lg border px-3 py-2"
            >
              <option value="general">General Test</option>
              <option value="company">Company Specific Test</option>
            </select>

            {form.testType === 'company' && (
              <>
                <select
                  required
                  value={form.companyId}
                  onChange={(e) => setForm({ ...form, companyId: e.target.value })}
                  className="rounded-lg border px-3 py-2 sm:col-span-2"
                >
                  <option value="">Select Company</option>
                  {companies.map((c) => <option key={c._id} value={c._id}>{c.companyName}</option>)}
                </select>
                <div className="sm:col-span-2 rounded-lg border bg-slate-50 p-4">
                  <p className="mb-2 text-sm font-medium">Eligible Students</p>
                  <p className="text-sm text-slate-600">
                    {selectedCompany
                      ? fetchingEligibleStudents
                        ? 'Loading eligible students...'
                        : `${eligibleStudentData.count} students currently meet eligibility for ${selectedCompany.companyName}.`
                      : 'Select a company to preview eligible students.'}
                  </p>
                  {selectedCompany && eligibleStudentData.preview.length > 0 && (
                    <div className="mt-3 max-h-40 overflow-y-auto rounded-lg border bg-white p-3 text-sm text-slate-700">
                      {eligibleStudentData.preview.map((s) => (
                        <p key={s._id}>{s.name} ({s.email})</p>
                      ))}
                      {eligibleStudentData.count > eligibleStudentData.preview.length && (
                        <p className="mt-2 text-xs text-slate-500">And {eligibleStudentData.count - eligibleStudentData.preview.length} more eligible students...</p>
                      )}
                    </div>
                  )}
                  {selectedCompany && !fetchingEligibleStudents && eligibleStudentData.count === 0 && (
                    <p className="mt-3 text-sm text-amber-700">No students currently meet eligibility for this company.</p>
                  )}
                </div>
              </>
            )}



            {availabilityInfo && (
              <div
                className={`rounded-lg px-3 py-2 text-xs sm:col-span-2 ${
                  availabilityInfo.isAvailable
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-amber-50 text-amber-700'
                }`}
              >
                <strong>Question Bank Status:</strong> {availabilityInfo.message}
              </div>
            )}
          </div>

          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">Question Bank Topics and Sets</p>
                <p className="text-sm text-slate-500">Select a topic and a bank set to preview questions before generating the test.</p>
              </div>
              {selectedTopicSet.bankSet && (
                <button
                  type="button"
                  onClick={clearQuestionBankSelection}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1 text-xs text-slate-700 hover:bg-slate-100"
                >
                  Clear selection
                </button>
              )}
            </div>

            {meta?.topicSummary?.length ? (
              <div className="overflow-x-auto rounded-lg bg-white shadow-sm">
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b bg-slate-100 text-slate-600">
                    <tr>
                      <th className="px-4 py-3">Topic</th>
                      <th className="px-4 py-3">Total Questions</th>
                      <th className="px-4 py-3">Set1</th>
                      <th className="px-4 py-3">Set2</th>
                      <th className="px-4 py-3">Set3</th>
                    </tr>
                  </thead>
                  <tbody>
                    {meta.topicSummary.map((topic) => (
                      <tr key={topic.topicName} className="border-b last:border-0 hover:bg-slate-50">
                        <td className="px-4 py-3 font-medium text-slate-900">{topic.topicName}</td>
                        <td className="px-4 py-3">{topic.totalQuestions}</td>
                        {['set1', 'set2', 'set3'].map((setKey) => {
                          const count = topic.bankSets?.find((row) => row.bankSet === setKey)?.count || 0;
                          const isActive = selectedTopicSet.topicName === topic.topicName && selectedTopicSet.bankSet === setKey;
                          return (
                            <td key={`${topic.topicName}-${setKey}`} className="px-4 py-3">
                              <button
                                type="button"
                                disabled={count === 0}
                                onClick={() => loadQuestionsForBankSet(setKey, topic.topicName)}
                                className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                                  isActive ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                } ${count === 0 ? 'cursor-not-allowed opacity-50' : ''}`}
                              >
                                {count > 0 ? `${setKey.toUpperCase()} (${count})` : `${setKey.toUpperCase()} — Used`}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-slate-500">No available question bank topics found. Upload questions in the Question Bank to begin.</p>
            )}
          </div>

          {selectedTopicSet.bankSet && (
            <div className="mt-6 overflow-x-auto rounded-xl border bg-white shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-slate-50 px-4 py-3 text-sm text-slate-600">
                <div>
                  <p className="font-semibold text-slate-900">
                    {selectedTopicSet.topicName
                      ? `${selectedTopicSet.bankSet.toUpperCase()} Questions for ${selectedTopicSet.topicName}`
                      : `${selectedTopicSet.bankSet.toUpperCase()} Questions`}
                  </p>
                  <p className="text-xs text-slate-500">
                    {selectedTopicSet.topicName
                      ? 'Showing only questions for the selected topic and set.'
                      : 'Showing questions for the selected set.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={clearQuestionBankSelection}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1 text-xs text-slate-700 hover:bg-slate-100"
                >
                  Clear selection
                </button>
              </div>
              <table className="w-full text-left text-sm">
                <thead className="border-b bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-4 py-3">Question</th>
                    <th className="px-4 py-3">Difficulty</th>
                    <th className="px-4 py-3">Set</th>
                  </tr>
                </thead>
                <tbody>
                  {topicQuestions.map((q) => (
                    <tr key={q._id} className="border-b last:border-0 hover:bg-slate-50">
                      <td className="px-4 py-3 max-w-xl break-all">{q.questionText}</td>
                      <td className="px-4 py-3">{q.difficulty}</td>
                      <td className="px-4 py-3">{q.bankSet?.toUpperCase() || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {setLoadingQuestions && <p className="p-6 text-center text-slate-500">Loading questions...</p>}
              {!setLoadingQuestions && !topicQuestions.length && (
                <p className="p-6 text-center text-slate-500">No questions found for this selection.</p>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={createBusy || checkingAvailability}
            className="mt-4 rounded-lg bg-indigo-600 px-6 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {checkingAvailability
              ? 'Checking availability...'
              : createBusy
              ? 'Generating...'
              : 'Generate Test from Question Bank'}
          </button>
        </form>
      )}



      {loading ? (
        <Loader />
      ) : (
        <div className="space-y-4">
          {tests.map((t) => {
            const isBusy = busyTestIds.has(t._id);
            return (
              <div key={t._id} className="rounded-xl border bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{t.title}</h3>
                      {!t.isActive && (
                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-red-700">
                          Inactive
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-500">{t.description}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      {t.testType} · {t.questions?.length} questions · {t.duration} min · {t.difficulty}
                    </p>
                    {t.testType === 'company' && (
                      <p className="text-xs text-violet-600">
                        {t.companyId?.companyName} · {t.eligibleStudentCount ?? 0} eligible students
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => runWithBusy(t._id, async () => {
                        await adminRegenerateTest(t._id);
                        setMessageType('success');
                        setMessage('Questions regenerated successfully.');
                      })}
                      disabled={isBusy}
                      className="rounded-lg border px-3 py-1 text-xs hover:bg-slate-50 disabled:opacity-50"
                      type="button"
                      title="Regenerate questions from question bank"
                    >
                      {isBusy ? 'Updating...' : 'Regenerate Questions'}
                    </button>
                    {t.isActive ? (
                      <button
                        onClick={() => runWithBusy(t._id, async () => {
                          await adminDeactivateTest(t._id);
                          setMessageType('success');
                          setMessage('Test deactivated successfully.');
                        })}
                        disabled={isBusy}
                        className="rounded-lg border border-red-200 px-3 py-1 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50"
                        type="button"
                        title="Deactivate test (won't show to students)"
                      >
                        {isBusy ? 'Updating...' : 'Deactivate'}
                      </button>
                    ) : (
                      <button
                        onClick={() => runWithBusy(t._id, async () => {
                          await adminActivateTest(t._id);
                          setMessageType('success');
                          setMessage('Test activated successfully.');
                        })}
                        disabled={isBusy}
                        className="rounded-lg border border-green-200 px-3 py-1 text-xs text-emerald-600 hover:bg-emerald-50 disabled:opacity-50"
                        type="button"
                        title="Activate test"
                      >
                        {isBusy ? 'Updating...' : 'Activate'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {!tests.length && <p className="text-slate-500">No tests created yet.</p>}
        </div>
      )}
    </DashboardLayout>
  );
};

export default ManageTests;

