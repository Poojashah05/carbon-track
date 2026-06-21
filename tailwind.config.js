/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Core palette
        canvas: '#f5f2eb',
        charcoal: '#1a1a1a',
        forest: '#2d6a4f',
        mint: '#52b788',
        'light-green': '#d8f3dc',
        // Semantic shades
        'forest-light': '#40916c',
        'forest-dark': '#1b4332',
        'mint-light': '#74c69d',
        'mint-dark': '#40916c',
        // Functional
        'surface-0': '#f5f2eb',
        'surface-1': '#edeae0',
        'surface-2': '#e3e0d6',
        border: '#d0cdc4',
        'text-primary': '#1a1a1a',
        'text-secondary': '#4a4a4a',
        'text-muted': '#7a7a7a',
        // Status
        success: '#2d6a4f',
        warning: '#b5852a',
        danger: '#c0392b',
        info: '#2471a3',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        xs: ['0.75rem', { lineHeight: '1rem' }],
        sm: ['0.875rem', { lineHeight: '1.25rem' }],
        base: ['1rem', { lineHeight: '1.5rem' }],
        lg: ['1.125rem', { lineHeight: '1.75rem' }],
        xl: ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
      },
      fontWeight: {
        normal: '400',
        medium: '500',
        semibold: '600',
      },
      borderWidth: {
        DEFAULT: '1px',
      },
      borderRadius: {
        sm: '4px',
        DEFAULT: '6px',
        md: '8px',
        lg: '12px',
      },
      spacing: {
        sidebar: '240px',
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(26,26,26,0.08)',
        dropdown: '0 4px 16px 0 rgba(26,26,26,0.12)',
      },
      transitionTimingFunction: {
        smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      animation: {
        'count-up': 'countUp 1.2s ease-out forwards',
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'shimmer': 'shimmer 1.8s infinite linear',
      },
      keyframes: {
        countUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
};
