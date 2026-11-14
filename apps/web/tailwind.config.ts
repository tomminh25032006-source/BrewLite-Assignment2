import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brew: {
          50: '#FDFBF7',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#F59E0B',
          500: '#D97706',
          600: '#B45309',
          700: '#92400E',
          800: '#78350F',
          900: '#451A03',
          dark: '#1C1917',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'sans-serif'],
      },
      boxShadow: {
        'brew-card': '0 4px 20px -2px rgba(133, 77, 14, 0.08)',
        'brew-float': '0 10px 30px -4px rgba(133, 77, 14, 0.18)',
      },
    },
  },
  plugins: [],
};

export default config;
