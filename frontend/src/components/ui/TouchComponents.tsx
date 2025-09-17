import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '../../utils/cn';

// Touch-optimized select component
interface TouchSelectProps {
  options: { value: string; label: string; icon?: React.ComponentType<any> }[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const TouchSelect: React.FC<TouchSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select an option',
  disabled = false,
  className,
  size = 'md'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [touchStartY, setTouchStartY] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-3 text-base',
    lg: 'px-5 py-4 text-lg',
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartY(e.touches[0].clientY);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEndY = e.changedTouches[0].clientY;
    const diff = touchStartY - touchEndY;

    // Close dropdown if user swipes up significantly
    if (diff > 50) {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          'w-full flex items-center justify-between',
          'bg-white border border-gray-200 rounded-xl',
          'transition-all duration-200 ease-out',
          'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'active:scale-[0.98]',
          sizeClasses[size],
          isOpen && 'ring-2 ring-primary-500 border-primary-500'
        )}
      >
        <div className="flex items-center gap-2">
          {selectedOption?.icon && (
            <selectedOption.icon className="w-4 h-4 text-gray-500" />
          )}
          <span className={cn(
            selectedOption ? 'text-gray-900' : 'text-gray-500'
          )}>
            {selectedOption?.label || placeholder}
          </span>
        </div>
        <ChevronDown className={cn(
          'w-4 h-4 text-gray-500 transition-transform duration-200',
          isOpen && 'rotate-180'
        )} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className={cn(
          'absolute top-full left-0 right-0 z-50 mt-1',
          'bg-white border border-gray-200 rounded-xl shadow-strong',
          'backdrop-blur-lg bg-white/95',
          'animate-slide-down',
          'max-h-60 overflow-y-auto'
        )}>
          <div
            className="py-2"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {options.map((option) => {
              const Icon = option.icon;
              const isSelected = option.value === value;
              
              return (
                <button
                  key={option.value}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3',
                    'text-left transition-colors duration-150',
                    'hover:bg-gray-50 active:bg-gray-100',
                    'focus:outline-none focus:bg-gray-50',
                    // Touch-friendly spacing
                    'min-h-[44px]',
                    isSelected && 'bg-primary-50 text-primary-700'
                  )}
                >
                  {Icon && <Icon className="w-4 h-4" />}
                  <span className="flex-1">{option.label}</span>
                  {isSelected && <Check className="w-4 h-4 text-primary-500" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// Touch-optimized tabs component
interface TouchTabsProps {
  tabs: { id: string; label: string; icon?: React.ComponentType<any>; badge?: number }[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
  variant?: 'default' | 'pills' | 'underline';
}

export const TouchTabs: React.FC<TouchTabsProps> = ({
  tabs,
  activeTab,
  onChange,
  className,
  variant = 'default'
}) => {
  const [indicatorStyle, setIndicatorStyle] = useState({});
  const tabsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (variant === 'underline' && tabsRef.current) {
      const activeElement = tabsRef.current.querySelector(`[data-tab="${activeTab}"]`) as HTMLElement;
      if (activeElement) {
        setIndicatorStyle({
          width: activeElement.offsetWidth,
          left: activeElement.offsetLeft,
        });
      }
    }
  }, [activeTab, variant]);

  const baseTabClasses = cn(
    'relative px-4 py-3 text-sm font-medium transition-all duration-200',
    'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1',
    'active:scale-95',
    // Touch-friendly minimum size
    'min-h-[44px] flex items-center justify-center gap-2'
  );

  const getTabClasses = (tabId: string) => {
    const isActive = tabId === activeTab;
    
    switch (variant) {
      case 'pills':
        return cn(
          baseTabClasses,
          'rounded-xl mx-1',
          isActive
            ? 'bg-primary-500 text-white shadow-medium'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
        );
      
      case 'underline':
        return cn(
          baseTabClasses,
          'border-b-2 border-transparent',
          isActive
            ? 'text-primary-600 border-primary-500'
            : 'text-gray-600 hover:text-gray-900 hover:border-gray-300'
        );
      
      default:
        return cn(
          baseTabClasses,
          'border border-gray-200',
          isActive
            ? 'bg-primary-50 text-primary-700 border-primary-200'
            : 'bg-white text-gray-600 hover:text-gray-900 hover:bg-gray-50'
        );
    }
  };

  return (
    <div className={cn('relative', className)}>
      <div
        ref={tabsRef}
        className={cn(
          'flex',
          variant === 'default' && 'bg-gray-100 p-1 rounded-xl',
          variant === 'pills' && 'bg-gray-100 p-1 rounded-xl',
          variant === 'underline' && 'border-b border-gray-200'
        )}
        role="tablist"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.id === activeTab;
          
          return (
            <button
              key={tab.id}
              data-tab={tab.id}
              onClick={() => onChange(tab.id)}
              className={cn(
                getTabClasses(tab.id),
                'flex-1' // Equal width for all tabs
              )}
              role="tab"
              aria-selected={isActive}
            >
              {Icon && <Icon className="w-4 h-4" />}
              <span className="truncate">{tab.label}</span>
              {tab.badge && (
                <span className={cn(
                  'ml-1 px-1.5 py-0.5 text-xs font-semibold rounded-full',
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-gray-200 text-gray-600'
                )}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
        
        {/* Animated indicator for underline variant */}
        {variant === 'underline' && (
          <div
            className="absolute bottom-0 h-0.5 bg-primary-500 transition-all duration-300 ease-out"
            style={indicatorStyle}
          />
        )}
      </div>
    </div>
  );
};

// Swipeable card component
interface SwipeableCardProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  className?: string;
  threshold?: number;
}

export const SwipeableCard: React.FC<SwipeableCardProps> = ({
  children,
  onSwipeLeft,
  onSwipeRight,
  className,
  threshold = 100
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [currentX, setCurrentX] = useState(0);
  const [translateX, setTranslateX] = useState(0);

  const cardRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setStartX(e.touches[0].clientX);
    setCurrentX(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    
    setCurrentX(e.touches[0].clientX);
    const deltaX = currentX - startX;
    setTranslateX(deltaX);
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    
    setIsDragging(false);
    const deltaX = currentX - startX;
    
    if (Math.abs(deltaX) > threshold) {
      if (deltaX > 0 && onSwipeRight) {
        onSwipeRight();
      } else if (deltaX < 0 && onSwipeLeft) {
        onSwipeLeft();
      }
    }
    
    // Reset position
    setTranslateX(0);
  };

  return (
    <div
      ref={cardRef}
      className={cn(
        'touch-pan-x select-none transition-transform duration-200',
        'will-change-transform',
        className
      )}
      style={{
        transform: `translateX(${translateX}px)`,
        transition: isDragging ? 'none' : 'transform 0.2s ease-out'
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {children}
      
      {/* Swipe indicators */}
      {isDragging && Math.abs(translateX) > 20 && (
        <>
          {translateX > 0 && onSwipeRight && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-green-500 opacity-70">
              <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                <span className="text-white text-sm">→</span>
              </div>
            </div>
          )}
          {translateX < 0 && onSwipeLeft && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-red-500 opacity-70">
              <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
                <span className="text-white text-sm">←</span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};