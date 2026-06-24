/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          900: "#001F3F",
          800: "#0a2848",
          700: "#143050",
          600: "#1e3858",
        },
        slate: {
          900: "#1A2A3A",
          800: "#242f3f",
          700: "#2e3a4a",
        },
        gold: {
          400: "#FFD700",
          500: "#FFC300",
          600: "#FFB800",
        },
        maritime: {
          green: "#2ECC71",
          orange: "#E67E22",
          red: "#E74C3C",
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        xs: ['12px', '16px'],
        sm: ['14px', '20px'],
        base: ['16px', '24px'],
        lg: ['18px', '28px'],
        xl: ['24px', '32px'],
        '2xl': ['28px', '36px'],
        '3xl': ['32px', '40px'],
      },
      boxShadow: {
        card: '0 8px 16px rgba(0, 0, 0, 0.3)',
        'card-hover': '0 12px 24px rgba(0, 0, 0, 0.4)',
        gold: '0 0 20px rgba(255, 215, 0, 0.2)',
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'pulse-gold': 'pulse-gold 2s ease-in-out infinite',
        'slide-up': 'slide-up 0.5s ease-out',
        'fade-in': 'fade-in 0.3s ease-out',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'pulse-gold': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      backgroundImage: {
        'gradient-navy': 'linear-gradient(135deg, #001F3F 0%, #0a2848 100%)',
        'gradient-gold': 'linear-gradient(135deg, #FFD700 0%, #FFC300 100%)',
      },
    },
  },
  plugins: [],
}
