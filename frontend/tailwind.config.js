/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        futuristic: {
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
        accent: '#f472b6',
        dark: '#18181b',
      },
      fontFamily: {
        futuristic: ['Orbitron', 'Montserrat', 'sans-serif'],
      },
      boxShadow: {
        neon: '0 0 20px #6366f1, 0 0 40px #f472b6',
      },
      animation: {
        fade: 'fadeIn 0.7s ease-in',
        slide: 'slideIn 0.7s cubic-bezier(0.4, 0, 0.2, 1)',
        bounce: 'bounce 1s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
        slideIn: {
          '0%': { transform: 'translateY(40px)', opacity: 0 },
          '100%': { transform: 'translateY(0)', opacity: 1 },
        },
      },
    },
  },
  plugins: [require('@tailwindcss/forms'), require('@tailwindcss/typography')],
};
