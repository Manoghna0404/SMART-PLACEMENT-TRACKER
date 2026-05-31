import { useCallback, useEffect, useRef, useState } from 'react';

const formatTime = (seconds) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

const TestPlayer = ({ test, durationSeconds, onSubmit, submitting }) => {
  const total = test.questions.length;
  const storageKey = `spt-test-${test._id}`;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [marked, setMarked] = useState(new Set());
  const [timeLeft, setTimeLeft] = useState(durationSeconds);
  const [showConfirm, setShowConfirm] = useState(false);
  const submittedRef = useRef(false);

  const buildAnswers = useCallback(
    () =>
      Object.entries(answers).map(([questionIndex, selectedAnswer]) => ({
        questionIndex: parseInt(questionIndex, 10),
        selectedAnswer: parseInt(selectedAnswer, 10),
        markedForReview: marked.has(parseInt(questionIndex, 10)),
      })),
    [answers, marked]
  );

  const submit = useCallback(
    (autoSubmitted) => {
      if (submittedRef.current) return;
      submittedRef.current = true;
      localStorage.removeItem(storageKey);
      onSubmit({
        answers: buildAnswers(),
        markedForReview: [...marked],
        timeTakenSeconds: durationSeconds - timeLeft,
        autoSubmitted,
      });
    },
    [buildAnswers, durationSeconds, marked, onSubmit, storageKey, timeLeft]
  );

  useEffect(() => {
    const cached = localStorage.getItem(storageKey);
    if (!cached) return;
    try {
      const parsed = JSON.parse(cached);
      setAnswers(parsed.answers || {});
      setMarked(new Set(parsed.marked || []));
    } catch {
      localStorage.removeItem(storageKey);
    }
  }, [storageKey]);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify({ answers, marked: [...marked] }));
  }, [answers, marked, storageKey]);

  useEffect(() => {
    document.documentElement.requestFullscreen?.().catch(() => {});
    return () => {
      if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    };
  }, []);

  useEffect(() => {
    if (timeLeft <= 0) {
      submit(true);
      return undefined;
    }
    const timer = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, submit]);

  const currentQ = test.questions[currentIndex];

  const selectAnswer = (optionIndex) => {
    setAnswers((prev) => ({ ...prev, [currentIndex]: optionIndex }));
  };

  const toggleMark = () => {
    setMarked((prev) => {
      const next = new Set(prev);
      if (next.has(currentIndex)) next.delete(currentIndex);
      else next.add(currentIndex);
      return next;
    });
  };

  const getPaletteClass = (idx) => {
    if (idx === currentIndex) return 'bg-indigo-600 text-white ring-2 ring-indigo-300';
    if (answers[idx] !== undefined && marked.has(idx)) return 'bg-amber-500 text-white';
    if (answers[idx] !== undefined) return 'bg-emerald-500 text-white';
    if (marked.has(idx)) return 'border border-amber-300 bg-amber-100 text-amber-800';
    return 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300';
  };

  const urgent = timeLeft <= 60;

  return (
    <div className="flex flex-col gap-4 lg:flex-row">
      <div className="flex-1">
        <div className="sticky top-0 z-10 mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div>
            <p className="text-sm text-slate-500">Question {currentIndex + 1} of {total}</p>
            <p className="font-semibold text-slate-900 dark:text-white">{test.title}</p>
          </div>
          <div className={`rounded-lg px-4 py-2 font-mono text-lg font-bold ${urgent ? 'animate-pulse bg-red-100 text-red-700' : 'bg-indigo-50 text-indigo-700'}`}>
            {formatTime(timeLeft)}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-2 flex flex-wrap gap-2">
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs dark:bg-slate-800">{currentQ.topic}</span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs dark:bg-slate-800">{currentQ.difficulty}</span>
          </div>
          <p className="text-lg font-medium text-slate-900 dark:text-white">{currentQ.questionText}</p>
          <div className="mt-5 space-y-2">
            {currentQ.options.map((opt, oi) => (
              <label
                key={oi}
                className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 transition ${
                  answers[currentIndex] === oi
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950'
                    : 'border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800'
                }`}
              >
                <input type="radio" name={`q-${currentIndex}`} checked={answers[currentIndex] === oi} onChange={() => selectAnswer(oi)} />
                <span className="font-medium text-slate-500">{String.fromCharCode(65 + oi)}.</span>
                <span className="text-sm text-slate-800 dark:text-slate-100">{opt}</span>
              </label>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <button type="button" onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))} disabled={currentIndex === 0} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium disabled:opacity-40">
              Previous
            </button>
            <button type="button" onClick={toggleMark} className={`rounded-lg px-4 py-2 text-sm font-medium ${marked.has(currentIndex) ? 'bg-amber-100 text-amber-800' : 'border border-slate-300'}`}>
              {marked.has(currentIndex) ? 'Marked' : 'Mark for Review'}
            </button>
            <button type="button" onClick={() => setCurrentIndex((i) => Math.min(total - 1, i + 1))} disabled={currentIndex === total - 1} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-40">
              Next
            </button>
            <button type="button" onClick={() => setShowConfirm(true)} disabled={submitting} className="ml-auto rounded-lg bg-emerald-600 px-6 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">
              {submitting ? 'Submitting...' : 'Submit Test'}
            </button>
          </div>
        </div>
      </div>

      <aside className="w-full shrink-0 lg:w-56">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">Question Palette</p>
          <div className="grid grid-cols-5 gap-2">
            {test.questions.map((_, idx) => (
              <button key={idx} type="button" onClick={() => setCurrentIndex(idx)} className={`flex h-9 w-9 items-center justify-center rounded-lg text-xs font-semibold transition ${getPaletteClass(idx)}`}>
                {idx + 1}
              </button>
            ))}
          </div>
          <div className="mt-4 border-t pt-3 text-xs text-slate-600 dark:border-slate-800 dark:text-slate-300">
            <p>Answered: {Object.keys(answers).length}/{total}</p>
            <p>Marked: {marked.size}</p>
            <p>Auto-save: enabled</p>
          </div>
        </div>
      </aside>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl dark:bg-slate-900">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Submit assessment?</h3>
            <p className="mt-2 text-sm text-slate-500">
              You answered {Object.keys(answers).length} of {total} questions and marked {marked.size} for review.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setShowConfirm(false)} className="rounded-lg border px-4 py-2 text-sm font-medium">
                Continue Test
              </button>
              <button onClick={() => submit(false)} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">
                Submit Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestPlayer;
