/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          500: '#3498db',
          600: '#2980b9',
          700: '#2c3e50',
        },
        gray: {
          750: '#34495e',
          850: '#2c3e50',
        }
      },
      borderWidth: {
        '3': '3px',
      }
    },
  },
  plugins: [],
} 