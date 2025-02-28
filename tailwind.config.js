/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./web/**/*.{html,js,hbs}"],
  theme: {
    extend: {},
  },
  plugins: [
    require('@tailwindcss/typography')
  ],
}