import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { tokenize, tokenClass } from '@/services/highlight';

interface CodeBlockProps {
  code: string;
  language: string;
}

export function CodeBlock({ code, language }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* ignore */
    }
  };

  const lines = code.split('\n');

  return (
    <div className="group relative mt-2.5 overflow-hidden rounded-xl border border-white/8 bg-ink-950/60">
      <div className="flex items-center justify-between border-b border-white/[0.06] px-3 py-1.5">
        <span className="text-[10px] font-medium uppercase tracking-wider text-white/35">
          {language}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium text-white/40 transition-colors hover:bg-white/[0.06] hover:text-white/70"
          aria-label="Copy code"
        >
          {copied ? (
            <>
              <Check size={11} strokeWidth={2} className="text-emerald-400" />
              <span className="text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <Copy size={11} strokeWidth={1.75} />
              Copy
            </>
          )}
        </button>
      </div>
      <pre className="overflow-x-auto px-3 py-2.5 text-[11.5px] leading-relaxed">
        <code className="font-mono">
          {lines.map((line, li) => (
            <div key={li} className="flex">
              <span className="mr-3 w-4 shrink-0 select-none text-right text-white/20">
                {li + 1}
              </span>
              <span className="whitespace-pre">
                {line.length === 0 ? (
                  ' '
                ) : (
                  tokenize(line, language).map((tok, ti) => (
                    <span key={ti} className={tokenClass(tok.type)}>
                      {tok.text}
                    </span>
                  ))
                )}
              </span>
            </div>
          ))}
        </code>
      </pre>
      <AnimatePresence>
        {copied && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none absolute inset-0 bg-accent-ice/[0.04]"
          />
        )}
      </AnimatePresence>
    </div>
  );
}
