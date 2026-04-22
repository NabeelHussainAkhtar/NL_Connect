/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class', '[data-theme="dark"]'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      colors: {
        // ── Light Mode palette ──────────────────────────────────────
        cream: {
          50:  '#fdfcfa',
          100: '#f8f5f0',
          200: '#f0ece4',
          300: '#e5dfd5',
          400: '#d5cdc0',
          500: '#bfb5a5',
        },
        // ── Dark Mode palette ────────────────────────────────────────
        obsidian: {
          50:  '#2e333d',
          100: '#272b35',
          200: '#22262e',
          300: '#1a1d23',
          400: '#141619',
          500: '#0d0f13',
        },
        // ── Accent — Light ───────────────────────────────────────────
        'accent-blue':  '#4f7dff',
        'accent-indigo':'#6c63ff',
        // ── Accent — Dark (neon) ─────────────────────────────────────
        'neon-teal':  '#00f5d4',
        'neon-purple':'#bf5af2',
        'neon-amber': '#ffd60a',
        'neon-pink':  '#ff375f',
        'neon-green': '#30d158',
      },
      boxShadow: {
        // ── Light Mode ───────────────────────────────────────────────
        'skeuo-raised':
          '6px 6px 14px #c8c2b8, -4px -4px 10px #ffffff',
        'skeuo-pressed':
          'inset 4px 4px 10px #c0bab0, inset -3px -3px 8px #ffffff',
        'skeuo-inset':
          'inset 3px 3px 7px #c8c2b8, inset -3px -3px 7px #ffffff',
        'skeuo-card':
          '0 2px 4px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.9)',
        // ── Dark Mode ────────────────────────────────────────────────
        'skeuo-dark-raised':
          '6px 6px 16px #0d0f13, -4px -4px 10px #272b35',
        'skeuo-dark-pressed':
          'inset 4px 4px 12px #0d0f13, inset -3px -3px 8px #272b35',
        'skeuo-dark-inset':
          'inset 3px 3px 8px #0d0f13, inset -3px -3px 8px #272b35',
        'skeuo-dark-card':
          '0 2px 4px rgba(0,0,0,0.4), 0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)',
        // ── Glow effects (Dark Mode accents) ─────────────────────────
        'glow-teal':   '0 0 20px rgba(0,245,212,0.4), 0 0 40px rgba(0,245,212,0.15)',
        'glow-purple': '0 0 20px rgba(191,90,242,0.4), 0 0 40px rgba(191,90,242,0.15)',
        'glow-amber':  '0 0 20px rgba(255,214,10,0.4), 0 0 40px rgba(255,214,10,0.15)',
        'glow-green':  '0 0 16px rgba(48,209,88,0.5), 0 0 32px rgba(48,209,88,0.2)',
        'glow-pink':   '0 0 20px rgba(255,55,95,0.4), 0 0 40px rgba(255,55,95,0.15)',
      },
      backgroundImage: {
        // ── Light textures ───────────────────────────────────────────
        'skeuo-surface':
          'linear-gradient(145deg, #f8f5f0 0%, #ede9e1 100%)',
        'skeuo-btn':
          'linear-gradient(145deg, #f5f2ed 0%, #e8e3da 100%)',
        'skeuo-btn-active':
          'linear-gradient(145deg, #e2ddd5 0%, #f2efe9 100%)',
        'skeuo-header':
          'linear-gradient(180deg, #f8f5f0 0%, #f0ece4 100%)',
        // ── Dark textures ────────────────────────────────────────────
        'skeuo-dark-surface':
          'linear-gradient(145deg, #22262e 0%, #1a1d23 100%)',
        'skeuo-dark-btn':
          'linear-gradient(145deg, #272b35 0%, #1c2028 100%)',
        'skeuo-dark-btn-active':
          'linear-gradient(145deg, #151820 0%, #252930 100%)',
        'skeuo-dark-header':
          'linear-gradient(180deg, #22262e 0%, #1a1d23 100%)',
        // ── Metal/glass textures ─────────────────────────────────────
        'metal-light':
          'linear-gradient(135deg, #e8e3da 0%, #f5f2ed 30%, #e0dbcf 60%, #ede8df 100%)',
        'glass-light':
          'linear-gradient(135deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.3) 100%)',
        'glass-dark':
          'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)',
      },
      borderRadius: {
        'skeuo': '14px',
        'skeuo-sm': '8px',
        'skeuo-lg': '20px',
        'skeuo-xl': '28px',
      },
      animation: {
        'press-in': 'pressIn 80ms ease-out forwards',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'typewriter': 'typewriter 0.05s steps(1) forwards',
        'slide-up': 'slideUp 300ms cubic-bezier(0.34,1.56,0.64,1) forwards',
        'fade-in': 'fadeIn 200ms ease-out forwards',
        'bounce-in': 'bounceIn 400ms cubic-bezier(0.34,1.56,0.64,1) forwards',
      },
      keyframes: {
        pressIn: {
          'from': { transform: 'translateY(0) scale(1)' },
          'to':   { transform: 'translateY(2px) scale(0.97)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%':      { opacity: '0.6', transform: 'scale(1.05)' },
        },
        slideUp: {
          'from': { opacity: '0', transform: 'translateY(20px)' },
          'to':   { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          'from': { opacity: '0' },
          'to':   { opacity: '1' },
        },
        bounceIn: {
          'from': { opacity: '0', transform: 'scale(0.8)' },
          'to':   { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
}
