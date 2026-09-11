import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Warm, earthy palette
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        surface: {
          DEFAULT: '#FBF9F5',
          white: '#FFFFFF',
        },
        border: '#E7E1D7',
        ink: '#1F2421',
        muted: '#5C635D',
        charcoal: '#1F2421',
        accent: {
          DEFAULT: '#C4612F',
          hover: '#A94E22',
          tint: '#F2E3D6',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)'],
        serif: ['var(--font-fraunces)'],
      },
      fontWeight: {
        light: '300',
        normal: '400',
        medium: '500',
      },
      borderRadius: {
        pill: '999px',
      },
      backdropBlur: {
        nav: '12px',
      },
    },
  },
  plugins: [],
};

export default config;
