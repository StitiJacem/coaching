/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['"Bebas Neue"', 'sans-serif'],
      },
      colors: {
        gosport: {
          dark: '#0F172A',
          surface: '#1E293B',
          border: '#334155',
          orange: '#F97316',
          lime: '#84CC16',
          danger: '#EF4444',
        },
        // Keep galio and escd for backward compatibility during migration
        escd: {
          dark: '#0F172A',
          surface: '#1E293B',
          border: '#334155',
          orange: '#F97316',
          lime: '#84CC16',
          danger: '#EF4444',
        },
        galio: {
          dark: '#0F172A',
          surface: '#1E293B',
          border: '#334155',
          orange: '#F97316',
          lime: '#84CC16',
          danger: '#EF4444',
        }
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shine': 'shine 2s infinite',
      },
      keyframes: {
        shine: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        }
      }
    },
  },
  plugins: [],
}
