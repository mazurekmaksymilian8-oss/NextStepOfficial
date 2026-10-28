import { useCallback } from 'react';
import { usePersistentState } from '@/hooks/usePersistentState';
import type { Answer, AppPreferences } from '@/types';

const HISTORY_KEY = 'nextstep:history';
const HISTORY_LIMIT = 40;

const DEFAULT_PREFS: AppPreferences = {
  pinOnTop: true,
  model: 'Local AI',
  enableAnimations: true,
  accent: 'ice',
};

const PREFS_KEY = 'nextstep:prefs';

export function useHistory() {
  const [history, setHistory] = usePersistentState<Answer[]>(HISTORY_KEY, []);

  const addAnswer = useCallback(
    (answer: Answer) => {
      setHistory((prev) => [answer, ...prev].slice(0, HISTORY_LIMIT));
    },
    [setHistory],
  );

  const clearHistory = useCallback(() => setHistory([]), [setHistory]);

  const setFeedback = useCallback(
    (answerId: string, feedback: 'up' | 'down') => {
      setHistory((prev) =>
        prev.map((a) =>
          a.id === answerId ? { ...a, feedback: a.feedback === feedback ? null : feedback } : a,
        ),
      );
    },
    [setHistory],
  );

  return { history, addAnswer, clearHistory, setFeedback };
}

export function usePreferences() {
  const [prefs, setPrefs] = usePersistentState<AppPreferences>(PREFS_KEY, DEFAULT_PREFS);

  const update = useCallback(
    (patch: Partial<AppPreferences>) => {
      setPrefs((prev) => ({ ...prev, ...patch }));
    },
    [setPrefs],
  );

  return { prefs, update };
}
