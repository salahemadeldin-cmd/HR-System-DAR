export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy:   { DEFAULT: '#2E3192', dark: '#1C1F66', light: '#D5D9EF', pale: '#ECEEF8' },
        ink:    '#2B2B2E',
        danger: '#B3261E',
        paper:  '#EEF0F4',
      },
      fontFamily: { sans: ['Calibri', 'Carlito', 'sans-serif'] },
      boxShadow: { card: '0 1px 2px rgba(43,48,128,.06), 0 8px 24px rgba(43,48,128,.06)' },
      borderRadius: { xl2: '14px' },
    },
  },
  plugins: [],
};
