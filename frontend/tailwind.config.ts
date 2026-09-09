/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        casino: {
          dark: '#0f0f1a',
          darker: '#080812',
          card: '#1a1a2e',
          gold: '#f0c040',
          goldDark: '#c49b2a',
          accent: '#e94560',
          accentHover: '#ff6b81',
          text: '#eaeaea',
          muted: '#a0a0b0',
          border: '#2a2a40',
        },
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'win-flash': 'win-flash 0.5s ease-in-out 3',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 5px rgba(240, 192, 64, 0.5)' },
          '50%': { boxShadow: '0 0 20px rgba(240, 192, 64, 0.9)' },
        },
        'win-flash': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
      },
    },
  },
  plugins: [],
};
