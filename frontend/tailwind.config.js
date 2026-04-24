/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        'brand': {
          'red': '#ed1c24',
          'dark-red': '#c0111a',
          'deep-dark': '#1A0A0B',
          'yellow': '#ffcb05',
          'yellow-light': '#ffdf66',
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
