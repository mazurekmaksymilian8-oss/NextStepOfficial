import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Copy, Clipboard, ChevronDown, User, Sparkles, RotateCcw } from 'lucide-react';
import { Markdown } from '@/components/Markdown';
import type { ChatMessage } from '@/types';

interface ChatThreadProps {
  messages: ChatMessage[];
  streamingContent: string | null;
  onRetry: () => void;
  onAutoFill?: (code: string) => void;
}

export function ChatThread({ messages, streamingContent, onRetry, onAutoFill }: ChatThreadProps) {
  const [expandedCode, setExpandedCode] = useState<Set<string>>(new Set());

  const toggleCode = (id: string) => {
    setExpandedCode((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-4 px-4 pb-4">
      {messages.map((msg) => (
        <MessageBubble
          key={msg.id}
          message={msg}
          onRetry={onRetry}
          onAutoFill={onAutoFill}
          expandedCode={expandedCode}
          toggleCode={toggleCode}
        />
      ))}

      {/* Streaming assistant message */}
      {streamingContent !== null && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="flex gap-2.5"
        >
          <Avatar role="assistant" />
          <div className="flex-1 overflow-hidden">
            <div className="rounded-xl2 rounded-tl-md border border-black/8 bg-white/50 px-3.5 py-3 dark:border-white/8 dark:bg-white/[0.03]">
              {streamingContent.length === 0 ? (
                <div className="flex items-center gap-1.5">
                  <ThinkingDots />
                </div>
              ) : (
                <Markdown content={streamingContent} />
              )}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

function MessageBubble({
  message,
  onRetry,
  onAutoFill,
  expandedCode,
  toggleCode,
}: {
  message: ChatMessage;
  onRetry: () => void;
  onAutoFill?: (code: string) => void;
  expandedCode: Set<string>;
  toggleCode: (id: string) => void;
}) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className="flex gap-2.5"
    >
      <Avatar role={message.role} />
      <div className="group/min-w-0 flex-1 overflow-hidden">
        <div
          className={[
            'rounded-xl2 px-3.5 py-3',
            isUser
              ? 'rounded-tl-md bg-gray-900 text-white dark:bg-white/10 dark:text-white'
              : 'rounded-tl-md border border-black/8 bg-white/50 dark:border-white/8 dark:bg-white/[0.03]',
          ].join(' ')}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap text-[12.5px] leading-relaxed">{message.content}</p>
          ) : (
            <Markdown content={message.content} />
          )}
        </div>

        {/* Action row for assistant messages */}
        {!isUser && (
          <div className="mt-1.5 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <ActionButton onClick={handleCopy} icon={copied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}>
              {copied ? 'Copied' : 'Copy'}
            </ActionButton>
            <ActionButton onClick={onRetry} icon={<RotateCcw size={11} />}>
              Retry
            </ActionButton>
            <AutoFillButton content={message.content} onAutoFill={onAutoFill} />
          </div>
        )}
      </div>
    </motion.div>
  );
}

function AutoFillButton({
  content,
  onAutoFill,
}: {
  content: string;
  onAutoFill?: (code: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const codeBlocks = extractCodeBlocks(content);

  if (!onAutoFill || codeBlocks.length === 0) return null;

  return (
    <div className="relative">
      <ActionButton onClick={() => setOpen((o) => !o)} icon={<Clipboard size={11} />}>
        Auto-fill
      </ActionButton>
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.97 }}
              transition={{ duration: 0.15 }}
              className="absolute bottom-full left-0 z-20 mb-1.5 w-56 rounded-xl border border-black/10 bg-white p-1.5 shadow-win-light dark:border-white/10 dark:bg-ink-800"
            >
              <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-white/35">
                Copy to input
              </p>
              {codeBlocks.map((block, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    onAutoFill(block.code);
                    setOpen(false);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[11px] text-gray-600 transition-colors hover:bg-black/[0.06] dark:text-white/70 dark:hover:bg-white/[0.06]"
                >
                  <Clipboard size={11} className="shrink-0 text-gray-400 dark:text-white/40" />
                  <span className="truncate font-mono text-[10px]">{block.lang} · {block.code.slice(0, 30)}…</span>
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function ActionButton({ onClick, icon, children }: { onClick: () => void; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium text-gray-400 transition-colors hover:bg-black/[0.06] hover:text-gray-700 dark:text-white/40 dark:hover:bg-white/[0.06] dark:hover:text-white/70"
    >
      {icon}
      {children}
    </button>
  );
}

function Avatar({ role }: { role: 'user' | 'assistant' }) {
  return (
    <div
      className={[
        'mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-lg',
        role === 'user'
          ? 'bg-gray-900 text-white dark:bg-white/10'
          : 'bg-gradient-to-br from-accent-ice to-accent-violet text-ink-950',
      ].join(' ')}
    >
      {role === 'user' ? <User size={12} strokeWidth={2} /> : <Sparkles size={12} strokeWidth={2} />}
    </div>
  );
}

function ThinkingDots() {
  return (
    <div className="flex items-center gap-1 py-1">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-gray-400 dark:bg-white/40"
          animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}

function extractCodeBlocks(content: string): { lang: string; code: string }[] {
  const blocks: { lang: string; code: string }[] = [];
  const regex = /```(\w+)?\n([\s\S]*?)```/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    blocks.push({ lang: match[1] || 'text', code: match[2].trim() });
  }
  return blocks;
}
