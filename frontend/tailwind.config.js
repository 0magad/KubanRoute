/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        terracotta: {
          50: '#FFF5F0',
          100: '#FFE8DB',
          200: '#FFD0B5',
          300: '#FFB088',
          400: '#E8845A',
          500: '#C75B39',
          600: '#A8452A',
          700: '#85331E',
          800: '#632515',
          900: '#42190E',
        },
        forest: {
          50: '#F0F7F2',
          100: '#D9EBE0',
          200: '#B3D7C1',
          300: '#7FBC99',
          400: '#4D9A70',
          500: '#2D5F3E',
          600: '#244D32',
          700: '#1B3A26',
          800: '#12281A',
          900: '#0A150E',
        },
        cream: {
          50: '#FFFCF7',
          100: '#FFF8F0',
          200: '#FFF3E5',
          300: '#FFECDA',
          400: '#FFE0C5',
          500: '#FFD4AF',
        },
        gold: {
          50: '#FFF9EC',
          100: '#FFF0D0',
          200: '#FFE3A8',
          300: '#FFD47D',
          400: '#D4A853',
          500: '#B8903A',
          600: '#9A7830',
          700: '#7C6026',
          800: '#5E481D',
          900: '#403013',
        },
      },
      fontFamily: {
        display: ['Playfair Display', 'Georgia', 'serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'fade-in-up': 'fadeInUp 0.6s ease-out',
        'slide-in-right': 'slideInRight 0.4s ease-out',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [],
};
