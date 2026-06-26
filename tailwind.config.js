/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        // Friendly modern humanist sans — used everywhere, like the reference.
        display: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        // All palette tokens resolve to CSS variables so a single `data-theme`
        // flip re-themes the whole app (see index.css). `<alpha-value>` keeps
        // Tailwind's /opacity utilities working.
        ink: {
          950: 'rgb(var(--ink-950) / <alpha-value>)',
          900: 'rgb(var(--ink-900) / <alpha-value>)',
          850: 'rgb(var(--ink-850) / <alpha-value>)',
          800: 'rgb(var(--ink-800) / <alpha-value>)',
          700: 'rgb(var(--ink-700) / <alpha-value>)',
          600: 'rgb(var(--ink-600) / <alpha-value>)',
          500: 'rgb(var(--ink-500) / <alpha-value>)',
        },
        stone: {
          50: 'rgb(var(--stone-50) / <alpha-value>)',
          100: 'rgb(var(--stone-100) / <alpha-value>)',
          200: 'rgb(var(--stone-200) / <alpha-value>)',
          300: 'rgb(var(--stone-300) / <alpha-value>)',
          400: 'rgb(var(--stone-400) / <alpha-value>)',
          500: 'rgb(var(--stone-500) / <alpha-value>)',
          600: 'rgb(var(--stone-600) / <alpha-value>)',
          700: 'rgb(var(--stone-700) / <alpha-value>)',
        },
        paper: {
          50: 'rgb(var(--paper-50) / <alpha-value>)',
          100: 'rgb(var(--paper-100) / <alpha-value>)',
        },
        glow: {
          400: 'rgb(var(--glow-400) / <alpha-value>)',
          500: 'rgb(var(--glow-500) / <alpha-value>)',
          600: 'rgb(var(--glow-600) / <alpha-value>)',
        },
        accent: {
          400: 'rgb(var(--glow-400) / <alpha-value>)',
          500: 'rgb(var(--glow-500) / <alpha-value>)',
          600: 'rgb(var(--glow-600) / <alpha-value>)',
        },
        // Whisper-quiet earthy signal tones (urgency cues that still feel calm).
        signal: {
          red: '#e2674e',
          amber: '#d59a36',
          green: '#3f9d6d',
          blue: '#5b9bd5',
        },
        // Soft pastel accents — 100 (tint bg) / 600 / 700 (text) are theme-aware
        // via CSS vars so tinted cards adapt to dark mode; 500 stays vivid.
        mint: {
          100: 'rgb(var(--mint-100) / <alpha-value>)',
          200: '#c4e3d2',
          500: '#3f9d6d',
          600: 'rgb(var(--mint-600) / <alpha-value>)',
          700: 'rgb(var(--mint-700) / <alpha-value>)',
        },
        sky: {
          100: 'rgb(var(--sky-100) / <alpha-value>)',
          200: '#c7dbf6',
          500: '#5b9bd5',
          600: 'rgb(var(--sky-600) / <alpha-value>)',
          700: 'rgb(var(--sky-700) / <alpha-value>)',
        },
        butter: {
          100: 'rgb(var(--butter-100) / <alpha-value>)',
          200: '#f6e0a4',
          500: '#d59a36',
          600: 'rgb(var(--butter-600) / <alpha-value>)',
          700: 'rgb(var(--butter-700) / <alpha-value>)',
        },
        lilac: {
          100: 'rgb(var(--lilac-100) / <alpha-value>)',
          200: '#d6c8f4',
          500: '#8b6fc7',
          600: 'rgb(var(--lilac-600) / <alpha-value>)',
          700: 'rgb(var(--lilac-700) / <alpha-value>)',
        },
      },
      boxShadow: {
        // Soft, premium card shadows.
        card: '0 1px 2px rgba(22,21,19,0.04), 0 18px 40px -24px rgba(22,21,19,0.22)',
        soft: '0 1px 2px rgba(22,21,19,0.04), 0 10px 30px -18px rgba(22,21,19,0.18)',
        glow: '0 12px 28px -14px rgba(22,21,19,0.5)',
        panel: '0 1px 2px rgba(22,21,19,0.04), 0 24px 60px -30px rgba(22,21,19,0.3)',
      },
      borderRadius: { '4xl': '2rem' },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(0.9)', opacity: '0.6' },
          '70%': { transform: 'scale(1.6)', opacity: '0' },
          '100%': { opacity: '0' },
        },
        shimmer: { '100%': { transform: 'translateX(100%)' } },
        marquee: { '0%': { transform: 'translateX(0)' }, '100%': { transform: 'translateX(-50%)' } },
      },
      animation: {
        'fade-up': 'fade-up 0.35s ease-out both',
        'pulse-ring': 'pulse-ring 1.6s cubic-bezier(0.2,0.6,0.4,1) infinite',
        shimmer: 'shimmer 1.6s infinite',
        marquee: 'marquee 28s linear infinite',
      },
    },
  },
  plugins: [],
};
