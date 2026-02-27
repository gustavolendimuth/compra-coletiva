/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        terracotta: {
          400: '#e07a5f',
          500: '#d4644a',
          600: '#c04d33',
        },
        cream: {
          50: '#fefdf8',
          100: '#fdf9ed',
          200: '#faf0d7',
        },
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        body: ['DM Sans', 'system-ui', 'sans-serif'],
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
      },
      animation: {
        'slide-in': 'slideIn 0.3s ease-out forwards',
        'slide-in-from-left': 'slideInFromLeft 0.3s ease-out',
        'fade-in': 'fadeIn 0.3s ease-out',
        'blob-float': 'blobFloat 18s ease-in-out infinite',
        'blob-float-reverse': 'blobFloat 22s ease-in-out infinite reverse',
        'float-card': 'floatCard 6s ease-in-out infinite',
        'reveal-up': 'revealUp 0.8s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        'scroll-bounce': 'scrollBounce 2s ease-in-out infinite',
        'pulse-ring': 'pulseRing 2s ease-in-out infinite',
      },
      keyframes: {
        slideIn: {
          '0%': { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideInFromLeft: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        blobFloat: {
          '0%, 100%': { transform: 'translate(0, 0) rotate(0deg) scale(1)' },
          '25%': { transform: 'translate(30px, -20px) rotate(5deg) scale(1.05)' },
          '50%': { transform: 'translate(-20px, 20px) rotate(-3deg) scale(0.95)' },
          '75%': { transform: 'translate(15px, 10px) rotate(4deg) scale(1.02)' },
        },
        floatCard: {
          '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
          '50%': { transform: 'translateY(-12px) rotate(1deg)' },
        },
        revealUp: {
          'to': { opacity: '1', transform: 'translateY(0)' },
        },
        scrollBounce: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(8px)' },
        },
        pulseRing: {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.6)', opacity: '0' },
        },
      },
    },
  },
  plugins: [],
}
