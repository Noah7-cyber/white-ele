/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        cormorant: ["Cormorant"],
        Avenir: ["Avenir"],
      },
      colors: {},
      screens: {
        xs: { max: "370px" },
        sm: { max: "768px" },
        lg: "1024px",
      },
    },
  },
  plugins: [],
};
