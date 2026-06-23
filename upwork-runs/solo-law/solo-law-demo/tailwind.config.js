/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      colors: {
        'bg-base':    '#0D0D0D',
        'bg-surface': '#141414',
        'text-primary':   '#F5F3EF',
        'text-secondary': '#9E9E9E',
        accent:       '#C9A96E',
        'accent-hover': '#B8955A',
        'accent-dim': 'rgba(201,169,110,0.40)',
        rule:         '#D0CBBE',
        danger:       '#C0392B',
      },
      fontFamily: {
        serif: ['Cormorant Garamond', 'Georgia', 'serif'],
        sans:  ['Inter', 'system-ui', 'sans-serif'],
        mono:  ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};
