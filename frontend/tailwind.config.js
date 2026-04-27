/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                primary: "#06f943",
                "primary-dim": "#04c234",
                "background-dark": "#0f2314",
                "card-dark": "#162f1d",
                "border-dark": "#2f6a3e",
                dark: "#0f172a",
            },
            fontFamily: {
                display: ['Space Grotesk', 'sans-serif'],
                mono: ['Courier New', 'Courier', 'monospace'],
            },
        },
    },
    plugins: [],
}

