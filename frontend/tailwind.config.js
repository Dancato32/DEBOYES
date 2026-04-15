/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        'brand': {
          'red': '#C0111A',
          'dark-red': '#8B0B11',
          'deep-dark': '#1A0A0B',
          'gold': '#F5B50A',
          'gold-light': '#FAD55A',
          'cream': '#FFFBEB',
          'charcoal': '#2D1215',
        }
      },
      fontFamily: {
        'poppins': ['"Poppins"', 'sans-serif'],
        'inter': ['"Inter"', 'sans-serif'],
        'pacifico': ['"Pacifico"', 'cursive'],
      },
      boxShadow: {
        soft: '0 10px 30px rgba(15, 23, 42, 0.08)'
      }
    }
  },
  plugins: [require('@tailwindcss/forms')]
}
