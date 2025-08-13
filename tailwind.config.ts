import type { Config } from 'tailwindcss';
import tailwindScrollbar from 'tailwind-scrollbar';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    screens: {
      // Extra small devices (portrait phones, less than 576px)
      xs: '475px',

      // Small devices (landscape phones, 576px and up)
      sm: '640px',

      // Medium devices (tablets, 768px and up)
      md: '768px',

      // Large devices (desktops, 1024px and up)
      lg: '1024px',

      // Extra large devices (large desktops, 1280px and up)
      xl: '1280px',

      // 2X large devices (larger desktops, 1536px and up)
      '2xl': '1536px',

      // 3X large devices (extra large desktops, 1920px and up)
      '3xl': '1920px',

      // 4K and ultra-wide screens
      '4xl': '2560px',

      // Portrait orientation
      portrait: { raw: '(orientation: portrait)' },

      // Landscape orientation
      landscape: { raw: '(orientation: landscape)' },

      // High DPI screens (Retina displays)
      retina: {
        raw: '(-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi)',
      },

      // Touch devices
      touch: { raw: '(hover: none) and (pointer: coarse)' },

      // Mouse/trackpad devices
      'no-touch': { raw: '(hover: hover) and (pointer: fine)' },

      // Print media
      print: { raw: 'print' },

      // Reduced motion preference
      'motion-safe': { raw: '(prefers-reduced-motion: no-preference)' },
      'motion-reduce': { raw: '(prefers-reduced-motion: reduce)' },

      // Dark mode preference
      'dark-mode': { raw: '(prefers-color-scheme: dark)' },
      'light-mode': { raw: '(prefers-color-scheme: light)' },

      // High contrast preference
      'high-contrast': { raw: '(prefers-contrast: high)' },

      // Custom mobile breakpoints
      'mobile-s': '320px', // Small mobile (iPhone 5/SE)
      'mobile-m': '375px', // Medium mobile (iPhone 6/7/8)
      'mobile-l': '425px', // Large mobile (iPhone 6/7/8 Plus)

      // Custom tablet breakpoints
      tablet: '768px', // iPad portrait
      'tablet-l': '1024px', // iPad landscape

      // Custom desktop breakpoints
      desktop: '1024px', // Small desktop
      'desktop-l': '1440px', // Large desktop
      'desktop-xl': '1920px', // Extra large desktop

      // Max-width breakpoints (mobile-first approach alternatives)
      'max-xs': { max: '474px' },
      'max-sm': { max: '639px' },
      'max-md': { max: '767px' },
      'max-lg': { max: '1023px' },
      'max-xl': { max: '1279px' },
      'max-2xl': { max: '1535px' },

      // Range breakpoints (between two sizes)
      'sm-md': { min: '640px', max: '767px' },
      'md-lg': { min: '768px', max: '1023px' },
      'lg-xl': { min: '1024px', max: '1279px' },
      'xl-2xl': { min: '1280px', max: '1535px' },
    },
    extend: {
      colors: {
        // Primary brand colors
        primary: {
          50: '#f0f2ff',
          100: '#e4e7ff',
          200: '#c7d1ff',
          300: '#a3b3ff',
          400: '#7c8eff',
          500: '#4323fc', // Main primary color
          600: '#3a1fe8',
          700: '#2f1ad1',
          800: '#2715a8',
          900: '#1f1185',
          950: '#130a4d',
        },
        // Secondary colors
        secondary: {
          50: '#f8f9fa',
          100: '#f1f3f4',
          200: '#e8eaed',
          300: '#dadce0',
          400: '#bdc1c6',
          500: '#9aa0a6',
          600: '#80868b',
          700: '#5f6368',
          800: '#3c4043',
          900: '#202124',
        },
        // Success colors
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#10b981', // Main success color
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
        },
        // Warning colors
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b', // Main warning color
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        // Error colors
        error: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444', // Main error color
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
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
        '5xl': ['3rem', { lineHeight: '1' }],
        '6xl': ['3.75rem', { lineHeight: '1' }],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      boxShadow: {
        soft: '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        medium:
          '0 4px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        large:
          '0 10px 40px -10px rgba(0, 0, 0, 0.15), 0 2px 10px -2px rgba(0, 0, 0, 0.05)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [tailwindScrollbar],
  darkMode: 'class', // Enable dark mode with class strategy
};

export default config;
