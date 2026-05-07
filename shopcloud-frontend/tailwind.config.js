/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#17211f',
        cloud: '#f5f7f6',
        moss: '#52685c',
        coral: '#e86f52',
        gold: '#d49b35',
      },
    },
  },
  plugins: [],
}
