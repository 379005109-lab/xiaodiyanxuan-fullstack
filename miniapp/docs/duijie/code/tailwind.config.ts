import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Apple Design System Colors
        'apple-bg': '#FFFFFF',
        'apple-bg-secondary': '#F5F5F7',
        'apple-text-primary': '#1D1D1F',
        'apple-text-secondary': '#6E6E73',
        'apple-divider': '#E5E5EA',
        'apple-accent': '#C9A961', // 米金色，仅用于极少量点缀
      },
      borderRadius: {
        'apple': '16px',
        'apple-lg': '20px',
      },
      fontSize: {
        'apple-hero': ['34px', { lineHeight: '1.2', fontWeight: '600' }],
        'apple-title-lg': ['28px', { lineHeight: '1.3', fontWeight: '600' }],
        'apple-title': ['20px', { lineHeight: '1.4', fontWeight: '600' }],
        'apple-title-sm': ['17px', { lineHeight: '1.4', fontWeight: '600' }],
        'apple-body-lg': ['17px', { lineHeight: '1.5', fontWeight: '400' }],
        'apple-body': ['15px', { lineHeight: '1.5', fontWeight: '400' }],
        'apple-caption': ['13px', { lineHeight: '1.4', fontWeight: '400' }],
        'apple-caption-sm': ['12px', { lineHeight: '1.4', fontWeight: '400' }],
      },
      spacing: {
        'apple-xs': '8px',
        'apple-sm': '12px',
        'apple-md': '16px',
        'apple-lg': '20px',
        'apple-xl': '24px',
      },
      boxShadow: {
        'apple-subtle': '0 1px 3px rgba(0, 0, 0, 0.04)',
        'apple-card': '0 2px 8px rgba(0, 0, 0, 0.06)',
      },
      transitionTimingFunction: {
        'apple': 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        'apple-spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'apple-ease': 'cubic-bezier(0, 0, 0.2, 1)',
      },
      transitionDuration: {
        '120': '120ms',
        '160': '160ms',
        '180': '180ms',
        '220': '220ms',
        '260': '260ms',
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards',
        'fade-in': 'fadeIn 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards',
      },
      keyframes: {
        fadeInUp: {
          'from': {
            opacity: '0',
            transform: 'translateY(20px)',
          },
          'to': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        fadeIn: {
          'from': {
            opacity: '0',
          },
          'to': {
            opacity: '1',
          },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
