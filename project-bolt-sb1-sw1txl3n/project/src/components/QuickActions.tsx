import { motion } from 'framer-motion';
import { ScanSearch, Terminal, Sparkles } from 'lucide-react';
import type { QuickActionId } from '@/types';

interface QuickActionsProps {
  onAction: (action: QuickActionId) => void;
  disabled?: boolean;
}

const actions: { id: QuickActionId; label: string; description: string; icon: React.ReactNode }[] = [
  { id: 'understand', label: 'Understand my screen', description: 'Read what I see', icon: <ScanSearch size={16} strokeWidth={1.75} /> },
  { id: 'error', label: 'Explain this error', description: 'Decode the message', icon: <Terminal size={16} strokeWidth={1.75} /> },
  { id: 'unstuck', label: 'Help me get unstuck', description: 'Find the next move', icon: <Sparkles size={16} strokeWidth={1.75} /> },
];

export function QuickActions({ onAction, disabled }: QuickActionsProps) {
  return (
    <div className="px-5 pt-3">
      <div className="grid grid-cols-3 gap-2.5">
        {actions.map((action, i) => (
          <motion.button
            key={action.id}
            type="button"
            disabled={disabled}
            onClick={() => onAction(action.id)}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.06, type: 'spring', stiffness: 300, damping: 24 }}
            whileHover={disabled ? undefined : { y: -2 }}
            whileTap={disabled ? undefined : { scale: 0.97 }}
            className={[
              'focus-ring group flex flex-col gap-2 rounded-xl2 border p-3 text-left transition-all duration-200',
              'border-black/8 bg-black/[0.015] hover:border-accent-ice/25 hover:bg-black/[0.03]',
              'dark:border-white/8 dark:bg-white/[0.025] dark:hover:border-accent-ice/25 dark:hover:bg-white/[0.045]',
              'disabled:cursor-not-allowed disabled:opacity-40',
            ].join(' ')}
          >
            <div className="grid h-7 w-7 place-items-center rounded-lg bg-black/[0.06] text-gray-600 transition-all duration-200 group-hover:bg-accent-ice/10 group-hover:text-accent-ice dark:bg-white/[0.06] dark:text-white/70 dark:group-hover:bg-accent-ice/10 dark:group-hover:text-accent-ice">
              {action.icon}
            </div>
            <div>
              <p className="text-[11.5px] font-semibold leading-tight text-gray-800 dark:text-white/90">{action.label}</p>
              <p className="mt-0.5 text-[10px] text-gray-400 dark:text-white/35">{action.description}</p>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
