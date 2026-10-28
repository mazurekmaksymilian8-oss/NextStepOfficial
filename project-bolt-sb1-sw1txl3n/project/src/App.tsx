import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Expand, MessageSquareText } from 'lucide-react';

import { Header } from '@/components/Header';
import { Greeting } from '@/components/Greeting';
import { InputArea } from '@/components/InputArea';
import { QuickActions } from '@/components/QuickActions';
import { ThinkingOrb } from '@/components/ThinkingOrb';
import { AnswerView } from '@/components/AnswerView';
import { ExpandedWorkspace } from '@/components/ExpandedWorkspace';
import { MinimizedBar } from '@/components/MinimizedBar';

import { useHistory, usePreferences } from '@/hooks/useNextStepStore';
import { mockAsk } from '@/services/aiProvider';
import type { Answer, Attachment, AssistantPhase, QuickActionId } from '@/types';

type View = 'assistant' | 'expanded' | 'minimized';

export default function App() {
  const { prefs, update: updatePrefs } = usePreferences();
  const { history, addAnswer, clearHistory, setFeedback } = useHistory();

  const [view, setView] = useState<View>('assistant');
  const [phase, setPhase] = useState<AssistantPhase>('idle');
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState<Answer | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [viewedSession, setViewedSession] = useState<Answer | null>(null);
  const answerScrollRef = useRef<HTMLDivElement>(null);

  // Attachments ----------------------------------------------------------
  const addAttachment = useCallback((file: File) => {
    const url = URL.createObjectURL(file);
    setAttachments((prev) => [
      ...prev,
      { id: crypto.randomUUID(), name: file.name || 'image', url, size: file.size },
    ]);
  }, []);

  const removeAttachment = useCallback((id: string) => {
    setAttachments((prev) => {
      const found = prev.find((a) => a.id === id);
      if (found) URL.revokeObjectURL(found.url);
      return prev.filter((a) => a.id !== id);
    });
  }, []);

  useEffect(() => {
    return () => attachments.forEach((a) => URL.revokeObjectURL(a.url));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Submit ---------------------------------------------------------------
  const submit = useCallback(
    async (overrideText?: string, quickAction?: QuickActionId) => {
      const prompt = (overrideText ?? input).trim();
      if (!prompt && attachments.length === 0) return;
      if (!prompt) return;

      setError(null);
      setPhase('thinking');
      setCurrentAnswer(null);

      try {
        const answer = await mockAsk({
          prompt,
          hasAttachment: attachments.length > 0,
          quickAction,
        });
        setCurrentAnswer(answer);
        addAnswer(answer);
        setPhase('answered');
        setInput('');
      } catch {
        setError('Something went wrong while thinking that through. Please try again.');
        setPhase('idle');
      }
    },
    [input, attachments, addAnswer],
  );

  const handleQuickAction = useCallback(
    (action: QuickActionId) => {
      const labels: Record<QuickActionId, string> = {
        understand: 'Understand what is on my screen',
        error: 'Explain this error I am seeing',
        unstuck: "I'm stuck — help me find the next step",
      };
      submit(labels[action], action);
    },
    [submit],
  );

  const resetToIdle = useCallback(() => {
    setPhase('idle');
    setCurrentAnswer(null);
    setError(null);
    setViewedSession(null);
  }, []);

  // Feedback -------------------------------------------------------------
  const handleFeedback = useCallback(
    (fb: 'up' | 'down') => {
      if (!currentAnswer) return;
      const next = currentAnswer.feedback === fb ? null : fb;
      setCurrentAnswer({ ...currentAnswer, feedback: next });
      setFeedback(currentAnswer.id, fb);
    },
    [currentAnswer, setFeedback],
  );

  // View transitions -----------------------------------------------------
  const openExpanded = useCallback(() => {
    setViewedSession(null);
    setView('expanded');
  }, []);

  const isCompact = view === 'assistant' || view === 'minimized';

  const containerVariants = useMemo(
    () => ({
      initial: { opacity: 0, scale: 0.96, y: 8 },
      animate: { opacity: 1, scale: 1, y: 0 },
      exit: { opacity: 0, scale: 0.97, y: 6 },
    }),
    [],
  );

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-ink-950 p-4">
      {/* Ambient background glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div
          className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-[0.07] blur-[120px]"
          style={{ background: 'radial-gradient(circle, #A9C7FF 0%, transparent 70%)' }}
        />
      </div>

      <AnimatePresence mode="wait">
        {view === 'minimized' ? (
          <MinimizedBar key="min" onRestore={() => setView('assistant')} onClose={() => setView('assistant')} />
        ) : (
          <motion.section
            key={view}
            variants={containerVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ type: 'spring', stiffness: 280, damping: 26 }}
            className={[
              'relative z-10 flex flex-col overflow-hidden border border-white/[0.08] bg-ink-900/80 shadow-win backdrop-blur-2xl',
              isCompact ? 'h-[600px] w-[420px] rounded-xl4' : 'h-[640px] w-[460px] rounded-xl4',
            ].join(' ')}
          >
            <Header
              pinOnTop={prefs.pinOnTop}
              onTogglePin={() => updatePrefs({ pinOnTop: !prefs.pinOnTop })}
              onMinimize={() => setView('minimized')}
              onClose={isCompact ? resetToIdle : () => setView('assistant')}
              onOpenSettings={openExpanded}
              model={prefs.model}
              expanded={!isCompact}
            />

            <AnimatePresence mode="wait">
              {view === 'expanded' ? (
                <motion.div
                  key="expanded"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-1 flex-col overflow-hidden"
                >
                  <ExpandedWorkspace
                    history={history}
                    prefs={prefs}
                    onUpdatePrefs={updatePrefs}
                    onClearHistory={clearHistory}
                    onSelectSession={(a) => {
                      setViewedSession(a);
                      setView('assistant');
                      setPhase('answered');
                      setCurrentAnswer(a);
                    }}
                    onBack={() => setView('assistant')}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="assistant"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-1 flex-col overflow-hidden"
                >
                  {/* Scrollable content */}
                  <div ref={answerScrollRef} className="flex-1 overflow-y-auto">
                    <AnimatePresence mode="wait">
                      {phase === 'idle' && (
                        <motion.div
                          key="home"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0, y: -8 }}
                          transition={{ duration: 0.22 }}
                        >
                          <Greeting />
                          <InputArea
                            value={input}
                            onChange={setInput}
                            onSubmit={() => submit()}
                            attachments={attachments}
                            onAddAttachment={addAttachment}
                            onRemoveAttachment={removeAttachment}
                          />
                          <QuickActions onAction={handleQuickAction} />
                        </motion.div>
                      )}

                      {phase === 'thinking' && (
                        <motion.div
                          key="thinking"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0, y: -8 }}
                          transition={{ duration: 0.22 }}
                        >
                          <ThinkingOrb />
                        </motion.div>
                      )}

                      {phase === 'answered' && currentAnswer && (
                        <motion.div
                          key="answered"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0, y: -8 }}
                          transition={{ duration: 0.22 }}
                        >
                          <AnswerView
                            answer={currentAnswer}
                            feedback={currentAnswer.feedback ?? null}
                            onFeedback={handleFeedback}
                            onCopyAll={() => {}}
                            onSimplify={() => submit(currentAnswer.prompt)}
                            onRetry={() => submit(currentAnswer.prompt)}
                            isNew={!viewedSession}
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {error && (
                      <div className="mx-5 mb-4 rounded-xl border border-red-500/20 bg-red-500/[0.06] px-3.5 py-3">
                        <p className="text-[12px] text-red-300/90">{error}</p>
                      </div>
                    )}
                  </div>

                  {/* Footer / new question bar when answered */}
                  <AnimatePresence>
                    {phase === 'answered' && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        transition={{ duration: 0.2 }}
                        className="flex items-center gap-2 border-t border-white/[0.06] px-4 py-2.5"
                      >
                        <button
                          type="button"
                          onClick={resetToIdle}
                          className="focus-ring flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-white/55 transition-colors hover:bg-white/[0.06] hover:text-white/85"
                        >
                          <ArrowLeft size={12} strokeWidth={1.75} />
                          New question
                        </button>
                        <div className="flex-1" />
                        <button
                          type="button"
                          onClick={openExpanded}
                          className="focus-ring flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-white/55 transition-colors hover:bg-white/[0.06] hover:text-white/85"
                        >
                          <MessageSquareText size={12} strokeWidth={1.75} />
                          History
                        </button>
                        <button
                          type="button"
                          onClick={openExpanded}
                          className="focus-ring grid h-7 w-7 place-items-center rounded-lg text-white/45 transition-colors hover:bg-white/[0.06] hover:text-white/80"
                          aria-label="Expand workspace"
                        >
                          <Expand size={13} strokeWidth={1.75} />
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}
