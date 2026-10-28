/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#08090B',
          900: '#0B0D10',
          850: '#0D0F12',
          800: '#14161A',
          750: '#181B20',
          700: '#1E2127',
          600: '#262A31',
          500: '#2E333B',
          400: '#3A4049',
        },
        accent: {
          ice: '#A9C7FF',
          violet: '#B7B0FF',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"SF Mono"', 'Menlo', 'monospace'],
      },
      borderRadius: {
        'xl2': '1.25rem',
        'xl3': '1.5rem',
        'xl4': '1.75rem',
      },
      boxShadow: {
        'win': '0 24px 60px -12px rgba(0,0,0,0.7), 0 8px 24px -8px rgba(0,0,0,0.5)',
        'win-light': '0 24px 60px -12px rgba(0,0,0,0.12), 0 8px 24px -8px rgba(0,0,0,0.08)',
        'soft': '0 2px 12px -2px rgba(0,0,0,0.4)',
        'glow': '0 0 0 1px rgba(169,199,255,0.12), 0 0 24px -4px rgba(169,199,255,0.25)',
      },
      animation: {
        'breathe': 'breathe 3.2s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'pulse-soft': 'pulseSoft 2.4s ease-in-out infinite',
        'fade-in': 'fadeIn 200ms ease-out',
      },
      keyframes: {
        breathe: {
          '0%,100%': { transform: 'scale(1)', opacity: '0.9' },
          '50%': { transform: 'scale(1.06)', opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        pulseSoft: {
          '0%,100%': { opacity: '0.5' },
          '50%': { opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
