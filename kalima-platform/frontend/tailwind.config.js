/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0E5563',
          content: '#FFFFFF',
        },
        secondary: {
          DEFAULT: '#146A78',
          content: '#FFFFFF',
        },
        accent: {
          DEFAULT: '#F39A3F',
          content: '#FFFFFF',
        },
        neutral: {
          DEFAULT: '#374151',
          content: '#FFFFFF',
        },
        info: {
          DEFAULT: '#4DB3C2',
          content: '#111827',
        },
        success: {
          DEFAULT: 'oklch(62% 0.194 149.214)',
          content: 'oklch(98% 0.018 155.826)',
        },
        warning: {
          DEFAULT: '#F39A3F',
          content: '#111827',
        },
        error: {
          DEFAULT: 'oklch(58% 0.253 17.585)',
          content: 'oklch(96% 0.015 12.422)',
        },
        base: {
          100: '#F8F3E9',
          200: '#F1F3F6',
          300: '#EBC468',
          content: '#111827',
        },
      },
      animation: {
        'bounce-slow': 'bounce-slow 3s ease-in-out infinite',
      },
      keyframes: {
        'bounce-slow': {
          '0%, 100%': { 
            transform: 'translateY(-25%)',
            animationTimingFunction: 'cubic-bezier(0.8,0,1,1)',
          },
          '50%': { 
            transform: 'translateY(0)',
            animationTimingFunction: 'cubic-bezier(0,0,0.2,1)',
          },
        },
      },
    },
  },
   plugins: [
     require("@tailwindcss/postcss"),
   ],
 };
