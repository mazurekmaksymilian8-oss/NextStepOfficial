import { motion } from 'framer-motion';
import { Minus, Pin, PinOff, Settings, X, Sun, Moon } from 'lucide-react';
import type { Theme } from '@/types';

interface HeaderProps {
  pinOnTop: boolean;
  onTogglePin: () => void;
  onMinimize: () => void;
  onClose: () => void;
  onOpenSettings: () => void;
  model: string;
  expanded: boolean;
  theme: Theme;
  onToggleTheme: () => void;
}

export function Header({
  pinOnTop,
  onTogglePin,
  onMinimize,
  onClose,
  onOpenSettings,
  model,
  expanded,
  theme,
  onToggleTheme,
}: HeaderProps) {
  return (
    <header className="flex items-center justify-between px-4 pt-3.5 pb-3 select-none">
      {/* Left: wordmark only */}
      <div className="flex items-center gap-2">
        <span className="text-[13px] font-semibold tracking-tight text-gray-900 dark:text-white/95">
          NextStep
        </span>
        <span className="hidden items-center rounded-full border border-black/10 bg-black/[0.03] px-2 py-0.5 text-[10px] font-medium text-gray-500 dark:border-white/10 dark:bg-white/[0.03] dark:text-white/55 sm:inline-flex">
          {model}
        </span>
      </div>

      {/* Right: controls */}
      <div className="flex items-center gap-1">
        <IconButton label={theme === 'dark' ? 'Light mode' : 'Dark mode'} onClick={onToggleTheme}>
          {theme === 'dark' ? <Sun size={14} strokeWidth={1.75} /> : <Moon size={14} strokeWidth={1.75} />}
        </IconButton>
        <IconButton label="Settings" onClick={onOpenSettings}>
          <Settings size={14} strokeWidth={1.75} />
        </IconButton>
        <IconButton
          label={pinOnTop ? 'Unpin from top' : 'Pin on top'}
          onClick={onTogglePin}
          active={pinOnTop}
        >
          {pinOnTop ? <Pin size={14} strokeWidth={1.75} /> : <PinOff size={14} strokeWidth={1.75} />}
        </IconButton>
        {expanded ? (
          <IconButton label="Close workspace" onClick={onClose}>
            <X size={14} strokeWidth={1.75} />
          </IconButton>
        ) : (
          <>
            <IconButton label="Minimize" onClick={onMinimize}>
              <Minus size={14} strokeWidth={1.75} />
            </IconButton>
            <IconButton label="Close" onClick={onClose} danger>
              <X size={14} strokeWidth={1.75} />
            </IconButton>
          </>
        )}
      </div>
    </header>
  );
}

interface IconButtonProps {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  active?: boolean;
  danger?: boolean;
}

function IconButton({ label, onClick, children, active, danger }: IconButtonProps) {
  return (
    <motion.button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.92 }}
      transition={{ type: 'spring', stiffness: 400, damping: 22 }}
      className={[
        'focus-ring grid h-7 w-7 place-items-center rounded-lg border transition-colors',
        active
          ? 'border-accent-ice/30 bg-accent-ice/10 text-accent-ice'
          : 'border-transparent text-gray-500 hover:border-black/10 hover:bg-black/[0.06] hover:text-gray-700 dark:text-white/55 dark:hover:border-white/10 dark:hover:bg-white/[0.06] dark:hover:text-white/85',
        danger ? 'hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400' : '',
      ].join(' ')}
    >
      {children}
    </motion.button>
  );
}
