/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: 'var(--primary)',
        'primary-dark': 'var(--primary-dark)',
        secondary: 'var(--secondary)',
        accent: 'var(--accent)',
        success: 'var(--success)',
        warning: 'var(--warning)',
        error: 'var(--error)',
      },
      boxShadow: {
        sidebar: '0 0 10px rgba(0, 0, 0, 0.1)',
        control: '0 2px 5px rgba(0, 0, 0, 0.08)',
      },
    },
  },
  plugins: [],
};