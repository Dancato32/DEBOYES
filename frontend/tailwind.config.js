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
          'cream': '#FDF6E3',
          'charcoal': '#2D1215',
        }
      },
      fontFamily: {
        'dmsans': ['"DM Sans"', 'sans-serif'],
        'playfair': ['"Playfair Display"', 'serif'],
      },
      boxShadow: {
        soft: '0 10px 30px rgba(15, 23, 42, 0.08)'
      }
    }
  },
  plugins: [require('@tailwindcss/forms')]
}
