import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check,
  ChevronDown,
  Copy,
  RefreshCw,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
} from 'lucide-react';
import type { Answer } from '@/types';
import { CodeBlock } from '@/components/CodeBlock';

interface AnswerViewProps {
  answer: Answer;
  feedback: 'up' | 'down' | null;
  onFeedback: (feedback: 'up' | 'down') => void;
  onCopyAll: () => void;
  onSimplify: () => void;
  onRetry: () => void;
  isNew?: boolean;
}

export function AnswerView({
  answer,
  feedback,
  onFeedback,
  onCopyAll,
  onSimplify,
  onRetry,
  isNew,
}: AnswerViewProps) {
  const [copiedAll, setCopiedAll] = useState(false);

  const handleCopyAll = () => {
    const text = serializeAnswer(answer);
    navigator.clipboard.writeText(text).then(() => {
      setCopiedAll(true);
      onCopyAll();
      setTimeout(() => setCopiedAll(false), 1600);
    });
  };

  return (
    <motion.div
      initial={isNew ? { opacity: 0, y: 12 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="px-5 pb-5"
    >
      {/* Mock badge */}
      <div className="mb-3 flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/20 bg-amber-400/[0.06] px-2 py-0.5 text-[9.5px] font-medium text-amber-300/80">
          <span className="h-1 w-1 rounded-full bg-amber-400/70" />
          Demo answer · mock AI
        </span>
        <button
          type="button"
          onClick={handleCopyAll}
          className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-[10.5px] font-medium text-white/45 transition-colors hover:bg-white/[0.06] hover:text-white/80"
        >
          {copiedAll ? (
            <>
              <Check size={12} strokeWidth={2} className="text-emerald-400" />
              <span className="text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <Copy size={12} strokeWidth={1.75} />
              Copy answer
            </>
          )}
        </button>
      </div>

      {/* Prompt echo */}
      <div className="mb-4 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2">
        <p className="line-clamp-2 text-[11.5px] italic text-white/40">{answer.prompt}</p>
      </div>

      {/* Intro */}
      <h2 className="text-[15px] font-semibold tracking-tight text-white">
        {answer.intro}
      </h2>

      {/* Steps */}
      <div className="mt-3.5 space-y-2">
        {answer.steps.map((step, i) => (
          <StepCard key={i} index={i} step={step} defaultOpen={i === 0} />
        ))}
      </div>

      {/* Actions */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <ActionButton onClick={onSimplify} icon={<Sparkles size={12} strokeWidth={1.75} />}>
          Explain more simply
        </ActionButton>
        <ActionButton onClick={onRetry} icon={<RefreshCw size={12} strokeWidth={1.75} />}>
          Try another approach
        </ActionButton>
      </div>

      {/* Feedback */}
      <div className="mt-4 flex items-center gap-2 border-t border-white/[0.06] pt-3.5">
        <span className="text-[10.5px] text-white/35">Was this helpful?</span>
        <FeedbackButton
          active={feedback === 'up'}
          onClick={() => onFeedback('up')}
          label="Thumbs up"
        >
          <ThumbsUp size={13} strokeWidth={1.75} />
        </FeedbackButton>
        <FeedbackButton
          active={feedback === 'down'}
          onClick={() => onFeedback('down')}
          label="Thumbs down"
        >
          <ThumbsDown size={13} strokeWidth={1.75} />
        </FeedbackButton>
      </div>
    </motion.div>
  );
}

function StepCard({
  index,
  step,
  defaultOpen,
}: {
  index: number;
  step: Answer['steps'][number];
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <motion.div
      layout
      className="overflow-hidden rounded-xl2 border border-white/8 bg-white/[0.025] transition-colors hover:border-white/12"
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="focus-ring flex w-full items-center gap-3 px-3.5 py-3 text-left"
        aria-expanded={open}
      >
        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-white/[0.06] text-[10.5px] font-semibold tabular-nums text-white/70">
          {String(index + 1).padStart(2, '0')}
        </span>
        <span className="flex-1 text-[12.5px] font-semibold tracking-tight text-white/90">
          {step.title}
        </span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={14} strokeWidth={1.75} className="text-white/40" />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="px-3.5 pb-3.5 pl-[3.25rem]">
              <p className="text-[12px] leading-relaxed text-white/55">{step.explanation}</p>
              {step.code && <CodeBlock code={step.code.snippet} language={step.code.language} />}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function ActionButton({
  onClick,
  icon,
  children,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 400, damping: 22 }}
      className="focus-ring flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-[11px] font-medium text-white/60 transition-colors hover:border-white/15 hover:bg-white/[0.06] hover:text-white/85"
    >
      {icon}
      {children}
    </motion.button>
  );
}

function FeedbackButton({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      aria-label={label}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      className={[
        'focus-ring grid h-7 w-7 place-items-center rounded-lg border transition-colors',
        active
          ? 'border-accent-ice/30 bg-accent-ice/10 text-accent-ice'
          : 'border-white/8 text-white/40 hover:bg-white/[0.06] hover:text-white/70',
      ].join(' ')}
    >
      {children}
    </motion.button>
  );
}

function serializeAnswer(answer: Answer): string {
  const lines = [answer.intro, ''];
  answer.steps.forEach((step, i) => {
    lines.push(`${String(i + 1).padStart(2, '0')} — ${step.title}`);
    lines.push(step.explanation);
    if (step.code) lines.push(`\`\`\`${step.code.language}`, step.code.snippet, '```');
    lines.push('');
  });
  return lines.join('\n');
}
