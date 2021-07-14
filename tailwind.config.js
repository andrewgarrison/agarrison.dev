module.exports = {
  purge: ["./pages/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {},
    container: {
      screens: {
        sm: "600px",
        md: "728px",
        lg: "800px",
        xl: "800px",
        "2xl": "800px",
      },
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
};
