/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gov: {
          navy: "#0A192F",
          dark: "#0F172A",
          slate: "#1E293B",
          blue: "#2563EB",
          cyan: "#06B6D4",
          emerald: "#10B981",
          amber: "#F59E0B",
          rose: "#F43F5E",
          card: "rgba(30, 41, 59, 0.7)"
        }
      }
    },
  },
  plugins: [],
}
