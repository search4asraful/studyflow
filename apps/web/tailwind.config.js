/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './hooks/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        canvas: 'var(--bg-canvas)',
        surface: {
          DEFAULT: 'var(--bg-surface)',
          elevated: 'var(--bg-elevated)',
          subtle: 'var(--bg-subtle)',
        },
        border: {
          DEFAULT: 'var(--border-base)',
          subtle: 'var(--border-subtle)',
          focus: 'var(--border-focus)',
        },
        foreground: {
          DEFAULT: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--text-muted)',
        },
        accent: {
          DEFAULT: 'rgb(var(--accent-rgb) / <alpha-value>)',
          hover: 'var(--accent-hover)',
          contrast: 'var(--accent-contrast)',
          muted: 'var(--accent-muted)',
        },
        // Core user-provided template palette tokens:
        palette: {
          light: '#F9F7F7',
          ice: '#DBE2EF',
          blue: '#3F72AF',
          navy: '#112D4E',
        },
        dark: {
          bg: '#0E233D',
          surface: '#112D4E',
          elevated: '#1B3E69',
          border: '#1E4575',
          'text-primary': '#F9F7F7',
          'text-secondary': '#DBE2EF',
          'text-muted': '#8BAACD',
          accent: '#3F72AF',
          'accent-hover': '#5084C3',
        },
        light: {
          bg: '#F9F7F7',
          surface: '#FFFFFF',
          elevated: '#EEF3F9',
          border: '#DBE2EF',
          'text-primary': '#112D4E',
          'text-secondary': '#29476C',
          'text-muted': '#627D9E',
          accent: '#3F72AF',
          'accent-hover': '#325E93',
        },
      },
      fontFamily: {
        sans: [
          'var(--font-inter)',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
        editorial: ['var(--font-serif)', 'Georgia', 'serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
};
