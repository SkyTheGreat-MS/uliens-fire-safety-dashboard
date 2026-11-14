/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Overpass', 'sans-serif'],
        heading: ['"Fira Sans"', 'sans-serif'],
        mono: ['"Geist Mono"', 'SFMono-Regular', 'Consolas', 'monospace'],
      },
      fontWeight: {
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
        black: '900',
      },
    },
  },
  plugins: [],
}
