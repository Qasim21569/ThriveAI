/** @type {import('tailwindcss').Config} */
const withAlpha = (v) => `rgb(var(${v}) / <alpha-value>)`;

module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Inter"', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['"Instrument Serif"', 'Georgia', '"Times New Roman"', 'serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', '"SFMono-Regular"', 'monospace'],
        display: ['"Instrument Serif"', 'Georgia', 'serif'],
      },
      colors: {
        /* --- shadcn semantic tokens --- */
        border: withAlpha('--border'),
        'border-strong': withAlpha('--border-strong'),
        input: withAlpha('--input'),
        ring: withAlpha('--ring'),
        background: withAlpha('--background'),
        foreground: withAlpha('--foreground'),
        surface: {
          DEFAULT: withAlpha('--surface'),
          raised: withAlpha('--surface-raised'),
          sunken: withAlpha('--surface-sunken'),
        },
        primary: {
          DEFAULT: withAlpha('--primary'),
          foreground: withAlpha('--primary-foreground'),
          hover: withAlpha('--primary-hover'),
          active: withAlpha('--primary-active'),
          soft: withAlpha('--primary-soft'),
        },
        secondary: {
          DEFAULT: withAlpha('--secondary'),
          foreground: withAlpha('--secondary-foreground'),
        },
        accent: {
          DEFAULT: withAlpha('--accent'),
          foreground: withAlpha('--accent-foreground'),
          hover: withAlpha('--accent-hover'),
          soft: withAlpha('--accent-soft'),
        },
        muted: {
          DEFAULT: withAlpha('--muted'),
          foreground: withAlpha('--muted-foreground'),
        },
        destructive: {
          DEFAULT: withAlpha('--destructive'),
          foreground: withAlpha('--destructive-foreground'),
          hover: withAlpha('--destructive-hover'),
          soft: withAlpha('--destructive-soft'),
        },
        success: {
          DEFAULT: withAlpha('--success'),
          foreground: withAlpha('--success-foreground'),
          soft: withAlpha('--success-soft'),
        },
        warning: {
          DEFAULT: withAlpha('--warning'),
          soft: withAlpha('--warning-soft'),
        },
        popover: {
          DEFAULT: withAlpha('--popover'),
          foreground: withAlpha('--popover-foreground'),
        },
        card: {
          DEFAULT: withAlpha('--card'),
          foreground: withAlpha('--card-foreground'),
        },
        /* Text helpers */
        'text-body': withAlpha('--text-body'),
        'text-muted': withAlpha('--text-muted'),
        /* --- raw warm scales (for fine-grained page work) --- */
        oat: {
          50: withAlpha('--oat-50'), 100: withAlpha('--oat-100'), 150: withAlpha('--oat-150'),
          200: withAlpha('--oat-200'), 300: withAlpha('--oat-300'), 400: withAlpha('--oat-400'),
          500: withAlpha('--oat-500'),
        },
        ink: {
          400: withAlpha('--ink-400'), 500: withAlpha('--ink-500'),
          700: withAlpha('--ink-700'), 900: withAlpha('--ink-900'),
        },
        coffee: {
          50: withAlpha('--coffee-50'), 100: withAlpha('--coffee-100'), 300: withAlpha('--coffee-300'),
          500: withAlpha('--coffee-500'), 600: withAlpha('--coffee-600'), 700: withAlpha('--coffee-700'),
        },
        terracotta: {
          50: withAlpha('--terracotta-50'), 100: withAlpha('--terracotta-100'),
          400: withAlpha('--terracotta-400'), 500: withAlpha('--terracotta-500'), 600: withAlpha('--terracotta-600'),
        },
        gold: {
          50: withAlpha('--gold-50'),
          500: withAlpha('--gold-500'),
        },
        sage: { 50: withAlpha('--sage-50'), 500: withAlpha('--sage-500') },
        amber: { 50: withAlpha('--amber-50'), 500: withAlpha('--amber-500') },
        clay: { 50: withAlpha('--clay-50'), 500: withAlpha('--clay-500'), 600: withAlpha('--clay-600') },
        /* Coaching-area hues */
        mode: {
          fitness: withAlpha('--mode-fitness'),
          career: withAlpha('--mode-career'),
          finance: withAlpha('--mode-finance'),
          mental: withAlpha('--mode-mental'),
        },
      },
      borderRadius: {
        none: '0',
        xs: '4px',
        sm: '6px',
        md: '10px',
        lg: '14px',
        xl: '20px',
        '2xl': '24px',
        full: '999px',
      },
      boxShadow: {
        xs: 'var(--shadow-xs)',
        sm: 'var(--shadow-sm)',
        DEFAULT: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        xl: 'var(--shadow-xl)',
        none: 'none',
      },
      maxWidth: {
        content: '1180px', // marketing
        app: '940px', // in-app
      },
      transitionTimingFunction: {
        standard: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      transitionDuration: {
        fast: '150ms',
        base: '180ms',
        slow: '280ms',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in var(--duration-base) var(--ease-standard) both',
      },
    },
  },
  plugins: [],
}
