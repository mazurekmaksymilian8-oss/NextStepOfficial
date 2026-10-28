import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

export function Greeting() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.05 }}
      className="px-5 pt-2"
    >
      <div className="flex items-center gap-2">
        <h1 className="text-[22px] font-semibold leading-tight tracking-tight text-white">
          Hey. What are we figuring out?
        </h1>
      </div>
      <p className="mt-1.5 flex items-center gap-1.5 text-[12.5px] leading-relaxed text-white/45">
        <Sparkles size={12} className="text-accent-ice/70" strokeWidth={1.75} />
        Give me the context. I'll help you take the next step.
      </p>
    </motion.div>
  );
}
