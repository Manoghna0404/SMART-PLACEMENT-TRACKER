import { downloadScorecard } from '../../utils/reportUtils';

const TestResultView = ({ result, onClose }) => {
  const { analytics, attempt } = result || {};
  if (!analytics) return null;

  const scoreColor =
    analytics.score >= 80 ? 'text-emerald-600' : analytics.score >= 50 ? 'text-amber-600' : 'text-red-600';

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="text-center">
        <p className="text-sm font-medium text-slate-500">Your Score</p>
        <p className={`mt-1 text-5xl font-bold ${scoreColor}`}>{analytics.score}%</p>
        <p className="mt-2 text-slate-600 dark:text-slate-300">
          {analytics.correctAnswers} correct, {analytics.wrongAnswers} wrong
        </p>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-4">
        {[
          ['Accuracy', `${analytics.accuracy || 0}%`],
          ['Percentile', `${analytics.percentile || 0}`],
          ['Result', analytics.passed ? 'Passed' : 'Improve'],
          ['Time', `${Math.floor((analytics.timeTakenSeconds || 0) / 60)}m ${(analytics.timeTakenSeconds || 0) % 60}s`],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl bg-slate-50 p-4 text-center dark:bg-slate-800">
            <p className="text-xs text-slate-500">{label}</p>
            <p className="mt-1 font-bold text-slate-900 dark:text-white">{value}</p>
          </div>
        ))}
      </div>

      {analytics.autoSubmitted && (
        <p className="mt-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-700">
          Auto-submitted when time ended.
        </p>
      )}

      {analytics.topicBreakdown?.length > 0 && (
        <div className="mt-8">
          <h3 className="font-semibold text-slate-900 dark:text-white">Topic-wise Performance</h3>
          <div className="mt-3 space-y-2">
            {analytics.topicBreakdown.map((topic) => (
              <div key={topic.topic} className="flex items-center gap-3">
                <span className="w-32 shrink-0 text-sm text-slate-600 dark:text-slate-300">{topic.topic}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div className="h-full rounded-full bg-indigo-500 transition-all" style={{ width: `${topic.total ? (topic.correct / topic.total) * 100 : 0}%` }} />
                </div>
                <span className="text-xs text-slate-500">{topic.correct}/{topic.total}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {analytics.weakAreas?.length > 0 && (
        <div className="mt-6">
          <h3 className="font-semibold text-slate-900 dark:text-white">Weak Areas</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {analytics.weakAreas.map((area) => (
              <span key={area} className="rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700">
                {area}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="mt-8 flex flex-wrap gap-3">
        <button
          onClick={() => downloadScorecard({ title: attempt?.testId?.title || 'Test Scorecard', analytics, attempt })}
          className="flex-1 rounded-lg border border-emerald-200 bg-emerald-50 py-2.5 font-medium text-emerald-700 hover:bg-emerald-100"
        >
          Download Scorecard
        </button>
        {onClose && (
          <button onClick={onClose} className="flex-1 rounded-lg bg-indigo-600 py-2.5 font-medium text-white hover:bg-indigo-700">
            Back to Tests
          </button>
        )}
      </div>
    </div>
  );
};

export default TestResultView;
