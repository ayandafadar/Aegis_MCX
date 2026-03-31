/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'bg-primary': '#0a0c10',
        'bg-secondary': '#0d1117',
        'bg-card': 'rgba(17, 24, 39, 0.55)',
        'bg-card-hover': 'rgba(30, 41, 59, 0.65)',
        'border': 'rgba(255, 255, 255, 0.08)',
        'border-bright': 'rgba(255, 255, 255, 0.15)',
        'cyan': '#00d4ff',
        'cyan-dim': '#00a0c0',
        'amber': '#f59e0b',
        'emerald': '#10b981',
        'crimson': '#ef4444',
        'purple': '#8b5cf6',
        'text-primary': '#e2e8f0',
        'text-secondary': '#94a3b8',
        'text-muted': '#475569',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        display: ['Syne', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
