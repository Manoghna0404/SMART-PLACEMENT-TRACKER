// import { create } from 'zustand';
// import { persist } from 'zustand/middleware';

// const useThemeStore = create(
//   persist(
//     (set) => ({
//       theme: 'light',
//       toggleTheme: () =>
//         set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
//       setTheme: (theme) => set({ theme }),
//     }),
//     { name: 'spt-theme' }
//   )
// );

// export default useThemeStore;
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const applyTheme = (theme) => {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (theme === 'dark') root.classList.add('dark');
  else root.classList.remove('dark');
};

const readStoredTheme = () => {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem('spt-theme');
    if (!stored) return null;

    const parsed = JSON.parse(stored);

    // Zustand persist commonly stores: { state: {...} }
    if (parsed?.state?.theme === 'dark' || parsed?.state?.theme === 'light') {
      return parsed.state.theme;
    }

    // Some older/alternate formats may store { theme: 'dark' }
    if (parsed?.theme === 'dark' || parsed?.theme === 'light') {
      return parsed.theme;
    }

    return null;
  } catch {
    return null;
  }
};

const initialTheme = readStoredTheme() ?? 'light';
applyTheme(initialTheme);

const useThemeStore = create(
  persist(
    (set, get) => ({
      theme: initialTheme,

      toggleTheme: () => {
        const newTheme = get().theme === 'dark' ? 'light' : 'dark';
        applyTheme(newTheme);
        set({ theme: newTheme });
      },

      setTheme: (theme) => {
        const next = theme === 'dark' ? 'dark' : 'light';
        applyTheme(next);
        set({ theme: next });
      },
    }),
    {
      name: 'spt-theme',
      partialize: (state) => ({ theme: state.theme }),
      onRehydrateStorage: () => (state) => {
        // On rehydrate, ensure DOM class matches the final persisted state
        if (!state) {
          applyTheme(initialTheme);
          return;
        }
        applyTheme(state.theme || initialTheme);
      },
    }
  )
);

export default useThemeStore;
