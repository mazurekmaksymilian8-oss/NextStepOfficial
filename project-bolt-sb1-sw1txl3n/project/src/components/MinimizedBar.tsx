import { motion } from 'framer-motion';
import { ChevronUp } from 'lucide-react';
import { Logo } from '@/components/Logo';

interface MinimizedBarProps {
  onRestore: () => void;
  onClose: () => void;
}

/** Compact pill shown when the window is minimized. */
export function MinimizedBar({ onRestore }: MinimizedBarProps) {
  return (
    <motion.button
      type="button"
      onClick={onRestore}
      initial={{ opacity: 0, scale: 0.9, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 10 }}
      transition={{ type: 'spring', stiffness: 300, damping: 26 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="focus-ring flex items-center gap-2.5 rounded-full border border-white/12 bg-ink-850/90 px-3.5 py-2 shadow-win backdrop-blur-xl"
    >
      <Logo size={16} animated={false} />
      <span className="text-[12px] font-semibold tracking-tight text-white/90">NextStep</span>
      <span className="h-1 w-1 rounded-full bg-emerald-400" />
      <ChevronUp size={13} className="text-white/40" strokeWidth={1.75} />
    </motion.button>
  );
}
