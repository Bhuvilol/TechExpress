/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      animation: {
        grid: 'grid 15s linear infinite',
        'shimmer': 'shimmer 1.6s linear infinite',
        'fade-up': 'fadeUp 320ms cubic-bezier(0.16, 1, 0.3, 1) both',
        'pulse-soft': 'pulseSoft 2.4s ease-in-out infinite',
      },
      keyframes: {
        grid: {
          '0%':   { transform: 'translateY(-50%)' },
          '100%': { transform: 'translateY(0)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-400px 0' },
          '100%': { backgroundPosition: '400px 0' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.55' },
        },
      },
      colors: {
        // Surfaces — three-tier elevation
        'bg-void':       '#000000',
        'bg-surface-1':  '#0a0a0a',
        'bg-surface-2':  '#121212',
        'bg-surface-3':  '#1a1a1a',
        // Borders
        'border-dim':    '#1c1c1c',
        'border-mid':    '#2a2a2a',
        'border-active': '#3a3a3a',
        // Single accent (focus + primary signal)
        'accent-cyan':       '#22d3ee',
        'accent-cyan-soft':  'rgba(34, 211, 238, 0.12)',
        // Status — distinct, dark-theme tuned
        'status-live':   '#34d399',
        'status-warn':   '#fbbf24',
        'status-crit':   '#f87171',
        'status-info':   '#22d3ee',
        // Text scale
        'text-primary':  '#f5f5f5',
        'text-secondary':'#a3a3a3',
        'text-dim':      '#666666',
        'text-mute':     '#404040',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      transitionDuration: {
        '160': '160ms',
        '320': '320ms',
      },
      boxShadow: {
        'focus-ring': '0 0 0 2px rgba(34, 211, 238, 0.55)',
        'glow-cyan':  '0 0 24px -4px rgba(34, 211, 238, 0.45)',
      },
    },
  },
};
