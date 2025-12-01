/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  darkMode: 'class', // Enable dark mode dengan class
  theme: {
    extend: {
      colors: {
        'uii-blue': '#003479', // Biru UII
        'uii-gold': '#FDBF0F', // Kuning/Emas UII
        'uii-orange': '#F97316', // Orange untuk aksi finder
      }
    },
  },
  plugins: [],
}