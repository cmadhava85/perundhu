/** @type {import('tailwindcss').Config} */
export default {








































































































































































































































































































}  }    animation: none;  .shimmer::before {  .floating-particles::before,  .gradient-bg-warm,  .gradient-bg-green,  .gradient-bg,    }    transition: none;  .scale-on-hover {  .lift-on-hover,  .glass-input,  .glass-button,  .glass-card,@media (prefers-reduced-motion: reduce) {/* Reduced motion support */}  }    border-color: rgba(0, 0, 0, 0.5);    border-width: 2px;  .glass {@media (prefers-contrast: high) {/* High contrast mode */}  }    color: #94a3b8;  .glass-input::placeholder {    }    color: #f1f5f9;    background: rgba(51, 65, 85, 0.6);  .glass-input {    }    background: rgba(30, 41, 59, 0.15);  .glass-lg {    }    border-color: rgba(255, 255, 255, 0.1);    background: rgba(30, 41, 59, 0.1);  .glass {@media (prefers-color-scheme: dark) {/* Dark mode support */}  }    @apply px-3 py-2 text-sm;  .glass-input {    }    @apply px-4 py-2 text-sm;  .glass-button {    }    @apply p-4 rounded-xl;  .glass-card {@media (max-width: 640px) {/* Responsive glass adjustments */}  background: rgba(16, 185, 129, 0.1);  color: #10B981;  border: 2px solid #10B981;.badge-outline-secondary {}  background: rgba(14, 165, 233, 0.1);  color: #0EA5E9;  border: 2px solid #0EA5E9;.badge-outline-primary {}  color: white;  background: linear-gradient(135deg, #10B981 0%, #059669 100%);.badge-gradient-secondary {}  color: white;  background: linear-gradient(135deg, #0EA5E9 0%, #06B6D4 100%);.badge-gradient-primary {/* Badge styles */}  transform: translateY(-4px);  box-shadow: 0 12px 32px rgba(16, 185, 129, 0.8);.btn-gradient-secondary:hover {}  box-shadow: 0 8px 24px rgba(16, 185, 129, 0.5);  background: linear-gradient(135deg, #10B981 0%, #059669 100%);.btn-gradient-secondary {}  transform: translateY(-4px);  box-shadow: 0 12px 32px rgba(14, 165, 233, 0.8);.btn-gradient-primary:hover {}  box-shadow: 0 8px 24px rgba(14, 165, 233, 0.5);  background: linear-gradient(135deg, #0EA5E9 0%, #06B6D4 100%);.btn-gradient-primary {/* Gradient button backgrounds */}  background-clip: text;  -webkit-text-fill-color: transparent;  -webkit-background-clip: text;  background: linear-gradient(135deg, #10B981 0%, #059669 100%);.gradient-text-secondary {}  background-clip: text;  -webkit-text-fill-color: transparent;  -webkit-background-clip: text;  background: linear-gradient(135deg, #0EA5E9 0%, #06B6D4 100%);.gradient-text-primary {/* Gradient text */}  box-shadow: 0 0 40px rgba(16, 185, 129, 0.8);.glow-secondary-lg {}  box-shadow: 0 0 20px rgba(16, 185, 129, 0.5);.glow-secondary {}  box-shadow: 0 0 40px rgba(14, 165, 233, 0.8);.glow-primary-lg {}  box-shadow: 0 0 20px rgba(14, 165, 233, 0.5);.glow-primary {/* Glow effect */}  transform: scale(0.98);.scale-on-hover:active {}  transform: scale(1.02);.scale-on-hover:hover {}  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);.scale-on-hover {/* Scale effect on hover */}  transform: translateY(-2px);.lift-on-hover:active {}  box-shadow: 0 12px 32px rgba(14, 165, 233, 0.5);  transform: translateY(-4px);.lift-on-hover:hover {}  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);.lift-on-hover {/* Lift effect on hover */}  pointer-events: none;  animation: shimmer 3s infinite;  background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.1), transparent);  height: 100%;  width: 100%;  left: 0;  top: 0;  position: absolute;  content: '';.shimmer::before {}  overflow: hidden;  position: relative;.shimmer {/* Shimmer effect */}  z-index: 1;  position: relative;.floating-particles > * {}  z-index: 0;  pointer-events: none;  animation: float 20s ease-in-out infinite;    radial-gradient(circle at 80% 80%, rgba(255, 255, 255, 0.15) 0%, transparent 50%);    radial-gradient(circle at 20% 50%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),  background-image:   height: 100%;  width: 100%;  left: 0;  top: 0;  position: absolute;  content: '';.floating-particles::before {}  overflow: hidden;  position: relative;.floating-particles {/* Floating particles effect */}  animation: gradientShift 15s ease infinite;  background-size: 400% 400%;  background: linear-gradient(-45deg, #FEF3C7, #FDE68A, #FCD34D, #FBBF24);.gradient-bg-warm {}  animation: gradientShift 15s ease infinite;  background-size: 400% 400%;  background: linear-gradient(-45deg, #F0FDF4, #DCFCE7, #86EFAC, #4ADE80);.gradient-bg-green {}  animation: gradientShift 15s ease infinite;  background-size: 400% 400%;  background: linear-gradient(-45deg, #E0F2FE, #BAE6FD, #7DD3FC, #38BDF8);.gradient-bg {/* Animated gradient background */}  box-shadow: 0 0 0 4px rgba(14, 165, 233, 0.1);  background: white;  @apply outline-none ring-2 ring-primary-500;.glass-input:focus {}  background: rgba(255, 255, 255, 0.8);  @apply glass rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 transition-all duration-300;.glass-input {/* Glassmorphic input */}  @apply transform -translate-y-0;.glass-button:active {}  background: linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.1) 100%);  @apply shadow-glass-lg transform -translate-y-0.5;.glass-button:hover {}  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);  @apply glass rounded-xl px-6 py-3 font-semibold transition-all duration-300;.glass-button {/* Glassmorphic button */}  background: rgba(255, 255, 255, 0.15);  @apply shadow-glass-lg transform -translate-y-1;.glass-card:hover {}  @apply glass rounded-2xl p-6 shadow-glass transition-all duration-300;.glass-card {/* Glassmorphic card */}  -webkit-backdrop-filter: blur(20px) saturate(180%);  backdrop-filter: blur(20px) saturate(180%);  border: 1px solid rgba(255, 255, 255, 0.2);  background: rgba(15, 23, 42, 0.1);.glass-dark {}  -webkit-backdrop-filter: blur(30px) saturate(200%);  backdrop-filter: blur(30px) saturate(200%);  border: 1px solid rgba(255, 255, 255, 0.4);  background: rgba(255, 255, 255, 0.15);.glass-lg {}  -webkit-backdrop-filter: blur(10px) saturate(150%);  backdrop-filter: blur(10px) saturate(150%);  border: 1px solid rgba(255, 255, 255, 0.2);  background: rgba(255, 255, 255, 0.05);.glass-sm {}  -webkit-backdrop-filter: blur(20px) saturate(180%);  backdrop-filter: blur(20px) saturate(180%);  border: 1px solid rgba(255, 255, 255, 0.3);  background: rgba(255, 255, 255, 0.1);.glass {/* Base glassmorphic container */  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      screens: {
        'xs': '360px', // Extra small screens (most small phones)
        'sm': '640px', // Small devices (landscape phones)
        'md': '768px', // Medium devices (tablets)
        'lg': '1024px', // Large devices (desktops)
        'xl': '1280px', // Extra large devices
        '2xl': '1536px', // 2X large devices
      },
      colors: {
        // Modern primary palette - Cyan/Teal (Prototype Design)
        primary: {
          50: '#F0F9FF',
          100: '#E0F2FE',
          200: '#BAE6FD',
          300: '#7DD3FC',
          400: '#38BDF8',
          500: '#0EA5E9', // Main primary color (Cyan)
          600: '#0284C7',
          700: '#0369A1',
          800: '#075985',
          900: '#0C4A6E',
          950: '#082F49',
        },
        // Modern secondary palette - Green (Prototype Design)
        secondary: {
          50: '#F0FDF4',
          100: '#DCFCE7',
          200: '#BBEF63',
          300: '#86EFAC',
          400: '#4ADE80',
          500: '#10B981', // Main secondary color (Green)
          600: '#059669',
          700: '#047857',
          800: '#065F46',
          900: '#064E3B',
          950: '#022C1D',
        },
        // Enhanced gray palette
        gray: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
        // Status colors
        success: {
          50: '#f0fdf4',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
        },
        warning: {
          50: '#fffbeb',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
        },
        error: {
          50: '#fef2f2',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
        },
        info: {
          50: '#f0f9ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'Helvetica',
          'Arial',
          'sans-serif',
        ],
        mono: [
          'JetBrains Mono',
          'SFMono-Regular',
          'Menlo',
          'Monaco',
          'Consolas',
          'monospace',
        ],
      },
      spacing: {
        '18': '4.5rem',   // 72px
        '22': '5.5rem',   // 88px
        '26': '6.5rem',   // 104px
        '30': '7.5rem',   // 120px
        '34': '8.5rem',   // 136px
        '38': '9.5rem',   // 152px
        '42': '10.5rem',  // 168px
        '46': '11.5rem',  // 184px
        '50': '12.5rem',  // 200px
        '54': '13.5rem',  // 216px
        '58': '14.5rem',  // 232px
        '62': '15.5rem',  // 248px
        '66': '16.5rem',  // 264px
        '70': '17.5rem',  // 280px
        '74': '18.5rem',  // 296px
        '78': '19.5rem',  // 312px
        '82': '20.5rem',  // 328px
        '86': '21.5rem',  // 344px
        '90': '22.5rem',  // 360px
        '94': '23.5rem',  // 376px
        '98': '24.5rem',  // 392px
        '102': '25.5rem', // 408px
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
        '6xl': '3rem',
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'medium': '0 4px 25px -5px rgba(0, 0, 0, 0.1), 0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        'strong': '0 10px 35px -5px rgba(0, 0, 0, 0.15), 0 25px 40px -10px rgba(0, 0, 0, 0.1)',
        'glow': '0 0 20px rgba(59, 130, 246, 0.15)',
        'glow-lg': '0 0 40px rgba(59, 130, 246, 0.25)',
        // Glassmorphism shadows
        'glass': '0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
        'glass-lg': '0 20px 60px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'bounce-soft': 'bounceSoft 0.6s ease-in-out',
        'pulse-slow': 'pulse 3s infinite',
        'float': 'float 6s ease-in-out infinite',
        'shimmer': 'shimmer 2s infinite',
        // Prototype animations
        'gradient-shift': 'gradientShift 15s ease infinite',
        'float-lg': 'float 20s ease-in-out infinite',
        'pulse-md': 'pulse 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        bounceSoft: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        // Prototype keyframes
        gradientShift: {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        pulse: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' },
        },
      },
      backdropBlur: {
        xs: '2px',
        sm: '4px',
        md: '10px',
        lg: '20px',
        xl: '40px',
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.75rem' }],
      },
    },
  },
  plugins: [],
}