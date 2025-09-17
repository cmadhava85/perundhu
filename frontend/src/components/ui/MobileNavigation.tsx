import React, { useState } from 'react';
import { Menu, X, Home, Search, MapPin, User, Settings } from 'lucide-react';
import { cn } from '../../utils/cn';

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  href: string;
  badge?: number;
}

interface MobileNavigationProps {
  items?: NavItem[];
  currentPath?: string;
  onNavigate?: (path: string) => void;
  logo?: React.ReactNode;
  className?: string;
}

const defaultNavItems: NavItem[] = [
  { id: 'home', label: 'Home', icon: Home, href: '/' },
  { id: 'search', label: 'Search', icon: Search, href: '/search' },
  { id: 'routes', label: 'Routes', icon: MapPin, href: '/routes' },
  { id: 'profile', label: 'Profile', icon: User, href: '/profile' },
];

const MobileNavigation: React.FC<MobileNavigationProps> = ({
  items = defaultNavItems,
  currentPath = '/',
  onNavigate,
  logo,
  className
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleNavigate = (path: string) => {
    onNavigate?.(path);
    setIsMenuOpen(false);
  };

  return (
    <>
      {/* Top Navigation Bar */}
      <header className={cn(
        'fixed top-0 left-0 right-0 z-50',
        'bg-white/80 backdrop-blur-lg border-b border-gray-200',
        'shadow-soft',
        className
      )}>
        <div className="flex items-center justify-between px-4 py-3">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            {logo || (
              <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">P</span>
              </div>
            )}
            <span className="text-xl font-bold text-gray-900">Perundhu</span>
          </div>

          {/* Menu Toggle */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={cn(
              'p-2 rounded-xl transition-all duration-200',
              'hover:bg-gray-100 active:scale-95',
              'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2'
            )}
          >
            {isMenuOpen ? (
              <X className="w-6 h-6 text-gray-700" />
            ) : (
              <Menu className="w-6 h-6 text-gray-700" />
            )}
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/20 backdrop-blur-sm"
            onClick={() => setIsMenuOpen(false)}
          />
          
          {/* Menu Panel */}
          <div className={cn(
            'fixed top-16 left-4 right-4 max-w-sm mx-auto',
            'bg-white/95 backdrop-blur-lg rounded-2xl shadow-strong',
            'border border-gray-200',
            'animate-slide-down'
          )}>
            <nav className="p-4">
              <div className="space-y-2">
                {items.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentPath === item.href;
                  
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavigate(item.href)}
                      className={cn(
                        'w-full flex items-center gap-3 px-4 py-3 rounded-xl',
                        'transition-all duration-200 text-left',
                        'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1',
                        isActive
                          ? 'bg-primary-500 text-white shadow-medium'
                          : 'text-gray-700 hover:bg-gray-100 active:scale-95'
                      )}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                      {item.badge && (
                        <span className={cn(
                          'ml-auto px-2 py-1 text-xs font-semibold rounded-full',
                          isActive
                            ? 'bg-white/20 text-white'
                            : 'bg-primary-500 text-white'
                        )}>
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </nav>
          </div>
        </div>
      )}

      {/* Bottom Navigation (Alternative for Mobile) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40">
        <nav className={cn(
          'bg-white/95 backdrop-blur-lg border-t border-gray-200',
          'shadow-[0_-4px_20px_rgba(0,0,0,0.1)]'
        )}>
          <div className="grid grid-cols-4 gap-1 px-2 py-2">
            {items.slice(0, 4).map((item) => {
              const Icon = item.icon;
              const isActive = currentPath === item.href;
              
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigate(item.href)}
                  className={cn(
                    'flex flex-col items-center gap-1 px-2 py-3 rounded-xl',
                    'transition-all duration-200 relative',
                    'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1',
                    'active:scale-95',
                    isActive
                      ? 'text-primary-500'
                      : 'text-gray-500 hover:text-gray-700'
                  )}
                >
                  <div className="relative">
                    <Icon className="w-5 h-5" />
                    {item.badge && (
                      <span className="absolute -top-2 -right-2 w-4 h-4 bg-error-500 text-white text-xs font-semibold rounded-full flex items-center justify-center">
                        {item.badge > 9 ? '9+' : item.badge}
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-medium leading-none">
                    {item.label}
                  </span>
                  {isActive && (
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-primary-500 rounded-full" />
                  )}
                </button>
              );
            })}
          </div>
        </nav>
      </div>

      {/* Safe area for bottom navigation */}
      <div className="h-20 md:hidden" />
    </>
  );
};

export default MobileNavigation;