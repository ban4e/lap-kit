/** @type {import('tailwindcss').Config} */
export default {
    darkMode: ['class', '[data-mode="dark"]'],
    content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
    theme: {
        extend: {
            colors: {
                // Using modern `rgb`
                background: 'rgb(var(--color-background) / <alpha-value>)',
                foreground: 'rgb(var(--color-foreground) / <alpha-value>)',
                primary: 'rgb(var(--color-primary) / <alpha-value>)',
                'primary-foreground': 'rgb(var(--color-primary-foreground) / <alpha-value>)',
                secondary: 'rgb(var(--color-secondary) / <alpha-value>)',
                'secondary-foreground': 'rgb(var(--color-secondary-foreground) / <alpha-value>)',
                third: 'rgb(var(--color-third) / <alpha-value>)',
                'third-foreground': 'rgb(var(--color-third-foreground) / <alpha-value>)',
                success: 'rgb(var(--color-success) / <alpha-value>)',
                danger: 'rgb(var(--color-danger) / <alpha-value>)'
            },
            borderRadius: {
                inherit: 'inherit'
            }
        }
    },
    plugins: []
};
