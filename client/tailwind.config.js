/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ife: {
          bg: '#000000',      // Pitch Black
          panel: '#111111',   // Very Dark Gray
          border: '#FFD700',  // Airport Yellow
          text: '#FFD700',    // Airport Yellow (primary)
          'text-dim': '#AAAAAA', // Light Gray
          accent: '#FFD700',  // Airport Yellow
          water: '#1e3a5f',
          land: '#000000'
        },
        'airport-yellow': '#FFD700',
        'airport-black': '#000000'
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Monaco', 'Courier New', 'monospace'],
      }
    },
  },
  plugins: [],
}
