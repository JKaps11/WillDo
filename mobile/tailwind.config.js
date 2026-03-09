/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2DB88A',
          foreground: '#F5FBF8',
          dark: '#3DD9A0',
        },
        background: {
          DEFAULT: '#FFFFFF',
          dark: '#1A1B2E',
        },
        card: {
          DEFAULT: '#FFFFFF',
          dark: '#2A2B42',
          foreground: '#1A1B2E',
        },
        muted: {
          DEFAULT: '#F4F4F5',
          foreground: '#71717A',
          dark: '#3A3B52',
        },
        destructive: {
          DEFAULT: '#EF4444',
          dark: '#F87171',
        },
        border: {
          DEFAULT: '#E4E4E7',
          dark: 'rgba(255, 255, 255, 0.1)',
        },
        // Stage colors matching web
        stage: {
          'not-started': '#9CA3AF',
          practice: '#3B82F6',
          evaluate: '#8B5CF6',
          complete: '#10B981',
        },
      },
    },
  },
  plugins: [],
};
