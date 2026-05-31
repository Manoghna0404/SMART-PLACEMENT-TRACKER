import create from 'zustand';

const STORAGE_KEY = 'qbank:selected';

const readSaved = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { topicName: '', bankSet: '' };
    const parsed = JSON.parse(raw);
    return { topicName: parsed.topicName || '', bankSet: parsed.bankSet || '' };
  } catch (e) {
    return { topicName: '', bankSet: '' };
  }
};

const useQuestionBankStore = create((set, get) => ({
  selectedTopicSet: readSaved(),
  topicQuestions: [],
  questionLoading: false,
  setSelectedTopicSet: (selected) => {
    set({ selectedTopicSet: selected });
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(selected));
    } catch (e) {}
  },
  setTopicQuestions: (questions) => set({ topicQuestions: questions }),
  setQuestionLoading: (v) => set({ questionLoading: v }),
  clearSelection: () => {
    set({ selectedTopicSet: { topicName: '', bankSet: '' }, topicQuestions: [] });
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
  },
}));

export default useQuestionBankStore;
