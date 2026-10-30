/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        spoot: {
          bg: '#0B0B0B',
          card: '#121212',
          surface: '#181818',
          elevated: '#242424',
          neon: '#00E676',
          'neon-hover': '#00C853',
          cyan: '#00B0FF',
          muted: '#B3B3B3',
          darkMuted: '#666666',
          danger: '#FF5252'
        }
      },
      fontFamily: {
        sans: ['"Circular Std"', '"Plus Jakarta Sans"', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'wave': 'wave 1.2s ease-in-out infinite',
      },
      keyframes: {
        wave: {
          '0%, 100%': { transform: 'scaleY(0.4)' },
          '50%': { transform: 'scaleY(1.0)' },
        }
      }
    },
  },
  plugins: [],
}
