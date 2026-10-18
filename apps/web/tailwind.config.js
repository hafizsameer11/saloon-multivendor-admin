/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      // Theme colours are CSS variables (see index.css) so the light/dark toggle can swap them.
      // snow / coal never change: text on photos, red and gold buttons.
      colors: {
        onyx: 'rgb(var(--onyx) / <alpha-value>)',
        graphite: { DEFAULT: 'rgb(var(--graphite) / <alpha-value>)', 2: 'rgb(var(--graphite-2) / <alpha-value>)', 3: 'rgb(var(--graphite-3) / <alpha-value>)' },
        smoke: 'rgb(var(--smoke) / <alpha-value>)',
        crimson: { DEFAULT: '#B3202A', dark: '#8E1820', soft: 'rgba(179,32,42,.14)' },
        gold: { DEFAULT: 'rgb(var(--gold) / <alpha-value>)', light: '#E3CB98' },
        ivory: { DEFAULT: 'rgb(var(--ivory) / <alpha-value>)', 2: 'rgb(var(--ivory-2) / <alpha-value>)', 3: 'rgb(var(--ivory-3) / <alpha-value>)' },
        ink: 'rgb(var(--ink) / <alpha-value>)',
        mute: { DEFAULT: 'rgb(var(--mute) / <alpha-value>)', 2: 'rgb(var(--mute-2) / <alpha-value>)' },
        err: 'rgb(var(--err) / <alpha-value>)',
        snow: '#F4EEE6',
        coal: '#1B1716',
        ok: '#5FB585',
        warn: '#E0A84F',
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans: ['Manrope', 'system-ui', 'sans-serif'],
      },
      borderRadius: { '4xl': '2rem', '5xl': '2.5rem' },
      letterSpacing: { eyebrow: '.28em' },
      boxShadow: { deep: '0 30px 80px rgb(var(--shadow) / .5)', card: '0 16px 40px rgb(var(--shadow) / .35)' },
      keyframes: {
        marquee: { to: { transform: 'translateX(-50%)' } },
        rise: { from: { opacity: 0, transform: 'translateY(10px)' }, to: { opacity: 1, transform: 'none' } },
      },
      animation: { marquee: 'marquee 45s linear infinite', rise: 'rise .5s cubic-bezier(.2,.7,.2,1) both' },
    },
  },
  plugins: [],
};
