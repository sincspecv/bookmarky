const buildConfig= require(`./build.config.cjs`);

// https://tailwindcss.com/docs/configuration
module.exports = {
  content: ["./src/**/*.{vue,js,html}"],
  daisyui: {
    themes: ["light", "dark"],
  },
  theme: {
    spacing: buildConfig.spacing,
    sizing: buildConfig.sizing,
    darkMode: "class",
    container: {
      padding: buildConfig.spacing.md,
    },
    extend: {
      textSizes: buildConfig.textSizes,
    },
  },
  safelist: buildConfig.safelist,
  plugins: [
    require('daisyui'),
    require('@tailwindcss/typography'),
    require('@tailwindcss/aspect-ratio'),
    require('@tailwindcss/forms'),
  ],
  darkMode: 'class'
};
