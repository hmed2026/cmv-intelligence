import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: '#080E1A',
          'bg-secondary': '#0D1526',
          'bg-card': 'rgba(255, 255, 255, 0.04)',
          border: 'rgba(255, 255, 255, 0.08)',
          blue: '#3B82F6',
          'blue-dark': '#1E40AF',
          'blue-light': '#60A5FA',
          success: '#10B981',
          warning: '#F59E0B',
          danger: '#EF4444',
          'text-primary': '#F9FAFB',
          'text-secondary': '#9CA3AF',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'blue-gradient': 'linear-gradient(135deg, #3B82F6, #1E40AF)',
        'glass-gradient': 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))',
      },
      boxShadow: {
        glass: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255,255,255,0.06)',
        'glow-blue': '0 0 30px rgba(59, 130, 246, 0.35)',
        'glow-green': '0 0 30px rgba(16, 185, 129, 0.35)',
        'glow-red': '0 0 30px rgba(239, 68, 68, 0.35)',
        'glow-orange': '0 0 30px rgba(245, 158, 11, 0.35)',
        'card-hover': '0 20px 40px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(59,130,246,0.1)',
      },
      animation: {
        fadeIn: 'fadeIn 0.4s ease-out',
        slideUp: 'slideUp 0.4s ease-out',
        slideInLeft: 'slideInLeft 0.3s ease-out',
        shimmer: 'shimmer 1.5s infinite',
        'pulse-glow': 'pulseGlow 2s infinite',
        'spin-slow': 'spin 3s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(59,130,246,0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(59,130,246,0.6)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
    },
  },
  plugins: [],
};

export default config;
