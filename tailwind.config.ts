import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        brand: {
          yellow: '#ffb600',
          yellowHover: '#e5a400',
          dark: '#000000',
          card: '#141414',
          cardGray: '#1a1a1a',
          border: '#262626',
          metaGray: '#888888',
        },
      },
    },
  },
  plugins: [],
  safelist: [
    'grid-cols-2',
    'grid-cols-3',
    'grid-cols-4',
  ],
}
export default config
