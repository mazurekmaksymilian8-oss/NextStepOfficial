import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUp, Mic, MicOff, Paperclip, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { Attachment } from '@/types';

// Minimal Web Speech API typing
interface SpeechRecognitionResult {
  transcript: string;
}
interface SpeechRecognitionEvent {
  results: { [index: number]: { [index: number]: SpeechRecognitionResult } };
  resultIndex: number;
}
interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
}
type SpeechRecognitionCtor = new () => SpeechRecognitionInstance;

interface InputAreaProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  attachments: Attachment[];
  onAddAttachment: (file: File) => void;
  onRemoveAttachment: (id: string) => void;
  disabled?: boolean;
  placeholder?: string;
  compact?: boolean;
}

export function InputArea({
  value,
  onChange,
  onSubmit,
  attachments,
  onAddAttachment,
  onRemoveAttachment,
  disabled,
  placeholder = "Ask anything or describe what's on your screen…",
  compact,
}: InputAreaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const [focused, setFocused] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);

  useEffect(() => {
    const Ctor = (window as unknown as { SpeechRecognition?: SpeechRecognitionCtor; webkitSpeechRecognition?: SpeechRecognitionCtor }).SpeechRecognition
      || (window as unknown as { webkitSpeechRecognition?: SpeechRecognitionCtor }).webkitSpeechRecognition;
    setVoiceSupported(!!Ctor);
  }, []);

  // Auto-grow
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = '0px';
    el.style.height = `${Math.min(el.scrollHeight, compact ? 100 : 140)}px`;
  }, [value, compact]);

  // Paste image support
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            onAddAttachment(file);
            e.preventDefault();
          }
        }
      }
    };
    const el = textareaRef.current;
    el?.addEventListener('paste', onPaste);
    return () => el?.removeEventListener('paste', onPaste);
  }, [onAddAttachment]);

  const canSend = value.trim().length > 0 && !disabled;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (canSend) onSubmit();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onAddAttachment(file);
    e.target.value = '';
  };

  const toggleVoice = () => {
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }

    const Ctor = (window as unknown as { SpeechRecognition?: SpeechRecognitionCtor; webkitSpeechRecognition?: SpeechRecognitionCtor }).SpeechRecognition
      || (window as unknown as { webkitSpeechRecognition?: SpeechRecognitionCtor }).webkitSpeechRecognition;
    if (!Ctor) return;

    const recognition = new Ctor();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (e: SpeechRecognitionEvent) => {
      let transcript = '';
      const results = e.results;
      for (let i = e.resultIndex; i < Object.keys(results).length; i++) {
        transcript += results[i][0].transcript;
      }
      onChange(transcript.trim());
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognition.onerror = () => {
      setListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  };

  return (
    <div className={compact ? 'px-3' : 'px-5'}>
      <div
        className={[
          'relative rounded-xl3 border bg-white/60 backdrop-blur-sm transition-all duration-200 dark:bg-ink-850/80',
          focused
            ? 'border-accent-ice/35 shadow-glow'
            : 'border-black/10 hover:border-black/15 dark:border-white/10 dark:hover:border-white/15',
        ].join(' ')}
      >
        {/* Attachment previews */}
        <AnimatePresence>
          {attachments.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="flex flex-wrap gap-2 px-3.5 pt-3.5"
            >
              {attachments.map((att) => (
                <AttachmentChip
                  key={att.id}
                  attachment={att}
                  onRemove={() => onRemoveAttachment(att.id)}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          rows={1}
          disabled={disabled}
          placeholder={placeholder}
          className="block w-full resize-none bg-transparent px-3.5 pt-3.5 text-[13.5px] leading-relaxed text-gray-800 placeholder:text-gray-400 focus:outline-none disabled:opacity-50 dark:text-white/90 dark:placeholder:text-white/30"
          style={{ maxHeight: compact ? 100 : 140 }}
        />

        {/* Toolbar */}
        <div className="flex items-center justify-between px-2.5 pb-2.5 pt-1.5">
          <div className="flex items-center gap-0.5">
            <ToolButton label="Attach screenshot" onClick={() => fileInputRef.current?.click()} disabled={disabled}>
              <Paperclip size={15} strokeWidth={1.75} />
            </ToolButton>
            <ToolButton
              label="Paste image"
              onClick={() => {
                navigator.clipboard
                  .read()
                  .then((items) => {
                    for (const item of items) {
                      item.getType('image/png').then((blob) => {
                        onAddAttachment(new File([blob], 'pasted-image.png', { type: 'image/png' }));
                      }).catch(() => {});
                    }
                  })
                  .catch(() => {});
              }}
              disabled={disabled}
            >
              <span className="text-[10px] font-semibold tracking-wide text-gray-500 dark:text-white/60">⌘V</span>
            </ToolButton>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          </div>

          <div className="flex items-center gap-1.5">
            {voiceSupported && (
              <ToolButton
                label={listening ? 'Stop voice input' : 'Voice input'}
                onClick={toggleVoice}
                active={listening}
              >
                {listening ? <MicOff size={15} strokeWidth={1.75} /> : <Mic size={15} strokeWidth={1.75} />}
              </ToolButton>
            )}
            <motion.button
              type="button"
              onClick={onSubmit}
              disabled={!canSend}
              whileHover={canSend ? { scale: 1.05 } : undefined}
              whileTap={canSend ? { scale: 0.9 } : undefined}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              aria-label="Send"
              className={[
                'focus-ring grid h-8 w-8 place-items-center rounded-xl transition-all duration-200',
                canSend
                  ? 'bg-gray-900 text-white shadow-soft dark:bg-white dark:text-ink-950'
                  : 'bg-black/[0.06] text-gray-400 dark:bg-white/[0.06] dark:text-white/30',
              ].join(' ')}
            >
              <ArrowUp size={16} strokeWidth={2.25} />
            </motion.button>
          </div>
        </div>
      </div>

      {!compact && (
        <div className="mt-2 flex items-center justify-between px-1">
          <span className="text-[10.5px] text-gray-400 dark:text-white/30">
            {listening ? 'Listening…' : canSend ? 'Enter to ask · Shift+Enter for new line' : 'Enter to ask'}
          </span>
        </div>
      )}
    </div>
  );
}

function ToolButton({
  label,
  onClick,
  children,
  disabled,
  active,
}: {
  label: string;
  onClick?: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  active?: boolean;
}) {
  return (
    <motion.button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      whileHover={disabled ? undefined : { scale: 1.06 }}
      whileTap={disabled ? undefined : { scale: 0.92 }}
      transition={{ type: 'spring', stiffness: 400, damping: 22 }}
      className={[
        'focus-ring grid h-8 w-8 place-items-center rounded-xl transition-colors disabled:cursor-not-allowed disabled:opacity-40',
        active
          ? 'bg-red-500/10 text-red-500'
          : 'text-gray-500 hover:bg-black/[0.06] hover:text-gray-700 dark:text-white/50 dark:hover:bg-white/[0.06] dark:hover:text-white/80',
      ].join(' ')}
    >
      {children}
    </motion.button>
  );
}

function AttachmentChip({
  attachment,
  onRemove,
}: {
  attachment: Attachment;
  onRemove: () => void;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
      className="group relative flex items-center gap-2 overflow-hidden rounded-xl border border-black/10 bg-black/[0.03] py-1 pl-1 pr-2 dark:border-white/10 dark:bg-white/[0.04]"
    >
      <img src={attachment.url} alt={attachment.name} className="h-8 w-8 rounded-lg object-cover" />
      <div className="min-w-0">
        <p className="max-w-[120px] truncate text-[10.5px] font-medium text-gray-700 dark:text-white/80">{attachment.name}</p>
        <p className="text-[9px] text-gray-400 dark:text-white/40">Attached</p>
      </div>
      <button
        type="button"
        onClick={onRemove}
        aria-label="Remove attachment"
        className="ml-1 grid h-5 w-5 place-items-center rounded-md text-gray-400 hover:bg-black/10 hover:text-gray-700 dark:text-white/40 dark:hover:bg-white/10 dark:hover:text-white/80"
      >
        <X size={11} strokeWidth={2} />
      </button>
    </motion.div>
  );
}
