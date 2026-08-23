import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#07090e',
        surface: '#0f141c',
        'surface-card': '#141b26',
        'surface-hover': '#1b2433',
        primary: {
          DEFAULT: '#3b82f6',
          hover: '#2563eb',
        },
        pass: {
          DEFAULT: '#10b981',
          bg: '#064e3b',
          border: '#059669',
        },
        stepup: {
          DEFAULT: '#f59e0b',
          bg: '#78350f',
          border: '#d97706',
        },
        decline: {
          DEFAULT: '#ef4444',
          bg: '#7f1d1d',
          border: '#dc2626',
        },
      },
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;
