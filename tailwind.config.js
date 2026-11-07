/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        metro: ['"Segoe UI"', '"Segoe UI Variable Text"', '"Helvetica Neue"', 'Helvetica', 'Arial', 'sans-serif'],
      },
      keyframes: {
        pop: {
          '0%': { transform: 'scale(0.4)', opacity: '0' },
          '60%': { transform: 'scale(1.12)', opacity: '1' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        floaty: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-14px)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%, 60%': { transform: 'translateX(-7px)' },
          '40%, 80%': { transform: 'translateX(7px)' },
        },
        dealIn: {
          '0%': { transform: 'translateY(-24px) rotate(-6deg) scale(0.85)', opacity: '0' },
          '100%': { transform: 'none', opacity: '1' },
        },
        shine: {
          '0%': { transform: 'translateX(-150%) skewX(-20deg)' },
          '60%, 100%': { transform: 'translateX(350%) skewX(-20deg)' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(163, 230, 53, 0.75)' },
          '50%': { boxShadow: '0 0 0 10px rgba(163, 230, 53, 0)' },
        },
        rise: {
          '0%': { transform: 'translateY(8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      animation: {
        pop: 'pop 0.45s cubic-bezier(0.2, 0.9, 0.3, 1.3) both',
        floaty: 'floaty 7s ease-in-out infinite',
        'floaty-slow': 'floaty 11s ease-in-out infinite',
        shake: 'shake 0.4s ease-in-out',
        dealIn: 'dealIn 0.35s ease-out both',
        shine: 'shine 3.2s ease-in-out infinite',
        glowPulse: 'glowPulse 1.4s ease-in-out infinite',
        rise: 'rise 0.3s ease-out both',
      },
    },
  },
  plugins: [],
};
