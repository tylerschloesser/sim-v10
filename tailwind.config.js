/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      keyframes: ({ theme }) => ({
        'dialog-in': {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
        'dialog-out': {
          '0%': { opacity: 1 },
          '100%': { opacity: 0 },
        },
      }),
      animation: {
        'dialog-in': 'dialog-in 200ms ease-out',
        'dialog-out': 'dialog-out 200ms ease-out',
      }
    },
  },
  plugins: [],
}
