import type { Config } from 'tailwindcss'

export default {
  content: ['./src/renderer/index.html', './src/renderer/src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f5f7ff',
          100: '#ebefff',
          200: '#d6dfff',
          300: '#b3c2ff',
          400: '#8c9eff',
          500: '#667eea',
          600: '#4c63d2',
          700: '#3d4eac',
          800: '#2f3d8a',
          900: '#1e2870'
        }
      }
    }
  },
  plugins: []
} satisfies Config
