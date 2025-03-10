/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./web/**/*.{html,js,hbs}"],
  theme: {
    extend: {
      colors: {
        'navy': '#1e3a8a',
        'indigo': '#6366f1',
        'purple': '#a855f7',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography')
  ],
}