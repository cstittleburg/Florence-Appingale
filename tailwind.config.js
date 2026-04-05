/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f4ff',
          100: '#e0e9ff',
          200: '#c7d7fe',
          300: '#a5bbfc',
          400: '#8196f8',
          500: '#6272f1',
          600: '#4d56e5',
          700: '#3f47ca',
          800: '#343ba3',
          900: '#2f3681',
        },
      },
    },
  },
  plugins: [],
}
