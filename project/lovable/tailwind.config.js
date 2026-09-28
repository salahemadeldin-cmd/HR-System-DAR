export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy:   { DEFAULT: '#2B3080', dark: '#22276B', light: '#D5D9EF', pale: '#ECEEF8' },
        ink:    '#3A3A3C',
        danger: '#8A2B2B',
        paper:  '#F6F6F7',
      },
      fontFamily: { sans: ['Cairo', 'Tahoma', 'sans-serif'] },
      boxShadow: { card: '0 1px 2px rgba(43,48,128,.06), 0 8px 24px rgba(43,48,128,.06)' },
      borderRadius: { xl2: '14px' },
    },
  },
  plugins: [],
};
