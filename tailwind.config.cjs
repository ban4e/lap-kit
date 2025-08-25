import palette from './palette.json';

/** @type {import('tailwindcss').Config} */
export default {
    darkMode: ['class', '[data-mode="dark"]'],
    content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
    theme: {
        extend: {
            colors: {
                // Using modern `rgb`
                ...palette,
                'n-1': 'rgb(var(--color-n-1) / <alpha-value>)',
                'n-2': 'rgb(var(--color-n-2) / <alpha-value>)',
                'n-3': 'rgb(var(--color-n-3) / <alpha-value>)',
                'n-4': 'rgb(var(--color-n-4) / <alpha-value>)',
                'n-5': 'rgb(var(--color-n-5) / <alpha-value>)',
                'n-6': 'rgb(var(--color-n-6) / <alpha-value>)',
                'n-7': 'rgb(var(--color-n-7) / <alpha-value>)',
                'n-8': 'rgb(var(--color-n-8) / <alpha-value>)',
                'n-9': 'rgb(var(--color-n-9) / <alpha-value>)'
            },
            borderRadius: {
                inherit: 'inherit'
            }
        }
    },
    plugins: []
};
