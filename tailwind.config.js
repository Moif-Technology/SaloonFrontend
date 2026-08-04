/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        salon: {
          dark: '#790728',
          light: '#f5e6e8',
        }
      }
    },
  },
  plugins: [],
}
