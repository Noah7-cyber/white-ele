/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#008080', // Main primary color
          50: '#e6f2f2', // Optional lighter shades
          100: '#cce6e6',
          500: '#008080', // Base shade
          900: '#004d4d', // Optional darker shade
        },
        'border-light': '#D1D1D1',
        'dashboard-bg': '#E7F6EC',
        'text-primary': '#3D3D3D',
        gray: {
          DEFAULT: '#3D3D3D',
          card: '#F8F9FA',
        },
        dark: {
          DEFAULT: '#022F2F',
        },
        border: {
          DEFAULT: '#E4E7EC',
        },
        'grey-5': '#667185',
      },
      screens: {
        xs: { max: '370px' },
        sm: { max: '768px' },
        lg: '1024px',
      },
    },
  },
  plugins: [],
};
