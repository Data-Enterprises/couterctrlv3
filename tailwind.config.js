/** @type {import('tailwindcss').Config} */

const plugin = require("tailwindcss/plugin");
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  safelist: ["bg-blend-darken"],
  theme: {
    roundedOut: {
      sm: "0125rem",
    },
    extend: {
      screens: {
        print: { raw: "print" },
        screen: { raw: "screen" },
      },
      colors: {
        accent: {
          1: "rgb(var(--color-accent1) / <alpha-value>)",
          2: "rgb(var(--color-accent2) / <alpha-value>)",
          3: "rgb(var(--color-accent3) / <alpha-value>)",
          "panel-blue": "rgb(var(--color-accent-panel-blue) / <alpha-value>)",
          "panel-orange":
            "rgb(var(--color-accent-panel-orange) / <alpha-value>)",
          "panel-purple":
            "rgb(var(--color-accent-panel-purple) / <alpha-value>)",
        },
        "custom-white": "rgb(var(--color-custom-white) / <alpha-value>)",
        bkg: "rgb(var(--color-bkg) / <alpha-value>)",
        content: "rgb(var(--color-content) / <alpha-value>)",
        sidebar: "rgb(var(--color-sidebar) / <alpha-value>)",
        warning: "rgb(var(--color-warning) / <alpha-value>)",
        scroll_hover: "rgb(var(--color-scroll-hover) / <alpha-value>)",
        panel_bg: "rgba(var(--color-panel-bg) / <alpha-value>)",
        panel_text: "rgb(var(--color-panel-text) / <alpha-value>)",
        panel_active: "rgb(var(--color-panel-active) / <alpha-value>)",
        card_bg: "rgb(var(--color-card-bg) / <alpha-value>)",
        card_text: "rgb(var(--color-card-text) / <alpha-value>)",
        primary: {
          a0: "rgb(var(--color-primary-a0) / <alpha-value>)",
          a10: "rgb(var(--color-primary-a10) / <alpha-value>)",
          a20: "rgb(var(--color-primary-a20) / <alpha-value>)",
          a30: "rgb(var(--color-primary-a30) / <alpha-value>)",
          a40: "rgb(var(--color-primary-a40) / <alpha-value>)",
          a50: "rgb(var(--color-primary-a50) / <alpha-value>)",
        },
        secondary: {
          a0: "rgb(var(--color-secondary-a0) / <alpha-value>)",
          a10: "rgb(var(--color-secondary-a10) / <alpha-value>)",
          a20: "rgb(var(--color-secondary-a20) / <alpha-value>)",
          a30: "rgb(var(--color-secondary-a30) / <alpha-value>)",
          a40: "rgb(var(--color-secondary-a40) / <alpha-value>)",
          a50: "rgb(var(--color-secondary-a50) / <alpha-value>)",
        },
        surface: {
          a0: "rgb(var(--color-surface-a0) / <alpha-value>)",
          a10: "rgb(var(--color-surface-a10) / <alpha-value>)",
          a20: "rgb(var(--color-surface-a20) / <alpha-value>)",
          a30: "rgb(var(--color-surface-a30) / <alpha-value>)",
          a40: "rgb(var(--color-surface-a40) / <alpha-value>)",
          a50: "rgb(var(--color-surface-a50) / <alpha-value>)",
        },
        button: {
          green: "rgb(var(--color-button-green) / <alpha-value>)",
          greenhover: "rgb(var(--color-button-green-hover) / <alpha-value>)",
          blue: "rgb(var(--color-button-blue) / <alpha-value>)",
          bluehover: "rgb(var(--color-button-blue-hover) / <alpha-value>)",
          red: "rgb(var(--color-button-red) / <alpha-value>)",
          orange: "rgb(var(--color-button-orange) / <alpha-value>)",
          liteblue: "rgb(var(--color-button-liteblue) / <alpha-value>)",
          lime: "rgb(var(--color-button-lime) / <alpha-value>)",
          purple: "rgb(var(--color-button-purple) / <alpha-value>)",
        },
        themeText: "rgb(var(--color-themeText) / <alpha-value>)",
        mixed_surface: {},
      },

      keyframes: {
        appear: {
          "0%": {
            opacity: "0",
            display: "none",
          },
          "100%": {
            opacity: "1",
            display: "block",
          },
        },
        dissapear: {
          "0%": {
            opacity: "1",
            display: "block",
          },
          "100%": {
            opacity: "0",
            display: "none",
          },
        },
        slidein: {
          "0%": { transform: "translateX(-100%)", opacity: 0 },
          "90%": { transform: "translateX(5%)" },
          "100%": { transform: "translateX(0)", opacity: 1 },
        },
        slideout: {
          "0%": { transform: "translateX(0)", opacity: 1 },
          "10%": { transform: "translateX(5%)" },
          "100%": { transform: "translateX(-200%)", opacity: 0 },
        },
        windowIn: {
          "0%": {
            opacity: "0",
          },
          "100%": {
            opacity: "1",
          },
        },
        windowOut: {
          "0%": {
            opacity: "1",
          },
          "100%": {
            opacity: "0",
          },
        },
        menuIn: {
          "0%": {
            display: "hidden",
            opacity: "0",
          },
          "100%": {
            display: "block",
            opacity: "1",
          },
        },
        enterLeft: {
          "0%": { transform: "translateX(-30%)", opacity: 0 },
          "100%": { transform: "translateX(0)", opacity: 1 },
        },
        enterRight: {
          "0%": { transform: "translateX(30%)", opacity: 0 },
          "100%": { transform: "translateX(0)", opacity: 1 },
        },
        exitLeft: {
          "0%": { transform: "translateX(0)", opacity: 1 },
          "100%": { transform: "translateX(-30%)", opacity: 0 },
        },
        exitRight: {
          "0%": { transform: "translateX(0)", opacity: 1 },
          "100%": { transform: "translateX(30%)", opacity: 0 },
        },
        enter: {
          "0%": { opacity: 0 },
          "100%": { opacity: 1 },
        },
        exit: {
          "0%": { opacity: 1 },
          "80%": { opacity: 0 },
        },
        fillLeft: {
          "0%": { width: "0%", opacity: 0 },
          "100%": { width: "100%", opacity: 1 },
        },
        slideleft: {
          "0%": { transform: "translateX(100%)", opacity: 0 },
          "90%": [{ transform: "translateX(5%)" }],
          "100%": { transform: "translateX(0)", opacity: 1 },
        },
        slideright: {
          "0%": { transform: "translateX(-100%)", opacity: 0 },
          "90%": [{ transform: "translateX(5%)" }],
          "100%": { transform: "translateX(0)", opacity: 1 },
        },
      },

      animation: {
        "spin-slower": "spin 35s ease infinite",
        "spin-slow": "spin 25s ease-in-out infinite reverse",
        appear: "appear .3s ease-in-out forwards",
        dissapear: "dissapear .3s ease-in-out forwards",
        dissapearDelay: "dissapear .3s ease-in-out 0.3s forwards",
        slidein: "slidein 0.5s ease-in-out forwards",
        slideout: "slideout 0.5s ease-in-out forwards",
        windowIn: "windowIn 0.3s ease-in-out forwards",
        menuIn: "menuIn .5s ease-in-out forwards",
        "enter-left": "enter 0.3s ease-in-out forwards",
        "enter-right": "enter 0.3s ease-in-out forwards",
        "exit-left": "exit 0.1s ease-in-out forwards",
        "exit-right": "exit 0.1s ease-in-out forwards",
        fillLeft: "fillLeft 0.5s ease-in-out forwards",
        slideleft: "slideleft 0.5s ease-in-out forwards",
        slideright: "slideright 0.5s ease-in-out forwards",
      },
      textShadow: {
        custom: "1px 1px 4px var(--tw-shadow-color)",
        sm: "0 1px 2px var(--tw-shadow-color)",
        DEFAULT: "0 2px 4px var(--tw-shadow-color)",
        lg: "0 8px 16px var(--tw-shadow-color)",
      },
    },
  },

  plugins: [
    require("@tailwindcss/forms"),
    require("tailwind-rounded-out"),
    plugin(function ({ matchUtilities, theme }) {
      matchUtilities(
        {
          "text-shadow": (value) => ({
            textShadow: value,
          }),
        },
        { values: theme("textShadow") }
      );
    }),
  ],
  safelist: [
    "animate-enter-left",
    "animate-enter-right",
    "animate-exit-left",
    "animate-exit-right",
  ],
};
