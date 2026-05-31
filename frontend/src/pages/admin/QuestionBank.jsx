import { useEffect, useState } from 'react';
import DashboardLayout from '../../components/common/DashboardLayout';
import Loader from '../../components/common/Loader';
import {
  getQuestions,
  getQuestionMeta,
  getBankSets,
  updateBankSet,
  uploadQuestions,
  deleteQuestion,
  downloadTemplate,
} from '../../services/questionBankService';
import useQuestionBankStore from '../../store/questionBankStore';

const QuestionBank = () => {
  const [questions, setQuestions] = useState([]);
  const topicQuestions = useQuestionBankStore((s) => s.topicQuestions);
  const selectedTopicSet = useQuestionBankStore((s) => s.selectedTopicSet);
  const setTopicQuestions = useQuestionBankStore((s) => s.setTopicQuestions);
  const setSelectedTopicSet = useQuestionBankStore((s) => s.setSelectedTopicSet);
  const [meta, setMeta] = useState(null);
  const [sets, setSets] = useState([]);
  const [fileNames, setFileNames] = useState({ set1: '', set2: '', set3: '' });
  const [topicInputs, setTopicInputs] = useState({ set1: '', set2: '', set3: '' });
  const [loading, setLoading] = useState(true);
  const questionLoading = useQuestionBankStore((s) => s.questionLoading);
  const setQuestionLoading = useQuestionBankStore((s) => s.setQuestionLoading);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [filters, setFilters] = useState({ topic: '', topicName: '', difficulty: '', companyTag: '', bankSet: '' });

  const loadMeta = () => {
    setLoading(true);
    Promise.all([getQuestionMeta(), getBankSets()])
      .then(([m, s]) => {
        setMeta(m.data);
        setSets(s.data);
        setTopicInputs((prev) => ({
          ...prev,
          ...s.data.reduce((acc, item) => ({ ...acc, [item.key]: item.topicName || '' }), {}),
        }));
        setFileNames(s.data.reduce((acc, item) => ({ ...acc, [item.key]: item.fileName || '' }), {}));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  const loadQuestions = async (query) => {
    if (!query || (!query.topic && !query.topicName && !query.difficulty && !query.companyTag && !query.bankSet)) {
      setQuestions([]);
      return;
    }

    setQuestionLoading(true);
    try {
      const { data } = await getQuestions({ ...query, limit: 200 });
      setQuestions(data.questions);
    } catch (err) {
      console.error(err);
      setMessageType('error');
      setMessage(err.response?.data?.message || 'Failed to load filtered questions');
    } finally {
      setQuestionLoading(false);
    }
  };

  const loadTopicQuestions = async (topicName, bankSet) => {
    setSelectedTopicSet({ topicName, bankSet });
    setQuestionLoading(true);
    setTopicQuestions([]);
    try {
      const { data } = await getQuestions({ topicName, bankSet, limit: 200 });
      setTopicQuestions(data.questions);
    } catch (err) {
      console.error(err);
      setMessageType('error');
      setMessage(err.response?.data?.message || `Failed to load ${bankSet.toUpperCase()} for ${topicName}`);
    } finally {
      setQuestionLoading(false);
    }
  };

  useEffect(() => {
    loadMeta();
    // store already reads localStorage; if persisted selection exists, load questions
    if (selectedTopicSet?.topicName) {
      loadTopicQuestions(selectedTopicSet.topicName, selectedTopicSet.bankSet);
    }
  }, []);

  useEffect(() => {
    loadQuestions(filters);
  }, [filters]);

  const handleUpload = async (e, setKey = 'set1') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const topicName = (topicInputs[setKey] || '').trim();
    if (!topicName) {
      setMessageType('error');
      setMessage('Please enter a topic name before uploading.');
      e.target.value = '';
      return;
    }

    setUploading(true);
    setMessage('');
    try {
      const { data } = await uploadQuestions(file, setKey, topicName);
      setMessageType('success');
      setMessage(data.message + (data.errors?.length ? ` (${data.skipped} rows skipped)` : ''));
      setFileNames((prev) => ({ ...prev, [setKey]: file.name }));
      loadMeta();
    } catch (err) {
      setMessageType('error');
      setMessage(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDownloadTemplate = async () => {
    const { data } = await downloadTemplate();
    const url = window.URL.createObjectURL(new Blob([data]));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'question-bank-template.csv';
    a.click();
  };

  const saveTopicName = async (setKey) => {
    const topicName = (topicInputs[setKey] || '').trim();
    if (!topicName) {
      setMessageType('error');
      setMessage('Please enter a topic name before saving.');
      return;
    }

    setUploading(true);
    setMessage('');
    try {
      const updated = await updateBankSet(setKey, { topicName });
      setMessageType('success');
      setMessage(`Topic saved for ${setKey.toUpperCase()}: ${updated.data.topicName}`);
      setTopicInputs((prev) => ({ ...prev, [setKey]: updated.data.topicName }));
      loadMeta();
    } catch (err) {
      setMessageType('error');
      setMessage(err.response?.data?.message || 'Failed to save topic');
    } finally {
      setUploading(false);
    }
  };

  const refreshQuestionDisplay = async () => {
    if (selectedTopicSet.topicName && selectedTopicSet.bankSet) {
      await loadTopicQuestions(selectedTopicSet.topicName, selectedTopicSet.bankSet);
    } else {
      await loadQuestions(filters);
    }
  };

  const toggleSetEnabled = async (key, enabled) => {
    setLoading(true);
    try {
      await updateBankSet(key, { enabled });
      setMessageType('success');
      setMessage(`${key.toUpperCase()} ${enabled ? 'enabled' : 'disabled'}`);
      await loadMeta();
    } catch (err) {
      setMessageType('error');
      setMessage(err.response?.data?.message || 'Unable to update bank set');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout title="Question Bank" subtitle="Upload questions via CSV/Excel and manage your question pool">
      <div className="mb-6 flex flex-wrap gap-3">
        <button
          onClick={handleDownloadTemplate}
          className="rounded-lg border border-indigo-600 px-4 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50"
        >
          Download CSV Template
        </button>
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        {['set1', 'set2', 'set3'].map((setKey, idx) => {
          const set = sets.find((item) => item.key === setKey) || { key: setKey, enabled: setKey === 'set1', name: `Question Bank Set ${idx + 1}` };
          const topicName = set.topicName || topicInputs[setKey] || '';
          const altSetCount = sets.filter(
            (item) =>
              item.key !== setKey &&
              item.enabled &&
              item.topicName?.toLowerCase() === topicName.toLowerCase()
          ).length;
          return (
            <div key={setKey} className="rounded-xl border bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">{set.name}</p>
                  <p className="text-xs text-slate-500">Status: {set.enabled ? 'Enabled' : 'Disabled'}</p>
                </div>
                {setKey !== 'set1' && (
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600">
                    <span>{set.enabled ? 'ON' : 'OFF'}</span>
                    <input
                      type="checkbox"
                      checked={set.enabled}
                      onChange={(e) => toggleSetEnabled(setKey, e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                  </label>
                )}
              </div>
              <p className="text-xs text-slate-500">Set: {setKey.toUpperCase()}</p>
              <p className="text-xs text-slate-500">Topic Name: {set.topicName || topicInputs[setKey] || 'None'}</p>
              <p className="text-xs text-slate-500">Topic ID: {set.topicId || 'TOPIC000'}</p>
              <p className="text-xs text-slate-500">Alternatives: {altSetCount > 0 ? `${altSetCount} other set(s) available` : 'No alternative set available'}</p>
              <p className="text-xs text-slate-500">Total questions: {meta?.countsByBankSet?.[setKey] || 0}</p>
              <p className="text-xs text-slate-500">File: {set.fileName || fileNames[setKey] || 'None'}</p>
              <div className="mt-3">
                <label className="mb-2 block text-[11px] uppercase tracking-wide text-slate-500">Topic Name for upload</label>
                <input
                  value={topicInputs[setKey] || ''}
                  onChange={(e) => setTopicInputs((prev) => ({ ...prev, [setKey]: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  placeholder="Enter topic name"
                />
                <button
                  type="button"
                  onClick={() => saveTopicName(setKey)}
                  className="mt-3 inline-flex items-center rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-900"
                >
                  {uploading ? 'Saving...' : 'Save Topic'}
                </button>
              </div>
              {set.enabled && (
                <label className="mt-3 inline-flex cursor-pointer items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
                  {uploading ? 'Uploading...' : `Upload CSV ${set.name}`}
                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={(e) => handleUpload(e, setKey)}
                    className="hidden"
                    disabled={uploading}
                  />
                </label>
              )}
              {!set.enabled && setKey !== 'set1' && (
                <p className="mt-3 text-xs text-slate-500">Enable this set to upload questions for it.</p>
              )}
            </div>
          );
        })}
      </div>

      {message && (
        <div className={`mb-4 rounded-lg px-4 py-3 text-sm ${messageType === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
          {message}
        </div>
      )}

      <p className="mb-4 text-sm text-slate-500">Enable Set 2 / Set 3 to make those questions available for future test creation and regeneration. Review uploaded questions in the table below.</p>

      {meta && (
        <p className="mb-4 text-sm text-slate-500">Total questions in bank: <strong>{meta.total}</strong></p>
      )}

      {meta?.topicSummary?.length > 0 && (
        <div className="mb-6 overflow-x-auto rounded-xl border bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3">Topic Name</th>
                <th className="px-4 py-3">Topic ID</th>
                <th className="px-4 py-3">Total Questions</th>
                <th className="px-4 py-3">Sets Uploaded</th>
                <th className="px-4 py-3">Bank Sets</th>
              </tr>
            </thead>
            <tbody>
              {meta.topicSummary.map((topic) => (
                <tr key={topic.topicId || topic.topicName} className="border-b last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">{topic.topicName}</td>
                  <td className="px-4 py-3">{topic.topicId || 'N/A'}</td>
                  <td className="px-4 py-3">{topic.totalQuestions}</td>
                  <td className="px-4 py-3">{topic.setsCount}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                        {['set1', 'set2', 'set3'].map((setKey) => {
                        const count = topic.bankSets?.find((row) => row.bankSet === setKey)?.count || 0;
                        const isActive = selectedTopicSet.topicName === topic.topicName && selectedTopicSet.bankSet === setKey;
                        const isLoadingThis = questionLoading && isActive;
                        return (
                          <button
                            key={setKey}
                            type="button"
                            disabled={count === 0}
                              onClick={() => loadTopicQuestions(topic.topicName, setKey)}
                            className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                              isActive ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            } ${count === 0 ? 'cursor-not-allowed opacity-50' : ''}`}
                          >
                            {isLoadingThis ? (
                              <span className="inline-flex items-center gap-2">
                                <svg className="h-3 w-3 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                                </svg>
                                <span>{setKey.toUpperCase()} ({count})</span>
                              </span>
                            ) : (
                              <span>{setKey.toUpperCase()} ({count})</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mb-4 flex flex-wrap gap-3">
        <select value={filters.topic} onChange={(e) => setFilters({ ...filters, topic: e.target.value })}
          className="rounded-lg border px-3 py-2 text-sm">
          <option value="">All Question Topics</option>
          {meta?.topics?.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={filters.topicName} onChange={(e) => setFilters({ ...filters, topicName: e.target.value })}
          className="rounded-lg border px-3 py-2 text-sm">
          <option value="">All Bank Topics</option>
          {meta?.topicNames?.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={filters.difficulty} onChange={(e) => setFilters({ ...filters, difficulty: e.target.value })}
          className="rounded-lg border px-3 py-2 text-sm">
          <option value="">All Difficulties</option>
          {meta?.difficulties?.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        <select value={filters.companyTag} onChange={(e) => setFilters({ ...filters, companyTag: e.target.value })}
          className="rounded-lg border px-3 py-2 text-sm">
          <option value="">All Company Tags</option>
          {meta?.companyTags?.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={filters.bankSet} onChange={(e) => setFilters({ ...filters, bankSet: e.target.value })}
          className="rounded-lg border px-3 py-2 text-sm">
          <option value="">All Sets</option>
          {['set1', 'set2', 'set3'].map((setKey) => (
            <option key={setKey} value={setKey}>{setKey.toUpperCase()}</option>
          ))}
        </select>
      </div>

      {loading ? <Loader /> : (
        <>
          {(selectedTopicSet.topicName || filters.topic || filters.topicName || filters.difficulty || filters.companyTag || filters.bankSet) ? (
            <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
              <div className="flex items-center justify-between border-b bg-slate-50 px-4 py-3 text-sm text-slate-600">
                <div>
                  <p className="font-semibold text-slate-900">
                    {selectedTopicSet.topicName ? `${selectedTopicSet.bankSet.toUpperCase()} Questions for ${selectedTopicSet.topicName}` : 'Filtered Questions'}
                  </p>
                  <p className="text-xs text-slate-500">
                    {selectedTopicSet.topicName
                      ? `Showing only questions from ${selectedTopicSet.bankSet.toUpperCase()} for this topic.`
                      : 'Showing questions based on selected filters.'}
                  </p>
                </div>
                {selectedTopicSet.topicName && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTopicSet({ topicName: '', bankSet: '' });
                      setTopicQuestions([]);
                      try { localStorage.removeItem('qbank:selected'); } catch (e) {}
                    }}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-1 text-xs text-slate-700 hover:bg-slate-100"
                  >
                    Clear selection
                  </button>
                )}
              </div>

              <table className="w-full text-left text-sm">
                <thead className="border-b bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-4 py-3">Question Text</th>
                    <th className="px-4 py-3">Option A</th>
                    <th className="px-4 py-3">Option B</th>
                    <th className="px-4 py-3">Option C</th>
                    <th className="px-4 py-3">Option D</th>
                    <th className="px-4 py-3">Correct Answer</th>
                    <th className="px-4 py-3">Difficulty</th>
                    <th className="px-4 py-3">Set</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {(selectedTopicSet.topicName ? topicQuestions : questions).map((q) => (
                    <tr key={q._id} className="border-b last:border-0">
                      <td className="max-w-md px-4 py-3">{q.questionText}</td>
                      <td className="px-4 py-3">{q.options?.[0] || ''}</td>
                      <td className="px-4 py-3">{q.options?.[1] || ''}</td>
                      <td className="px-4 py-3">{q.options?.[2] || ''}</td>
                      <td className="px-4 py-3">{q.options?.[3] || ''}</td>
                      <td className="px-4 py-3">{String.fromCharCode(65 + q.correctAnswer)}</td>
                      <td className="px-4 py-3">{q.difficulty}</td>
                      <td className="px-4 py-3">{q.bankSet?.toUpperCase() || 'N/A'}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={async () => {
                            await deleteQuestion(q._id);
                            await refreshQuestionDisplay();
                          }}
                          className="text-red-600 text-xs hover:underline"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {questionLoading && <p className="p-6 text-center text-slate-500">Loading questions...</p>}
              {!questionLoading && !(selectedTopicSet.topicName ? topicQuestions.length : questions.length) && (
                <p className="p-6 text-center text-slate-500">No questions found for this selection.</p>
              )}
            </div>
          ) : (
            <p className="p-6 text-center text-slate-500">Select a topic set above to view detailed questions.</p>
          )}
        </>
      )}

      <div className="mt-6 rounded-lg bg-slate-50 p-4 text-xs text-slate-600">
        <p className="font-semibold">CSV format:</p>
        <p className="mt-1">question, optionA, optionB, optionC, optionD, correctAnswer, topic, difficulty, companyTag</p>
        <p className="mt-1">correctAnswer: A/B/C/D or 1/2/3/4</p>
      </div>
    </DashboardLayout>
  );
};

export default QuestionBank;
