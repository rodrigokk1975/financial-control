/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      colors: {
        surface: {
          950: '#070b14',
          900: '#0d1321',
          800: '#131c31',
          700: '#1c2842',
        },
      },
      boxShadow: {
        glow: '0 0 40px -12px rgba(16, 185, 129, 0.35)',
        card: '0 12px 32px -16px rgba(0, 0, 0, 0.65)',
      },
    },
  },
  plugins: [],
};
