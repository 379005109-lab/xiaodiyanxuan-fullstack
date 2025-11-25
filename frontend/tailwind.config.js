/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        stone: {
          50: '#F2F4F3',
          100: '#E6EBE9',
          200: '#D1DCD9',
          300: '#B0C4BF',
          800: '#2A3C36',
          900: '#14452F',
        },
        primary: {
          DEFAULT: '#14452F',
          50: '#F0FDF4',
          100: '#DCFCE7',
          800: '#166534',
          900: '#14452F',
        },
        accent: {
          DEFAULT: '#D6AD60',
          light: '#E8C98D',
          dark: '#B89248',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Playfair Display', 'serif'],
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.5s ease-out',
        'float': 'float 3s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'implode': 'implode 3s ease-in-out infinite',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        implode: {
          '0%': { transform: 'translate(var(--start-x), var(--start-y)) scale(0.5)', opacity: '0' },
          '20%': { opacity: '1' },
          '100%': { transform: 'translate(0, 0) scale(0.2)', opacity: '0' }
        }
      },
    },
  },
  plugins: [],
}

