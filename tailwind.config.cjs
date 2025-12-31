const colors = require('tailwindcss/colors');

const palette = require('./palette.json');

/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ['class', '[data-mode="dark"]'],
    content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
    theme: {
        colors: {
            transparent: colors.transparent,
            current: colors.current,
            inherit: colors.inherit,
            white: colors.white,
            black: colors.black,
            ...palette
        },
        extend: {
            borderRadius: {
                inherit: 'inherit'
            }
        }
    },
    plugins: []
};
