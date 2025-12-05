/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ZenLife 2.0 Fresh Nature Gradient 色彩系统
        stone: {
          50: '#F2F4F3',
          100: '#E6EBE9',
          200: '#D1DCD9',
          300: '#B0C4BF',
          800: '#2A3C36',
          900: '#14452F',
        },
        // 主色系 - 翠绿色
        primary: {
          DEFAULT: '#22c55e',
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        // 天空蓝色系
        sky: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
        },
        // 青色系
        cyan: {
          300: '#67e8f9',
          400: '#22d3ee',
          500: '#06b6d4',
        },
        // 翡翠绿
        emerald: {
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
        },
        // 价格金色
        gold: {
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
        },
        accent: {
          DEFAULT: '#D6AD60',
          light: '#E8C98D',
          dark: '#B89248',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', '"Noto Sans SC"', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'Arial', '"PingFang SC"', '"Hiragino Sans GB"', '"Microsoft YaHei"', 'sans-serif'],
        serif: ['Georgia', '"Times New Roman"', '"SimSun"', 'serif'],
      },
      // ZenLife 阴影系统
      boxShadow: {
        'soft': '0 10px 40px -10px rgba(14, 165, 233, 0.1)',
        'card': '0 4px 25px -5px rgba(0,0,0,0.05)',
        'float': '0 20px 40px -10px rgba(34, 197, 94, 0.2)',
        'glow': '0 8px 20px -6px rgba(52, 211, 153, 0.5)',
      },
      borderRadius: {
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.5s ease-out',
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'implode': 'implode 3s ease-in-out infinite',
        'blob': 'blob 7s infinite',
        'bounce-slow': 'bounce 3s infinite',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        blob: {
          '0%': { transform: 'translate(0px, 0px) scale(1)' },
          '33%': { transform: 'translate(30px, -50px) scale(1.1)' },
          '66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
          '100%': { transform: 'translate(0px, 0px) scale(1)' },
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

