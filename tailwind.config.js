/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border) / <alpha-value>)',
        input: 'hsl(var(--input) / <alpha-value>)',
        ring: 'hsl(var(--ring) / <alpha-value>)',
        background: 'hsl(var(--background) / <alpha-value>)',
        foreground: 'hsl(var(--foreground) / <alpha-value>)',
        primary: {
          DEFAULT: 'hsl(var(--primary) / <alpha-value>)',
          foreground: 'hsl(var(--primary-foreground) / <alpha-value>)',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary) / <alpha-value>)',
          foreground: 'hsl(var(--secondary-foreground) / <alpha-value>)',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive) / <alpha-value>)',
          foreground: 'hsl(var(--destructive-foreground) / <alpha-value>)',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted) / <alpha-value>)',
          foreground: 'hsl(var(--muted-foreground) / <alpha-value>)',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent) / <alpha-value>)',
          foreground: 'hsl(var(--accent-foreground) / <alpha-value>)',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover) / <alpha-value>)',
          foreground: 'hsl(var(--popover-foreground) / <alpha-value>)',
        },
        card: {
          DEFAULT: 'hsl(var(--card) / <alpha-value>)',
          foreground: 'hsl(var(--card-foreground) / <alpha-value>)',
        },
        'market-us': '#1d4ed8',
        'market-cn': '#dc2626',
        data: {
          up: 'hsl(var(--data-up) / <alpha-value>)',
          down: 'hsl(var(--data-down) / <alpha-value>)',
        },
        chart: {
          1: 'hsl(var(--chart-1) / <alpha-value>)',
          2: 'hsl(var(--chart-2) / <alpha-value>)',
          3: 'hsl(var(--chart-3) / <alpha-value>)',
          4: 'hsl(var(--chart-4) / <alpha-value>)',
          5: 'hsl(var(--chart-5) / <alpha-value>)',
          6: 'hsl(var(--chart-6) / <alpha-value>)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem', letterSpacing: '0.01em' }],
      },
      maxWidth: {
        page: '1680px',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      /* Motion vocabulary — keep in sync with src/lib/motion.ts and the
         `--ease-*` / `--dur-*` custom properties in src/globals.css. */
      transitionTimingFunction: {
        snap: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
        spring: 'cubic-bezier(0.34, 1.32, 0.44, 1)',
        liquid: 'cubic-bezier(0.32, 1.5, 0.5, 1)',
        enter: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      transitionDuration: {
        press: '90ms',
        snap: '140ms',
        move: '220ms',
        enter: '280ms',
      },
      /* Radix overlay enter/exit. Written by hand instead of pulling in
         `tailwindcss-animate`: the previous `animate-in` / `slide-in-from-*`
         classes were never compiled, so every dialog, popover, select and
         sheet popped in with no animation at all.
         `translate` / `scale` are used as standalone properties so they
         compose with Tailwind's `transform`-based centering. */
      keyframes: {
        'motion-in': {
          from: { opacity: '0', translate: '0 4px', scale: '0.97' },
          to: { opacity: '1', translate: '0 0', scale: '1' },
        },
        'motion-out': {
          from: { opacity: '1', translate: '0 0', scale: '1' },
          to: { opacity: '0', translate: '0 2px', scale: '0.99' },
        },
        'motion-fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'motion-fade-out': {
          from: { opacity: '1' },
          to: { opacity: '0' },
        },
        /* `translate` the standalone property, not `translate()` the transform
           function: the function takes comma-separated arguments, so
           `translate(100% 0)` is invalid and silently does nothing. */
        'motion-sheet-in': {
          from: { translate: 'var(--motion-sheet-from, 0 0)' },
          to: { translate: '0 0' },
        },
        'motion-sheet-out': {
          from: { translate: '0 0' },
          to: { translate: 'var(--motion-sheet-from, 0 0)' },
        },
        /* Calendar range：fill 颜色慢半拍，knob 弹簧浮现（取代 motion FLIP） */
        'cal-fill-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'cal-knob-in': {
          from: { opacity: '0', scale: '0.6' },
          to: { opacity: '1', scale: '1' },
        },
      },
      animation: {
        'motion-in': 'motion-in var(--dur-enter) var(--ease-enter) both',
        'motion-out': 'motion-out var(--dur-snap) var(--ease-snap) both',
        'motion-fade-in': 'motion-fade-in var(--dur-enter) var(--ease-enter) both',
        'motion-fade-out': 'motion-fade-out var(--dur-snap) var(--ease-snap) both',
        'motion-sheet-in': 'motion-sheet-in var(--dur-move) var(--ease-spring) both',
        'motion-sheet-out': 'motion-sheet-out var(--dur-snap) var(--ease-snap) both',
        'cal-fill-in': 'cal-fill-in 250ms var(--ease-enter) 80ms both',
        'cal-knob-in': 'cal-knob-in 220ms var(--ease-spring) both',
      },
    },
  },
  plugins: [],
}
