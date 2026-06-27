/** @type {import('tailwindcss').Config} */
import forms from '@tailwindcss/forms';
import typography from '@tailwindcss/typography';
import aspectRatio from '@tailwindcss/aspect-ratio';
import tailwindcssAnimate from 'tailwindcss-animate';
import containerQueries from '@tailwindcss/container-queries';

// @ts-nocheck
/** @type {import('tailwindcss').Config} */
const config = {
  darkMode: ['class', '[data-mode="dark"]'],
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        primary: {
          DEFAULT: '#4361ee',
          50: '#f0f4fe',
          100: '#dde5fc',
          200: '#c3d3fa',
          300: '#9ab7f6',
          400: '#6a91f0',
          500: '#4361ee',
          600: '#2f43e2',
          700: '#2633cf',
          800: '#242ca8',
          900: '#232a85',
          950: '#141a4f',
        },
        // ... (keep all your existing color definitions)
      },
      // ... (keep all your existing theme extensions)
    },
  },
  plugins: [
    forms,
    typography,
    aspectRatio,
    tailwindcssAnimate,
    containerQueries,
    function ({ addUtilities }) {
      const newUtilities = {
        '.scrollbar-hide': {
          '-ms-overflow-style': 'none',
          'scrollbar-width': 'none',
          '&::-webkit-scrollbar': {
            display: 'none',
          },
        },
        '.scrollbar-default': {
          '-ms-overflow-style': 'auto',
          'scrollbar-width': 'auto',
          '&::-webkit-scrollbar': {
            display: 'block',
          },
        },
      }
      addUtilities(newUtilities)
    },
  ],
}

export default config