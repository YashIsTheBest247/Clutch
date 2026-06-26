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
        // Near-black scale — text + black pill buttons + the one dark card.
        ink: {
          950: '#0c0b0a',
          900: '#161513',
          850: '#1d1b18',
          800: '#262320',
          700: '#3a3631',
          600: '#5c564e',
          500: '#827b71',
        },
        // Warm taupe / stone — the calm neutral world of the UI.
        stone: {
          50: '#faf9f7',
          100: '#f4f2ee',
          200: '#ebe8e2',
          300: '#ddd9d1',
          400: '#cdc7bd',
          500: '#b3aca0',
          600: '#8a8377',
          700: '#615b51',
        },
        paper: { 50: '#ffffff', 100: '#fbfaf8' },
        // `glow`/`accent` remap to near-black so legacy accent classes go monochrome.
        glow: { 400: '#2b2824', 500: '#161513', 600: '#0c0b0a' },
        accent: { 400: '#2b2824', 500: '#161513', 600: '#0c0b0a' },
        // Whisper-quiet earthy signal tones (urgency cues that still feel calm).
        signal: {
          red: '#b05c43',
          amber: '#94794a',
          green: '#6e7a64',
          blue: '#6e7a64',
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
