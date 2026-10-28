import { motion } from 'framer-motion';

/**
 * Animated AI orb shown while the model is "thinking".
 * Layered breathing rings + a core glow. Calm, not flashy.
 */
export function ThinkingOrb({ label = 'Thinking through it…' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-5 px-5 py-16">
      <div className="relative grid h-24 w-24 place-items-center">
        {/* Outer ring */}
        <motion.div
          className="absolute inset-0 rounded-full border border-accent-ice/15"
          animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.15, 0.4] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
        />
        {/* Mid ring */}
        <motion.div
          className="absolute inset-3 rounded-full border border-accent-ice/20"
          animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.25, 0.5] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
        />
        {/* Core */}
        <motion.div
          className="relative h-10 w-10 rounded-full"
          style={{
            background:
              'radial-gradient(circle at 35% 30%, #FFFFFF 0%, #A9C7FF 45%, #6B7AFF 100%)',
            boxShadow: '0 0 24px -2px rgba(169,199,255,0.5), 0 0 60px -10px rgba(183,176,255,0.35)',
          }}
          animate={{ scale: [1, 1.08, 1], opacity: [0.9, 1, 0.9] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
        {/* Orbiting dot */}
        <motion.div
          className="absolute h-1.5 w-1.5 rounded-full bg-white"
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          style={{ transformOrigin: '48px 0px' }}
        />
      </div>

      <div className="flex flex-col items-center gap-1.5">
        <p className="shimmer-text text-[12.5px] font-medium">{label}</p>
        <motion.div
          className="flex gap-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="h-1 w-1 rounded-full bg-white/40"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: i * 0.2,
                ease: 'easeInOut',
              }}
            />
          ))}
        </motion.div>
      </div>
    </div>
  );
}
