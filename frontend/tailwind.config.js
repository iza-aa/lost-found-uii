/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        'uii-blue': '#003479', // Biru UII
        'uii-gold': '#FDBF0F', // Kuning/Emas UII
      }
    },
  },
  plugins: [],
}