/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        blue: { DEFAULT: '#185FA5', light: '#E6F1FB', dark: '#0C447C' },
        green: { DEFAULT: '#3B6D11', light: '#EAF3DE' },
        amber: { DEFAULT: '#854F0B', light: '#FAEEDA' },
        red: { DEFAULT: '#A32D2D', light: '#FCEBEB' },
        teal: { DEFAULT: '#0F6E56', light: '#E1F5EE' },
        purple: { DEFAULT: '#534AB7', light: '#EEEDFE' },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Inter', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '8px',
        lg: '12px',
      },
    },
  },
  plugins: [],
};
