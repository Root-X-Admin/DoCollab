/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}", // all React files
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["Inter", "system-ui", "sans-serif"],
      },
      colors: {
        brand: {
          500: "#6366F1", // indigo
          600: "#4F46E5",
          700: "#3730A3",
        },
      },
    },
  },
  plugins: [],
};
