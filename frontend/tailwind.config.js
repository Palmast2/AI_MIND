/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.{js,ts,tsx}', './screens/**/*.{js,jsx,ts,tsx}','./components/**/*.{js,ts,tsx}'],

  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        background: '#00634C',
      }
    },
  },
  plugins: [],
};
