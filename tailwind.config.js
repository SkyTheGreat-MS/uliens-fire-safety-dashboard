/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        void: '#111827',
        surface: '#1F2937',
        raised: '#374151',
        line: '#374151',
        tick: '#4B5563',
        ink: '#F9FAFB',
        secondary: '#9CA3AF',
        muted: '#6B7280',
        primary: {
          DEFAULT: '#34D399',
          hover: '#6EE7B7',
          fill: 'rgba(52, 211, 153, 0.12)',
        },
        highlight: '#6EE7B7',
        success: {
          DEFAULT: '#22C55E',
          fill: 'rgba(34, 197, 94, 0.15)',
        },
        info: {
          DEFAULT: '#3B82F6',
          fill: 'rgba(59, 130, 246, 0.15)',
        },
        caution: {
          DEFAULT: '#FACC15',
          fill: 'rgba(250, 204, 21, 0.15)',
        },
        warning: {
          DEFAULT: '#F97316',
          fill: 'rgba(249, 115, 22, 0.15)',
        },
        critical: {
          DEFAULT: '#EF4444',
          fill: 'rgba(239, 68, 68, 0.18)',
        },
        // Compatibility aliases for legacy bindings
        cyan: '#34D399',
        amber: '#FACC15',
        red: '#EF4444',
        'red-fill': 'rgba(239, 68, 68, 0.18)',
        green: '#22C55E',
      },
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
