/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        clinical: {
          50:  '#e6f4fa',
          100: '#cce9f5',
          200: '#99d3eb',
          300: '#66bde1',
          400: '#33a7d7',
          500: '#0091cd',
          600: '#0074a4',
          700: '#00577b',
          800: '#003a52',
          900: '#001d29',
        },
        navy: {
          700: '#0d2137',
          800: '#091929',
          900: '#060f1a',
          950: '#030a12',
        },
        teal: {
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
        },
        brand: {
          50:  '#e8f4f8',
          100: '#d1e9f1',
          200: '#a3d3e3',
          300: '#75bdd5',
          400: '#47a7c7',
          500: '#1991b9',
          600: '#147494',
          700: '#0f576f',
          800: '#0a3a4a',
          900: '#051d25',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'card':   '0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.06)',
        'soft':   '0 2px 20px rgba(0,0,0,0.08)',
        'clinical': '0 0 0 1px rgba(20,184,166,0.2), 0 4px 16px rgba(20,184,166,0.08)',
      },
      backgroundImage: {
        'gradient-clinical': 'linear-gradient(135deg, #0074a4 0%, #0091cd 100%)',
        'gradient-teal':     'linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)',
        'gradient-navy':     'linear-gradient(180deg, #060f1a 0%, #0d2137 100%)',
        'gradient-alert':    'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
      },
      animation: {
        'fade-in':    'fadeIn 0.25s ease-out',
        'slide-up':   'slideUp 0.25s ease-out',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'blink':      'blink 1.2s step-end infinite',
      },
      keyframes: {
        fadeIn:  { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: 'translateY(6px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        blink:   { '0%,100%': { opacity: 1 }, '50%': { opacity: 0 } },
      },
    },
  },
  plugins: [],
}
