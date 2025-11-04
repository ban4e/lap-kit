import palette from './palette.json';
const colors = require('tailwindcss/colors');

/** @type {import('tailwindcss').Config} */
export default {
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
