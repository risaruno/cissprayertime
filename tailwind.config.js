/** @type {import('tailwindcss').Config} */
const plugin = require('tailwindcss/plugin')
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
        arabic: ['Poppins', 'sans-serif'],
        mono: ['Poppins', 'sans-serif'],
      },
      textShadow: {
        sm: '3px 2px 4px var(--tw-shadow-color)',
        DEFAULT: '6px 4px 6px var(--tw-shadow-color)',
        lg: '12px 8px 8px var(--tw-shadow-color)',
      },
      animation: {
        'scroll-infinite': 'scroll-infinite 90s linear infinite', // Slower scroll (was 60s) for better performance
      },
      keyframes: {
        'scroll-infinite': {
          '0%': { transform: 'translate3d(0, 0, 0)' }, // Use translate3d for GPU acceleration
          '100%': { transform: 'translate3d(-50%, 0, 0)' },
        },
      },
    },
  },
  plugins: [
    plugin(function ({ matchUtilities, theme }) {
      matchUtilities(
        {
          'text-shadow': (value) => ({
            textShadow: value,
          }),
        },
        { values: theme('textShadow') }
      )
    }),
  ],
};