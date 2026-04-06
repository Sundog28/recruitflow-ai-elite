/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#0a0a0f",
        panel: "#11111a",
        accent: "#8b5cf6",
        accent2: "#22c55e",
        text: "#f5f5f7",
        muted: "#9ca3af"
      },
      boxShadow: {
        neon: "0 0 30px rgba(139,92,246,0.25)"
      }
    },
  },
  plugins: [],
}
