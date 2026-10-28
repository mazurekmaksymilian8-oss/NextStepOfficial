import { motion } from 'framer-motion';

interface LogoProps {
  size?: number;
  animated?: boolean;
}

/**
 * NextStep abstract mark — a compact layered chevron / "next step" glyph.
 * Drawn from strokes so it stays crisp at small sizes.
 */
export function Logo({ size = 22, animated = true }: LogoProps) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      initial={animated ? { opacity: 0, scale: 0.85 } : false}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      aria-hidden
    >
      <rect
        x="1.5"
        y="1.5"
        width="21"
        height="21"
        rx="7"
        stroke="url(#ns-grad)"
        strokeWidth="1.4"
        opacity="0.5"
      />
      <path
        d="M8.5 15.5L12 12L8.5 8.5"
        stroke="url(#ns-grad)"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M13.5 15.5L17 12L13.5 8.5"
        stroke="url(#ns-grad)"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.55"
      />
      <defs>
        <linearGradient id="ns-grad" x1="4" y1="3" x2="20" y2="21" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFFFFF" />
          <stop offset="0.55" stopColor="#A9C7FF" />
          <stop offset="1" stopColor="#B7B0FF" />
        </linearGradient>
      </defs>
    </motion.svg>
  );
}
