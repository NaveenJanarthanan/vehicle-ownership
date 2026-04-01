import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eefbf4',
          100: '#d6f5e3',
          200: '#b0eacc',
          300: '#7cd9ae',
          400: '#46c28c',
          500: '#24a873',
          600: '#16875c',
          700: '#126c4c',
          800: '#11563e',
          900: '#104734',
          950: '#08281e',
        },
        surface: {
          50: '#f6f7f9',
          100: '#eceef2',
          200: '#d5d9e2',
          300: '#b1b9c9',
          400: '#8793ab',
          500: '#687591',
          600: '#535e78',
          700: '#444d62',
          800: '#3b4253',
          900: '#1e2130',
          950: '#131520',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};
export default config;
