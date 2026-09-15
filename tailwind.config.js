/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bgPrimary: 'var(--bg-primary)',
        bgPanel: 'var(--bg-panel)',
        bgPanelRaised: 'var(--bg-panel-raised)',
        accentBlue: 'var(--accent-blue)',
        accentBlueBright: 'var(--accent-blue-bright)',
        textPrimary: 'var(--text-primary)',
        textSecondary: 'var(--text-secondary)',
        borderToken: 'var(--border)',
      },
    },
  },
  plugins: [],
}
