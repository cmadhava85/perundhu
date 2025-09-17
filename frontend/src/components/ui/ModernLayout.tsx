import React from 'react';
import { cn } from '../../utils/cn';
import MobileNavigation from './MobileNavigation';

interface ModernLayoutProps {
  children: React.ReactNode;
  className?: string;
  showNavigation?: boolean;
  showBottomNav?: boolean;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  background?: 'default' | 'gradient' | 'pattern';
  centerContent?: boolean;
}

const ModernLayout: React.FC<ModernLayoutProps> = ({
  children,
  className,
  showNavigation = true,
  showBottomNav = true,
  maxWidth = 'lg',
  padding = 'md',
  background = 'default',
  centerContent = false
}) => {
  const backgroundClasses = {
    default: 'bg-gray-50',
    gradient: 'bg-gradient-to-br from-blue-50 via-white to-purple-50',
    pattern: 'bg-white bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-100 via-white to-transparent'
  };

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
    '2xl': 'max-w-7xl',
    full: 'max-w-none'
  };

  const paddingClasses = {
    none: 'p-0',
    sm: 'p-4',
    md: 'px-4 py-6 md:px-6 md:py-8',
    lg: 'px-4 py-8 md:px-8 md:py-12'
  };

  return (
    <div className={cn(
      'min-h-screen transition-all duration-300',
      backgroundClasses[background],
      className
    )}>
      {/* Navigation */}
      {showNavigation && <MobileNavigation />}
      
      {/* Main Content */}
      <main className={cn(
        'relative',
        showNavigation && 'pt-16', // Account for fixed header
        showBottomNav && 'pb-20 md:pb-0', // Account for bottom nav on mobile
      )}>
        <div className={cn(
          'mx-auto',
          maxWidthClasses[maxWidth],
          paddingClasses[padding],
          centerContent && 'flex items-center justify-center min-h-[calc(100vh-4rem)]'
        )}>
          {children}
        </div>
      </main>
    </div>
  );
};

// Specialized layout variants
export const SearchLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ModernLayout
    background="gradient"
    centerContent
    maxWidth="lg"
    className="relative overflow-hidden"
  >
    {/* Decorative elements */}
    <div className="absolute top-0 left-0 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float" />
    <div className="absolute top-0 right-0 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float" style={{ animationDelay: '2s' }} />
    <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float" style={{ animationDelay: '4s' }} />
    
    <div className="relative z-10">
      {children}
    </div>
  </ModernLayout>
);

export const ResultsLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ModernLayout
    background="default"
    maxWidth="xl"
    padding="md"
  >
    {children}
  </ModernLayout>
);

export const ContributionLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ModernLayout
    background="pattern"
    centerContent
    maxWidth="lg"
    className="relative"
  >
    {/* Glassmorphism background */}
    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 backdrop-blur-3xl" />
    
    <div className="relative z-10">
      {children}
    </div>
  </ModernLayout>
);

export default ModernLayout;