/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        // ── Core palette: Deep Indigo + Warm Amber + Ivory ──────────
        canvas:        '#f8f7f4',   // warm ivory background
        charcoal:      '#1c1917',   // warm near-black
        forest:        '#312e81',   // deep indigo (primary)
        mint:          '#6366f1',   // bright indigo-violet (accent)
        'light-green': '#e0e7ff',   // pale indigo

        // Semantic shades
        'forest-light': '#4338ca',
        'forest-dark':  '#1e1b4b',
        'mint-light':   '#818cf8',
        'mint-dark':    '#4f46e5',

        // Amber accent
        amber:      '#d97706',
        amberLight: '#fef3c7',
        amberMid:   '#f59e0b',

        // Surface system
        'surface-0':   '#f8f7f4',
        'surface-1':   '#f0ede8',
        'surface-2':   '#e8e4de',
        border:        '#d6d3cd',

        // Typography
        'text-primary':   '#1c1917',
        'text-secondary': '#44403c',
        'text-muted':     '#78716c',

        // Status
        success: '#312e81',
        warning: '#d97706',
        danger:  '#dc2626',
        info:    '#0369a1',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        xs:    ['0.75rem',  { lineHeight: '1rem' }],
        sm:    ['0.875rem', { lineHeight: '1.25rem' }],
        base:  ['1rem',     { lineHeight: '1.5rem' }],
        lg:    ['1.125rem', { lineHeight: '1.75rem' }],
        xl:    ['1.25rem',  { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem',   { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem',  { lineHeight: '2.5rem' }],
      },
      fontWeight: {
        normal:   '400',
        medium:   '500',
        semibold: '600',
      },
      borderWidth:  { DEFAULT: '1px' },
      borderRadius: { sm: '4px', DEFAULT: '6px', md: '8px', lg: '12px' },
      spacing:      { sidebar: '240px' },
      boxShadow: {
        card:     '0 1px 3px 0 rgba(28,25,23,0.08)',
        dropdown: '0 4px 16px 0 rgba(28,25,23,0.12)',
      },
      transitionTimingFunction: {
        smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      animation: {
        'count-up': 'countUp 1.2s ease-out forwards',
        'fade-in':  'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        shimmer:    'shimmer 1.8s infinite linear',
      },
      keyframes: {
        countUp: {
          '0%':   { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%':   { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
};
