/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eefcf5',
          100: '#d6f7e4',
          200: '#afedcb',
          300: '#7bdcac',
          400: '#45c389',
          500: '#20a870',
          600: '#14875a',
          700: '#126b49',
          800: '#12553c',
          900: '#114633',
          950: '#07281d'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif']
      }
    }
  },
  plugins: []
};
